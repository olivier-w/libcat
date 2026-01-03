---
name: Multi-tag Partial Search
overview: Modify the tag matching logic in `applyFilter` to use partial/contains matching instead of exact matching, so searching "oscar" will match tags like "oscars".
todos:
  - id: fix-tag-matching
    content: Change tag matching from exact to partial/contains in applyFilter
    status: completed
---

# Fix Multi-tag Search with Partial Matching

## Problem

The current search implementation in [`libraryStore.ts`](src/stores/libraryStore.ts) requires exact tag name matching. Searching "oscar" won't match a tag named "oscars".

## Solution

Modify the tag matching logic in the `applyFilter` function to use **partial/contains matching** instead of exact matching.

### Change Required

In `applyFilter` (line 257), change from:

```typescript
const matchingTag = tags.find(t => t.name.toLowerCase() === term)
```

To:

```typescript
const matchingTag = tags.find(t => t.name.toLowerCase().includes(term))
```

This single-line change will make:

- "oscar" match "oscars", "Oscar Winners", "Best Oscar", etc.
- "oscars funny" find movies that have both a tag containing "oscars" AND a tag containing "funny"

### Special Characters (dashes, digits)

The `.includes()` method handles dashes and digits naturally:

- "sci" matches "sci-fi"
- "4k" matches "4k" or "4k-collection"  
- "2024" matches "best-of-2024"
- "sci-fi" matches "sci-fi" exactly
- "best-of" matches "best-of-2024"