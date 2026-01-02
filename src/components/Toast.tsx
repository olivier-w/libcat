import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore } from '../stores/toastStore'
import type { Toast as ToastType } from '../stores/toastStore'

const TOAST_DURATION = 4000

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = Date.now()
    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        requestAnimationFrame(updateProgress)
      }
    }
    requestAnimationFrame(updateProgress)
  }, [])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <motion.div 
            className="w-8 h-8 rounded-lg bg-sage-500/20 border border-sage-500/30 flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <motion.svg 
              className="w-4 h-4 text-sage-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>
        )
      case 'error':
        return (
          <motion.div 
            className="w-8 h-8 rounded-lg bg-cinnabar-500/20 border border-cinnabar-500/30 flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1], rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <svg className="w-4 h-4 text-cinnabar-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.div>
        )
      default:
        return (
          <motion.div 
            className="w-8 h-8 rounded-lg bg-bronze-500/20 border border-bronze-500/30 flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <svg className="w-4 h-4 text-bronze-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
        )
    }
  }

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-sage-500'
      case 'error':
        return 'bg-cinnabar-500'
      default:
        return 'bg-bronze-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="glass-card rounded-xl border border-smoke-800/50 shadow-2xl shadow-black/30 overflow-hidden min-w-[320px] max-w-md"
    >
      <div className="p-4 flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-sm text-pearl-200 leading-snug">{toast.message}</p>
        </div>
        <motion.button
          onClick={() => onDismiss(toast.id)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-smoke-600 hover:text-pearl-300 hover:bg-obsidian-400/50 transition-all flex-shrink-0"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-obsidian-600/50">
        <motion.div
          className={`h-full ${getProgressColor()}`}
          initial={{ width: '100%' }}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  )
}

export function Toast() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
