import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { activeProfile } = useLibraryStore()
  const [apiKey, setApiKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordRemovedSuccess, setPasswordRemovedSuccess] = useState(false)
  const [showRemovePasswordModal, setShowRemovePasswordModal] = useState(false)
  const [profileHasPassword, setProfileHasPassword] = useState(false)

  useEffect(() => {
    if (isOpen) {
      window.api.tmdbGetApiKey().then((key) => setApiKey(key || ''))
      setError(null)
      setSuccess(false)
      setPasswordRemovedSuccess(false)
      
      // Check if profile has password
      if (activeProfile) {
        window.api.hasPassword(activeProfile.id).then((hasPassword) => {
          setProfileHasPassword(hasPassword)
        })
      }
    }
  }, [isOpen, activeProfile])

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
          <div className="p-6 space-y-6">
            {/* Profile Password Section */}
            {activeProfile && profileHasPassword && (
              <div className="pb-4 border-b border-charcoal-700/50">
                <label className="text-xs text-charcoal-400 uppercase tracking-wider mb-2 block">Profile Security</label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cream-200 font-medium">Password Protected</p>
                    <p className="text-xs text-charcoal-500 mt-1">This profile is protected with a password</p>
                  </div>
                  <button
                    onClick={() => setShowRemovePasswordModal(true)}
                    className="px-4 py-2 rounded-lg bg-charcoal-700 text-cream-200 text-sm hover:bg-charcoal-600 transition-colors"
                  >
                    Remove Password
                  </button>
                </div>
              </div>
            )}

            {/* TMDB API Key Section */}
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
            {passwordRemovedSuccess && <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">Password removed successfully!</div>}
          </div>
          <div className="px-6 py-4 border-t border-charcoal-700/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-charcoal-800 text-cream-300 text-sm hover:bg-charcoal-700">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg bg-amber-400 text-charcoal-900 text-sm font-medium hover:bg-amber-300 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Remove Password Modal */}
      <AnimatePresence>
        {showRemovePasswordModal && activeProfile && (
          <RemovePasswordModal
            profile={activeProfile}
            onClose={() => {
              setShowRemovePasswordModal(false)
              setError(null)
            }}
            onSuccess={async () => {
              setShowRemovePasswordModal(false)
              setProfileHasPassword(false)
              setPasswordRemovedSuccess(true)
              setError(null)
              // Update active profile in store
              const updatedProfile = await window.api.getProfiles().then(profiles => 
                profiles.find(p => p.id === activeProfile.id)
              )
              if (updatedProfile) {
                useLibraryStore.getState().setActiveProfile(updatedProfile)
              }
              // Clear success message after 3 seconds
              setTimeout(() => setPasswordRemovedSuccess(false), 3000)
            }}
            onError={(msg) => setError(msg)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// Remove Password Modal Component
function RemovePasswordModal({
  profile,
  onClose,
  onSuccess,
  onError
}: {
  profile: { id: string; name: string }
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    try {
      await window.api.removePassword(profile.id, password)
      onSuccess()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to remove password'
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-charcoal-800 rounded-2xl border border-charcoal-700 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-charcoal-700">
          <h2 className="text-xl font-heading font-semibold text-cream-100">Remove Password</h2>
          <p className="text-sm text-charcoal-400 mt-1">Enter your password to remove protection from "{profile.name}"</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-charcoal-400 mb-2">Current Password</label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-lg bg-charcoal-900 border border-charcoal-700 text-cream-100 placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-charcoal-700 hover:bg-charcoal-600 text-cream-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Removing...' : 'Remove Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
