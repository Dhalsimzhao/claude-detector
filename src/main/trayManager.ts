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
