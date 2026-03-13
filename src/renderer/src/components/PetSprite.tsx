import { useEffect, useRef, useState } from 'react'
import { SPRITE_CONFIGS, SpriteState } from '../spriteConfig'

const DISPLAY_SIZE = 96

interface PetSpriteProps {
  state: SpriteState
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
      img.onerror = () => {
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

    ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE)
    ctx.imageSmoothingEnabled = false

    const scale = Math.min(DISPLAY_SIZE / config.frameWidth, DISPLAY_SIZE / config.frameHeight)
    const dw = config.frameWidth * scale
    const dh = config.frameHeight * scale
    const dx = (DISPLAY_SIZE - dw) / 2
    const dy = DISPLAY_SIZE - dh // align to bottom

    ctx.drawImage(
      img,
      sx, 0, config.frameWidth, config.frameHeight,
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
