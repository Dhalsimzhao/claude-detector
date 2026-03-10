import { HookEventPayload, SessionState, PetState, SessionUpdate } from '../shared/types'

type OnChangeCallback = (update: SessionUpdate) => void

export class SessionManager {
  private sessions = new Map<string, SessionState>()
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()
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
    session.petState = this.mapEventToState(hook_event_name, event)
    if (tool_name) session.lastToolName = tool_name

    // After Stop, transition to needsAttention if no follow-up within 3s
    if (hook_event_name === 'Stop' && session.petState === 'complete') {
      setTimeout(() => {
        const s = this.sessions.get(session_id)
        if (s && s.petState === 'complete') {
          s.petState = 'needsAttention'
          this.onChange?.(this.getUpdate())
        }
      }, 3000)
    }

    // Clean up ended sessions after a delay (clear previous timer if any)
    if (hook_event_name === 'SessionEnd') {
      const prev = this.cleanupTimers.get(session_id)
      if (prev) clearTimeout(prev)
      const timer = setTimeout(() => {
        this.sessions.delete(session_id)
        this.cleanupTimers.delete(session_id)
      }, 5000)
      this.cleanupTimers.set(session_id, timer)
    }

    return this.getUpdate()
  }

  private mapEventToState(event: string, payload: HookEventPayload): PetState {
    switch (event) {
      case 'SessionStart':
        return 'idle'
      case 'UserPromptSubmit':
        return 'thinking'
      case 'PreToolUse':
      case 'PostToolUse':
        return 'coding'
      case 'Stop':
        if (payload.reason === 'error') return 'error'
        return 'complete'
      case 'SessionEnd':
        return 'idle'
      default:
        return 'idle'
    }
  }

  getUpdate(): SessionUpdate {
    const sessions = Array.from(this.sessions.values())

    // Resolve active pet state: priority order
    let activePetState: PetState = 'idle'
    const priority: PetState[] = ['error', 'needsAttention', 'coding', 'thinking', 'complete', 'idle']

    for (const p of priority) {
      if (sessions.some(s => s.petState === p)) {
        activePetState = p
        break
      }
    }

    return { sessions, activePetState }
  }
}
