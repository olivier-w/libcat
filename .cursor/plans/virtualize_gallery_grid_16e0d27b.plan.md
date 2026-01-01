---
name: Virtualize Gallery Grid
overview: Virtualize the Gallery grid view using react-window's FixedSizeGrid to render only visible MovieCards (~20-40 instead of 5000+), while preserving the full UX for smaller collections under 200 movies.
todos:
  - id: create-virtualized-gallery
    content: Create VirtualizedGallery.tsx with FixedSizeGrid and dynamic column calc
    status: completed
  - id: integrate-gallery
    content: Update Gallery.tsx to conditionally use virtualized vs regular grid
    status: completed
    dependencies:
      - create-virtualized-gallery
---

# Virtualize Gallery Grid for Large Collections

## Root Cause

The Gallery renders all 5000 MovieCard DOM nodes at once. While `useVisibleItems` defers image loading, the actual DOM elements are all created upfront, causing scroll jank.

## Solution

Use `react-window`'s `FixedSizeGrid` (already installed) to virtualize the grid, but **only when count exceeds 1000 movies** to preserve the existing smooth animation UX for smaller libraries.

---

## Key Implementation Details

### 1. Create VirtualizedGallery Component

New file: [`src/components/VirtualizedGallery.tsx`](src/components/VirtualizedGallery.tsx)

- Use `FixedSizeGrid` from react-window
- Calculate column count dynamically based on container width (matching `minmax(180px, 1fr)`)
- Use `ResizeObserver` to recalculate columns on window resize
- Render a memoized `Cell` component that wraps `MovieCard`
```typescript
// Pseudo-implementation
const ITEM_WIDTH = 200  // ~180px + gap
const ITEM_HEIGHT = 300 // aspect-ratio 2:3 + padding

function VirtualizedGallery({ movies }) {
  const [containerWidth, setContainerWidth] = useState(0)
  const columnCount = Math.max(1, Math.floor(containerWidth / ITEM_WIDTH))
  const rowCount = Math.ceil(movies.length / columnCount)
  
  return (
    <FixedSizeGrid
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={containerWidth / columnCount}
      rowHeight={ITEM_HEIGHT}
    >
      {Cell}
    </FixedSizeGrid>
  )
}
```


### 2. Modify Gallery.tsx to Switch Between Modes

In [`src/components/Gallery.tsx`](src/components/Gallery.tsx):

```typescript
const VIRTUALIZATION_THRESHOLD = 1000

// Inside render:
{filteredMovies.length > VIRTUALIZATION_THRESHOLD ? (
  <VirtualizedGallery movies={filteredMovies} />
) : (
  // Existing non-virtualized grid with animations
  <div className="grid ...">
    {filteredMovies.map(...)}
  </div>
)}
```

### 3. Remove IntersectionObserver for Virtualized Mode

The `useVisibleItems` hook is no longer needed when virtualized since react-window only renders visible cells. The hook will still be used for the non-virtualized path (under 1000 movies).

---

## Expected Impact

| Metric | Before | After |

|--------|--------|-------|

| DOM nodes (5000 movies) | ~5000 MovieCards | ~30-50 visible cells |

| Scroll performance | Janky/laggy | Smooth 60fps |

| Small collections (under 200) | Unchanged | Unchanged |

---

## Files to Modify

1. **Create** [`src/components/VirtualizedGallery.tsx`](src/components/VirtualizedGallery.tsx) - New virtualized grid component
2. **Edit** [`src/components/Gallery.tsx`](src/components/Gallery.tsx) - Add conditional rendering based on movie count