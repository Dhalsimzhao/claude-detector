import { useRef, useEffect } from 'react'
import { SpriteState } from '../spriteConfig'
import { STATE_COLORS } from '../utils'

interface PetCanvasProps {
  state: SpriteState
  frameIndex: number
}

const SIZE = 128

export function PetCanvas({ state, frameIndex }: PetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, SIZE, SIZE)

    // Background color block
    ctx.fillStyle = STATE_COLORS[state]
    const bounce = Math.sin(frameIndex * 0.8) * 4
    const x = 16
    const y = 16 + bounce
    const w = SIZE - 32
    const h = SIZE - 32

    // Rounded rect body
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 12)
    ctx.fill()

    // Eyes
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x + w * 0.35, y + h * 0.35, 8, 0, Math.PI * 2)
    ctx.arc(x + w * 0.65, y + h * 0.35, 8, 0, Math.PI * 2)
    ctx.fill()

    // Pupils
    ctx.fillStyle = '#333333'
    ctx.beginPath()
    ctx.arc(x + w * 0.35, y + h * 0.35, 4, 0, Math.PI * 2)
    ctx.arc(x + w * 0.65, y + h * 0.35, 4, 0, Math.PI * 2)
    ctx.fill()

    // State label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(state === 'taskCompleted' ? 'Done!' : state, SIZE / 2, y + h * 0.75)
  }, [state, frameIndex])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE }}
    />
  )
}
