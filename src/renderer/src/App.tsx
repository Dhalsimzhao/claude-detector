import { useState, useEffect, useRef } from 'react'
import { PetCanvas } from './components/PetCanvas'
import { PetSprite } from './components/PetSprite'
import { SessionBadge } from './components/SessionBadge'
import { SessionPanel } from './components/SessionPanel'
import { PermissionDialog } from './components/PermissionDialog'
import { Toast, ToastData } from './components/Toast'
import { useAnimationState } from './hooks/useAnimationState'
import { useClickThrough } from './hooks/useClickThrough'
import { usePetDrag } from './hooks/usePetDrag'
import { PetTheme, DialogStyle, SessionState, PermissionRequestInfo } from '../../shared/types'
import { THEME_SPRITES, SpriteTheme } from './spriteConfig'
import { getSessionColor } from './utils'
import confetti from 'canvas-confetti'

function toSpriteTheme(theme: PetTheme): SpriteTheme {
  if (theme !== 'blocks' && theme in THEME_SPRITES) return theme
  return 'psyduck'
}

function App() {
  const [theme, setTheme] = useState<PetTheme>('psyduck')
  const [detailSessions, setDetailSessions] = useState<SessionState[] | null>(null)
  const [dialogStyle, setDialogStyle] = useState<DialogStyle>('panel')
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequestInfo | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [confettiEnabled, setConfettiEnabled] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const spriteTheme = toSpriteTheme(theme)
  const { spriteState, frameIndex, sessions } = useAnimationState(spriteTheme)
  const petContainerRef = useRef<HTMLDivElement>(null)
  const isDragging = usePetDrag(petContainerRef)
  useClickThrough(isDragging)

  useEffect(() => {
    return window.api.onThemeChange(setTheme)
  }, [])

  useEffect(() => {
    return window.api.onDialogStyleChange(setDialogStyle)
  }, [])

  useEffect(() => {
    return window.api.onConfettiChange(setConfettiEnabled)
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
    return window.api.onAutoApproveToast((toolName, toolInput, sessionId, cwd) => {
      let detail = ''
      if (toolName === 'Bash' && typeof toolInput.command === 'string') {
        detail = toolInput.command as string
      } else if (typeof toolInput.file_path === 'string') {
        const fp = toolInput.file_path as string
        // Keep last 2 path segments for readability
        const parts = fp.split(/[\\/]/)
        detail = parts.length > 2 ? '.../' + parts.slice(-2).join('/') : fp
      }
      const text = detail ? `${toolName}: ${detail}` : toolName
      const project = cwd ? (cwd.split(/[\\/]/).pop() || '') : ''
      if (toastTimer.current) clearTimeout(toastTimer.current)
      setToast({ text, project, color: getSessionColor(sessionId) })
      toastTimer.current = setTimeout(() => setToast(null), 2500)
    })
  }, [])

  useEffect(() => {
    if (spriteState === 'taskCompleted') {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      setToast({ text: 'Done!', project: '', color: { bg: '#f3e8ff', border: '#8b5cb8' } })
      toastTimer.current = setTimeout(() => setToast(null), 3000)

      if (confettiEnabled) {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { x: 0.5, y: 0.6 },
          gravity: 0.8,
          ticks: 120,
          colors: ['#8b5cb8', '#f3e8ff', '#ffd700', '#ff6b6b', '#4a9eff', '#00cc66']
        })
      }
    }
  }, [spriteState])

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
        userSelect: 'none',
        // Windows needs a near-invisible background to capture mouse events
        // for drag during setIgnoreMouseEvents(false); macOS works with transparent
        background: window.api.platform === 'win32' ? 'rgba(0,0,0,0.005)' : 'transparent'
      } as React.CSSProperties}
    >
      <div ref={petContainerRef} data-hit-region style={{ position: 'relative', cursor: 'grab' }}>
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
      {toast && <Toast data={toast} />}
    </div>
  )
}

export default App
