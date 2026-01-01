import { useEffect, useRef, useState, useCallback, RefObject } from 'react'

/**
 * A single shared IntersectionObserver that tracks which items are visible/near-visible.
 * Much more efficient than creating an observer per item.
 * 
 * Includes automatic cleanup of disconnected elements to prevent memory leaks.
 */
export function useVisibleItems(containerRef: RefObject<HTMLElement | null>) {
  const [visibleIds, setVisibleIds] = useState<Set<string | number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementMapRef = useRef<Map<Element, string | number>>(new Map())
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Prune disconnected elements from the map to prevent memory leaks
  const pruneDisconnectedElements = useCallback(() => {
    const map = elementMapRef.current
    const observer = observerRef.current
    if (!observer || map.size === 0) return

    const toRemove: Element[] = []
    
    for (const element of map.keys()) {
      // Check if element is disconnected from DOM
      if (!element.isConnected) {
        toRemove.push(element)
      }
    }

    if (toRemove.length > 0) {
      for (const element of toRemove) {
        observer.unobserve(element)
        map.delete(element)
      }
    }
  }, [])

  useEffect(() => {
    // Create a single observer with generous margins for preloading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev)
          let changed = false

          for (const entry of entries) {
            const id = elementMapRef.current.get(entry.target)
            if (id === undefined) continue

            if (entry.isIntersecting) {
              if (!next.has(id)) {
                next.add(id)
                changed = true
              }
            }
            // Note: We don't remove items from visibleIds once they've been seen
            // This prevents images from unloading when scrolled away
          }

          return changed ? next : prev
        })
      },
      {
        root: containerRef.current,
        // Large margin to preload images well before they're visible
        rootMargin: '500px 0px',
        threshold: 0,
      }
    )

    // Set up periodic cleanup of disconnected elements (every 5 seconds)
    cleanupTimerRef.current = setInterval(pruneDisconnectedElements, 5000)

    return () => {
      observerRef.current?.disconnect()
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current)
      }
      // Clear the map on unmount
      elementMapRef.current.clear()
    }
  }, [containerRef, pruneDisconnectedElements])

  const observe = useCallback((element: Element | null, id: string | number) => {
    if (!element || !observerRef.current) return

    // If element already registered with same ID, skip
    const existingId = elementMapRef.current.get(element)
    if (existingId === id) return

    elementMapRef.current.set(element, id)
    observerRef.current.observe(element)

    // Return cleanup function (though it's often not used with ref callbacks)
    return () => {
      if (element && observerRef.current) {
        observerRef.current.unobserve(element)
        elementMapRef.current.delete(element)
      }
    }
  }, [])

  const isVisible = useCallback(
    (id: string | number) => visibleIds.has(id),
    [visibleIds]
  )

  // Expose a method to clear visibility state when filtering
  const clearVisibleIds = useCallback(() => {
    setVisibleIds(new Set())
  }, [])

  return { observe, isVisible, visibleIds, clearVisibleIds }
}
