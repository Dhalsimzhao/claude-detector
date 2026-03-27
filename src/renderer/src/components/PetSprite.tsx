import { useEffect, useRef, useState } from 'react'
import { THEME_SPRITES, SpriteState, SpriteTheme } from '../spriteConfig'

const DISPLAY_SIZE = 96

interface PetSpriteProps {
  theme: SpriteTheme
  state: SpriteState
  frameIndex: number
}

export function PetSprite({ theme, state, frameIndex }: PetSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({})
  const timeRef = useRef(0)
  const rafRef = useRef<number>(0)

  // Preload all sprite sheet images for current theme
  useEffect(() => {
    const configs = THEME_SPRITES[theme]
    const loaded: Record<string, HTMLImageElement> = {}
    const entries = Object.entries(configs)
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
  }, [theme])

  // Draw the current frame + living animation for static sprites
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!ctxRef.current) ctxRef.current = canvas.getContext('2d')
    const ctx = ctxRef.current
    if (!ctx) return

    const config = THEME_SPRITES[theme][state]
    const isStatic = config.frameCount === 1

    const draw = () => {
      const img = images[state]
      if (!img) return

      ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE)

      const sx = frameIndex * config.frameWidth
      const baseScale = Math.min(DISPLAY_SIZE / config.frameWidth, DISPLAY_SIZE / config.frameHeight)

      if (isStatic) {
        timeRef.current += 0.025

        const t = timeRef.current
        // Breathing: slow vertical float
        const floatY = Math.sin(t * 1.2) * 3
        // Sway: gentle horizontal oscillation (slower, offset phase)
        const swayX = Math.sin(t * 0.8) * 1.5
        // Scale pulse: subtle breathing expand/contract
        const scalePulse = 1 + Math.sin(t * 1.2) * 0.015
        // Tilt: very slight rotation synced with sway
        const tilt = Math.sin(t * 0.8) * 0.02

        const scale = baseScale * scalePulse
        const dw = config.frameWidth * scale
        const dh = config.frameHeight * scale
        const cx = DISPLAY_SIZE / 2 + swayX
        const dy = DISPLAY_SIZE - dh + floatY

        // Shadow (ellipse at bottom, shrinks when sprite floats up)
        const shadowScale = 1 - Math.sin(t * 1.2) * 0.15
        const shadowAlpha = 0.15 + Math.sin(t * 1.2) * 0.05
        ctx.save()
        ctx.globalAlpha = shadowAlpha
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.ellipse(
          DISPLAY_SIZE / 2, DISPLAY_SIZE - 2,
          dw * 0.3 * shadowScale, 3 * shadowScale,
          0, 0, Math.PI * 2
        )
        ctx.fill()
        ctx.restore()

        // Draw sprite with tilt
        ctx.save()
        ctx.imageSmoothingEnabled = false
        ctx.translate(cx, dy + dh)
        ctx.rotate(tilt)
        ctx.drawImage(
          img,
          sx, 0, config.frameWidth, config.frameHeight,
          -dw / 2, -dh, dw, dh
        )
        ctx.restore()

        rafRef.current = requestAnimationFrame(draw)
      } else {
        // Multi-frame sprites: no extra animation, just draw
        ctx.imageSmoothingEnabled = false
        const dw = config.frameWidth * baseScale
        const dh = config.frameHeight * baseScale
        const dx = (DISPLAY_SIZE - dw) / 2
        const dy = DISPLAY_SIZE - dh

        ctx.drawImage(
          img,
          sx, 0, config.frameWidth, config.frameHeight,
          dx, dy, dw, dh
        )
      }
    }

    draw()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [theme, state, frameIndex, images])

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
