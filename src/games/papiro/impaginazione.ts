import { MM_PER_PUNTO, type Misuratore } from '../shared/stampa'
import { colonneImmagine, FORMATI, type Papiro } from './types'

/**
 * L'impaginazione del papiro: titolo in alto, l'immagine al centro e i versi
 * in colonne tutto intorno. Le colonne centrali si interrompono sopra
 * l'immagine e riprendono sotto. Si legge colonna per colonna, da sinistra.
 *
 * Tutto e' in millimetri e viene calcolato una volta sola: anteprima, PNG e
 * PDF disegnano le stesse posizioni (ognuno con il suo misuratore, perche'
 * canvas e jsPDF hanno caratteri leggermente diversi).
 */

export interface Rettangolo {
  x: number
  y: number
  larghezza: number
  altezza: number
}

/** Una riga di testo: y e' la linea di base. */
export interface RigaImpaginata {
  testo: string
  x: number
  y: number
}

export interface Impaginazione {
  larghezza: number
  altezza: number
  centro: number
  /** Spessore di riferimento per cornici e linee: cresce con il foglio. */
  scala: number
  cornice: Rettangolo
  titolo: { righe: RigaImpaginata[]; dimensione: number }
  sottotitolo: { riga: RigaImpaginata; dimensione: number } | null
  linea: { x1: number; x2: number; y: number }
  immagine: Rettangolo | null
  righe: RigaImpaginata[]
  dimensioneTesto: number
  /**
   * Sotto questa dimensione il testo si legge solo da vicino. Cresce con il
   * foglio, perche' un poster grande si guarda da piu' lontano.
   */
  dimensioneComoda: number
  /** Quanta parte dello spazio per i versi e' occupata, da 0 a 1. */
  occupazione: number
  /** Versi rimasti fuori perche' non c'e' piu' spazio nemmeno al carattere minimo. */
  versiFuori: number
}

export interface DatiImpaginazione {
  papiro: Papiro
  titolo: string
  sottotitolo: string
  /** Larghezza diviso altezza; null se non c'e' l'immagine. */
  proporzioneImmagine: number | null
  /** Per i versi e il sottotitolo. */
  misura: Misuratore
  /** Per il titolo, che e' in grassetto. */
  misuraTitolo: Misuratore
}

/** Le strofe sono separate da righe vuote; spazi in fondo e righe vuote in piu' non contano. */
export function dividiStrofe(testo: string): string[][] {
  return testo
    .split(/\n\s*\n/)
    .map((blocco) =>
      blocco
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean),
    )
    .filter((strofa) => strofa.length > 0)
}

interface Segmento {
  x: number
  y: number
  altezza: number
}

interface Disposizione {
  righe: RigaImpaginata[]
  versiFuori: number
}

export function impagina(dati: DatiImpaginazione): Impaginazione {
  const { papiro, misura, misuraTitolo } = dati
  const foglio = FORMATI[papiro.formato]
  const larghezza = foglio.larghezza
  const altezza = foglio.altezza
  // tutto e' proporzionato su un A3: un 70×100 e' lo stesso disegno, piu' grande
  const s = larghezza / 297
  const centro = larghezza / 2

  const margine = 12 * s
  const cornice = { x: margine, y: margine, larghezza: larghezza - 2 * margine, altezza: altezza - 2 * margine }
  const interno = 10 * s
  const sinistra = margine + interno
  const utile = larghezza - 2 * sinistra

  // --- intestazione ------------------------------------------------------
  let dimensioneTitolo = 46 * s
  let righeTitolo = misuraTitolo(dati.titolo, utile, dimensioneTitolo)
  while (righeTitolo.length > 1 && dimensioneTitolo > 24 * s) {
    dimensioneTitolo -= 2 * s
    righeTitolo = misuraTitolo(dati.titolo, utile, dimensioneTitolo)
  }
  const altezzaRigaTitolo = dimensioneTitolo * MM_PER_PUNTO * 1.05
  let y = margine + interno + dimensioneTitolo * MM_PER_PUNTO * 0.78
  const titolo = {
    dimensione: dimensioneTitolo,
    righe: righeTitolo.map((testo, i) => ({ testo, x: centro, y: y + i * altezzaRigaTitolo })),
  }
  y += (righeTitolo.length - 1) * altezzaRigaTitolo

  let sottotitolo: Impaginazione['sottotitolo'] = null
  if (dati.sottotitolo.trim()) {
    let dimensione = 17 * s
    while (misura(dati.sottotitolo, utile, dimensione).length > 1 && dimensione > 9 * s) dimensione -= s
    y += dimensione * MM_PER_PUNTO * 1.5
    sottotitolo = { dimensione, riga: { testo: dati.sottotitolo, x: centro, y } }
  }
  y += 6 * s
  const linea = { x1: centro - 45 * s, x2: centro + 45 * s, y }

  // --- spazio per i versi e per l'immagine -------------------------------
  const alto = y + 9 * s
  const basso = altezza - margine - interno
  const altezzaArea = basso - alto
  const colonne = papiro.colonne
  const spazio = 7 * s
  const larghezzaColonna = (utile - (colonne - 1) * spazio) / colonne
  const xColonna = (c: number) => sinistra + c * (larghezzaColonna + spazio)

  let immagine: Rettangolo | null = null
  let primaCentrale = colonne
  let ultimaCentrale = -1
  if (dati.proporzioneImmagine) {
    const k = colonneImmagine(colonne, papiro.immagine)
    primaCentrale = (colonne - k) / 2
    ultimaCentrale = primaCentrale + k - 1
    const larghezzaBox = k * larghezzaColonna + (k - 1) * spazio
    let larghezzaImmagine = larghezzaBox
    let altezzaImmagine = larghezzaBox / dati.proporzioneImmagine
    const altezzaMassima = altezzaArea * 0.6
    if (altezzaImmagine > altezzaMassima) {
      altezzaImmagine = altezzaMassima
      larghezzaImmagine = altezzaImmagine * dati.proporzioneImmagine
    }
    immagine = {
      x: xColonna(primaCentrale) + (larghezzaBox - larghezzaImmagine) / 2,
      y: alto + (altezzaArea - altezzaImmagine) / 2,
      larghezza: larghezzaImmagine,
      altezza: altezzaImmagine,
    }
  }

  // i pezzi di colonna dove vanno i versi, nell'ordine di lettura
  const segmenti: Segmento[] = []
  const respiro = 5 * s
  for (let c = 0; c < colonne; c++) {
    const x = xColonna(c)
    if (immagine && c >= primaCentrale && c <= ultimaCentrale) {
      segmenti.push({ x, y: alto, altezza: immagine.y - respiro - alto })
      const sotto = immagine.y + immagine.altezza + respiro
      segmenti.push({ x, y: sotto, altezza: basso - sotto })
    } else {
      segmenti.push({ x, y: alto, altezza: altezzaArea })
    }
  }

  // --- versi -------------------------------------------------------------
  const strofe = dividiStrofe(papiro.testo)
  const totaleVersi = strofe.reduce((n, strofa) => n + strofa.length, 0)

  /** Le righe di ogni strofa a quella dimensione: i versi lunghi vanno a capo rientrati. */
  function componi(dimensione: number) {
    const rientro = dimensione * MM_PER_PUNTO * 1.2
    return strofe.map((strofa) =>
      strofa.map((verso) =>
        misura(verso, larghezzaColonna - rientro, dimensione).map((testo, i) => ({
          testo,
          rientro: i > 0 ? rientro : 0,
        })),
      ),
    )
  }

  /**
   * Mette le strofe nei segmenti senza spezzarle, se possibile. "riempimento"
   * sotto 1 lascia vuota la parte bassa di ogni colonna: serve a distribuire
   * un testo corto su tutte le colonne invece di riempire solo le prime.
   */
  function disponi(
    dimensione: number,
    riempimento: number,
    composte: ReturnType<typeof componi> = componi(dimensione),
  ): Disposizione {
    const interlinea = dimensione * MM_PER_PUNTO * 1.3
    const staccoStrofe = interlinea * 0.7
    const ascesa = interlinea * 0.74
    const righe: RigaImpaginata[] = []
    let indice = 0
    let usato = 0
    let versiMessi = 0

    for (const strofa of composte) {
      const righeStrofa = strofa.reduce((n, verso) => n + verso.length, 0)
      const altezzaStrofa = righeStrofa * interlinea

      // si cerca un segmento dove la strofa stia intera
      while (indice < segmenti.length) {
        // il riempimento vale solo per aggiungere: la prima strofa di una colonna ha tutto lo spazio
        const limite = segmenti[indice].altezza * (usato > 0 ? riempimento : 1)
        const serve = (usato > 0 ? staccoStrofe : 0) + altezzaStrofa
        if (usato + serve <= limite + 0.01) break
        // la strofa e' piu' lunga di un segmento intero: la si spezza
        if (usato === 0 && altezzaStrofa > segmenti[indice].altezza) break
        indice++
        usato = 0
      }
      if (indice >= segmenti.length) break
      if (usato > 0) usato += staccoStrofe

      for (const verso of strofa) {
        for (const riga of verso) {
          if (usato + interlinea > segmenti[indice].altezza + 0.01) {
            indice++
            usato = 0
            if (indice >= segmenti.length) break
          }
          const segmento = segmenti[indice]
          righe.push({ testo: riga.testo, x: segmento.x + riga.rientro, y: segmento.y + usato + ascesa })
          usato += interlinea
        }
        if (indice >= segmenti.length) break
        versiMessi++
      }
      if (indice >= segmenti.length) break
    }
    return { righe, versiFuori: totaleVersi - versiMessi }
  }

  // si scende fino a 6 punti piuttosto che lasciare fuori dei versi
  const minima = 6
  const massima = 15 * s
  const comoda = 8 * Math.sqrt(s)

  /** La dimensione piu' grande fra le due per cui vale la condizione, cercata per dimezzamenti. */
  function piuGrande(da: number, a: number, va: (dimensione: number) => boolean): number | null {
    if (da > a || !va(da)) return null
    if (va(a)) return a
    let si = da
    let no = a
    while (no - si > 0.2) {
      const prova = (si + no) / 2
      if (va(prova)) si = prova
      else no = prova
    }
    return si
  }

  const ciSta = (dimensione: number) => disponi(dimensione, 1).versiFuori === 0
  /** In un papiro ogni verso sta su una riga: se ne tollera qualcuno a capo, non la meta'. */
  const pocheACapo = (dimensione: number) => {
    const versi = componi(dimensione).flat()
    return versi.filter((righe) => righe.length > 1).length <= versi.length * 0.15
  }

  // prima si cerca un carattere con pochi a capo, purche' resti leggibile;
  // altrimenti il piu' grande a cui sta tutto, e in ultimo il minimo
  const dimensioneTesto =
    piuGrande(Math.max(minima, comoda), massima, (d) => pocheACapo(d) && ciSta(d)) ??
    piuGrande(minima, massima, ciSta) ??
    minima

  // poi lo stesso testo, distribuito il piu' possibile su tutte le colonne
  const composte = componi(dimensioneTesto)
  let disposizione = disponi(dimensioneTesto, 1, composte)
  if (disposizione.versiFuori === 0 && totaleVersi > 0) {
    for (let riempimento = 0.05; riempimento < 1; riempimento += 0.02) {
      const prova = disponi(dimensioneTesto, riempimento, composte)
      if (prova.versiFuori === 0) {
        disposizione = prova
        break
      }
    }
  }

  return {
    larghezza,
    altezza,
    centro,
    scala: s,
    cornice,
    titolo,
    sottotitolo,
    linea,
    immagine,
    righe: disposizione.righe,
    dimensioneTesto,
    dimensioneComoda: comoda,
    versiFuori: disposizione.versiFuori,
    occupazione: Math.min(
      1,
      (composte.flat(2).length * dimensioneTesto * MM_PER_PUNTO * 1.3) /
        segmenti.reduce((tot, segmento) => tot + Math.max(0, segmento.altezza), 0),
    ),
  }
}
