import { contextBridge, ipcRenderer } from 'electron'
import { PetTheme, SessionState, SessionUpdate } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  onSessionUpdate: (callback: (update: SessionUpdate) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, update: SessionUpdate): void =>
      callback(update)
    ipcRenderer.on('session-update', handler)
    return () => ipcRenderer.removeListener('session-update', handler)
  },
  onThemeChange: (callback: (theme: PetTheme) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: PetTheme): void =>
      callback(theme)
    ipcRenderer.on('theme-change', handler)
    return () => ipcRenderer.removeListener('theme-change', handler)
  },
  moveWindow: (dx: number, dy: number) => {
    ipcRenderer.send('move-window', dx, dy)
  },
  onShowSessions: (callback: (sessions: SessionState[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, sessions: SessionState[]): void =>
      callback(sessions)
    ipcRenderer.on('show-sessions', handler)
    return () => ipcRenderer.removeListener('show-sessions', handler)
  }
})
