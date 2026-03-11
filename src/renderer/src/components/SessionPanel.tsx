import { useEffect, useState, useRef } from 'react'
import { SessionState, PetState } from '../../../shared/types'

interface SessionPanelProps {
  sessions: SessionState[]
  onClose: () => void
}

const STATE_DOT: Record<PetState, string> = {
  idle: '#999',
  running: '#34a853',
  permissionRequest: '#ea8600',
  taskCompleted: '#7c4dff'
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
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), 10000)
    return () => clearTimeout(timer)
  }, [])

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
      background: '#f5f5f5',
      borderRadius: 6,
      border: '1px solid #ccc',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      WebkitAppRegion: 'no-drag'
    } as React.CSSProperties}>
      {/* Header */}
      <div style={{
        padding: '7px 10px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        flexShrink: 0
      }}>
        <span style={{
          fontSize: 12,
          fontFamily: '-apple-system, "Segoe UI", sans-serif',
          color: '#333',
          fontWeight: 600
        }}>
          Sessions ({sessions.length})
        </span>
        <span
          onClick={onClose}
          style={{
            fontSize: 14,
            color: '#999',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '0 2px',
            fontFamily: '-apple-system, "Segoe UI", sans-serif'
          }}
        >
          ✕
        </span>
      </div>

      {/* Session list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 0'
      }}>
        {sessions.length === 0 ? (
          <div style={{
            padding: '16px 10px',
            fontSize: 12,
            fontFamily: '-apple-system, "Segoe UI", sans-serif',
            color: '#999',
            textAlign: 'center'
          }}>
            No active sessions
          </div>
        ) : (
          sessions.map((s, i) => (
            <div key={s.sessionId}>
              <div style={{ padding: '6px 10px' }}>
                {/* Session ID + State */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 2
                }}>
                  <span style={{
                    color: '#222',
                    fontFamily: 'monospace',
                    fontSize: 12
                  }}>
                    {s.sessionId.slice(0, 8)}
                  </span>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontFamily: '-apple-system, "Segoe UI", sans-serif',
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
                  color: '#666',
                  fontSize: 11,
                  fontFamily: '-apple-system, "Segoe UI", sans-serif',
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
                  color: '#999',
                  fontSize: 10,
                  fontFamily: '-apple-system, "Segoe UI", sans-serif',
                  marginTop: 2
                }}>
                  <span>{s.lastToolName || ''}</span>
                  <span>{timeSince(s.updatedAt)}</span>
                </div>
              </div>
              {i < sessions.length - 1 && (
                <div style={{ height: 1, background: '#eee', margin: '0 10px' }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
