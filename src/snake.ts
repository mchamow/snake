/** Cells per side of the square board. */
export const SIZE = 20

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Point = { x: number; y: number }
export type Status = 'ready' | 'running' | 'paused' | 'over' | 'won'

export const SPEEDS = ['slow', 'normal', 'fast'] as const
export type Speed = (typeof SPEEDS)[number]
/** Milliseconds between moves. */
export const TICK_MS: Record<Speed, number> = { slow: 280, normal: 200, fast: 140 }

export interface Settings {
  speed: Speed
  /** Leaving the board comes back on the other side instead of ending the game. */
  wrap: boolean
}

export interface Game {
  /** Head first. */
  snake: Point[]
  dir: Dir
  /** Turns pressed since the last move, applied one per move so quick double turns aren't lost. */
  queue: Dir[]
  food: Point
  score: number
  status: Status
}

const STEP: Record<Dir, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const MAX_QUEUE = 2

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y

/** A free cell picked by `random` (0 ≤ random < 1), or null when the snake fills the board. */
export function placeFood(snake: Point[], random: number): Point | null {
  const taken = new Set(snake.map(({ x, y }) => y * SIZE + x))
  const free: number[] = []
  for (let cell = 0; cell < SIZE * SIZE; cell++) if (!taken.has(cell)) free.push(cell)
  if (!free.length) return null
  const cell = free[Math.min(free.length - 1, Math.floor(random * free.length))]
  return { x: cell % SIZE, y: Math.floor(cell / SIZE) }
}

/** A three-long snake in the middle of the left half, heading right. */
export function newGame(random: number): Game {
  const y = SIZE / 2
  const snake = [{ x: 7, y }, { x: 6, y }, { x: 5, y }]
  return { snake, dir: 'right', queue: [], food: placeFood(snake, random)!, score: 0, status: 'ready' }
}

/** Queues a turn; a ready game starts moving. Reversing into yourself is ignored. */
export function turn(game: Game, dir: Dir): Game {
  if (game.status !== 'ready' && game.status !== 'running') return game
  const last = game.queue.at(-1) ?? game.dir
  const valid = dir !== last && dir !== OPPOSITE[last] && game.queue.length < MAX_QUEUE
  if (!valid && game.status === 'running') return game
  return { ...game, status: 'running', queue: valid ? [...game.queue, dir] : game.queue }
}

/** Moves one cell. `random` picks where new food appears. */
export function step(game: Game, wrap: boolean, random: number): Game {
  if (game.status !== 'running') return game
  const [dir = game.dir, ...queue] = game.queue
  const head = game.snake[0]
  let next = { x: head.x + STEP[dir].x, y: head.y + STEP[dir].y }
  if (wrap) next = { x: (next.x + SIZE) % SIZE, y: (next.y + SIZE) % SIZE }
  else if (next.x < 0 || next.y < 0 || next.x >= SIZE || next.y >= SIZE) return { ...game, dir, queue, status: 'over' }

  const eats = same(next, game.food)
  // The tail moves out of the way this turn unless the snake is growing.
  const body = eats ? game.snake : game.snake.slice(0, -1)
  if (body.some((part) => same(part, next))) return { ...game, dir, queue, status: 'over' }

  const snake = [next, ...body]
  if (!eats) return { ...game, snake, dir, queue }
  const food = placeFood(snake, random)
  return { snake, dir, queue, score: game.score + 1, food: food ?? next, status: food ? 'running' : 'won' }
}

const PAUSE_TOGGLE: Partial<Record<Status, Status>> = { ready: 'running', running: 'paused', paused: 'running' }

/** Space: start a ready game, pause a running one, resume a paused one. */
export function togglePause(game: Game): Game {
  const status = PAUSE_TOGGLE[game.status]
  return status ? { ...game, status } : game
}

/** Screen-reader summary of the board, 1-based like a spreadsheet. */
export function describe({ snake, food }: Game): string {
  const at = ({ x, y }: Point) => `column ${x + 1}, row ${y + 1}`
  return `Snake board, ${SIZE} by ${SIZE}. Head at ${at(snake[0])}, length ${snake.length}. Food at ${at(food)}.`
}
