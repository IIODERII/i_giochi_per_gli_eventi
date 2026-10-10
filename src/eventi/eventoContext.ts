import { createContext, useContext } from 'react'
import type { Evento } from './types'

export interface EventoState {
  evento: Evento
  /** Admin di questo evento, oppure Oder. */
  isAdmin: boolean
  isSuperadmin: boolean
  /** Indirizzo dentro l'evento: percorso('bingo') -> '/e/sara25/bingo'. */
  percorso: (sotto?: string) => string
  /** Colore provvisorio mentre l'admin lo sceglie; null torna a quello salvato. */
  setAnteprimaColore: (colore: string | null) => void
}

export const EventoContext = createContext<EventoState | null>(null)

export function useEvento(): EventoState {
  const ctx = useContext(EventoContext)
  if (!ctx) throw new Error('useEvento va usato dentro <EventoProvider>')
  return ctx
}

export function percorsoEvento(eventoId: string, sotto = ''): string {
  return `/e/${eventoId}${sotto ? `/${sotto}` : ''}`
}
