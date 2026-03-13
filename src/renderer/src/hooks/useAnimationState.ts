import { useState, useEffect } from 'react'
import { PetState, SessionUpdate } from '../../../shared/types'
import { SPRITE_CONFIGS, SpriteState } from '../spriteConfig'

interface AnimationState {
  spriteState: SpriteState
  frameIndex: number
  sessions: SessionUpdate['sessions']
}

const TICK_MS = 1000 / 60

export function useAnimationState(): AnimationState {
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

  // Reset frame and run animation loop
  useEffect(() => {
    setFrameIndex(0)

    const config = SPRITE_CONFIGS[spriteState]
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
  }, [spriteState])

  return {
    spriteState,
    frameIndex,
    sessions
  }
}
