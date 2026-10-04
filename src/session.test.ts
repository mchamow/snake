import { describe, expect, it } from 'vitest'
import { bestKey, sessionReducer, type Session } from './session'
import { newGame, SIZE, type Game } from './snake'

const session = (game: Partial<Game> = {}, extra: Partial<Session> = {}): Session => ({
  game: { ...newGame(0), ...game },
  settings: { speed: 'normal', wrap: false },
  best: {},
  newBest: false,
  ...extra,
})
// Heading right from x=7 on row 10, the wall is 13 moves away.
const crash = (s: Session) => {
  for (let i = 0; i < SIZE; i++) s = sessionReducer(s, { type: 'tick', random: 0 })
  return s
}

describe('sessionReducer', () => {
  it('keys best scores by speed and wall mode', () => {
    expect(bestKey({ speed: 'fast', wrap: true })).toBe('fast-wrap')
    expect(bestKey({ speed: 'slow', wrap: false })).toBe('slow-walls')
  })

  it('records a new best when a game ends above it', () => {
    const end = crash(session({ status: 'running', score: 5 }, { best: { 'normal-walls': 3 } }))
    expect(end.game.status).toBe('over')
    expect(end.best).toEqual({ 'normal-walls': 5 })
    expect(end.newBest).toBe(true)
  })

  it('keeps the best when a game ends at or below it', () => {
    const end = crash(session({ status: 'running', score: 3 }, { best: { 'normal-walls': 3 } }))
    expect(end.best).toEqual({ 'normal-walls': 3 })
    expect(end.newBest).toBe(false)
  })

  it('does not count a scoreless game as a best', () => {
    expect(crash(session({ status: 'running' })).newBest).toBe(false)
  })

  it('restarts into a fresh ready game', () => {
    const next = sessionReducer(session({ status: 'over', score: 9 }, { newBest: true }), { type: 'restart', random: 0 })
    expect(next.game).toEqual(newGame(0))
    expect(next.newBest).toBe(false)
  })

  it('changes settings only between games, starting a fresh one', () => {
    const over = session({ status: 'over', score: 4 })
    const next = sessionReducer(over, { type: 'settings', settings: { wrap: true }, random: 0 })
    expect(next.settings).toEqual({ speed: 'normal', wrap: true })
    expect(next.game.status).toBe('ready')
    for (const status of ['running', 'paused'] as const) {
      const mid = session({ status })
      expect(sessionReducer(mid, { type: 'settings', settings: { speed: 'fast' }, random: 0 })).toBe(mid)
    }
  })

  it('pause only pauses a running game', () => {
    expect(sessionReducer(session({ status: 'running' }), { type: 'pause' }).game.status).toBe('paused')
    const ready = session()
    expect(sessionReducer(ready, { type: 'pause' })).toBe(ready)
  })
})
