import https from 'https'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const TMDB_API_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

export interface TMDBSearchResult {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  popularity: number
}

export interface TMDBMovieDetails {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  runtime: number | null
  genres: { id: number; name: string }[]
  credits?: {
    cast: { id: number; name: string; character: string; order: number }[]
    crew: { id: number; name: string; job: string; department: string }[]
  }
}

export interface TMDBMovieData {
  tmdb_id: number
  tmdb_poster_path: string | null
  tmdb_rating: number
  tmdb_overview: string
  tmdb_director: string | null
  tmdb_cast: string
  tmdb_release_date: string | null
  tmdb_genres: string
  year: number | null
  title: string
}

export class TMDBService {
  private apiKey: string
  private postersDir: string

  constructor(apiKey: string, userDataPath: string) {
    this.apiKey = apiKey
    this.postersDir = path.join(userDataPath, 'posters')
    if (!fs.existsSync(this.postersDir)) {
      fs.mkdirSync(this.postersDir, { recursive: true })
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const url = `${TMDB_API_BASE}/configuration?api_key=${this.apiKey}`
      await this.fetchJSON(url)
      return true
    } catch {
      return false
    }
  }

  async searchMovies(query: string, year?: number): Promise<TMDBSearchResult[]> {
    let url = `${TMDB_API_BASE}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`
    if (year) url += `&year=${year}`
    const response = await this.fetchJSON(url) as { results: TMDBSearchResult[] }
    return response.results || []
  }

  async getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
    const url = `${TMDB_API_BASE}/movie/${tmdbId}?api_key=${this.apiKey}&append_to_response=credits`
    return await this.fetchJSON(url) as TMDBMovieDetails
  }

  async downloadPoster(posterPath: string, movieId: number): Promise<string | null> {
    if (!posterPath) return null
    const imageUrl = `${TMDB_IMAGE_BASE}${posterPath}`
    const hash = crypto.createHash('md5').update(`${movieId}-${posterPath}`).digest('hex')
    const localPath = path.join(this.postersDir, `${hash}.jpg`)
    if (fs.existsSync(localPath)) return localPath

    return new Promise((resolve) => {
      const downloadFile = (url: string, redirectCount = 0) => {
        if (redirectCount > 5) { resolve(null); return }
        https.get(url, (response) => {
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            downloadFile(response.headers.location, redirectCount + 1)
            return
          }
          if (response.statusCode !== 200) { resolve(null); return }
          const file = fs.createWriteStream(localPath)
          response.pipe(file)
          file.on('finish', () => { file.close(); resolve(localPath) })
          file.on('error', () => { file.close(); if (fs.existsSync(localPath)) fs.unlinkSync(localPath); resolve(null) })
        }).on('error', () => { if (fs.existsSync(localPath)) fs.unlinkSync(localPath); resolve(null) })
      }
      downloadFile(imageUrl)
    })
  }

  async matchMovie(title: string, year?: number): Promise<TMDBSearchResult | null> {
    const cleanTitle = this.cleanTitle(title)
    if (year) {
      const resultsWithYear = await this.searchMovies(cleanTitle, year)
      if (resultsWithYear.length > 0) return resultsWithYear.sort((a, b) => b.popularity - a.popularity)[0]
    }
    const results = await this.searchMovies(cleanTitle)
    if (results.length > 0) return results.sort((a, b) => b.popularity - a.popularity)[0]
    return null
  }

  async fetchMovieData(tmdbId: number, movieId: number): Promise<TMDBMovieData> {
    const details = await this.getMovieDetails(tmdbId)
    const localPosterPath = details.poster_path ? await this.downloadPoster(details.poster_path, movieId) : null
    const director = details.credits?.crew.find(c => c.job === 'Director')?.name || null
    const cast = details.credits?.cast.slice(0, 10).map(c => ({ name: c.name, character: c.character })) || []
    const year = details.release_date ? parseInt(details.release_date.split('-')[0]) : null
    const genres = details.genres.map(g => g.name)

    return {
      tmdb_id: tmdbId,
      tmdb_poster_path: localPosterPath,
      tmdb_rating: details.vote_average,
      tmdb_overview: details.overview,
      tmdb_director: director,
      tmdb_cast: JSON.stringify(cast),
      tmdb_release_date: details.release_date,
      tmdb_genres: JSON.stringify(genres),
      year,
      title: details.title
    }
  }

  parseFilename(filename: string): { title: string; year: number | null } {
    let name = path.basename(filename, path.extname(filename))
    
    // First, normalize separators to spaces
    name = name.replace(/[._-]/g, ' ')
    
    // Quality/release indicators that often follow the year
    const qualityIndicators = /\b(720p|1080p|2160p|4k|uhd|hdr10|hdr|bluray|blu ray|bdrip|brrip|webrip|web dl|web|dvdrip|hdtv|x264|x265|hevc|aac|ac3|dts|remastered|extended|unrated|directors cut|proper|repack|internal)\b/gi
    
    // Find year - it's typically a 4-digit number (1900-2099) that appears before quality indicators
    let year: number | null = null
    
    // Pattern: year followed by quality indicator or end of useful content
    const yearMatch = name.match(/\b(19\d{2}|20\d{2})\b/g)
    if (yearMatch) {
      // Take the last valid year found before quality indicators
      for (const potentialYear of yearMatch) {
        const yearNum = parseInt(potentialYear)
        if (yearNum >= 1900 && yearNum <= new Date().getFullYear() + 1) {
          // Check if this year appears before quality indicators
          const yearIndex = name.indexOf(potentialYear)
          const qualityMatch = name.match(qualityIndicators)
          if (qualityMatch) {
            const qualityIndex = name.toLowerCase().indexOf(qualityMatch[0].toLowerCase())
            if (yearIndex < qualityIndex) {
              year = yearNum
              // Truncate everything from the year onwards
              name = name.substring(0, yearIndex)
              break
            }
          } else {
            // No quality indicators, just use the year
            year = yearNum
            name = name.substring(0, yearIndex)
            break
          }
        }
      }
    }
    
    // Clean up the title
    const title = name
      .replace(/\[.*?\]/g, '')       // Remove bracketed content
      .replace(/\(.*?\)/g, '')       // Remove parenthetical content
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .trim()
    
    return { title, year }
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/[._-]/g, ' ')
      .replace(/\b(720p|1080p|2160p|4k|uhd|hdr|bluray|blu-ray|bdrip|brrip|webrip|web-dl|dvdrip|hdtv|x264|x265|hevc|aac|ac3|dts|remastered)\b/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private fetchJSON(url: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) { reject(new Error(`HTTP ${response.statusCode}`)); return }
        let data = ''
        response.on('data', (chunk) => { data += chunk })
        response.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error('Failed to parse JSON')) } })
      }).on('error', reject)
    })
  }

  static getTmdbUrl(tmdbId: number): string {
    return `https://www.themoviedb.org/movie/${tmdbId}`
  }
}
