import { motion } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'

export function TitleBar() {
  const { activeProfile, lockProfile } = useLibraryStore()

  const handleLockProfile = async () => {
    await lockProfile()
  }

  // Get profile avatar color based on name
  const getProfileColor = (name: string): string => {
    const colors = [
      'from-rose-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-cyan-400 to-blue-500',
      'from-violet-400 to-purple-500',
      'from-fuchsia-400 to-pink-500',
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <header className="h-11 flex items-center justify-between pl-4 pr-2 titlebar-drag bg-obsidian-700/60 backdrop-blur-xl border-b border-smoke-900/50">
      {/* App Logo & Title */}
      <div className="flex items-center gap-3 titlebar-no-drag">
        <motion.div 
          className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center shadow-lg shadow-bronze-500/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-4 h-4 text-obsidian-900" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h-2v-2h2zm-2-2H7v4h6v-4zm2 0h2v2h-2v-2zm-8-2h2v2H7v-2zm-2 2v2H3v-2h2zm2-4V5H3v2h4z" />
          </svg>
        </motion.div>
        
        <h1 className="font-heading font-semibold text-pearl-200 text-sm tracking-wide">
          LibCat
        </h1>
        
        {/* Profile Badge */}
        {activeProfile && (
          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-smoke-800/50">
            <motion.button
              onClick={handleLockProfile}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-obsidian-400/40 hover:bg-obsidian-300/50 border border-smoke-800/30 transition-all group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="Switch Profile"
            >
              {/* Mini Avatar */}
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getProfileColor(activeProfile.name)} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
              
              <span className="text-xs text-smoke-300 group-hover:text-pearl-300 transition-colors">
                {activeProfile.name}
              </span>
              
              {/* Lock Icon */}
              <motion.svg 
                className="w-3 h-3 text-smoke-500 group-hover:text-bronze-400 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                initial={false}
                animate={{ rotate: 0 }}
                whileHover={{ rotate: -10 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </motion.svg>
            </motion.button>
          </div>
        )}
      </div>

      {/* Window Controls - macOS Style */}
      <div className="flex items-center gap-2 titlebar-no-drag">
        {/* Minimize */}
        <motion.button
          onClick={() => window.api.windowMinimize()}
          className="w-3 h-3 rounded-full bg-smoke-600/60 hover:bg-amber-400 flex items-center justify-center group transition-colors"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-1.5 h-1.5 text-transparent group-hover:text-amber-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
            <path strokeLinecap="round" d="M5 12h14" />
          </svg>
        </motion.button>
        
        {/* Maximize */}
        <motion.button
          onClick={() => window.api.windowMaximize()}
          className="w-3 h-3 rounded-full bg-smoke-600/60 hover:bg-sage-400 flex items-center justify-center group transition-colors"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-1.5 h-1.5 text-transparent group-hover:text-sage-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </motion.button>
        
        {/* Close */}
        <motion.button
          onClick={() => window.api.windowClose()}
          className="w-3 h-3 rounded-full bg-smoke-600/60 hover:bg-cinnabar-400 flex items-center justify-center group transition-colors"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-1.5 h-1.5 text-transparent group-hover:text-cinnabar-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>
    </header>
  )
}
