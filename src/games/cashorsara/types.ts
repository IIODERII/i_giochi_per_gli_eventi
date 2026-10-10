import type { Timestamp } from 'firebase/firestore'

export const NOME_MAX = 24
export const VALORE_MAX = 1_000_000
/** La storia la racconta il presentatore nel fumetto: puo' essere lunga. */
export const STORIA_MAX = 1500

/** Un oggetto da valutare. Il valore vero lo vede solo l'admin. */
export interface Oggetto {
  id: string
  nome: string
  storia: string
  valore: number
  ordine: number
  foto?: string | null
  createdAt?: Timestamp | null
}

export type StatoPartita = 'attesa' | 'puntate' | 'chiuse' | 'rivelato' | 'finita'

/** Com'e' andata a un giocatore sull'oggetto appena rivelato. */
export interface EsitoSalvato {
  stima: number
  punti: number
  posizione: number
  piuVicino: boolean
  errore: number
}

export interface RigaClassifica {
  giocatoreId: string
  nome: string
  punti: number
  turni: number
  posizione: number
}

/**
 * Lo stato che vedono tutti: dell'oggetto in gioco viaggiano solo nome e
 * storia (la foto sta a parte, nella vetrina). Il valore vero entra in
 * "valoriRivelati" soltanto nel momento in cui l'admin lo rivela.
 *
 * Esiti e classifica vengono calcolati da chi rivela e salvati qui: cosi' i
 * telefoni non devono ascoltare le puntate di tutti, e ogni passo della
 * partita costa a ciascun telefono una sola lettura.
 */
export interface Partita {
  stato: StatoPartita
  indice: number
  totale: number
  oggettoId: string | null
  oggettoNome: string
  oggettoStoria: string
  valoriRivelati: Record<string, number>
  /** Esiti dell'ultimo oggetto rivelato, per giocatore. */
  esiti: Record<string, EsitoSalvato>
  /** Quanti hanno puntato sull'ultimo oggetto rivelato. */
  puntateTurno: number
  classifica: RigaClassifica[]
  aggiornataIl?: Timestamp | null
}

export const PARTITA_VUOTA: Partita = {
  stato: 'attesa',
  indice: 0,
  totale: 0,
  oggettoId: null,
  oggettoNome: '',
  oggettoStoria: '',
  valoriRivelati: {},
  esiti: {},
  puntateTurno: 0,
  classifica: [],
}

/**
 * La foto dell'oggetto in gioco. Sta in un documento a parte perche' pesa
 * centinaia di KB: dentro la partita viaggerebbe verso ogni telefono a ogni
 * cambio di stato, qui solo una volta per oggetto.
 */
export interface Vetrina {
  indice: number
  foto: string | null
}

export interface Giocatore {
  id: string
  nome: string
  manuale?: boolean
  entratoIl?: Timestamp | null
}

export interface Risposta {
  id: string
  indice: number
  giocatoreId: string
  nome: string
  valore: number
  inviataIl?: Timestamp | null
}

export function idRisposta(indice: number, giocatoreId: string): string {
  return `${indice}__${giocatoreId}`
}

export function nomeValido(grezzo: string): { ok: boolean; valore: string; errore?: string } {
  const valore = grezzo.trim().replace(/\s+/g, ' ')
  if (valore.length < 2) return { ok: false, valore, errore: 'Scrivi il tuo nome.' }
  if (valore.length > NOME_MAX) {
    return { ok: false, valore, errore: `Massimo ${NOME_MAX} caratteri.` }
  }
  return { ok: true, valore }
}

export function euro(valore: number): string {
  return valore.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
