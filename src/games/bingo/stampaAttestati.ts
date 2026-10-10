import type { jsPDF } from 'jspdf'
import { rgb, sfumatura, type Rgb } from '../../eventi/colore'
import { nomeFile } from '../../eventi/types'
import { mulberry32 } from '../shared/random'
import { MM_PER_PUNTO } from '../shared/stampa'
import type { FormaCartella } from './generator'

export type IdTemplate = 'classico' | 'festoso' | 'elegante' | 'pop'

export const TEMPLATE: { id: IdTemplate; nome: string; descrizione: string }[] = [
  { id: 'classico', nome: 'Classico', descrizione: 'Cornice dorata e corona d’alloro' },
  { id: 'festoso', nome: 'Festoso', descrizione: 'Coriandoli, stelle e un bollino colorato' },
  { id: 'elegante', nome: 'Elegante', descrizione: 'Linee sottili e lettere spaziate' },
  { id: 'pop', nome: 'Pop', descrizione: 'Colori pieni, raggi e timbro “Vincitore”' },
]

/** Quello che cambia da un attestato all'altro. */
export interface DatiAttestato {
  premio: string
  motivazione: string
  ultimaRiga: string
  /** Una voce per casella della mini-cartella: true = da segnare. */
  vincenti: boolean[]
  /** Quanto e' importante il premio: 0 il primo, 1 il bingo. Decide la misura. */
  importanza: number
}

/** Quello che resta uguale per tutti gli attestati dell'evento. */
export interface DatiEvento {
  titolo: string
  /** Es. "alla laurea di". */
  occasione: string
  nomi: string
  colore: string
  forma: FormaCartella
}

// --- Misure ---------------------------------------------------------------

const PAGINA = { larghezza: 210, altezza: 297 }

/**
 * Piu' grande il premio, piu' grande l'attestato: dall'ambo su un
 * cartoncino 10x15 fino al bingo su tutto il foglio, come nell'originale.
 */
const MISURE = [
  { larghezza: 100, altezza: 150 },
  { larghezza: 150, altezza: 200 },
  { larghezza: 180, altezza: 240 },
  { larghezza: 200, altezza: 250 },
  { larghezza: 210, altezza: 297 },
]

/**
 * Tutto il disegno e' pensato su un cartoncino 10x15: la carta converte le
 * misure verso quello vero. Le posizioni orizzontali scalano con la
 * larghezza, quelle verticali con l'altezza, caratteri e spessori con la
 * media delle due, cosi' nulla si deforma.
 */
interface Carta {
  x0: number
  y0: number
  sx: number
  sy: number
  k: number
  cx: number
  pienaPagina: boolean
}

function carta(importanza: number, crescente: boolean): Carta {
  const indice = crescente ? Math.round(importanza * (MISURE.length - 1)) : 0
  const { larghezza, altezza } = MISURE[indice]
  const sx = larghezza / 100
  const sy = altezza / 150
  return {
    x0: (PAGINA.larghezza - larghezza) / 2,
    y0: (PAGINA.altezza - altezza) / 2,
    sx,
    sy,
    k: Math.sqrt(sx * sy),
    cx: PAGINA.larghezza / 2,
    pienaPagina: larghezza >= PAGINA.larghezza,
  }
}

const BIANCO: Rgb = [255, 255, 255]
const CREMA: Rgb = [253, 251, 247]
const NASTRO: Rgb = [250, 243, 222]
const ORO: Rgb = [201, 162, 39]
const ORO_CHIARO: Rgb = [224, 199, 128]
const ORO_PIENO: Rgb = [233, 207, 120]
const GRIGIO: Rgb = [120, 105, 95]
const GRIGIO_CHIARO: Rgb = [150, 135, 125]
const INCHIOSTRO: Rgb = [45, 39, 35]

interface Colori {
  principale: Rgb
  chiaro: Rgb
  chiarissimo: Rgb
  scuro: Rgb
}

function colori(colore: string): Colori {
  return {
    principale: rgb(colore),
    chiaro: sfumatura(colore, 0.55),
    chiarissimo: sfumatura(colore, 0.92),
    scuro: sfumatura(colore, -0.35),
  }
}

// --- Il pennello: disegna in misure da cartoncino 10x15 ---------------------

type Carattere = 'times' | 'helvetica'
type Stile = 'normal' | 'bold' | 'italic' | 'bolditalic'
type Riempimento = 'S' | 'F' | 'FD'

interface OpzioniTesto {
  carattere: Carattere
  stile: Stile
  dimensione: number
  colore: Rgb
  /** Oltre questa larghezza il carattere si rimpicciolisce (nomi lunghi). */
  larghezza?: number
  /** Spazio in piu' fra le lettere. */
  spaziatura?: number
}

function pennello(doc: jsPDF, c: Carta) {
  const X = (dx: number) => c.x0 + dx * c.sx
  const Y = (dy: number) => c.y0 + dy * c.sy
  /** Da coordinate del foglio a coordinate del disegno (serve per centrare). */
  const centroX = (c.cx - c.x0) / c.sx

  function poligono(punti: [number, number][], stile: Riempimento) {
    const assoluti = punti.map(([px, py]) => [X(px), Y(py)])
    const relativi = assoluti.slice(1).map(([px, py], i) => [px - assoluti[i][0], py - assoluti[i][1]])
    doc.lines(relativi, assoluti[0][0], assoluti[0][1], [1, 1], stile, true)
  }

  return {
    X,
    Y,
    centroX,
    k: c.k,
    sx: c.sx,
    sy: c.sy,
    spessore(mm: number) {
      doc.setLineWidth(mm * c.k)
    },
    rettangolo(dx: number, dy: number, l: number, a: number, stile: Riempimento, raggio = 0) {
      if (raggio > 0) doc.roundedRect(X(dx), Y(dy), l * c.sx, a * c.sy, raggio * c.k, raggio * c.k, stile)
      else doc.rect(X(dx), Y(dy), l * c.sx, a * c.sy, stile)
    },
    linea(x1: number, y1: number, x2: number, y2: number) {
      doc.line(X(x1), Y(y1), X(x2), Y(y2))
    },
    cerchio(dx: number, dy: number, r: number, stile: Riempimento) {
      doc.circle(X(dx), Y(dy), r * c.k, stile)
    },
    poligono,
    /** Un'ellisse ruotata: le foglie dell'alloro, i coriandoli lunghi. */
    ellisse(dx: number, dy: number, rx: number, ry: number, angolo: number, stile: Riempimento) {
      const co = Math.cos(angolo)
      const si = Math.sin(angolo)
      const punti: [number, number][] = []
      for (let i = 0; i < 24; i++) {
        const t = (i / 24) * Math.PI * 2
        const ex = rx * Math.cos(t) * c.k
        const ey = ry * Math.sin(t) * c.k
        punti.push([dx + (ex * co - ey * si) / c.sx, dy + (ex * si + ey * co) / c.sy])
      }
      poligono(punti, stile)
    },
    stella(dx: number, dy: number, r: number, stile: Riempimento, giro = 0) {
      const punti: [number, number][] = []
      for (let i = 0; i < 10; i++) {
        const raggio = (i % 2 === 0 ? r : r * 0.45) * c.k
        const a = -Math.PI / 2 + giro + (i * Math.PI) / 5
        punti.push([dx + (raggio * Math.cos(a)) / c.sx, dy + (raggio * Math.sin(a)) / c.sy])
      }
      poligono(punti, stile)
    },
    rombo(dx: number, dy: number, r: number) {
      const rx = (r * 0.7 * c.k) / c.sx
      const ry = (r * c.k) / c.sy
      poligono(
        [
          [dx, dy - ry],
          [dx + rx, dy],
          [dx, dy + ry],
          [dx - rx, dy],
        ],
        'F',
      )
    },
    /** Larghezza di un testo, gia' in misure da cartoncino. */
    larghezzaTesto(testo: string, carattere: Carattere, stile: Stile, dimensione: number, spaziatura = 0) {
      doc.setFont(carattere, stile)
      doc.setFontSize(dimensione * c.k)
      return (doc.getTextWidth(testo) + spaziatura * c.k * Math.max(0, testo.length - 1)) / c.sx
    },
    /** Altezza delle maiuscole, per centrare il testo in verticale. */
    maiuscole(dimensione: number) {
      return (dimensione * c.k * MM_PER_PUNTO * 0.7) / c.sy
    },
    /** Scrive un testo centrato; restituisce la larghezza occupata. */
    scrivi(testo: string, dy: number, o: OpzioniTesto, dx = centroX): number {
      const spaziatura = o.spaziatura ?? 0
      let dimensione = o.dimensione
      const misura = (d: number) => this.larghezzaTesto(testo, o.carattere, o.stile, d, spaziatura)
      while (o.larghezza && dimensione > 4 && misura(dimensione) > o.larghezza) dimensione -= 0.25
      const larghezza = misura(dimensione)
      doc.setFontSize(dimensione * c.k)
      doc.setTextColor(...o.colore)
      doc.text(
        testo,
        X(dx - larghezza / 2),
        Y(dy),
        spaziatura ? { charSpace: spaziatura * c.k } : {},
      )
      return larghezza
    },
  }
}

type Pennello = ReturnType<typeof pennello>

/** Il bordo sottile e i segni agli angoli, fuori dal cartoncino, per tagliarlo dritto. */
function segniDiTaglio(doc: jsPDF, c: Carta, bordo: boolean) {
  if (c.pienaPagina) return
  const larghezza = 100 * c.sx
  const altezza = 150 * c.sy
  doc.setDrawColor(192, 176, 160)
  if (bordo) {
    doc.setLineWidth(0.1)
    doc.rect(c.x0, c.y0, larghezza, altezza, 'S')
  }
  doc.setLineWidth(0.2)
  const distanza = 1.5
  const lunghezza = 6
  for (const [ax, sx] of [
    [c.x0, -1],
    [c.x0 + larghezza, 1],
  ]) {
    for (const [ay, sy] of [
      [c.y0, -1],
      [c.y0 + altezza, 1],
    ]) {
      doc.line(ax + sx * distanza, ay, ax + sx * (distanza + lunghezza), ay)
      doc.line(ax, ay + sy * distanza, ax, ay + sy * (distanza + lunghezza))
    }
  }
}

interface StileGriglia {
  linee: Rgb
  pieno: Rgb
  vuoto: Rgb
  evidenzia: Rgb
}

/**
 * La mini-cartella con le caselle vincenti segnate, dentro un riquadro
 * dorato. Le caselle si rimpiccioliscono se la cartella e' grande.
 */
function miniCartella(doc: jsPDF, p: Pennello, top: number, dati: DatiAttestato, forma: FormaCartella, stile: StileGriglia) {
  // il lato e' in mm "veri" del cartoncino 10x15: scala come i caratteri
  const lato = Math.min(3.65, 11 / forma.righe, 24 / forma.colonne) * p.k
  const larghezza = lato * forma.colonne
  const altezza = lato * forma.righe
  const sinistra = p.X(p.centroX) - larghezza / 2
  const cima = p.Y(top)
  const margine = 1.2 * p.k

  doc.setDrawColor(...stile.evidenzia)
  doc.setLineWidth(0.22 * p.k)
  doc.roundedRect(sinistra - margine, cima - margine, larghezza + margine * 2, altezza + margine * 2, 0.6 * p.k, 0.6 * p.k, 'S')

  doc.setDrawColor(...stile.linee)
  doc.setLineWidth(0.13 * p.k)
  for (let i = 0; i < forma.colonne * forma.righe; i++) {
    doc.rect(sinistra + (i % forma.colonne) * lato, cima + Math.floor(i / forma.colonne) * lato, lato, lato, 'S')
  }

  for (let i = 0; i < forma.colonne * forma.righe; i++) {
    const cx = sinistra + (i % forma.colonne) * lato + lato / 2
    const cy = cima + Math.floor(i / forma.colonne) * lato + lato / 2
    if (dati.vincenti[i]) {
      doc.setFillColor(...stile.pieno)
      doc.circle(cx, cy, lato * 0.26, 'F')
    } else {
      doc.setFillColor(...BIANCO)
      doc.setDrawColor(...stile.vuoto)
      doc.setLineWidth(0.17 * p.k)
      doc.circle(cx, cy, lato * 0.2, 'FD')
    }
  }
}

// --- Classico: l'attestato originale della laurea di Sara ------------------

function classico(doc: jsPDF, p: Pennello, dati: DatiAttestato, evento: DatiEvento) {
  const c = colori(evento.colore)
  const cx = p.centroX

  doc.setDrawColor(...ORO)
  p.spessore(0.29)
  p.rettangolo(8, 8, 84, 134, 'S', 2)
  doc.setDrawColor(...ORO_CHIARO)
  p.spessore(0.13)
  p.rettangolo(11.5, 11.5, 77, 127, 'S', 1.5)

  // la corona d'alloro, aperta in alto, attorno al titolo del gioco
  doc.setDrawColor(...ORO)
  p.spessore(0.22)
  for (const lato of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      // da in alto (ore 10 o ore 2) giu' fino quasi in fondo
      const a = Math.PI / 2 + lato * (Math.PI * 0.12 + (i / 7) * Math.PI * 0.68)
      const fx = cx + Math.cos(a) * 12.5
      const fy = 28.5 + Math.sin(a) * 10.5
      p.ellisse(fx, fy, 2.1, 0.85, a + Math.PI / 2, 'S')
    }
  }
  p.scrivi(evento.titolo, 29.3, {
    carattere: 'times',
    stile: 'bold',
    dimensione: 11.2,
    colore: c.principale,
    larghezza: 20,
  })

  p.scrivi('Congratulazioni!', 50.7, {
    carattere: 'times',
    stile: 'bold',
    dimensione: 24,
    colore: c.principale,
    larghezza: 74,
  })
  p.scrivi('hai fatto', 58.3, { carattere: 'times', stile: 'italic', dimensione: 10.3, colore: GRIGIO })

  // il nastro color crema con il premio
  const testoPremio = p.larghezzaTesto(dati.premio, 'times', 'bold', 33.6)
  // 12,5 mm di aria per lato, come nell'originale; con le parole lunghe il nastro
  // si ferma a poco piu' di meta' cartoncino e si rimpicciolisce il testo
  const aria = (25 * p.k) / p.sx
  const larghezzaNastro = Math.min(56, testoPremio + aria)
  doc.setFillColor(...NASTRO)
  doc.setDrawColor(...ORO_CHIARO)
  p.spessore(0.22)
  p.rettangolo(cx - larghezzaNastro / 2, 61.9, larghezzaNastro, 18.2, 'FD', 0.5)
  p.scrivi(dati.premio, 75.3, {
    carattere: 'times',
    stile: 'bold',
    dimensione: 33.6,
    colore: c.principale,
    larghezza: larghezzaNastro - aria * 0.6,
  })

  p.scrivi(evento.occasione, 87.8, { carattere: 'times', stile: 'italic', dimensione: 10.3, colore: GRIGIO })
  p.scrivi(evento.nomi, 96.9, {
    carattere: 'times',
    stile: 'bold',
    dimensione: 20.7,
    colore: c.principale,
    larghezza: 72,
  })

  miniCartella(doc, p, 104.5, dati, evento.forma, {
    linee: INCHIOSTRO,
    pieno: c.principale,
    vuoto: GRIGIO_CHIARO,
    evidenzia: ORO,
  })

  p.scrivi(dati.motivazione, 123.3, {
    carattere: 'times',
    stile: 'italic',
    dimensione: 7.3,
    colore: GRIGIO,
    larghezza: 72,
  })
  doc.setDrawColor(...ORO)
  p.spessore(0.18)
  p.linea(cx - 13.7, 129.4, cx + 13.7, 129.4)
  p.scrivi(dati.ultimaRiga, 134.9, {
    carattere: 'helvetica',
    stile: 'normal',
    dimensione: 6,
    colore: GRIGIO_CHIARO,
    larghezza: 72,
  })
}

// --- Festoso: coriandoli e bollino ----------------------------------------

function festoso(doc: jsPDF, p: Pennello, dati: DatiAttestato, evento: DatiEvento) {
  const c = colori(evento.colore)
  const cx = p.centroX
  const palette: Rgb[] = [c.principale, ORO, c.chiaro, c.scuro, ORO_PIENO]

  doc.setFillColor(...c.chiarissimo)
  p.rettangolo(0, 0, 100, 150, 'F')

  // coriandoli nella cornice e nella fascia alta; con lo stesso seme escono
  // sempre uguali
  const caso = mulberry32(7)
  const zone = [
    { x1: 1, x2: 99, y1: 1, y2: 7 },
    { x1: 1, x2: 99, y1: 143, y2: 149 },
    { x1: 1, x2: 7, y1: 7, y2: 143 },
    { x1: 93, x2: 99, y1: 7, y2: 143 },
    { x1: 10, x2: 90, y1: 9, y2: 19 },
  ]
  for (let i = 0; i < 90; i++) {
    const zona = zone[i < 70 ? i % 4 : 4]
    const px = zona.x1 + caso() * (zona.x2 - zona.x1)
    const py = zona.y1 + caso() * (zona.y2 - zona.y1)
    doc.setFillColor(...palette[Math.floor(caso() * palette.length)])
    const forma = caso()
    if (forma < 0.45) p.ellisse(px, py, 1.4, 0.55, caso() * Math.PI, 'F')
    else if (forma < 0.8) p.cerchio(px, py, 0.5 + caso() * 0.4, 'F')
    else p.stella(px, py, 1.1 + caso() * 0.5, 'F', caso())
  }

  // il pannello bianco su cui sta il testo
  doc.setFillColor(...BIANCO)
  p.rettangolo(8, 21, 84, 121, 'F', 4)

  p.scrivi(evento.titolo.toUpperCase(), 29, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 9,
    colore: c.principale,
    spaziatura: 0.8,
    larghezza: 70,
  })
  p.scrivi('Evviva!', 45, { carattere: 'times', stile: 'bolditalic', dimensione: 30, colore: c.principale })
  p.scrivi('hai fatto', 53, { carattere: 'helvetica', stile: 'normal', dimensione: 9.5, colore: GRIGIO })

  // il bollino colorato con il premio, fra due stelle dorate
  const testo = dati.premio.toUpperCase()
  const larghezza = Math.min(66, p.larghezzaTesto(testo, 'helvetica', 'bold', 26) + 14)
  doc.setFillColor(...c.principale)
  p.rettangolo(cx - larghezza / 2, 57, larghezza, 17, 'F', 8.5)
  p.scrivi(testo, 65.5 + p.maiuscole(26) / 2, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 26,
    colore: CREMA,
    larghezza: larghezza - 10,
  })
  doc.setFillColor(...ORO)
  p.stella(cx - larghezza / 2 - 5, 65.5, 3, 'F')
  p.stella(cx + larghezza / 2 + 5, 65.5, 3, 'F')

  p.scrivi(evento.occasione, 85, { carattere: 'times', stile: 'italic', dimensione: 10.5, colore: GRIGIO })
  p.scrivi(evento.nomi, 94, {
    carattere: 'times',
    stile: 'bold',
    dimensione: 20,
    colore: c.principale,
    larghezza: 72,
  })

  miniCartella(doc, p, 100.5, dati, evento.forma, {
    linee: c.chiaro,
    pieno: c.principale,
    vuoto: c.chiaro,
    evidenzia: ORO,
  })

  p.scrivi(dati.motivazione, 122, {
    carattere: 'helvetica',
    stile: 'normal',
    dimensione: 6.8,
    colore: GRIGIO,
    larghezza: 72,
  })
  p.scrivi(dati.ultimaRiga, 130, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 7.5,
    colore: c.principale,
    larghezza: 72,
  })
}

// --- Elegante: linee sottili e lettere spaziate ----------------------------

function divisorio(doc: jsPDF, p: Pennello, y: number, mezzaLarghezza: number, colore: Rgb) {
  const cx = p.centroX
  doc.setDrawColor(...colore)
  p.spessore(0.15)
  p.linea(cx - mezzaLarghezza, y, cx - 2.2, y)
  p.linea(cx + 2.2, y, cx + mezzaLarghezza, y)
  doc.setFillColor(...colore)
  p.rombo(cx, y, 1.2)
}

function elegante(doc: jsPDF, p: Pennello, dati: DatiAttestato, evento: DatiEvento) {
  const c = colori(evento.colore)
  const cx = p.centroX

  doc.setDrawColor(...c.principale)
  p.spessore(0.25)
  p.rettangolo(7, 7, 86, 136, 'S')
  doc.setDrawColor(...ORO)
  p.spessore(0.12)
  p.rettangolo(8.4, 8.4, 83.2, 133.2, 'S')
  doc.setFillColor(...ORO)
  for (const [px, py] of [
    [7, 7],
    [93, 7],
    [7, 143],
    [93, 143],
  ]) {
    p.rombo(px, py, 1.6)
  }

  p.scrivi(evento.titolo.toUpperCase(), 23, {
    carattere: 'times',
    stile: 'normal',
    dimensione: 8,
    colore: c.principale,
    spaziatura: 1.2,
    larghezza: 70,
  })
  divisorio(doc, p, 27.5, 14, ORO)

  p.scrivi('Congratulazioni', 46, {
    carattere: 'times',
    stile: 'italic',
    dimensione: 25,
    colore: c.principale,
    larghezza: 74,
  })
  p.scrivi('hai fatto', 54.5, { carattere: 'times', stile: 'italic', dimensione: 10, colore: GRIGIO })

  // il premio fra due filetti dorati
  const larghezza = p.scrivi(dati.premio, 71, {
    carattere: 'times',
    stile: 'bold',
    dimensione: 32,
    colore: c.principale,
    larghezza: 62,
  })
  const yFiletto = 71 - p.maiuscole(32) / 2
  doc.setDrawColor(...ORO)
  p.spessore(0.15)
  p.linea(14, yFiletto, cx - larghezza / 2 - 3, yFiletto)
  p.linea(cx + larghezza / 2 + 3, yFiletto, 86, yFiletto)

  p.scrivi(evento.occasione, 83, { carattere: 'times', stile: 'italic', dimensione: 10, colore: GRIGIO })
  p.scrivi(evento.nomi, 93, {
    carattere: 'times',
    stile: 'normal',
    dimensione: 21,
    colore: c.principale,
    larghezza: 72,
  })

  miniCartella(doc, p, 100, dati, evento.forma, {
    linee: c.chiaro,
    pieno: c.principale,
    vuoto: c.chiaro,
    evidenzia: ORO,
  })

  divisorio(doc, p, 117.5, 10, ORO)
  p.scrivi(dati.motivazione, 124, {
    carattere: 'times',
    stile: 'italic',
    dimensione: 7.8,
    colore: GRIGIO,
    larghezza: 72,
  })
  p.scrivi(dati.ultimaRiga.toUpperCase(), 133, {
    carattere: 'times',
    stile: 'normal',
    dimensione: 6.3,
    colore: c.principale,
    spaziatura: 0.45,
    larghezza: 72,
  })
}

// --- Pop: colori pieni, raggi e timbro ------------------------------------

function pop(doc: jsPDF, p: Pennello, dati: DatiAttestato, evento: DatiEvento) {
  const c = colori(evento.colore)
  const cx = p.centroX

  doc.setFillColor(...c.principale)
  p.rettangolo(0, 0, 100, 150, 'F')

  // i raggi dietro al timbro, un po' piu' chiari del fondo
  const centroY = 33
  doc.setFillColor(...sfumatura(evento.colore, 0.14))
  const raggi = 16
  for (let i = 0; i < raggi; i += 2) {
    const a1 = (i / raggi) * Math.PI * 2
    const a2 = ((i + 1) / raggi) * Math.PI * 2
    p.poligono(
      [
        [cx, centroY],
        [cx + Math.cos(a1) * 31, centroY + Math.sin(a1) * 31],
        [cx + Math.cos(a2) * 31, centroY + Math.sin(a2) * 31],
      ],
      'F',
    )
  }

  p.scrivi(evento.titolo.toUpperCase(), 8.5, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 8,
    colore: CREMA,
    spaziatura: 1,
    larghezza: 80,
  })

  // il timbro "Vincitore", leggermente storto
  doc.setFillColor(...ORO_PIENO)
  doc.setDrawColor(...c.scuro)
  p.spessore(0.6)
  p.cerchio(cx, centroY, 16, 'FD')
  p.spessore(0.25)
  doc.setLineDashPattern([0.8 * p.k, 0.6 * p.k], 0)
  p.cerchio(cx, centroY, 13.8, 'S')
  doc.setLineDashPattern([], 0)
  const angolo = 12
  const rad = (angolo * Math.PI) / 180
  const parola = 'VINCITORE'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5 * p.k)
  const w = doc.getTextWidth(parola)
  const h = 12.5 * p.k * MM_PER_PUNTO * 0.7
  doc.setTextColor(...c.scuro)
  doc.text(
    parola,
    p.X(cx) - (w / 2) * Math.cos(rad) + (h / 2) * Math.sin(rad),
    p.Y(centroY) + (w / 2) * Math.sin(rad) + (h / 2) * Math.cos(rad),
    { angle: angolo },
  )
  doc.setFillColor(...c.scuro)
  p.stella(cx - 6, centroY - 7.5, 1.6, 'F')
  p.stella(cx + 6.5, centroY + 7.2, 1.6, 'F')

  // il pannello bianco con l'ombra piena, da fumetto
  doc.setFillColor(...c.scuro)
  p.rettangolo(9.5, 56.5, 84, 86, 'F', 3)
  doc.setFillColor(...BIANCO)
  p.rettangolo(8, 55, 84, 86, 'F', 3)

  p.scrivi('HAI FATTO', 63.5, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 9,
    colore: GRIGIO,
    spaziatura: 0.8,
  })
  p.scrivi(`${dati.premio.toUpperCase()}!`, 78, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 34,
    colore: c.principale,
    larghezza: 76,
  })
  p.scrivi(evento.occasione.toUpperCase(), 86.5, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 7.5,
    colore: GRIGIO,
    spaziatura: 0.6,
    larghezza: 76,
  })
  p.scrivi(evento.nomi, 95, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 18,
    colore: INCHIOSTRO,
    larghezza: 76,
  })

  miniCartella(doc, p, 100.5, dati, evento.forma, {
    linee: INCHIOSTRO,
    pieno: c.principale,
    vuoto: GRIGIO_CHIARO,
    evidenzia: ORO,
  })

  p.scrivi(dati.motivazione, 121.5, {
    carattere: 'helvetica',
    stile: 'normal',
    dimensione: 6.8,
    colore: GRIGIO,
    larghezza: 76,
  })

  // l'ultima riga in una pillola colorata
  const larghezzaPillola = Math.min(78, p.larghezzaTesto(dati.ultimaRiga, 'helvetica', 'bold', 7.2) + 8)
  doc.setFillColor(...c.principale)
  p.rettangolo(cx - larghezzaPillola / 2, 126.5, larghezzaPillola, 6.5, 'F', 3.25)
  p.scrivi(dati.ultimaRiga, 129.75 + p.maiuscole(7.2) / 2, {
    carattere: 'helvetica',
    stile: 'bold',
    dimensione: 7.2,
    colore: CREMA,
    larghezza: larghezzaPillola - 4,
  })
}

const DISEGNA: Record<IdTemplate, (doc: jsPDF, p: Pennello, dati: DatiAttestato, evento: DatiEvento) => void> = {
  classico,
  festoso,
  elegante,
  pop,
}

/** Gli stili con il fondo pieno non hanno bisogno del bordo sottile da ritagliare. */
const FONDO_PIENO: Record<IdTemplate, boolean> = {
  classico: false,
  festoso: true,
  elegante: false,
  pop: true,
}

/** Un attestato per pagina A4, al centro, con i segni per ritagliarlo. */
export async function costruisciAttestati(
  template: IdTemplate,
  attestati: DatiAttestato[],
  evento: DatiEvento,
  crescente = true,
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  attestati.forEach((dati, i) => {
    if (i > 0) doc.addPage()
    const c = carta(dati.importanza, crescente)
    DISEGNA[template](doc, pennello(doc, c), dati, evento)
    segniDiTaglio(doc, c, !FONDO_PIENO[template])
  })
  return doc
}

export async function scaricaAttestati(
  template: IdTemplate,
  attestati: DatiAttestato[],
  evento: DatiEvento,
  crescente = true,
) {
  const doc = await costruisciAttestati(template, attestati, evento, crescente)
  doc.save(`${nomeFile(evento.titolo)}-attestati-${template}.pdf`)
}
