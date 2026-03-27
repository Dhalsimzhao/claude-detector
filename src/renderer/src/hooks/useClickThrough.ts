import { useEffect, useCallback, MutableRefObject } from 'react'

const isWindows = window.api.platform === 'win32'

/**
 * Toggles window click-through based on whether the cursor is over a visible
 * region (marked with `data-hit-region`). When over transparent background,
 * clicks pass through to windows behind.
 *
 * macOS: uses mousemove + elementFromPoint (relies on { forward: true }).
 * Windows: reports hit-region bounding rects to the main process, which polls
 * the cursor position itself (because { forward: true } is unreliable there).
 */
export function useClickThrough(isDragging: MutableRefObject<boolean>): void {
  // Collect all [data-hit-region] bounding rects and send to main process
  const reportHitRegions = useCallback(() => {
    const els = document.querySelectorAll('[data-hit-region]')
    const regions = Array.from(els).map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    })
    window.api.updateHitRegions(regions)
  }, [])

  // Windows: periodically report hit-region rects so the main process can poll
  useEffect(() => {
    if (!isWindows) return

    // Report immediately, then on every resize / DOM change
    reportHitRegions()
    const observer = new MutationObserver(reportHitRegions)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', reportHitRegions)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', reportHitRegions)
    }
  }, [reportHitRegions])

  // macOS: use mousemove + elementFromPoint
  useEffect(() => {
    if (isWindows) return

    let isIgnoring = true // starts in click-through mode (matches main process default)

    const onMouseMove = (e: MouseEvent): void => {
      // During drag always keep the window interactive
      if (isDragging.current) {
        if (isIgnoring) {
          isIgnoring = false
          window.api.setClickThrough(false)
        }
        return
      }

      const el = document.elementFromPoint(e.clientX, e.clientY)
      const hitRegion = el?.closest('[data-hit-region]')

      if (hitRegion && isIgnoring) {
        isIgnoring = false
        window.api.setClickThrough(false)
      } else if (!hitRegion && !isIgnoring) {
        isIgnoring = true
        window.api.setClickThrough(true)
      }
    }

    // When mouse leaves the window entirely, restore click-through
    const onMouseLeave = (): void => {
      if (!isDragging.current && !isIgnoring) {
        isIgnoring = true
        window.api.setClickThrough(true)
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [isDragging])
}
