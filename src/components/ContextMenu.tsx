import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean  // Red accent for destructive actions
  divider?: boolean // Show divider after this item
}

export interface ContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number; y: number }
  onClose: () => void
  header?: React.ReactNode // Optional header (e.g., "3 movies selected")
}

const MENU_MIN_WIDTH = 180
const MENU_PADDING = 8

export function ContextMenu({ items, position, onClose, header }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  // Get only enabled items for keyboard navigation
  const enabledItems = items.filter(item => !item.disabled)
  
  // Calculate adjusted position to keep menu in viewport
  useEffect(() => {
    if (!menuRef.current) return
    
    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    let x = position.x
    let y = position.y
    
    // Adjust horizontal position if menu would overflow right edge
    if (x + rect.width > viewportWidth - MENU_PADDING) {
      x = viewportWidth - rect.width - MENU_PADDING
    }
    // Ensure menu doesn't go off left edge
    if (x < MENU_PADDING) {
      x = MENU_PADDING
    }
    
    // Adjust vertical position if menu would overflow bottom edge
    if (y + rect.height > viewportHeight - MENU_PADDING) {
      y = viewportHeight - rect.height - MENU_PADDING
    }
    // Ensure menu doesn't go off top edge
    if (y < MENU_PADDING) {
      y = MENU_PADDING
    }
    
    setAdjustedPosition({ x, y })
  }, [position])
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    // Use mousedown to close before the click event fires
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev + 1
          return next >= enabledItems.length ? 0 : next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => {
          const next = prev - 1
          return next < 0 ? enabledItems.length - 1 : next
        })
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < enabledItems.length) {
          enabledItems[focusedIndex].onClick()
          onClose()
        }
        break
      case 'Tab':
        // Prevent tab from leaving the menu
        e.preventDefault()
        break
    }
  }, [onClose, focusedIndex, enabledItems])
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
  
  // Close on scroll (optional but good UX)
  useEffect(() => {
    const handleScroll = () => onClose()
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [onClose])
  
  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return
    item.onClick()
    onClose()
  }
  
  const menuContent = (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
        className="context-menu fixed z-[9999] rounded-xl bg-obsidian-400/95 backdrop-blur-xl border border-smoke-800/50 shadow-2xl shadow-black/50 py-1.5 overflow-hidden"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          minWidth: MENU_MIN_WIDTH,
        }}
        role="menu"
        aria-orientation="vertical"
      >
        {/* Optional header */}
        {header && (
          <div className="px-3 py-2 border-b border-smoke-800/30 mb-1">
            {header}
          </div>
        )}
        
        {/* Menu items */}
        {items.map((item, index) => {
          const enabledIndex = enabledItems.findIndex(ei => ei.id === item.id)
          const isFocused = enabledIndex === focusedIndex
          
          return (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => !item.disabled && setFocusedIndex(enabledIndex)}
                onMouseLeave={() => setFocusedIndex(-1)}
                disabled={item.disabled}
                className={`
                  context-menu-item w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 transition-colors
                  ${item.disabled 
                    ? 'text-smoke-700 cursor-not-allowed' 
                    : item.danger
                      ? 'text-smoke-300 hover:bg-cinnabar-500/15 hover:text-cinnabar-400'
                      : 'text-smoke-300 hover:bg-bronze-500/10 hover:text-pearl-200'
                  }
                  ${isFocused && !item.disabled
                    ? item.danger
                      ? 'bg-cinnabar-500/15 text-cinnabar-400'
                      : 'bg-bronze-500/10 text-pearl-200'
                    : ''
                  }
                `}
                role="menuitem"
                tabIndex={-1}
              >
                {/* Icon */}
                {item.icon && (
                  <span className={`flex-shrink-0 w-4 h-4 ${item.disabled ? 'opacity-50' : ''}`}>
                    {item.icon}
                  </span>
                )}
                
                {/* Label */}
                <span className="flex-1">{item.label}</span>
              </button>
              
              {/* Divider after this item */}
              {item.divider && index < items.length - 1 && (
                <div className="my-1.5 mx-2 h-px bg-smoke-800/40" />
              )}
            </div>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
  
  return createPortal(menuContent, document.body)
}

// Hook to manage context menu state
export interface ContextMenuState<T = unknown> {
  isOpen: boolean
  position: { x: number; y: number }
  data: T | null
}

export function useContextMenu<T = unknown>() {
  const [state, setState] = useState<ContextMenuState<T>>({
    isOpen: false,
    position: { x: 0, y: 0 },
    data: null,
  })
  
  const open = useCallback((e: React.MouseEvent, data?: T) => {
    e.preventDefault()
    e.stopPropagation()
    setState({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      data: data ?? null,
    })
  }, [])
  
  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])
  
  return { state, open, close }
}
