#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Read port from config file
const os = require('os')
const portFile = path.join(os.homedir(), '.claude-detector', 'port')

let port
try {
  port = parseInt(fs.readFileSync(portFile, 'utf-8').trim(), 10)
} catch {
  // App not running, exit silently
  process.exit(0)
}

// Read stdin
let input = ''
process.stdin.setEncoding('utf-8')
process.stdin.on('data', (chunk) => { input += chunk })
process.stdin.on('end', () => {
  if (!input.trim()) process.exit(0)

  let payload
  try {
    payload = JSON.parse(input.trim())
  } catch {
    process.exit(0)
  }

  const hookEvent = payload.hook_event_name

  if (hookEvent === 'PreToolUse') {
    // Long-polling: wait for user decision
    const requestId = crypto.randomUUID()
    const postData = JSON.stringify({
      requestId,
      sessionId: payload.session_id,
      cwd: payload.cwd || '',
      toolName: payload.tool_name || '',
      toolInput: payload.tool_input || {},
      timestamp: Date.now()
    })

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/permission-request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 115000
    }, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (result.decision === 'approve' || result.decision === 'deny') {
            process.stdout.write(JSON.stringify({ decision: result.decision }))
          }
        } catch {
          // No decision, let Claude Code handle normally
        }
        process.exit(0)
      })
    })

    req.on('error', () => {
      // App not running or not responding, exit silently (Claude Code falls back to terminal)
      process.exit(0)
    })

    req.on('timeout', () => {
      req.destroy()
      process.exit(0)
    })

    req.write(postData)
    req.end()
  } else {
    // Fire-and-forget for all other events
    const postData = input.trim()

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 3000
    }, () => {
      process.exit(0)
    })

    req.on('error', () => {
      // App not running or not responding, exit silently
      process.exit(0)
    })

    req.write(postData)
    req.end()
  }
})
