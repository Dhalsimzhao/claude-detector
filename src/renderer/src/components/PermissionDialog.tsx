import { PermissionRequestInfo } from '../../../shared/types'

function formatToolInput(toolName: string, toolInput: Record<string, unknown>): string {
  if (toolName === 'Bash' && typeof toolInput.command === 'string') {
    const cmd = toolInput.command as string
    return cmd.length > 80 ? cmd.slice(0, 77) + '...' : cmd
  }
  if ((toolName === 'Edit' || toolName === 'Write') && typeof toolInput.file_path === 'string') {
    return toolInput.file_path as string
  }
  try {
    const json = JSON.stringify(toolInput)
    return json.length > 80 ? json.slice(0, 77) + '...' : json
  } catch {
    return ''
  }
}

interface Props {
  info: PermissionRequestInfo
  onDecide: (decision: 'approve' | 'deny') => void
}

export function PermissionDialog({ info, onDecide }: Props) {
  const summary = formatToolInput(info.toolName, info.toolInput)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(15, 15, 20, 0.92)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.12)',
        WebkitAppRegion: 'no-drag',
        userSelect: 'none',
        color: '#fff',
        gap: '10px'
      } as React.CSSProperties}
    >
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Permission Request
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
        {info.toolName}
      </div>
      {summary && (
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.65)',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '6px',
            padding: '6px 10px',
            width: '100%',
            wordBreak: 'break-all',
            maxHeight: '56px',
            overflow: 'hidden',
            textAlign: 'center'
          }}
        >
          {summary}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          onClick={() => onDecide('approve')}
          style={{
            padding: '7px 22px',
            borderRadius: '8px',
            border: 'none',
            background: '#4ade80',
            color: '#0a0a0a',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties}
        >
          Allow
        </button>
        <button
          onClick={() => onDecide('deny')}
          style={{
            padding: '7px 22px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            WebkitAppRegion: 'no-drag'
          } as React.CSSProperties}
        >
          Deny
        </button>
      </div>
    </div>
  )
}
