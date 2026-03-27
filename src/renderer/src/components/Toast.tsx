import { SessionColor } from '../utils'

export interface ToastData {
  text: string
  project: string
  color: SessionColor
}

export function Toast({ data }: { data: ToastData }) {
  const { bg, border } = data.color

  return (
    <div style={{
      position: 'absolute',
      bottom: '110px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none'
    }}>
      <div style={{
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: '14px',
        padding: '6px 12px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#222',
        fontFamily: '"SF Mono", "Fira Code", monospace',
        boxShadow: `1px 2px 0px ${border}`,
        width: '88%',
        maxWidth: '290px',
        maxHeight: '120px',
        overflow: 'hidden',
        wordBreak: 'break-all',
        textAlign: 'center',
        lineHeight: '1.4'
      }}>
        {data.project && (
          <div style={{
            fontSize: '9px',
            fontWeight: 800,
            color: border,
            marginBottom: '2px',
            letterSpacing: '0.03em'
          }}>
            {data.project}
          </div>
        )}
        {data.text}
      </div>
      <div style={{
        width: '8px', height: '6px', marginTop: '2px',
        background: bg, border: `2px solid ${border}`,
        borderRadius: '50%', boxShadow: `1px 1px 0px ${border}`
      }} />
    </div>
  )
}
