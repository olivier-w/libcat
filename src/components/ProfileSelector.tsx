import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WindowControls } from './WindowControls'

interface Profile {
  id: string
  name: string
  passwordHash: string | null
  createdAt: string
}

interface ProfileSelectorProps {
  onProfileSelected: (profile: Profile) => void
}

// Floating particles component
function FloatingParticles() {
  const particles = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 15 + Math.random() * 10,
      size: 1 + Math.random() * 2,
    }))
  , [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-bronze-500/30"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -window.innerHeight - 20],
            x: [0, Math.random() * 40 - 20],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
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
      'from-rose-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-cyan-400 to-sky-500',
      'from-violet-400 to-purple-500',
      'from-fuchsia-400 to-pink-500',
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-obsidian-700">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-6 h-6 rounded-full border-2 border-bronze-400 border-t-transparent animate-spin" />
          <span className="text-smoke-400 text-sm">Loading profiles...</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 bg-obsidian-700" />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Title Bar */}
      <div 
        className="h-10 flex items-center justify-between pl-4 relative z-10" 
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-xs font-medium text-smoke-600">libcat</span>
        <WindowControls className="" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12"
        >
          {/* Logo */}
          <motion.div 
            className="w-16 h-16 rounded-2xl gradient-accent mx-auto mb-6 flex items-center justify-center shadow-xl shadow-bronze-500/20"
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          >
            <svg className="w-9 h-9 text-obsidian-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h-2v-2h2zm-2-2H7v4h6v-4zm2 0h2v2h-2v-2zm-8-2h2v2H7v-2zm-2 2v2H3v-2h2zm2-4V5H3v2h4z" />
            </svg>
          </motion.div>
          
          <h1 className="text-4xl font-heading font-bold text-pearl-100 mb-3 tracking-tight">
            Welcome to LibCat
          </h1>
          <p className="text-smoke-500 text-lg">
            Select a profile to continue
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mb-8 px-5 py-3 glass-card rounded-xl text-cinnabar-400 text-sm border border-cinnabar-500/20"
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {profiles.map((profile, index) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => handleProfileClick(profile)}
              onContextMenu={(e) => handleContextMenu(e, profile)}
              className="group flex flex-col items-center pt-5 pb-4 px-5 rounded-2xl glass-card hover:bg-obsidian-400/40 border border-smoke-800/30 hover:border-smoke-700/50 transition-all duration-300 min-w-[140px]"
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Avatar with integrated lock badge */}
              <div className="relative mb-2.5">
                <motion.div 
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getProfileColor(profile.name)} flex items-center justify-center text-3xl font-bold text-white shadow-lg relative overflow-hidden`}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {profile.name.charAt(0).toUpperCase()}
                </motion.div>
                
                {/* Lock badge - only shown for password-protected profiles */}
                {profile.passwordHash && (
                  <motion.div 
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-obsidian-600 border border-smoke-700/50 flex items-center justify-center shadow-md"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.08 + 0.15, type: 'spring', stiffness: 400 }}
                  >
                    <svg className="w-3 h-3 text-smoke-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </motion.div>
                )}
              </div>
              
              {/* Name */}
              <span className="text-pearl-200 font-medium text-base">{profile.name}</span>
            </motion.button>
          ))}

          {/* Create New Profile */}
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: profiles.length * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center pt-5 pb-4 px-5 rounded-2xl border-2 border-dashed border-smoke-800/50 hover:border-bronze-500/50 hover:bg-bronze-500/5 transition-all duration-300 min-w-[140px] group"
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-obsidian-500/50 border border-smoke-800/30 flex items-center justify-center text-smoke-600 group-hover:text-bronze-400 group-hover:border-bronze-500/30 transition-all mb-2.5"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </motion.div>
            <span className="text-smoke-500 group-hover:text-bronze-400 font-medium text-base transition-colors">New Profile</span>
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
            transition={{ duration: 0.1 }}
            className="fixed z-50 py-1.5 rounded-xl glass-card border border-smoke-800/50 shadow-2xl min-w-[160px] overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleRenameClick(contextMenu.profile)}
              className="w-full px-4 py-2.5 text-left text-sm text-pearl-300 hover:bg-obsidian-400/50 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-smoke-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            <button
              onClick={() => handleDeleteProfile(contextMenu.profile)}
              className="w-full px-4 py-2.5 text-left text-sm text-cinnabar-400 hover:bg-cinnabar-500/10 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateProfileModal
            onClose={() => setShowCreateModal(false)}
            onCreated={async () => {
              await loadProfiles()
              setShowCreateModal(false)
            }}
          />
        )}
      </AnimatePresence>

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
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-card rounded-2xl border border-smoke-800/50 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-smoke-800/30">
          <h2 className="text-xl font-heading font-semibold text-pearl-100">Create Profile</h2>
          <p className="text-sm text-smoke-500 mt-1">Create a new library profile</p>
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
            <label className="block text-sm text-smoke-400 mb-2 font-medium">Profile Name</label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter profile name"
              className="w-full px-4 py-3 rounded-xl input-field"
            />
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              onClick={() => setUsePassword(!usePassword)}
              className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                usePassword
                  ? 'bg-bronze-500 border-bronze-500'
                  : 'border-smoke-700 hover:border-smoke-600'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              {usePassword && (
                <motion.svg 
                  className="w-3 h-3 text-obsidian-900" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </motion.button>
            <label className="text-sm text-smoke-300 cursor-pointer" onClick={() => setUsePassword(!usePassword)}>
              Protect with password
            </label>
          </div>

          <AnimatePresence>
            {usePassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-sm text-smoke-400 mb-2 font-medium">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 rounded-xl input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm text-smoke-400 mb-2 font-medium">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-4 py-3 rounded-xl input-field"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 pt-4">
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
              className="flex-1 px-4 py-3 rounded-xl btn-primary font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Creating...' : 'Create'}
            </motion.button>
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
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
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
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-obsidian-500/50 border border-smoke-800/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-smoke-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-heading font-semibold text-pearl-100">{profile.name}</h2>
          <p className="text-sm text-smoke-500 mt-1">Enter password to unlock</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 py-3 rounded-xl bg-cinnabar-500/10 border border-cinnabar-500/20 text-cinnabar-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl input-field text-center"
          />

          <div className="flex gap-3">
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
              className="flex-1 px-4 py-3 rounded-xl btn-primary font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </motion.button>
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
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
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
          <h2 className="text-xl font-heading font-semibold text-pearl-100">Rename Profile</h2>
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

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Profile name"
            className="w-full px-4 py-3 rounded-xl input-field"
          />

          <div className="flex gap-3">
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
              className="flex-1 px-4 py-3 rounded-xl btn-primary font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Saving...' : 'Save'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
