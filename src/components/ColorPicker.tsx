import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PRESET_COLORS } from './Sidebar'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
  size?: 'sm' | 'md'
  showCustomInput?: boolean
  previewText?: string
}

// Validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(color)
}

// Normalize hex color (3-char to 6-char)
function normalizeHexColor(color: string): string {
  if (!color.startsWith('#')) {
    color = '#' + color
  }
  // Convert 3-char hex to 6-char
  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const r = color[1]
    const g = color[2]
    const b = color[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return color.toUpperCase()
}

export function ColorPicker({ 
  value, 
  onChange, 
  disabled = false, 
  size = 'md',
  showCustomInput = true,
  previewText
}: ColorPickerProps) {
  const [customHex, setCustomHex] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [hexError, setHexError] = useState(false)

  // Check if current value is a custom color (not in presets)
  const isCustomColor = !PRESET_COLORS.includes(value.toUpperCase()) && !PRESET_COLORS.includes(value)

  // Sync custom hex input with value when it's a custom color
  useEffect(() => {
    if (isCustomColor && value) {
      setCustomHex(value.replace('#', '').toUpperCase())
      setShowCustom(true)
    }
  }, [value, isCustomColor])

  const handleCustomHexChange = (input: string) => {
    // Remove # if user types it
    const cleaned = input.replace('#', '').toUpperCase()
    setCustomHex(cleaned)
    setHexError(false)

    // Auto-apply when we have a valid 6-char hex
    if (cleaned.length === 6 && /^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      onChange('#' + cleaned)
    } else if (cleaned.length === 3 && /^[0-9A-Fa-f]{3}$/.test(cleaned)) {
      onChange(normalizeHexColor('#' + cleaned))
    }
  }

  const handleCustomHexBlur = () => {
    if (customHex && !isValidHexColor('#' + customHex)) {
      setHexError(true)
    }
  }

  const handlePresetClick = (color: string) => {
    onChange(color)
    setShowCustom(false)
    setCustomHex('')
    setHexError(false)
  }

  const swatchSize = size === 'sm' ? 'w-[18px] h-[18px]' : 'w-6 h-6'

  return (
    <div className="space-y-2">
      {/* Preset Colors */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => (
          <motion.button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            disabled={disabled}
            className={`${swatchSize} rounded-full transition-all disabled:opacity-50`}
            style={{ backgroundColor: color }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: value.toUpperCase() === color.toUpperCase()
                ? `0 0 0 2px rgba(255,255,255,0.3), 0 0 8px ${color}` 
                : 'none'
            }}
          />
        ))}
        
        {/* Custom Color Toggle Button */}
        {showCustomInput && (
          <motion.button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            disabled={disabled}
            className={`${swatchSize} rounded-full transition-all disabled:opacity-50 flex items-center justify-center border-2 border-dashed`}
            style={{ 
              borderColor: showCustom || isCustomColor ? value : 'rgba(255,255,255,0.2)',
              backgroundColor: isCustomColor ? value : 'transparent'
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title="Custom color"
          >
            {!isCustomColor && (
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke={showCustom ? value : 'currentColor'} 
                viewBox="0 0 24 24"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </motion.button>
        )}
      </div>

      {/* Custom Hex Input */}
      <AnimatePresence>
        {showCustomInput && showCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-smoke-500 text-sm font-mono">
                  #
                </span>
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  onBlur={handleCustomHexBlur}
                  placeholder="FFFFFF"
                  maxLength={6}
                  disabled={disabled}
                  className={`w-full pl-7 pr-3 py-1.5 rounded-md bg-obsidian-600/80 border text-pearl-200 text-sm font-mono placeholder-smoke-600 focus:ring-1 focus:outline-none transition-all disabled:opacity-50 ${
                    hexError 
                      ? 'border-cinnabar-500/50 focus:border-cinnabar-500/50 focus:ring-cinnabar-500/20' 
                      : 'border-smoke-800/50 focus:border-bronze-500/50 focus:ring-bronze-500/20'
                  }`}
                />
              </div>
              
              {/* Color Preview */}
              <div 
                className="w-8 h-8 rounded-lg border border-smoke-800/50 flex-shrink-0"
                style={{ 
                  backgroundColor: isValidHexColor('#' + customHex) ? '#' + customHex : value,
                  boxShadow: `inset 0 1px 2px rgba(0,0,0,0.3)`
                }}
              />
            </div>
            
            {hexError && (
              <p className="text-xs text-cinnabar-400 mt-1">
                Enter a valid hex color (e.g., F4A261)
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview with Text (optional) */}
      {previewText && (
        <div className="pt-1">
          <div 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${value}15`,
              color: value,
              border: `1px solid ${value}25`
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: value,
                boxShadow: `0 0 4px ${value}50`
              }}
            />
            {previewText}
          </div>
        </div>
      )}
    </div>
  )
}
