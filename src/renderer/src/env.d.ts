/// <reference types="vite/client" />

import { PetTheme, DialogStyle, SessionState, SessionUpdate, PermissionRequestInfo, PermissionDecision } from '../../shared/types'

declare global {
  interface Window {
    api: {
      platform: NodeJS.Platform
      onSessionUpdate: (callback: (update: SessionUpdate) => void) => () => void
      onThemeChange: (callback: (theme: PetTheme) => void) => () => void
      onShowSessions: (callback: (sessions: SessionState[]) => void) => () => void
      onDialogStyleChange: (callback: (style: DialogStyle) => void) => () => void
      onDragChange: (callback: (dragging: boolean) => void) => () => void
      onPermissionRequest: (callback: (info: PermissionRequestInfo) => void) => () => void
      onAutoApproveToast: (callback: (toolName: string, toolInput: Record<string, unknown>) => void) => () => void
      respondPermission: (requestId: string, decision: PermissionDecision) => void
      setClickThrough: (ignore: boolean) => void
      dragMove: (dx: number, dy: number) => void
      updateHitRegions: (regions: Array<{ x: number; y: number; width: number; height: number }>) => void
    }
  }
}
