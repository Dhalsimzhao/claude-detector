#!/usr/bin/env node

const http = require('http')
const fs = require('fs')
const path = require('path')

// Read port from config file
const portFile = path.join(process.env.HOME || process.env.USERPROFILE, '.claude-detector', 'port')

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
})
