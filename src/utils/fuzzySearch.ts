import { Tag } from '../types'

export interface FuzzyMatchResult<T> {
  item: T
  score: number
}

/**
 * Calculates a fuzzy match score for a string against a query.
 * Higher scores indicate better matches.
 * 
 * Scoring:
 * - Exact match (case-insensitive): 1000
 * - Starts with query: 500 + (length similarity * 100)
 * - Contains query: 200 + (position bonus)
 * - Fuzzy character matching: 0-100 based on character order and proximity
 */
function calculateFuzzyScore(text: string, query: string): number {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Exact match (case-insensitive)
  if (lowerText === lowerQuery) {
    return 1000
  }

  // Starts with query
  if (lowerText.startsWith(lowerQuery)) {
    const lengthRatio = query.length / text.length
    return 500 + Math.floor(lengthRatio * 100)
  }

  // Contains query as substring
  const containsIndex = lowerText.indexOf(lowerQuery)
  if (containsIndex !== -1) {
    // Earlier position = higher score
    const positionBonus = (text.length - containsIndex) / text.length * 50
    return 200 + positionBonus
  }

  // Fuzzy character matching
  // Check if all query characters appear in order in the text
  let queryIndex = 0
  let lastMatchIndex = -1
  let consecutiveMatches = 0
  let maxConsecutive = 0

  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      if (lastMatchIndex === -1 || i === lastMatchIndex + 1) {
        consecutiveMatches++
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches)
      } else {
        consecutiveMatches = 1
      }
      lastMatchIndex = i
      queryIndex++
    } else {
      consecutiveMatches = 0
    }
  }

  // If all query characters were found in order
  if (queryIndex === lowerQuery.length) {
    // Score based on how close together the matches are and how many are consecutive
    const spread = lastMatchIndex - (lastMatchIndex - queryIndex + 1)
    const spreadPenalty = Math.max(0, spread - query.length) * 2
    const consecutiveBonus = maxConsecutive * 10
    
    return Math.max(0, 100 - spreadPenalty + consecutiveBonus)
  }

  // No match
  return 0
}

/**
 * Filters and sorts tags using fuzzy search.
 * Returns tags sorted by relevance score (highest first), then by creation date (newest first).
 */
export function fuzzySearchTags(tags: Tag[], query: string): Tag[] {
  if (!query.trim()) {
    // No query - return tags sorted by creation date (newest first)
    return [...tags].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateB - dateA
    })
  }

  // Calculate scores for all tags
  const results: FuzzyMatchResult<Tag>[] = tags.map(tag => ({
    item: tag,
    score: calculateFuzzyScore(tag.name, query)
  }))

  // Filter out non-matches (score > 0)
  const matches = results.filter(r => r.score > 0)

  // Sort by score (highest first), then by creation date (newest first)
  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    const dateA = new Date(a.item.created_at).getTime()
    const dateB = new Date(b.item.created_at).getTime()
    return dateB - dateA
  })

  return matches.map(r => r.item)
}

