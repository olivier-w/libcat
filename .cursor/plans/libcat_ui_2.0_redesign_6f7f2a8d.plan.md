---
name: LibCat UI 2.0 Redesign
overview: A comprehensive UI/UX overhaul transforming LibCat into an award-winning media library application with a distinctive cinematic aesthetic, thoughtful micro-interactions, and enhanced usability while preserving all performance optimizations.
todos:
  - id: foundation-colors
    content: Update color palette in tailwind.config.js with new Cinematic Bronze system
    status: completed
  - id: foundation-typography
    content: Add new font families and type scale to tailwind/CSS
    status: completed
  - id: foundation-base
    content: Update index.css with new backgrounds, utilities, and scrollbars
    status: completed
  - id: component-titlebar
    content: Redesign TitleBar with transparency and new controls
    status: completed
  - id: component-sidebar
    content: Redesign Sidebar with collapsible mode and new filter styles
    status: completed
  - id: component-gallery
    content: Redesign Gallery header and movie card visuals
    status: completed
  - id: component-details
    content: Redesign Details Panel with Ken Burns, better sections
    status: completed
  - id: component-listview
    content: Redesign ListView with thumbnail column and hover states
    status: completed
  - id: component-profile
    content: Redesign Profile Selector with cinematic backdrop
    status: completed
  - id: modals-polish
    content: Update all modals with new design language
    status: completed
  - id: toast-enhance
    content: Add progress bar and enhanced animations to toasts
    status: completed
  - id: micro-interactions
    content: Implement hover, press, and focus micro-interactions
    status: completed
  - id: drag-drop-feedback
    content: Add visual drag-drop overlay with animated feedback
    status: completed
  - id: final-polish
    content: Final animation timing adjustments and visual polish
    status: completed
---

# LibCat 2.0 Interface Redesign

## Design Philosophy

Inspired by premium streaming platforms (Apple TV+, Criterion Channel) and modern design tools (Linear, Raycast), this redesign embraces a **"Cinematic Warmth"** aesthetic - dark, immersive backgrounds that let movie art shine, paired with warm copper/bronze accents that feel premium without being generic.

## 1. Color System Overhaul

### New Palette: Cinematic Bronze

Replace the current amber-centric palette with a more sophisticated warm metallic system:

**Base colors (in [tailwind.config.js](tailwind.config.js)):**

- **Obsidian** (backgrounds): Deep blacks with warm undertones (`#0D0C0F`, `#161519`, `#1E1D22`)
- **Smoke** (text/borders): Warm grays (`#2D2B32`, `#4A4752`, `#8B8693`, `#C4C0CC`)
- **Bronze** (primary accent): Rich copper tones (`#C47F5A`, `#D9956E`, `#E8A882`)
- **Pearl** (text): Warm whites (`#F5F2F0`, `#E8E4E1`, `#DBD6D2`)
- **Cinnabar** (danger/favorites): Muted terracotta (`#C15650`, `#D46B64`)
- **Sage** (success/watched): Dusty green (`#6B8F71`, `#8BAA8F`)

### Background Treatment

Replace flat backgrounds with subtle atmospheric gradients in [index.css](src/styles/index.css):

- Radial vignette effect centered on the gallery area
- Subtle noise texture overlay (1-2% opacity) for visual depth
- Dark gradient edges that frame the content like a theater

## 2. Typography System

Update [tailwind.config.js](tailwind.config.js) and [index.css](src/styles/index.css):

**Font Stack:**

- **Display/Headings**: "Cabinet Grotesk" or "Satoshi" - geometric, distinctive
- **Body**: "Plus Jakarta Sans" - excellent readability, modern feel
- **Monospace**: "JetBrains Mono" for durations/file sizes

**Type Scale:**

- Larger, bolder movie titles with tighter letter-spacing
- Reduced text sizes for metadata (less visual noise)
- Better optical sizing for small labels

## 3. Component Redesigns

### 3.1 Profile Selector ([ProfileSelector.tsx](src/components/ProfileSelector.tsx))

**Visual Changes:**

- Full-screen cinematic backdrop with subtle animated particles
- Profile avatars as larger glass-morphic cards with gradient borders
- Animated "glow" effect on hover using CSS radial gradients
- Staggered entrance animation with scale + blur

**Micro-interactions:**

- Avatar "breathes" subtly on hover (gentle scale pulse)
- Password lock icon animates when clicking protected profile
- Create profile card has animated dashed border

### 3.2 Title Bar ([TitleBar.tsx](src/components/TitleBar.tsx))

**Visual Changes:**

- More transparent, truly blurs into content
- Profile badge redesigned as a pill with avatar initial
- Window controls as translucent circles (macOS-style on all platforms)
- Subtle border-bottom glow effect

**Micro-interactions:**

- Lock button icon animates (padlock closes) on hover
- Smooth color transition on window control hover

### 3.3 Sidebar ([Sidebar.tsx](src/components/Sidebar.tsx))

**Visual Changes:**

- Collapsible sidebar with icon-only mode (toggle button)
- Filter items get left accent bar when active (instead of background change)
- Tag dots become larger, with subtle inner shadow for depth
- Floating search bar with backdrop blur
- Section headers with subtle underline decoration

**Micro-interactions:**

- Sidebar collapse/expand with spring animation
- Filter count badges pulse briefly when count changes
- Tag items reveal delete button with slide animation (not fade)
- Add button rotates 45deg to become X when form is open

### 3.4 Gallery View ([Gallery.tsx](src/components/Gallery.tsx), [VirtualizedGallery.tsx](src/components/VirtualizedGallery.tsx))

**Visual Changes:**

- Movie cards with subtle rounded corners and 1px border (glass effect)
- Poster reflection effect (subtle mirror below card)
- Watched indicator as elegant checkmark badge, not circle
- Hover state: card "lifts" with shadow spread, title reveals smoothly
- Empty state with animated illustration

**Micro-interactions:**

- Staggered fade-in when gallery first loads or filter changes
- Card press state (scale down slightly on mousedown)
- Play button pulses gently on hover
- Favorite heart has spring "pop" animation when toggling
- Selection border animates in (stroke-dasharray reveal)

### 3.5 List View ([ListView.tsx](src/components/ListView.tsx))

**Visual Changes:**

- Zebra striping with very subtle alternating backgrounds
- Hover row gets left accent border that slides in
- Column headers with sort indicator pill badges
- Thumbnail preview column (small poster visible in list)

**Micro-interactions:**

- Sort column change triggers subtle row reorder animation
- Row hover reveals action buttons with fade
- Duration column has mini progress bar if partially watched (future feature hook)

### 3.6 Details Panel ([DetailsPanel.tsx](src/components/DetailsPanel.tsx))

**Visual Changes:**

- Poster area with Ken Burns effect on hover (subtle zoom/pan)
- TMDB badge redesigned as floating chip with icon
- Rating stars redesigned as bronze/pearl with glow when filled
- Genre tags as elegant pills with border (not filled background)
- Action buttons as icon-first design with text on hover/focus
- Scrollable content with gradient fade at top/bottom edges

**Micro-interactions:**

- Panel slides in from right with content staggered (poster first, then details)
- Edit mode has smooth height transitions for form fields
- Tag addition animates tag "flying" into position
- Play button has pulsing ring animation
- TMDB rating counter animates counting up on load

### 3.7 Toasts ([Toast.tsx](src/components/Toast.tsx))

**Visual Changes:**

- Toast slides in from top with elastic bounce
- Progress bar at bottom shows auto-dismiss countdown
- Icon area has subtle circular background

**Micro-interactions:**

- Success toast has confetti micro-animation
- Error toast has subtle shake on appear
- Close button rotates slightly on hover

### 3.8 Modals (All modal components)

**Visual Changes:**

- Backdrop with stronger blur effect
- Modal cards with border glow effect
- Input fields with floating labels
- Buttons with gradient backgrounds (subtle)

**Micro-interactions:**

- Modal entrance: backdrop fades, then card scales up with elastic spring
- Form fields focus state animates border width
- Loading states use skeleton animations instead of spinners

## 4. New Visual Features

### 4.1 Gallery Ambience Mode

When a movie is selected, subtly tint the gallery background with the dominant color from the selected poster (extracted via canvas). Creates immersive browsing feel.

### 4.2 Smooth View Transitions

When switching between Grid/List view, animate cards morphing (if same movie visible in both views).

### 4.3 Drag & Drop Visual Feedback

When dragging files over the window:

- Overlay appears with animated drop zone
- Pulsing border around valid drop area
- File count indicator follows cursor

### 4.4 Keyboard Navigation Indicators

Show subtle focus rings when navigating with keyboard. Visual indicator for "J/K" navigation in list view.

## 5. Animation System Updates

Update [tailwind.config.js](tailwind.config.js) and [index.css](src/styles/index.css) with new animation utilities:

- `animate-glow`: Subtle pulsing glow effect
- `animate-float`: Gentle floating motion
- `animate-shimmer`: Loading skeleton shimmer
- `animate-count`: Number counting animation
- Improved easing curves using spring physics

## 6. Performance Considerations

All changes preserve existing optimizations:

- Virtualization in Gallery/ListView unchanged
- New animations use CSS transforms/opacity only (GPU-accelerated)
- Color extraction done lazily with `requestIdleCallback`
- Particle effects limited to Profile Selector (not always running)
- Staggered animations batch DOM reads

## 7. Implementation Order

Phase 1 - Foundation:

1. Update color system and typography in config files
2. Update base styles and CSS utilities
3. Refactor component classes to use new design tokens

Phase 2 - Core Components:

4. Redesign TitleBar and Sidebar
5. Redesign Gallery cards and VirtualizedGallery
6. Redesign Details Panel
7. Redesign ListView

Phase 3 - Polish:

8. Redesign Profile Selector
9. Update all modals (Settings, Scan, TMDB Search, Delete)
10. Enhance Toast notifications
11. Add ambience mode and view transitions

Phase 4 - Micro-interactions:

12. Implement hover/press states across all components
13. Add entrance animations with stagger
14. Implement drag-drop visual feedback
15. Final polish and testing

---

## Key Files to Modify

| File | Changes |
|------|---------|
| [tailwind.config.js](tailwind.config.js) | New colors, fonts, animations |
| [src/styles/index.css](src/styles/index.css) | New utilities, backgrounds, scrollbars |
| [src/App.tsx](src/App.tsx) | Drag-drop overlay, ambience state |
| [src/components/TitleBar.tsx](src/components/TitleBar.tsx) | Full visual redesign |
| [src/components/Sidebar.tsx](src/components/Sidebar.tsx) | Collapsible + visual redesign |
| [src/components/Gallery.tsx](src/components/Gallery.tsx) | Header redesign, view transitions |
| [src/components/VirtualizedGallery.tsx](src/components/VirtualizedGallery.tsx) | Card redesign, animations |
| [src/components/ListView.tsx](src/components/ListView.tsx) | Row redesign, thumbnail column |
| [src/components/DetailsPanel.tsx](src/components/DetailsPanel.tsx) | Major visual overhaul |
| [src/components/ProfileSelector.tsx](src/components/ProfileSelector.tsx) | Cinematic redesign |
| [src/components/Toast.tsx](src/components/Toast.tsx) | New animation, progress bar |
| [src/components/SettingsModal.tsx](src/components/SettingsModal.tsx) | Modal redesign |
| [src/components/StarRating.tsx](src/components/StarRating.tsx) | New star design |
| [src/components/SearchBar.tsx](src/components/SearchBar.tsx) | Floating style |
| [index.html](index.html) | Add Google Fonts imports |