import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current && e.buttons === 1) {
        const dx = e.screenX - dragRef.current.startX
        const dy = e.screenY - dragRef.current.startY
        dragRef.current = { startX: e.screenX, startY: e.screenY }
        window.api.moveWindow(dx, dy)
      }
    }
    const handleMouseUp = () => {
      dragRef.current = null
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div
      onMouseDown={(e) => {
        if (e.button === 0) dragRef.current = { startX: e.screenX, startY: e.screenY }
      }}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'grab',
        userSelect: 'none',
        // Nearly invisible background so Windows registers mouse events
        // on transparent window pixels instead of passing them through
        background: 'rgba(0,0,0,0.01)'
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
