import { useEffect, useState } from 'react'
import { SessionState, PetState } from '../../../shared/types'

interface SessionPanelProps {
  sessions: SessionState[]
  onClose: () => void
}

const STATE_CONFIG: Record<PetState, { label: string; color: string; bg: string }> = {
  idle: { label: 'IDLE', color: '#a8b8c8', bg: 'rgba(168,184,200,0.15)' },
  running: { label: 'RUN', color: '#58d858', bg: 'rgba(88,216,88,0.15)' },
  permissionRequest: { label: 'WAIT', color: '#f8b838', bg: 'rgba(248,184,56,0.15)' },
  taskCompleted: { label: 'DONE', color: '#b898f8', bg: 'rgba(184,152,248,0.15)' }
}

function timeSince(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  return `${Math.floor(min / 60)}h`
}

export function SessionPanel({ sessions, onClose }: SessionPanelProps) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setTimeout(onClose, 12000)
    return () => clearTimeout(timer)
  }, [onClose])

  // Tick every second to update "time since"
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

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
      {/* Pixel-art RPG menu card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#1a1b2e',
          padding: '2px',
          imageRendering: 'pixelated'
        }}
      >
        {/* Outer pixel border */}
        <div style={{
          border: '2px solid #e8e8e8',
          outline: '2px solid #484868',
          background: '#1a1b2e',
          padding: 0,
          minWidth: 190,
          maxWidth: 240
        }}>
          {/* Title bar */}
          <div style={{
            background: '#2a2b4e',
            borderBottom: '2px solid #484868',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 'bold',
              color: '#e8e8e8',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              ▸ Sessions
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#787898'
            }}>
              {sessions.length}/{sessions.length}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: '6px' }}>
            {sessions.length === 0 ? (
              <div style={{
                fontFamily: 'monospace',
                fontSize: 10,
                color: '#585878',
                textAlign: 'center',
                padding: '10px 0'
              }}>
                No active sessions...
              </div>
            ) : (
              sessions.map((s, i) => {
                const cfg = STATE_CONFIG[s.petState]
                return (
                  <div
                    key={s.sessionId}
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.color}33`,
                      padding: '5px 7px',
                      marginBottom: i < sessions.length - 1 ? 4 : 0
                    }}
                  >
                    {/* Row 1: ID + State badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 3
                    }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: '#c8c8e8',
                        fontWeight: 'bold'
                      }}>
                        {s.sessionId.slice(0, 8)}
                      </span>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: 9,
                        fontWeight: 'bold',
                        color: cfg.color,
                        background: `${cfg.color}20`,
                        padding: '1px 4px',
                        border: `1px solid ${cfg.color}44`,
                        letterSpacing: '0.05em'
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    {/* Row 2: cwd */}
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: 9,
                      color: '#686888',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 2
                    }}>
                      ~/{s.cwd.split(/[\\/]/).slice(-2).join('/')}
                    </div>
                    {/* Row 3: tool + time */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'monospace',
                      fontSize: 9,
                      color: '#585878'
                    }}>
                      <span>{s.lastToolName || '—'}</span>
                      <span>{timeSince(s.updatedAt)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer hint */}
          <div style={{
            borderTop: '1px solid #2a2b4e',
            padding: '4px 8px',
            textAlign: 'center'
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontSize: 8,
              color: '#484868',
              letterSpacing: '0.05em'
            }}>
              CLICK TO CLOSE
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
