import { newGame, step, togglePause, turn, type Dir, type Game, type Settings } from './snake'

/** Best score per speed and wall mode, keyed by `bestKey`. */
export type BestScores = Record<string, number>

export const bestKey = ({ speed, wrap }: Settings) => `${speed}-${wrap ? 'wrap' : 'walls'}`

export interface Session {
  game: Game
  settings: Settings
  best: BestScores
  /** The game that just ended beat the previous best. */
  newBest: boolean
}

export type SessionAction =
  | { type: 'turn'; dir: Dir }
  | { type: 'tick'; random: number }
  | { type: 'togglePause' }
  | { type: 'pause' }
  | { type: 'restart'; random: number }
  | { type: 'settings'; settings: Partial<Settings>; random: number }

export function sessionReducer(session: Session, action: SessionAction): Session {
  const { game, settings, best } = session
  switch (action.type) {
    case 'turn':
      return { ...session, game: turn(game, action.dir) }
    case 'togglePause':
      return { ...session, game: togglePause(game) }
    case 'pause':
      return game.status === 'running' ? { ...session, game: { ...game, status: 'paused' } } : session
    case 'restart':
      return { ...session, game: newGame(action.random), newBest: false }
    case 'settings':
      // Only between games: changing the rules mid-run would make the best scores meaningless.
      if (game.status === 'running' || game.status === 'paused') return session
      return { ...session, settings: { ...settings, ...action.settings }, game: newGame(action.random), newBest: false }
    case 'tick': {
      const next = step(game, settings.wrap, action.random)
      if (next === game) return session
      const ended = next.status === 'over' || next.status === 'won'
      const key = bestKey(settings)
      if (ended && next.score > (best[key] ?? 0)) {
        return { ...session, game: next, best: { ...best, [key]: next.score }, newBest: true }
      }
      return { ...session, game: next }
    }
  }
}
