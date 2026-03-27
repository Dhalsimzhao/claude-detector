import { useEffect, useState, useCallback } from 'react'
import { PermissionRequestInfo, DialogStyle } from '../../../shared/types'

const TIMEOUT_MS = 115000

function formatToolInput(toolName: string, toolInput: Record<string, unknown>): { dir: string; file: string } | null {
  let raw = ''
  if (toolName === 'Bash' && typeof toolInput.command === 'string') {
    return { dir: '', file: toolInput.command as string }
  }
  if (['Read', 'Edit', 'Write'].includes(toolName) && typeof toolInput.file_path === 'string') {
    raw = toolInput.file_path as string
  }
  if (!raw) {
    try {
      const json = JSON.stringify(toolInput)
      if (json === '{}') return null
      return { dir: '', file: json }
    } catch {
      return null
    }
  }
  const lastSlash = raw.lastIndexOf('/')
  if (lastSlash === -1) return { dir: '', file: raw }
  const dirPart = raw.slice(0, lastSlash + 1)
  const filePart = raw.slice(lastSlash + 1)
  const segments = dirPart.replace(/\/$/, '').split('/')
  const shortDir = segments.length > 2
    ? '.../' + segments.slice(-2).join('/') + '/'
    : dirPart
  return { dir: shortDir, file: filePart }
}

interface Props {
  info: PermissionRequestInfo
  dialogStyle: DialogStyle
  onDecide: (decision: 'approve' | 'deny') => void
}

function usePermissionState(info: PermissionRequestInfo, onDecide: (d: 'approve' | 'deny') => void) {
  const detail = formatToolInput(info.toolName, info.toolInput)
  const projectName = info.cwd ? (info.cwd.split('/').pop() || info.cwd) : ''

  const elapsed = Date.now() - info.timestamp
  const initialRemaining = Math.max(0, TIMEOUT_MS - elapsed)
  const [remaining, setRemaining] = useState(initialRemaining)

  useEffect(() => {
    const timer = setInterval(() => {
      const r = Math.max(0, TIMEOUT_MS - (Date.now() - info.timestamp))
      setRemaining(r)
      if (r <= 0) clearInterval(timer)
    }, 200)
    return () => clearInterval(timer)
  }, [info.timestamp])

  const progress = remaining / TIMEOUT_MS

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') onDecide('approve')
    else if (e.key === 'Escape') onDecide('deny')
  }, [onDecide])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return { detail, projectName, progress }
}

/* ── Panel Style (original) ── */
function PanelDialog({ info, onDecide }: Omit<Props, 'dialogStyle'>) {
  const { detail, projectName, progress } = usePermissionState(info, onDecide)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px',
        background: '#16161e',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        color: '#fff',
        fontFamily: '-apple-system, "SF Pro Text", "Segoe UI", sans-serif',
        overflow: 'hidden',
        cursor: 'grab'
      } as React.CSSProperties}
    >
      {/* Progress bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'rgba(255,255,255,0.06)', borderRadius: '12px 12px 0 0', overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${progress * 100}%`,
          background: progress > 0.3 ? '#4ade80' : progress > 0.1 ? '#fbbf24' : '#ef4444',
          transition: 'width 0.2s linear, background 0.5s', borderRadius: 'inherit'
        }} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        {projectName && (
          <span style={{
            fontSize: '12px', fontWeight: 700, color: '#fbbf24',
            background: 'rgba(251, 191, 36, 0.12)', padding: '3px 8px', borderRadius: '5px',
            maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>{projectName}</span>
        )}
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>
          wants permission
        </span>
      </div>

      {/* Tool name */}
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
        {info.toolName}
      </div>

      {/* Detail */}
      {detail && (
        <div style={{
          fontSize: '11px', lineHeight: '1.5', background: 'rgba(255,255,255,0.05)',
          borderRadius: '6px', padding: '7px 10px', wordBreak: 'break-all',
          maxHeight: '80px', overflow: 'auto',
          fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
          letterSpacing: '-0.01em', flex: '0 1 auto',
          WebkitAppRegion: 'no-drag', cursor: 'default'
        } as React.CSSProperties}>
          {detail.dir && <span style={{ color: 'rgba(255,255,255,0.35)' }}>{detail.dir}</span>}
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{detail.file}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onDecide('approve')}
          style={{
            flex: 1, padding: '8px 0', borderRadius: '8px', border: 'none',
            background: '#4ade80', color: '#0a0a0a', fontWeight: 600, fontSize: '12px',
            cursor: 'pointer', WebkitAppRegion: 'no-drag', transition: 'opacity 0.15s'
          } as React.CSSProperties}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Allow <span style={{ opacity: 0.5, fontSize: '10px', fontWeight: 400 }}>Enter</span>
        </button>
        <button
          onClick={() => onDecide('deny')}
          style={{
            flex: 1, padding: '8px 0', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.75)', fontWeight: 600, fontSize: '12px',
            cursor: 'pointer', WebkitAppRegion: 'no-drag', transition: 'opacity 0.15s'
          } as React.CSSProperties}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Deny <span style={{ opacity: 0.5, fontSize: '10px', fontWeight: 400 }}>Esc</span>
        </button>
      </div>
    </div>
  )
}

/* ── Bubble Style (comic speech bubble) ── */
function BubbleDialog({ info, onDecide }: Omit<Props, 'dialogStyle'>) {
  const { detail, projectName, progress } = usePermissionState(info, onDecide)

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      WebkitAppRegion: 'drag',
      cursor: 'grab',
      userSelect: 'none',
      paddingTop: '6px'
    } as React.CSSProperties}>
      {/* Bubble body */}
      <div style={{
        position: 'relative',
        width: '88%',
        maxWidth: '280px',
        maxHeight: '230px',
        background: '#fff',
        borderRadius: '20px',
        border: '2.5px solid #222',
        padding: '12px 14px 10px',
        color: '#222',
        fontFamily: '-apple-system, "SF Pro Text", "Segoe UI", sans-serif',
        boxShadow: '2px 3px 0px #222',
        overflow: 'hidden',
        WebkitAppRegion: 'drag',
        display: 'flex',
        flexDirection: 'column'
      } as React.CSSProperties}>
        {/* Progress bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: '#eee', overflow: 'hidden',
          borderRadius: '20px 20px 0 0'
        }}>
          <div style={{
            height: '100%', width: `${progress * 100}%`,
            background: progress > 0.3 ? '#22c55e' : progress > 0.1 ? '#f59e0b' : '#ef4444',
            transition: 'width 0.2s linear, background 0.5s'
          }} />
        </div>

        {/* Top row: project + tool */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          {projectName && (
            <span style={{
              fontSize: '11px', fontWeight: 800, color: '#b45309',
              background: '#fef3c7', padding: '2px 7px', borderRadius: '4px',
              border: '1px solid #f59e0b',
              maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{projectName}</span>
          )}
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>
            {info.toolName}
          </span>
        </div>

        {/* Detail */}
        {detail && (
          <div
            className="bubble-scroll"
            style={{
              fontSize: '10px', lineHeight: '1.4',
              background: '#f5f5f5', borderRadius: '6px', border: '1px solid #e5e5e5',
              padding: '5px 8px', wordBreak: 'break-all', maxHeight: '55px', overflow: 'auto',
              fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
              marginBottom: '10px', flex: '0 1 auto',
              WebkitAppRegion: 'no-drag', cursor: 'default'
            } as React.CSSProperties}
          >
            {detail.dir && <span style={{ color: '#999' }}>{detail.dir}</span>}
            <span style={{ color: '#333', fontWeight: 600 }}>{detail.file}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onDecide('approve')}
            style={{
              flex: 1, padding: '6px 0', borderRadius: '10px',
              border: '2px solid #16a34a', background: '#22c55e', color: '#fff',
              fontWeight: 700, fontSize: '12px',
              cursor: 'pointer', WebkitAppRegion: 'no-drag', transition: 'transform 0.1s'
            } as React.CSSProperties}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Allow <span style={{ opacity: 0.6, fontSize: '9px', fontWeight: 400 }}>Enter</span>
          </button>
          <button
            onClick={() => onDecide('deny')}
            style={{
              flex: 1, padding: '6px 0', borderRadius: '10px',
              border: '2px solid #d4d4d4', background: '#f5f5f5', color: '#555',
              fontWeight: 700, fontSize: '12px',
              cursor: 'pointer', WebkitAppRegion: 'no-drag', transition: 'transform 0.1s'
            } as React.CSSProperties}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.96)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Deny <span style={{ opacity: 0.5, fontSize: '9px', fontWeight: 400 }}>Esc</span>
          </button>
        </div>
      </div>

      {/* Comic bubble tail — follows right after bubble */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        marginTop: '3px'
      }}>
        <div style={{
          width: '14px', height: '10px',
          background: '#fff', border: '2.5px solid #222',
          borderRadius: '50%', boxShadow: '1px 1px 0px #222'
        }} />
        <div style={{
          width: '8px', height: '6px',
          background: '#fff', border: '2px solid #222',
          borderRadius: '50%', boxShadow: '1px 1px 0px #222'
        }} />
      </div>
    </div>
  )
}

/* ── Exported wrapper ── */
export function PermissionDialog({ info, dialogStyle, onDecide }: Props) {
  if (dialogStyle === 'bubble') {
    return <BubbleDialog info={info} onDecide={onDecide} />
  }
  return <PanelDialog info={info} onDecide={onDecide} />
}
