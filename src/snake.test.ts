import { describe as group, expect, it } from 'vitest'
import { describe, newGame, placeFood, SIZE, step, togglePause, turn, type Game, type Point } from './snake'

const running = (game: Partial<Game> = {}): Game => ({ ...newGame(0), status: 'running', ...game })
const line = (...points: [number, number][]): Point[] => points.map(([x, y]) => ({ x, y }))

group('placeFood', () => {
  it('picks among free cells by the random number', () => {
    const snake = line([0, 0], [1, 0])
    expect(placeFood(snake, 0)).toEqual({ x: 2, y: 0 })
    expect(placeFood(snake, 0.999999)).toEqual({ x: SIZE - 1, y: SIZE - 1 })
  })

  it('returns null when the board is full', () => {
    const all = Array.from({ length: SIZE * SIZE }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }))
    expect(placeFood(all, 0.5)).toBeNull()
  })
})

group('newGame', () => {
  it('starts a ready three-long snake heading right with food off the snake', () => {
    const game = newGame(0.5)
    expect(game).toMatchObject({ status: 'ready', dir: 'right', score: 0, queue: [] })
    expect(game.snake).toEqual(line([7, 10], [6, 10], [5, 10]))
    expect(game.snake).not.toContainEqual(game.food)
  })
})

group('turn', () => {
  it('starts a ready game and queues the turn', () => {
    expect(turn(newGame(0), 'up')).toMatchObject({ status: 'running', queue: ['up'] })
  })

  it('starts a ready game without reversing into the body', () => {
    expect(turn(newGame(0), 'left')).toMatchObject({ status: 'running', queue: [] })
  })

  it('ignores reversals and repeats, judged against the last queued turn', () => {
    const game = running()
    expect(turn(game, 'left')).toBe(game)
    expect(turn(game, 'right')).toBe(game)
    const up = turn(game, 'up')
    expect(turn(up, 'down')).toBe(up)
    expect(turn(up, 'left').queue).toEqual(['up', 'left'])
  })

  it('buffers at most two turns', () => {
    const game = turn(turn(running(), 'up'), 'left')
    expect(turn(game, 'down')).toBe(game)
  })

  it('does nothing when paused or over', () => {
    for (const status of ['paused', 'over', 'won'] as const) {
      const game = running({ status })
      expect(turn(game, 'up')).toBe(game)
    }
  })
})

group('step', () => {
  it('moves the head forward and drops the tail', () => {
    const next = step(running(), false, 0)
    expect(next.snake).toEqual(line([8, 10], [7, 10], [6, 10]))
  })

  it('applies one queued turn per move', () => {
    let game = turn(turn(running(), 'up'), 'left')
    game = step(game, false, 0)
    expect(game).toMatchObject({ dir: 'up', queue: ['left'] })
    expect(game.snake[0]).toEqual({ x: 7, y: 9 })
    game = step(game, false, 0)
    expect(game).toMatchObject({ dir: 'left', queue: [] })
    expect(game.snake[0]).toEqual({ x: 6, y: 9 })
  })

  it('grows, scores and places new food when eating', () => {
    const next = step(running({ food: { x: 8, y: 10 } }), false, 0)
    expect(next.snake).toEqual(line([8, 10], [7, 10], [6, 10], [5, 10]))
    expect(next.score).toBe(1)
    expect(next.food).toEqual({ x: 0, y: 0 })
  })

  it('ends the game at a wall', () => {
    const game = running({ snake: line([SIZE - 1, 3], [SIZE - 2, 3]) })
    expect(step(game, false, 0).status).toBe('over')
  })

  it('wraps to the other side when wrap is on', () => {
    const right = running({ snake: line([SIZE - 1, 3], [SIZE - 2, 3]) })
    expect(step(right, true, 0).snake[0]).toEqual({ x: 0, y: 3 })
    const up = running({ snake: line([4, 0], [4, 1]), dir: 'up' })
    expect(step(up, true, 0).snake[0]).toEqual({ x: 4, y: SIZE - 1 })
  })

  it('ends the game when the head hits the body', () => {
    // A hook shape: heading down from (2,1) into (2,2), which is body.
    const snake = line([2, 1], [3, 1], [3, 2], [2, 2], [1, 2])
    expect(step(running({ snake, dir: 'down' }), false, 0).status).toBe('over')
  })

  it('may move into the cell the tail is leaving', () => {
    const snake = line([1, 1], [2, 1], [2, 2], [1, 2])
    const next = step(running({ snake, dir: 'down' }), false, 0)
    expect(next.status).toBe('running')
    expect(next.snake[0]).toEqual({ x: 1, y: 2 })
  })

  it('is won when the last free cell is eaten', () => {
    const all = Array.from({ length: SIZE * SIZE }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }))
    // Snake fills every cell but (0,0), head at (1,0) heading left onto the food.
    const snake = [all[1], ...all.slice(2)]
    const next = step(running({ snake, dir: 'left', food: { x: 0, y: 0 } }), false, 0)
    expect(next.status).toBe('won')
    expect(next.score).toBe(1)
  })

  it('leaves a game that is not running alone', () => {
    const game = newGame(0)
    expect(step(game, false, 0)).toBe(game)
  })
})

group('togglePause', () => {
  it('starts, pauses and resumes, but not after the end', () => {
    expect(togglePause(newGame(0)).status).toBe('running')
    expect(togglePause(running()).status).toBe('paused')
    expect(togglePause(running({ status: 'paused' })).status).toBe('running')
    const over = running({ status: 'over' })
    expect(togglePause(over)).toBe(over)
  })
})

it('describes the board 1-based', () => {
  expect(describe(newGame(0))).toBe('Snake board, 20 by 20. Head at column 8, row 11, length 3. Food at column 1, row 1.')
})
