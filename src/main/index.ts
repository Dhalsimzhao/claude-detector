import { app, BrowserWindow, Menu, screen } from 'electron'
import { createPetWindow } from './windowManager'
import { createTray } from './trayManager'
import { HookServer } from './hookServer'
import { SessionManager } from './sessionManager'
import { installHooks } from './hookInstaller'
import { HookEventPayload, PetTheme } from '../shared/types'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CONFIG_DIR = join(homedir(), '.claude-detector')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const VALID_THEMES: PetTheme[] = ['blocks', 'psyduck', 'sherma', 'flea']

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

// Handle timer-based state changes (e.g. needsAttention)
sessionManager.setOnChange((update) => {
  petWindow?.webContents.send('session-update', update)
})

const hookServer = new HookServer((event: HookEventPayload) => {
  const update = sessionManager.handleEvent(event)
  petWindow?.webContents.send('session-update', update)
})

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

  petWindow.on('system-context-menu', (event) => {
    event.preventDefault()
    const [wx, wy] = petWindow!.getPosition()
    const cursor = screen.getCursorScreenPoint()
    buildContextMenu().popup({ window: petWindow ?? undefined, x: cursor.x - wx, y: cursor.y - wy })
  })
})

app.on('before-quit', () => {
  hookServer.stop()
})

// Keep app running in tray when window closed
app.on('window-all-closed', () => {
  // Do nothing - app stays alive via tray
})
