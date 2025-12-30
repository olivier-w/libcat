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
          whileHover={{ scale: readonly ? 1 : 1.15 }}
          whileTap={{ scale: readonly ? 1 : 0.9 }}
          className={`w-6 h-6 transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={star <= displayValue ? '#f4a261' : 'none'}
            stroke={star <= displayValue ? '#f4a261' : '#47474f'}
            strokeWidth={2}
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </motion.button>
      ))}
    </div>
  )
}

