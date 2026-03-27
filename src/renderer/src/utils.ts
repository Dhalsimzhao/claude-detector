export interface SessionColor {
  bg: string
  border: string
}

const PALETTE: SessionColor[] = [
  { bg: '#ffffff', border: '#222222' },   // white (first session)
  { bg: '#dbeafe', border: '#4a7ab5' },   // soft blue
  { bg: '#dcfce7', border: '#4a8a5a' },   // soft green
  { bg: '#fef3c7', border: '#a0820e' },   // soft amber
  { bg: '#f3e8ff', border: '#8b5cb8' },   // soft purple
  { bg: '#ffe4e6', border: '#b05060' },   // soft pink
  { bg: '#cffafe', border: '#3a8a8a' },   // soft cyan
  { bg: '#ffedd5', border: '#a06a3a' },   // soft orange
]

const sessionColorMap = new Map<string, number>()
let nextIndex = 0

/** Assign a stable color to each session, first session always white */
export function getSessionColor(sessionId: string): SessionColor {
  if (!sessionColorMap.has(sessionId)) {
    sessionColorMap.set(sessionId, nextIndex++)
  }
  return PALETTE[sessionColorMap.get(sessionId)! % PALETTE.length]
}
