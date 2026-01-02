import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import { useToastStore } from '../stores/toastStore'
import { TagPill } from './TagPill'
import { StarRating } from './StarRating'
import { TMDBSearchModal } from './TMDBSearchModal'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { fuzzySearchTags } from '../utils/fuzzySearch'
import type { Tag, TMDBCastMember, Movie } from '../types'

// Smart dropdown component that renders via portal and positions intelligently
interface TagDropdownProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement | null>
  tags: Tag[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectTag: (tagId: number) => void
  onCreateTag: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

// Ref callback for input elements to handle null refs
function useInputRef(inputRef: React.RefObject<HTMLInputElement | null>) {
  return useCallback((el: HTMLInputElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
  }, [inputRef])
}

function TagDropdownPortal({
  isOpen,
  onClose,
  anchorRef,
  tags,
  searchQuery,
  onSearchChange,
  onSelectTag,
  onCreateTag,
  inputRef,
}: TagDropdownProps) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 200,
    openUpward: false,
  })
  const inputRefCallback = useInputRef(inputRef)

  // Calculate position based on anchor element
  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return

    const rect = anchorRef.current.getBoundingClientRect()
    const dropdownHeight = 280 // Approximate max height of dropdown
    const dropdownWidth = 240
    const padding = 12 // Padding from viewport edges
    
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    // Calculate left position - align to right edge of button if it would overflow
    let left = rect.right - dropdownWidth // Align to right edge of button
    
    // Ensure dropdown stays within viewport bounds
    if (left < padding) {
      left = padding
    }
    if (left + dropdownWidth > window.innerWidth - padding) {
      left = window.innerWidth - dropdownWidth - padding
    }

    setPosition({
      top: openUpward ? rect.top : rect.bottom + 4,
      left,
      width: dropdownWidth,
      openUpward,
    })
  }, [anchorRef])

  useEffect(() => {
    if (isOpen) {
      updatePosition()
      // Update position on scroll or resize
      const handleUpdate = () => updatePosition()
      window.addEventListener('scroll', handleUpdate, true)
      window.addEventListener('resize', handleUpdate)
      return () => {
        window.removeEventListener('scroll', handleUpdate, true)
        window.removeEventListener('resize', handleUpdate)
      }
    }
  }, [isOpen, updatePosition])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure portal is mounted
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [isOpen, inputRef])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      // Check if click is inside the dropdown
      const dropdown = document.getElementById('tag-dropdown-portal')
      if (dropdown?.contains(target)) return
      onClose()
    }

    // Use capture phase for reliable detection
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  const dropdownContent = (
    <motion.div
      id="tag-dropdown-portal"
      initial={{ opacity: 0, y: position.openUpward ? 8 : -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: position.openUpward ? 8 : -8, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="fixed rounded-xl bg-charcoal-800/95 backdrop-blur-xl border border-charcoal-600/50 shadow-2xl shadow-black/50 z-[9999] overflow-hidden"
      style={{
        top: position.openUpward ? 'auto' : position.top,
        bottom: position.openUpward ? window.innerHeight - position.top + 4 : 'auto',
        left: position.left,
        width: position.width,
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onClose()
        }
      }}
    >
      {/* Search Input */}
      <div className="p-2.5 border-b border-charcoal-700/50">
        <div className="relative">
          <svg 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRefCallback}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search or create tag..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-charcoal-900/80 border border-charcoal-600/50 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 focus:outline-none transition-all"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Tag List */}
      <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-charcoal-600 scrollbar-track-transparent">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <motion.button
              key={tag.id}
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => onSelectTag(tag.id)}
              className="w-full px-3 py-2 text-left text-sm text-cream-200 hover:bg-charcoal-700/80 active:bg-charcoal-600/80 transition-colors flex items-center gap-2.5 group"
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-transparent group-hover:ring-white/20 transition-all"
                style={{ backgroundColor: tag.color }}
              />
              <span className="truncate">{tag.name}</span>
            </motion.button>
          ))
        ) : searchQuery.trim() ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onCreateTag}
            className="w-full px-3 py-2.5 text-left text-sm text-amber-400 hover:bg-amber-400/10 transition-colors flex items-center gap-2"
          >
            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span>Create "<span className="font-medium">{searchQuery.trim()}</span>"</span>
          </motion.button>
        ) : (
          <p className="px-3 py-3 text-sm text-charcoal-500 text-center">No tags available</p>
        )}
      </div>
    </motion.div>
  )

  return createPortal(
    <AnimatePresence>{dropdownContent}</AnimatePresence>,
    document.body
  )
}

export function DetailsPanel() {
  const { selectedMovie, selectedMovies, tags, updateMovieInState, removeMovieFromState, loadMovies, clearSelection, addTagToState } = useLibraryStore()
  
  const addToast = useToastStore((state) => state.addToast)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [showTMDBSearch, setShowTMDBSearch] = useState(false)
  const [isAutoMatching, setIsAutoMatching] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const tagSearchInputRef = useRef<HTMLInputElement>(null)
  const addTagButtonRef = useRef<HTMLButtonElement>(null)

  const isMultiSelect = selectedMovies.length > 1

  useEffect(() => {
    if (selectedMovie && !isMultiSelect) {
      setEditTitle(selectedMovie.title || '')
      setEditYear(selectedMovie.year?.toString() || '')
      setEditNotes(selectedMovie.notes || '')
    }
  }, [selectedMovie, isMultiSelect])

  // Clear search query when dropdown closes
  useEffect(() => {
    if (!showTagDropdown) {
      setTagSearchQuery('')
    }
  }, [showTagDropdown])

  // No selection
  if (selectedMovies.length === 0) {
    return (
      <aside className="w-80 glass border-l border-charcoal-700/50 flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full bg-charcoal-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-cream-300 mb-1">No movie selected</h3>
        <p className="text-xs text-charcoal-400">Click on a movie to see details</p>
        <p className="text-xs text-charcoal-500 mt-2">Ctrl+click or Shift+click for multi-select</p>
      </aside>
    )
  }

  // Multi-selection panel
  if (isMultiSelect) {
    return <BulkActionsPanel />
  }

  // Single selection - original panel (selectedMovie is guaranteed here)
  const movie = selectedMovie!

  // Prefer TMDB poster, fall back to thumbnail
  const getPosterUrl = () => {
    if (movie.tmdb_poster_path) {
      return `local-file:///${movie.tmdb_poster_path.replace(/\\/g, '/')}`
    }
    if (movie.thumbnail_path) {
      return `local-file:///${movie.thumbnail_path.replace(/\\/g, '/')}`
    }
    return null
  }

  // Parse TMDB JSON fields
  const parsedCast: TMDBCastMember[] = movie.tmdb_cast ? JSON.parse(movie.tmdb_cast) : []
  const parsedGenres: string[] = movie.tmdb_genres ? JSON.parse(movie.tmdb_genres) : []

  const handleTMDBLinked = (updatedMovie: Movie) => {
    updateMovieInState(updatedMovie.id, updatedMovie)
  }

  const handleAutoMatch = async () => {
    setIsAutoMatching(true)
    try {
      const result = await window.api.tmdbAutoMatch(movie.id)
      if (result.matched) {
        updateMovieInState(movie.id, result.movie)
      } else {
        setShowTMDBSearch(true)
      }
    } catch (error) {
      console.error('Auto-match failed:', error)
      setShowTMDBSearch(true)
    } finally {
      setIsAutoMatching(false)
    }
  }

  const handleUnlinkTMDB = async () => {
    try {
      const updatedMovie = await window.api.tmdbUnlinkMovie(movie.id)
      updateMovieInState(movie.id, updatedMovie)
    } catch (error) {
      console.error('Failed to unlink TMDB:', error)
    }
  }

  const handleOpenTMDB = () => {
    if (movie.tmdb_id) {
      window.api.tmdbOpenInBrowser(movie.tmdb_id)
    }
  }

  const handleSave = async () => {
    try {
      const data = {
        title: editTitle || null,
        year: editYear ? parseInt(editYear) : null,
        notes: editNotes || null,
      }
      await window.api.updateMovie(movie.id, data)
      updateMovieInState(movie.id, data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleRatingChange = async (rating: number) => {
    try {
      await window.api.updateMovie(movie.id, { rating })
      updateMovieInState(movie.id, { rating })
    } catch (error) {
      console.error('Failed to update rating:', error)
    }
  }

  const handleWatchedToggle = async () => {
    try {
      await window.api.updateMovie(movie.id, { watched: !movie.watched })
      updateMovieInState(movie.id, { watched: !movie.watched })
    } catch (error) {
      console.error('Failed to toggle watched:', error)
    }
  }

  const handleFavoriteToggle = async () => {
    try {
      await window.api.updateMovie(movie.id, { favorite: !movie.favorite })
      updateMovieInState(movie.id, { favorite: !movie.favorite })
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await window.api.deleteMovie(movie.id)
      removeMovieFromState(movie.id)
      // Clear selection if the deleted movie was selected
      if (selectedMovie?.id === movie.id) {
        clearSelection()
      }
      setShowDeleteModal(false)
      addToast(`"${movie.title || 'Movie'}" has been removed from your library.`, 'success')
    } catch (error: any) {
      console.error('Failed to delete:', error)
      addToast(
        error?.message || 'Failed to remove movie from library. Please try again.',
        'error'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddTag = async (tagId: number) => {
    try {
      await window.api.addTagToMovie(movie.id, tagId)
      await loadMovies()
      setShowTagDropdown(false)
    } catch (error) {
      console.error('Failed to add tag:', error)
    }
  }

  const handleCreateAndAddTag = async () => {
    if (!tagSearchQuery.trim()) return
    
    try {
      // Create the tag with default color
      const newTag = await window.api.createTag(tagSearchQuery.trim(), '#f4a261')
      addTagToState(newTag)
      // Add the tag to the movie
      await window.api.addTagToMovie(movie.id, newTag.id)
      await loadMovies()
      setTagSearchQuery('')
      setShowTagDropdown(false)
    } catch (error) {
      console.error('Failed to create and add tag:', error)
    }
  }

  const handleRemoveTag = async (tagId: number) => {
    try {
      await window.api.removeTagFromMovie(movie.id, tagId)
      await loadMovies()
    } catch (error) {
      console.error('Failed to remove tag:', error)
    }
  }

  const availableTags = tags.filter(
    (tag) => !movie.tags?.some((t) => t.id === tag.id)
  )
  
  const filteredAvailableTags = fuzzySearchTags(availableTags, tagSearchQuery)

  // Format file size from bytes to human-readable format
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  // Format duration from seconds to hours:minutes:seconds
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Unknown'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <aside className="w-80 glass border-l border-charcoal-700/50 flex flex-col overflow-hidden">
        <div
          className="flex-1 flex flex-col overflow-y-auto"
        >
          {/* Poster */}
          <div className="relative aspect-[2/3] bg-charcoal-800 group">
            {getPosterUrl() ? (
              <img
                src={getPosterUrl()!}
                alt={movie.title || 'Movie poster'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* TMDB Badge */}
            {movie.tmdb_id && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-gradient-to-r from-[#01b4e4] to-[#90cea1] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                TMDB
              </div>
            )}
            
            {/* Play Button on Hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div
                onClick={() => window.api.playVideo(movie.file_path)}
                className="w-14 h-14 rounded-full bg-amber-400/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform pointer-events-auto cursor-pointer"
              >
                <svg className="w-6 h-6 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4">
            {/* Title & Year */}
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 transition-colors"
                />
                <input
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  placeholder="Year"
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 transition-colors"
                />
              </div>
            ) : (
              <div>
                <h2 className="font-heading text-lg font-semibold text-cream-100 leading-tight">
                  {movie.title || 'Untitled'}
                </h2>
                {movie.year && (
                  <p className="text-sm text-charcoal-400 mt-1">{movie.year}</p>
                )}
              </div>
            )}

            {/* Rating */}
            <div>
              <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
                Your Rating
              </label>
              <StarRating value={movie.rating || 0} onChange={handleRatingChange} />
            </div>

            {/* TMDB Rating & Info */}
            {movie.tmdb_id && (
              <>
                {movie.tmdb_rating !== null && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-cream-100">{movie.tmdb_rating.toFixed(1)}</span>
                      <span className="text-xs text-charcoal-400">/10</span>
                    </div>
                    {movie.tmdb_director && (
                      <span className="text-xs text-charcoal-400">
                        Dir. <span className="text-cream-300">{movie.tmdb_director}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Genres */}
                {parsedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {parsedGenres.map((genre, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-charcoal-700/50 text-xs text-cream-300">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.tmdb_overview && (
                  <div>
                    <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-1.5">
                      Overview
                    </label>
                    <p className="text-xs text-charcoal-300 leading-relaxed line-clamp-4">
                      {movie.tmdb_overview}
                    </p>
                  </div>
                )}

                {/* Cast */}
                {parsedCast.length > 0 && (
                  <div>
                    <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-1.5">
                      Cast
                    </label>
                    <div className="text-xs text-charcoal-300 space-y-0.5">
                      {parsedCast.slice(0, 5).map((member, i) => (
                        <div key={i}>
                          <span className="text-cream-200">{member.name}</span>
                          <span className="text-charcoal-500"> as </span>
                          <span>{member.character}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-charcoal-400 uppercase tracking-wider">
                  Tags
                </label>
                <button
                  ref={addTagButtonRef}
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="h-6 px-2.5 rounded-full bg-charcoal-800/80 text-charcoal-400 text-xs hover:bg-amber-400/20 hover:text-amber-400 transition-all flex items-center gap-1.5 group"
                >
                  <svg className="w-3 h-3 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add tag
                </button>
              </div>
              
              {/* Tags container with max height and scroll */}
              <div className="max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-charcoal-600 scrollbar-track-transparent rounded-lg">
                <div className="flex flex-wrap gap-1.5 p-0.5">
                  {movie.tags && movie.tags.length > 0 ? (
                    movie.tags.map((tag) => (
                      <TagPill
                        key={tag.id}
                        tag={tag}
                        onRemove={() => handleRemoveTag(tag.id)}
                      />
                    ))
                  ) : (
                    <span className="text-xs text-charcoal-500 italic py-1">No tags yet</span>
                  )}
                </div>
              </div>
              
              {/* Tag Dropdown Portal */}
              <TagDropdownPortal
                isOpen={showTagDropdown}
                onClose={() => setShowTagDropdown(false)}
                anchorRef={addTagButtonRef}
                tags={filteredAvailableTags}
                searchQuery={tagSearchQuery}
                onSearchChange={setTagSearchQuery}
                onSelectTag={handleAddTag}
                onCreateTag={handleCreateAndAddTag}
                inputRef={tagSearchInputRef}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
                Notes
              </label>
              {isEditing ? (
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 transition-colors resize-none"
                />
              ) : (
                <p className="text-sm text-cream-300 leading-relaxed">
                  {movie.notes || (
                    <span className="text-charcoal-500 italic">No notes</span>
                  )}
                </p>
              )}
            </div>

            {/* File Info */}
            <div className="grid grid-cols-2 gap-4">
              {movie.file_size !== null && (
                <div>
                  <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-1">
                    Size
                  </label>
                  <p className="text-sm text-cream-300">
                    {formatFileSize(movie.file_size)}
                  </p>
                </div>
              )}
              {movie.duration !== null && (
                <div>
                  <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-1">
                    Duration
                  </label>
                  <p className="text-sm text-cream-300">
                    {formatDuration(movie.duration)}
                  </p>
                </div>
              )}
            </div>

            {/* File Path */}
            <div>
              <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
                Location
              </label>
              <button
                onClick={() => window.api.openInExplorer(movie.file_path)}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors break-all text-left"
              >
                {movie.file_path}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-charcoal-700/50 space-y-2">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 rounded-lg bg-amber-400 text-charcoal-900 text-sm font-medium hover:bg-amber-300 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-charcoal-800 text-cream-300 text-sm hover:bg-charcoal-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.api.playVideo(movie.file_path)}
                    className="flex-1 py-2.5 rounded-lg gradient-accent text-charcoal-900 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play
                  </motion.button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 rounded-lg bg-charcoal-800 text-cream-300 text-sm hover:bg-charcoal-700 transition-colors"
                  >
                    Edit
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleWatchedToggle}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
                      movie.watched
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-charcoal-800 text-cream-300 hover:bg-charcoal-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {movie.watched ? 'Watched' : 'Mark Watched'}
                  </button>
                  <button
                    onClick={handleFavoriteToggle}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
                      movie.favorite
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-charcoal-800 text-cream-300 hover:bg-charcoal-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {movie.favorite ? 'Favorited' : 'Favorite'}
                  </button>
                </div>

                {/* TMDB Actions */}
                <div className="flex gap-2">
                  {movie.tmdb_id ? (
                    <>
                      <button
                        onClick={handleOpenTMDB}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#01b4e4]/20 to-[#90cea1]/20 text-[#01b4e4] text-sm hover:from-[#01b4e4]/30 hover:to-[#90cea1]/30 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View on TMDB
                      </button>
                      <button
                        onClick={() => setShowTMDBSearch(true)}
                        className="px-3 py-2 rounded-lg bg-charcoal-800 text-amber-400 text-sm hover:bg-charcoal-700 hover:text-amber-300 transition-colors"
                        title="Change TMDB match"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={handleUnlinkTMDB}
                        className="px-3 py-2 rounded-lg bg-charcoal-800 text-charcoal-400 text-sm hover:bg-charcoal-700 hover:text-cream-200 transition-colors"
                        title="Unlink from TMDB"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAutoMatch}
                      disabled={isAutoMatching}
                      className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#01b4e4]/20 to-[#90cea1]/20 text-[#01b4e4] text-sm hover:from-[#01b4e4]/30 hover:to-[#90cea1]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isAutoMatching ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Matching...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Find on TMDB
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="w-full py-2 rounded-lg bg-charcoal-800 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        movieTitle={movie.title || undefined}
        isDeleting={isDeleting}
      />

      {/* TMDB Search Modal */}
      <TMDBSearchModal
        isOpen={showTMDBSearch}
        onClose={() => setShowTMDBSearch(false)}
        movie={movie}
        onLinked={handleTMDBLinked}
      />
    </aside>
  )
}

// Bulk Actions Panel for multi-selection
function BulkActionsPanel() {
  const { selectedMovies, tags, loadMovies, clearSelection, updateMovieInState, removeMoviesFromState, addTagToState } = useLibraryStore()
  const addToast = useToastStore((state) => state.addToast)
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [bulkTagSearchQuery, setBulkTagSearchQuery] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const bulkTagSearchInputRef = useRef<HTMLInputElement>(null)
  const bulkAddTagButtonRef = useRef<HTMLButtonElement>(null)
  
  const filteredTags = fuzzySearchTags(tags, bulkTagSearchQuery)

  // Clear search query when dropdown closes
  useEffect(() => {
    if (!showTagDropdown) {
      setBulkTagSearchQuery('')
    }
  }, [showTagDropdown])

  const handleBulkAddTag = async (tagId: number) => {
    try {
      for (const movie of selectedMovies) {
        await window.api.addTagToMovie(movie.id, tagId)
      }
      await loadMovies()
      setShowTagDropdown(false)
    } catch (error) {
      console.error('Failed to bulk add tag:', error)
    }
  }

  const handleBulkCreateAndAddTag = async () => {
    if (!bulkTagSearchQuery.trim()) return
    
    try {
      // Create the tag with default color
      const newTag = await window.api.createTag(bulkTagSearchQuery.trim(), '#f4a261')
      addTagToState(newTag)
      // Add the tag to all selected movies
      for (const movie of selectedMovies) {
        await window.api.addTagToMovie(movie.id, newTag.id)
      }
      await loadMovies()
      setBulkTagSearchQuery('')
      setShowTagDropdown(false)
    } catch (error) {
      console.error('Failed to create and bulk add tag:', error)
    }
  }

  const handleBulkRemoveTag = async (tagId: number) => {
    try {
      for (const movie of selectedMovies) {
        await window.api.removeTagFromMovie(movie.id, tagId)
      }
      await loadMovies()
    } catch (error) {
      console.error('Failed to bulk remove tag:', error)
    }
  }

  const handleBulkMarkWatched = async (watched: boolean) => {
    try {
      for (const movie of selectedMovies) {
        await window.api.updateMovie(movie.id, { watched })
        updateMovieInState(movie.id, { watched })
      }
    } catch (error) {
      console.error('Failed to bulk update watched:', error)
    }
  }

  const handleBulkToggleFavorite = async (favorite: boolean) => {
    try {
      for (const movie of selectedMovies) {
        await window.api.updateMovie(movie.id, { favorite })
        updateMovieInState(movie.id, { favorite })
      }
    } catch (error) {
      console.error('Failed to bulk update favorite:', error)
    }
  }

  const handleBulkDelete = () => {
    setShowDeleteModal(true)
  }

  const handleConfirmBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const ids = selectedMovies.map(m => m.id)
      for (const id of ids) {
        await window.api.deleteMovie(id)
      }
      removeMoviesFromState(ids)
      clearSelection()
      setShowDeleteModal(false)
      addToast(
        `${selectedMovies.length} ${selectedMovies.length === 1 ? 'movie has' : 'movies have'} been removed from your library.`,
        'success'
      )
    } catch (error: any) {
      console.error('Failed to bulk delete:', error)
      addToast(
        error?.message || 'Failed to remove movies from library. Please try again.',
        'error'
      )
    } finally {
      setIsDeleting(false)
    }
  }
  // Find common tags among selected movies
  const getCommonTags = () => {
    if (selectedMovies.length === 0) return []
    const firstMovieTags = selectedMovies[0].tags || []
    return firstMovieTags.filter(tag =>
      selectedMovies.every(movie => movie.tags?.some(t => t.id === tag.id))
    )
  }

  const commonTags = getCommonTags()

  return (
    <aside className="w-80 glass border-l border-charcoal-700/50 flex flex-col overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-charcoal-700/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading text-lg font-semibold text-cream-100">
              Bulk Actions
            </h2>
            <button
              onClick={clearSelection}
              className="text-xs text-charcoal-400 hover:text-cream-200 transition-colors"
            >
              Clear selection
            </button>
          </div>
          <p className="text-sm text-amber-400">
            {selectedMovies.length} movies selected
          </p>
        </div>

        {/* Selected Movies Preview */}
        <div className="p-4 border-b border-charcoal-700/50">
          <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
            Selected
          </label>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {selectedMovies.slice(0, 10).map((movie) => (
              <span
                key={movie.id}
                className="text-xs bg-charcoal-800 text-cream-300 px-2 py-1 rounded truncate max-w-[120px]"
                title={movie.title || movie.file_path}
              >
                {movie.title || 'Untitled'}
              </span>
            ))}
            {selectedMovies.length > 10 && (
              <span className="text-xs text-charcoal-400 px-2 py-1">
                +{selectedMovies.length - 10} more
              </span>
            )}
          </div>
        </div>

        {/* Bulk Tag Actions */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Add Tags */}
          <div>
            <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
              Add Tag to All
            </label>
            <button
              ref={bulkAddTagButtonRef}
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="w-full px-3 py-2.5 rounded-lg bg-charcoal-800/80 border border-charcoal-700/50 text-cream-200 text-sm hover:bg-charcoal-700 hover:border-charcoal-600 transition-all flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-charcoal-400 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Select a tag...
              </span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${showTagDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Tag Dropdown Portal */}
            <TagDropdownPortal
              isOpen={showTagDropdown}
              onClose={() => setShowTagDropdown(false)}
              anchorRef={bulkAddTagButtonRef}
              tags={filteredTags}
              searchQuery={bulkTagSearchQuery}
              onSearchChange={setBulkTagSearchQuery}
              onSelectTag={handleBulkAddTag}
              onCreateTag={handleBulkCreateAndAddTag}
              inputRef={bulkTagSearchInputRef}
            />
          </div>

          {/* Common Tags (can remove) */}
          {commonTags.length > 0 && (
            <div>
              <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
                Remove Common Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleBulkRemoveTag(tag.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors hover:opacity-80"
                    style={{ 
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="p-4 border-t border-charcoal-700/50 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkMarkWatched(true)}
              className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark Watched
            </button>
            <button
              onClick={() => handleBulkMarkWatched(false)}
              className="flex-1 py-2 rounded-lg bg-charcoal-800 text-cream-300 text-sm hover:bg-charcoal-700 transition-colors"
            >
              Unwatched
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkToggleFavorite(true)}
              className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorite
            </button>
            <button
              onClick={() => handleBulkToggleFavorite(false)}
              className="flex-1 py-2 rounded-lg bg-charcoal-800 text-cream-300 text-sm hover:bg-charcoal-700 transition-colors"
            >
              Unfavorite
            </button>
          </div>
          
          <button
            onClick={handleBulkDelete}
            className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove All Selected
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={handleConfirmBulkDelete}
        movieCount={selectedMovies.length}
        isDeleting={isDeleting}
      />
    </aside>
  )
}

