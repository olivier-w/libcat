---
name: Sidebar Visual Polish
overview: Fix visual inconsistencies in the collapsed and expanded sidebar states to create a polished, award-winning sidebar experience with proper alignment, spacing, and animations.
todos:
  - id: adaptive-padding
    content: Implement conditional padding system for collapsed/expanded states
    status: completed
  - id: header-centering
    content: Restructure Library and Tags headers to center buttons when collapsed
    status: completed
  - id: nav-items
    content: Fix filter navigation items to center icons when collapsed
    status: completed
  - id: tags-list
    content: Center tag color dots and adjust tag items for collapsed state
    status: completed
  - id: divider-polish
    content: Animate divider width based on collapse state
    status: completed
  - id: settings-consistency
    content: Ensure settings button matches other items' styling patterns
    status: completed
---

# Sidebar Visual Excellence Overhaul

## Problems Identified

The current collapsed sidebar (64px width) has several visual inconsistencies:

1. **Header misalignment** - Section headers ("Library", "Tags") use `justify-between` which pushes the "+" buttons to the right when text disappears, instead of centering them
2. **Excessive padding** - `p-4` (32px total) is too much for 64px collapsed width, leaving only 32px for content
3. **Filter/tag items not centered** - Items use `gap-3` and `px-3` which don't adapt, causing icons to appear left-aligned instead of centered
4. **Divider shrinks awkwardly** - Still uses `px-4` padding when collapsed
5. **Inconsistent hover states** - Settings button centers properly but other sections don't follow the same pattern
6. **Active state bar clipping** - The left accent bar on active items may look cramped in collapsed state

## Solution

Refactor [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx) with responsive spacing and layout that adapts elegantly to both states.

### Key Changes

**1. Adaptive Padding System**

- Replace fixed `p-4` with conditional padding: `p-4` expanded, `p-2` collapsed
- Ensure icons remain centered in the reduced width

**2. Header Sections Restructure**

- Change from `justify-between` to `justify-center` when collapsed
- Animate the layout transition smoothly

**3. Navigation Items**

- Use conditional `justify-center` when collapsed
- Remove `gap-3` spacing when icons are alone
- Ensure consistent 44px touch targets for accessibility

**4. Tags Section**

- Center tag color dots when collapsed
- Show only the colored dot (no text/count) in collapsed state
- Maintain proper alignment on hover

**5. Divider Enhancement**

- Animate width/padding based on collapse state
- Add subtle glow effect for visual polish

**6. Tooltip Integration**

- Add native browser tooltips (already partially implemented via `title` prop)
- Ensure all collapsed items have descriptive tooltips

**7. Collapse Toggle Refinement**

- Slightly larger hit area for easier interaction
- Subtle pulse animation on first render to hint at functionality

### Visual Consistency Rules

All interactive elements in collapsed state will:

- Be horizontally centered within the 64px width
- Have 44px minimum height for touch accessibility  
- Show tooltip on hover
- Maintain the same hover/active color transitions as expanded state