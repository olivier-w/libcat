import { useRef, useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import { MovieCard } from './MovieCard'
import { ListView } from './ListView'
import { VirtualizedGallery } from './VirtualizedGallery'
import { useVisibleItems } from '../hooks/useVisibleItems'
import type { SortColumn } from '../types'

// Threshold for switching to virtualized grid (preserves smooth animations for smaller libraries)
const VIRTUALIZATION_THRESHOLD = 1000

const SORT_OPTIONS: { value: SortColumn; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'created_at', label: 'Added' },
  { value: 'file_size', label: 'Size' },
  { value: 'duration', label: 'Duration' },
]

export function Gallery() {
  const { 
    filteredMovies, 
    activeFilter, 
    tags, 
    viewMode, 
    setViewMode,
    sortColumn,
    sortDirection,
    setSortColumn,
    setSortDirection,
  } = useLibraryStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)

  // Memoized sorted movies for performance
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

  // Only use IntersectionObserver for non-virtualized mode
  const useVirtualization = sortedMovies.length > VIRTUALIZATION_THRESHOLD
  const { observe, isVisible } = useVisibleItems(useVirtualization ? { current: null } : scrollContainerRef)

  const handleSortChange = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'created_at' ? 'desc' : 'asc')
    }
    setSortDropdownOpen(false)
  }

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortColumn)?.label || 'Sort'

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
            {sortedMovies.length} {sortedMovies.length === 1 ? 'movie' : 'movies'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Controls */}
          <div className="relative">
            <div className="flex items-center">
              {/* Sort dropdown */}
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-charcoal-300 hover:text-cream-200 bg-charcoal-800/50 rounded-l-lg border-r border-charcoal-700/50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                {currentSortLabel}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Direction toggle */}
              <button
                onClick={toggleSortDirection}
                className="flex items-center justify-center w-8 h-8 text-charcoal-300 hover:text-cream-200 bg-charcoal-800/50 rounded-r-lg transition-colors"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDirection === 'asc' ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Dropdown menu */}
            {sortDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setSortDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-charcoal-800 border border-charcoal-700 rounded-lg shadow-xl py-1 min-w-[120px]">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                        sortColumn === option.value
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-charcoal-300 hover:text-cream-200 hover:bg-charcoal-700/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
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
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <ListView sortedMovies={sortedMovies} />
      ) : sortedMovies.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
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
      ) : useVirtualization ? (
        // Virtualized grid for large collections (1000+ movies)
        <VirtualizedGallery movies={sortedMovies} />
      ) : (
        // Regular grid with animations for smaller collections
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {sortedMovies.map((movie, index) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                index={index}
                shouldLoadImage={isVisible(movie.id)}
                onObserve={createObserveCallback(movie.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
