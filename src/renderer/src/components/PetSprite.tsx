import { PetState } from '../../../shared/types'

import idleGif from '../../../../resources/sprites/idle.gif'
import runningGif from '../../../../resources/sprites/running.gif'
import permissionRequestGif from '../../../../resources/sprites/permissionRequest.gif'
import taskCompletedGif from '../../../../resources/sprites/taskCompleted.gif'

const STATE_SPRITES: Record<PetState, string> = {
  idle: idleGif,
  running: runningGif,
  permissionRequest: permissionRequestGif,
  taskCompleted: taskCompletedGif
}

const SIZE = 96

interface PetSpriteProps {
  state: PetState
}

export function PetSprite({ state }: PetSpriteProps) {
  return (
    <img
      src={STATE_SPRITES[state]}
      alt={state}
      width={SIZE}
      height={SIZE}
      style={{
        imageRendering: 'pixelated',
        pointerEvents: 'none'
      }}
    />
  )
}
