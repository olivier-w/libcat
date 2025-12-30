import { useEffect, useRef, useState, useCallback, RefObject } from 'react'

/**
 * A single shared IntersectionObserver that tracks which items are visible/near-visible.
 * Much more efficient than creating an observer per item.
 */
export function useVisibleItems(containerRef: RefObject<HTMLElement | null>) {
  const [visibleIds, setVisibleIds] = useState<Set<string | number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementMapRef = useRef<Map<Element, string | number>>(new Map())

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

    return () => {
      observerRef.current?.disconnect()
    }
  }, [containerRef])

  const observe = useCallback((element: Element | null, id: string | number) => {
    if (!element || !observerRef.current) return

    elementMapRef.current.set(element, id)
    observerRef.current.observe(element)

    return () => {
      if (element) {
        observerRef.current?.unobserve(element)
        elementMapRef.current.delete(element)
      }
    }
  }, [])

  const isVisible = useCallback(
    (id: string | number) => visibleIds.has(id),
    [visibleIds]
  )

  return { observe, isVisible, visibleIds }
}

