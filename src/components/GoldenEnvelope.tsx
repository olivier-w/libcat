import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '../stores/libraryStore'
import type { Movie } from '../types'

interface GoldenEnvelopeProps {
  isOpen: boolean
  onClose: () => void
  onSelectMovie?: (movie: Movie) => void
}

type Phase = 'entering' | 'waiting' | 'opening' | 'revealing' | 'celebrating' | 'complete'

// Generate random confetti pieces - optimized for 60fps with fewer pieces
const generateConfetti = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.random() * Math.PI * 2)
    const velocity = 120 + Math.random() * 180 // Slightly reduced velocity
    return {
      id: i,
      delay: Math.random() * 0.15,
      rotation: Math.random() * 360,
      color: ['#D9956E', '#E8A882', '#C47F5A', '#F2D4C0', '#FFD700'][Math.floor(Math.random() * 5)],
      size: 6 + Math.random() * 6,
      shape: ['square', 'circle'][Math.floor(Math.random() * 2)] as 'square' | 'circle', // Removed star for perf
      velocityX: Math.cos(angle) * velocity,
      velocityY: Math.sin(angle) * velocity * 0.6 - 80,
    }
  })
}

// Generate dust particles - reduced count for performance
const generateDust = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 50 + Math.random() * 50, // Start lower for visibility
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 3,
    size: 2 + Math.random() * 2,
  }))
}

export function GoldenEnvelope({ isOpen, onClose, onSelectMovie }: GoldenEnvelopeProps) {
  const { filteredMovies } = useLibraryStore()
  const [phase, setPhase] = useState<Phase>('entering')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [displayedTitle, setDisplayedTitle] = useState('')
  const [confetti, setConfetti] = useState<ReturnType<typeof generateConfetti>>([])
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const dustParticles = useMemo(() => generateDust(8), []) // Reduced for 60fps
  
  // Use the current filtered movies from the store
  const availableMovies = filteredMovies
  
  // Pick a random movie
  const pickRandomMovie = useCallback(() => {
    if (availableMovies.length === 0) return null
    const randomIndex = Math.floor(Math.random() * availableMovies.length)
    return availableMovies[randomIndex]
  }, [availableMovies])
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('entering')
      setSelectedMovie(null)
      setDisplayedTitle('')
      setConfetti([])
      setImageLoaded(false)
      
      // Pick movie immediately but don't show it yet
      const movie = pickRandomMovie()
      if (movie) {
        setSelectedMovie(movie)
        // Preload image using the same logic as getPosterUrl
        if (movie.tmdb_poster_path) {
          const img = new Image()
          if (movie.tmdb_poster_path.startsWith('/')) {
            img.src = `https://image.tmdb.org/t/p/w500${movie.tmdb_poster_path}`
          } else {
            img.src = `local-file:///${movie.tmdb_poster_path.replace(/\\/g, '/')}`
          }
          img.onload = () => setImageLoaded(true)
          img.onerror = () => setImageLoaded(true) // Still show even if image fails
        } else if (movie.thumbnail_path) {
          const img = new Image()
          img.src = `local-file:///${movie.thumbnail_path.replace(/\\/g, '/')}`
          img.onload = () => setImageLoaded(true)
          img.onerror = () => setImageLoaded(true)
        } else {
          setImageLoaded(true)
        }
      }
      
      // Transition to waiting phase after entrance animation completes
      const timer = setTimeout(() => setPhase('waiting'), 600)
      return () => clearTimeout(timer)
    }
  }, [isOpen, pickRandomMovie])
  
  // Typewriter effect for title
  useEffect(() => {
    if (phase === 'revealing' && selectedMovie) {
      const title = selectedMovie.title || 'Unknown Title'
      let currentIndex = 0
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= title.length) {
          setDisplayedTitle(title.substring(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(typeInterval)
          // Move to celebration after title is complete
          setTimeout(() => {
            setConfetti(generateConfetti(50)) // Reduced for 60fps performance
            setPhase('celebrating')
            setTimeout(() => setPhase('complete'), 2000)
          }, 300)
        }
      }, 50)
      
      return () => clearInterval(typeInterval)
    }
  }, [phase, selectedMovie])
  
  // Handle envelope click
  const handleEnvelopeClick = () => {
    if (phase === 'waiting') {
      setPhase('opening')
      // Transition to revealing after opening animation
      setTimeout(() => setPhase('revealing'), 800)
    }
  }
  
  // Handle roll again
  const handleRollAgain = () => {
    setPhase('entering')
    setDisplayedTitle('')
    setConfetti([])
    setImageLoaded(false)
    
    const movie = pickRandomMovie()
    if (movie) {
      setSelectedMovie(movie)
      // Preload image using the same logic as getPosterUrl
      if (movie.tmdb_poster_path) {
        const img = new Image()
        if (movie.tmdb_poster_path.startsWith('/')) {
          img.src = `https://image.tmdb.org/t/p/w500${movie.tmdb_poster_path}`
        } else {
          img.src = `local-file:///${movie.tmdb_poster_path.replace(/\\/g, '/')}`
        }
        img.onload = () => setImageLoaded(true)
        img.onerror = () => setImageLoaded(true)
      } else if (movie.thumbnail_path) {
        const img = new Image()
        img.src = `local-file:///${movie.thumbnail_path.replace(/\\/g, '/')}`
        img.onload = () => setImageLoaded(true)
        img.onerror = () => setImageLoaded(true)
      } else {
        setImageLoaded(true)
      }
    }
    
    setTimeout(() => setPhase('waiting'), 500)
  }
  
  // Handle play movie
  const handlePlayMovie = () => {
    if (selectedMovie) {
      window.api.playVideo(selectedMovie.file_path)
      onClose()
    }
  }
  
  // Handle poster click - select movie and close
  const handlePosterClick = () => {
    if (selectedMovie && onSelectMovie) {
      onSelectMovie(selectedMovie)
      onClose()
    }
  }
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && phase === 'waiting') {
        handleEnvelopeClick()
      }
    }
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, phase])
  
  const getPosterUrl = (movie: Movie) => {
    // Check if tmdb_poster_path is a TMDB path (starts with /) or a local cached path
    if (movie.tmdb_poster_path) {
      if (movie.tmdb_poster_path.startsWith('/')) {
        // It's a TMDB path
        return `https://image.tmdb.org/t/p/w500${movie.tmdb_poster_path}`
      } else {
        // It's a local cached poster path - use local-file protocol with forward slashes
        return `local-file:///${movie.tmdb_poster_path.replace(/\\/g, '/')}`
      }
    }
    if (movie.thumbnail_path) {
      return `local-file:///${movie.thumbnail_path.replace(/\\/g, '/')}`
    }
    return null
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center envelope-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Spotlight cone */}
        <div className="spotlight-cone" />
        
        {/* Dust particles - using CSS animation for 60fps */}
        {dustParticles.map((particle) => (
          <div
            key={particle.id}
            className="dust-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
        
        {/* Confetti - bursts from center - optimized for 60fps */}
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="confetti-piece pointer-events-none fixed"
            style={{
              left: '50%',
              top: '40%',
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.shape === 'circle' ? '50%' : '2px',
              zIndex: 100,
              willChange: 'transform, opacity',
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              rotate: 0, 
              opacity: 0, 
              scale: 0 
            }}
            animate={{
              x: piece.velocityX,
              y: piece.velocityY + 350,
              rotate: piece.rotation + 360,
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: piece.delay,
              ease: 'easeOut',
            }}
          />
        ))}
        
        {/* Main content container */}
        <motion.div
          className="relative flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Golden flash on reveal */}
          <AnimatePresence>
            {phase === 'opening' && (
              <motion.div
                className="absolute inset-0 pointer-events-none golden-flash"
                style={{ width: '600px', height: '600px', margin: 'auto' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            )}
          </AnimatePresence>
          
          {/* Envelope or Card */}
          <AnimatePresence mode="wait">
            {(phase === 'entering' || phase === 'waiting' || phase === 'opening') && (
              <motion.div
                key="envelope"
                className="relative cursor-pointer envelope-container"
                data-waiting={phase === 'waiting' ? 'true' : 'false'}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeIn' }}
                onClick={handleEnvelopeClick}
              >
                {/* Envelope container */}
                <div className="relative" style={{ width: '360px', height: '240px' }}>
                  
                  {/* Back of envelope (visible when flap opens) - inside color */}
                  <div 
                    className="absolute rounded-t-lg"
                    style={{
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '100px',
                      background: 'linear-gradient(180deg, #8B6544 0%, #A67B52 100%)',
                      zIndex: 1,
                    }}
                  />
                  
                  {/* Envelope body (front) */}
                  <div 
                    className="absolute rounded-lg overflow-hidden"
                    style={{
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(165deg, #E8C896 0%, #D4A574 30%, #C4956A 60%, #B8885F 100%)',
                      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                      zIndex: 2,
                    }}
                  >
                    {/* Inner V-fold lines (where letter sits) */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 360 240" preserveAspectRatio="none">
                      {/* Left fold line */}
                      <line x1="0" y1="0" x2="180" y2="140" stroke="rgba(0,0,0,0.08)" strokeWidth="1"/>
                      {/* Right fold line */}
                      <line x1="360" y1="0" x2="180" y2="140" stroke="rgba(0,0,0,0.08)" strokeWidth="1"/>
                      {/* Bottom fold shadow */}
                      <path d="M 0 240 L 180 100 L 360 240 Z" fill="rgba(0,0,0,0.03)"/>
                    </svg>
                    
                    {/* Paper texture */}
                    <div 
                      className="absolute inset-0 opacity-20 mix-blend-overlay"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      }}
                    />
                    
                    {/* Gold trim along edges */}
                    <div className="absolute inset-2 border border-amber-400/20 rounded pointer-events-none" />
                    
                    {/* Shimmer effect */}
                    {phase === 'waiting' && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                          backgroundSize: '200% 100%',
                        }}
                        animate={{
                          backgroundPosition: ['200% 0', '-200% 0'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: 'linear',
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Envelope flap - flips from pointing DOWN to pointing UP */}
                  <motion.div
                    className="absolute"
                    style={{ 
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '140px',
                      transformOrigin: 'center top', // Hinge at top edge (where flap connects to envelope)
                      zIndex: phase === 'opening' ? 1 : 5, // Go behind envelope when open
                      willChange: 'transform',
                    }}
                    animate={{
                      scaleY: phase === 'opening' ? -1 : 1, // Flip vertically around top edge
                    }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div 
                      className="absolute w-full h-full"
                      style={{
                        background: 'linear-gradient(180deg, #D4A574 0%, #C4956A 50%, #B8885F 100%)',
                        clipPath: 'polygon(0 0, 100% 0, 50% 100%)', // Base at TOP, point at BOTTOM (▼)
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      {/* Flap texture */}
                      <div 
                        className="absolute inset-0 opacity-10 mix-blend-overlay"
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        }}
                      />
                    </div>
                  </motion.div>
                  
                  {/* Wax seal - positioned higher on the envelope for better visual balance */}
                  <motion.div
                    className={`absolute rounded-full flex items-center justify-center ${phase === 'waiting' ? 'seal-pulse' : ''}`}
                    style={{ 
                      width: '72px', 
                      height: '72px', 
                      top: '84px', // Moved higher for better visual centering on envelope face
                      left: '144px', // (360 - 72) / 2 = 144 for perfect center
                      zIndex: 30,
                      background: 'radial-gradient(circle at 30% 30%, #E8A882 0%, #D9956E 30%, #C47F5A 60%, #A86B4A 100%)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)',
                    }}
                    animate={{
                      opacity: phase === 'opening' ? 0 : 1,
                      scale: phase === 'opening' ? 0.3 : 1,
                      y: phase === 'opening' ? -20 : 0,
                      rotate: phase === 'waiting' ? [0, 3, -3, 0] : 0,
                    }}
                    transition={{ 
                      duration: 0.4,
                      rotate: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  >
                    {/* Seal emboss effect */}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                      }}
                    />
                    {/* Star emblem */}
                    <svg className="w-9 h-9 relative z-10" fill="rgba(0,0,0,0.3)" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            )}
            
            {/* Award Card with Movie */}
            {(phase === 'revealing' || phase === 'celebrating' || phase === 'complete') && selectedMovie && (
              <motion.div
                key="card"
                className="relative"
                initial={{ y: 100, opacity: 0, rotateY: -90 }}
                animate={{ y: 0, opacity: 1, rotateY: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 80, 
                  damping: 15,
                  delay: 0.2
                }}
              >
                {/* Card with gold border */}
                <div className="relative">
                  {/* Outer gold border */}
                  <div 
                    className="award-card-border absolute -inset-1 rounded-xl"
                    style={{ padding: '3px' }}
                  />
                  
                  {/* Card content */}
                  <div 
                    className="award-card relative rounded-xl p-6 flex flex-col items-center"
                    style={{ width: '400px', minHeight: '520px', maxHeight: '85vh', overflowY: 'auto' }}
                  >
                    {/* Decorative corner flourishes */}
                    <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-bronze-500/30 rounded-tl" />
                    <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-bronze-500/30 rounded-tr" />
                    <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-bronze-500/30 rounded-bl" />
                    <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-bronze-500/30 rounded-br" />
                    
                    {/* Header text */}
                    <motion.p
                      className="text-bronze-600/70 text-sm uppercase tracking-[0.2em] mb-2 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Tonight's Selection
                    </motion.p>
                    
                    {/* Movie title with typewriter effect */}
                    <div className="text-center mb-4 min-h-[4rem] flex items-center justify-center">
                      <h2 className="art-deco-title text-2xl font-bold text-obsidian-700 leading-tight">
                        {displayedTitle}
                        {phase === 'revealing' && displayedTitle.length < (selectedMovie.title || '').length && (
                          <span className="typewriter-cursor text-bronze-500">|</span>
                        )}
                      </h2>
                    </div>
                    
                    {/* Year */}
                    <motion.p
                      className="text-bronze-600/60 text-lg mb-4 font-light"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: phase === 'celebrating' || phase === 'complete' ? 1 : 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {selectedMovie.year || selectedMovie.tmdb_release_date?.split('-')[0] || ''}
                    </motion.p>
                    
                    {/* Movie poster - clickable to select */}
                    <motion.div
                      className="relative w-48 h-72 rounded-lg overflow-hidden poster-glow cursor-pointer flex-shrink-0"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: phase === 'celebrating' || phase === 'complete' ? 1 : 0,
                        scale: phase === 'celebrating' || phase === 'complete' ? 1 : 0.8,
                      }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      onClick={handlePosterClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      title="Click to view details"
                    >
                      {getPosterUrl(selectedMovie) ? (
                        <img
                          src={getPosterUrl(selectedMovie)!}
                          alt={selectedMovie.title || 'Movie poster'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-obsidian-400 to-obsidian-600 flex items-center justify-center">
                          <svg className="w-16 h-16 text-smoke-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Celebration shimmer overlay */}
                      {phase === 'celebrating' && (
                        <div className="absolute inset-0 celebration-shimmer pointer-events-none" />
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
                          View Details
                        </span>
                      </div>
                    </motion.div>
                    
                    {/* Genres */}
                    {selectedMovie.tmdb_genres && (
                      <motion.div
                        className="flex flex-wrap justify-center gap-2 mt-4 max-w-full"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: phase === 'celebrating' || phase === 'complete' ? 1 : 0,
                          y: phase === 'celebrating' || phase === 'complete' ? 0 : 10,
                        }}
                        transition={{ delay: 0.45, duration: 0.3 }}
                      >
                        {(() => {
                          try {
                            // Parse JSON array if it's in that format
                            const genres = selectedMovie.tmdb_genres.startsWith('[') 
                              ? JSON.parse(selectedMovie.tmdb_genres) 
                              : selectedMovie.tmdb_genres.split(',').map(g => g.trim())
                            return genres.slice(0, 3).map((genre: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 text-xs font-medium rounded-full bg-bronze-600/10 text-bronze-700 border border-bronze-500/20"
                              >
                                {genre}
                              </span>
                            ))
                          } catch {
                            return null
                          }
                        })()}
                      </motion.div>
                    )}
                    
                    {/* Overview */}
                    {selectedMovie.tmdb_overview && (
                      <motion.p
                        className="mt-4 text-sm text-obsidian-500/80 text-center leading-relaxed max-w-[340px] line-clamp-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: phase === 'complete' ? 1 : 0,
                          y: phase === 'complete' ? 0 : 10,
                        }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                      >
                        {selectedMovie.tmdb_overview}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
        </motion.div>
        
        {/* Instruction text - positioned fixed to prevent layout shift */}
        <AnimatePresence>
          {phase === 'waiting' && (
            <motion.div
              className="fixed left-1/2 -translate-x-1/2 text-center"
              style={{ top: 'calc(50% + 160px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-pearl-300/50 text-sm uppercase tracking-[0.2em] mb-1 whitespace-nowrap">
                And the selection is...
              </p>
              <motion.p 
                className="text-pearl-200/80 text-lg font-medium tracking-wide"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Click to reveal
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Action buttons - positioned fixed to prevent layout shift */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              className="fixed left-1/2 -translate-x-1/2 flex gap-4"
              style={{ top: 'calc(50% + 340px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                className="px-6 py-3 rounded-xl btn-primary flex items-center gap-2 text-base font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayMovie}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Now
              </motion.button>
              
              <motion.button
                className="px-6 py-3 rounded-xl btn-secondary flex items-center gap-2 text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRollAgain}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Roll Again
              </motion.button>
              
              <motion.button
                className="px-6 py-3 rounded-xl btn-ghost text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
              >
                Close
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Close button */}
        <motion.button
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-obsidian-500/50 hover:bg-obsidian-400/50 flex items-center justify-center text-smoke-400 hover:text-pearl-200 transition-colors"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
        
        {/* No unwatched movies message */}
        {availableMovies.length === 0 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-obsidian-500/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-smoke-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-heading font-semibold text-pearl-200 mb-2">
              No Movies Available
            </h3>
            <p className="text-smoke-400 max-w-xs mx-auto">
              No movies match the current filter. Try adjusting your filters or adding more movies to your library.
            </p>
            <motion.button
              className="mt-6 px-6 py-3 rounded-xl btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
            >
              Close
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
