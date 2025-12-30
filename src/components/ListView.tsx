import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import type { Movie } from '../types'

type SortColumn = 'title' | 'created_at' | 'file_size' | 'duration'
type SortDirection = 'asc' | 'desc'

export function ListView() {
  const { filteredMovies, selectedMovies, toggleMovieSelection, updateMovieInState } = useLibraryStore()
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sort movies
  const sortedMovies = useMemo(() => {
    const sorted = [...filteredMovies].sort((a, b) => {
      let aVal: any
      let bVal: any

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

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getFileName = (filePath: string): string => {
    const parts = filePath.split(/[/\\]/)
    return parts[parts.length - 1]
  }

  const handleDoubleClick = (movie: Movie) => {
    window.api.playVideo(movie.file_path)
  }

  const handleFavoriteToggle = async (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation()
    try {
      await window.api.updateMovie(movie.id, { favorite: !movie.favorite })
      updateMovieInState(movie.id, { favorite: !movie.favorite })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  // Disable animation stagger for large lists to improve performance
  const shouldStagger = sortedMovies.length <= 100
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: shouldStagger ? 0.02 : 0 },
    },
  }

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  }

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

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sortedMovies.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            {sortedMovies.map((movie, index) => {
              const isSelected = selectedMovies.some(m => m.id === movie.id)
              return (
              <motion.div
                key={movie.id}
                variants={item}
                onClick={(e) => toggleMovieSelection(movie, index, e.shiftKey, e.ctrlKey || e.metaKey)}
                onDoubleClick={() => handleDoubleClick(movie)}
                className={`movie-list-item grid grid-cols-[1fr,120px,100px,100px,80px] gap-4 px-4 py-3 border-b border-charcoal-800/50 cursor-pointer transition-colors hover:bg-charcoal-800/30 ${
                  isSelected ? 'bg-amber-400/10 hover:bg-amber-400/15' : ''
                }`}
              >
                {/* Filename */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Watched indicator */}
                  {movie.watched && (
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Tags dots */}
                  {movie.tags && movie.tags.length > 0 && (
                    <div className="flex gap-1 flex-shrink-0">
                      {movie.tags.slice(0, 3).map((tag) => (
                        <div
                          key={tag.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${
                      isSelected ? 'text-amber-400' : 'text-cream-100'
                    }`}>
                      {movie.title || getFileName(movie.file_path)}
                    </p>
                    <p className="text-xs text-charcoal-500 truncate">
                      {getFileName(movie.file_path)}
                    </p>
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
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleFavoriteToggle(e, movie)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
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
                  </motion.button>
                </div>
              </motion.div>
            )})}
          </motion.div>
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
