import { rgb, type Rgb } from '../../eventi/colore'
import { MM_PER_PUNTO } from '../shared/stampa'

/** Il minimo di jsPDF che serve qui: evita di importarlo staticamente. */
export interface DisegnatorePdf {
  setFont(nome: string, stile: string): unknown
  setFontSize(dimensione: number): unknown
  setTextColor(r: number, g: number, b: number): unknown
  setDrawColor(r: number, g: number, b: number): unknown
  setFillColor(r: number, g: number, b: number): unknown
  setLineWidth(spessore: number): unknown
  text(testo: string, x: number, y: number, opzioni?: { align?: string }): unknown
  line(x1: number, y1: number, x2: number, y2: number): unknown
  roundedRect(x: number, y: number, l: number, a: number, rx: number, ry: number, stile: string): unknown
  splitTextToSize(testo: string, larghezza: number): string[]
  getTextWidth(testo: string): number
}

const SOTTOTITOLO = 'come si gioca'
const INTRO =
  'Ogni casella è una previsione su quello che succederà stasera. Quando una si avvera, segna il pallino.'

const CONTROLLO: [string, string] = [
  'Prima di iniziare, controlla la cartella.',
  'Se una previsione riguarda proprio te, fattela cambiare: non si gioca su se stessi.',
]

const OCCHIELLO = 'Le combinazioni valgono sempre su una sola riga:'

const VOCI: [string, string][] = [
  ['Ambo', '2 caselle segnate nella stessa riga'],
  ['Terna', '3 nella stessa riga'],
  ['Quaterna', '4 nella stessa riga'],
  ['Cinquina', 'tutta la riga, 5 caselle'],
  ['Bingo', 'tutte e 15 le caselle della cartella'],
]

const PARAGRAFI: [string, string][] = [
  [
    'Dichiarala ad alta voce.',
    'Una combinazione vale solo se la annunci: vince chi la dice per primo.',
  ],
  [
    'Ogni premio si vince una volta sola.',
    'Fatto ambo si gioca per la terna, e così via fino al bingo.',
  ],
  [
    'In caso di pareggio, sasso carta forbice.',
    'Se due gridano insieme si decide sul momento, una mano secca.',
  ],
]

const INCHIOSTRO: Rgb = [45, 39, 35]
const GRIGIO: Rgb = [120, 105, 95]

/** Quanto scende sotto la linea di base una "p", in frazione di corpo. */
const DISCENDENTE = 0.25

type Stile = 'normal' | 'bold' | 'italic'

interface Scritta {
  testo: string
  dx: number
  dy: number
  dimensione: number
  stile: Stile
  colore: Rgb
  carattere: 'helvetica' | 'times'
}

/** Quello che sul retro cambia da un evento all'altro. */
export interface TestiRegole {
  titolo: string
  colore: string
}

export interface Regole {
  altezza: number
  disegna: (x: number, y: number) => void
}

/**
 * Impagina il retro della cartella e restituisce l'altezza che occupa, piu'
 * la funzione che lo disegna.
 *
 * Se il riquadro e' piu' largo che alto (come le cartelle 5x3) il testo va su
 * due colonne: righe lunghe 10 cm sarebbero faticose da leggere e sprecano
 * l'altezza disponibile.
 */
export function componiRegole(
  doc: DisegnatorePdf,
  dimensione: number,
  larghezzaBlocco: number,
  altezzaBlocco: number,
  testi: TestiRegole,
): Regole {
  const principale = rgb(testi.colore)
  const pad = Math.min(6, larghezzaBlocco * 0.055)
  const larghezza = larghezzaBlocco - pad * 2
  const interlinea = dimensione * MM_PER_PUNTO * 1.28
  const scritte: Scritta[] = []
  let linea = 0

  const dueColonne = larghezzaBlocco > altezzaBlocco * 1.2
  const distanza = larghezza * 0.05
  const larghezzaColonna = dueColonne ? (larghezza - distanza) / 2 : larghezza
  let colonnaDx = 0
  // quando attivo si calcolano solo le altezze, senza disegnare nulla
  let soloMisura = false

  function paragrafo(
    testo: string,
    opzioni: {
      dimensione?: number
      stile?: Stile
      colore?: Rgb
      dx?: number
      larghezza?: number
    },
    y: number,
  ): number {
    const dim = opzioni.dimensione ?? dimensione
    const passo = dim * MM_PER_PUNTO * 1.28
    doc.setFont('helvetica', opzioni.stile ?? 'normal')
    doc.setFontSize(dim)
    const dentro = opzioni.larghezza ?? larghezzaColonna - (opzioni.dx ?? 0)
    for (const riga of doc.splitTextToSize(testo, dentro)) {
      if (!soloMisura) scritte.push({
        testo: riga,
        dx: pad + colonnaDx + (opzioni.dx ?? 0),
        dy: y,
        dimensione: dim,
        stile: opzioni.stile ?? 'normal',
        colore: opzioni.colore ?? INCHIOSTRO,
        carattere: 'helvetica',
      })
      y += passo
    }
    return y
  }

  // --- testata, a tutta larghezza ----------------------------------------
  const dimTitolo = dimensione * 1.9
  let y = pad + dimTitolo * MM_PER_PUNTO
  scritte.push({
    testo: testi.titolo,
    dx: pad,
    dy: y,
    dimensione: dimTitolo,
    stile: 'bold',
    colore: principale,
    carattere: 'times',
  })
  doc.setFont('times', 'bold')
  doc.setFontSize(dimTitolo)
  scritte.push({
    testo: SOTTOTITOLO,
    dx: pad + doc.getTextWidth(testi.titolo) + 2,
    dy: y,
    dimensione,
    stile: 'italic',
    colore: GRIGIO,
    carattere: 'times',
  })

  y += interlinea * 0.5
  linea = y
  y += interlinea * 0.9

  // --- colonna con le spiegazioni ----------------------------------------
  function scriviTesto(da: number, quantiParagrafi: number): number {
    let y = paragrafo(INTRO, {}, da)
    y += interlinea * 0.4
    y = paragrafo(CONTROLLO[0], { stile: 'bold' }, y)
    y = paragrafo(CONTROLLO[1], {}, y)
    y += interlinea * 0.45
    for (const [apertura, spiegazione] of PARAGRAFI.slice(0, quantiParagrafi)) {
      y = paragrafo(apertura, { stile: 'bold' }, y)
      y = paragrafo(spiegazione, {}, y)
      y += interlinea * 0.4
    }
    return y
  }

  // --- colonna con l'elenco delle combinazioni ---------------------------
  function scriviCombinazioni(da: number, dalParagrafo: number): number {
    let y = paragrafo(OCCHIELLO, { stile: 'italic', colore: GRIGIO }, da)
    y += interlinea * 0.3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(dimensione)
    const colonna = Math.max(...VOCI.map(([etichetta]) => doc.getTextWidth(etichetta))) + 3
    for (const [etichetta, descrizione] of VOCI) {
      if (!soloMisura) scritte.push({
        testo: etichetta,
        dx: pad + colonnaDx,
        dy: y,
        dimensione,
        stile: 'bold',
        colore: principale,
        carattere: 'helvetica',
      })
      y = paragrafo(descrizione, { dx: colonna }, y)
      y += interlinea * 0.1
    }
    for (const [apertura, spiegazione] of PARAGRAFI.slice(dalParagrafo)) {
      y += interlinea * 0.3
      y = paragrafo(apertura, { stile: "bold" }, y)
      y = paragrafo(spiegazione, {}, y)
    }
    return y
  }

  if (dueColonne) {
    // Le spiegazioni occupano molto piu spazio dell elenco delle combinazioni:
    // si provano tutte le divisioni dei paragrafi fra le due colonne e si tiene
    // quella che le pareggia meglio, cosi il carattere puo restare piu grande.
    soloMisura = true
    let miglioreDivisione = PARAGRAFI.length
    let minimaAltezza = Infinity
    for (let divisione = 0; divisione <= PARAGRAFI.length; divisione++) {
      colonnaDx = 0
      const s = scriviTesto(y, divisione)
      colonnaDx = larghezzaColonna + distanza
      const d = scriviCombinazioni(y, divisione)
      if (Math.max(s, d) < minimaAltezza) {
        minimaAltezza = Math.max(s, d)
        miglioreDivisione = divisione
      }
    }
    soloMisura = false

    colonnaDx = 0
    const sinistra = scriviTesto(y, miglioreDivisione)
    colonnaDx = larghezzaColonna + distanza
    const destra = scriviCombinazioni(y, miglioreDivisione)
    colonnaDx = 0
    y = Math.max(sinistra, destra)
  } else {
    y = scriviTesto(y, PARAGRAFI.length)
    y += interlinea * 0.35
    y = scriviCombinazioni(y, PARAGRAFI.length)
  }

  // y e' gia' sulla riga dopo l'ultima: si torna su e si conta solo quanto
  // scendono le lettere, altrimenti in fondo resterebbe spazio vuoto
  const fondo = y - interlinea + dimensione * MM_PER_PUNTO * DISCENDENTE

  return {
    altezza: fondo + pad,
    disegna: (x: number, yBlocco: number) => {
      doc.setDrawColor(201, 162, 39)
      doc.setLineWidth(0.5)
      doc.line(x + pad, yBlocco + linea, x + larghezzaBlocco - pad, yBlocco + linea)

      for (const scritta of scritte) {
        doc.setFont(scritta.carattere, scritta.stile)
        doc.setFontSize(scritta.dimensione)
        doc.setTextColor(scritta.colore[0], scritta.colore[1], scritta.colore[2])
        doc.text(scritta.testo, x + scritta.dx, yBlocco + scritta.dy)
      }
    },
  }
}

/** Sceglie la dimensione di carattere piu' grande che sta nel riquadro. */
export function regolePerBlocco(
  doc: DisegnatorePdf,
  larghezza: number,
  altezza: number,
  testi: TestiRegole,
): { dimensione: number; regole: Regole } {
  const dimensioni = [11, 10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5]
  let scelta = {
    dimensione: dimensioni[0],
    regole: componiRegole(doc, dimensioni[0], larghezza, altezza, testi),
  }

  for (const dimensione of dimensioni) {
    scelta = { dimensione, regole: componiRegole(doc, dimensione, larghezza, altezza, testi) }
    if (scelta.regole.altezza <= altezza) break
  }
  return scelta
}
