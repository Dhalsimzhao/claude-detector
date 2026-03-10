import { app, BrowserWindow } from 'electron'
import { createPetWindow } from './windowManager'
import { createTray } from './trayManager'
import { HookServer } from './hookServer'
import { SessionManager } from './sessionManager'
import { installHooks } from './hookInstaller'
import { HookEventPayload } from '../shared/types'

let petWindow: BrowserWindow | null = null

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

  createTray(() => {
    hookServer.stop()
    app.quit()
  })
})

app.on('before-quit', () => {
  hookServer.stop()
})

// Keep app running in tray when window closed
app.on('window-all-closed', () => {
  // Do nothing - app stays alive via tray
})
