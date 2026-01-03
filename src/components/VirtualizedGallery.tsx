import { memo, useState, useRef, useLayoutEffect, useCallback, type CSSProperties, type ReactElement } from 'react'
import { Grid, type CellComponentProps } from 'react-window'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import { ContextMenu, useContextMenu, type ContextMenuItem } from './ContextMenu'
import type { Movie } from '../types'

// Grid dimensions - matching the CSS grid minmax(180px, 1fr) + gap
const ITEM_MIN_WIDTH = 180
const ITEM_GAP = 20 // gap-5 = 1.25rem = 20px
const POSTER_ASPECT_RATIO = 1.5 // 2:3 aspect ratio (height = width * 1.5)
const PADDING = 24 // p-6

interface VirtualizedGalleryProps {
  movies: Movie[]
}

interface CellData {
  movies: Movie[]
  columnCount: number
  columnWidth: number
  cardHeight: number
  horizontalOffset: number
  onContextMenu: (e: React.MouseEvent, movie: Movie) => void
}


// Cell component for the Grid
function CellComponent({
  columnIndex,
  rowIndex,
  style,
  movies,
  columnCount,
  columnWidth,
  cardHeight,
  horizontalOffset,
  onContextMenu,
}: CellComponentProps<CellData>): ReactElement | null {
  const { selectedIds, toggleMovieSelection, updateMovieInState } = useLibraryStore()
  const [isHovered, setIsHovered] = useState(false)
  
  const index = rowIndex * columnCount + columnIndex
  
  // Handle empty cells in the last row
  if (index >= movies.length) {
    return null
  }
  
  const movie = movies[index]
  const isSelected = selectedIds.has(movie.id)
  
  const handleClick = (e: React.MouseEvent) => {
    toggleMovieSelection(movie, index, e.shiftKey, e.ctrlKey || e.metaKey, movies)
  }
  
  const handleDoubleClick = () => {
    window.api.playVideo(movie.file_path)
  }
  
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.api.playVideo(movie.file_path)
  }
  
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await window.api.updateMovie(movie.id, { favorite: !movie.favorite })
      updateMovieInState(movie.id, { favorite: !movie.favorite })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }
  
  // Prefer TMDB poster, fall back to thumbnail
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
  
  // Apply gap inside the cell and offset for padding
  const cellPadding = ITEM_GAP / 2
  const adjustedStyle: CSSProperties = {
    ...style,
    left: (parseFloat(String(style.left)) || 0) + horizontalOffset,
    top: (parseFloat(String(style.top)) || 0) + PADDING,
  }
  const innerStyle: CSSProperties = {
    position: 'absolute',
    left: cellPadding,
    top: cellPadding,
    width: columnWidth - ITEM_GAP,
    height: cardHeight,
  }
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e, movie)
  }
  
  return (
    <div style={adjustedStyle}>
      <div style={innerStyle}>
        <motion.div
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`movie-card relative w-full h-full rounded-xl overflow-hidden cursor-pointer border border-smoke-900/30 bg-obsidian-400/30 ${
            isSelected ? 'movie-card-selected' : ''
          }`}
          initial={false}
          animate={{
            borderColor: isSelected ? 'rgba(217, 149, 110, 0.8)' : 'rgba(45, 43, 50, 0.3)',
          }}
        >
          {/* Poster Container with Ken Burns */}
          <div className="thumbnail-container ken-burns-container">
            <div className="thumbnail-placeholder">
              {/* Shimmer loading effect */}
              <div className="absolute inset-0 shimmer" />
            </div>
            
            {posterUrl && (
              <img
                src={posterUrl}
                alt={movie.title || 'Movie poster'}
                className="thumbnail-image loaded"
                loading="lazy"
              />
            )}
            
            {/* No poster fallback */}
            {!posterUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <svg className="w-12 h-12 text-smoke-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-smoke-600 font-medium px-3 text-center line-clamp-2">
                  {movie.title || 'Untitled'}
                </span>
              </div>
            )}
          </div>

          {/* Gradient Overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent pointer-events-none"
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0.6 }}
            transition={{ duration: 0.2 }}
          />

          {/* Tags Indicator */}
          {movie.tags && movie.tags.length > 0 && (
            <div className="absolute top-2.5 left-2.5 flex gap-1">
              {movie.tags.slice(0, 3).map((tag) => (
                <motion.div
                  key={tag.id}
                  className="w-2.5 h-2.5 rounded-full shadow-lg"
                  style={{ 
                    backgroundColor: tag.color,
                    boxShadow: `0 0 6px ${tag.color}50`
                  }}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
              {movie.tags.length > 3 && (
                <span className="text-[9px] text-pearl-400/80 ml-0.5 font-medium">
                  +{movie.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Favorite Button */}
          <motion.button
            onClick={handleFavoriteToggle}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              movie.favorite
                ? 'bg-cinnabar-500/80 text-white shadow-lg shadow-cinnabar-500/30'
                : 'bg-obsidian-950/60 text-pearl-400/60 backdrop-blur-sm'
            }`}
            initial={false}
            animate={{ 
              opacity: movie.favorite || isHovered ? 1 : 0,
              scale: movie.favorite ? 1 : 0.9
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              className="w-4 h-4"
              fill={movie.favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ scale: movie.favorite ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </motion.svg>
          </motion.button>

          {/* Watched Badge */}
          {movie.watched && (
            <motion.div 
              className="absolute top-2.5 right-12 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}

          {/* Title Overlay */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none"
            initial={false}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 10
            }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-sm font-medium text-pearl-100 line-clamp-2 drop-shadow-lg">
              {movie.title || 'Untitled'}
            </h3>
            {movie.year && (
              <p className="text-xs text-smoke-400 mt-0.5 font-medium">{movie.year}</p>
            )}
            {movie.tmdb_rating && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3 h-3 text-bronze-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-smoke-300">{movie.tmdb_rating.toFixed(1)}</span>
              </div>
            )}
          </motion.div>

          {/* Play Button on Hover */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center shadow-xl shadow-bronze-500/30 cursor-pointer pointer-events-auto"
              onClick={handlePlayClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={false}
              animate={{ scale: isHovered ? 1 : 0.8 }}
            >
              <svg className="w-6 h-6 text-obsidian-900 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Selection Ring */}
          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-bronze-400 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              layoutId={`selection-${movie.id}`}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Memoized cell for performance
const MemoizedCell = memo(CellComponent)

export function VirtualizedGallery({ movies }: VirtualizedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const { selectedMovies, selectedIds, setSelectedMovie, updateMovieInState, removeMovieFromState, removeMoviesFromState } = useLibraryStore()
  
  // Context menu state
  const movieContextMenu = useContextMenu<Movie>()
  
  // Handle context menu open - if multiple movies selected, use those, otherwise use clicked movie
  const handleContextMenu = useCallback((e: React.MouseEvent, movie: Movie) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If right-clicked movie is already in selection, keep selection
    // Otherwise, select just this movie
    if (!selectedIds.has(movie.id)) {
      setSelectedMovie(movie)
    }
    
    movieContextMenu.open(e, movie)
  }, [selectedIds, setSelectedMovie, movieContextMenu])
  
  // Use useLayoutEffect to measure before paint
  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({ width: rect.width, height: rect.height })
        }
      }
    }
    
    // Initial measurement
    updateDimensions()
    
    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    // Also listen to window resize as fallback
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])
  
  // Calculate available content width (accounting for padding)
  const contentWidth = Math.max(0, dimensions.width - PADDING * 2)
  
  // Calculate responsive column count based on available width
  const columnCount = Math.max(1, Math.floor((contentWidth + ITEM_GAP) / (ITEM_MIN_WIDTH + ITEM_GAP)))
  const columnWidth = contentWidth / columnCount
  const actualRowCount = Math.ceil(movies.length / columnCount)
  
  // Calculate dynamic row height to maintain 2:3 poster aspect ratio
  const cardWidth = columnWidth - ITEM_GAP
  const cardHeight = cardWidth * POSTER_ASPECT_RATIO
  const rowHeight = cardHeight + ITEM_GAP
  
  // Add extra row to account for top/bottom padding in scroll area
  // This ensures scrolling to bottom shows the last row with proper padding
  const rowCount = actualRowCount + 1
  
  // Horizontal offset for left padding
  const horizontalOffset = PADDING
  
  const cellProps: CellData = {
    movies,
    columnCount,
    columnWidth,
    cardHeight,
    horizontalOffset,
    onContextMenu: handleContextMenu,
  }
  
  // Get the movies to operate on (selection or single clicked movie)
  const targetMovies = selectedMovies.length > 1 ? selectedMovies : 
    (movieContextMenu.state.data ? [movieContextMenu.state.data] : [])
  const isMultiSelect = targetMovies.length > 1
  
  // Context menu actions
  const handlePlay = useCallback(() => {
    if (targetMovies.length > 0) {
      window.api.playVideo(targetMovies[0].file_path)
    }
  }, [targetMovies])
  
  const handleToggleWatched = useCallback(async () => {
    const newWatched = !targetMovies.every(m => m.watched)
    for (const movie of targetMovies) {
      try {
        await window.api.updateMovie(movie.id, { watched: newWatched })
        updateMovieInState(movie.id, { watched: newWatched })
      } catch (error) {
        console.error('Failed to update watched status:', error)
      }
    }
  }, [targetMovies, updateMovieInState])
  
  const handleToggleFavorite = useCallback(async () => {
    const newFavorite = !targetMovies.every(m => m.favorite)
    for (const movie of targetMovies) {
      try {
        await window.api.updateMovie(movie.id, { favorite: newFavorite })
        updateMovieInState(movie.id, { favorite: newFavorite })
      } catch (error) {
        console.error('Failed to update favorite status:', error)
      }
    }
  }, [targetMovies, updateMovieInState])
  
  const handleShowInExplorer = useCallback(() => {
    if (targetMovies.length > 0) {
      window.api.openInExplorer(targetMovies[0].file_path)
    }
  }, [targetMovies])
  
  const handleRemoveFromLibrary = useCallback(async () => {
    const count = targetMovies.length
    const message = count > 1
      ? `Are you sure you want to remove ${count} movies from your library?`
      : `Are you sure you want to remove "${targetMovies[0]?.title || 'this movie'}" from your library?`
    
    if (!confirm(message)) return
    
    const ids = targetMovies.map(m => m.id)
    try {
      for (const id of ids) {
        await window.api.deleteMovie(id)
      }
      removeMoviesFromState(ids)
    } catch (error) {
      console.error('Failed to remove movies:', error)
    }
  }, [targetMovies, removeMoviesFromState])
  
  // Build context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'play',
      label: 'Play',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: handlePlay,
      disabled: isMultiSelect,
      divider: true,
    },
    {
      id: 'watched',
      label: targetMovies.every(m => m.watched) ? 'Mark as Unwatched' : 'Mark as Watched',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: handleToggleWatched,
    },
    {
      id: 'favorite',
      label: targetMovies.every(m => m.favorite) ? 'Remove from Favorites' : 'Add to Favorites',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      onClick: handleToggleFavorite,
      divider: true,
    },
    {
      id: 'show-in-explorer',
      label: 'Show in Explorer',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      onClick: handleShowInExplorer,
      disabled: isMultiSelect,
      divider: true,
    },
    {
      id: 'remove',
      label: isMultiSelect ? `Remove ${targetMovies.length} Movies` : 'Remove from Library',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: handleRemoveFromLibrary,
      danger: true,
    },
  ]
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        flex: 1, 
        overflow: 'hidden',
        minHeight: 0, // Important for flex children
      }}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Grid
          cellComponent={MemoizedCell}
          cellProps={cellProps}
          columnCount={columnCount}
          columnWidth={columnWidth}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={dimensions.width}
          height={dimensions.height}
          overscanCount={2}
        />
      )}
      
      {/* Movie Context Menu */}
      {movieContextMenu.state.isOpen && movieContextMenu.state.data && (
        <ContextMenu
          position={movieContextMenu.state.position}
          onClose={movieContextMenu.close}
          items={contextMenuItems}
          header={isMultiSelect ? (
            <span className="text-xs text-smoke-400 font-medium">
              {targetMovies.length} movies selected
            </span>
          ) : undefined}
        />
      )}
    </div>
  )
}
