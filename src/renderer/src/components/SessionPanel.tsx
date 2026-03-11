import { useEffect } from 'react'
import { SessionState, PetState } from '../../../shared/types'

interface SessionPanelProps {
  sessions: SessionState[]
  onClose: () => void
}

const STATE_LABELS: Record<PetState, string> = {
  idle: '💤 Idle',
  running: '⚡ Running',
  permissionRequest: '🔔 Waiting',
  taskCompleted: '✅ Done'
}

const STATE_COLORS: Record<PetState, string> = {
  idle: '#6b7280',
  running: '#22c55e',
  permissionRequest: '#f59e0b',
  taskCompleted: '#a78bfa'
}

export function SessionPanel({ sessions, onClose }: SessionPanelProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 12000)
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
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96))',
          borderRadius: 12,
          padding: 16,
          color: '#e2e8f0',
          fontSize: 12,
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
          minWidth: 220,
          maxWidth: 280,
          maxHeight: 240,
          overflowY: 'auto',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          Sessions ({sessions.length})
        </div>

        {sessions.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
            No active sessions
          </div>
        ) : (
          sessions.map((s, i) => (
            <div
              key={s.sessionId}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                marginBottom: i < sessions.length - 1 ? 6 : 0
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4
              }}>
                <span style={{
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {s.sessionId.slice(0, 8)}
                </span>
                <span style={{
                  color: STATE_COLORS[s.petState],
                  fontSize: 11,
                  fontWeight: 500
                }}>
                  {STATE_LABELS[s.petState]}
                </span>
              </div>
              <div style={{
                color: '#64748b',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <span>📁</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.cwd.split(/[\\/]/).slice(-2).join('/')}
                </span>
              </div>
              {s.lastToolName && (
                <div style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>
                  🔧 {s.lastToolName}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
