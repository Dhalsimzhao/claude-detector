# Psyduck Sprite Sheet Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace 4 separate Pokémon GIFs with a single Psyduck character using PMD sprite sheets, so the same Pokémon shows different animations for different states.

**Architecture:** Download PMD SpriteCollab sprite sheets for Psyduck (PNG format, 8 directions × N frames per sheet). Rewrite `PetSprite.tsx` to render sprite sheets via Canvas, extracting the correct frame from the correct row (direction 0 = facing down). Update animation config with per-state frame sizes, counts, and durations from AnimData.xml.

**Tech Stack:** React, Canvas API, TypeScript, PNG sprite sheets from PMDCollab/SpriteCollab

---

### Task 1: Download Psyduck sprite sheets

**Files:**
- Create: `resources/sprites/psyduck-idle.png`
- Create: `resources/sprites/psyduck-walk.png`
- Create: `resources/sprites/psyduck-hurt.png`
- Create: `resources/sprites/psyduck-hop.png`
- Delete: `resources/sprites/idle.gif`
- Delete: `resources/sprites/running.gif`
- Delete: `resources/sprites/permissionRequest.gif`
- Delete: `resources/sprites/taskCompleted.gif`

**Step 1: Download the 4 sprite sheets from PMDCollab GitHub**

```bash
cd resources/sprites
curl -L -o psyduck-idle.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0054/Idle-Anim.png"
curl -L -o psyduck-walk.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0054/Walk-Anim.png"
curl -L -o psyduck-hurt.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0054/Hurt-Anim.png"
curl -L -o psyduck-hop.png "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/0054/Hop-Anim.png"
```

**Step 2: Delete old GIF files**

```bash
rm idle.gif running.gif permissionRequest.gif taskCompleted.gif
```

**Step 3: Verify files exist and have reasonable sizes**

```bash
ls -la resources/sprites/psyduck-*.png
```

Expected: 4 PNG files, each 5-20KB.

**Step 4: Commit**

```bash
git add resources/sprites/
git commit -m "feat: replace multi-pokemon GIFs with Psyduck PMD sprite sheets"
```

---

### Task 2: Add sprite sheet configuration

**Files:**
- Create: `src/renderer/src/spriteConfig.ts`

This file defines per-state sprite sheet metadata extracted from PMDCollab AnimData.xml.

**Step 1: Create the sprite config file**

```typescript
// Sprite sheet configuration for Psyduck (PMD SpriteCollab #0054)
// Each sprite sheet PNG has 8 rows (directions) × N columns (frames)
// Row 0 = facing down (toward camera), which is what we display

import { PetState } from '../../shared/types'

import psyduckIdle from '../../../resources/sprites/psyduck-idle.png'
import psyduckWalk from '../../../resources/sprites/psyduck-walk.png'
import psyduckHurt from '../../../resources/sprites/psyduck-hurt.png'
import psyduckHop from '../../../resources/sprites/psyduck-hop.png'

export interface SpriteSheetConfig {
  src: string           // imported PNG path
  frameWidth: number    // pixel width of one frame
  frameHeight: number   // pixel height of one frame
  frameCount: number    // number of frames in animation
  durations: number[]   // per-frame duration in game ticks (1 tick ≈ 1/60s)
  directions: number    // number of direction rows (always 8 for PMD)
  directionIndex: number // which row to use (0 = down/facing camera)
}

// State → sprite sheet mapping
// idle: Idle animation — standing still, gentle breathing
// running: Walk animation — active movement
// permissionRequest: Hurt animation — distressed, needs attention
// taskCompleted: Hop animation — happy bouncing celebration
export const SPRITE_CONFIGS: Record<PetState, SpriteSheetConfig> = {
  idle: {
    src: psyduckIdle,
    frameWidth: 24,
    frameHeight: 40,
    frameCount: 4,
    durations: [16, 20, 16, 20],
    directions: 8,
    directionIndex: 0
  },
  running: {
    src: psyduckWalk,
    frameWidth: 24,
    frameHeight: 40,
    frameCount: 4,
    durations: [8, 12, 8, 12],
    directions: 8,
    directionIndex: 0
  },
  permissionRequest: {
    src: psyduckHurt,
    frameWidth: 40,
    frameHeight: 56,
    frameCount: 2,
    durations: [2, 8],
    directions: 8,
    directionIndex: 0
  },
  taskCompleted: {
    src: psyduckHop,
    frameWidth: 32,
    frameHeight: 80,
    frameCount: 10,
    durations: [2, 1, 2, 3, 4, 4, 3, 2, 1, 2],
    directions: 8,
    directionIndex: 0
  }
}
```

**Step 2: Commit**

```bash
git add src/renderer/src/spriteConfig.ts
git commit -m "feat: add Psyduck sprite sheet configuration from PMD AnimData"
```

---

### Task 3: Rewrite PetSprite to render sprite sheets via Canvas

**Files:**
- Modify: `src/renderer/src/components/PetSprite.tsx`

Replace the `<img>` GIF approach with a `<canvas>` that crops and draws the correct frame from the sprite sheet.

**Step 1: Rewrite PetSprite.tsx**

```typescript
import { useEffect, useRef, useState } from 'react'
import { PetState } from '../../../shared/types'
import { SPRITE_CONFIGS, SpriteSheetConfig } from '../spriteConfig'

const DISPLAY_SIZE = 96 // rendered size on screen

interface PetSpriteProps {
  state: PetState
  frameIndex: number
}

export function PetSprite({ state, frameIndex }: PetSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({})

  // Preload all sprite sheet images on mount
  useEffect(() => {
    const loaded: Record<string, HTMLImageElement> = {}
    const entries = Object.entries(SPRITE_CONFIGS)
    let remaining = entries.length

    entries.forEach(([key, config]) => {
      const img = new Image()
      img.onload = () => {
        loaded[key] = img
        remaining--
        if (remaining === 0) setImages({ ...loaded })
      }
      img.src = config.src
    })
  }, [])

  // Draw the current frame
  useEffect(() => {
    const canvas = canvasRef.current
    const img = images[state]
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const config = SPRITE_CONFIGS[state]
    const sx = frameIndex * config.frameWidth
    const sy = config.directionIndex * config.frameHeight

    ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE)
    ctx.imageSmoothingEnabled = false // pixelated look

    // Center the sprite in the canvas
    const scale = Math.min(DISPLAY_SIZE / config.frameWidth, DISPLAY_SIZE / config.frameHeight)
    const dw = config.frameWidth * scale
    const dh = config.frameHeight * scale
    const dx = (DISPLAY_SIZE - dw) / 2
    const dy = DISPLAY_SIZE - dh // align to bottom

    ctx.drawImage(
      img,
      sx, sy, config.frameWidth, config.frameHeight,
      dx, dy, dw, dh
    )
  }, [state, frameIndex, images])

  return (
    <canvas
      ref={canvasRef}
      width={DISPLAY_SIZE}
      height={DISPLAY_SIZE}
      style={{
        width: DISPLAY_SIZE,
        height: DISPLAY_SIZE,
        imageRendering: 'pixelated',
        pointerEvents: 'none'
      }}
    />
  )
}
```

Key design decisions:
- Preload ALL sprite sheets on mount so state transitions are instant
- `imageSmoothingEnabled = false` preserves pixel art crispness
- Sprites are scaled up to fill the 96×96 canvas while maintaining aspect ratio
- Sprites are bottom-aligned so shorter frames (idle 40px) and taller frames (hop 80px) share a consistent ground line

**Step 2: Commit**

```bash
git add src/renderer/src/components/PetSprite.tsx
git commit -m "feat: rewrite PetSprite to render sprite sheets via Canvas"
```

---

### Task 4: Update useAnimationState to use sprite sheet durations

**Files:**
- Modify: `src/renderer/src/hooks/useAnimationState.ts`

The current hook uses a fixed 8 FPS for all states. PMD sprites have variable per-frame durations (in game ticks at ~60fps). Update the animation loop to respect these durations.

**Step 1: Rewrite useAnimationState.ts**

```typescript
import { useState, useEffect, useRef } from 'react'
import { PetState, SessionUpdate } from '../../../shared/types'
import { SPRITE_CONFIGS } from '../spriteConfig'

interface AnimationFrame {
  state: PetState
  frameIndex: number
  totalFrames: number
}

const TICK_MS = 1000 / 60 // PMD runs at ~60 ticks/sec

export function useAnimationState(): AnimationFrame & { sessions: SessionUpdate['sessions'] } {
  const [petState, setPetState] = useState<PetState>('idle')
  const [frameIndex, setFrameIndex] = useState(0)
  const [sessions, setSessions] = useState<SessionUpdate['sessions']>([])
  const prevStateRef = useRef<PetState>('idle')

  // Listen for session updates from main process
  useEffect(() => {
    const unsubscribe = window.api.onSessionUpdate((update) => {
      setSessions(update.sessions)
      setPetState(update.activePetState)
    })
    return unsubscribe
  }, [])

  // Reset frame index when state changes
  useEffect(() => {
    if (petState !== prevStateRef.current) {
      setFrameIndex(0)
      prevStateRef.current = petState
    }
  }, [petState])

  // Animation loop with per-frame variable duration
  useEffect(() => {
    const config = SPRITE_CONFIGS[petState]
    let currentFrame = 0
    let ticksRemaining = config.durations[0]

    const interval = setInterval(() => {
      ticksRemaining--
      if (ticksRemaining <= 0) {
        currentFrame = (currentFrame + 1) % config.frameCount
        ticksRemaining = config.durations[currentFrame]
        setFrameIndex(currentFrame)
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [petState])

  return {
    state: petState,
    frameIndex,
    totalFrames: SPRITE_CONFIGS[petState].frameCount,
    sessions
  }
}
```

Key changes:
- Removed hardcoded `FRAME_COUNTS` and `FPS` — now driven by `SPRITE_CONFIGS`
- Animation loop runs at 60 ticks/sec and counts down per-frame durations
- Each frame stays visible for its specified duration (e.g., idle frame 0 stays for 16 ticks ≈ 267ms)

**Step 2: Commit**

```bash
git add src/renderer/src/hooks/useAnimationState.ts
git commit -m "feat: use variable per-frame durations from sprite config"
```

---

### Task 5: Pass frameIndex to PetSprite from App

**Files:**
- Modify: `src/renderer/src/App.tsx`

Currently `PetSprite` doesn't receive `frameIndex`. Update the prop passing.

**Step 1: Update App.tsx PetSprite usage**

Change line 43 from:
```tsx
: <PetSprite state={state} />
```
to:
```tsx
: <PetSprite state={state} frameIndex={frameIndex} />
```

**Step 2: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat: pass frameIndex to PetSprite for sprite sheet animation"
```

---

### Task 6: Update Vite config for PNG imports

**Files:**
- Modify: `electron.vite.config.ts` (if needed)

Vite handles PNG imports as asset URLs by default, so this should work out of the box. However, verify by checking if there's a `*.gif` type declaration that needs extending.

**Step 1: Check for asset type declarations**

Look for any `*.gif` declaration in `src/renderer/src/env.d.ts` or similar. If PNG is not declared, add it.

**Step 2: Run dev server and verify**

```bash
pnpm dev
```

Expected: App starts, Psyduck sprite sheet renders correctly in all 4 states.

**Step 3: Commit if any config changes were needed**

---

### Task 7: Visual verification and cleanup

**Step 1: Test all 4 states manually**

Trigger each state by interacting with Claude Code or by temporarily hardcoding states:
- `idle` → Psyduck standing, gentle breathing motion
- `running` → Psyduck walking animation
- `permissionRequest` → Psyduck hurt/distressed animation
- `taskCompleted` → Psyduck hopping happily

**Step 2: Verify the Blocks theme still works**

Switch to Blocks theme via right-click menu → Theme → Blocks. It should be unaffected.

**Step 3: Verify build works**

```bash
pnpm build
```

**Step 4: Final commit if any adjustments**

---

## Summary of state → animation mapping

| App State | PMD Animation | Frames | Frame Size | Vibe |
|-----------|--------------|--------|------------|------|
| idle | Idle | 4 | 24×40 | Standing, gentle breathing |
| running | Walk | 4 | 24×40 | Active walking |
| permissionRequest | Hurt | 2 | 40×56 | Distressed, needs attention |
| taskCompleted | Hop | 10 | 32×80 | Happy bouncing |
