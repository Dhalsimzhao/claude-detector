import { useEffect, useState } from 'react'
import { SessionState, PetState } from '../../../shared/types'

interface SessionPanelProps {
  sessions: SessionState[]
  onClose: () => void
}

const STATE_DOT: Record<PetState, string> = {
  idle: '#999',
  running: '#4caf50',
  permissionRequest: '#ff9800',
  taskCompleted: '#9c7cfa'
}

const STATE_LABEL: Record<PetState, string> = {
  idle: 'Idle',
  running: 'Running',
  permissionRequest: 'Waiting',
  taskCompleted: 'Completed'
}

function timeSince(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

export function SessionPanel({ sessions, onClose }: SessionPanelProps) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setTimeout(onClose, 10000)
    return () => clearTimeout(timer)
  }, [onClose])

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: 6,
      left: 6,
      right: 6,
      bottom: 6,
      background: '#2d2d2d',
      borderRadius: 6,
      border: '1px solid #4a4a4a',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      WebkitAppRegion: 'no-drag'
    } as React.CSSProperties}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #3a3a3a',
        fontSize: 12,
        fontFamily: '-apple-system, "Segoe UI", sans-serif',
        color: '#ccc',
        fontWeight: 600,
        flexShrink: 0
      }}>
        Sessions ({sessions.length})
      </div>

      {/* Session list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 0'
      }}>
        {sessions.length === 0 ? (
          <div style={{
            padding: '16px 12px',
            fontSize: 12,
            fontFamily: '-apple-system, "Segoe UI", sans-serif',
            color: '#666',
            textAlign: 'center'
          }}>
            No active sessions
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.sessionId}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontFamily: '-apple-system, "Segoe UI", sans-serif'
              }}
            >
              {/* Session ID + State */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 2
              }}>
                <span style={{
                  color: '#ddd',
                  fontFamily: 'monospace',
                  fontSize: 12
                }}>
                  {s.sessionId.slice(0, 8)}
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: STATE_DOT[s.petState]
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: STATE_DOT[s.petState],
                    display: 'inline-block',
                    flexShrink: 0
                  }} />
                  {STATE_LABEL[s.petState]}
                </span>
              </div>
              {/* Path */}
              <div style={{
                color: '#777',
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {s.cwd.split(/[\\/]/).slice(-2).join('/')}
              </div>
              {/* Tool + time */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#555',
                fontSize: 10,
                marginTop: 2
              }}>
                <span>{s.lastToolName || ''}</span>
                <span>{timeSince(s.updatedAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
