import { SIZE, type Game, type Point } from './snake'

/** Canvas pixels per side; CSS scales it to fit. 40px cells stay crisp on most screens. */
export const CANVAS_PX = 800

/** Paints the board with the colours the canvas inherits from CSS custom properties. */
export function draw(canvas: HTMLCanvasElement, { snake, food, dir }: Game) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const css = getComputedStyle(canvas)
  const color = (name: string) => css.getPropertyValue(name).trim()
  const cell = canvas.width / SIZE

  ctx.fillStyle = color('--board')
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = color('--board-alt')
  for (let y = 0; y < SIZE; y++) {
    for (let x = (y % 2) + 0; x < SIZE; x += 2) ctx.fillRect(x * cell, y * cell, cell, cell)
  }

  ctx.fillStyle = color('--food')
  ctx.beginPath()
  ctx.arc((food.x + 0.5) * cell, (food.y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2)
  ctx.fill()

  const segment = ({ x, y }: Point, inset: number, radius: number) => {
    ctx.beginPath()
    ctx.roundRect(x * cell + inset, y * cell + inset, cell - inset * 2, cell - inset * 2, radius)
    ctx.fill()
  }
  ctx.fillStyle = color('--snake')
  for (let i = snake.length - 1; i > 0; i--) segment(snake[i], cell * 0.08, cell * 0.25)
  ctx.fillStyle = color('--snake-head')
  segment(snake[0], cell * 0.03, cell * 0.32)

  // Two eyes, set towards the direction of travel.
  const { x, y } = snake[0]
  const [ax, ay] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir]
  ctx.fillStyle = color('--board')
  for (const side of [-1, 1]) {
    const ex = (x + 0.5 + ax * 0.18 + ay * side * 0.2) * cell
    const ey = (y + 0.5 + ay * 0.18 + ax * side * 0.2) * cell
    ctx.beginPath()
    ctx.arc(ex, ey, cell * 0.09, 0, Math.PI * 2)
    ctx.fill()
  }
}
