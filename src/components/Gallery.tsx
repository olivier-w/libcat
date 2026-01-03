import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import { ListView } from './ListView'
import { VirtualizedGallery } from './VirtualizedGallery'
import type { SortColumn } from '../types'

const SORT_OPTIONS: { value: SortColumn; label: string; icon: JSX.Element }[] = [
  { 
    value: 'title', 
    label: 'Title',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6" /></svg>
  },
  { 
    value: 'created_at', 
    label: 'Added',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  },
  { 
    value: 'file_size', 
    label: 'Size',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>
  },
  { 
    value: 'duration', 
    label: 'Duration',
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  },
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
    setSelectedMovies,
  } = useLibraryStore()
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

  // Keyboard shortcut: Ctrl+A / Cmd+A to select all movies in current view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const activeEl = document.activeElement
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
        return
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setSelectedMovies(sortedMovies)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sortedMovies, setSelectedMovies])

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

  const currentSortOption = SORT_OPTIONS.find(o => o.value === sortColumn)

  const getFilterTitle = () => {
    if (activeFilter === 'all') return 'All Movies'
    if (activeFilter === 'untagged') return 'Untagged'
    if (activeFilter === 'watched') return 'Watched'
    if (activeFilter === 'unwatched') return 'Unwatched'
    if (activeFilter === 'favorites') return 'Favorites'
    const tag = tags.find((t) => t.id === activeFilter)
    return tag ? tag.name : 'Movies'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-cinematic">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-smoke-900/30">
        <div>
          <motion.h1 
            className="font-heading text-xl font-semibold text-pearl-100 tracking-tight"
            key={getFilterTitle()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {getFilterTitle()}
          </motion.h1>
          <motion.p 
            className="text-sm text-smoke-500 mt-0.5"
            key={sortedMovies.length}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {sortedMovies.length} {sortedMovies.length === 1 ? 'movie' : 'movies'}
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Controls */}
          <div className="relative">
            <div className="flex items-center">
              {/* Sort dropdown */}
              <motion.button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-smoke-300 hover:text-pearl-200 bg-obsidian-400/50 hover:bg-obsidian-300/50 rounded-l-lg border-r border-obsidian-600/50 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {currentSortOption?.icon}
                <span className="font-medium">{currentSortOption?.label}</span>
                <motion.svg 
                  className="w-3 h-3 text-smoke-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: sortDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.button>
              
              {/* Direction toggle */}
              <motion.button
                onClick={toggleSortDirection}
                className="flex items-center justify-center w-9 h-9 text-smoke-400 hover:text-pearl-200 bg-obsidian-400/50 hover:bg-obsidian-300/50 rounded-r-lg transition-all"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: sortDirection === 'asc' ? 0 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </motion.svg>
              </motion.button>
            </div>
            
            {/* Dropdown menu */}
            <AnimatePresence>
              {sortDropdownOpen && (
                <>
                  <motion.div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setSortDropdownOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                  <motion.div 
                    className="absolute right-0 top-full mt-2 z-20 bg-obsidian-400/95 backdrop-blur-xl border border-smoke-800/50 rounded-xl shadow-2xl py-1.5 min-w-[140px] overflow-hidden"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    {SORT_OPTIONS.map((option, index) => (
                      <motion.button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                          sortColumn === option.value
                            ? 'text-bronze-400 bg-bronze-500/10'
                            : 'text-smoke-300 hover:text-pearl-200 hover:bg-obsidian-300/50'
                        }`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        {option.icon}
                        {option.label}
                        {sortColumn === option.value && (
                          <svg className="w-3 h-3 ml-auto text-bronze-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-obsidian-400/50 rounded-lg p-1">
            <motion.button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-bronze-500/20 text-bronze-400 shadow-sm'
                  : 'text-smoke-500 hover:text-pearl-300'
              }`}
              title="Grid view"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </motion.button>
            <motion.button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-bronze-500/20 text-bronze-400 shadow-sm'
                  : 'text-smoke-500 hover:text-pearl-300'
              }`}
              title="List view"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="popLayout">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            className="flex-1 flex flex-col overflow-hidden"
            style={{ minHeight: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ListView sortedMovies={sortedMovies} />
          </motion.div>
        ) : sortedMovies.length === 0 ? (
          <motion.div 
            key="empty"
            className="flex-1 flex flex-col items-center justify-center text-center p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="w-24 h-24 rounded-2xl bg-obsidian-400/30 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-bronze-500/10 to-transparent" />
              <svg className="w-12 h-12 text-smoke-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-semibold text-pearl-300 mb-2">No movies found</h3>
            <p className="text-sm text-smoke-500 max-w-xs leading-relaxed">
              {activeFilter === 'all' 
                ? 'Add a folder or drop video files here to start building your library.'
                : 'No movies match the current filter. Try selecting a different category.'}
            </p>
            {activeFilter === 'all' && (
              <motion.button
                className="mt-6 px-5 py-2.5 rounded-lg btn-primary text-sm flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Movies
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="flex-1 flex flex-col overflow-hidden"
            style={{ minHeight: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <VirtualizedGallery movies={sortedMovies} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
