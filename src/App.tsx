import { useEffect, useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
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

  if (!activeProfile) {
    return <ProfileSelector onProfileSelected={handleProfileSelected} />
  }

  return (
    <div className="h-screen flex flex-col bg-obsidian-700 overflow-hidden">
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
