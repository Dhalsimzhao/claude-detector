import { HookEventPayload, SessionState, PetState, SessionUpdate } from '../shared/types'

type OnChangeCallback = (update: SessionUpdate) => void

export class SessionManager {
  private sessions = new Map<string, SessionState>()
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private taskCompletedTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private onChange: OnChangeCallback | null = null

  setOnChange(callback: OnChangeCallback): void {
    this.onChange = callback
  }

  handleEvent(event: HookEventPayload): SessionUpdate {
    const { session_id, cwd, hook_event_name, tool_name } = event

    let session = this.sessions.get(session_id)

    if (!session) {
      session = {
        sessionId: session_id,
        cwd,
        petState: 'idle',
        lastEvent: hook_event_name,
        updatedAt: Date.now()
      }
      this.sessions.set(session_id, session)
    }

    session.lastEvent = hook_event_name
    session.updatedAt = Date.now()
    if (tool_name) session.lastToolName = tool_name

    // Clear taskCompleted timer on new activity
    if (hook_event_name === 'UserPromptSubmit') {
      this.clearTimer(this.taskCompletedTimers, session_id)
    }

    switch (hook_event_name) {
      case 'SessionStart':
        session.petState = 'idle'
        break

      case 'UserPromptSubmit':
        session.petState = 'running'
        break

      case 'PreToolUse':
      case 'PostToolUse':
      case 'PostToolUseFailure':
        session.petState = 'running'
        break

      case 'PermissionRequest':
        session.petState = 'permissionRequest'
        break

      case 'Stop':
        // Briefly show taskCompleted, then transition to idle
        session.petState = 'taskCompleted'
        this.clearTimer(this.taskCompletedTimers, session_id)
        this.taskCompletedTimers.set(session_id, setTimeout(() => {
          const s = this.sessions.get(session_id)
          if (s && s.petState === 'taskCompleted') {
            s.petState = 'idle'
            this.onChange?.(this.getUpdate())
          }
          this.taskCompletedTimers.delete(session_id)
        }, 3000))
        break

      case 'Notification':
        // Don't change pet state for notifications, just track the event
        break

      case 'SessionEnd':
        session.petState = 'idle'
        this.clearTimer(this.taskCompletedTimers, session_id)
        // Remove session after delay
        this.clearTimer(this.cleanupTimers, session_id)
        this.cleanupTimers.set(session_id, setTimeout(() => {
          this.sessions.delete(session_id)
          this.cleanupTimers.delete(session_id)
        }, 5000))
        break
    }

    return this.getUpdate()
  }

  private clearTimer(timers: Map<string, ReturnType<typeof setTimeout>>, id: string): void {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }

  getUpdate(): SessionUpdate {
    const sessions = Array.from(this.sessions.values())

    // Resolve active pet state: priority order
    let activePetState: PetState = 'idle'
    const priority: PetState[] = ['permissionRequest', 'running', 'taskCompleted', 'idle']

    for (const p of priority) {
      if (sessions.some(s => s.petState === p)) {
        activePetState = p
        break
      }
    }

    return { sessions, activePetState }
  }
}
