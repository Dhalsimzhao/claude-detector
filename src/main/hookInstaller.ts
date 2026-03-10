import fs from 'fs'
import path from 'path'

const HOOK_IDENTIFIER = 'claude-detector-hook'
const HOOK_EVENTS = ['SessionStart', 'SessionEnd', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']

function getSettingsPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '.claude', 'settings.json')
}

function getHookScriptPath(): string {
  // Use the bundled hook script path
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '.claude-detector', 'hook.js').replace(/\\/g, '/')
}

function readSettings(): Record<string, unknown> {
  const settingsPath = getSettingsPath()
  if (!fs.existsSync(settingsPath)) return {}
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
  } catch {
    console.warn('[claude-detector] Failed to parse settings.json, skipping hook installation')
    return {}
  }
}

function writeSettings(settings: Record<string, unknown>): void {
  const settingsPath = getSettingsPath()
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
}

export function installHooks(): void {
  const settings = readSettings()
  if (!settings.hooks) settings.hooks = {}
  const hooks = settings.hooks as Record<string, unknown[]>

  const hookCommand = `node "${getHookScriptPath()}"`

  for (const event of HOOK_EVENTS) {
    if (!hooks[event]) hooks[event] = []
    const entries = hooks[event] as Array<{ matcher: string; hooks: Array<{ type: string; command: string; timeout: number }> }>

    // Check if already installed
    const alreadyInstalled = entries.some(entry =>
      entry.hooks?.some(h => h.command.includes(HOOK_IDENTIFIER))
    )
    if (alreadyInstalled) continue

    entries.push({
      matcher: '',
      hooks: [{
        type: 'command',
        command: hookCommand,
        timeout: 5
      }]
    })
  }

  writeSettings(settings)

  // Copy hook script to ~/.claude-detector/
  const home = process.env.HOME || process.env.USERPROFILE || ''
  const destDir = path.join(home, '.claude-detector')
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

  // In dev: __dirname is src/main/, in production: out/main/
  // Try multiple paths to find the hook script
  const candidates = [
    path.join(__dirname, '../../scripts/claude-detector-hook.js'),
    path.join(__dirname, '../../resources/claude-detector-hook.js'),
    path.join(process.resourcesPath || '', 'claude-detector-hook.js')
  ]
  const srcScript = candidates.find(p => fs.existsSync(p)) || candidates[0]
  const destScript = path.join(destDir, 'hook.js')
  fs.copyFileSync(srcScript, destScript)
}

export function uninstallHooks(): void {
  const settings = readSettings()
  if (!settings.hooks) return
  const hooks = settings.hooks as Record<string, unknown[]>

  for (const event of HOOK_EVENTS) {
    if (!hooks[event]) continue
    hooks[event] = (hooks[event] as Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>)
      .filter(entry => !entry.hooks?.some(h => h.command.includes(HOOK_IDENTIFIER)))
  }

  writeSettings(settings)
}
