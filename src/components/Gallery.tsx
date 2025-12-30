import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import { MovieCard } from './MovieCard'
import { ListView } from './ListView'
import { useVisibleItems } from '../hooks/useVisibleItems'

export function Gallery() {
  const { filteredMovies, activeFilter, tags, viewMode, setViewMode } = useLibraryStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { observe, isVisible } = useVisibleItems(scrollContainerRef)

  const getFilterTitle = () => {
    if (activeFilter === 'all') return 'All Movies'
    if (activeFilter === 'untagged') return 'Untagged Movies'
    if (activeFilter === 'watched') return 'Watched Movies'
    if (activeFilter === 'favorites') return 'Favorite Movies'
    const tag = tags.find((t) => t.id === activeFilter)
    return tag ? `Tagged: ${tag.name}` : 'Movies'
  }

  // Create a stable callback for each movie to register with observer
  const createObserveCallback = useCallback(
    (movieId: number) => (element: HTMLElement | null) => {
      if (element) {
        observe(element, movieId)
      }
    },
    [observe]
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-charcoal-800/50">
        <div>
          <h1 className="font-heading text-xl font-semibold text-cream-100">
            {getFilterTitle()}
          </h1>
          <p className="text-sm text-charcoal-400 mt-0.5">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-charcoal-800/50 rounded-lg p-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-amber-400/20 text-amber-400'
                : 'text-charcoal-400 hover:text-cream-200'
            }`}
            title="Grid view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-amber-400/20 text-amber-400'
                : 'text-charcoal-400 hover:text-cream-200'
            }`}
            title="List view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <ListView />
      ) : (
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
          {filteredMovies.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
              {filteredMovies.map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  index={index}
                  shouldLoadImage={isVisible(movie.id)}
                  onObserve={createObserveCallback(movie.id)}
                />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-charcoal-800/50 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-cream-200 mb-2">No movies found</h3>
              <p className="text-sm text-charcoal-400 max-w-xs">
                {activeFilter === 'all' 
                  ? 'Add a folder or drop some video files to get started.'
                  : 'No movies match the current filter.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
