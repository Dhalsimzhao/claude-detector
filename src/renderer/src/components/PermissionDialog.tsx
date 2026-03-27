import { useEffect, useState, useCallback } from 'react'
import { PermissionRequestInfo } from '../../../shared/types'

const TIMEOUT_MS = 115000

function formatToolInput(toolName: string, toolInput: Record<string, unknown>): { dir: string; file: string } | null {
  let raw = ''
  if (toolName === 'Bash' && typeof toolInput.command === 'string') {
    const cmd = toolInput.command as string
    return { dir: '', file: cmd.length > 120 ? cmd.slice(0, 117) + '...' : cmd }
  }
  if (['Read', 'Edit', 'Write'].includes(toolName) && typeof toolInput.file_path === 'string') {
    raw = toolInput.file_path as string
  }
  if (!raw) {
    try {
      const json = JSON.stringify(toolInput)
      if (json === '{}') return null
      return { dir: '', file: json.length > 120 ? json.slice(0, 117) + '...' : json }
    } catch {
      return null
    }
  }
  const lastSlash = raw.lastIndexOf('/')
  if (lastSlash === -1) return { dir: '', file: raw }
  const dirPart = raw.slice(0, lastSlash + 1)
  const filePart = raw.slice(lastSlash + 1)
  // Shorten dir: keep last 2 segments
  const segments = dirPart.replace(/\/$/, '').split('/')
  const shortDir = segments.length > 2
    ? '.../' + segments.slice(-2).join('/') + '/'
    : dirPart
  return { dir: shortDir, file: filePart }
}

interface Props {
  info: PermissionRequestInfo
  onDecide: (decision: 'approve' | 'deny') => void
}

export function PermissionDialog({ info, onDecide }: Props) {
  const detail = formatToolInput(info.toolName, info.toolInput)
  const projectName = info.cwd ? (info.cwd.split('/').pop() || info.cwd) : ''

  // Countdown timer
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

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') onDecide('approve')
    else if (e.key === 'Escape') onDecide('deny')
  }, [onDecide])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

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
      {/* Timeout progress bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: progress > 0.3 ? '#4ade80' : progress > 0.1 ? '#fbbf24' : '#ef4444',
          transition: 'width 0.2s linear, background 0.5s',
          borderRadius: 'inherit'
        }} />
      </div>

      {/* Header: project name + permission label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        {projectName && (
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#fbbf24',
            background: 'rgba(251, 191, 36, 0.12)',
            padding: '3px 8px',
            borderRadius: '5px',
            maxWidth: '160px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {projectName}
          </span>
        )}
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>
          wants permission
        </span>
      </div>

      {/* Tool name */}
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#fff',
        marginBottom: '6px'
      }}>
        {info.toolName}
      </div>

      {/* Detail with highlighted filename */}
      {detail && (
        <div
          style={{
            fontSize: '11px',
            lineHeight: '1.5',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '6px',
            padding: '7px 10px',
            wordBreak: 'break-all',
            maxHeight: '52px',
            overflow: 'hidden',
            fontFamily: '"SF Mono", "Fira Code", "Cascadia Code", monospace',
            letterSpacing: '-0.01em',
            flex: '0 1 auto'
          }}
        >
          {detail.dir && (
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>{detail.dir}</span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{detail.file}</span>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onDecide('approve')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            border: 'none',
            background: '#4ade80',
            color: '#0a0a0a',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            WebkitAppRegion: 'no-drag',
            transition: 'opacity 0.15s'
          } as React.CSSProperties}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Allow <span style={{ opacity: 0.5, fontSize: '10px', fontWeight: 400 }}>Enter</span>
        </button>
        <button
          onClick={() => onDecide('deny')}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.75)',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
            WebkitAppRegion: 'no-drag',
            transition: 'opacity 0.15s'
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
