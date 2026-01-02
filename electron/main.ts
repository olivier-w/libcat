import { app, BrowserWindow, ipcMain, dialog, shell, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import { DatabaseService } from './services/database'
import { FileScanner } from './services/scanner'
import { ThumbnailService } from './services/thumbnails'
import { ProfileService } from './services/profiles'
import { TMDBService } from './services/tmdb'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let db: DatabaseService | null = null
let scanner: FileScanner
let thumbnailService: ThumbnailService | null = null
let profileService: ProfileService
let userDataPath: string
let currentProfilePath: string | null = null

// Scan cancellation flag
let scanCancelled = false

// Register custom protocol for local files
function registerLocalFileProtocol() {
  protocol.handle('local-file', async (request) => {
    // Remove the protocol prefix (local-file:///) and decode
    // URL format: local-file:///C:/Users/... -> C:/Users/...
    let filePath = decodeURIComponent(request.url.slice('local-file:///'.length))
    
    try {
      const data = await fs.promises.readFile(filePath)
      const extension = path.extname(filePath).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      }
      const mimeType = mimeTypes[extension] || 'application/octet-stream'
      
      return new Response(data, {
        headers: { 'Content-Type': mimeType }
      })
    } catch (error) {
      console.error('Failed to load file:', filePath, error)
      return new Response('File not found', { status: 404 })
    }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'hiddenInset',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Initialize services for a specific profile
function initializeProfileServices(profileId: string) {
  const profilePath = profileService.getProfilePath(profileId)
  currentProfilePath = profilePath
  db = new DatabaseService(profilePath)
  thumbnailService = new ThumbnailService(profilePath)
}

// Clear profile services (lock profile)
function clearProfileServices() {
  db = null
  thumbnailService = null
  currentProfilePath = null
}

// Helper to get TMDB service if API key is configured
function getTmdbService(): TMDBService | null {
  if (!db || !currentProfilePath) return null
  const apiKey = db.getSetting('tmdb_api_key')
  if (!apiKey) return null
  return new TMDBService(apiKey, currentProfilePath)
}

app.whenReady().then(() => {
  // Register custom protocol for loading local files
  registerLocalFileProtocol()

  // Initialize base services
  userDataPath = app.getPath('userData')
  profileService = new ProfileService(userDataPath)
  scanner = new FileScanner()

  // Check for data migration (existing libcat.db without profiles)
  const profiles = profileService.getProfiles()
  if (profiles.length === 0) {
    // Try to migrate existing data
    profileService.migrateExistingData()
  }

  // Register IPC handlers
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function registerIpcHandlers() {
  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // Profile management
  ipcMain.handle('profiles:getAll', async () => {
    return profileService.getProfiles()
  })

  ipcMain.handle('profiles:create', async (_, name: string, password?: string) => {
    return profileService.createProfile(name, password)
  })

  ipcMain.handle('profiles:delete', async (_, id: string) => {
    return profileService.deleteProfile(id)
  })

  ipcMain.handle('profiles:rename', async (_, id: string, newName: string) => {
    return profileService.renameProfile(id, newName)
  })

  ipcMain.handle('profiles:unlock', async (_, id: string, password?: string) => {
    const profile = profileService.getProfile(id)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Verify password if required
    if (profile.passwordHash) {
      if (!password || !profileService.verifyPassword(id, password)) {
        throw new Error('Invalid password')
      }
    }

    // Initialize services for this profile
    initializeProfileServices(id)
    return { success: true, profile: profileService.getProfiles().find(p => p.id === id) }
  })

  ipcMain.handle('profiles:lock', async () => {
    clearProfileServices()
    return { success: true }
  })

  ipcMain.handle('profiles:hasPassword', async (_, id: string) => {
    return profileService.hasPassword(id)
  })

  ipcMain.handle('profiles:removePassword', async (_, id: string, password: string) => {
    return profileService.removePassword(id, password)
  })

  // Movies CRUD - now requires profile to be unlocked
  ipcMain.handle('movies:getAll', async () => {
    if (!db) throw new Error('No profile selected')
    return db.getAllMovies()
  })

  // Get all movies with tags in a single query (performance optimization)
  ipcMain.handle('movies:getAllWithTags', async () => {
    if (!db) throw new Error('No profile selected')
    return db.getAllMoviesWithTags()
  })

  ipcMain.handle('movies:getById', async (_, id: number) => {
    if (!db) throw new Error('No profile selected')
    return db.getMovieById(id)
  })

  ipcMain.handle('movies:update', async (_, id: number, data: any) => {
    if (!db) throw new Error('No profile selected')
    return db.updateMovie(id, data)
  })

  ipcMain.handle('movies:delete', async (_, id: number) => {
    if (!db) throw new Error('No profile selected')
    return db.deleteMovie(id)
  })

  ipcMain.handle('movies:getByFilter', async (_, filter: string) => {
    if (!db) throw new Error('No profile selected')
    return db.getMoviesByFilter(filter)
  })

  ipcMain.handle('movies:search', async (_, query: string) => {
    if (!db) throw new Error('No profile selected')
    return db.searchMovies(query)
  })

  // Tags CRUD
  ipcMain.handle('tags:getAll', async () => {
    if (!db) throw new Error('No profile selected')
    return db.getAllTags()
  })

  ipcMain.handle('tags:create', async (_, name: string, color: string) => {
    if (!db) throw new Error('No profile selected')
    return db.createTag(name, color)
  })

  ipcMain.handle('tags:update', async (_, id: number, name: string, color: string) => {
    if (!db) throw new Error('No profile selected')
    return db.updateTag(id, name, color)
  })

  ipcMain.handle('tags:delete', async (_, id: number) => {
    if (!db) throw new Error('No profile selected')
    return db.deleteTag(id)
  })

  // Movie-Tag associations
  ipcMain.handle('movies:addTag', async (_, movieId: number, tagId: number) => {
    if (!db) throw new Error('No profile selected')
    return db.addTagToMovie(movieId, tagId)
  })

  ipcMain.handle('movies:removeTag', async (_, movieId: number, tagId: number) => {
    if (!db) throw new Error('No profile selected')
    return db.removeTagFromMovie(movieId, tagId)
  })

  ipcMain.handle('movies:getTagsForMovie', async (_, movieId: number) => {
    if (!db) throw new Error('No profile selected')
    return db.getTagsForMovie(movieId)
  })

  ipcMain.handle('movies:getByTag', async (_, tagId: number) => {
    if (!db) throw new Error('No profile selected')
    return db.getMoviesByTag(tagId)
  })

  // Folder scanning
  ipcMain.handle('folder:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
      title: 'Select Movie Folder',
    })
    return result.filePaths[0] || null
  })

  // Scan cancellation handler
  ipcMain.handle('scan:cancel', async () => {
    scanCancelled = true
    return { cancelled: true }
  })

  ipcMain.handle('folder:scan', async (_, folderPath: string) => {
    if (!db || !thumbnailService) throw new Error('No profile selected')
    
    // Reset cancellation flag at start of new scan
    scanCancelled = false
    
    const videoFiles = await scanner.scanFolder(folderPath)
    const results: any[] = []
    
    // Get TMDB service if API key is configured
    const tmdb = getTmdbService()

    for (let i = 0; i < videoFiles.length; i++) {
      // Check for cancellation before processing each file
      if (scanCancelled) {
        mainWindow?.webContents.send('scan:cancelled', {
          processed: results.filter(r => !r.skipped).length,
          total: videoFiles.length,
        })
        return results
      }

      const file = videoFiles[i]
      
      // Check if already in database
      const existing = db.getMovieByPath(file.path)
      if (existing) {
        results.push({ ...existing, skipped: true })
        continue
      }

      // Generate thumbnail and get duration
      let thumbnailPath: string | null = null
      let duration: number | null = null
      try {
        const metadata = await thumbnailService.generateThumbnail(file.path)
        thumbnailPath = metadata.thumbnailPath
        duration = metadata.duration
      } catch (error) {
        console.error('Failed to generate thumbnail:', error)
      }

      // Add to database
      let movie = db.addMovie({
        file_path: file.path,
        title: file.name,
        thumbnail_path: thumbnailPath,
        file_size: file.size,
        duration: duration,
      })

      // Auto-match with TMDB if API key is configured
      if (tmdb) {
        try {
          const { title, year } = tmdb.parseFilename(file.name)
          const match = await tmdb.matchMovie(title, year || undefined)
          
          if (match) {
            const movieData = await tmdb.fetchMovieData(match.id, movie.id)
            movie = db.updateMovie(movie.id, {
              tmdb_id: movieData.tmdb_id,
              tmdb_poster_path: movieData.tmdb_poster_path,
              tmdb_rating: movieData.tmdb_rating,
              tmdb_overview: movieData.tmdb_overview,
              tmdb_director: movieData.tmdb_director,
              tmdb_cast: movieData.tmdb_cast,
              tmdb_release_date: movieData.tmdb_release_date,
              tmdb_genres: movieData.tmdb_genres,
              year: movieData.year,
              title: movieData.title,
            })
          }
        } catch (error) {
          console.error('TMDB auto-match failed for', file.name, error)
          // Continue without TMDB data - movie is already in database
        }
      }

      results.push(movie)

      // Send progress
      mainWindow?.webContents.send('scan:progress', {
        current: i + 1,
        total: videoFiles.length,
        file: file.name,
      })
    }

    return results
  })

  // File operations
  ipcMain.handle('file:openInExplorer', async (_, filePath: string) => {
    shell.showItemInFolder(filePath)
  })

  ipcMain.handle('file:playVideo', async (_, filePath: string) => {
    shell.openPath(filePath)
  })

  // Thumbnail operations
  ipcMain.handle('thumbnail:regenerate', async (_, movieId: number, filePath: string) => {
    if (!db || !thumbnailService) throw new Error('No profile selected')
    
    try {
      const metadata = await thumbnailService.generateThumbnail(filePath, true)
      db.updateMovie(movieId, { 
        thumbnail_path: metadata.thumbnailPath,
        duration: metadata.duration 
      })
      return metadata.thumbnailPath
    } catch (error) {
      console.error('Failed to regenerate thumbnail:', error)
      return null
    }
  })

  ipcMain.handle('thumbnail:setCustom', async (_, movieId: number) => {
    if (!db || !thumbnailService) throw new Error('No profile selected')
    
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
      title: 'Select Poster Image',
    })
    
    if (result.filePaths[0]) {
      const thumbnailPath = await thumbnailService.copyCustomThumbnail(result.filePaths[0])
      db.updateMovie(movieId, { thumbnail_path: thumbnailPath })
      return thumbnailPath
    }
    return null
  })

  // Drag and drop files
  ipcMain.handle('files:addFromPaths', async (_, paths: string[]) => {
    if (!db || !thumbnailService) throw new Error('No profile selected')
    
    // Reset cancellation flag at start of new scan
    scanCancelled = false
    
    const results: any[] = []
    const tmdb = getTmdbService()

    for (let i = 0; i < paths.length; i++) {
      // Check for cancellation before processing each file
      if (scanCancelled) {
        mainWindow?.webContents.send('scan:cancelled', {
          processed: results.filter(r => !r.skipped).length,
          total: paths.length,
        })
        return results
      }

      const filePath = paths[i]
      const stats = await scanner.getFileStats(filePath)
      if (!stats || !scanner.isVideoFile(filePath)) continue

      const existing = db.getMovieByPath(filePath)
      if (existing) {
        results.push({ ...existing, skipped: true })
        continue
      }

      let thumbnailPath: string | null = null
      let duration: number | null = null
      try {
        const metadata = await thumbnailService.generateThumbnail(filePath)
        thumbnailPath = metadata.thumbnailPath
        duration = metadata.duration
      } catch (error) {
        console.error('Failed to generate thumbnail:', error)
      }

      const filename = path.basename(filePath, path.extname(filePath))
      let movie = db.addMovie({
        file_path: filePath,
        title: filename,
        thumbnail_path: thumbnailPath,
        file_size: stats.size,
        duration: duration,
      })

      // Auto-match with TMDB if API key is configured
      if (tmdb) {
        try {
          const { title, year } = tmdb.parseFilename(filename)
          const match = await tmdb.matchMovie(title, year || undefined)
          
          if (match) {
            const movieData = await tmdb.fetchMovieData(match.id, movie.id)
            movie = db.updateMovie(movie.id, {
              tmdb_id: movieData.tmdb_id,
              tmdb_poster_path: movieData.tmdb_poster_path,
              tmdb_rating: movieData.tmdb_rating,
              tmdb_overview: movieData.tmdb_overview,
              tmdb_director: movieData.tmdb_director,
              tmdb_cast: movieData.tmdb_cast,
              tmdb_release_date: movieData.tmdb_release_date,
              tmdb_genres: movieData.tmdb_genres,
              year: movieData.year,
              title: movieData.title,
            })
          }
        } catch (error) {
          console.error('TMDB auto-match failed for', filename, error)
        }
      }

      results.push(movie)

      // Send progress for drag-and-drop too
      mainWindow?.webContents.send('scan:progress', {
        current: i + 1,
        total: paths.length,
        file: filename,
      })
    }

    return results
  })

  // TMDB API handlers
  ipcMain.handle('tmdb:getApiKey', async () => {
    if (!db) throw new Error('No profile selected')
    return db.getSetting('tmdb_api_key') || null
  })

  ipcMain.handle('tmdb:setApiKey', async (_, apiKey: string) => {
    if (!db || !currentProfilePath) throw new Error('No profile selected')
    if (apiKey) {
      const tmdb = new TMDBService(apiKey, currentProfilePath)
      const isValid = await tmdb.validateApiKey()
      if (!isValid) throw new Error('Invalid TMDB API key')
      db.setSetting('tmdb_api_key', apiKey)
    } else {
      db.deleteSetting('tmdb_api_key')
    }
    return { success: true }
  })

  ipcMain.handle('tmdb:search', async (_, query: string, year?: number) => {
    const tmdb = getTmdbService()
    if (!tmdb) throw new Error('TMDB API key not configured')
    return await tmdb.searchMovies(query, year)
  })

  ipcMain.handle('tmdb:linkMovie', async (_, movieId: number, tmdbId: number) => {
    if (!db) throw new Error('No profile selected')
    const tmdb = getTmdbService()
    if (!tmdb) throw new Error('TMDB API key not configured')
    const movieData = await tmdb.fetchMovieData(tmdbId, movieId)
    return db.updateMovie(movieId, {
      tmdb_id: movieData.tmdb_id,
      tmdb_poster_path: movieData.tmdb_poster_path,
      tmdb_rating: movieData.tmdb_rating,
      tmdb_overview: movieData.tmdb_overview,
      tmdb_director: movieData.tmdb_director,
      tmdb_cast: movieData.tmdb_cast,
      tmdb_release_date: movieData.tmdb_release_date,
      tmdb_genres: movieData.tmdb_genres,
      year: movieData.year,
      title: movieData.title,
    })
  })

  ipcMain.handle('tmdb:unlinkMovie', async (_, movieId: number) => {
    if (!db) throw new Error('No profile selected')
    return db.unlinkTmdb(movieId)
  })

  ipcMain.handle('tmdb:refreshMetadata', async (_, movieId: number) => {
    if (!db) throw new Error('No profile selected')
    const tmdb = getTmdbService()
    if (!tmdb) throw new Error('TMDB API key not configured')
    const movie = db.getMovieById(movieId)
    if (!movie || !movie.tmdb_id) throw new Error('Movie not linked to TMDB')
    const movieData = await tmdb.fetchMovieData(movie.tmdb_id, movieId)
    return db.updateMovie(movieId, {
      tmdb_poster_path: movieData.tmdb_poster_path,
      tmdb_rating: movieData.tmdb_rating,
      tmdb_overview: movieData.tmdb_overview,
      tmdb_director: movieData.tmdb_director,
      tmdb_cast: movieData.tmdb_cast,
      tmdb_release_date: movieData.tmdb_release_date,
      tmdb_genres: movieData.tmdb_genres,
    })
  })

  ipcMain.handle('tmdb:autoMatch', async (_, movieId: number) => {
    if (!db) throw new Error('No profile selected')
    const tmdb = getTmdbService()
    if (!tmdb) throw new Error('TMDB API key not configured')
    const movie = db.getMovieById(movieId)
    if (!movie) throw new Error('Movie not found')
    const { title, year } = tmdb.parseFilename(movie.file_path)
    const match = await tmdb.matchMovie(title, year || undefined)
    if (!match) return { matched: false, movie }
    const movieData = await tmdb.fetchMovieData(match.id, movieId)
    const updatedMovie = db.updateMovie(movieId, {
      tmdb_id: movieData.tmdb_id,
      tmdb_poster_path: movieData.tmdb_poster_path,
      tmdb_rating: movieData.tmdb_rating,
      tmdb_overview: movieData.tmdb_overview,
      tmdb_director: movieData.tmdb_director,
      tmdb_cast: movieData.tmdb_cast,
      tmdb_release_date: movieData.tmdb_release_date,
      tmdb_genres: movieData.tmdb_genres,
      year: movieData.year,
      title: movieData.title,
    })
    return { matched: true, movie: updatedMovie }
  })

  ipcMain.handle('tmdb:openInBrowser', async (_, tmdbId: number) => {
    shell.openExternal(TMDBService.getTmdbUrl(tmdbId))
  })
}
