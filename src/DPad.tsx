import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Dir } from './snake'

const PAD: [Dir, LucideIcon, string][] = [
  ['up', ChevronUp, 'col-start-2'],
  ['left', ChevronLeft, 'col-start-1 row-start-2'],
  ['down', ChevronDown, 'col-start-2 row-start-2'],
  ['right', ChevronRight, 'col-start-3 row-start-2'],
]

/** On-screen arrows for touch screens and narrow windows. */
export function DPad({ onTurn, className }: { onTurn: (dir: Dir) => void; className?: string }) {
  return (
    <div role="group" aria-label="Direction" className={className}>
      <div className="grid grid-cols-3 gap-2">
        {PAD.map(([dir, Icon, place]) => (
          <Button
            key={dir}
            variant="outline"
            aria-label={`Turn ${dir}`}
            className={`size-14 ${place}`}
            // Pointer-down rather than click: a click waits for the finger to lift, which feels laggy here.
            onPointerDown={(e) => {
              e.preventDefault()
              onTurn(dir)
            }}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}
            onClick={(e) => e.detail === 0 && onTurn(dir)}
          >
            <Icon className="size-6" />
          </Button>
        ))}
      </div>
    </div>
  )
}
