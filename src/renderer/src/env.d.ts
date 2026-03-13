/// <reference types="vite/client" />

import { PetTheme, SessionState, SessionUpdate } from '../../shared/types'

declare global {
  interface Window {
    api: {
      onSessionUpdate: (callback: (update: SessionUpdate) => void) => () => void
      onThemeChange: (callback: (theme: PetTheme) => void) => () => void
      onShowSessions: (callback: (sessions: SessionState[]) => void) => () => void
      onDragChange: (callback: (dragging: boolean) => void) => () => void
    }
  }
}
