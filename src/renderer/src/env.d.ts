/// <reference types="vite/client" />

declare module '*.gif' {
  const src: string
  export default src
}

import { PetTheme, SessionState, SessionUpdate } from '../../shared/types'

declare global {
  interface Window {
    api: {
      onSessionUpdate: (callback: (update: SessionUpdate) => void) => () => void
      onThemeChange: (callback: (theme: PetTheme) => void) => () => void
      moveWindow: (dx: number, dy: number) => void
      onShowSessions: (callback: (sessions: SessionState[]) => void) => () => void
    }
  }
}
