import { Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { PetTheme } from '../shared/types'

export function createTray(
  onQuit: () => void,
  initialTheme: PetTheme,
  onThemeChange: (theme: PetTheme) => void
): Tray {
  const iconPath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  const tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Claude Detector', enabled: false },
    { type: 'separator' },
    {
      label: 'Theme',
      submenu: [
        {
          label: 'Blocks',
          type: 'radio',
          checked: initialTheme === 'blocks',
          click: () => onThemeChange('blocks')
        },
        {
          label: 'Pokemon',
          type: 'radio',
          checked: initialTheme === 'pokemon',
          click: () => onThemeChange('pokemon')
        }
      ]
    },
    { type: 'separator' },
    { label: 'Quit', click: onQuit }
  ])

  tray.setToolTip('Claude Detector')
  tray.setContextMenu(contextMenu)

  return tray
}
