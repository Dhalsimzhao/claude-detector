import { app, BrowserWindow, Menu, screen, ipcMain } from 'electron'
import { createPetWindow, PET_SIZE, WINDOW_PADDING } from './windowManager'
import { createTray } from './trayManager'
import { HookServer } from './hookServer'
import { SessionManager } from './sessionManager'
import { installHooks } from './hookInstaller'
import { HookEventPayload, PetTheme, PermissionRequestInfo, PermissionDecision } from '../shared/types'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_DIR = join(homedir(), '.claude-detector')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const VALID_THEMES: PetTheme[] = ['blocks', 'psyduck', 'sherma', 'flea']

// Default window dimensions
const DEFAULT_WIN_WIDTH = PET_SIZE + WINDOW_PADDING * 2
const DEFAULT_WIN_HEIGHT = PET_SIZE + WINDOW_PADDING * 2 + 30

// Permission dialog dimensions
const DIALOG_WIN_WIDTH = 320
const DIALOG_WIN_HEIGHT = 240

function readConfig(): { theme: PetTheme } {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
    // Migrate old 'pokemon' theme name
    if (config.theme === 'pokemon') config.theme = 'psyduck'
    if (!VALID_THEMES.includes(config.theme)) config.theme = 'psyduck'
    return config
  } catch {
    return { theme: 'psyduck' }
  }
}

function writeConfig(config: { theme: PetTheme }): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

let petWindow: BrowserWindow | null = null
let currentTheme: PetTheme = readConfig().theme

const sessionManager = new SessionManager()

// Handle timer-based state changes
sessionManager.setOnChange((update) => {
  petWindow?.webContents.send('session-update', update)
})

// Clamp position to the display where the pet currently sits
function clampToDisplay(anchorX: number, anchorY: number, x: number, y: number, w: number, h: number): [number, number] {
  // Use the pet's current center (anchor) to determine which display it belongs to
  const display = screen.getDisplayNearestPoint({ x: anchorX, y: anchorY })
  const { x: sx, y: sy, width: sw, height: sh } = display.workArea
  return [
    Math.max(sx, Math.min(x, sx + sw - w)),
    Math.max(sy, Math.min(y, sy + sh - h))
  ]
}

// When a permission request arrives: notify renderer + expand window
sessionManager.setOnPermissionRequest((info: PermissionRequestInfo) => {
  if (!petWindow) return
  const [wx, wy] = petWindow.getPosition()
  const rawX = wx - (DIALOG_WIN_WIDTH - DEFAULT_WIN_WIDTH)
  const rawY = wy - (DIALOG_WIN_HEIGHT - DEFAULT_WIN_HEIGHT)
  const [newX, newY] = clampToDisplay(wx, wy, rawX, rawY, DIALOG_WIN_WIDTH, DIALOG_WIN_HEIGHT)
  petWindow.setSize(DIALOG_WIN_WIDTH, DIALOG_WIN_HEIGHT)
  petWindow.setPosition(newX, newY)
  petWindow.webContents.send('permission-request', info)
})

// Listen for user's permission decision from renderer
ipcMain.on('permission-response', (_event, requestId: string, decision: PermissionDecision) => {
  sessionManager.resolvePermission(requestId, decision)
  if (petWindow) {
    const [wx, wy] = petWindow.getPosition()
    const rawX = wx + (DIALOG_WIN_WIDTH - DEFAULT_WIN_WIDTH)
    const rawY = wy + (DIALOG_WIN_HEIGHT - DEFAULT_WIN_HEIGHT)
    const [newX, newY] = clampToDisplay(wx, wy, rawX, rawY, DEFAULT_WIN_WIDTH, DEFAULT_WIN_HEIGHT)
    petWindow.setSize(DEFAULT_WIN_WIDTH, DEFAULT_WIN_HEIGHT)
    petWindow.setPosition(newX, newY)
  }
})

const hookServer = new HookServer(
  (event: HookEventPayload) => {
    const update = sessionManager.handleEvent(event)
    petWindow?.webContents.send('session-update', update)
  },
  (info: PermissionRequestInfo) => sessionManager.requestPermission(info)
)

function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Theme',
      submenu: (['blocks', 'psyduck', 'sherma', 'flea'] as PetTheme[]).map((t) => ({
        label: { blocks: 'Blocks', psyduck: 'Psyduck', sherma: 'Sherma', flea: 'Flea' }[t],
        type: 'radio' as const,
        checked: currentTheme === t,
        click: () => {
          currentTheme = t
          writeConfig({ theme: t })
          petWindow?.webContents.send('theme-change', t)
        }
      }))
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
}

app.whenReady().then(async () => {
  installHooks()
  await hookServer.start()

  petWindow = createPetWindow()

  petWindow.webContents.on('did-finish-load', () => {
    petWindow?.webContents.send('theme-change', currentTheme)
  })

  createTray(
    () => {
      hookServer.stop()
      app.quit()
    },
    currentTheme,
    (theme: PetTheme) => {
      currentTheme = theme
      writeConfig({ theme })
      petWindow?.webContents.send('theme-change', theme)
    }
  )

  // system-context-menu only works on Windows; use webContents context-menu for cross-platform
  petWindow.on('system-context-menu', (event) => {
    event.preventDefault()
  })
  petWindow.webContents.on('context-menu', (_event, params) => {
    buildContextMenu().popup({ window: petWindow ?? undefined, x: params.x, y: params.y })
  })
})

app.on('before-quit', () => {
  hookServer.stop()
})

// Keep app running in tray when window closed (Windows)
// macOS: standard behavior — quit when all windows close
app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    hookServer.stop()
    app.quit()
  }
  // Windows: do nothing — app stays alive via tray
})

// macOS: re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    petWindow = createPetWindow()
    petWindow.webContents.on('did-finish-load', () => {
      petWindow?.webContents.send('theme-change', currentTheme)
    })
  }
})
