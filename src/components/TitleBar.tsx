import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'

export function TitleBar() {
  const { activeProfile, lockProfile } = useLibraryStore()

  const handleLockProfile = async () => {
    await lockProfile()
  }

  return (
    <div className="h-10 glass flex items-center justify-between pl-4 pr-0 titlebar-drag border-b border-charcoal-700/50">
      {/* App Title */}
      <div className="flex items-center gap-3 titlebar-no-drag">
        <div className="w-6 h-6 rounded-lg gradient-accent flex items-center justify-center">
          <svg className="w-4 h-4 text-charcoal-900" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h-2v-2h2zm-2-2H7v4h6v-4zm2 0h2v2h-2v-2zm-8-2h2v2H7v-2zm-2 2v2H3v-2h2zm2-4V5H3v2h4z" />
          </svg>
        </div>
        <h1 className="font-heading font-semibold text-cream-100 text-sm tracking-wide">
          LibCat
        </h1>
        
        {/* Profile indicator */}
        {activeProfile && (
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-charcoal-700">
            <span className="text-xs text-charcoal-400">{activeProfile.name}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLockProfile}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-charcoal-400 hover:text-cream-200 hover:bg-charcoal-700/50 transition-colors"
              title="Switch Profile"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Lock
            </motion.button>
          </div>
        )}
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1 titlebar-no-drag">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.api.windowMinimize()}
          className="w-8 h-8 rounded-lg hover:bg-charcoal-700/50 flex items-center justify-center text-charcoal-400 hover:text-cream-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.api.windowMaximize()}
          className="w-8 h-8 rounded-lg hover:bg-charcoal-700/50 flex items-center justify-center text-charcoal-400 hover:text-cream-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.api.windowClose()}
          className="w-8 h-8 rounded-lg hover:bg-red-500/80 flex items-center justify-center text-charcoal-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>
    </div>
  )
}

