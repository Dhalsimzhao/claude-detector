# Claude Detector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Windows desktop pet app that monitors Claude Code sessions via hooks and displays pixel-art animations reflecting session state.

**Architecture:** Electron app with HTTP server receiving events from a Claude Code hook script. Main process manages session state, renderer displays animated pixel pet via Canvas. Communication via IPC.

**Tech Stack:** Electron 33+, electron-vite, React 18, TypeScript, electron-store, Express (lightweight HTTP server)

---

### Task 1: Scaffold Electron Project

**Files:**
- Create: entire project scaffold via `npm create @quick-start/electron`

**Step 1: Scaffold project**

```bash
cd D:/dev/claude-detector
npm create @quick-start/electron@latest . -- --template react-ts
```

If it complains about non-empty dir, move docs out, scaffold, move docs back.

**Step 2: Install additional dependencies**

```bash
npm install electron-store express
npm install -D @types/express
```

**Step 3: Verify it runs**

```bash
npm run dev
```

Expected: Electron window opens with default template.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold electron-vite project with react-ts template"
```

---

### Task 2: Shared Types

**Files:**
- Create: `src/shared/types.ts`

**Step 1: Define shared types**

```typescript
// Pet animation states
export type PetState = 'idle' | 'thinking' | 'coding' | 'needsAttention' | 'complete' | 'error'

// Hook event names from Claude Code
export type HookEventName =
  | 'SessionStart'
  | 'SessionEnd'
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
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
```

**Step 2: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat: add shared type definitions"
```

---

### Task 3: Hook Script

**Files:**
- Create: `scripts/claude-detector-hook.js`

**Step 1: Write the hook script**

This script is executed by Claude Code on each hook event. It reads JSON from stdin and POSTs to our Electron app.

```javascript
#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const path = require('path')

// Read port from config file
const portFile = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-detector', 'port')

let port
try {
  port = parseInt(fs.readFileSync(portFile, 'utf-8').trim(), 10)
} catch {
  // App not running, exit silently
  process.exit(0)
}

// Read stdin
let input = ''
process.stdin.setEncoding('utf-8')
process.stdin.on('data', (chunk) => { input += chunk })
process.stdin.on('end', () => {
  if (!input.trim()) process.exit(0)

  const postData = input.trim()

  const req = http.request({
    hostname: '127.0.0.1',
    port,
    path: '/event',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 3000
  }, () => {
    process.exit(0)
  })

  req.on('error', () => {
    // App not running or not responding, exit silently
    process.exit(0)
  })

  req.write(postData)
  req.end()
})
```

**Step 2: Commit**

```bash
git add scripts/claude-detector-hook.js
git commit -m "feat: add Claude Code hook script"
```

---

### Task 4: Hook Installer

**Files:**
- Create: `src/main/hookInstaller.ts`

**Step 1: Write the hook installer**

Reads `~/.claude/settings.json`, appends our hook entries (identified by command containing `claude-detector-hook`), writes back. Uninstall removes only our entries.

```typescript
import fs from 'fs'
import path from 'path'

const HOOK_IDENTIFIER = 'claude-detector-hook'
const HOOK_EVENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']

function getSettingsPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '.claude', 'settings.json')
}

function getHookScriptPath(): string {
  // Use the bundled hook script path
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '.claude-detector', 'hook.js').replace(/\\/g, '/')
}

function readSettings(): Record<string, unknown> {
  const settingsPath = getSettingsPath()
  if (!fs.existsSync(settingsPath)) return {}
  return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
}

function writeSettings(settings: Record<string, unknown>): void {
  const settingsPath = getSettingsPath()
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
}

export function installHooks(): void {
  const settings = readSettings()
  if (!settings.hooks) settings.hooks = {}
  const hooks = settings.hooks as Record<string, unknown[]>

  const hookCommand = `node "${getHookScriptPath()}"`

  for (const event of HOOK_EVENTS) {
    if (!hooks[event]) hooks[event] = []
    const entries = hooks[event] as Array<{ matcher: string; hooks: Array<{ type: string; command: string; timeout: number }> }>

    // Check if already installed
    const alreadyInstalled = entries.some(entry =>
      entry.hooks?.some(h => h.command.includes(HOOK_IDENTIFIER))
    )
    if (alreadyInstalled) continue

    entries.push({
      matcher: '',
      hooks: [{
        type: 'command',
        command: hookCommand,
        timeout: 5
      }]
    })
  }

  writeSettings(settings)

  // Copy hook script to ~/.claude-detector/
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const destDir = path.join(home, '.claude-detector')
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

  const srcScript = path.join(__dirname, '../../scripts/claude-detector-hook.js')
  const destScript = path.join(destDir, 'hook.js')
  fs.copyFileSync(srcScript, destScript)
}

export function uninstallHooks(): void {
  const settings = readSettings()
  if (!settings.hooks) return
  const hooks = settings.hooks as Record<string, unknown[]>

  for (const event of HOOK_EVENTS) {
    if (!hooks[event]) continue
    hooks[event] = (hooks[event] as Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>)
      .filter(entry => !entry.hooks?.some(h => h.command.includes(HOOK_IDENTIFIER)))
  }

  writeSettings(settings)
}
```

**Step 2: Commit**

```bash
git add src/main/hookInstaller.ts
git commit -m "feat: add hook installer/uninstaller for Claude settings.json"
```

---

### Task 5: Hook Server

**Files:**
- Create: `src/main/hookServer.ts`

**Step 1: Write the HTTP server**

```typescript
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
    this.app.use(express.json())

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
```

**Step 2: Commit**

```bash
git add src/main/hookServer.ts
git commit -m "feat: add HTTP hook server for receiving Claude events"
```

---

### Task 6: Session Manager

**Files:**
- Create: `src/main/sessionManager.ts`

**Step 1: Write session manager with state mapping logic**

```typescript
import { HookEventPayload, SessionState, PetState, SessionUpdate } from '../shared/types'

export class SessionManager {
  private sessions = new Map<string, SessionState>()

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

    // Clean up ended sessions after a delay
    if (hook_event_name === 'SessionEnd') {
      setTimeout(() => this.sessions.delete(session_id), 5000)
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
```

**Step 2: Commit**

```bash
git add src/main/sessionManager.ts
git commit -m "feat: add session manager with event-to-state mapping"
```

---

### Task 7: Window Manager (Desktop Pet Window)

**Files:**
- Modify: `src/main/index.ts` (replace default scaffold)
- Create: `src/main/windowManager.ts`
- Create: `src/main/trayManager.ts`

**Step 1: Write window manager**

```typescript
import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const PET_SIZE = 128
const WINDOW_PADDING = 40

export function createPetWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const win = new BrowserWindow({
    width: PET_SIZE + WINDOW_PADDING * 2,
    height: PET_SIZE + WINDOW_PADDING * 2 + 30,
    x: screenWidth - PET_SIZE - WINDOW_PADDING * 2 - 20,
    y: screenHeight - PET_SIZE - WINDOW_PADDING * 2 - 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.setIgnoreMouseEvents(false)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
```

**Step 2: Write tray manager**

```typescript
import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'

export function createTray(onQuit: () => void): Tray {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  const tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Claude Detector', enabled: false },
    { type: 'separator' },
    { label: 'Quit', click: onQuit }
  ])

  tray.setToolTip('Claude Detector')
  tray.setContextMenu(contextMenu)

  return tray
}
```

**Step 3: Rewrite main/index.ts**

```typescript
import { app, ipcMain } from 'electron'
import { createPetWindow } from './windowManager'
import { createTray } from './trayManager'
import { HookServer } from './hookServer'
import { SessionManager } from './sessionManager'
import { installHooks, uninstallHooks } from './hookInstaller'
import { HookEventPayload } from '../shared/types'

let petWindow: BrowserWindow | null = null

const sessionManager = new SessionManager()

const hookServer = new HookServer((event: HookEventPayload) => {
  const update = sessionManager.handleEvent(event)
  petWindow?.webContents.send('session-update', update)
})

app.whenReady().then(async () => {
  installHooks()
  await hookServer.start()

  petWindow = createPetWindow()

  createTray(() => {
    hookServer.stop()
    app.quit()
  })
})

app.on('before-quit', () => {
  hookServer.stop()
})

// Keep app running when window closed
app.on('window-all-closed', (e) => {
  e.preventDefault()
})
```

Note: import `BrowserWindow` type at top of main/index.ts.

**Step 4: Commit**

```bash
git add src/main/windowManager.ts src/main/trayManager.ts src/main/index.ts
git commit -m "feat: add pet window, tray manager, and wire up main process"
```

---

### Task 8: Preload Script

**Files:**
- Modify: `src/preload/index.ts`

**Step 1: Expose IPC API via contextBridge**

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import { SessionUpdate } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  onSessionUpdate: (callback: (update: SessionUpdate) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, update: SessionUpdate) => callback(update)
    ipcRenderer.on('session-update', handler)
    return () => ipcRenderer.removeListener('session-update', handler)
  }
})
```

**Step 2: Create type declaration for renderer**

Create `src/renderer/src/env.d.ts`:
```typescript
import { SessionUpdate } from '../../shared/types'

declare global {
  interface Window {
    api: {
      onSessionUpdate: (callback: (update: SessionUpdate) => void) => () => void
    }
  }
}
```

**Step 3: Commit**

```bash
git add src/preload/index.ts src/renderer/src/env.d.ts
git commit -m "feat: add preload script with session update IPC bridge"
```

---

### Task 9: Renderer - Animation State Hook

**Files:**
- Create: `src/renderer/src/hooks/useAnimationState.ts`

**Step 1: Write the animation state hook**

```typescript
import { useState, useEffect, useRef } from 'react'
import { PetState, SessionUpdate } from '../../../shared/types'

interface AnimationFrame {
  state: PetState
  frameIndex: number
  totalFrames: number
}

const FRAME_COUNTS: Record<PetState, number> = {
  idle: 8,
  thinking: 6,
  coding: 8,
  needsAttention: 4,
  complete: 6,
  error: 4
}

const FPS = 8

export function useAnimationState(): AnimationFrame & { sessions: SessionUpdate['sessions'] } {
  const [petState, setPetState] = useState<PetState>('idle')
  const [frameIndex, setFrameIndex] = useState(0)
  const [sessions, setSessions] = useState<SessionUpdate['sessions']>([])
  const prevStateRef = useRef<PetState>('idle')

  // Listen for session updates from main process
  useEffect(() => {
    const unsubscribe = window.api.onSessionUpdate((update) => {
      setSessions(update.sessions)
      setPetState(update.activePetState)
    })
    return unsubscribe
  }, [])

  // Reset frame index when state changes
  useEffect(() => {
    if (petState !== prevStateRef.current) {
      setFrameIndex(0)
      prevStateRef.current = petState
    }
  }, [petState])

  // Animation loop
  useEffect(() => {
    const totalFrames = FRAME_COUNTS[petState]
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % totalFrames)
    }, 1000 / FPS)
    return () => clearInterval(interval)
  }, [petState])

  return {
    state: petState,
    frameIndex,
    totalFrames: FRAME_COUNTS[petState],
    sessions
  }
}
```

**Step 2: Commit**

```bash
git add src/renderer/src/hooks/useAnimationState.ts
git commit -m "feat: add animation state hook with frame loop"
```

---

### Task 10: Renderer - PetCanvas Component (Placeholder)

**Files:**
- Create: `src/renderer/src/components/PetCanvas.tsx`

**Step 1: Write PetCanvas with colored-block placeholders**

MVP uses colored rectangles with text labels instead of real sprites.

```tsx
import { useRef, useEffect } from 'react'
import { PetState } from '../../../shared/types'

interface PetCanvasProps {
  state: PetState
  frameIndex: number
}

const STATE_COLORS: Record<PetState, string> = {
  idle: '#4a9eff',
  thinking: '#ffa500',
  coding: '#00cc66',
  needsAttention: '#ff6b6b',
  complete: '#9b59b6',
  error: '#ff0000'
}

const SIZE = 128

export function PetCanvas({ state, frameIndex }: PetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, SIZE, SIZE)

    // Background color block
    ctx.fillStyle = STATE_COLORS[state]
    const bounce = Math.sin(frameIndex * 0.8) * 4
    const x = 16
    const y = 16 + bounce
    const w = SIZE - 32
    const h = SIZE - 32

    // Rounded rect body
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 12)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x + w * 0.35, y + h * 0.35, 8, 0, Math.PI * 2)
    ctx.arc(x + w * 0.65, y + h * 0.35, 8, 0, Math.PI * 2)
    ctx.fill()

    // Pupils
    ctx.fillStyle = '#333333'
    ctx.beginPath()
    ctx.arc(x + w * 0.35, y + h * 0.35, 4, 0, Math.PI * 2)
    ctx.arc(x + w * 0.65, y + h * 0.35, 4, 0, Math.PI * 2)
    ctx.fill()

    // State label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(state, SIZE / 2, y + h * 0.75)
  }, [state, frameIndex])

  return <canvas ref={canvasRef} width={SIZE} height={SIZE} />
}
```

**Step 2: Commit**

```bash
git add src/renderer/src/components/PetCanvas.tsx
git commit -m "feat: add PetCanvas with placeholder colored-block animation"
```

---

### Task 11: Renderer - SessionBadge Component

**Files:**
- Create: `src/renderer/src/components/SessionBadge.tsx`

**Step 1: Write SessionBadge**

```tsx
import { SessionState } from '../../../shared/types'

interface SessionBadgeProps {
  sessions: SessionState[]
}

export function SessionBadge({ sessions }: SessionBadgeProps) {
  if (sessions.length <= 1) return null

  return (
    <div style={{
      position: 'absolute',
      top: 4,
      right: 4,
      background: '#ff6b6b',
      color: '#fff',
      borderRadius: '50%',
      width: 20,
      height: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 'bold',
      fontFamily: 'monospace'
    }}>
      {sessions.length}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/renderer/src/components/SessionBadge.tsx
git commit -m "feat: add SessionBadge for multi-session indicator"
```

---

### Task 12: Renderer - App Root & Styles

**Files:**
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/index.html`

**Step 1: Rewrite App.tsx**

```tsx
import { PetCanvas } from './components/PetCanvas'
import { SessionBadge } from './components/SessionBadge'
import { useAnimationState } from './hooks/useAnimationState'

function App() {
  const { state, frameIndex, sessions } = useAnimationState()

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      WebkitAppRegion: 'drag',
      cursor: 'grab',
      userSelect: 'none'
    } as React.CSSProperties}>
      <PetCanvas state={state} frameIndex={frameIndex} />
      <SessionBadge sessions={sessions} />
    </div>
  )
}

export default App
```

**Step 2: Update index.html - set transparent background**

Ensure the `<body>` and `<html>` have `background: transparent`.

```html
<!DOCTYPE html>
<html style="background: transparent;">
<head>
  <meta charset="UTF-8" />
  <title>Claude Detector</title>
</head>
<body style="margin: 0; padding: 0; background: transparent; overflow: hidden;">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

**Step 3: Remove default scaffold CSS/assets that are no longer needed**

Delete default template files like `App.css`, `assets/`, etc.

**Step 4: Verify app runs**

```bash
npm run dev
```

Expected: Transparent window with blue rounded square (idle state) floating on desktop, draggable.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up App with PetCanvas and transparent window"
```

---

### Task 13: Create Placeholder Tray Icon

**Files:**
- Create: `resources/icon.png`

**Step 1: Generate a simple 16x16 icon**

Use a simple script or manually create a 16x16 PNG. For MVP, we can use a colored square.

```bash
# Use ImageMagick if available, or just place any small PNG
convert -size 16x16 xc:'#4a9eff' resources/icon.png
```

If ImageMagick not available, create a minimal PNG programmatically or download any small icon.

**Step 2: Commit**

```bash
git add resources/icon.png
git commit -m "feat: add placeholder tray icon"
```

---

### Task 14: End-to-End Integration Test

**Step 1: Start the app**

```bash
npm run dev
```

**Step 2: Verify hooks installed**

Check `~/.claude/settings.json` contains `claude-detector-hook` entries for all 6 events.

**Step 3: Simulate a hook event**

Read the port from `~/.claude-detector/port` and POST a test event:

```bash
PORT=$(cat ~/.claude-detector/port)
curl -X POST http://127.0.0.1:$PORT/event \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-1","cwd":"/tmp","hook_event_name":"UserPromptSubmit","prompt":"hello"}'
```

Expected: Pet changes from blue (idle) to orange (thinking).

**Step 4: Test more state transitions**

```bash
curl -X POST http://127.0.0.1:$PORT/event \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-1","cwd":"/tmp","hook_event_name":"PreToolUse","tool_name":"Bash"}'
```

Expected: Pet changes to green (coding).

```bash
curl -X POST http://127.0.0.1:$PORT/event \
  -H "Content-Type: application/json" \
  -d '{"session_id":"test-1","cwd":"/tmp","hook_event_name":"Stop"}'
```

Expected: Pet changes to purple (complete), then back to blue (idle) after a few seconds.

**Step 5: Commit any fixes needed**

```bash
git add -A
git commit -m "fix: integration test fixes"
```

---

### Task 15: NeedsAttention State Detection

**Files:**
- Modify: `src/main/sessionManager.ts`

**Step 1: Enhance Stop event handling**

After a `Stop` event, if the next event for that session is NOT `SessionEnd` (meaning Claude stopped and is waiting for user input), transition to `needsAttention` after a short delay.

```typescript
// In mapEventToState, after Stop:
case 'Stop':
  if (payload.reason === 'error') return 'error'
  // Start a timer: if no SessionEnd or UserPromptSubmit within 3s,
  // set state to needsAttention
  setTimeout(() => {
    const s = this.sessions.get(payload.session_id)
    if (s && s.petState === 'complete') {
      s.petState = 'needsAttention'
      // Notify via callback
    }
  }, 3000)
  return 'complete'
```

This requires adding an onChange callback to SessionManager. Update constructor to accept it.

**Step 2: Commit**

```bash
git add src/main/sessionManager.ts src/main/index.ts
git commit -m "feat: add needsAttention state detection after Stop"
```

---

## Summary

| Task | Description | Estimated Effort |
|------|-------------|-----------------|
| 1 | Scaffold Electron project | Setup |
| 2 | Shared types | Small |
| 3 | Hook script | Small |
| 4 | Hook installer | Medium |
| 5 | Hook server | Medium |
| 6 | Session manager | Medium |
| 7 | Window + tray manager | Medium |
| 8 | Preload script | Small |
| 9 | Animation state hook | Medium |
| 10 | PetCanvas placeholder | Medium |
| 11 | SessionBadge | Small |
| 12 | App root wiring | Medium |
| 13 | Placeholder icon | Small |
| 14 | E2E integration test | Testing |
| 15 | NeedsAttention detection | Small |
