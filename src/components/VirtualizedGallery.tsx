import { memo, useState, useCallback, type CSSProperties, type ReactElement } from 'react'
import { Grid, type CellComponentProps } from 'react-window'
import { useLibraryStore } from '../stores/libraryStore'
import type { Movie } from '../types'

// Grid dimensions - matching the CSS grid minmax(180px, 1fr) + gap
const ITEM_MIN_WIDTH = 180
const ITEM_GAP = 20 // gap-5 = 1.25rem = 20px
const ITEM_HEIGHT = 300 // aspect-ratio 2:3: ~200px width → 300px height
const PADDING = 24 // p-6

interface VirtualizedGalleryProps {
  movies: Movie[]
}

interface CellData {
  movies: Movie[]
  columnCount: number
  columnWidth: number
}

// Cell component for the Grid
function CellComponent({
  columnIndex,
  rowIndex,
  style,
  movies,
  columnCount,
  columnWidth,
}: CellComponentProps<CellData>): ReactElement | null {
  const { selectedIds, toggleMovieSelection, updateMovieInState } = useLibraryStore()
  
  const index = rowIndex * columnCount + columnIndex
  
  // Handle empty cells in the last row
  if (index >= movies.length) {
    return <div style={style} />
  }
  
  const movie = movies[index]
  const isSelected = selectedIds.has(movie.id)
  
  const handleClick = (e: React.MouseEvent) => {
    toggleMovieSelection(movie, index, e.shiftKey, e.ctrlKey || e.metaKey)
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
  
  // Apply padding inside the cell for gap effect
  const cellPadding = ITEM_GAP / 2
  const innerStyle: CSSProperties = {
    position: 'absolute',
    left: cellPadding,
    top: cellPadding,
    width: columnWidth - ITEM_GAP,
    height: ITEM_HEIGHT - ITEM_GAP,
  }
  
  return (
    <div style={style}>
      <div style={innerStyle}>
        <div
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={`movie-card relative w-full h-full rounded-xl overflow-hidden cursor-pointer group ${
            isSelected ? 'movie-card-selected' : ''
          }`}
        >
          {/* Poster */}
          <div className="thumbnail-container">
            <div className="thumbnail-placeholder" />
            
            {posterUrl && (
              <img
                src={posterUrl}
                alt={movie.title || 'Movie poster'}
                className="thumbnail-image loaded"
                loading="lazy"
              />
            )}
            
            {/* No poster fallback icon */}
            {!posterUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

          {/* Tags Indicator */}
          {movie.tags && movie.tags.length > 0 && (
            <div className="absolute top-2 left-2 flex gap-1">
              {movie.tags.slice(0, 3).map((tag) => (
                <div
                  key={tag.id}
                  className="w-2 h-2 rounded-full shadow-lg"
                  style={{ backgroundColor: tag.color }}
                />
              ))}
              {movie.tags.length > 3 && (
                <span className="text-[10px] text-white/80 ml-0.5">+{movie.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteToggle}
            className={`absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${
              movie.favorite
                ? 'bg-red-500/80 text-white'
                : 'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100'
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

          {/* Watched Badge */}
          {movie.watched && (
            <div className="absolute top-2 right-12 w-6 h-6 rounded-full bg-green-500/80 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <h3 className="text-sm font-medium text-white line-clamp-2 drop-shadow-lg">
              {movie.title || 'Untitled'}
            </h3>
            {movie.year && (
              <p className="text-xs text-white/70 mt-0.5">{movie.year}</p>
            )}
          </div>

          {/* Play Button on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div 
              className="w-14 h-14 rounded-full bg-amber-400/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform pointer-events-auto cursor-pointer" 
              onClick={handlePlayClick}
            >
              <svg className="w-6 h-6 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Memoized cell for performance
const MemoizedCell = memo(CellComponent)

export function VirtualizedGallery({ movies }: VirtualizedGalleryProps) {
  // Track container width to calculate responsive column count
  const [containerWidth, setContainerWidth] = useState(800) // Default estimate
  
  // Handle resize events from Grid
  const handleResize = useCallback((size: { width: number; height: number }) => {
    setContainerWidth(size.width)
  }, [])
  
  // Calculate responsive column count based on container width
  const contentWidth = containerWidth - PADDING * 2
  const columnCount = Math.max(1, Math.floor((contentWidth + ITEM_GAP) / (ITEM_MIN_WIDTH + ITEM_GAP)))
  const columnWidth = contentWidth / columnCount
  const rowCount = Math.ceil(movies.length / columnCount)
  
  const cellProps: CellData = {
    movies,
    columnCount,
    columnWidth,
  }
  
  return (
    <div className="flex-1 overflow-hidden" style={{ padding: PADDING }}>
      <Grid
        cellComponent={MemoizedCell}
        cellProps={cellProps}
        columnCount={columnCount}
        columnWidth={columnWidth}
        rowCount={rowCount}
        rowHeight={ITEM_HEIGHT}
        overscanCount={2}
        onResize={handleResize}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
