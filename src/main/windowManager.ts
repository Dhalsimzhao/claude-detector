import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { DialogStyle } from '../shared/types'

export const PET_SIZE = 128
export const WINDOW_PADDING = 40

// Bubble mode pre-allocates a larger window so no resize is needed on dialog show
export const BUBBLE_WIN_WIDTH = 320
export const BUBBLE_WIN_HEIGHT = 420

export function createPetWindow(dialogStyle: DialogStyle): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const defaultW = PET_SIZE + WINDOW_PADDING * 2
  const defaultH = PET_SIZE + WINDOW_PADDING * 2 + 30
  const isBubble = dialogStyle === 'bubble'
  const winW = isBubble ? BUBBLE_WIN_WIDTH : defaultW
  const winH = isBubble ? BUBBLE_WIN_HEIGHT : defaultH

  const win = new BrowserWindow({
    width: winW,
    height: winH,
    x: screenWidth - winW - 20,
    y: screenHeight - winH - 50,
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

  // Default: let clicks pass through transparent areas.
  // { forward: true } ensures mousemove events are still delivered so the
  // renderer can detect when the cursor enters a visible region.
  win.setIgnoreMouseEvents(true, { forward: true })

  // Use 'screen-saver' level so the pet floats above macOS fullscreen apps
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
