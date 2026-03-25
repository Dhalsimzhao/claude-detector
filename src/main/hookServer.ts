import express from 'express'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { homedir } from 'os'
import { HookEventPayload, PermissionRequestInfo, PermissionDecision } from '../shared/types'

type EventCallback = (event: HookEventPayload) => void
type PermissionCallback = (info: PermissionRequestInfo) => Promise<PermissionDecision>

export class HookServer {
  private app = express()
  private server: http.Server | null = null
  private onEvent: EventCallback
  private onPermissionRequest: PermissionCallback | null = null

  constructor(onEvent: EventCallback, onPermissionRequest?: PermissionCallback) {
    this.onEvent = onEvent
    if (onPermissionRequest) this.onPermissionRequest = onPermissionRequest
    this.app.use(express.json({ limit: '10kb' }))

    this.app.post('/event', (req, res) => {
      try {
        const payload = req.body as HookEventPayload
        if (payload && payload.session_id && payload.hook_event_name) {
          console.log(`[hook] ${payload.hook_event_name} | session=${payload.session_id.slice(0, 8)} | tool=${payload.tool_name || '-'}`)
          this.onEvent(payload)
        }
        res.status(200).json({ ok: true })
      } catch {
        res.status(400).json({ error: 'invalid payload' })
      }
    })

    this.app.post('/permission-request', (req, res) => {
      try {
        const info = req.body as PermissionRequestInfo
        if (!info || !info.requestId || !info.sessionId) {
          res.status(400).json({ error: 'invalid payload' })
          return
        }
        console.log(`[permission] requestId=${info.requestId} | tool=${info.toolName} | session=${info.sessionId.slice(0, 8)}`)

        if (!this.onPermissionRequest) {
          // No handler registered, approve by default
          res.status(200).json({ decision: 'approve' })
          return
        }

        this.onPermissionRequest(info)
          .then((decision) => {
            res.status(200).json({ decision })
          })
          .catch(() => {
            // Timeout or error: no decision, let Claude Code fall back to terminal
            res.status(200).json({})
          })
      } catch {
        res.status(400).json({ error: 'invalid payload' })
      }
    })
  }

  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, '127.0.0.1', () => {
        const addr = this.server!.address()
        const port = typeof addr === 'object' && addr ? addr.port : 0
        this.writePortFile(port)
        resolve(port)
      })
    })
  }

  stop(): void {
    this.server?.close()
    this.removePortFile()
  }

  private writePortFile(port: number): void {
    const dir = path.join(homedir(), '.claude-detector')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'port'), String(port), 'utf-8')
  }

  private removePortFile(): void {
    const portFile = path.join(homedir(), '.claude-detector', 'port')
    try { fs.unlinkSync(portFile) } catch { /* ignore */ }
  }
}
