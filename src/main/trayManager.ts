import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'

export function createTray(onQuit: () => void): Tray {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  const tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Claude Detector', enabled: false },
    { type: 'separator' },
    { label: 'Quit', click: onQuit }
  ])

  tray.setToolTip('Claude Detector')
  tray.setContextMenu(contextMenu)

  return tray
}
