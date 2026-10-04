import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, loadBest, loadSettings, saveBest, saveSettings } from './store'

beforeEach(() => localStorage.clear())

describe('settings', () => {
  it('round-trips', () => {
    saveSettings({ speed: 'fast', wrap: true })
    expect(loadSettings()).toEqual({ speed: 'fast', wrap: true })
  })

  it('falls back to defaults on missing, corrupt or invalid data', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem('snake:settings', '{nope')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem('snake:settings', JSON.stringify({ speed: 'warp', wrap: 'yes' }))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem('snake:settings', JSON.stringify({ speed: 'slow' }))
    expect(loadSettings()).toEqual({ speed: 'slow', wrap: false })
  })
})

describe('best scores', () => {
  it('round-trips', () => {
    saveBest({ 'fast-wrap': 12, 'slow-walls': 3 })
    expect(loadBest()).toEqual({ 'fast-wrap': 12, 'slow-walls': 3 })
  })

  it('drops unknown modes and bad scores, and survives corrupt data', () => {
    localStorage.setItem('snake:best', JSON.stringify({ 'normal-walls': 4, 'warp-walls': 9, 'fast-wrap': -1, 'slow-wrap': 1.5 }))
    expect(loadBest()).toEqual({ 'normal-walls': 4 })
    localStorage.setItem('snake:best', '[1,2]')
    expect(loadBest()).toEqual({})
    localStorage.setItem('snake:best', 'garbage')
    expect(loadBest()).toEqual({})
  })
})
