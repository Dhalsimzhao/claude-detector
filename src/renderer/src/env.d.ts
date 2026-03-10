/// <reference types="vite/client" />

declare module '*.gif' {
  const src: string
  export default src
}

import { SessionUpdate } from '../../shared/types'

declare global {
  interface Window {
    api: {
      onSessionUpdate: (callback: (update: SessionUpdate) => void) => () => void
    }
  }
}
