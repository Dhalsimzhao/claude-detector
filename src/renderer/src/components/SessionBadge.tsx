import { SessionState } from '../../../shared/types'

interface SessionBadgeProps {
  sessions: SessionState[]
}

export function SessionBadge({ sessions }: SessionBadgeProps) {
  if (sessions.length <= 1) return null

  return (
    <div style={{
      position: 'absolute',
      top: 4,
      right: 4,
      background: '#ff6b6b',
      color: '#fff',
      borderRadius: '50%',
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 'bold',
      fontFamily: 'monospace'
    }}>
      {sessions.length}
    </div>
  )
}
