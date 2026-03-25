import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { PetTheme } from '../shared/types'

function createTrayIcon(): Electron.NativeImage {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  if (process.platform === 'darwin') {
    // macOS: resize to 22x22 (menubar standard) and mark as template
    // Template images are auto-colored by macOS for light/dark mode
    const resized = icon.resize({ width: 22, height: 22 })
    resized.setTemplateImage(true)
    return resized
  }

  // Windows: 16x16 for system tray
  return icon.resize({ width: 16, height: 16 })
}

export function createTray(
  onQuit: () => void,
  initialTheme: PetTheme,
  onThemeChange: (theme: PetTheme) => void
): Tray {
  const tray = new Tray(createTrayIcon())

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Claude Detector', enabled: false },
    { type: 'separator' },
    {
      label: 'Theme',
      submenu: (['blocks', 'psyduck', 'sherma', 'flea'] as PetTheme[]).map((t) => ({
        label: { blocks: 'Blocks', psyduck: 'Psyduck', sherma: 'Sherma', flea: 'Flea' }[t],
        type: 'radio' as const,
        checked: initialTheme === t,
        click: () => onThemeChange(t)
      }))
    },
    { type: 'separator' },
    { label: 'Quit', click: onQuit }
  ])

  tray.setToolTip('Claude Detector')
  tray.setContextMenu(contextMenu)

  return tray
}
