import { motion } from 'framer-motion'
import React from 'react'

interface WindowControlsProps {
  className?: string
  style?: React.CSSProperties
}

export function WindowControls({ className = '', style }: WindowControlsProps) {
  const platform = window.api.platform
  const isWindows = platform === 'win32'

  if (isWindows) {
    return <WindowsControls className={className} style={style} />
  }

  return <MacControls className={className} style={style} />
}

// Windows-style window controls (rectangular buttons)
function WindowsControls({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <div className={`flex items-center h-full ${className}`} style={style}>
      {/* Minimize */}
      <button
        onClick={() => window.api.windowMinimize()}
        className="w-[46px] h-full flex items-center justify-center text-smoke-400 hover:bg-smoke-700/50 transition-colors"
      >
        <svg className="w-[10px] h-[10px]" fill="none" stroke="currentColor" viewBox="0 0 10 1" strokeWidth={1}>
          <path d="M0 0.5h10" />
        </svg>
      </button>

      {/* Maximize */}
      <button
        onClick={() => window.api.windowMaximize()}
        className="w-[46px] h-full flex items-center justify-center text-smoke-400 hover:bg-smoke-700/50 transition-colors"
      >
        <svg className="w-[10px] h-[10px]" fill="none" stroke="currentColor" viewBox="0 0 10 10" strokeWidth={1}>
          <rect x="0.5" y="0.5" width="9" height="9" />
        </svg>
      </button>

      {/* Close */}
      <button
        onClick={() => window.api.windowClose()}
        className="w-[46px] h-full flex items-center justify-center text-smoke-400 hover:bg-[#e81123] hover:text-white transition-colors"
      >
        <svg className="w-[10px] h-[10px]" fill="none" stroke="currentColor" viewBox="0 0 10 10" strokeWidth={1}>
          <path d="M0 0l10 10M10 0L0 10" />
        </svg>
      </button>
    </div>
  )
}

// macOS-style window controls (circular traffic lights)
function MacControls({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={style}>
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
  )
}
