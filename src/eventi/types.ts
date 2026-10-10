import type { Timestamp } from 'firebase/firestore'
import { COLORE_PREDEFINITO } from '../config'

export type TipoEvento =
  | 'laurea'
  | 'compleanno'
  | 'matrimonio'
  | 'battesimo'
  | 'comunione'
  | 'anniversario'
  | 'festa'

export type IdGioco = 'cruciverba' | 'bingo' | 'cashorsara'

export interface ImpostazioniGioco {
  attivo: boolean
  /** Vuoto = titolo automatico, ricavato dal nome del festeggiato. */
  titolo: string
}

/** Documento eventi/{id} su Firestore: l'id e' anche il prefisso degli utenti. */
export interface Evento {
  id: string
  /** Diventa vero quando l'admin salva le impostazioni la prima volta. */
  configurato: boolean
  tipo: TipoEvento
  festeggiati: string[]
  /** Una riga in piu' sotto i nomi, es. il corso di laurea. */
  dettaglio: string
  /** Formato AAAA-MM-GG, oppure vuota. */
  data: string
  colore: string
  giochi: Record<IdGioco, ImpostazioniGioco>
  /** Chi racconta gli oggetti di Cash or ...: vuoto = nessun presentatore. */
  presentatore: string
  creatoIl?: Timestamp | null
}

export const FESTEGGIATI_MAX = 4
export const NOME_FESTEGGIATO_MAX = 40
export const DETTAGLIO_MAX = 120
export const TITOLO_GIOCO_MAX = 30
export const PRESENTATORE_MAX = 40

interface DescrizioneTipo {
  etichetta: string
  /** La riga sopra i nomi nella home: [un festeggiato, piu' festeggiati]. */
  occhiello: [string, string]
  titolo: (nomi: string) => string
  /** Negli attestati del bingo: "hai fatto Ambo alla laurea di Sara". */
  occasione: string
  esempioDettaglio: string
}

export const TIPI: Record<TipoEvento, DescrizioneTipo> = {
  laurea: {
    etichetta: 'Laurea',
    occhiello: ['Si laurea', 'Si laureano'],
    titolo: (n) => `La laurea di ${n}`,
    occasione: 'alla laurea di',
    esempioDettaglio: 'es. Scienze Nutraceutiche e della Salute Alimentare',
  },
  compleanno: {
    etichetta: 'Compleanno',
    occhiello: ['Buon compleanno', 'Buon compleanno'],
    titolo: (n) => `Il compleanno di ${n}`,
    occasione: 'al compleanno di',
    esempioDettaglio: 'es. 30 anni e non sentirli',
  },
  matrimonio: {
    etichetta: 'Matrimonio',
    occhiello: ['Si sposa', 'Si sposano'],
    titolo: (n) => `Il matrimonio di ${n}`,
    occasione: 'al matrimonio di',
    esempioDettaglio: 'es. Villa dei Cedri, Verona',
  },
  battesimo: {
    etichetta: 'Battesimo',
    occhiello: ['Il battesimo di', 'Il battesimo di'],
    titolo: (n) => `Il battesimo di ${n}`,
    occasione: 'al battesimo di',
    esempioDettaglio: 'es. Benvenuto al mondo!',
  },
  comunione: {
    etichetta: 'Comunione',
    occhiello: ['La prima comunione di', 'La prima comunione di'],
    titolo: (n) => `La comunione di ${n}`,
    occasione: 'alla comunione di',
    esempioDettaglio: 'es. Parrocchia di San Marco',
  },
  anniversario: {
    etichetta: 'Anniversario',
    occhiello: ['Festeggia l’anniversario', 'Festeggiano l’anniversario'],
    titolo: (n) => `L’anniversario di ${n}`,
    // apostrofo dritto: i caratteri standard dei PDF non hanno quello tipografico
    occasione: "all'anniversario di",
    esempioDettaglio: 'es. 25 anni insieme',
  },
  festa: {
    etichetta: 'Altra festa',
    occhiello: ['Si festeggia', 'Si festeggiano'],
    titolo: (n) => `La festa di ${n}`,
    occasione: 'alla festa di',
    esempioDettaglio: 'es. Finalmente in pensione!',
  },
}

export const ELENCO_TIPI = Object.keys(TIPI) as TipoEvento[]

export const GIOCHI_PREDEFINITI: Record<IdGioco, ImpostazioniGioco> = {
  cruciverba: { attivo: true, titolo: '' },
  bingo: { attivo: true, titolo: '' },
  cashorsara: { attivo: true, titolo: '' },
}

/** I campi di un evento appena creato da Oder, prima che l'admin lo compili. */
export function eventoVuoto(): Omit<Evento, 'id' | 'creatoIl'> {
  return {
    configurato: false,
    tipo: 'festa',
    festeggiati: [],
    dettaglio: '',
    data: '',
    colore: COLORE_PREDEFINITO,
    giochi: GIOCHI_PREDEFINITI,
    presentatore: '',
  }
}

/** Completa con i valori predefiniti quello che arriva da Firestore. */
export function normalizzaEvento(id: string, dati: Partial<Evento>): Evento {
  const vuoto = eventoVuoto()
  return {
    ...vuoto,
    ...dati,
    id,
    festeggiati: Array.isArray(dati.festeggiati) ? dati.festeggiati : [],
    giochi: {
      cruciverba: { ...vuoto.giochi.cruciverba, ...dati.giochi?.cruciverba },
      bingo: { ...vuoto.giochi.bingo, ...dati.giochi?.bingo },
      cashorsara: { ...vuoto.giochi.cashorsara, ...dati.giochi?.cashorsara },
    },
  }
}

/** "Sara", "Marco e Giulia", "Anna, Luca e Pietro". */
export function elencaNomi(nomi: string[]): string {
  const puliti = nomi.map((n) => n.trim()).filter(Boolean)
  if (puliti.length <= 1) return puliti[0] ?? ''
  return `${puliti.slice(0, -1).join(', ')} e ${puliti[puliti.length - 1]}`
}

export function piuFesteggiati(evento: Evento): boolean {
  return evento.festeggiati.filter((n) => n.trim()).length > 1
}

/** I nomi completi, come li ha scritti l'admin. */
export function nomiCompleti(evento: Evento): string {
  return elencaNomi(evento.festeggiati)
}

/** Solo i nomi di battesimo: "Sara Miglienti" diventa "Sara". */
export function nomiBrevi(evento: Evento): string {
  return elencaNomi(evento.festeggiati.map((n) => n.trim().split(/\s+/)[0] ?? ''))
}

export function titoloEvento(evento: Evento): string {
  if (!evento.configurato || evento.festeggiati.length === 0) return 'Evento in preparazione'
  return TIPI[evento.tipo].titolo(nomiBrevi(evento))
}

export function occhiello(evento: Evento): string {
  return TIPI[evento.tipo].occhiello[piuFesteggiati(evento) ? 1 : 0]
}

/** Il titolo automatico: un gioco di parole sul nome, se il festeggiato e' uno solo. */
export function titoloPredefinito(evento: Evento, gioco: IdGioco): string {
  const nome = piuFesteggiati(evento) ? '' : nomiBrevi(evento)
  switch (gioco) {
    case 'cruciverba':
      return nome ? `Cruci${nome}` : 'Cruciverba'
    case 'bingo':
      return nome ? `Bingo${nome}` : 'Bingo'
    case 'cashorsara':
      return nome ? `Cash or ${nome}` : 'Cash or Trash'
  }
}

export function titoloGioco(evento: Evento, gioco: IdGioco): string {
  return evento.giochi[gioco].titolo.trim() || titoloPredefinito(evento, gioco)
}

/** "2026-12-12" diventa "12 dicembre 2026". */
export function dataLeggibile(data: string): string {
  const parti = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data)
  if (!parti) return ''
  const giorno = new Date(Number(parti[1]), Number(parti[2]) - 1, Number(parti[3]))
  return giorno.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Un nome di file senza spazi ne' accenti, es. "Cash or Sara" -> "cash-or-sara". */
export function nomeFile(testo: string): string {
  return (
    testo
      .normalize('NFD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'giochi'
  )
}
