import { contextBridge, ipcRenderer } from 'electron'
import { SessionUpdate } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  onSessionUpdate: (callback: (update: SessionUpdate) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, update: SessionUpdate): void =>
      callback(update)
    ipcRenderer.on('session-update', handler)
    return () => ipcRenderer.removeListener('session-update', handler)
  }
})
