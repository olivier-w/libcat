import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useLibraryStore()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [isFocused, setIsFocused] = useState(false)
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
    <div className="relative w-full group">
      {/* Background glow on focus */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-bronze-500/10 blur-sm"
        initial={false}
        animate={{ opacity: isFocused ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Search icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <motion.svg 
          className="w-4 h-4"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ 
            color: isFocused ? '#D9956E' : '#6E6978'
          }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </motion.svg>
      </div>
      
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search movies..."
        className="relative w-full pl-10 pr-10 py-2.5 rounded-lg bg-obsidian-500/60 border border-smoke-800/40 text-pearl-200 text-sm placeholder-smoke-600 focus:border-bronze-500/50 focus:ring-1 focus:ring-bronze-500/20 focus:outline-none transition-all"
      />

      {/* Clear button */}
      <AnimatePresence>
        {localQuery && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-smoke-500 hover:text-pearl-300 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut hint */}
      <AnimatePresence>
        {!isFocused && !localQuery && (
          <motion.div
            className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-2xs text-smoke-700 bg-obsidian-400/50 px-1.5 py-0.5 rounded font-mono">
              Ctrl+F
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
