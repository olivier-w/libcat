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
        className="fixed inset-0 modal-backdrop z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md glass-card rounded-2xl border border-smoke-800/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-smoke-800/30 flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-pearl-100">Settings</h2>
            <motion.button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Password Section */}
            {activeProfile && profileHasPassword && (
              <div className="pb-5 border-b border-smoke-800/30">
                <label className="text-2xs text-smoke-600 uppercase tracking-wider mb-3 block font-medium">
                  Profile Security
                </label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pearl-200 font-medium">Password Protected</p>
                    <p className="text-xs text-smoke-600 mt-0.5">This profile is protected with a password</p>
                  </div>
                  <motion.button
                    onClick={() => setShowRemovePasswordModal(true)}
                    className="px-4 py-2 rounded-lg btn-secondary text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Remove Password
                  </motion.button>
                </div>
              </div>
            )}

            {/* TMDB API Key Section */}
            <div>
              <label className="text-2xs text-smoke-600 uppercase tracking-wider mb-2 block font-medium">
                TMDB API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your TMDB API key..."
                className="w-full px-4 py-3 rounded-xl input-field text-sm"
              />
              <p className="text-xs text-smoke-600 mt-2">
                Get your API key from{' '}
                <a 
                  href="https://www.themoviedb.org/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-bronze-400 hover:text-bronze-300 transition-colors"
                >
                  themoviedb.org
                </a>
              </p>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-cinnabar-500/10 border border-cinnabar-500/20 text-cinnabar-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-sage-500/10 border border-sage-500/20 text-sage-400 text-sm"
                >
                  API key saved successfully!
                </motion.div>
              )}
              {passwordRemovedSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-sage-500/10 border border-sage-500/20 text-sage-400 text-sm"
                >
                  Password removed successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-smoke-800/30 flex justify-end gap-3">
            <motion.button 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl btn-secondary text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="px-5 py-2.5 rounded-xl btn-primary text-sm font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </motion.button>
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
              const updatedProfile = await window.api.getProfiles().then(profiles => 
                profiles.find(p => p.id === activeProfile.id)
              )
              if (updatedProfile) {
                useLibraryStore.getState().setActiveProfile(updatedProfile)
              }
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
      className="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm glass-card rounded-2xl border border-smoke-800/50 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-smoke-800/30">
          <h2 className="text-xl font-heading font-semibold text-pearl-100">Remove Password</h2>
          <p className="text-sm text-smoke-500 mt-1">Enter your password to remove protection from "{profile.name}"</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 rounded-xl bg-cinnabar-500/10 border border-cinnabar-500/20 text-cinnabar-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm text-smoke-400 mb-2 font-medium">Current Password</label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <motion.button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl btn-secondary font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-cinnabar-500 hover:bg-cinnabar-600 text-white font-medium transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Removing...' : 'Remove Password'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
