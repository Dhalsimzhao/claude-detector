import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'

function createTrayIcon(): Electron.NativeImage {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath)

  if (process.platform === 'darwin') {
    const resized = icon.resize({ width: 22, height: 22 })
    resized.setTemplateImage(true)
    return resized
  }

  return icon.resize({ width: 16, height: 16 })
}

export function createTray(menu: Menu): Tray {
  const tray = new Tray(createTrayIcon())
  tray.setToolTip('Claude Detector')
  tray.setContextMenu(menu)
  return tray
}
