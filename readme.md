# libcat - Local Media Library Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A beautiful desktop app for organizing and tagging your local movie collection.

> **Note**: This project has only been tested on Windows 10 so far.

## Features

- **Gallery View**: Browse your movie collection with beautiful thumbnail cards
- **List View**: View your collection in a detailed table format with sortable columns
- **Smart Tagging**: Create custom tags with colors to organize your movies
- **Quick Filters**: Filter by All, Untagged, Watched, or Favorites
- **Rating System**: Rate movies with a 5-star system
- **Search**: Quickly find movies by title, notes, file path, or tags
- **Auto Thumbnails**: Automatically extracts thumbnails from video files using FFmpeg
- **Custom Posters**: Override auto-generated thumbnails with custom images
- **TMDB Integration**: Fetch movie metadata, posters, and cast information from The Movie Database
- **Notes & Metadata**: Add year, notes, and track watched status
- **Multiple Profiles**: Create separate libraries with optional password protection

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

- **Bun** - [Download](https://bun.sh/) (or Node.js 18+ as fallback)
- **FFmpeg** - Required for thumbnail generation
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
  - Or install via Chocolatey: `choco install ffmpeg`
  - Or install via Scoop: `scoop install ffmpeg`
- **Windows Build Tools** (for native dependencies)
  - Run as Administrator: `bun install --global windows-build-tools`
  - Or install Visual Studio Build Tools with C++ workload

### Installation

```bash
# Clone the repository
git clone https://github.com/olivier-w/libcat.git
cd libcat

# Install dependencies
bun install

# Start development mode
bun run electron:dev
```

### Development Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start Vite dev server only |
| `bun run electron:dev` | Start full Electron app in dev mode |
| `bun run build` | Build the renderer (Vite) |
| `bun run electron:build` | Build production installer |

### Building for Production

```bash
# Build Windows installer
bun run electron:build
```

The installer will be created in the `release` folder as `libcat-{version}-Setup.exe`.

### Troubleshooting Build Issues

If you encounter errors with native modules (better-sqlite3):

```bash
# Rebuild native modules for Electron
bun run rebuild

# Or manually rebuild
bunx electron-rebuild
```

## Usage

1. **Add Movies**: Click "Add Folder" to scan a directory for video files, or drag & drop files directly
2. **Create Tags**: Use the sidebar to create tags with custom colors
3. **Tag Movies**: Select a movie and add tags from the details panel
4. **Filter**: Click on tags in the sidebar to filter your collection
5. **Find Untagged**: Use the "Untagged" filter to find movies that need categorizing
6. **TMDB Integration**: Add your TMDB API key in Settings to auto-fetch movie metadata

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
│       ├── profiles.ts    # Profile management
│       ├── scanner.ts     # File discovery
│       ├── thumbnails.ts  # FFmpeg extraction
│       └── tmdb.ts        # TMDB API integration
├── src/                   # React renderer
│   ├── components/        # UI components
│   ├── stores/            # Zustand state
│   ├── styles/            # Tailwind CSS
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── build/                 # App icons and resources
└── package.json
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run the app to test: `bun run electron:dev`
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

## Roadmap

- [x] Add duration display to preview pane
- [x] Collapsible sidebars
- [x] Context menus for movies (edit, remove, play, open location)
- [ ] Import/export library & tags
- [x] Fuzzy search for file names
- [ ] Encrypted storage for password-protected profiles

## FAQs

### How do I regenerate thumbnails?

Delete the thumbnails folder in your profile directory, then run the following in the DevTools console (Ctrl+Shift+I):

```javascript
// Get all movies and regenerate their thumbnails
const movies = await window.api.getMovies()
for (const movie of movies) {
  if (movie.file_path) {
    await window.api.regenerateThumbnail(movie.id, movie.file_path)
    console.log(`Regenerated thumbnail for: ${movie.title}`)
  }
}
```

### Where is my data stored?

Your data is stored in your user data directory:
- Windows: `%APPDATA%/libcat/`

Each profile has its own folder containing `libcat.db` (database) and `thumbnails/` folder.

### How do I get a TMDB API key?

1. Create an account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to Settings > API
3. Request an API key (choose "Developer" for personal use)
4. Copy your API key and paste it in libcat Settings

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Disclaimer**: This software is provided "as is", without warranty of any kind. See the LICENSE file for full terms.