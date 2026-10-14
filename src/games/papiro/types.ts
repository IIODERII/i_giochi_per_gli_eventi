export type FormatoPapiro = 'a3' | '50x70' | '70x100'

interface DescrizioneFormato {
  nome: string
  /** Millimetri, in verticale. */
  larghezza: number
  altezza: number
  /**
   * Risoluzione del PNG. Si scende sui formati grandi: oltre i 16 milioni di
   * pixel Safari sui telefoni non riesce piu' a creare l'immagine.
   */
  dpi: number
}

export const FORMATI: Record<FormatoPapiro, DescrizioneFormato> = {
  a3: { nome: 'A3', larghezza: 297, altezza: 420, dpi: 200 },
  '50x70': { nome: '50×70 cm', larghezza: 500, altezza: 700, dpi: 150 },
  '70x100': { nome: '70×100 cm', larghezza: 700, altezza: 1000, dpi: 120 },
}

export const ELENCO_FORMATI = Object.keys(FORMATI) as FormatoPapiro[]

/** Quante colonne occupa l'immagine al centro: "larga" ne prende due in piu'. */
export type LarghezzaImmagine = 'stretta' | 'larga'

export const COLONNE_PAPIRO = [3, 4, 5, 6] as const

/** Documento eventi/{id}/papiro/testo. L'immagine sta a parte perche' pesa. */
export interface Papiro {
  /** Vuoto = i nomi dei festeggiati. */
  titolo: string
  /** Vuoto = la riga in piu' dell'evento e la data. */
  sottotitolo: string
  /** I versi; una riga vuota separa le strofe. */
  testo: string
  formato: FormatoPapiro
  colonne: number
  immagine: LarghezzaImmagine
  /** Fondo color pergamena invece che bianco. */
  pergamena: boolean
}

export const TITOLO_MAX = 80
export const SOTTOTITOLO_MAX = 160
/** Circa 1500 versi: piu' di quanti ne stiano anche sul 70×100. */
export const TESTO_MAX = 60_000

export const PAPIRO_VUOTO: Papiro = {
  titolo: '',
  sottotitolo: '',
  testo: '',
  formato: 'a3',
  colonne: 4,
  immagine: 'stretta',
  pergamena: true,
}

/** Completa con i valori predefiniti quello che arriva da Firestore. */
export function normalizzaPapiro(dati: Partial<Papiro> | undefined): Papiro {
  const papiro = { ...PAPIRO_VUOTO, ...dati }
  return {
    titolo: String(papiro.titolo),
    sottotitolo: String(papiro.sottotitolo),
    testo: String(papiro.testo),
    formato: papiro.formato in FORMATI ? papiro.formato : PAPIRO_VUOTO.formato,
    colonne: (COLONNE_PAPIRO as readonly number[]).includes(papiro.colonne)
      ? papiro.colonne
      : PAPIRO_VUOTO.colonne,
    immagine: papiro.immagine === 'larga' ? 'larga' : 'stretta',
    pergamena: papiro.pergamena !== false,
  }
}

/** Quante colonne centrali occupa l'immagine: stessa parita' del totale, cosi' resta centrata. */
export function colonneImmagine(colonne: number, larghezza: LarghezzaImmagine): number {
  const stretta = colonne % 2 === 0 ? 2 : 1
  return larghezza === 'larga' && stretta + 2 < colonne ? stretta + 2 : stretta
}
