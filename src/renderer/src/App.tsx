import { useState, useEffect } from 'react'
import { PetCanvas } from './components/PetCanvas'
import { PetSprite } from './components/PetSprite'
import { SessionBadge } from './components/SessionBadge'
import { SessionPanel } from './components/SessionPanel'
import { useAnimationState } from './hooks/useAnimationState'
import { PetTheme, SessionState } from '../../shared/types'
import { THEME_SPRITES, SpriteTheme } from './spriteConfig'

function toSpriteTheme(theme: PetTheme): SpriteTheme {
  if (theme !== 'blocks' && theme in THEME_SPRITES) return theme
  return 'psyduck'
}

function App() {
  const [theme, setTheme] = useState<PetTheme>('psyduck')
  const [detailSessions, setDetailSessions] = useState<SessionState[] | null>(null)

  const spriteTheme = toSpriteTheme(theme)
  const { spriteState, frameIndex, sessions } = useAnimationState(spriteTheme)

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
        userSelect: 'none',
        // Near-invisible background so Windows captures mouse events
        // on transparent pixels instead of passing them through
        background: 'rgba(0,0,0,0.005)'
      } as React.CSSProperties}
    >
      {theme === 'blocks'
        ? <PetCanvas state={spriteState} frameIndex={frameIndex} />
        : <PetSprite theme={spriteTheme} state={spriteState} frameIndex={frameIndex} />
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
