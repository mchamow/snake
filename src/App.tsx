import { Pause, Play, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useReducer } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Board } from './Board'
import { DPad } from './DPad'
import { bestKey, sessionReducer, type Session } from './session'
import { newGame, SPEEDS, TICK_MS, type Dir, type Speed } from './snake'
import { loadBest, loadSettings, saveBest, saveSettings } from './store'

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

/** Space and Enter already activate a focused control; don't act on them twice. */
const isControl = (target: EventTarget | null) =>
  target instanceof HTMLElement && !!target.closest('button, input, textarea, select, [role="switch"]')

const init = (): Session => ({ game: newGame(Math.random()), settings: loadSettings(), best: loadBest(), newBest: false })

export default function App() {
  const [{ game, settings, best, newBest }, dispatch] = useReducer(sessionReducer, null, init)
  const { status, score } = game
  const bestScore = best[bestKey(settings)] ?? 0
  const between = status === 'ready' || status === 'over' || status === 'won'

  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => saveBest(best), [best])

  useEffect(() => {
    if (status !== 'running') return
    const id = setInterval(() => dispatch({ type: 'tick', random: Math.random() }), TICK_MS[settings.speed])
    return () => clearInterval(id)
  }, [status, settings.speed])

  // Switching tabs pauses instead of letting the snake run into a wall unseen.
  useEffect(() => {
    const onHide = () => document.hidden && dispatch({ type: 'pause' })
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  const turn = (dir: Dir) => dispatch({ type: 'turn', dir })
  const restart = () => dispatch({ type: 'restart', random: Math.random() })
  const ended = status === 'over' || status === 'won'

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const dir = KEY_DIRS[event.key] ?? KEY_DIRS[event.key.toLowerCase()]
      if (dir) {
        event.preventDefault()
        if (ended) return
        return dispatch({ type: 'turn', dir })
      }
      const key = event.key.toLowerCase()
      if (key === 'r') return restart()
      if ((key === ' ' || key === 'enter' || key === 'p') && !(key !== 'p' && isControl(event.target))) {
        event.preventDefault()
        if (ended) restart()
        else if (key !== 'enter') dispatch({ type: 'togglePause' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ended])

  const overlay =
    status === 'ready' ? (
      <>
        <p className="text-lg font-semibold">Ready?</p>
        <p className="text-sm text-muted-foreground">
          Press an arrow key, <Kbd>Space</Kbd> or swipe to start.
        </p>
        <Button size="lg" onClick={() => dispatch({ type: 'togglePause' })}>
          <Play data-icon="inline-start" />
          Start
        </Button>
      </>
    ) : status === 'paused' ? (
      <>
        <p className="text-lg font-semibold">Paused</p>
        <Button size="lg" onClick={() => dispatch({ type: 'togglePause' })}>
          <Play data-icon="inline-start" />
          Resume
        </Button>
      </>
    ) : ended ? (
      <>
        <p className="text-2xl font-semibold">{status === 'won' ? 'You filled the board!' : 'Game over'}</p>
        <p className="text-muted-foreground">
          Score <span className="font-semibold text-foreground tabular-nums">{score}</span>
        </p>
        {newBest && (
          <Badge className="gap-1">
            <Trophy />
            New best!
          </Badge>
        )}
        <Button size="lg" onClick={restart} autoFocus>
          <RotateCcw data-icon="inline-start" />
          Play again
        </Button>
      </>
    ) : null

  return (
    <TooltipProvider>
      <main className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 px-4 py-6 sm:py-8">
        <header className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            <span aria-hidden>🐍 </span>Snake
          </h1>
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge variant="secondary" className="tabular-nums" aria-label={`Score ${score}`}>
              Score {score}
            </Badge>
            <Badge variant="outline" className="gap-1 tabular-nums" aria-label={`Best ${bestScore}`}>
              <Trophy />
              {bestScore}
            </Badge>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={status === 'running' ? 'Pause' : 'Resume'}
                    disabled={status !== 'running' && status !== 'paused'}
                    onClick={() => dispatch({ type: 'togglePause' })}
                  />
                }
              >
                {status === 'running' ? <Pause /> : <Play />}
              </TooltipTrigger>
              <TooltipContent>
                {status === 'running' ? 'Pause' : 'Resume'} <Kbd>Space</Kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Restart" onClick={restart} />}>
                <RotateCcw />
              </TooltipTrigger>
              <TooltipContent>
                Restart <Kbd>R</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <Board game={game} onTurn={turn} overlay={overlay} />
        <p role="status" className="sr-only">
          {status === 'paused' ? 'Game paused.' : ended ? `Game over. Score ${score}.${newBest ? ' New best!' : ''}` : ''}
        </p>

        <DPad onTurn={turn} className="mx-auto sm:pointer-fine:hidden" />

        <section aria-label="Settings" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <ToggleGroup
            aria-label="Speed"
            variant="outline"
            value={[settings.speed]}
            disabled={!between}
            onValueChange={([speed]) =>
              speed && dispatch({ type: 'settings', settings: { speed: speed as Speed }, random: Math.random() })
            }
          >
            {SPEEDS.map((speed) => (
              <ToggleGroupItem key={speed} value={speed}>
                {speed[0].toUpperCase() + speed.slice(1)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex items-center gap-2">
            <Switch
              id="wrap"
              checked={settings.wrap}
              disabled={!between}
              onCheckedChange={(wrap) => dispatch({ type: 'settings', settings: { wrap }, random: Math.random() })}
            />
            <Label htmlFor="wrap">Wrap-around walls</Label>
          </div>
        </section>
        {!between && <p className="-mt-2 text-xs text-muted-foreground">Settings unlock when the game ends.</p>}

        <footer className="mt-auto text-xs text-muted-foreground max-sm:hidden">
          <Kbd>←</Kbd> <Kbd>↑</Kbd> <Kbd>→</Kbd> <Kbd>↓</Kbd> or <Kbd>W</Kbd> <Kbd>A</Kbd> <Kbd>S</Kbd> <Kbd>D</Kbd> steer ·{' '}
          <Kbd>Space</Kbd> pause · <Kbd>R</Kbd> restart
        </footer>
      </main>
    </TooltipProvider>
  )
}
