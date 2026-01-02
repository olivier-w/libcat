---
name: Fix poster aspect ratio
overview: Modify VirtualizedGallery to calculate row height dynamically based on column width, maintaining the standard 2:3 movie poster aspect ratio so posters display without cropping.
todos:
  - id: fix-aspect-ratio
    content: Update VirtualizedGallery.tsx to calculate dynamic row height for 2:3 poster aspect ratio
    status: completed
---

# Fix Gallery Poster Aspect Ratio

## Problem

In [`src/components/VirtualizedGallery.tsx`](src/components/VirtualizedGallery.tsx), the grid uses a fixed `ITEM_HEIGHT = 300` while `columnWidth` is calculated dynamically. This breaks the 2:3 poster aspect ratio when columns expand to fill space, causing posters to be cropped by `object-fit: cover`.

## Solution

Calculate `rowHeight` dynamically based on `columnWidth` to maintain proper 2:3 aspect ratio:

```typescript
// Current (broken):
const ITEM_HEIGHT = 300  // fixed

// Fixed:
const POSTER_ASPECT_RATIO = 1.5  // 2:3 (height = width * 1.5)
const cardWidth = columnWidth - ITEM_GAP
const cardHeight = cardWidth * POSTER_ASPECT_RATIO
const rowHeight = cardHeight + ITEM_GAP
```

## Changes

1. Remove the fixed `ITEM_HEIGHT` constant
2. Calculate `rowHeight` dynamically in the component body
3. Pass `cardHeight` to cells via `cellProps` for inner styling
4. Update the Grid's `rowHeight` prop to use the calculated value

This ensures posters always display at correct proportions regardless of window size.