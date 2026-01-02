import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Movie, TMDBSearchResult } from '../types'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200'

interface TMDBSearchModalProps {
  isOpen: boolean
  onClose: () => void
  movie: Movie
  onLinked: (updatedMovie: Movie) => void
}

export function TMDBSearchModal({ isOpen, onClose, movie, onLinked }: TMDBSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchYear, setSearchYear] = useState('')
  const [results, setResults] = useState<TMDBSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLinking, setIsLinking] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && movie) {
      setSearchQuery(movie.title || '')
      setSearchYear(movie.year?.toString() || '')
      setResults([])
      setError(null)
    }
  }, [isOpen, movie])

  const performSearch = useCallback(async (query: string, year?: number) => {
    if (!query.trim()) { setResults([]); return }
    setIsSearching(true)
    setError(null)
    try {
      const searchResults = await window.api.tmdbSearch(query.trim(), year)
      setResults(searchResults)
    } catch (err: any) {
      setError(err.message || 'Search failed')
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const year = searchYear ? parseInt(searchYear) : undefined
      performSearch(searchQuery, year)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, searchYear, performSearch])

  const handleLink = async (tmdbId: number) => {
    setIsLinking(tmdbId)
    setError(null)
    try {
      const updatedMovie = await window.api.tmdbLinkMovie(movie.id, tmdbId)
      onLinked(updatedMovie)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to link movie')
    } finally {
      setIsLinking(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 modal-backdrop z-50" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl glass-card rounded-2xl border border-smoke-800/50 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-smoke-800/30 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* TMDB Badge */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#01b4e4] to-[#90cea1] flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-pearl-100">Search TMDB</h2>
                    <p className="text-xs text-smoke-600 mt-0.5">Find the correct match for "{movie.title || 'Untitled'}"</p>
                  </div>
                </div>
                <motion.button 
                  onClick={onClose} 
                  className="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Search Inputs */}
              <div className="px-6 py-4 border-b border-smoke-800/30 flex-shrink-0">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-2xs text-smoke-600 uppercase tracking-wider mb-1.5 block font-medium">Title</label>
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Search movie title..." 
                      className="w-full px-4 py-2.5 rounded-xl input-field text-sm" 
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-2xs text-smoke-600 uppercase tracking-wider mb-1.5 block font-medium">Year</label>
                    <input 
                      type="number" 
                      value={searchYear} 
                      onChange={(e) => setSearchYear(e.target.value)} 
                      placeholder="YYYY" 
                      className="w-full px-3 py-2.5 rounded-xl input-field text-sm text-center" 
                    />
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-4">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-cinnabar-500/10 border border-cinnabar-500/20 text-cinnabar-400 text-sm mb-4"
                  >
                    {error}
                  </motion.div>
                )}
                
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-smoke-500">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm">Searching...</span>
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-smoke-600">
                    <div className="w-16 h-16 rounded-2xl bg-obsidian-500/50 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm">{searchQuery ? 'No results found' : 'Enter a search term'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <motion.div 
                        key={result.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 p-3 rounded-xl bg-obsidian-500/30 hover:bg-obsidian-400/40 transition-colors group"
                      >
                        {/* Poster */}
                        <div className="w-16 h-24 rounded-lg bg-obsidian-600/50 overflow-hidden flex-shrink-0">
                          {result.poster_path ? (
                            <img 
                              src={`${TMDB_IMAGE_BASE}${result.poster_path}`} 
                              alt={result.title} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-smoke-700">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-pearl-200 truncate">{result.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-smoke-500">
                            <span>{result.release_date ? new Date(result.release_date).getFullYear() : 'Unknown'}</span>
                            {result.vote_average > 0 && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-bronze-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {result.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {result.overview && (
                            <p className="text-xs text-smoke-600 mt-2 line-clamp-2">{result.overview}</p>
                          )}
                        </div>

                        {/* Link Button */}
                        <motion.button 
                          onClick={() => handleLink(result.id)} 
                          disabled={isLinking !== null}
                          className="flex-shrink-0 self-center px-4 py-2 rounded-lg bg-[#01b4e4]/15 text-[#01b4e4] text-sm font-medium border border-[#01b4e4]/20 hover:bg-[#01b4e4]/25 hover:border-[#01b4e4]/30 disabled:opacity-50 transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isLinking === result.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Linking
                            </span>
                          ) : 'Link'}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
