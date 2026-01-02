import { motion } from 'framer-motion'
import type { Tag } from '../types'

interface TagPillProps {
  tag: Tag
  onRemove?: () => void
  onClick?: () => void
  size?: 'sm' | 'md'
}

export function TagPill({ tag, onRemove, onClick, size = 'sm' }: TagPillProps) {
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : 'text-sm px-2.5 py-1 gap-1.5'

  return (
    <motion.span
      className={`inline-flex items-center rounded-full font-medium transition-all cursor-default group ${sizeClasses}`}
      style={{ 
        backgroundColor: `${tag.color}15`,
        color: tag.color,
        border: `1px solid ${tag.color}25`
      }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      layout
    >
      {/* Color dot */}
      <span
        className={`rounded-full flex-shrink-0 ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ 
          backgroundColor: tag.color,
          boxShadow: `0 0 4px ${tag.color}50`
        }}
      />
      
      <span className="truncate max-w-[80px]">{tag.name}</span>
      
      {onRemove && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className={`rounded-full hover:bg-white/10 flex items-center justify-center transition-all opacity-60 hover:opacity-100 ${
            size === 'sm' ? 'w-3.5 h-3.5 -mr-0.5' : 'w-4 h-4 -mr-1'
          }`}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg 
            className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      )}
    </motion.span>
  )
}
