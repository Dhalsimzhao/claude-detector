import { useState, useEffect } from 'react'
import { PetState, SessionUpdate } from '../../../shared/types'
import { THEME_SPRITES, SpriteState, SpriteTheme } from '../spriteConfig'

interface AnimationState {
  spriteState: SpriteState
  frameIndex: number
  sessions: SessionUpdate['sessions']
}

const TICK_MS = 1000 / 60

export function useAnimationState(theme: SpriteTheme): AnimationState {
  const [petState, setPetState] = useState<PetState>('idle')
  const [dragging, setDragging] = useState(false)
  const [frameIndex, setFrameIndex] = useState(0)
  const [sessions, setSessions] = useState<SessionUpdate['sessions']>([])

  const spriteState: SpriteState = dragging ? 'dragging' : petState

  useEffect(() => {
    const unsubscribe = window.api.onSessionUpdate((update) => {
      setSessions(update.sessions)
      setPetState(update.activePetState)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onDragChange(setDragging)
    return unsubscribe
  }, [])

  // Animation loop for multi-frame sprites
  useEffect(() => {
    setFrameIndex(0)

    const config = THEME_SPRITES[theme][spriteState]
    if (config.frameCount <= 1) return // static sprites don't need frame animation

    let currentFrame = 0
    let ticksRemaining = config.durations[0]
    let lastTime = performance.now()

    let rafId: number
    const tick = (now: number) => {
      const elapsed = now - lastTime
      lastTime = now

      let ticksToProcess = Math.round(elapsed / TICK_MS)
      while (ticksToProcess > 0) {
        ticksRemaining--
        ticksToProcess--
        if (ticksRemaining <= 0) {
          currentFrame = (currentFrame + 1) % config.frameCount
          ticksRemaining = config.durations[currentFrame]
          setFrameIndex(currentFrame)
        }
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [theme, spriteState])

  return {
    spriteState,
    frameIndex,
    sessions
  }
}
