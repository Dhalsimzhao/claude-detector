import express from 'express'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { HookEventPayload } from '../shared/types'

type EventCallback = (event: HookEventPayload) => void

export class HookServer {
  private app = express()
  private server: http.Server | null = null
  private onEvent: EventCallback

  constructor(onEvent: EventCallback) {
    this.onEvent = onEvent
    this.app.use(express.json({ limit: '10kb' }))

    this.app.post('/event', (req, res) => {
      try {
        const payload = req.body as HookEventPayload
        if (payload && payload.session_id && payload.hook_event_name) {
          this.onEvent(payload)
        }
        res.status(200).json({ ok: true })
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
    const home = process.env.HOME || process.env.USERPROFILE || ''
    const dir = path.join(home, '.claude-detector')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'port'), String(port), 'utf-8')
  }

  private removePortFile(): void {
    const home = process.env.HOME || process.env.USERPROFILE || ''
    const portFile = path.join(home, '.claude-detector', 'port')
    try { fs.unlinkSync(portFile) } catch { /* ignore */ }
  }
}
