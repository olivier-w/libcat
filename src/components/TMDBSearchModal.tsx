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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl glass-card rounded-2xl border border-charcoal-700/50 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              <div className="px-6 py-4 border-b border-charcoal-700/50 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-heading font-semibold text-cream-100">Search TMDB</h2>
                  <p className="text-xs text-charcoal-400 mt-0.5">Find the correct match for "{movie.title || 'Untitled'}"</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-charcoal-700/50 flex items-center justify-center text-charcoal-400 hover:text-cream-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="px-6 py-4 border-b border-charcoal-700/50 flex-shrink-0">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-charcoal-400 uppercase tracking-wider mb-1.5 block">Title</label>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search movie title..." className="w-full px-4 py-2.5 rounded-lg bg-charcoal-800/80 border border-charcoal-700/50 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-charcoal-400 uppercase tracking-wider mb-1.5 block">Year</label>
                    <input type="number" value={searchYear} onChange={(e) => setSearchYear(e.target.value)} placeholder="YYYY" className="w-full px-3 py-2.5 rounded-lg bg-charcoal-800/80 border border-charcoal-700/50 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>}
                {isSearching ? (
                  <div className="flex items-center justify-center py-12"><div className="flex items-center gap-3 text-charcoal-400"><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Searching...</div></div>
                ) : results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-charcoal-400"><svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg><p className="text-sm">{searchQuery ? 'No results found' : 'Enter a search term'}</p></div>
                ) : (
                  <div className="space-y-2">
                    {results.map((result) => (
                      <motion.div key={result.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 p-3 rounded-xl bg-charcoal-800/50 hover:bg-charcoal-700/50 transition-colors">
                        <div className="w-16 h-24 rounded-lg bg-charcoal-700/50 overflow-hidden flex-shrink-0">
                          {result.poster_path ? <img src={`${TMDB_IMAGE_BASE}${result.poster_path}`} alt={result.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-charcoal-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-cream-100 truncate">{result.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-charcoal-400">
                            <span>{result.release_date ? new Date(result.release_date).getFullYear() : 'Unknown'}</span>
                            {result.vote_average > 0 && <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>{result.vote_average.toFixed(1)}</span>}
                          </div>
                          {result.overview && <p className="text-xs text-charcoal-500 mt-2 line-clamp-2">{result.overview}</p>}
                        </div>
                        <button onClick={() => handleLink(result.id)} disabled={isLinking !== null} className="flex-shrink-0 self-center px-4 py-2 rounded-lg bg-amber-400/10 text-amber-400 text-sm font-medium hover:bg-amber-400/20 disabled:opacity-50">
                          {isLinking === result.id ? 'Linking...' : 'Link'}
                        </button>
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
