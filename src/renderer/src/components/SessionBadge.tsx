import { SessionState } from '../../../shared/types'

interface SessionBadgeProps {
  sessions: SessionState[]
}

export function SessionBadge({ sessions }: SessionBadgeProps) {
  if (sessions.length <= 1) return null

  return (
    <div style={{
      position: 'absolute',
      top: -4,
      right: -6,
      background: '#fff',
      color: '#222',
      border: '2px solid #222',
      borderRadius: '10px',
      minWidth: 18,
      height: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 800,
      fontFamily: '-apple-system, "SF Pro Text", monospace',
      boxShadow: '1px 1px 0px #222',
      padding: '0 4px',
      zIndex: 10,
      pointerEvents: 'none'
    }}>
      {sessions.length}
    </div>
  )
}
