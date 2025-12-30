import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'

interface ScanModalProps {
  onClose: () => void
}

export function ScanModal({ onClose }: ScanModalProps) {
  const { isScanning, scanProgress } = useLibraryStore()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={!isScanning ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <div className="text-center">
          {isScanning ? (
            <>
              {/* Scanning Animation */}
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-amber-400/20"
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>

              <h2 className="font-heading text-xl font-semibold text-cream-100 mb-2">
                Scanning for Movies
              </h2>
              
              {scanProgress ? (
                <>
                  <p className="text-sm text-charcoal-400 mb-4">
                    Processing {scanProgress.current} of {scanProgress.total}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-charcoal-800 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="h-full gradient-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  <p className="text-xs text-charcoal-500 truncate px-4">
                    {scanProgress.file}
                  </p>
                </>
              ) : (
                <p className="text-sm text-charcoal-400">
                  Looking for video files...
                </p>
              )}
            </>
          ) : (
            <>
              {/* Complete */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="font-heading text-xl font-semibold text-cream-100 mb-2">
                Scan Complete
              </h2>
              
              <p className="text-sm text-charcoal-400 mb-6">
                Your library has been updated.
              </p>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg gradient-accent text-charcoal-900 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

