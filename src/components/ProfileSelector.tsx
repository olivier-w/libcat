import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Profile {
  id: string
  name: string
  passwordHash: string | null
  createdAt: string
}

interface ProfileSelectorProps {
  onProfileSelected: (profile: Profile) => void
}

export function ProfileSelector({ onProfileSelected }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; profile: Profile } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const loadProfiles = async () => {
    try {
      const data = await window.api.getProfiles()
      setProfiles(data)
    } catch (err) {
      console.error('Failed to load profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileClick = async (profile: Profile) => {
    setError(null)
    if (profile.passwordHash) {
      setSelectedProfile(profile)
      setShowPasswordModal(true)
    } else {
      try {
        await window.api.unlockProfile(profile.id)
        onProfileSelected(profile)
      } catch (err: any) {
        setError(err.message || 'Failed to unlock profile')
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent, profile: Profile) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, profile })
  }

  const handleDeleteProfile = async (profile: Profile) => {
    if (!confirm(`Are you sure you want to delete "${profile.name}"? This will permanently delete all movies, tags, and thumbnails in this profile.`)) {
      return
    }
    
    try {
      await window.api.deleteProfile(profile.id)
      await loadProfiles()
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile')
    }
    setContextMenu(null)
  }

  const handleRenameClick = (profile: Profile) => {
    setSelectedProfile(profile)
    setShowRenameModal(true)
    setContextMenu(null)
  }

  const getProfileColor = (name: string): string => {
    const colors = [
      'from-rose-500 to-pink-600',
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-red-500 to-rose-600',
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-charcoal-900">
        <div className="text-cream-300">Loading profiles...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-charcoal-900 overflow-hidden">
      {/* Title Bar - draggable area */}
      <div className="h-8 flex items-center justify-between px-4 bg-charcoal-900/80 backdrop-blur-sm" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <span className="text-xs font-medium text-charcoal-400">libcat</span>
        <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={() => window.api.windowMinimize()} className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-300 transition-colors" />
          <button onClick={() => window.api.windowMaximize()} className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-300 transition-colors" />
          <button onClick={() => window.api.windowClose()} className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-300 transition-colors" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-heading font-bold text-cream-100 mb-2">
            Welcome to libcat
          </h1>
          <p className="text-charcoal-400">
            Select a profile to continue
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Profiles Grid */}
        <motion.div 
          className="grid gap-6"
          style={{ 
            gridTemplateColumns: `repeat(${Math.min(profiles.length + 1, 4)}, minmax(0, 1fr))` 
          }}
        >
          {profiles.map((profile, index) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleProfileClick(profile)}
              onContextMenu={(e) => handleContextMenu(e, profile)}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-charcoal-800/50 hover:bg-charcoal-800 border border-charcoal-700/50 hover:border-charcoal-600 transition-all duration-200"
            >
              {/* Avatar */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getProfileColor(profile.name)} flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:scale-105 transition-transform`}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Name */}
              <span className="text-cream-200 font-medium">{profile.name}</span>
              
              {/* Password indicator */}
              {profile.passwordHash && (
                <div className="flex items-center gap-1 text-xs text-charcoal-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Password protected</span>
                </div>
              )}
            </motion.button>
          ))}

          {/* Create New Profile */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: profiles.length * 0.05 }}
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-charcoal-700 hover:border-charcoal-500 hover:bg-charcoal-800/30 transition-all duration-200 min-h-[180px]"
          >
            <div className="w-20 h-20 rounded-2xl bg-charcoal-800 flex items-center justify-center text-charcoal-500 group-hover:text-charcoal-400 transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-charcoal-400">Create Profile</span>
          </motion.button>
        </motion.div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 shadow-xl min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleRenameClick(contextMenu.profile)}
              className="w-full px-4 py-2 text-left text-sm text-cream-200 hover:bg-charcoal-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            <button
              onClick={() => handleDeleteProfile(contextMenu.profile)}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Profile Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProfileModal
            onClose={() => setShowCreateModal(false)}
            onCreated={async (profile) => {
              await loadProfiles()
              setShowCreateModal(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && selectedProfile && (
          <PasswordModal
            profile={selectedProfile}
            onClose={() => {
              setShowPasswordModal(false)
              setSelectedProfile(null)
            }}
            onUnlock={() => {
              setShowPasswordModal(false)
              onProfileSelected(selectedProfile)
            }}
            onError={(msg) => setError(msg)}
          />
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {showRenameModal && selectedProfile && (
          <RenameProfileModal
            profile={selectedProfile}
            onClose={() => {
              setShowRenameModal(false)
              setSelectedProfile(null)
            }}
            onRenamed={async () => {
              await loadProfiles()
              setShowRenameModal(false)
              setSelectedProfile(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Create Profile Modal
function CreateProfileModal({ onClose, onCreated }: { onClose: () => void; onCreated: (profile: Profile) => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameInputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Profile name is required')
      return
    }

    if (usePassword) {
      if (!password) {
        setError('Password is required')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setLoading(true)
    try {
      const profile = await window.api.createProfile(name.trim(), usePassword ? password : undefined)
      onCreated(profile)
    } catch (err: any) {
      setError(err.message || 'Failed to create profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-charcoal-800 rounded-2xl border border-charcoal-700 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-charcoal-700">
          <h2 className="text-xl font-heading font-semibold text-cream-100">Create Profile</h2>
          <p className="text-sm text-charcoal-400 mt-1">Create a new library profile</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-charcoal-400 mb-2">Profile Name</label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter profile name"
              className="w-full px-4 py-3 rounded-lg bg-charcoal-900 border border-charcoal-700 text-cream-100 placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setUsePassword(!usePassword)}
              className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                usePassword
                  ? 'bg-amber-400 border-amber-400'
                  : 'border-charcoal-600 hover:border-charcoal-500'
              }`}
            >
              {usePassword && (
                <svg className="w-3 h-3 text-charcoal-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <label className="text-sm text-cream-200 cursor-pointer" onClick={() => setUsePassword(!usePassword)}>
              Protect with password
            </label>
          </div>

          {usePassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-charcoal-400 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 rounded-lg bg-charcoal-900 border border-charcoal-700 text-cream-100 placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-charcoal-400 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 rounded-lg bg-charcoal-900 border border-charcoal-700 text-cream-100 placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none transition-colors"
                />
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-4">
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
              className="flex-1 px-4 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-charcoal-900 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Password Modal
function PasswordModal({ 
  profile, 
  onClose, 
  onUnlock, 
  onError 
}: { 
  profile: Profile
  onClose: () => void
  onUnlock: () => void
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
    setLoading(true)

    try {
      await window.api.unlockProfile(profile.id, password)
      onUnlock()
    } catch (err: any) {
      setError('Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-charcoal-800 rounded-2xl border border-charcoal-700 shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-charcoal-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-heading font-semibold text-cream-100">{profile.name}</h2>
          <p className="text-sm text-charcoal-400 mt-1">Enter password to unlock</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-charcoal-900 border border-charcoal-700 text-cream-100 placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none transition-colors text-center"
          />

          <div className="flex gap-3">
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
              className="flex-1 px-4 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-charcoal-900 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Rename Profile Modal
function RenameProfileModal({ 
  profile, 
  onClose, 
  onRenamed 
}: { 
  profile: Profile
  onClose: () => void
  onRenamed: () => void
}) {
  const [name, setName] = useState(profile.name)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Profile name is required')
      return
    }

    setLoading(true)
    try {
      await window.api.renameProfile(profile.id, name.trim())
      onRenamed()
    } catch (err: any) {
      setError(err.message || 'Failed to rename profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
          <h2 className="text-xl font-heading font-semibold text-cream-100">Rename Profile</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Profile name"
            className="w-full px-4 py-3 rounded-lg bg-charcoal-900 border border-charcoal-700 text-cream-100 placeholder-charcoal-500 focus:border-amber-400/50 focus:outline-none transition-colors"
          />

          <div className="flex gap-3">
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
              className="flex-1 px-4 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-charcoal-900 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}


