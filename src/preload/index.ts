import { contextBridge, ipcRenderer } from 'electron'
import { PetTheme, DialogStyle, SessionState, SessionUpdate, PermissionRequestInfo, PermissionDecision } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
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
  onShowSessions: (callback: (sessions: SessionState[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, sessions: SessionState[]): void =>
      callback(sessions)
    ipcRenderer.on('show-sessions', handler)
    return () => ipcRenderer.removeListener('show-sessions', handler)
  },
  onDialogStyleChange: (callback: (style: DialogStyle) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, style: DialogStyle): void =>
      callback(style)
    ipcRenderer.on('dialog-style-change', handler)
    return () => ipcRenderer.removeListener('dialog-style-change', handler)
  },
  onDragChange: (callback: (dragging: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, dragging: boolean): void =>
      callback(dragging)
    ipcRenderer.on('drag-change', handler)
    return () => ipcRenderer.removeListener('drag-change', handler)
  },
  onPermissionRequest: (callback: (info: PermissionRequestInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: PermissionRequestInfo): void =>
      callback(info)
    ipcRenderer.on('permission-request', handler)
    return () => ipcRenderer.removeListener('permission-request', handler)
  },
  onAutoApproveToast: (callback: (toolName: string, toolInput: Record<string, unknown>, sessionId: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, toolName: string, toolInput: Record<string, unknown>, sessionId: string): void =>
      callback(toolName, toolInput, sessionId)
    ipcRenderer.on('auto-approve-toast', handler)
    return () => ipcRenderer.removeListener('auto-approve-toast', handler)
  },
  respondPermission: (requestId: string, decision: PermissionDecision): void => {
    ipcRenderer.send('permission-response', requestId, decision)
  }
})
