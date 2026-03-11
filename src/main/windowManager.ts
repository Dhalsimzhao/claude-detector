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
