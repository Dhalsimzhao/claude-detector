import { useState, useEffect } from 'react'
import { PetCanvas } from './components/PetCanvas'
import { PetSprite } from './components/PetSprite'
import { SessionBadge } from './components/SessionBadge'
import { SessionPanel } from './components/SessionPanel'
import { PermissionDialog } from './components/PermissionDialog'
import { useAnimationState } from './hooks/useAnimationState'
import { PetTheme, DialogStyle, SessionState, PermissionRequestInfo } from '../../shared/types'
import { THEME_SPRITES, SpriteTheme } from './spriteConfig'
import { sessionToHue } from './utils'

function toSpriteTheme(theme: PetTheme): SpriteTheme {
  if (theme !== 'blocks' && theme in THEME_SPRITES) return theme
  return 'psyduck'
}

function App() {
  const [theme, setTheme] = useState<PetTheme>('psyduck')
  const [detailSessions, setDetailSessions] = useState<SessionState[] | null>(null)
  const [dialogStyle, setDialogStyle] = useState<DialogStyle>('panel')
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequestInfo | null>(null)
  const [toast, setToast] = useState<{ text: string; hue: number } | null>(null)

  const spriteTheme = toSpriteTheme(theme)
  const { spriteState, frameIndex, sessions } = useAnimationState(spriteTheme)

  useEffect(() => {
    return window.api.onThemeChange(setTheme)
  }, [])

  useEffect(() => {
    return window.api.onDialogStyleChange(setDialogStyle)
  }, [])

  useEffect(() => {
    return window.api.onShowSessions((sessions) => {
      setDetailSessions(sessions)
    })
  }, [])

  useEffect(() => {
    return window.api.onPermissionRequest((info) => {
      setPermissionRequest(info)
    })
  }, [])

  useEffect(() => {
    return window.api.onAutoApproveToast((toolName, toolInput, sessionId) => {
      let detail = ''
      if (toolName === 'Bash' && typeof toolInput.command === 'string') {
        detail = toolInput.command as string
      } else if (typeof toolInput.file_path === 'string') {
        const fp = toolInput.file_path as string
        // Keep last 2 path segments for readability
        const parts = fp.split('/')
        detail = parts.length > 2 ? '.../' + parts.slice(-2).join('/') : fp
      }
      const text = detail ? `${toolName}: ${detail}` : toolName
      setToast({ text, hue: sessionToHue(sessionId) })
      setTimeout(() => setToast(null), 2500)
    })
  }, [])

  function handlePermissionDecide(decision: 'approve' | 'deny') {
    if (!permissionRequest) return
    window.api.respondPermission(permissionRequest.requestId, decision)
    setPermissionRequest(null)
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
        WebkitAppRegion: 'drag',
        cursor: 'grab',
        userSelect: 'none',
        // Near-invisible background so Windows captures mouse events
        // on transparent pixels instead of passing them through
        background: window.api.platform === 'win32' ? 'rgba(0,0,0,0.005)' : 'transparent'
      } as React.CSSProperties}
    >
      <div style={{ position: 'relative' }}>
        {theme === 'blocks'
          ? <PetCanvas state={spriteState} frameIndex={frameIndex} />
          : <PetSprite theme={spriteTheme} state={spriteState} frameIndex={frameIndex} />
        }
        <SessionBadge sessions={sessions} />
      </div>
      {detailSessions && (
        <SessionPanel
          sessions={detailSessions}
          onClose={() => setDetailSessions(null)}
        />
      )}
      {permissionRequest && (
        <PermissionDialog
          info={permissionRequest}
          dialogStyle={dialogStyle}
          onDecide={handlePermissionDecide}
        />
      )}
      {toast && (() => {
        const bg = `hsl(${toast.hue}, 85%, 85%)`
        const border = `hsl(${toast.hue}, 50%, 30%)`
        return (
          <div style={{
            position: 'absolute',
            bottom: '110px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              background: bg,
              border: `2px solid ${border}`,
              borderRadius: '14px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#222',
              fontFamily: '"SF Mono", "Fira Code", monospace',
              boxShadow: `1px 2px 0px ${border}`,
              width: '88%',
              maxWidth: '290px',
              wordBreak: 'break-all',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              {toast.text}
            </div>
            <div style={{
              width: '8px', height: '6px', marginTop: '2px',
              background: bg, border: `2px solid ${border}`,
              borderRadius: '50%', boxShadow: `1px 1px 0px ${border}`
            }} />
          </div>
        )
      })()}
    </div>
  )
}

export default App
