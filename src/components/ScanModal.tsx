import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'

export function ScanModal() {
  const { isScanning, scanProgress } = useLibraryStore()
  const [isCancelling, setIsCancelling] = useState(false)

  if (!isScanning) {
    return null
  }

  const progress = scanProgress ? (scanProgress.current / scanProgress.total) * 100 : 0

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await window.api.cancelScan()
    } catch (error) {
      console.error('Failed to cancel scan:', error)
      setIsCancelling(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl p-8 w-full max-w-md mx-4 border border-smoke-800/50"
      >
        <div className="text-center">
          {/* Scanning Animation */}
          <div className="w-20 h-20 mx-auto mb-6 relative">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-bronze-500/20"
            />
            {/* Spinning ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-bronze-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            {/* Pulsing inner glow */}
            <motion.div
              className="absolute inset-2 rounded-full bg-bronze-500/10"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-bronze-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          </div>

          <h2 className="font-heading text-xl font-semibold text-pearl-100 mb-2">
            {isCancelling ? 'Cancelling...' : 'Scanning for Movies'}
          </h2>
          
          {scanProgress ? (
            <>
              <p className="text-sm text-smoke-500 mb-5">
                Processing {scanProgress.current} of {scanProgress.total}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-obsidian-500 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full gradient-accent rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              </div>
              
              {/* Current file */}
              <p className="text-xs text-smoke-600 truncate px-4 font-mono">
                {scanProgress.file}
              </p>

              {/* Percentage */}
              <p className="text-2xl font-semibold text-bronze-400 mt-4 font-mono">
                {Math.round(progress)}%
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-smoke-500">
                Looking for video files...
              </p>
              {/* Shimmer placeholder */}
              <div className="w-full h-2 bg-obsidian-500 rounded-full overflow-hidden">
                <motion.div
                  className="h-full w-1/3 bg-gradient-to-r from-obsidian-500 via-bronze-500/30 to-obsidian-500"
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="mt-6 px-6 py-2 text-sm font-medium text-smoke-400 hover:text-pearl-100 
                       bg-smoke-800/50 hover:bg-smoke-700/50 rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? 'Stopping...' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
