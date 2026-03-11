import { useState, useEffect, useRef, useCallback } from 'react'
import { PetCanvas } from './components/PetCanvas'
import { PetSprite } from './components/PetSprite'
import { SessionBadge } from './components/SessionBadge'
import { SessionPanel } from './components/SessionPanel'
import { useAnimationState } from './hooks/useAnimationState'
import { PetTheme, SessionState } from '../../shared/types'

function App() {
  const { state, frameIndex, sessions } = useAnimationState()
  const [theme, setTheme] = useState<PetTheme>('pokemon')
  const [detailSessions, setDetailSessions] = useState<SessionState[] | null>(null)
  const dragRef = useRef<{ startX: number; startY: number } | null>(null)

  useEffect(() => {
    return window.api.onThemeChange(setTheme)
  }, [])

  useEffect(() => {
    return window.api.onShowSessions((sessions) => {
      setDetailSessions(sessions)
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      dragRef.current = { startX: e.screenX, startY: e.screenY }
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current && e.buttons === 1) {
      const dx = e.screenX - dragRef.current.startX
      const dy = e.screenY - dragRef.current.startY
      dragRef.current = { startX: e.screenX, startY: e.screenY }
      window.api.moveWindow(dx, dy)
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
  }, [])

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'grab',
        userSelect: 'none'
      } as React.CSSProperties}
    >
      {theme === 'blocks'
        ? <PetCanvas state={state} frameIndex={frameIndex} />
        : <PetSprite state={state} />
      }
      <SessionBadge sessions={sessions} />
      {detailSessions && (
        <SessionPanel
          sessions={detailSessions}
          onClose={() => setDetailSessions(null)}
        />
      )}
    </div>
  )
}

export default App
