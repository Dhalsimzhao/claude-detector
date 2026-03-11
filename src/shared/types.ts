// Pet animation states
export type PetState = 'idle' | 'running' | 'permissionRequest' | 'taskCompleted'

// Pet display themes
export type PetTheme = 'blocks' | 'pokemon'

// Hook event names from Claude Code
export type HookEventName =
  | 'SessionStart'
  | 'SessionEnd'
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'
  | 'PermissionRequest'
  | 'Notification'
  | 'Stop'

// Data received from hook script via stdin (subset we care about)
export interface HookEventPayload {
  session_id: string
  cwd: string
  hook_event_name: HookEventName
  tool_name?: string
  tool_input?: Record<string, unknown>
  prompt?: string
  source?: string
  reason?: string
  notification_type?: string
  message?: string
}

// Internal session state
export interface SessionState {
  sessionId: string
  cwd: string
  petState: PetState
  lastEvent: HookEventName
  lastToolName?: string
  updatedAt: number // timestamp
}

// IPC event sent to renderer
export interface SessionUpdate {
  sessions: SessionState[]
  activePetState: PetState // resolved state for pet display
}
