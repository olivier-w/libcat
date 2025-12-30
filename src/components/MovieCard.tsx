import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import type { Movie } from '../types'

interface MovieCardProps {
  movie: Movie
  index: number
  shouldLoadImage: boolean
  onObserve: (element: HTMLElement | null) => void
}

function MovieCardComponent({ movie, index, shouldLoadImage, onObserve }: MovieCardProps) {
  const { selectedMovies, toggleMovieSelection, updateMovieInState } = useLibraryStore()
  const isSelected = selectedMovies.some(m => m.id === movie.id)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleDoubleClick = () => {
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

  const getThumbnailUrl = () => {
    if (!movie.thumbnail_path) return null
    // Use custom protocol to load local files (extra slash for Windows absolute paths)
    return `local-file:///${movie.thumbnail_path.replace(/\\/g, '/')}`
  }

  const handleClick = (e: React.MouseEvent) => {
    toggleMovieSelection(movie, index, e.shiftKey, e.ctrlKey || e.metaKey)
  }

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const thumbnailUrl = getThumbnailUrl()

  return (
    <div
      ref={onObserve}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`movie-card relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group ${
        isSelected ? 'movie-card-selected' : ''
      }`}
    >
      {/* Thumbnail with smooth fade-in */}
      <div className="thumbnail-container">
        {/* Always show placeholder for smooth crossfade */}
        <div className="thumbnail-placeholder" />
        
        {thumbnailUrl && shouldLoadImage && (
          <img
            src={thumbnailUrl}
            alt={movie.title || 'Movie thumbnail'}
            className={`thumbnail-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={handleImageLoad}
          />
        )}
        
        {/* No thumbnail fallback icon */}
        {!thumbnailUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

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
      <motion.button
        onClick={handleFavoriteToggle}
        className={`absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          movie.favorite
            ? 'bg-red-500/80 text-white'
            : 'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100'
        }`}
        whileHover={{ scale: 1.1 }}
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

      {/* Watched Badge */}
      {movie.watched && (
        <div className="absolute top-2 right-12 w-6 h-6 rounded-full bg-green-500/80 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <h3 className="text-sm font-medium text-white line-clamp-2 drop-shadow-lg">
          {movie.title || 'Untitled'}
        </h3>
        {movie.year && (
          <p className="text-xs text-white/70 mt-0.5">{movie.year}</p>
        )}
      </div>

      {/* Play Button on Hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-14 h-14 rounded-full bg-amber-400/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
          <svg className="w-6 h-6 text-charcoal-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// Optimized memo comparison - avoid JSON.stringify
export const MovieCard = memo(MovieCardComponent, (prevProps, nextProps) => {
  // Quick checks first
  if (prevProps.movie.id !== nextProps.movie.id) return false
  if (prevProps.index !== nextProps.index) return false
  if (prevProps.shouldLoadImage !== nextProps.shouldLoadImage) return false
  
  // Check mutable movie properties
  if (prevProps.movie.title !== nextProps.movie.title) return false
  if (prevProps.movie.favorite !== nextProps.movie.favorite) return false
  if (prevProps.movie.watched !== nextProps.movie.watched) return false
  if (prevProps.movie.thumbnail_path !== nextProps.movie.thumbnail_path) return false
  
  // For tags, just check length and reference - deep equality rarely needed
  const prevTags = prevProps.movie.tags
  const nextTags = nextProps.movie.tags
  if (prevTags === nextTags) return true
  if (!prevTags || !nextTags) return prevTags === nextTags
  if (prevTags.length !== nextTags.length) return false
  
  // Same length, same reference check for first few items
  for (let i = 0; i < Math.min(prevTags.length, 3); i++) {
    if (prevTags[i].id !== nextTags[i].id || prevTags[i].color !== nextTags[i].color) {
      return false
    }
  }
  
  return true
})
