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
    ? 'h-6 px-2 text-xs gap-1' 
    : 'h-7 px-3 text-sm gap-1.5'

  return (
    <motion.span
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`inline-flex items-center rounded-full transition-colors ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      style={{ 
        backgroundColor: `${tag.color}20`,
        color: tag.color,
      }}
      onClick={onClick}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      <span className="font-medium">{tag.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center ml-0.5 transition-colors"
        >
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.span>
  )
}

