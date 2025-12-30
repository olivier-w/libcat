import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from './stores/libraryStore'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { Gallery } from './components/Gallery'
import { DetailsPanel } from './components/DetailsPanel'
import { SearchBar } from './components/SearchBar'
import { ScanModal } from './components/ScanModal'

function App() {
  const { loadMovies, loadTags, isScanning, setScanProgress, setIsScanning, addMoviesToState } = useLibraryStore()
  const [showScanModal, setShowScanModal] = useState(false)

  useEffect(() => {
    // Load initial data
    loadMovies()
    loadTags()

    // Listen for scan progress
    const unsubscribe = window.api.onScanProgress((data) => {
      setScanProgress(data)
    })

    return () => {
      unsubscribe()
    }
  }, [loadMovies, loadTags, setScanProgress])

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
    } catch (error) {
      console.error('Scan failed:', error)
    } finally {
      setIsScanning(false)
      setScanProgress(null)
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
    } catch (error) {
      console.error('Failed to add files:', error)
    } finally {
      setIsScanning(false)
      setScanProgress(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
        <Sidebar />

        {/* Center - Gallery */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Gallery />
          
          {/* Bottom Bar with Search and Actions */}
          <div className="glass border-t border-charcoal-700/50 px-6 py-3 flex items-center justify-between">
            <SearchBar />
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddFolder}
                className="px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-cream-200 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Add Folder
              </motion.button>
              
              <div className="px-4 py-2 rounded-lg border border-dashed border-charcoal-600 text-charcoal-400 text-sm">
                Drop files here
              </div>
            </div>
          </div>
        </main>

        {/* Right - Details Panel */}
        <DetailsPanel />
      </div>

      {/* Scan Modal */}
      <AnimatePresence>
        {showScanModal && (
          <ScanModal onClose={() => !isScanning && setShowScanModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App

