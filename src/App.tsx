import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore, Profile } from './stores/libraryStore'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Gallery } from './components/Gallery'
import { DetailsPanel } from './components/DetailsPanel'
import { ScanModal } from './components/ScanModal'
import { ProfileSelector } from './components/ProfileSelector'
import { Toast } from './components/Toast'
import { SettingsModal } from './components/SettingsModal'
import { useToastStore } from './stores/toastStore'

function App() {
  const { 
    activeProfile, 
    setActiveProfile, 
    loadMovies, 
    loadTags, 
    isScanning, 
    setScanProgress, 
    setIsScanning 
  } = useLibraryStore()
  const addToast = useToastStore((state) => state.addToast)
  const [showScanModal, setShowScanModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragFileCount, setDragFileCount] = useState(0)
  const scanCancelledRef = useRef(false)

  useEffect(() => {
    if (activeProfile) {
      loadMovies()
      loadTags()
    }
  }, [activeProfile, loadMovies, loadTags])

  useEffect(() => {
    const unsubscribeProgress = window.api.onScanProgress((data) => {
      setScanProgress(data)
    })

    const unsubscribeCancelled = window.api.onScanCancelled((data) => {
      scanCancelledRef.current = true
      setIsScanning(false)
      setScanProgress(null)
      setShowScanModal(false)
      
      if (data.processed > 0) {
        loadMovies()
        addToast(`Scan cancelled. ${data.processed} ${data.processed === 1 ? 'movie' : 'movies'} added.`, 'info')
      } else {
        addToast('Scan cancelled.', 'info')
      }
    })

    return () => {
      unsubscribeProgress()
      unsubscribeCancelled()
    }
  }, [setScanProgress, setIsScanning, loadMovies, addToast])

  const handleProfileSelected = (profile: Profile) => {
    setActiveProfile(profile)
  }

  const handleAddFolder = async () => {
    const folderPath = await window.api.selectFolder()
    if (!folderPath) return

    scanCancelledRef.current = false
    setIsScanning(true)
    setShowScanModal(true)
    
    try {
      const movies = await window.api.scanFolder(folderPath)
      // If cancelled, the onScanCancelled handler will take care of cleanup
      if (scanCancelledRef.current) return
      
      const newMovies = movies.filter((m: { skipped?: boolean }) => !m.skipped)
      if (newMovies.length > 0) {
        await loadMovies()
      }
      addToast('Scan complete! Your library has been updated.', 'success')
    } catch (error) {
      if (scanCancelledRef.current) return
      console.error('Scan failed:', error)
      addToast('Scan failed. Please try again.', 'error')
    } finally {
      if (!scanCancelledRef.current) {
        setIsScanning(false)
        setScanProgress(null)
        setShowScanModal(false)
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragFileCount(0)

    const files = Array.from(e.dataTransfer.files)
    const paths = files.map((f) => f.path)

    if (paths.length === 0) return

    scanCancelledRef.current = false
    setIsScanning(true)
    setShowScanModal(true)

    try {
      const movies = await window.api.addFromPaths(paths)
      // If cancelled, the onScanCancelled handler will take care of cleanup
      if (scanCancelledRef.current) return
      
      const newMovies = movies.filter((m: { skipped?: boolean }) => !m.skipped)
      if (newMovies.length > 0) {
        await loadMovies()
      }
      addToast('Scan complete! Your library has been updated.', 'success')
    } catch (error) {
      if (scanCancelledRef.current) return
      console.error('Failed to add files:', error)
      addToast('Scan failed. Please try again.', 'error')
    } finally {
      if (!scanCancelledRef.current) {
        setIsScanning(false)
        setScanProgress(null)
        setShowScanModal(false)
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    if (e.dataTransfer.items) {
      setDragFileCount(e.dataTransfer.items.length)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set isDragging to false if we're leaving the app container
    if (e.currentTarget === e.target) {
      setIsDragging(false)
      setDragFileCount(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (!activeProfile) {
    return <ProfileSelector onProfileSelected={handleProfileSelected} />
  }

  return (
    <div 
      className="h-screen flex flex-col bg-obsidian-700 overflow-hidden relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar onAddFolder={handleAddFolder} onOpenSettings={() => setShowSettings(true)} />

        {/* Center - Gallery */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Gallery />
        </main>

        {/* Right - Details Panel */}
        <DetailsPanel />
      </div>

      {/* Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 flex items-center justify-center drop-overlay pointer-events-none"
          >
            <motion.div 
              className="relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Pulsing outer ring */}
              <motion.div
                className="absolute -inset-8 rounded-3xl border-2 border-bronze-500/30"
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              {/* Main drop zone */}
              <div className="glass-card rounded-2xl border-2 border-dashed border-bronze-500/60 p-12 text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-accent flex items-center justify-center shadow-xl shadow-bronze-500/20"
                >
                  <svg className="w-10 h-10 text-obsidian-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </motion.div>
                
                <h3 className="text-xl font-heading font-semibold text-pearl-100 mb-2">
                  Drop to Add
                </h3>
                <p className="text-sm text-smoke-500">
                  {dragFileCount > 0 
                    ? `${dragFileCount} ${dragFileCount === 1 ? 'file' : 'files'} ready to import`
                    : 'Release to add movies to your library'}
                </p>
                
                {/* File count badge */}
                {dragFileCount > 0 && (
                  <motion.div 
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bronze-500/20 border border-bronze-500/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <svg className="w-4 h-4 text-bronze-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-bronze-400">{dragFileCount} files</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Modal */}
      <AnimatePresence>
        {showScanModal && isScanning && (
          <ScanModal />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toast />
    </div>
  )
}

export default App
