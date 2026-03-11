# Context Menu & Session Detail Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add right-click context menu (theme switch, show sessions, quit) and a session detail overlay panel to the desktop pet window.

**Architecture:** Right-click in renderer triggers IPC to main process, which builds and shows a native Electron `Menu.popup()`. "Show Sessions" sends session data back to renderer via IPC, which displays an overlay panel. The overlay auto-dismisses on click-outside or after a timeout.

**Tech Stack:** Electron IPC (`ipcMain.on` / `webContents.send`), Electron `Menu`, React state for overlay visibility.

**Current relevant files:**
- `src/preload/index.ts` - IPC bridge (exposes `window.api`)
- `src/main/index.ts` - Main process entry, holds `petWindow` and `sessionManager` refs
- `src/main/trayManager.ts` - System tray (currently owns theme switching and quit)
- `src/renderer/src/App.tsx` - Root component
- `src/renderer/src/env.d.ts` - Type declarations for `window.api`
- `src/shared/types.ts` - Shared type definitions

---

### Task 1: Add IPC channels for context menu and session display

**Files:**
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/env.d.ts`

**Step 1: Add `showContextMenu` and `onShowSessions` to preload IPC bridge**

In `src/preload/index.ts`, add the import for `SessionState` and two new API methods:

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import { PetTheme, SessionState, SessionUpdate } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  onSessionUpdate: (callback: (update: SessionUpdate) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, update: SessionUpdate): void =>
      callback(update)
    ipcRenderer.on('session-update', handler)
    return () => ipcRenderer.removeListener('session-update', handler)
  },
  onThemeChange: (callback: (theme: PetTheme) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: PetTheme): void =>
      callback(theme)
    ipcRenderer.on('theme-change', handler)
    return () => ipcRenderer.removeListener('theme-change', handler)
  },
  showContextMenu: (): void => {
    ipcRenderer.send('show-context-menu')
  },
  onShowSessions: (callback: (sessions: SessionState[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, sessions: SessionState[]): void =>
      callback(sessions)
    ipcRenderer.on('show-sessions', handler)
    return () => ipcRenderer.removeListener('show-sessions', handler)
  }
})
```

**Step 2: Update type declarations in `src/renderer/src/env.d.ts`**

```typescript
/// <reference types="vite/client" />

declare module '*.gif' {
  const src: string
  export default src
}

import { PetTheme, SessionState, SessionUpdate } from '../../shared/types'

declare global {
  interface Window {
    api: {
      onSessionUpdate: (callback: (update: SessionUpdate) => void) => () => void
      onThemeChange: (callback: (theme: PetTheme) => void) => () => void
      showContextMenu: () => void
      onShowSessions: (callback: (sessions: SessionState[]) => void) => () => void
    }
  }
}
```

**Step 3: Verify types compile**

Run: `npm run typecheck:node`
Expected: PASS (no errors)

**Step 4: Commit**

```bash
git add src/preload/index.ts src/renderer/src/env.d.ts
git commit -m "feat: add IPC channels for context menu and session display"
```

---

### Task 2: Handle context menu in main process

**Files:**
- Modify: `src/main/index.ts`

**Step 1: Add ipcMain handler for `show-context-menu`**

Add `ipcMain, Menu` to the Electron import. Add the IPC handler inside `app.whenReady().then(...)`, after `petWindow` is created:

```typescript
import { app, BrowserWindow, ipcMain, Menu } from 'electron'
```

After `createTray(...)` block, add:

```typescript
  ipcMain.on('show-context-menu', (event) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Theme',
        submenu: [
          {
            label: 'Blocks',
            type: 'radio',
            checked: currentTheme === 'blocks',
            click: () => {
              currentTheme = 'blocks'
              writeConfig({ theme: 'blocks' })
              petWindow?.webContents.send('theme-change', 'blocks')
            }
          },
          {
            label: 'Pokemon',
            type: 'radio',
            checked: currentTheme === 'pokemon',
            click: () => {
              currentTheme = 'pokemon'
              writeConfig({ theme: 'pokemon' })
              petWindow?.webContents.send('theme-change', 'pokemon')
            }
          }
        ]
      },
      {
        label: 'Show Sessions',
        click: () => {
          const sessions = sessionManager.getUpdate().sessions
          petWindow?.webContents.send('show-sessions', sessions)
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          hookServer.stop()
          app.quit()
        }
      }
    ])
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) ?? undefined })
  })
```

Note: The theme-change logic duplicates what's in `createTray`. This is acceptable since the tray menu items are radio buttons with state — keeping them separate is simpler than sharing state. The tray still works independently.

**Step 2: Verify types compile**

Run: `npm run typecheck:node`
Expected: PASS

**Step 3: Commit**

```bash
git add src/main/index.ts
git commit -m "feat: add native context menu with theme, sessions, and quit"
```

---

### Task 3: Add right-click handler in renderer

**Files:**
- Modify: `src/renderer/src/App.tsx`

**Step 1: Add `onContextMenu` handler to the root div**

```tsx
import { useState, useEffect } from 'react'
import { PetCanvas } from './components/PetCanvas'
import { PetSprite } from './components/PetSprite'
import { SessionBadge } from './components/SessionBadge'
import { SessionPanel } from './components/SessionPanel'
import { useAnimationState } from './hooks/useAnimationState'
import { PetTheme, SessionState } from '../../shared/types'

function App() {
  const { state, frameIndex, sessions } = useAnimationState()
  const [theme, setTheme] = useState<PetTheme>('pokemon')
  const [detailSessions, setDetailSessions] = useState<SessionState[] | null>(null)

  useEffect(() => {
    return window.api.onThemeChange(setTheme)
  }, [])

  useEffect(() => {
    return window.api.onShowSessions((sessions) => {
      setDetailSessions(sessions)
    })
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    window.api.showContextMenu()
  }

  return (
    <div
      onContextMenu={handleContextMenu}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        WebkitAppRegion: 'drag',
        cursor: 'grab',
        userSelect: 'none'
      } as React.CSSProperties}
    >
      {theme === 'blocks'
        ? <PetCanvas state={state} frameIndex={frameIndex} />
        : <PetSprite state={state} />
      }
      <SessionBadge sessions={sessions} />
      {detailSessions && (
        <SessionPanel
          sessions={detailSessions}
          onClose={() => setDetailSessions(null)}
        />
      )}
    </div>
  )
}

export default App
```

**Step 2: Verify typecheck (will fail — SessionPanel doesn't exist yet, that's expected)**

Move to Task 4.

---

### Task 4: Create SessionPanel component

**Files:**
- Create: `src/renderer/src/components/SessionPanel.tsx`

**Step 1: Write the SessionPanel overlay component**

This is a small overlay that shows session details. It auto-dismisses after 8 seconds or on click. The panel must use `WebkitAppRegion: 'no-drag'` to be clickable.

```tsx
import { useEffect } from 'react'
import { SessionState } from '../../../shared/types'

interface SessionPanelProps {
  sessions: SessionState[]
  onClose: () => void
}

export function SessionPanel({ sessions, onClose }: SessionPanelProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitAppRegion: 'no-drag',
        cursor: 'default'
      } as React.CSSProperties}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(30, 30, 40, 0.95)',
          borderRadius: 8,
          padding: '10px 14px',
          color: '#e0e0e0',
          fontSize: 11,
          fontFamily: 'monospace',
          maxWidth: 200,
          maxHeight: 180,
          overflowY: 'auto',
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)'
        }}
      >
        {sessions.length === 0 ? (
          <div style={{ color: '#888' }}>No active sessions</div>
        ) : (
          sessions.map((s) => (
            <div key={s.sessionId} style={{ marginBottom: 6 }}>
              <div style={{ color: '#8bb8ff', fontWeight: 'bold' }}>
                {s.sessionId.slice(0, 8)}
              </div>
              <div style={{ color: '#aaa', fontSize: 10 }}>
                {s.cwd.split(/[\\/]/).slice(-2).join('/')}
              </div>
              <div style={{ fontSize: 10 }}>
                <span style={{ color: stateColor(s.petState) }}>{s.petState}</span>
                {s.lastToolName && (
                  <span style={{ color: '#888' }}> | {s.lastToolName}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function stateColor(state: string): string {
  switch (state) {
    case 'running': return '#4ae04a'
    case 'permissionRequest': return '#ffaa00'
    case 'taskCompleted': return '#bb77ff'
    default: return '#888'
  }
}
```

**Step 2: Verify types compile**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Manual test**

Run: `npm run dev`

1. Right-click on the pet → native context menu appears with "Theme", "Show Sessions", "Quit"
2. Click "Show Sessions" → overlay panel appears showing session details (session ID, cwd, state)
3. Click outside the panel or wait 8 seconds → panel dismisses
4. Verify "Theme" switching works from the context menu
5. Verify "Quit" exits the app

**Step 4: Commit**

```bash
git add src/renderer/src/components/SessionPanel.tsx src/renderer/src/App.tsx
git commit -m "feat: add session detail panel and right-click context menu in renderer"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | IPC channels for context menu & sessions | preload, env.d.ts |
| 2 | Native context menu in main process | main/index.ts |
| 3 | Right-click handler in renderer App | App.tsx |
| 4 | SessionPanel overlay component | SessionPanel.tsx, App.tsx |
