---
name: Select All Keybind
overview: Add Ctrl+A / Cmd+A keyboard shortcut to select all movies in the currently filtered view, preventing default text selection behavior.
todos:
  - id: add-select-all-keybind
    content: Add Ctrl+A / Cmd+A keyboard listener in Gallery.tsx to select all sortedMovies
    status: completed
---

# Select All Movies Keybind

## Summary

Add a keyboard shortcut (Ctrl+A / Cmd+A) that selects all movies in the currently displayed/filtered view. The shortcut will work in both grid and list views and respect the active filter (All Movies, Favorites, Watched, Untagged, or any tag).

## Implementation

### Modify [src/components/Gallery.tsx](src/components/Gallery.tsx)

Add a `useEffect` that:

1. Listens for `keydown` events on `window`
2. Detects Ctrl+A or Cmd+A (for Mac)
3. Calls `e.preventDefault()` to stop default browser text selection
4. Skips the action when focus is in an input field (to allow normal text selection in search bars)
5. Calls `setSelectedMovies(sortedMovies)` to select all currently visible movies
```typescript
// Add to imports
import { useMemo, useState, useEffect } from 'react'

// Inside Gallery component, after sortedMovies is computed:
const { setSelectedMovies } = useLibraryStore()

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if user is typing in an input
    const activeEl = document.activeElement
    if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
      return
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      setSelectedMovies(sortedMovies)
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [sortedMovies, setSelectedMovies])
```


## Why This Works

- `sortedMovies` is derived from `filteredMovies` which already respects the `activeFilter` (all, untagged, watched, favorites, or tag ID) and `searchQuery`
- When user clicks "Favorites", `activeFilter` changes → `applyFilter()` updates `filteredMovies` → `sortedMovies` reflects only favorites
- Same logic applies to tag filters - clicking "Oscars" tag sets `activeFilter` to that tag's ID
- Both `VirtualizedGallery` (grid) and `ListView` receive the same `sortedMovies` prop, so selection is consistent

## Edge Cases Handled

- Input focus check prevents hijacking normal Ctrl+A in search/text fields
- Works regardless of which element has focus in the gallery
- Empty views result in empty selection (no crash)