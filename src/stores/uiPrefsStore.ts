import { create } from 'zustand'

export type LowPowerOverride = 'unset' | 'on' | 'off'

interface StoredUIPrefs {
  lowPowerOverride: LowPowerOverride
}

interface UIPrefsState {
  lowPowerOverride: LowPowerOverride
  lowPowerEnabled: boolean
  setLowPowerEnabled: (enabled: boolean) => void
  clearLowPowerOverride: () => void
}

const STORAGE_KEY = 'libcat.uiPrefs.v1'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let hasInitialized = false
let mediaQueryList: MediaQueryList | null = null
let mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null
let storageListenerAttached = false

function getSystemLowPowerEnabled(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function deriveLowPowerEnabled(override: LowPowerOverride): boolean {
  if (override === 'on') return true
  if (override === 'off') return false
  return getSystemLowPowerEnabled()
}

function sanitizeOverride(value: unknown): LowPowerOverride {
  if (value === 'on' || value === 'off' || value === 'unset') {
    return value
  }
  return 'unset'
}

function readStoredOverride(): LowPowerOverride {
  if (typeof window === 'undefined') return 'unset'

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return 'unset'

    const parsed = JSON.parse(raw) as Partial<StoredUIPrefs>
    return sanitizeOverride(parsed.lowPowerOverride)
  } catch {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage cleanup errors
    }
    return 'unset'
  }
}

function writeStoredOverride(override: LowPowerOverride): void {
  if (typeof window === 'undefined') return

  try {
    const payload: StoredUIPrefs = { lowPowerOverride: override }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore persistence errors
  }
}

function applyOverride(override: LowPowerOverride): void {
  useUIPrefsStore.setState({
    lowPowerOverride: override,
    lowPowerEnabled: deriveLowPowerEnabled(override),
  })
}

function ensureMediaQuerySubscription(override: LowPowerOverride): void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  if (!mediaQueryList) {
    mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY)
  }

  if (!mediaQueryListener) {
    mediaQueryListener = () => {
      const currentOverride = useUIPrefsStore.getState().lowPowerOverride
      if (currentOverride === 'unset') {
        useUIPrefsStore.setState({ lowPowerEnabled: getSystemLowPowerEnabled() })
      }
    }
  }

  if (override === 'unset') {
    mediaQueryList.addEventListener('change', mediaQueryListener)
  } else {
    mediaQueryList.removeEventListener('change', mediaQueryListener)
  }
}

function ensureStorageSync(): void {
  if (typeof window === 'undefined' || storageListenerAttached) {
    return
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    const override = readStoredOverride()
    applyOverride(override)
    ensureMediaQuerySubscription(override)
  })

  storageListenerAttached = true
}

export const useUIPrefsStore = create<UIPrefsState>((set) => ({
  lowPowerOverride: 'unset',
  lowPowerEnabled: getSystemLowPowerEnabled(),
  setLowPowerEnabled: (enabled) => {
    const override: LowPowerOverride = enabled ? 'on' : 'off'
    writeStoredOverride(override)
    set({
      lowPowerOverride: override,
      lowPowerEnabled: enabled,
    })
    ensureMediaQuerySubscription(override)
  },
  clearLowPowerOverride: () => {
    writeStoredOverride('unset')
    const enabled = getSystemLowPowerEnabled()
    set({
      lowPowerOverride: 'unset',
      lowPowerEnabled: enabled,
    })
    ensureMediaQuerySubscription('unset')
  },
}))

export function initializeUIPrefsStore(): void {
  if (typeof window === 'undefined' || hasInitialized) {
    return
  }

  hasInitialized = true

  const override = readStoredOverride()
  applyOverride(override)
  ensureMediaQuerySubscription(override)
  ensureStorageSync()
}
