import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import type { FilterType } from '../types'
import { fuzzySearchTags } from '../utils/fuzzySearch'
import { SearchBar } from './SearchBar'

const PRESET_COLORS = [
  '#f4a261', '#e76f51', '#2a9d8f', '#264653', '#e9c46a',
  '#9b5de5', '#00bbf9', '#00f5d4', '#fee440', '#f15bb5',
]

interface SidebarProps {
  onAddFolder: () => void
  onOpenSettings: () => void
}

export function Sidebar({ onAddFolder, onOpenSettings }: SidebarProps) {
  const { tags, activeFilter, setActiveFilter, movies, addTagToState, removeTagFromState, loadMovies } = useLibraryStore()
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  
  const filteredTags = fuzzySearchTags(tags, tagSearchQuery)

  // Memoize filter counts to avoid recalculating on every render
  const filterCounts = useMemo(() => ({
    all: movies.length,
    untagged: movies.filter((m) => !m.tags || m.tags.length === 0).length,
    watched: movies.filter((m) => m.watched).length,
    favorites: movies.filter((m) => m.favorite).length,
  }), [movies])

  // Memoize tag counts - creates a Map for O(1) lookup per tag
  const tagCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const movie of movies) {
      if (movie.tags) {
        for (const tag of movie.tags) {
          counts.set(tag.id, (counts.get(tag.id) || 0) + 1)
        }
      }
    }
    return counts
  }, [movies])

  const getTagCount = (tagId: number) => tagCounts.get(tagId) || 0

  const filters: { id: FilterType; label: string; icon: JSX.Element; count: number }[] = [
    {
      id: 'all',
      label: 'All Movies',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      count: filterCounts.all,
    },
    {
      id: 'untagged',
      label: 'Untagged',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      count: filterCounts.untagged,
    },
    {
      id: 'watched',
      label: 'Watched',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      count: filterCounts.watched,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      count: filterCounts.favorites,
    },
  ]

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    
    try {
      const tag = await window.api.createTag(newTagName.trim(), newTagColor)
      addTagToState(tag)
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      setShowCreateTag(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleDeleteTag = async (tagId: number) => {
    const tag = tags.find((t) => t.id === tagId)
    if (!tag) return
    
    const movieCount = getTagCount(tagId)
    const warningMessage = movieCount > 0
      ? `Are you sure you want to delete the tag "${tag.name}"? This will remove the tag from ${movieCount} ${movieCount === 1 ? 'movie' : 'movies'}.`
      : `Are you sure you want to delete the tag "${tag.name}"?`
    
    if (!confirm(warningMessage)) return
    
    try {
      await window.api.deleteTag(tagId)
      removeTagFromState(tagId)
      // Refresh movies to update their tag associations
      await loadMovies()
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  return (
    <aside className="w-64 glass border-r border-charcoal-700/50 flex flex-col">
      {/* Library Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
            Library
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddFolder}
            className="w-6 h-6 rounded-md bg-charcoal-800 hover:bg-charcoal-700 flex items-center justify-center text-charcoal-400 hover:text-cream-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </div>
        
        {/* Search Bar */}
        <div className="mb-3">
          <SearchBar />
        </div>
        
        <nav className="space-y-1">
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(filter.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeFilter === filter.id
                  ? 'bg-amber-400/10 text-amber-400'
                  : 'text-cream-300 hover:bg-charcoal-800/50 hover:text-cream-100'
              }`}
            >
              {filter.icon}
              <span className="flex-1 text-left text-sm font-medium">{filter.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeFilter === filter.id
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'bg-charcoal-700/50 text-charcoal-400'
              }`}>
                {filter.count}
              </span>
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div className="px-4">
        <div className="h-px bg-charcoal-700/50" />
      </div>

      {/* Tags Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
            Tags
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateTag(!showCreateTag)}
            className="w-6 h-6 rounded-md bg-charcoal-800 hover:bg-charcoal-700 flex items-center justify-center text-charcoal-400 hover:text-cream-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </div>

        {/* Create Tag Form */}
        <AnimatePresence>
          {showCreateTag && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="glass-card rounded-lg p-3 space-y-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="w-full px-3 py-2 rounded-md bg-charcoal-800 border border-charcoal-700 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newTagColor === color ? 'scale-110 ring-2 ring-white/50' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTag}
                    className="flex-1 py-1.5 rounded-md bg-amber-400 text-charcoal-900 text-sm font-medium hover:bg-amber-300 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateTag(false)}
                    className="px-3 py-1.5 rounded-md bg-charcoal-700 text-cream-300 text-sm hover:bg-charcoal-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag Search */}
        <div className="mb-3 relative">
          <input
            type="text"
            value={tagSearchQuery}
            onChange={(e) => setTagSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full px-3 py-2 rounded-md bg-charcoal-800 border border-charcoal-700 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none transition-colors pr-10"
          />
          {tagSearchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setTagSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-cream-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          )}
        </div>

        {/* Tags List */}
        <nav className="space-y-1">
          {filteredTags.map((tag) => (
            <motion.div
              key={tag.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(tag.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group cursor-pointer ${
                activeFilter === tag.id
                  ? 'bg-charcoal-800'
                  : 'hover:bg-charcoal-800/50'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className={`flex-1 text-left text-sm ${
                activeFilter === tag.id ? 'text-cream-100' : 'text-cream-300'
              }`}>
                {tag.name}
              </span>
              <span className="text-xs text-charcoal-500">{getTagCount(tag.id)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTag(tag.id)
                }}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-red-500/20 flex items-center justify-center text-charcoal-500 hover:text-red-400 transition-all"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
          
          {filteredTags.length === 0 && tagSearchQuery && (
            <p className="text-sm text-charcoal-500 text-center py-4">
              No tags found matching "{tagSearchQuery}"
            </p>
          )}
          
          {tags.length === 0 && !showCreateTag && !tagSearchQuery && (
            <p className="text-sm text-charcoal-500 text-center py-4">
              No tags yet. Click + to create one.
            </p>
          )}
        </nav>
      </div>

      {/* Settings Button */}
      <div className="p-4 border-t border-charcoal-700/50">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-charcoal-400 hover:text-cream-200 hover:bg-charcoal-800/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </aside>
  )
}

