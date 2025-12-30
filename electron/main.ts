import { app, BrowserWindow, ipcMain, dialog, shell, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import { DatabaseService } from './services/database'
import { FileScanner } from './services/scanner'
import { ThumbnailService } from './services/thumbnails'
import { ProfileService } from './services/profiles'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let db: DatabaseService | null = null
let scanner: FileScanner
let thumbnailService: ThumbnailService | null = null
let profileService: ProfileService
let userDataPath: string

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
  db = new DatabaseService(profilePath)
  thumbnailService = new ThumbnailService(profilePath)
}

// Clear profile services (lock profile)
function clearProfileServices() {
  db = null
  thumbnailService = null
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

  // Movies CRUD - now requires profile to be unlocked
  ipcMain.handle('movies:getAll', async () => {
    if (!db) throw new Error('No profile selected')
    return db.getAllMovies()
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

  ipcMain.handle('folder:scan', async (_, folderPath: string) => {
    if (!db || !thumbnailService) throw new Error('No profile selected')
    
    const videoFiles = await scanner.scanFolder(folderPath)
    const results: any[] = []

    for (let i = 0; i < videoFiles.length; i++) {
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
      const movie = db.addMovie({
        file_path: file.path,
        title: file.name,
        thumbnail_path: thumbnailPath,
        file_size: file.size,
        duration: duration,
      })

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
    
    const results: any[] = []

    for (const filePath of paths) {
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

      const movie = db.addMovie({
        file_path: filePath,
        title: path.basename(filePath, path.extname(filePath)),
        thumbnail_path: thumbnailPath,
        file_size: stats.size,
        duration: duration,
      })

      results.push(movie)
    }

    return results
  })
}
