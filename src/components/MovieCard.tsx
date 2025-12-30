import { memo } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import type { Movie } from '../types'
import { useInView } from '../hooks/useInView'

interface MovieCardProps {
  movie: Movie
  index: number
}

function MovieCardComponent({ movie, index }: MovieCardProps) {
  const { selectedMovies, toggleMovieSelection, updateMovieInState } = useLibraryStore()
  const isSelected = selectedMovies.some(m => m.id === movie.id)
  const { ref, isInView } = useInView({ threshold: 0.1, rootMargin: '100px', triggerOnce: true })

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

  const thumbnailUrl = getThumbnailUrl()
  const shouldLoadImage = isInView && thumbnailUrl

  return (
    <motion.div
      ref={ref}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`movie-card relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group ${
        isSelected ? 'movie-card-selected' : ''
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <>
          {shouldLoadImage ? (
            <img
              src={thumbnailUrl}
              alt={movie.title || 'Movie thumbnail'}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-charcoal-800 to-charcoal-900 animate-pulse" />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal-800 to-charcoal-900 flex items-center justify-center">
          <svg className="w-12 h-12 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      )}

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
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-14 h-14 rounded-full bg-amber-400/90 flex items-center justify-center shadow-xl"
        >
          <svg className="w-6 h-6 text-charcoal-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Memoize component to prevent unnecessary re-renders
export const MovieCard = memo(MovieCardComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render), false if different (re-render)
  // We need to check selection state separately since it's not in props
  // For now, let React.memo handle the comparison and we'll rely on the store's selection check
  const moviePropsEqual = 
    prevProps.movie.id === nextProps.movie.id &&
    prevProps.movie.title === nextProps.movie.title &&
    prevProps.movie.favorite === nextProps.movie.favorite &&
    prevProps.movie.watched === nextProps.movie.watched &&
    prevProps.movie.thumbnail_path === nextProps.movie.thumbnail_path &&
    JSON.stringify(prevProps.movie.tags) === JSON.stringify(nextProps.movie.tags) &&
    prevProps.index === nextProps.index
  
  return moviePropsEqual
})

