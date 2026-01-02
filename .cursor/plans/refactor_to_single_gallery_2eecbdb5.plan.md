---
name: Refactor to Single Gallery
overview: Refactor the dual-gallery system to use only the virtualized gallery implementation, removing dead code and simplifying the architecture. This eliminates the thumbnail loading bug and streamlines the codebase.
todos:
  - id: refactor-gallery
    content: Refactor Gallery.tsx to remove dual-gallery logic and always use virtualized grid
    status: completed
  - id: delete-moviecard
    content: Delete MovieCard.tsx (unused after refactor)
    status: completed
    dependencies:
      - refactor-gallery
  - id: delete-usevisibleitems
    content: Delete useVisibleItems.ts hook (unused after refactor)
    status: completed
    dependencies:
      - refactor-gallery
  - id: update-exports
    content: Update index.ts to remove deleted component exports
    status: completed
    dependencies:
      - delete-moviecard
---

# Refactor to Single Virtualized Gallery

## Overview

Remove the dual-gallery system (virtualized vs non-virtualized) and make the virtualized implementation the default and only gallery. This fixes the thumbnail loading bug and simplifies the codebase.

## Files to Modify

### 1. Refactor [src/components/Gallery.tsx](src/components/Gallery.tsx)

- Remove `VIRTUALIZATION_THRESHOLD` constant
- Remove `useVisibleItems` import and usage
- Remove `MovieCard` import
- Remove the conditional rendering logic
- Remove `scrollContainerRef` and `createObserveCallback`
- Inline the `VirtualizedGallery` rendering directly (or keep it as a separate component for clarity)

Key removals from current file:

```typescript
// REMOVE these imports
import { MovieCard } from './MovieCard'
import { useVisibleItems } from '../hooks/useVisibleItems'

// REMOVE this constant
const VIRTUALIZATION_THRESHOLD = 1000

// REMOVE these lines
const scrollContainerRef = useRef<HTMLDivElement>(null)
const useVirtualization = sortedMovies.length > VIRTUALIZATION_THRESHOLD
const { observe, isVisible } = useVisibleItems(...)
const createObserveCallback = useCallback(...)

// REMOVE the conditional in the render - always use VirtualizedGallery
```

### 2. Delete Unused Files

- Delete [src/components/MovieCard.tsx](src/components/MovieCard.tsx) - only used by non-virtualized grid
- Delete [src/hooks/useVisibleItems.ts](src/hooks/useVisibleItems.ts) - only used by non-virtualized grid

### 3. Update [src/components/index.ts](src/components/index.ts)

Remove exports for deleted components:

```typescript
// REMOVE these lines
export { VirtualizedGallery } from './VirtualizedGallery'
export { MovieCard } from './MovieCard'
```

## Result

After refactoring:

- Single consistent gallery implementation using `react-window` virtualization
- Thumbnails load correctly via native `loading="lazy"`
- ~200 lines of dead code removed
- Simpler mental model for future development