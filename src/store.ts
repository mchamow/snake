import type { BestScores } from './session'
import { SPEEDS, type Settings, type Speed } from './snake'

const SETTINGS_KEY = 'snake:settings'
const BEST_KEY = 'snake:best'

export const DEFAULT_SETTINGS: Settings = { speed: 'normal', wrap: false }

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the game still works, it just won't remember.
  }
}

/** Saved settings, with the default for anything missing or invalid. */
export function loadSettings(): Settings {
  const saved = read(SETTINGS_KEY) as Partial<Record<keyof Settings, unknown>> | null
  if (!saved || typeof saved !== 'object') return DEFAULT_SETTINGS
  return {
    speed: SPEEDS.includes(saved.speed as Speed) ? (saved.speed as Speed) : DEFAULT_SETTINGS.speed,
    wrap: typeof saved.wrap === 'boolean' ? saved.wrap : DEFAULT_SETTINGS.wrap,
  }
}

export const saveSettings = (settings: Settings) => write(SETTINGS_KEY, settings)

/** Saved best scores, skipping any entry that isn't a known mode with a whole, non-negative score. */
export function loadBest(): BestScores {
  const saved = read(BEST_KEY)
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
  const best: BestScores = {}
  for (const [key, score] of Object.entries(saved)) {
    if (/^(slow|normal|fast)-(walls|wrap)$/.test(key) && Number.isInteger(score) && score >= 0) best[key] = score
  }
  return best
}

export const saveBest = (best: BestScores) => write(BEST_KEY, best)
