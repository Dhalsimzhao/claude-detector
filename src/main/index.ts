import { app, BrowserWindow, Menu } from 'electron'
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

function readConfig(): { theme: PetTheme } {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return { theme: 'pokemon' }
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

  petWindow.webContents.on('context-menu', () => {
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
    menu.popup({ window: petWindow ?? undefined })
  })
})

app.on('before-quit', () => {
  hookServer.stop()
})

// Keep app running in tray when window closed
app.on('window-all-closed', () => {
  // Do nothing - app stays alive via tray
})
