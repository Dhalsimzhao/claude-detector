import { app, BrowserWindow } from 'electron'
import { createPetWindow } from './windowManager'
import { createTray } from './trayManager'
import { HookServer } from './hookServer'
import { SessionManager } from './sessionManager'
import { installHooks } from './hookInstaller'
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
app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})
