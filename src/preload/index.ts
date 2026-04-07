import { contextBridge, ipcRenderer } from 'electron'
import { PetTheme, DialogStyle, SessionState, SessionUpdate, PermissionRequestInfo, PermissionDecision } from '../shared/types'

function onIpc<T extends unknown[]>(channel: string, callback: (...args: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void =>
    callback(...(args as T))
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  onSessionUpdate: (cb: (update: SessionUpdate) => void) => onIpc('session-update', cb),
  onThemeChange: (cb: (theme: PetTheme) => void) => onIpc('theme-change', cb),
  onShowSessions: (cb: (sessions: SessionState[]) => void) => onIpc('show-sessions', cb),
  onDialogStyleChange: (cb: (style: DialogStyle) => void) => onIpc('dialog-style-change', cb),
  onDragChange: (cb: (dragging: boolean) => void) => onIpc('drag-change', cb),
  onPermissionRequest: (cb: (info: PermissionRequestInfo) => void) => onIpc('permission-request', cb),
  onConfettiChange: (cb: (enabled: boolean) => void) => onIpc('confetti-change', cb),
  onAutoApproveToast: (cb: (toolName: string, toolInput: Record<string, unknown>, sessionId: string, cwd: string) => void) =>
    onIpc('auto-approve-toast', cb),
  respondPermission: (requestId: string, decision: PermissionDecision): void => {
    ipcRenderer.send('permission-response', requestId, decision)
  },
  setClickThrough: (ignore: boolean): void => {
    ipcRenderer.send('set-click-through', ignore)
  },
  dragMove: (dx: number, dy: number): void => {
    ipcRenderer.send('window-drag-move', dx, dy)
  },
  updateHitRegions: (regions: Array<{ x: number; y: number; width: number; height: number }>): void => {
    ipcRenderer.send('update-hit-regions', regions)
  }
})
