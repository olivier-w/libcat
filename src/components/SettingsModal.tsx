import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      window.api.tmdbGetApiKey().then((key) => setApiKey(key || ''))
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)
    try {
      await window.api.tmdbSetApiKey(apiKey.trim())
      setSuccess(true)
      setTimeout(() => onClose(), 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to save API key')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md glass-card rounded-2xl border border-charcoal-700/50 shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-charcoal-700/50 flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-cream-100">Settings</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-charcoal-700/50 flex items-center justify-center text-charcoal-400 hover:text-cream-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs text-charcoal-400 uppercase tracking-wider mb-2 block">TMDB API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your TMDB API key..."
                className="w-full px-4 py-2.5 rounded-lg bg-charcoal-800/80 border border-charcoal-700/50 text-cream-100 text-sm placeholder-charcoal-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 focus:outline-none"
              />
              <p className="text-xs text-charcoal-500 mt-2">
                Get your API key from{' '}
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
                  themoviedb.org
                </a>
              </p>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">API key saved!</div>}
          </div>
          <div className="px-6 py-4 border-t border-charcoal-700/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-charcoal-800 text-cream-300 text-sm hover:bg-charcoal-700">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg bg-amber-400 text-charcoal-900 text-sm font-medium hover:bg-amber-300 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
