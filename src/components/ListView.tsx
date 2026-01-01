import { useState, useMemo, useCallback, useRef, type ReactElement } from 'react'
import { List } from 'react-window'
import { useLibraryStore } from '../stores/libraryStore'
import type { Movie, Tag } from '../types'

type SortColumn = 'title' | 'created_at' | 'file_size' | 'duration'
type SortDirection = 'asc' | 'desc'

// Row height - fixed for virtualization performance
const ROW_HEIGHT = 56

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

// Row component - receives index, style, and all rowProps flattened
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

  return (
    <div
      style={style}
      onClick={(e) => onSelect(movie, index, e.shiftKey, e.ctrlKey || e.metaKey)}
      onDoubleClick={() => onDoubleClick(movie)}
      className={`movie-list-item grid grid-cols-[1fr,120px,100px,100px,80px] gap-4 px-4 border-b border-charcoal-800/50 cursor-pointer transition-colors hover:bg-charcoal-800/30 ${
        isSelected ? 'bg-amber-400/10 hover:bg-amber-400/15' : ''
      }`}
    >
      {/* Filename + Tags */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <p className={`text-sm truncate flex-shrink min-w-0 ${
            isSelected ? 'text-amber-400' : 'text-cream-100'
          }`}>
            {movie.title || getFileName(movie.file_path)}
          </p>
          {/* Tags - inline with title */}
          {movie.tags && movie.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {movie.tags.slice(0, 2).map((tag: Tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  <span
                    className="w-1 h-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </span>
              ))}
              {movie.tags.length > 2 && (
                <span className="text-[10px] text-charcoal-500 font-medium">+{movie.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Created date */}
      <div className="flex items-center text-sm text-charcoal-300">
        {formatDate(movie.created_at)}
      </div>

      {/* File size */}
      <div className="flex items-center text-sm text-charcoal-300">
        {formatFileSize(movie.file_size)}
      </div>

      {/* Duration */}
      <div className="flex items-center text-sm text-charcoal-300 font-mono">
        {formatDuration(movie.duration)}
      </div>

      {/* Favorite */}
      <div className="flex items-center justify-center">
        <button
          onClick={(e) => onFavoriteToggle(e, movie)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:scale-110 active:scale-90 ${
            movie.favorite
              ? 'text-red-400 hover:text-red-300'
              : 'text-charcoal-600 hover:text-charcoal-400'
          }`}
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
        </button>
      </div>
    </div>
  )
}

export function ListView() {
  const { filteredMovies, selectedMovies, toggleMovieSelection, updateMovieInState } = useLibraryStore()
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(600)

  // Create a Set of selected IDs for O(1) lookup
  const selectedIds = useMemo(() => new Set(selectedMovies.map(m => m.id)), [selectedMovies])

  // Sort movies
  const sortedMovies = useMemo(() => {
    const sorted = [...filteredMovies].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortColumn) {
        case 'title':
          aVal = (a.title || a.file_path).toLowerCase()
          bVal = (b.title || b.file_path).toLowerCase()
          break
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case 'file_size':
          aVal = a.file_size || 0
          bVal = b.file_size || 0
          break
        case 'duration':
          aVal = a.duration || 0
          bVal = b.duration || 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredMovies, sortColumn, sortDirection])

  // Update container height on mount and resize
  const updateHeight = useCallback(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.clientHeight)
    }
  }, [])

  // Set up resize observer
  useMemo(() => {
    if (typeof window === 'undefined') return
    const observer = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [updateHeight])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'created_at' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-3 h-3 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  // Item data for react-window - memoized to prevent unnecessary re-renders
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
      <div className="grid grid-cols-[1fr,120px,100px,100px,80px] gap-4 px-4 py-3 bg-charcoal-800/50 border-b border-charcoal-700/50 text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
        <button
          onClick={() => handleSort('title')}
          className="flex items-center gap-1.5 hover:text-cream-200 transition-colors text-left"
        >
          Filename
          <SortIcon column="title" />
        </button>
        <button
          onClick={() => handleSort('created_at')}
          className="flex items-center gap-1.5 hover:text-cream-200 transition-colors text-left"
        >
          Added
          <SortIcon column="created_at" />
        </button>
        <button
          onClick={() => handleSort('file_size')}
          className="flex items-center gap-1.5 hover:text-cream-200 transition-colors text-left"
        >
          Size
          <SortIcon column="file_size" />
        </button>
        <button
          onClick={() => handleSort('duration')}
          className="flex items-center gap-1.5 hover:text-cream-200 transition-colors text-left"
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
            defaultHeight={containerHeight}
            overscanCount={5}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-charcoal-800/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-cream-200 mb-2">No movies found</h3>
            <p className="text-sm text-charcoal-400">
              Add a folder or drop some video files to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
