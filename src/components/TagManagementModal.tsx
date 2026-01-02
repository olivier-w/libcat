import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'
import { fuzzySearchTags } from '../utils/fuzzySearch'
import type { Tag } from '../types'
import { PRESET_COLORS } from './Sidebar'
import { ColorPicker } from './ColorPicker'

interface TagManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

type SortField = 'name' | 'count' | 'created_at'
type SortDirection = 'asc' | 'desc'

export function TagManagementModal({ isOpen, onClose }: TagManagementModalProps) {
  const { tags, movies, addTagToState, updateTagInState, removeTagFromState, loadMovies } = useLibraryStore()
  const addToast = useToastStore((state) => state.addToast)
  
  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Create tag state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  
  // Edit tag state
  const [editingTagId, setEditingTagId] = useState<number | null>(null)
  const [editTagName, setEditTagName] = useState('')
  const [editTagColor, setEditTagColor] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  
  const createInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Calculate tag counts
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

  // Filter and sort tags
  const processedTags = useMemo(() => {
    let result = fuzzySearchTags(tags, searchQuery)
    
    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'count':
          comparison = getTagCount(a.id) - getTagCount(b.id)
          break
        case 'created_at':
          comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return result
  }, [tags, searchQuery, sortField, sortDirection, tagCounts])

  // Focus input when entering create mode
  useEffect(() => {
    if (showCreateForm && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [showCreateForm])

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingTagId !== null && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingTagId])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setShowCreateForm(false)
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      setCreateError(null)
      setEditingTagId(null)
      setEditTagName('')
      setEditTagColor('')
      setEditError(null)
    }
  }, [isOpen])

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  // Create tag
  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim()
    if (!trimmedName) {
      setCreateError('Tag name is required')
      return
    }
    
    if (trimmedName.length > 50) {
      setCreateError('Tag name is too long (max 50 characters)')
      return
    }

    // Check for duplicate
    const duplicate = tags.find(t => t.name.toLowerCase() === trimmedName.toLowerCase())
    if (duplicate) {
      setCreateError('A tag with this name already exists')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const tag = await window.api.createTag(trimmedName, newTagColor)
      addTagToState(tag)
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      setShowCreateForm(false)
      addToast(`Tag "${tag.name}" created`, 'success')
    } catch (error: any) {
      console.error('Failed to create tag:', error)
      if (error.message?.includes('UNIQUE constraint')) {
        setCreateError('A tag with this name already exists')
      } else {
        setCreateError('Failed to create tag')
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Start editing
  const handleStartEdit = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditTagName(tag.name)
    setEditTagColor(tag.color)
    setEditError(null)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingTagId(null)
    setEditTagName('')
    setEditTagColor('')
    setEditError(null)
  }

  // Save edit
  const handleSaveEdit = async () => {
    if (editingTagId === null) return

    const trimmedName = editTagName.trim()
    if (!trimmedName) {
      setEditError('Tag name is required')
      return
    }
    
    if (trimmedName.length > 50) {
      setEditError('Tag name is too long (max 50 characters)')
      return
    }

    // Check for duplicate (excluding current tag)
    const duplicate = tags.find(
      t => t.id !== editingTagId && t.name.toLowerCase() === trimmedName.toLowerCase()
    )
    if (duplicate) {
      setEditError('A tag with this name already exists')
      return
    }

    setIsSavingEdit(true)
    setEditError(null)

    try {
      const updatedTag = await window.api.updateTag(editingTagId, trimmedName, editTagColor)
      updateTagInState(editingTagId, { name: updatedTag.name, color: updatedTag.color })
      await loadMovies()
      handleCancelEdit()
      addToast(`Tag "${updatedTag.name}" updated`, 'success')
    } catch (error: any) {
      console.error('Failed to update tag:', error)
      if (error.message?.includes('UNIQUE constraint')) {
        setEditError('A tag with this name already exists')
      } else {
        setEditError('Failed to save changes')
      }
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Delete tag
  const handleDeleteTag = async (tag: Tag) => {
    const movieCount = getTagCount(tag.id)
    const warningMessage = movieCount > 0
      ? `Are you sure you want to delete "${tag.name}"? This will remove the tag from ${movieCount} ${movieCount === 1 ? 'movie' : 'movies'}.`
      : `Are you sure you want to delete "${tag.name}"?`
    
    if (!confirm(warningMessage)) return

    try {
      await window.api.deleteTag(tag.id)
      removeTagFromState(tag.id)
      await loadMovies()
      addToast(`Tag "${tag.name}" deleted`, 'success')
    } catch (error) {
      console.error('Failed to delete tag:', error)
      addToast('Failed to delete tag', 'error')
    }
  }

  // Keyboard handlers
  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateTag()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowCreateForm(false)
      setNewTagName('')
      setCreateError(null)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 modal-backdrop z-50"
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-lg glass-card rounded-2xl border border-smoke-800/50 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-smoke-800/30 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-heading font-semibold text-pearl-100">Manage Tags</h2>
              <p className="text-xs text-smoke-500 mt-0.5">{tags.length} tags total</p>
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

          {/* Search and Sort */}
          <div className="px-6 py-3 border-b border-smoke-800/30 flex-shrink-0">
            <div className="flex gap-3 items-center">
              {/* Search Input */}
              <div className="flex-1 relative">
                <svg 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-smoke-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-obsidian-500/50 border border-smoke-800/30 text-pearl-200 text-sm placeholder-smoke-600 focus:border-bronze-500/50 focus:outline-none transition-all"
                />
              </div>
              
              {/* Sort Buttons */}
              <div className="flex gap-1">
                <motion.button
                  onClick={() => handleSort('name')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    sortField === 'name' 
                      ? 'bg-bronze-500/20 text-bronze-400' 
                      : 'bg-obsidian-500/50 text-smoke-500 hover:text-smoke-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title={`Sort by name ${sortField === 'name' ? (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)') : ''}`}
                >
                  A-Z {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </motion.button>
                <motion.button
                  onClick={() => handleSort('count')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    sortField === 'count' 
                      ? 'bg-bronze-500/20 text-bronze-400' 
                      : 'bg-obsidian-500/50 text-smoke-500 hover:text-smoke-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Sort by usage count"
                >
                  # {sortField === 'count' && (sortDirection === 'asc' ? '↑' : '↓')}
                </motion.button>
                <motion.button
                  onClick={() => handleSort('created_at')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    sortField === 'created_at' 
                      ? 'bg-bronze-500/20 text-bronze-400' 
                      : 'bg-obsidian-500/50 text-smoke-500 hover:text-smoke-300'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Sort by creation date"
                >
                  Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Tag List */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-3">
            {processedTags.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <p className="text-smoke-500 text-sm">No tags match your search</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-smoke-500 text-sm">No tags yet</p>
                    <p className="text-smoke-600 text-xs">Create your first tag to organize your movies</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {processedTags.map((tag) => (
                  <div 
                    key={tag.id} 
                    className="rounded-lg transition-colors duration-150"
                    style={{
                      backgroundColor: editingTagId === tag.id ? 'rgba(45, 45, 60, 0.6)' : 'transparent'
                    }}
                  >
                    {/* Tag Row - Always visible */}
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group ${
                        editingTagId === tag.id 
                          ? '' 
                          : 'hover:bg-obsidian-400/30 cursor-pointer'
                      }`}
                      onDoubleClick={() => editingTagId !== tag.id && handleStartEdit(tag)}
                    >
                      {/* Color Dot */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-200"
                        style={{ 
                          backgroundColor: editingTagId === tag.id ? editTagColor : tag.color,
                          boxShadow: `inset 0 1px 2px rgba(0,0,0,0.3), 0 0 6px ${editingTagId === tag.id ? editTagColor : tag.color}40`
                        }}
                      />
                      
                      {/* Name / Input */}
                      {editingTagId === tag.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          placeholder="Tag name..."
                          maxLength={50}
                          disabled={isSavingEdit}
                          className="flex-1 px-2 py-1 rounded-md bg-obsidian-600/80 border border-smoke-800/50 text-pearl-200 text-sm placeholder-smoke-600 focus:border-bronze-500/50 focus:outline-none transition-all disabled:opacity-50"
                        />
                      ) : (
                        <span className="flex-1 text-sm text-pearl-200 truncate">
                          {tag.name}
                        </span>
                      )}
                      
                      {/* Count - hide when editing */}
                      {editingTagId !== tag.id && (
                        <span className="text-xs text-smoke-600 tabular-nums px-2 py-0.5 rounded-full bg-obsidian-500/50">
                          {getTagCount(tag.id)}
                        </span>
                      )}
                      
                      {/* Actions */}
                      {editingTagId === tag.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit}
                            className="px-3 py-1 rounded-md bg-bronze-500/20 text-bronze-400 text-xs font-medium hover:bg-bronze-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {isSavingEdit ? (
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                            className="px-3 py-1 rounded-md bg-obsidian-500/50 text-smoke-400 text-xs hover:bg-obsidian-500/70 hover:text-smoke-300 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => handleStartEdit(tag)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-smoke-500 hover:text-bronze-400 hover:bg-bronze-500/10 transition-colors"
                            title="Edit tag"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-smoke-500 hover:text-cinnabar-400 hover:bg-cinnabar-500/10 transition-colors"
                            title="Delete tag"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Edit Expansion - Color picker slides down smoothly */}
                    <div 
                      className="overflow-hidden transition-all duration-200 ease-out"
                      style={{ 
                        maxHeight: editingTagId === tag.id ? '200px' : '0px',
                        opacity: editingTagId === tag.id ? 1 : 0
                      }}
                    >
                      <div className="px-3 pb-3 pt-1 space-y-2">
                        <ColorPicker
                          value={editTagColor}
                          onChange={setEditTagColor}
                          disabled={isSavingEdit}
                          showCustomInput={true}
                          size="sm"
                        />
                        
                        {/* Error */}
                        {editError && (
                          <p className="text-xs text-cinnabar-400">{editError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Tag Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-smoke-800/30 flex-shrink-0"
              >
                <div className="px-6 py-4 space-y-3">
                  <h3 className="text-sm font-medium text-pearl-200">Create New Tag</h3>
                  
                  <input
                    ref={createInputRef}
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={handleCreateKeyDown}
                    placeholder="Tag name..."
                    maxLength={50}
                    disabled={isCreating}
                    className="w-full px-3 py-2.5 rounded-lg bg-obsidian-500/80 border border-smoke-800/50 text-pearl-200 text-sm placeholder-smoke-600 focus:border-bronze-500/50 focus:ring-1 focus:ring-bronze-500/20 focus:outline-none transition-all disabled:opacity-50"
                  />
                  
                  {/* Color Picker */}
                  <ColorPicker
                    value={newTagColor}
                    onChange={setNewTagColor}
                    disabled={isCreating}
                    showCustomInput={true}
                    previewText={newTagName || 'New Tag'}
                  />

                  {/* Error */}
                  <AnimatePresence>
                    {createError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-xs text-cinnabar-400"
                      >
                        {createError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      onClick={handleCreateTag}
                      disabled={isCreating}
                      className="flex-1 py-2.5 rounded-lg btn-primary text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1.5"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isCreating ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                      Create Tag
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowCreateForm(false)
                        setNewTagName('')
                        setCreateError(null)
                      }}
                      disabled={isCreating}
                      className="px-4 py-2.5 rounded-lg btn-secondary text-sm disabled:opacity-50"
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-smoke-800/30 flex justify-between items-center flex-shrink-0">
            {!showCreateForm ? (
              <motion.button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded-lg bg-bronze-500/20 text-bronze-400 text-sm font-medium hover:bg-bronze-500/30 transition-all flex items-center gap-1.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Tag
              </motion.button>
            ) : (
              <div />
            )}
            <motion.button 
              onClick={onClose} 
              className="px-5 py-2 rounded-lg btn-secondary text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
