import { useState } from 'react'
import { motion } from 'framer-motion'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
}

export function StarRating({ value, onChange, readonly = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const displayValue = hoverValue || value

  return (
    <div 
      className="flex gap-1"
      onMouseLeave={() => setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          className={`w-6 h-6 transition-all relative ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
          whileHover={{ scale: readonly ? 1 : 1.2 }}
          whileTap={{ scale: readonly ? 1 : 0.9 }}
        >
          {/* Glow effect for filled stars */}
          {star <= displayValue && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: star <= displayValue ? 0.4 : 0,
                scale: star <= displayValue ? 1.2 : 1
              }}
              style={{ 
                background: 'radial-gradient(circle, rgba(217, 149, 110, 0.6) 0%, transparent 70%)',
                filter: 'blur(4px)'
              }}
            />
          )}
          
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full relative z-10"
          >
            <defs>
              <linearGradient id={`star-gradient-${star}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8A882" />
                <stop offset="100%" stopColor="#C47F5A" />
              </linearGradient>
            </defs>
            <motion.path
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              fill={star <= displayValue ? `url(#star-gradient-${star})` : 'none'}
              stroke={star <= displayValue ? '#D9956E' : '#3A3740'}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ 
                scale: star <= displayValue ? 1 : 0.9,
                opacity: star <= displayValue ? 1 : 0.5
              }}
              transition={{ duration: 0.15 }}
            />
          </svg>
        </motion.button>
      ))}
    </div>
  )
}
