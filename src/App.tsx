import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore, Profile } from './stores/libraryStore'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Gallery } from './components/Gallery'
import { DetailsPanel } from './components/DetailsPanel'
import { ScanModal } from './components/ScanModal'
import { ProfileSelector } from './components/ProfileSelector'
import { ToastContainer } from './components/Toast'

interface Toast {
  id: string
  message: string
  type?: 'success' | 'error' | 'info'
}

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
  const [showScanModal, setShowScanModal] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  useEffect(() => {
    if (activeProfile) {
      // Load initial data when profile is active
      loadMovies()
      loadTags()
    }
  }, [activeProfile, loadMovies, loadTags])

  useEffect(() => {
    // Listen for scan progress
    const unsubscribe = window.api.onScanProgress((data) => {
      setScanProgress(data)
    })

    return () => {
      unsubscribe()
    }
  }, [setScanProgress])

  const handleProfileSelected = (profile: Profile) => {
    setActiveProfile(profile)
  }

  const handleAddFolder = async () => {
    const folderPath = await window.api.selectFolder()
    if (!folderPath) return

    setIsScanning(true)
    setShowScanModal(true)
    
    try {
      const movies = await window.api.scanFolder(folderPath)
      const newMovies = movies.filter((m: { skipped?: boolean }) => !m.skipped)
      if (newMovies.length > 0) {
        // Reload all movies to get fresh data with tags
        await loadMovies()
      }
      // Show success toast
      addToast('Scan complete! Your library has been updated.', 'success')
    } catch (error) {
      console.error('Scan failed:', error)
      addToast('Scan failed. Please try again.', 'error')
    } finally {
      setIsScanning(false)
      setScanProgress(null)
      setShowScanModal(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const paths = files.map((f) => f.path)

    if (paths.length === 0) return

    setIsScanning(true)
    setShowScanModal(true)

    try {
      const movies = await window.api.addFromPaths(paths)
      const newMovies = movies.filter((m: { skipped?: boolean }) => !m.skipped)
      if (newMovies.length > 0) {
        await loadMovies()
      }
      // Show success toast
      addToast('Scan complete! Your library has been updated.', 'success')
    } catch (error) {
      console.error('Failed to add files:', error)
      addToast('Scan failed. Please try again.', 'error')
    } finally {
      setIsScanning(false)
      setScanProgress(null)
      setShowScanModal(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Show profile selector if no profile is active
  if (!activeProfile) {
    return <ProfileSelector onProfileSelected={handleProfileSelected} />
  }

  return (
    <div 
      className="h-screen flex flex-col bg-charcoal-900 overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar onAddFolder={handleAddFolder} />

        {/* Center - Gallery */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Gallery />
        </main>

        {/* Right - Details Panel */}
        <DetailsPanel />
      </div>

      {/* Scan Modal */}
      <AnimatePresence>
        {showScanModal && isScanning && (
          <ScanModal />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
