import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import type { FilterType } from '../types'
import { fuzzySearchTags } from '../utils/fuzzySearch'
import { SearchBar } from './SearchBar'

const PRESET_COLORS = [
  '#C47F5A', '#D46B64', '#6B8F71', '#5B8FA8', '#9B7BB8',
  '#D4956E', '#8B9862', '#7B8FA8', '#A87B9B', '#B89B5B',
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  
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
      await loadMovies()
    } catch (error) {
      console.error('Failed to delete tag:', error)
    }
  }

  return (
    <motion.aside 
      className="glass border-r border-smoke-900/30 flex flex-col relative overflow-visible z-10"
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Collapse Toggle */}
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-obsidian-400 border border-smoke-800/50 flex items-center justify-center text-smoke-400 hover:text-pearl-200 hover:bg-obsidian-300 transition-colors shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.svg 
          className="w-3 h-3 pointer-events-none" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </motion.svg>
      </motion.button>

      {/* Library Section */}
      <motion.div 
        className="pt-4 pb-2"
        animate={{ paddingLeft: isCollapsed ? 8 : 16, paddingRight: isCollapsed ? 8 : 16 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Library Header */}
        <div className={`flex items-center mb-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h2 
                className="text-2xs font-semibold text-smoke-500 uppercase tracking-wider"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                Library
              </motion.h2>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddFolder}
            className="w-8 h-8 rounded-lg bg-obsidian-300/50 hover:bg-bronze-500/20 flex items-center justify-center text-smoke-400 hover:text-bronze-400 transition-colors flex-shrink-0"
            title="Add Folder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </div>
        
        {/* Search Bar */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SearchBar />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Filter Nav */}
        <nav className="space-y-1">
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(filter.id)}
              className={`w-full flex items-center rounded-lg transition-all relative overflow-hidden min-h-[44px] ${
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
              } ${
                activeFilter === filter.id
                  ? 'bg-bronze-500/10 text-bronze-400 sidebar-item-active'
                  : 'text-smoke-300 hover:bg-obsidian-300/30 hover:text-pearl-300'
              }`}
              title={isCollapsed ? `${filter.label} (${filter.count})` : undefined}
            >
              <span className={`flex-shrink-0 ${activeFilter === filter.id ? 'text-bronze-400' : 'text-smoke-500'}`}>
                {filter.icon}
              </span>
              <AnimatePresence>
                {!isCollapsed && (
                  <>
                    <motion.span 
                      className="flex-1 text-left text-sm font-medium"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {filter.label}
                    </motion.span>
                    <motion.span 
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        activeFilter === filter.id
                          ? 'bg-bronze-500/20 text-bronze-400'
                          : 'bg-obsidian-300/50 text-smoke-500'
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {filter.count}
                    </motion.span>
                  </>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* Divider */}
      <motion.div 
        className="flex items-center justify-center"
        animate={{ paddingLeft: isCollapsed ? 8 : 16, paddingRight: isCollapsed ? 8 : 16 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div 
          className="h-px bg-gradient-to-r from-transparent via-smoke-800/50 to-transparent"
          animate={{ width: '100%' }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>

      {/* Tags Section */}
      <motion.div 
        className="flex-1 pt-3 pb-2 overflow-y-auto overflow-x-hidden min-h-0"
        animate={{ paddingLeft: isCollapsed ? 8 : 16, paddingRight: isCollapsed ? 8 : 16 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Tags Header */}
        <div className={`flex items-center mb-3 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.h2 
                className="text-2xs font-semibold text-smoke-500 uppercase tracking-wider"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                Tags
              </motion.h2>
            )}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateTag(!showCreateTag)}
            className="w-8 h-8 rounded-lg bg-obsidian-300/50 hover:bg-bronze-500/20 flex items-center justify-center text-smoke-400 hover:text-bronze-400 transition-colors flex-shrink-0"
            title="Create Tag"
            animate={{ rotate: showCreateTag ? 45 : 0 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        </div>

        {/* Create Tag Form */}
        <AnimatePresence>
          {showCreateTag && !isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="glass-card rounded-xl p-3 space-y-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="w-full px-3 py-2 rounded-lg bg-obsidian-500/80 border border-smoke-800/50 text-pearl-200 text-sm placeholder-smoke-600 focus:border-bronze-500/50 focus:ring-1 focus:ring-bronze-500/20 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <motion.button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className="w-5 h-5 rounded-full transition-all"
                      style={{ backgroundColor: color }}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{
                        boxShadow: newTagColor === color 
                          ? `0 0 0 2px rgba(255,255,255,0.3), 0 0 8px ${color}` 
                          : 'none'
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleCreateTag}
                    className="flex-1 py-2 rounded-lg btn-primary text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create
                  </motion.button>
                  <motion.button
                    onClick={() => setShowCreateTag(false)}
                    className="px-4 py-2 rounded-lg btn-secondary text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag Search */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              className="mb-3 relative"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <input
                type="text"
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                placeholder="Search tags..."
                className="w-full px-3 py-2 rounded-lg bg-obsidian-500/50 border border-smoke-800/30 text-pearl-200 text-sm placeholder-smoke-600 focus:border-bronze-500/50 focus:outline-none transition-all pr-8"
              />
              {tagSearchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setTagSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-smoke-500 hover:text-pearl-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags List */}
        <nav className="space-y-1">
          {filteredTags.map((tag) => (
            <motion.div
              key={tag.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFilter(tag.id)}
              className={`w-full flex items-center rounded-lg transition-all group cursor-pointer min-h-[40px] ${
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
              } ${
                activeFilter === tag.id
                  ? 'bg-obsidian-300/40'
                  : 'hover:bg-obsidian-300/20'
              }`}
              title={isCollapsed ? `${tag.name} (${getTagCount(tag.id)})` : undefined}
            >
              {/* Tag Color Dot */}
              <motion.div
                className="rounded-full flex-shrink-0"
                animate={{ 
                  width: isCollapsed ? 12 : 12,
                  height: isCollapsed ? 12 : 12,
                }}
                style={{ 
                  backgroundColor: tag.color,
                  boxShadow: `inset 0 1px 2px rgba(0,0,0,0.3), 0 0 6px ${tag.color}50`
                }}
              />
              
              <AnimatePresence>
                {!isCollapsed && (
                  <>
                    <motion.span 
                      className={`flex-1 text-left text-sm truncate ${
                        activeFilter === tag.id ? 'text-pearl-200' : 'text-smoke-300'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {tag.name}
                    </motion.span>
                    <motion.span 
                      className="text-xs text-smoke-600 tabular-nums"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {getTagCount(tag.id)}
                    </motion.span>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTag(tag.id)
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-smoke-600 hover:text-cinnabar-400 hover:bg-cinnabar-500/10 transition-all opacity-0 group-hover:opacity-100"
                      initial={{ opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          
          {filteredTags.length === 0 && tagSearchQuery && !isCollapsed && (
            <p className="text-sm text-smoke-600 text-center py-4">
              No tags found
            </p>
          )}
          
          {tags.length === 0 && !showCreateTag && !tagSearchQuery && !isCollapsed && (
            <p className="text-sm text-smoke-600 text-center py-4">
              No tags yet
            </p>
          )}
        </nav>
      </motion.div>

      {/* Settings Button */}
      <motion.div 
        className="border-t border-smoke-900/30 py-3"
        animate={{ paddingLeft: isCollapsed ? 8 : 16, paddingRight: isCollapsed ? 8 : 16 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.button
          onClick={onOpenSettings}
          className={`w-full flex items-center rounded-lg text-smoke-400 hover:text-pearl-200 hover:bg-obsidian-300/30 transition-colors min-h-[44px] ${
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span 
                className="text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </motion.aside>
  )
}
