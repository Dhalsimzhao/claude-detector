import { app, BrowserWindow, Menu, screen, ipcMain } from 'electron'
import { createPetWindow, PET_SIZE, WINDOW_PADDING, BUBBLE_WIN_WIDTH, BUBBLE_WIN_HEIGHT } from './windowManager'
import { createTray } from './trayManager'
import { HookServer } from './hookServer'
import { SessionManager } from './sessionManager'
import { installHooks } from './hookInstaller'
import { HookEventPayload, PetTheme, DialogStyle, PermissionRequestInfo, PermissionDecision } from '../shared/types'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_DIR = join(homedir(), '.claude-detector')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const VALID_THEMES: PetTheme[] = ['blocks', 'psyduck', 'sherma', 'flea']
const VALID_DIALOG_STYLES: DialogStyle[] = ['panel', 'bubble']

// Default window dimensions
const DEFAULT_WIN_WIDTH = PET_SIZE + WINDOW_PADDING * 2
const DEFAULT_WIN_HEIGHT = PET_SIZE + WINDOW_PADDING * 2 + 30

// Permission dialog dimensions (panel mode only — bubble is pre-sized)
const DIALOG_PANEL_WIDTH = 320
const DIALOG_PANEL_HEIGHT = 240

interface AppConfig {
  theme: PetTheme
  dialogStyle: DialogStyle
  autoApprove: boolean
}

function readConfig(): AppConfig {
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
    if (config.theme === 'pokemon') config.theme = 'psyduck'
    if (!VALID_THEMES.includes(config.theme)) config.theme = 'psyduck'
    if (!VALID_DIALOG_STYLES.includes(config.dialogStyle)) config.dialogStyle = 'panel'
    if (typeof config.autoApprove !== 'boolean') config.autoApprove = false
    return config
  } catch {
    return { theme: 'psyduck', dialogStyle: 'panel', autoApprove: false }
  }
}

function writeConfig(config: Partial<AppConfig>): void {
  mkdirSync(CONFIG_DIR, { recursive: true })
  const existing = readConfig()
  writeFileSync(CONFIG_PATH, JSON.stringify({ ...existing, ...config }, null, 2))
}

let petWindow: BrowserWindow | null = null
const initialConfig = readConfig()
let currentTheme: PetTheme = initialConfig.theme
let currentDialogStyle: DialogStyle = initialConfig.dialogStyle
let currentAutoApprove: boolean = initialConfig.autoApprove

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

// Get current window base height (depends on dialog style)
function getBaseHeight(): number {
  return currentDialogStyle === 'bubble' ? BUBBLE_WIN_HEIGHT : DEFAULT_WIN_HEIGHT
}

// Expand window for panel mode (bubble mode is pre-sized, no resize needed)
function expandWindowForPanel(dw: number, dh: number): void {
  if (!petWindow) return
  const [wx, wy] = petWindow.getPosition()
  const rawX = wx - Math.floor((dw - DEFAULT_WIN_WIDTH) / 2)
  const rawY = wy - (dh - getBaseHeight())
  const [newX, newY] = clampToDisplay(wx, wy, rawX, rawY, dw, dh)
  petWindow.setBounds({ x: newX, y: newY, width: dw, height: dh })
}

function restoreWindowForPanel(): void {
  if (!petWindow) return
  const [wx, wy] = petWindow.getPosition()
  const [cw, ch] = petWindow.getSize()
  const baseH = getBaseHeight()
  const rawX = wx + Math.floor((cw - DEFAULT_WIN_WIDTH) / 2)
  const rawY = wy + (ch - baseH)
  const [newX, newY] = clampToDisplay(wx, wy, rawX, rawY, DEFAULT_WIN_WIDTH, baseH)
  petWindow.setBounds({ x: newX, y: newY, width: DEFAULT_WIN_WIDTH, height: baseH })
}

// Resize window when switching between dialog styles
function resizeForDialogStyle(style: DialogStyle): void {
  if (!petWindow) return
  const [wx, wy] = petWindow.getPosition()
  const [cw, ch] = petWindow.getSize()
  const newW = style === 'bubble' ? BUBBLE_WIN_WIDTH : DEFAULT_WIN_WIDTH
  const newH = style === 'bubble' ? BUBBLE_WIN_HEIGHT : DEFAULT_WIN_HEIGHT
  const rawX = wx + Math.floor((cw - newW) / 2)
  const rawY = wy + (ch - newH)
  const [newX, newY] = clampToDisplay(wx, wy, rawX, rawY, newW, newH)
  petWindow.setBounds({ x: newX, y: newY, width: newW, height: newH })
}

// When a permission request arrives
sessionManager.setOnPermissionRequest((info: PermissionRequestInfo) => {
  if (!petWindow) return

  // Auto-approve if enabled — show toast, no resize needed
  if (currentAutoApprove) {
    sessionManager.resolvePermission(info.requestId, 'approve')
    petWindow.webContents.send('auto-approve-toast', info.toolName, info.toolInput)
    return
  }

  if (currentDialogStyle === 'bubble') {
    // Bubble mode: window is pre-sized, just show the dialog
    petWindow.webContents.send('permission-request', info)
  } else {
    // Panel mode: resize then show
    expandWindowForPanel(DIALOG_PANEL_WIDTH, DIALOG_PANEL_HEIGHT)
    petWindow.webContents.send('permission-request', info)
  }
})

// Listen for user's permission decision from renderer
ipcMain.on('permission-response', (_event, requestId: string, decision: PermissionDecision) => {
  sessionManager.resolvePermission(requestId, decision)
  if (currentDialogStyle === 'panel') {
    restoreWindowForPanel()
  }
  // Bubble mode: no resize needed
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
      label: 'Dialog Style',
      submenu: ([['panel', 'Panel'], ['bubble', 'Bubble']] as [DialogStyle, string][]).map(([s, label]) => ({
        label,
        type: 'radio' as const,
        checked: currentDialogStyle === s,
        click: () => {
          currentDialogStyle = s
          writeConfig({ dialogStyle: s })
          resizeForDialogStyle(s)
          petWindow?.webContents.send('dialog-style-change', s)
        }
      }))
    },
    {
      label: 'Auto Approve',
      type: 'checkbox',
      checked: currentAutoApprove,
      click: (menuItem) => {
        currentAutoApprove = menuItem.checked
        writeConfig({ autoApprove: menuItem.checked })
      }
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

  petWindow = createPetWindow(currentDialogStyle)

  petWindow.webContents.on('did-finish-load', () => {
    petWindow?.webContents.send('theme-change', currentTheme)
    petWindow?.webContents.send('dialog-style-change', currentDialogStyle)
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
    petWindow = createPetWindow(currentDialogStyle)
    petWindow.webContents.on('did-finish-load', () => {
      petWindow?.webContents.send('theme-change', currentTheme)
    })
  }
})
