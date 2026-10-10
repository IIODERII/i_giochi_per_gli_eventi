import type { ComponentType } from 'react'
import type { Evento, IdGioco } from '../eventi/types'
import BingoPage from './bingo/BingoPage'
import RegiaPage from './cashorsara/RegiaPage'
import CruciverbaPage from './cruciverba/CruciverbaPage'

/**
 * Elenco dei giochi del sito. Titolo e attivazione cambiano da un evento
 * all'altro e stanno nel documento dell'evento (campo "giochi").
 *
 * Per aggiungerne uno nuovo: crea una cartella in src/games/<nome>/ con la sua
 * pagina, aggiungi l'id a IdGioco e a GIOCHI_PREDEFINITI in
 * src/eventi/types.ts, poi aggiungi una voce qui sotto. Menu, rotte e tessere
 * della home si aggiornano da sole.
 */
export interface Gioco {
  id: IdGioco
  /** Dentro l'evento: /e/<evento>/<percorso>. */
  percorso: string
  descrizione: string
  emoji: string
  Componente: ComponentType
  /** Visibile solo all'admin: gli invitati non lo vedono nel menu. */
  soloAdmin?: boolean
}

export const giochi: Gioco[] = [
  {
    id: 'cruciverba',
    percorso: 'cruciverba',
    descrizione:
      'Proponi una parola e la sua definizione: verranno incastrate tutte insieme in un cruciverba da stampare.',
    emoji: '✏️',
    Componente: CruciverbaPage,
  },
  {
    id: 'bingo',
    percorso: 'bingo',
    descrizione:
      'Scrivi cosa pensi che succederà durante la festa: diventerà una casella delle cartelle del bingo.',
    emoji: '🎲',
    Componente: BingoPage,
  },
  {
    id: 'cashorsara',
    percorso: 'cashorsara',
    descrizione:
      'Il gioco della serata: si indovina quanto vale ogni oggetto. Gli invitati entrano dal QR proiettato.',
    emoji: '💎',
    Componente: RegiaPage,
    soloAdmin: true,
  },
]

export function giochiVisibili(evento: Evento, isAdmin: boolean): Gioco[] {
  // finche' l'admin non ha compilato le impostazioni gli invitati non vedono nulla
  if (!evento.configurato && !isAdmin) return []
  return giochi.filter((g) => evento.giochi[g.id].attivo && (isAdmin || !g.soloAdmin))
}
