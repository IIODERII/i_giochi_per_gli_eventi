import { puntiConSegno } from './types'

/** "+10" in verde per i bonus, "−5" in rosso per i malus. */
export default function PuntiBadge({ punti, grande = false }: { punti: number; grande?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums ${
        grande ? 'min-w-14 px-3 py-1 text-base' : 'min-w-11 px-2 py-0.5 text-xs'
      } ${punti >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}
    >
      {puntiConSegno(punti)}
    </span>
  )
}
