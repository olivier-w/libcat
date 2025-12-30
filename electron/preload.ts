import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Window controls
  windowMinimize: () => ipcRenderer.send('window:minimize'),
  windowMaximize: () => ipcRenderer.send('window:maximize'),
  windowClose: () => ipcRenderer.send('window:close'),

  // Movies
  getMovies: () => ipcRenderer.invoke('movies:getAll'),
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
  onScanProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('scan:progress', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('scan:progress')
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
})

// Type declarations for the exposed API
export type Api = {
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  getMovies: () => Promise<any[]>
  getMovieById: (id: number) => Promise<any>
  updateMovie: (id: number, data: any) => Promise<any>
  deleteMovie: (id: number) => Promise<void>
  getMoviesByFilter: (filter: string) => Promise<any[]>
  searchMovies: (query: string) => Promise<any[]>
  getTags: () => Promise<any[]>
  createTag: (name: string, color: string) => Promise<any>
  updateTag: (id: number, name: string, color: string) => Promise<any>
  deleteTag: (id: number) => Promise<void>
  addTagToMovie: (movieId: number, tagId: number) => Promise<void>
  removeTagFromMovie: (movieId: number, tagId: number) => Promise<void>
  getTagsForMovie: (movieId: number) => Promise<any[]>
  getMoviesByTag: (tagId: number) => Promise<any[]>
  selectFolder: () => Promise<string | null>
  scanFolder: (folderPath: string) => Promise<any[]>
  onScanProgress: (callback: (data: any) => void) => () => void
  openInExplorer: (filePath: string) => Promise<void>
  playVideo: (filePath: string) => Promise<void>
  regenerateThumbnail: (movieId: number, filePath: string) => Promise<string | null>
  setCustomThumbnail: (movieId: number) => Promise<string | null>
  addFromPaths: (paths: string[]) => Promise<any[]>
}

declare global {
  interface Window {
    api: Api
  }
}

