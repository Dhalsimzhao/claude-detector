import { useState, useEffect, useRef } from 'react'
import { PetState, SessionUpdate } from '../../../shared/types'

interface AnimationFrame {
  state: PetState
  frameIndex: number
  totalFrames: number
}

const FRAME_COUNTS: Record<PetState, number> = {
  idle: 8,
  running: 8,
  permissionRequest: 4,
  taskCompleted: 6
}

const FPS = 8

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

  // Animation loop
  useEffect(() => {
    const totalFrames = FRAME_COUNTS[petState]
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % totalFrames)
    }, 1000 / FPS)
    return () => clearInterval(interval)
  }, [petState])

  return {
    state: petState,
    frameIndex,
    totalFrames: FRAME_COUNTS[petState],
    sessions
  }
}
