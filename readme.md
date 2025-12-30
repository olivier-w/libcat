# LibCat - Local Media Library Manager

A beautiful Windows desktop app for organizing and tagging your local movie collection.

![LibCat Screenshot](docs/screenshot.png)

## Features

- **Gallery View**: Browse your movie collection with beautiful thumbnail cards
- **Smart Tagging**: Create custom tags with colors to organize your movies
- **Quick Filters**: Filter by All, Untagged, Watched, or Favorites
- **Rating System**: Rate movies with a 5-star system
- **Search**: Quickly find movies by title, notes, or file path
- **Auto Thumbnails**: Automatically extracts thumbnails from video files using FFmpeg
- **Custom Posters**: Override auto-generated thumbnails with custom images
- **Notes & Metadata**: Add year, notes, and track watched status

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **SQLite** (better-sqlite3) - Local database
- **FFmpeg** (fluent-ffmpeg) - Thumbnail extraction
- **Zustand** - State management

## Getting Started

### Prerequisites

- Node.js 18+
- FFmpeg installed and in PATH (for thumbnail generation)

### Installation

```bash
# Install dependencies
npm install

# Start development mode
npm run electron:dev
```

### Building

```bash
# Build for Windows
npm run electron:build
```

The installer will be created in the `release` folder.

## Usage

1. **Add Movies**: Click "Add Folder" to scan a directory for video files, or drag & drop files directly
2. **Create Tags**: Use the sidebar to create tags with custom colors
3. **Tag Movies**: Select a movie and add tags from the details panel
4. **Filter**: Click on tags in the sidebar to filter your collection
5. **Find Untagged**: Use the "Untagged" filter to find movies that need categorizing

## Keyboard Shortcuts

- `Ctrl+F` - Focus search bar
- `Escape` - Clear search / Close dialogs
- `Double-click` on movie - Play in default video player

## Project Structure

```
libcat/
├── electron/               # Electron main process
│   ├── main.ts            # App entry, window creation, IPC
│   ├── preload.ts         # Secure bridge to renderer
│   └── services/          # Backend services
│       ├── database.ts    # SQLite operations
│       ├── scanner.ts     # File discovery
│       └── thumbnails.ts  # FFmpeg extraction
├── src/                   # React renderer
│   ├── components/        # UI components
│   ├── stores/            # Zustand state
│   ├── styles/            # Tailwind CSS
│   └── types/             # TypeScript types
└── package.json
```

## Todo
- [ ] Add duration to preview pane
- [ ] Make sidebars collapsable
- [ ] change window close buttons to generic, not macos
- [ ] make sure hover action in gallery view are clickable
- [ ] search tags
- [ ] multi-tag search
- [ ] edit tags (color, name)
- [ ] context menu on list and gallery view: edit, remove, play, open location, etc
- [ ] when holding shift, remove text-select on cards
- [ ] update ui when removing or adding tags
- [ ] add actor, director, series fields. ability to also filter by field + tags
- [ ] tmdb api connection, pull details
- [ ] ability to add a movie to "want to watch"
- [ ] ability to create new categories, and rename
- [ ] when bulk adding tags, better ux, type to narrow search, see all results, etc
- [ ] import/export library & tags
- [ ] add list view column: file creation date (not just date added to library)
- [ ] fuzzy search file names
- [ ] if pw protected, encrypt thumbnails, tags, filters, data
- [ ] add to favorites from detailspanel


## License

MIT

