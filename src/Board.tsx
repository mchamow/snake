import { useEffect, useRef, type ReactNode } from 'react'
import { CANVAS_PX, draw } from './draw'
import { describe, type Dir, type Game } from './snake'

const SWIPE_PX = 24

/** The canvas, with `overlay` laid over it (start, pause and game-over screens). */
export function Board({ game, onTurn, overlay }: { game: Game; onTurn: (dir: Dir) => void; overlay?: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (canvas.current) draw(canvas.current, game)
  }, [game])

  // The palette comes from CSS, so repaint when the theme class on <html> flips.
  useEffect(() => {
    const observer = new MutationObserver(() => canvas.current && draw(canvas.current, game))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [game])

  return (
    <div
      className="relative touch-none overflow-hidden rounded-xl border bg-card shadow-sm select-none"
      onPointerDown={(e) => (swipeStart.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const start = swipeStart.current
        swipeStart.current = null
        if (!start) return
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return
        onTurn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
      }}
    >
      <canvas
        ref={canvas}
        width={CANVAS_PX}
        height={CANVAS_PX}
        role="img"
        aria-label={describe(game)}
        className="block aspect-square w-full [--board-alt:var(--muted)] [--board:var(--card)] [--food:oklch(63.7%_0.237_25.331)] [--snake-head:oklch(50.8%_0.118_165.612)] [--snake:oklch(59.6%_0.145_163.225)] dark:[--board-alt:oklch(1_0_0/4%)] dark:[--food:oklch(70.4%_0.191_22.216)] dark:[--snake-head:oklch(84.5%_0.143_164.978)] dark:[--snake:oklch(69.6%_0.17_162.48)]"
      />
      {overlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/75 p-4 text-center backdrop-blur-[2px]">
          {overlay}
        </div>
      )}
    </div>
  )
}
