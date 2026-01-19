import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  movieTitle?: string
  movieCount?: number
  isDeleting?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  movieTitle,
  movieCount,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  const isBulkDelete = movieCount !== undefined && movieCount > 1
  const message = isBulkDelete
    ? `Are you sure you want to remove ${movieCount} movies from your library?`
    : `Are you sure you want to remove "${movieTitle || 'this movie'}" from your library?`

  const handleConfirm = () => {
    onConfirm()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isDeleting) {
      onClose()
    }
    if (e.key === 'Enter' && !isDeleting) {
      handleConfirm()
    }
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={onClose}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-card rounded-2xl border border-smoke-800/50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-smoke-800/30">
              <div className="flex items-center gap-4 mb-2">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-cinnabar-500/15 border border-cinnabar-500/20 flex items-center justify-center flex-shrink-0"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <svg
                    className="w-6 h-6 text-cinnabar-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </motion.div>
                <div>
                  <h2 className="text-xl font-heading font-semibold text-pearl-100">
                    Remove {isBulkDelete ? 'Movies' : 'Movie'}
                  </h2>
                  <p className="text-sm text-smoke-600 mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-smoke-300 leading-relaxed break-words whitespace-normal">{message}</p>
              <p className="text-sm text-smoke-600 mt-3">
                The file will remain on your disk, only the library entry will be removed.
              </p>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-smoke-800/30 flex gap-3">
              <motion.button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl btn-secondary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl bg-cinnabar-500/20 hover:bg-cinnabar-500/30 text-cinnabar-400 font-medium border border-cinnabar-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Removing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Remove
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
