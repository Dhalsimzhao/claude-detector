// Sprite sheet configuration
// Standard format: single-row PNG sprite sheet (1 row × N frames, left to right)
// For static sprites (1 frame), a breathing/float animation is applied automatically.

import { PetState, PetTheme } from '../../shared/types'

// Psyduck (PMD SpriteCollab #0054)
import psyduckIdle from '../../../resources/sprites/psyduck/psyduck-idle.png'
import psyduckWalk from '../../../resources/sprites/psyduck/psyduck-walk.png'
import psyduckHurt from '../../../resources/sprites/psyduck/psyduck-hurt.png'
import psyduckHop from '../../../resources/sprites/psyduck/psyduck-hop.png'
import psyduckSwing from '../../../resources/sprites/psyduck/psyduck-swing.png'

// Sherma (Hollow Knight: Silksong)
import shermaIdle from '../../../resources/sprites/sherma/sherma-idle.png'
import shermaRunning from '../../../resources/sprites/sherma/sherma-running.png'
import shermaPermission from '../../../resources/sprites/sherma/sherma-permissionRequest.png'
import shermaCompleted from '../../../resources/sprites/sherma/sherma-taskCompleted.png'
import shermaDragging from '../../../resources/sprites/sherma/sherma-dragging.png'

// Flea (Hollow Knight: Silksong)
import fleaIdle from '../../../resources/sprites/flea/flea-idle.png'
import fleaRunning from '../../../resources/sprites/flea/flea-running.png'
import fleaPermission from '../../../resources/sprites/flea/flea-permissionRequest.png'
import fleaCompleted from '../../../resources/sprites/flea/flea-taskCompleted.png'
import fleaDragging from '../../../resources/sprites/flea/flea-dragging.png'

export interface SpriteSheetConfig {
  src: string
  frameWidth: number
  frameHeight: number
  frameCount: number
  durations: number[]   // per-frame duration in ticks (1 tick ≈ 1/60s)
}

// SpriteState extends PetState with UI-only states like dragging
export type SpriteState = PetState | 'dragging'

// Sprite themes (excludes 'blocks' which uses canvas drawing)
export type SpriteTheme = Exclude<PetTheme, 'blocks'>

export const THEME_SPRITES: Record<SpriteTheme, Record<SpriteState, SpriteSheetConfig>> = {
  psyduck: {
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
  },
  sherma: {
    idle: {
      src: shermaIdle,
      frameWidth: 164,
      frameHeight: 139,
      frameCount: 1,
      durations: [60]
    },
    running: {
      src: shermaRunning,
      frameWidth: 153,
      frameHeight: 158,
      frameCount: 1,
      durations: [60]
    },
    permissionRequest: {
      src: shermaPermission,
      frameWidth: 155,
      frameHeight: 153,
      frameCount: 1,
      durations: [60]
    },
    taskCompleted: {
      src: shermaCompleted,
      frameWidth: 167,
      frameHeight: 156,
      frameCount: 1,
      durations: [60]
    },
    dragging: {
      src: shermaDragging,
      frameWidth: 158,
      frameHeight: 157,
      frameCount: 1,
      durations: [60]
    }
  },
  flea: {
    idle: {
      src: fleaIdle,
      frameWidth: 145,
      frameHeight: 77,
      frameCount: 1,
      durations: [60]
    },
    running: {
      src: fleaRunning,
      frameWidth: 119,
      frameHeight: 173,
      frameCount: 1,
      durations: [60]
    },
    permissionRequest: {
      src: fleaPermission,
      frameWidth: 129,
      frameHeight: 187,
      frameCount: 1,
      durations: [60]
    },
    taskCompleted: {
      src: fleaCompleted,
      frameWidth: 126,
      frameHeight: 155,
      frameCount: 1,
      durations: [60]
    },
    dragging: {
      src: fleaDragging,
      frameWidth: 129,
      frameHeight: 187,
      frameCount: 1,
      durations: [60]
    }
  }
}
