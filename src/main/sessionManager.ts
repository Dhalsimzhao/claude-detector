import { HookEventPayload, SessionState, PetState, SessionUpdate, PermissionRequestInfo, PermissionDecision } from '../shared/types'

type OnChangeCallback = (update: SessionUpdate) => void
type OnPermissionRequestCallback = (info: PermissionRequestInfo) => void

interface PendingPermission {
  info: PermissionRequestInfo
  resolve: (decision: PermissionDecision) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const PERMISSION_TIMEOUT_MS = 115000
// Sessions with no events for this long are considered stale and removed
const STALE_SESSION_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes
const STALE_CHECK_INTERVAL_MS = 60 * 1000 // check every minute

export class SessionManager {
  private sessions = new Map<string, SessionState>()
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private taskCompletedTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private pendingPermissions = new Map<string, PendingPermission>()
  private staleCheckTimer: ReturnType<typeof setInterval> | null = null
  private onChange: OnChangeCallback | null = null
  private onPermissionRequestNotify: OnPermissionRequestCallback | null = null

  setOnChange(callback: OnChangeCallback): void {
    this.onChange = callback
    this.startStaleCleanup()
  }

  setOnPermissionRequest(callback: OnPermissionRequestCallback): void {
    this.onPermissionRequestNotify = callback
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
        // Reject any pending permissions for this session
        this.rejectPendingPermissionsForSession(session_id)
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

  requestPermission(info: PermissionRequestInfo): Promise<PermissionDecision> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingPermissions.delete(info.requestId)
        reject(new Error('permission request timed out'))
      }, PERMISSION_TIMEOUT_MS)

      this.pendingPermissions.set(info.requestId, { info, resolve, reject, timer })

      // Update pet state to permissionRequest
      const session = this.sessions.get(info.sessionId)
      if (session) {
        session.petState = 'permissionRequest'
        this.onChange?.(this.getUpdate())
      }

      this.onPermissionRequestNotify?.(info)
    })
  }

  resolvePermission(requestId: string, decision: PermissionDecision): void {
    const pending = this.pendingPermissions.get(requestId)
    if (!pending) return
    clearTimeout(pending.timer)
    this.pendingPermissions.delete(requestId)
    pending.resolve(decision)

    // Restore session to running state
    const session = this.sessions.get(pending.info.sessionId)
    if (session && session.petState === 'permissionRequest') {
      session.petState = 'running'
      this.onChange?.(this.getUpdate())
    }
  }

  private rejectPendingPermissionsForSession(sessionId: string): void {
    for (const [requestId, pending] of this.pendingPermissions) {
      if (pending.info.sessionId === sessionId) {
        clearTimeout(pending.timer)
        this.pendingPermissions.delete(requestId)
        pending.reject(new Error('session ended'))
      }
    }
  }

  private startStaleCleanup(): void {
    if (this.staleCheckTimer) return
    this.staleCheckTimer = setInterval(() => this.cleanupStaleSessions(), STALE_CHECK_INTERVAL_MS)
  }

  private cleanupStaleSessions(): void {
    const now = Date.now()
    let changed = false

    for (const [sessionId, session] of this.sessions) {
      if (now - session.updatedAt > STALE_SESSION_TIMEOUT_MS) {
        console.log(`[session-manager] Removing stale session ${sessionId} (idle for ${Math.round((now - session.updatedAt) / 1000)}s)`)
        this.clearTimer(this.cleanupTimers, sessionId)
        this.clearTimer(this.taskCompletedTimers, sessionId)
        this.rejectPendingPermissionsForSession(sessionId)
        this.sessions.delete(sessionId)
        changed = true
      }
    }

    if (changed) {
      this.onChange?.(this.getUpdate())
    }
  }

  destroy(): void {
    if (this.staleCheckTimer) {
      clearInterval(this.staleCheckTimer)
      this.staleCheckTimer = null
    }
    for (const timer of this.cleanupTimers.values()) clearTimeout(timer)
    for (const timer of this.taskCompletedTimers.values()) clearTimeout(timer)
    for (const pending of this.pendingPermissions.values()) {
      clearTimeout(pending.timer)
      pending.reject(new Error('app shutting down'))
    }
    this.cleanupTimers.clear()
    this.taskCompletedTimers.clear()
    this.pendingPermissions.clear()
    this.sessions.clear()
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
