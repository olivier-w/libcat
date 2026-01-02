import { useMemo, useCallback, useRef, type ReactElement } from 'react'
import { List } from 'react-window'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import type { Movie, Tag, SortColumn } from '../types'

// Row height - fixed for virtualization performance
const ROW_HEIGHT = 64

// Props passed to each row via rowProps
interface RowData {
  movies: Movie[]
  selectedIds: Set<number>
  onSelect: (movie: Movie, index: number, shiftKey: boolean, ctrlKey: boolean) => void
  onDoubleClick: (movie: Movie) => void
  onFavoriteToggle: (e: React.MouseEvent, movie: Movie) => void
  formatDate: (date: string) => string
  formatFileSize: (bytes: number | null) => string
  formatDuration: (seconds: number | null) => string
  getFileName: (path: string) => string
}

// Row component
function Row({ 
  index, 
  style,
  movies,
  selectedIds,
  onSelect,
  onDoubleClick,
  onFavoriteToggle,
  formatDate,
  formatFileSize,
  formatDuration,
  getFileName,
}: {
  index: number
  style: React.CSSProperties
  ariaAttributes: Record<string, unknown>
} & RowData): ReactElement {
  const movie = movies[index]
  const isSelected = selectedIds.has(movie.id)
  const isEven = index % 2 === 0

  // Get poster URL for thumbnail
  const getPosterUrl = () => {
    if (movie.tmdb_poster_path) {
      return `local-file:///${movie.tmdb_poster_path.replace(/\\/g, '/')}`
    }
    if (movie.thumbnail_path) {
      return `local-file:///${movie.thumbnail_path.replace(/\\/g, '/')}`
    }
    return null
  }

  const posterUrl = getPosterUrl()

  return (
    <div
      style={style}
      onClick={(e) => onSelect(movie, index, e.shiftKey, e.ctrlKey || e.metaKey)}
      onDoubleClick={() => onDoubleClick(movie)}
      className={`movie-list-item grid grid-cols-[40px,1fr,100px,80px,80px,60px] gap-4 px-4 border-b border-smoke-900/20 cursor-pointer transition-all group relative ${
        isSelected 
          ? 'bg-bronze-500/10 hover:bg-bronze-500/15' 
          : isEven 
            ? 'bg-obsidian-500/20 hover:bg-obsidian-400/30' 
            : 'hover:bg-obsidian-400/30'
      }`}
    >
      {/* Accent bar on hover/select */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all ${
        isSelected ? 'bg-bronze-500' : 'bg-transparent group-hover:bg-bronze-500/50'
      }`} />

      {/* Thumbnail */}
      <div className="flex items-center">
        <div className="w-9 h-12 rounded overflow-hidden bg-obsidian-500/50 flex-shrink-0">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-4 h-4 text-smoke-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Title + Tags */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <p className={`text-sm truncate flex-shrink min-w-0 font-medium ${
            isSelected ? 'text-bronze-400' : 'text-pearl-200'
          }`}>
            {movie.title || getFileName(movie.file_path)}
          </p>
          {movie.year && (
            <span className="text-xs text-smoke-600 flex-shrink-0">({movie.year})</span>
          )}
          {/* Tags */}
          {movie.tags && movie.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
              {movie.tags.slice(0, 2).map((tag: Tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-medium"
                  style={{ 
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </span>
              ))}
              {movie.tags.length > 2 && (
                <span className="text-2xs text-smoke-600 font-medium">+{movie.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date Added */}
      <div className="flex items-center text-xs text-smoke-500">
        {formatDate(movie.created_at)}
      </div>

      {/* File Size */}
      <div className="flex items-center text-xs text-smoke-500 font-mono">
        {formatFileSize(movie.file_size)}
      </div>

      {/* Duration */}
      <div className="flex items-center text-xs text-smoke-500 font-mono">
        {formatDuration(movie.duration)}
      </div>

      {/* Favorite */}
      <div className="flex items-center justify-center">
        <motion.button
          onClick={(e) => onFavoriteToggle(e, movie)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            movie.favorite
              ? 'text-cinnabar-400'
              : 'text-smoke-700 opacity-0 group-hover:opacity-100 hover:text-smoke-500'
          }`}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            className="w-4 h-4"
            fill={movie.favorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </motion.button>
      </div>

      {/* Watched indicator */}
      {movie.watched && (
        <div className="absolute right-16 top-1/2 -translate-y-1/2">
          <div className="badge badge-sage">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

interface ListViewProps {
  sortedMovies: Movie[]
}

export function ListView({ sortedMovies }: ListViewProps) {
  const { 
    selectedMovies, 
    toggleMovieSelection, 
    updateMovieInState,
    sortColumn,
    sortDirection,
    setSortColumn,
    setSortDirection,
  } = useLibraryStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const containerHeight = useRef(600)

  const selectedIds = useMemo(() => new Set(selectedMovies.map(m => m.id)), [selectedMovies])

  const updateHeight = useCallback(() => {
    if (containerRef.current) {
      containerHeight.current = containerRef.current.clientHeight
    }
  }, [])

  useMemo(() => {
    if (typeof window === 'undefined') return
    const observer = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [updateHeight])

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'created_at' ? 'desc' : 'asc')
    }
  }, [sortColumn, sortDirection, setSortColumn, setSortDirection])

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 text-smoke-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return (
      <motion.svg 
        className="w-3 h-3 text-bronze-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        animate={{ rotate: sortDirection === 'asc' ? 0 : 180 }}
        transition={{ duration: 0.2 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </motion.svg>
    )
  }

  const formatFileSize = useCallback((bytes: number | null): string => {
    if (!bytes) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }, [])

  const formatDuration = useCallback((seconds: number | null): string => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    })
  }, [])

  const getFileName = useCallback((filePath: string): string => {
    const parts = filePath.split(/[/\\]/)
    return parts[parts.length - 1]
  }, [])

  const handleDoubleClick = useCallback((movie: Movie) => {
    window.api.playVideo(movie.file_path)
  }, [])

  const handleFavoriteToggle = useCallback(async (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation()
    try {
      await window.api.updateMovie(movie.id, { favorite: !movie.favorite })
      updateMovieInState(movie.id, { favorite: !movie.favorite })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }, [updateMovieInState])

  const handleSelect = useCallback((movie: Movie, index: number, shiftKey: boolean, ctrlKey: boolean) => {
    toggleMovieSelection(movie, index, shiftKey, ctrlKey, sortedMovies)
  }, [toggleMovieSelection, sortedMovies])

  const rowProps: RowData = useMemo(() => ({
    movies: sortedMovies,
    selectedIds,
    onSelect: handleSelect,
    onDoubleClick: handleDoubleClick,
    onFavoriteToggle: handleFavoriteToggle,
    formatDate,
    formatFileSize,
    formatDuration,
    getFileName,
  }), [sortedMovies, selectedIds, handleSelect, handleDoubleClick, handleFavoriteToggle, formatDate, formatFileSize, formatDuration, getFileName])

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[40px,1fr,100px,80px,80px,60px] gap-4 px-4 py-3 bg-obsidian-500/50 border-b border-smoke-900/30 text-2xs font-semibold text-smoke-600 uppercase tracking-wider">
        <div></div>
        <button
          onClick={() => handleSort('title')}
          className="flex items-center gap-1.5 hover:text-pearl-300 transition-colors text-left"
        >
          Title
          <SortIcon column="title" />
        </button>
        <button
          onClick={() => handleSort('created_at')}
          className="flex items-center gap-1.5 hover:text-pearl-300 transition-colors text-left"
        >
          Added
          <SortIcon column="created_at" />
        </button>
        <button
          onClick={() => handleSort('file_size')}
          className="flex items-center gap-1.5 hover:text-pearl-300 transition-colors text-left"
        >
          Size
          <SortIcon column="file_size" />
        </button>
        <button
          onClick={() => handleSort('duration')}
          className="flex items-center gap-1.5 hover:text-pearl-300 transition-colors text-left"
        >
          Duration
          <SortIcon column="duration" />
        </button>
        <div className="text-center">Fav</div>
      </div>

      {/* Virtualized List */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {sortedMovies.length > 0 ? (
          <List<RowData>
            rowCount={sortedMovies.length}
            rowHeight={ROW_HEIGHT}
            rowComponent={Row}
            rowProps={rowProps}
            defaultHeight={containerHeight.current}
            overscanCount={5}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-obsidian-400/30 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-smoke-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-semibold text-pearl-300 mb-2">No movies found</h3>
            <p className="text-sm text-smoke-500">
              Add a folder or drop video files to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
