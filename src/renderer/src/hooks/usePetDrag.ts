import { useEffect, useRef, RefObject, MutableRefObject } from 'react'

/**
 * Custom window drag via IPC, replacing native WebkitAppRegion drag.
 * Uses screenX/screenY to avoid jitter as the window moves.
 * Returns a ref indicating whether a drag is in progress.
 */
export function usePetDrag(containerRef: RefObject<HTMLElement | null>): MutableRefObject<boolean> {
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent): void => {
      if (e.button !== 0) return // left click only
      isDragging.current = true
      lastPos.current = { x: e.screenX, y: e.screenY }
      // Ensure we keep getting mouse events during drag
      window.api.setClickThrough(false)
    }

    const onMouseMove = (e: MouseEvent): void => {
      if (!isDragging.current) return
      const dx = e.screenX - lastPos.current.x
      const dy = e.screenY - lastPos.current.y
      if (dx === 0 && dy === 0) return
      lastPos.current = { x: e.screenX, y: e.screenY }
      window.api.dragMove(dx, dy)
    }

    const onMouseUp = (): void => {
      if (!isDragging.current) return
      isDragging.current = false
    }

    el.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [containerRef])

  return isDragging
}
