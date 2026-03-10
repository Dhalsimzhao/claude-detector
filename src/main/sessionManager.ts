import { HookEventPayload, SessionState, PetState, SessionUpdate } from '../shared/types'

type OnChangeCallback = (update: SessionUpdate) => void

export class SessionManager {
  private sessions = new Map<string, SessionState>()
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private permissionTimers = new Map<string, ReturnType<typeof setTimeout>>()
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

    // Clear permission timer on any non-PreToolUse event
    if (hook_event_name !== 'PreToolUse') {
      this.clearTimer(this.permissionTimers, session_id)
    }

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
        session.petState = 'running'
        // If no PostToolUse within 2s, assume permission request
        this.clearTimer(this.permissionTimers, session_id)
        this.permissionTimers.set(session_id, setTimeout(() => {
          const s = this.sessions.get(session_id)
          if (s && s.petState === 'running') {
            s.petState = 'permissionRequest'
            this.onChange?.(this.getUpdate())
          }
          this.permissionTimers.delete(session_id)
        }, 2000))
        break

      case 'PostToolUse':
        session.petState = 'running'
        this.clearTimer(this.permissionTimers, session_id)
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

      case 'SessionEnd':
        session.petState = 'idle'
        this.clearTimer(this.permissionTimers, session_id)
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
