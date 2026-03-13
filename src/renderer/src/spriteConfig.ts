// Sprite sheet configuration
// Standard format: single-row PNG sprite sheet (1 row × N frames, left to right)
// All source sprites must be pre-processed to this format before use.

import { PetState } from '../../shared/types'

import psyduckIdle from '../../../resources/sprites/psyduck-idle.png'
import psyduckWalk from '../../../resources/sprites/psyduck-walk.png'
import psyduckHurt from '../../../resources/sprites/psyduck-hurt.png'
import psyduckHop from '../../../resources/sprites/psyduck-hop.png'
import psyduckSwing from '../../../resources/sprites/psyduck-swing.png'

export interface SpriteSheetConfig {
  src: string
  frameWidth: number
  frameHeight: number
  frameCount: number
  durations: number[]   // per-frame duration in ticks (1 tick ≈ 1/60s)
}

// SpriteState extends PetState with UI-only states like dragging
export type SpriteState = PetState | 'dragging'

export const SPRITE_CONFIGS: Record<SpriteState, SpriteSheetConfig> = {
  idle: {
    src: psyduckIdle,
    frameWidth: 24,
    frameHeight: 40,
    frameCount: 4,
    durations: [16, 20, 16, 20]
  },
  running: {
    src: psyduckWalk,
    frameWidth: 24,
    frameHeight: 40,
    frameCount: 4,
    durations: [8, 12, 8, 12]
  },
  permissionRequest: {
    src: psyduckHurt,
    frameWidth: 40,
    frameHeight: 56,
    frameCount: 2,
    durations: [2, 8]
  },
  taskCompleted: {
    src: psyduckHop,
    frameWidth: 32,
    frameHeight: 80,
    frameCount: 10,
    durations: [2, 1, 2, 3, 4, 4, 3, 2, 1, 2]
  },
  dragging: {
    src: psyduckSwing,
    frameWidth: 72,
    frameHeight: 80,
    frameCount: 9,
    durations: [2, 1, 2, 2, 3, 2, 2, 1, 1]
  }
}
