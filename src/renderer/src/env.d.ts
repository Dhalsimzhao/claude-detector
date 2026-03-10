/// <reference types="vite/client" />

import { SessionUpdate } from '../../shared/types'

declare global {
  interface Window {
    api: {
      onSessionUpdate: (callback: (update: SessionUpdate) => void) => () => void
    }
  }
}
