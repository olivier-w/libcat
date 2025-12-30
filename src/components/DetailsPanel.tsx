import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import { TagPill } from './TagPill'
import { StarRating } from './StarRating'

export function DetailsPanel() {
  const { selectedMovie, selectedMovies, tags, updateMovieInState, removeMovieFromState, removeMoviesFromState, loadMovies, clearSelection } = useLibraryStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editYear, setEditYear] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  const isMultiSelect = selectedMovies.length > 1

  useEffect(() => {
    if (selectedMovie && !isMultiSelect) {
      setEditTitle(selectedMovie.title || '')
      setEditYear(selectedMovie.year?.toString() || '')
      setEditNotes(selectedMovie.notes || '')
    }
  }, [selectedMovie, isMultiSelect])

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

  const getThumbnailUrl = () => {
    if (!movie.thumbnail_path) return null
    return `local-file:///${movie.thumbnail_path.replace(/\\/g, '/')}`
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this movie from your library?')) return
    try {
      await window.api.deleteMovie(movie.id)
      removeMovieFromState(movie.id)
      // Clear selection if the deleted movie was selected
      if (selectedMovie?.id === movie.id) {
        clearSelection()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
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

  const handleRemoveTag = async (tagId: number) => {
    try {
      await window.api.removeTagFromMovie(movie.id, tagId)
      await loadMovies()
    } catch (error) {
      console.error('Failed to remove tag:', error)
    }
  }

  const handleRegenerateThumbnail = async () => {
    try {
      const newPath = await window.api.regenerateThumbnail(movie.id, movie.file_path)
      if (newPath) {
        updateMovieInState(movie.id, { thumbnail_path: newPath })
      }
    } catch (error) {
      console.error('Failed to regenerate thumbnail:', error)
    }
  }

  const handleSetCustomThumbnail = async () => {
    try {
      const newPath = await window.api.setCustomThumbnail(movie.id)
      if (newPath) {
        updateMovieInState(movie.id, { thumbnail_path: newPath })
      }
    } catch (error) {
      console.error('Failed to set custom thumbnail:', error)
    }
  }

  const availableTags = tags.filter(
    (tag) => !movie.tags?.some((t) => t.id === tag.id)
  )

  return (
    <aside className="w-80 glass border-l border-charcoal-700/50 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col overflow-y-auto"
        >
          {/* Poster */}
          <div className="relative aspect-video bg-charcoal-800 group">
            {getThumbnailUrl() ? (
              <img
                src={getThumbnailUrl()!}
                alt={movie.title || 'Movie thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Thumbnail Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={handleRegenerateThumbnail}
                className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-cream-200 text-xs hover:bg-charcoal-700 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={handleSetCustomThumbnail}
                className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-cream-200 text-xs hover:bg-charcoal-700 transition-colors"
              >
                Custom
              </button>
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
                Rating
              </label>
              <StarRating value={movie.rating || 0} onChange={handleRatingChange} />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {movie.tags?.map((tag) => (
                  <TagPill
                    key={tag.id}
                    tag={tag}
                    onRemove={() => handleRemoveTag(tag.id)}
                  />
                ))}
                
                <div className="relative">
                  <button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="h-6 px-2 rounded-full bg-charcoal-800 text-charcoal-400 text-xs hover:bg-charcoal-700 hover:text-cream-200 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                  
                  {showTagDropdown && availableTags.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 shadow-xl z-10 min-w-[120px]">
                      {availableTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleAddTag(tag.id)}
                          className="w-full px-3 py-1.5 text-left text-sm text-cream-200 hover:bg-charcoal-700 transition-colors flex items-center gap-2"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-lg bg-charcoal-800 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </aside>
  )
}

// Bulk Actions Panel for multi-selection
function BulkActionsPanel() {
  const { selectedMovies, tags, loadMovies, clearSelection, updateMovieInState, removeMoviesFromState } = useLibraryStore()
  const [showTagDropdown, setShowTagDropdown] = useState(false)

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

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${selectedMovies.length} movies from your library?`)) return
    try {
      const ids = selectedMovies.map(m => m.id)
      for (const id of ids) {
        await window.api.deleteMovie(id)
      }
      removeMoviesFromState(ids)
      clearSelection()
    } catch (error) {
      console.error('Failed to bulk delete:', error)
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
        <div className="p-4 space-y-4 flex-1">
          {/* Add Tags */}
          <div>
            <label className="text-xs text-charcoal-400 uppercase tracking-wider block mb-2">
              Add Tag to All
            </label>
            <div className="relative">
              <button
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-cream-200 text-sm hover:bg-charcoal-700 transition-colors flex items-center justify-between"
              >
                <span>Select a tag...</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showTagDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 shadow-xl z-10 max-h-48 overflow-y-auto">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleBulkAddTag(tag.id)}
                      className="w-full px-3 py-2 text-left text-sm text-cream-200 hover:bg-charcoal-700 transition-colors flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  ))}
                  {tags.length === 0 && (
                    <p className="px-3 py-2 text-sm text-charcoal-500">No tags available</p>
                  )}
                </div>
              )}
            </div>
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
    </aside>
  )
}

