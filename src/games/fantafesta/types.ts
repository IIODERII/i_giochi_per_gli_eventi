import type { Voce } from '../shared/raccolta'

/** Collezione "fantaregole": una cosa che puo' succedere alla festa e quanto vale. */
export interface Regola extends Voce {
  testo: string
  /** Positivo e' un bonus, negativo un malus. */
  punti: number
}

/** Collezione "fantagiocatori": chi e' in gara. */
export interface Giocatore extends Voce {
  nome: string
}

/** Collezione "fantapunti": i punti che l'admin da' durante la festa. */
export interface Assegnazione extends Voce {
  giocatoreId: string
  /** La regola da cui vengono i punti, vuoto per i punti dati a mano. */
  regolaId: string
  /** Il testo della regola com'era al momento, oppure il motivo scritto a mano. */
  motivo: string
  punti: number
}

export const TESTO_MIN = 3
export const TESTO_MAX = 80
export const AUTORE_MAX = 40
export const NOME_MIN = 2
export const NOME_MAX = 30
/** Per una regola del regolamento. */
export const PUNTI_MAX = 100
/** Per i punti dati a mano: qualche premio speciale puo' valere di piu'. */
export const PUNTI_LIBERI_MAX = 1000

/** I valori proposti nel modulo: chi vuole ne scrive un altro. */
export const PUNTI_PROPOSTI = [5, 10, 15, 20, 30, 50]

export interface Esito<T> {
  ok: boolean
  valore: T
  errore?: string
}

function pulisci(grezzo: string): string {
  return grezzo.trim().replace(/\s+/g, ' ')
}

export function validaTesto(grezzo: string): Esito<string> {
  const valore = pulisci(grezzo)
  if (valore.length < TESTO_MIN) return { ok: false, valore, errore: 'Scrivi che cosa deve succedere.' }
  if (valore.length > TESTO_MAX) {
    return { ok: false, valore, errore: `Massimo ${TESTO_MAX} caratteri.` }
  }
  return { ok: true, valore }
}

export function validaNome(grezzo: string): Esito<string> {
  const valore = pulisci(grezzo)
  if (valore.length < NOME_MIN) return { ok: false, valore, errore: 'Scrivi il nome.' }
  if (valore.length > NOME_MAX) {
    return { ok: false, valore, errore: `Il nome può avere al massimo ${NOME_MAX} caratteri.` }
  }
  return { ok: true, valore }
}

export function validaPunti(grezzo: number, massimo: number): Esito<number> {
  const valore = Math.round(grezzo)
  if (!Number.isFinite(valore) || valore === 0) {
    return { ok: false, valore, errore: 'Indica quanti punti vale.' }
  }
  if (Math.abs(valore) > massimo) {
    return { ok: false, valore, errore: `Al massimo ${massimo} punti, in più o in meno.` }
  }
  return { ok: true, valore }
}

/** "+10" oppure "−5", con il meno tipografico. */
export function puntiConSegno(punti: number): string {
  return punti > 0 ? `+${punti}` : `−${Math.abs(punti)}`
}

/** Prima i bonus piu' grossi, poi i malus dal piu' leggero al piu' pesante. */
export function ordinaRegole(regole: Regola[]): Regola[] {
  return [...regole].sort((a, b) => b.punti - a.punti || a.testo.localeCompare(b.testo, 'it'))
}

export interface Posizione {
  giocatore: Giocatore
  totale: number
  /** 1 per il primo; a parita' di punti la posizione e' la stessa. */
  posto: number
  assegnazioni: Assegnazione[]
}

/** La classifica: chi non ha ancora punti c'e' lo stesso, a zero. */
export function calcolaClassifica(giocatori: Giocatore[], assegnazioni: Assegnazione[]): Posizione[] {
  const perGiocatore = new Map<string, Assegnazione[]>()
  for (const a of assegnazioni) {
    const elenco = perGiocatore.get(a.giocatoreId) ?? []
    elenco.push(a)
    perGiocatore.set(a.giocatoreId, elenco)
  }

  const righe = giocatori
    .map((giocatore) => {
      const sue = perGiocatore.get(giocatore.id) ?? []
      return {
        giocatore,
        totale: sue.reduce((somma, a) => somma + a.punti, 0),
        posto: 0,
        assegnazioni: sue,
      }
    })
    .sort((a, b) => b.totale - a.totale || a.giocatore.nome.localeCompare(b.giocatore.nome, 'it'))

  righe.forEach((riga, i) => {
    riga.posto = i > 0 && righe[i - 1].totale === riga.totale ? righe[i - 1].posto : i + 1
  })
  return righe
}
