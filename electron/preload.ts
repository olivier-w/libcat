import { contextBridge, ipcRenderer } from 'electron'

// Profile type for the renderer
export interface Profile {
  id: string
  name: string
  passwordHash: string | null // 'protected' if has password, null if not
  createdAt: string
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Platform
  platform: process.platform,
  
  // Window controls
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),

  // Profiles
  getProfiles: () => ipcRenderer.invoke('profiles:getAll'),
  createProfile: (name: string, password?: string) => ipcRenderer.invoke('profiles:create', name, password),
  deleteProfile: (id: string) => ipcRenderer.invoke('profiles:delete', id),
  renameProfile: (id: string, newName: string) => ipcRenderer.invoke('profiles:rename', id, newName),
  unlockProfile: (id: string, password?: string) => ipcRenderer.invoke('profiles:unlock', id, password),
  lockProfile: () => ipcRenderer.invoke('profiles:lock'),
  hasPassword: (id: string) => ipcRenderer.invoke('profiles:hasPassword', id),
  removePassword: (id: string, password: string) => ipcRenderer.invoke('profiles:removePassword', id, password),

  // Movies
  getMovies: () => ipcRenderer.invoke('movies:getAll'),
  getMoviesWithTags: () => ipcRenderer.invoke('movies:getAllWithTags'),
  getMovieById: (id: number) => ipcRenderer.invoke('movies:getById', id),
  updateMovie: (id: number, data: any) => ipcRenderer.invoke('movies:update', id, data),
  deleteMovie: (id: number) => ipcRenderer.invoke('movies:delete', id),
  getMoviesByFilter: (filter: string) => ipcRenderer.invoke('movies:getByFilter', filter),
  searchMovies: (query: string) => ipcRenderer.invoke('movies:search', query),

  // Tags
  getTags: () => ipcRenderer.invoke('tags:getAll'),
  createTag: (name: string, color: string) => ipcRenderer.invoke('tags:create', name, color),
  updateTag: (id: number, name: string, color: string) => ipcRenderer.invoke('tags:update', id, name, color),
  deleteTag: (id: number) => ipcRenderer.invoke('tags:delete', id),

  // Movie-Tag associations
  addTagToMovie: (movieId: number, tagId: number) => ipcRenderer.invoke('movies:addTag', movieId, tagId),
  removeTagFromMovie: (movieId: number, tagId: number) => ipcRenderer.invoke('movies:removeTag', movieId, tagId),
  getTagsForMovie: (movieId: number) => ipcRenderer.invoke('movies:getTagsForMovie', movieId),
  getMoviesByTag: (tagId: number) => ipcRenderer.invoke('movies:getByTag', tagId),

  // Folder operations
  selectFolder: () => ipcRenderer.invoke('folder:select'),
  scanFolder: (folderPath: string) => ipcRenderer.invoke('folder:scan', folderPath),
  cancelScan: () => ipcRenderer.invoke('scan:cancel'),
  onScanProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('scan:progress', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('scan:progress')
  },
  onScanCancelled: (callback: (data: { processed: number; total: number }) => void) => {
    ipcRenderer.on('scan:cancelled', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('scan:cancelled')
  },

  // File operations
  openInExplorer: (filePath: string) => ipcRenderer.invoke('file:openInExplorer', filePath),
  playVideo: (filePath: string) => ipcRenderer.invoke('file:playVideo', filePath),

  // Thumbnail operations
  regenerateThumbnail: (movieId: number, filePath: string) => 
    ipcRenderer.invoke('thumbnail:regenerate', movieId, filePath),
  setCustomThumbnail: (movieId: number) => 
    ipcRenderer.invoke('thumbnail:setCustom', movieId),

  // Drag and drop
  addFromPaths: (paths: string[]) => ipcRenderer.invoke('files:addFromPaths', paths),

  // TMDB
  tmdbGetApiKey: () => ipcRenderer.invoke('tmdb:getApiKey'),
  tmdbSetApiKey: (apiKey: string) => ipcRenderer.invoke('tmdb:setApiKey', apiKey),
  tmdbSearch: (query: string, year?: number) => ipcRenderer.invoke('tmdb:search', query, year),
  tmdbLinkMovie: (movieId: number, tmdbId: number) => ipcRenderer.invoke('tmdb:linkMovie', movieId, tmdbId),
  tmdbUnlinkMovie: (movieId: number) => ipcRenderer.invoke('tmdb:unlinkMovie', movieId),
  tmdbRefreshMetadata: (movieId: number) => ipcRenderer.invoke('tmdb:refreshMetadata', movieId),
  tmdbAutoMatch: (movieId: number) => ipcRenderer.invoke('tmdb:autoMatch', movieId),
  tmdbOpenInBrowser: (tmdbId: number) => ipcRenderer.invoke('tmdb:openInBrowser', tmdbId),
})

// Type declarations for the exposed API
export type Api = {
  // Platform
  platform: NodeJS.Platform
  
  // Window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  
  // Profiles
  getProfiles: () => Promise<Profile[]>
  createProfile: (name: string, password?: string) => Promise<Profile>
  deleteProfile: (id: string) => Promise<void>
  renameProfile: (id: string, newName: string) => Promise<Profile>
  unlockProfile: (id: string, password?: string) => Promise<{ success: boolean; profile: Profile }>
  lockProfile: () => Promise<{ success: boolean }>
  hasPassword: (id: string) => Promise<boolean>
  removePassword: (id: string, password: string) => Promise<Profile>
  
  // Movies
  getMovies: () => Promise<any[]>
  getMoviesWithTags: () => Promise<any[]>
  getMovieById: (id: number) => Promise<any>
  updateMovie: (id: number, data: any) => Promise<any>
  deleteMovie: (id: number) => Promise<void>
  getMoviesByFilter: (filter: string) => Promise<any[]>
  searchMovies: (query: string) => Promise<any[]>
  
  // Tags
  getTags: () => Promise<any[]>
  createTag: (name: string, color: string) => Promise<any>
  updateTag: (id: number, name: string, color: string) => Promise<any>
  deleteTag: (id: number) => Promise<void>
  
  // Movie-Tag associations
  addTagToMovie: (movieId: number, tagId: number) => Promise<void>
  removeTagFromMovie: (movieId: number, tagId: number) => Promise<void>
  getTagsForMovie: (movieId: number) => Promise<any[]>
  getMoviesByTag: (tagId: number) => Promise<any[]>
  
  // Folder operations
  selectFolder: () => Promise<string | null>
  scanFolder: (folderPath: string) => Promise<any[]>
  cancelScan: () => Promise<{ cancelled: boolean }>
  onScanProgress: (callback: (data: any) => void) => () => void
  onScanCancelled: (callback: (data: { processed: number; total: number }) => void) => () => void
  
  // File operations
  openInExplorer: (filePath: string) => Promise<void>
  playVideo: (filePath: string) => Promise<void>
  
  // Thumbnail operations
  regenerateThumbnail: (movieId: number, filePath: string) => Promise<string | null>
  setCustomThumbnail: (movieId: number) => Promise<string | null>
  
  // Drag and drop
  addFromPaths: (paths: string[]) => Promise<any[]>

  // TMDB
  tmdbGetApiKey: () => Promise<string | null>
  tmdbSetApiKey: (apiKey: string) => Promise<{ success: boolean }>
  tmdbSearch: (query: string, year?: number) => Promise<TMDBSearchResult[]>
  tmdbLinkMovie: (movieId: number, tmdbId: number) => Promise<any>
  tmdbUnlinkMovie: (movieId: number) => Promise<any>
  tmdbRefreshMetadata: (movieId: number) => Promise<any>
  tmdbAutoMatch: (movieId: number) => Promise<{ matched: boolean; movie: any }>
  tmdbOpenInBrowser: (tmdbId: number) => Promise<void>
}

export interface TMDBSearchResult {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  release_date: string
  vote_average: number
  popularity: number
}

declare global {
  interface Window {
    api: Api
  }
}
