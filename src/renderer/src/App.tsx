import { useState, useEffect } from 'react'
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

  useEffect(() => {
    return window.api.onThemeChange(setTheme)
  }, [])

  useEffect(() => {
    return window.api.onShowSessions((sessions) => {
      setDetailSessions(sessions)
    })
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        WebkitAppRegion: 'drag',
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
