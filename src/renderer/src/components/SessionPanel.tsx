import { useEffect } from 'react'
import { SessionState } from '../../../shared/types'

interface SessionPanelProps {
  sessions: SessionState[]
  onClose: () => void
}

export function SessionPanel({ sessions, onClose }: SessionPanelProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitAppRegion: 'no-drag',
        cursor: 'default'
      } as React.CSSProperties}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(30, 30, 40, 0.95)',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#e0e0e0',
          fontSize: 11,
          fontFamily: 'monospace',
          maxWidth: 200,
          maxHeight: 180,
          overflowY: 'auto',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)'
        }}
      >
        {sessions.length === 0 ? (
          <div style={{ color: '#888' }}>No active sessions</div>
        ) : (
          sessions.map((s) => (
            <div key={s.sessionId} style={{ marginBottom: 6 }}>
              <div style={{ color: '#8bb8ff', fontWeight: 'bold' }}>
                {s.sessionId.slice(0, 8)}
              </div>
              <div style={{ color: '#aaa', fontSize: 10 }}>
                {s.cwd.split(/[\\/]/).slice(-2).join('/')}
              </div>
              <div style={{ fontSize: 10 }}>
                <span style={{ color: stateColor(s.petState) }}>{s.petState}</span>
                {s.lastToolName && (
                  <span style={{ color: '#888' }}> | {s.lastToolName}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function stateColor(state: string): string {
  switch (state) {
    case 'running': return '#4ae04a'
    case 'permissionRequest': return '#ffaa00'
    case 'taskCompleted': return '#bb77ff'
    default: return '#888'
  }
}
