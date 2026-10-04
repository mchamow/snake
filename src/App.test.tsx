import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { TICK_MS } from './snake'
import { loadBest, loadSettings, saveBest, saveSettings } from './store'

beforeAll(() => {
  // jsdom has no canvas; drawing is skipped when there's no context.
  HTMLCanvasElement.prototype.getContext = () => null
})
beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  // Food always lands on the first free cell: (0,0) at the start.
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const board = () => screen.getByRole('img', { name: /^Snake board/ }).getAttribute('aria-label')!
const head = () => board().match(/Head at column (\d+), row (\d+)/)!.slice(1).map(Number)
const key = (k: string) => fireEvent.keyDown(window, { key: k })
const button = (name: string | RegExp) => screen.getByRole('button', { name })
const ticks = (n: number, speed: keyof typeof TICK_MS = 'normal') =>
  act(() => vi.advanceTimersByTime(n * TICK_MS[speed]))
const score = () => screen.getByLabelText(/^Score \d+$/).textContent
const best = () => screen.getByLabelText(/^Best \d+$/).textContent

/** From the start (head at column 8, row 11), eat the food at column 1, row 1. */
const eatFirstFood = () => {
  key('ArrowUp')
  ticks(10)
  key('ArrowLeft')
  ticks(7)
}

describe('starting', () => {
  it('shows a ready board that waits for the player', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /Snake/ })).toBeTruthy()
    expect(screen.getByText('Ready?')).toBeTruthy()
    expect(board()).toContain('Food at column 1, row 1')
    ticks(5)
    expect(head()).toEqual([8, 11])
  })

  it('starts with an arrow key and moves on every tick', () => {
    render(<App />)
    key('ArrowRight')
    expect(screen.queryByText('Ready?')).toBeNull()
    ticks(3)
    expect(head()).toEqual([11, 11])
  })

  it('starts with the Start button or Space', () => {
    render(<App />)
    fireEvent.click(button('Start'))
    ticks(1)
    expect(head()).toEqual([9, 11])
    cleanup()
    render(<App />)
    key(' ')
    ticks(2)
    expect(head()).toEqual([10, 11])
  })
})

describe('steering', () => {
  it('turns with arrows and WASD, ignoring reversals', () => {
    render(<App />)
    key('w')
    ticks(2)
    expect(head()).toEqual([8, 9])
    key('ArrowDown')
    ticks(1)
    expect(head()).toEqual([8, 8])
    key('a')
    ticks(1)
    key('S')
    ticks(1)
    expect(head()).toEqual([7, 9])
  })

  it('turns with the on-screen pad', () => {
    render(<App />)
    fireEvent.pointerDown(button('Turn down'))
    ticks(1)
    expect(head()).toEqual([8, 12])
    fireEvent.click(button('Turn left'))
    ticks(1)
    expect(head()).toEqual([7, 12])
  })

  it('turns on a swipe across the board', () => {
    render(<App />)
    const surface = screen.getByRole('img', { name: /^Snake board/ }).parentElement!
    fireEvent.pointerDown(surface, { clientX: 100, clientY: 100 })
    fireEvent.pointerUp(surface, { clientX: 100, clientY: 20 })
    ticks(1)
    expect(head()).toEqual([8, 10])
  })
})

describe('playing', () => {
  it('eats food, scores and grows', () => {
    render(<App />)
    eatFirstFood()
    expect(score()).toBe('Score 1')
    expect(board()).toContain('length 4')
    expect(board()).not.toContain('Food at column 1, row 1')
  })

  it('ends at the wall, saves the best score and offers another go', () => {
    render(<App />)
    eatFirstFood()
    ticks(1)
    expect(screen.getByText('Game over')).toBeTruthy()
    expect(screen.getByText('New best!')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Game over. Score 1. New best!')
    expect(best()).toBe('1')
    expect(loadBest()).toEqual({ 'normal-walls': 1 })

    fireEvent.click(button('Play again'))
    expect(screen.getByText('Ready?')).toBeTruthy()
    expect(score()).toBe('Score 0')
    expect(best()).toBe('1')
  })

  it('restarts after a game over with Space or Enter', () => {
    render(<App />)
    key('ArrowUp')
    ticks(11)
    expect(screen.getByText('Game over')).toBeTruthy()
    expect(screen.queryByText('New best!')).toBeNull()
    key('ArrowRight')
    expect(screen.getByText('Game over')).toBeTruthy()
    fireEvent.keyDown(document.body, { key: 'Enter' })
    expect(screen.getByText('Ready?')).toBeTruthy()
  })

  it('pauses and resumes with Space and the header button', () => {
    render(<App />)
    key('ArrowRight')
    ticks(1)
    key(' ')
    expect(screen.getByText('Paused')).toBeTruthy()
    ticks(5)
    expect(head()).toEqual([9, 11])
    key('ArrowUp')
    ticks(1)
    expect(head()).toEqual([9, 11])
    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Resume' }))
    ticks(1)
    expect(head()).toEqual([10, 11])
    fireEvent.click(button('Pause'))
    expect(screen.getByText('Paused')).toBeTruthy()
  })

  it('pauses when the tab is hidden', () => {
    render(<App />)
    key('ArrowRight')
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    expect(screen.getByText('Paused')).toBeTruthy()
  })

  it('restarts with R', () => {
    render(<App />)
    key('ArrowRight')
    ticks(3)
    key('r')
    expect(screen.getByText('Ready?')).toBeTruthy()
    expect(head()).toEqual([8, 11])
  })
})

describe('settings', () => {
  it('wraps through walls when turned on, and remembers it', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('switch', { name: 'Wrap-around walls' }))
    expect(loadSettings().wrap).toBe(true)
    key('ArrowUp')
    ticks(11)
    expect(screen.queryByText('Game over')).toBeNull()
    expect(head()).toEqual([8, 20])
  })

  it('changes speed, and remembers it', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Fast' }))
    expect(loadSettings().speed).toBe('fast')
    key('ArrowRight')
    act(() => vi.advanceTimersByTime(TICK_MS.fast * 3))
    expect(head()).toEqual([11, 11])
  })

  it('locks settings during a game', () => {
    render(<App />)
    key('ArrowRight')
    expect(screen.getByRole('switch', { name: 'Wrap-around walls' }).getAttribute('aria-disabled') ?? '').not.toBe('')
    expect(screen.getByText('Settings unlock when the game ends.')).toBeTruthy()
  })

  it('shows the best score for the chosen mode', () => {
    saveBest({ 'normal-walls': 7, 'slow-wrap': 2 })
    saveSettings({ speed: 'slow', wrap: true })
    render(<App />)
    expect(best()).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'Normal' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Wrap-around walls' }))
    expect(best()).toBe('7')
  })
})
