import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useLibraryStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localQuery)
    }, 200)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [localQuery, setSearchQuery])

  useEffect(() => {
    // Keyboard shortcut: Ctrl/Cmd + F to focus search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
        setLocalQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClear = () => {
    setLocalQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative flex-1 max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search movies... (Ctrl+F)"
        className="w-full pl-10 pr-10 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-all"
      />

      {localQuery && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-cream-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      )}
    </div>
  )
}

