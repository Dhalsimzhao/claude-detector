import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

export const PET_SIZE = 128
export const WINDOW_PADDING = 40

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
    focusable: true,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.setIgnoreMouseEvents(false)

  // Detect window dragging via will-move events
  let dragTimeout: ReturnType<typeof setTimeout> | null = null
  let isDragging = false

  win.on('will-move', () => {
    if (!isDragging) {
      isDragging = true
      win.webContents.send('drag-change', true)
    }
    if (dragTimeout) clearTimeout(dragTimeout)
    dragTimeout = setTimeout(() => {
      isDragging = false
      win.webContents.send('drag-change', false)
    }, 200)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
