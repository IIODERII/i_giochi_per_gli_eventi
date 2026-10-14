import { nomeFile } from '../../eventi/types'
import { attendiCaratteri, fontTela, misuratoreTela, scaricaTela, SERIF } from '../shared/stampa'
import { impagina, type Impaginazione } from './impaginazione'
import { FORMATI, type Papiro } from './types'

/** Colori fissi del papiro; quello dell'evento arriva come parametro. */
export const COLORI_PAPIRO = {
  pergamena: '#f5ead2',
  bianco: '#ffffff',
  inchiostro: '#2b2320',
  sottotitolo: '#786959',
  oro: '#c9a227',
}

export interface StilePapiro {
  /** Il colore dell'evento: titolo e cornice. */
  colore: string
  titolo: string
  sottotitolo: string
}

export function caricaImmagine(sorgente: string): Promise<HTMLImageElement> {
  return new Promise((risolvi, rifiuta) => {
    const immagine = new Image()
    immagine.onload = () => risolvi(immagine)
    immagine.onerror = () => rifiuta(new Error('Immagine non leggibile'))
    immagine.src = sorgente
  })
}

/** Impaginazione con le misure del canvas: e' quella dell'anteprima e del PNG. */
export function impaginaPerTela(papiro: Papiro, stile: StilePapiro, immagine: HTMLImageElement | null) {
  return impagina({
    papiro,
    titolo: stile.titolo,
    sottotitolo: stile.sottotitolo,
    proporzioneImmagine: immagine ? immagine.naturalWidth / immagine.naturalHeight : null,
    misura: misuratoreTela(SERIF, '500'),
    misuraTitolo: misuratoreTela(SERIF, '700'),
  })
}

/** I quattro rombi dorati agli angoli della cornice. */
function angoli(r: { x: number; y: number; larghezza: number; altezza: number }) {
  return [
    [r.x, r.y],
    [r.x + r.larghezza, r.y],
    [r.x, r.y + r.altezza],
    [r.x + r.larghezza, r.y + r.altezza],
  ] as const
}

/** Disegna il papiro su un contesto gia' scalato in millimetri. */
export function disegnaPapiro(
  ctx: CanvasRenderingContext2D,
  imp: Impaginazione,
  papiro: Papiro,
  stile: StilePapiro,
  immagine: HTMLImageElement | null,
) {
  const s = imp.scala
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = papiro.pergamena ? COLORI_PAPIRO.pergamena : COLORI_PAPIRO.bianco
  ctx.fillRect(0, 0, imp.larghezza, imp.altezza)

  // --- cornice -----------------------------------------------------------
  const c = imp.cornice
  ctx.strokeStyle = stile.colore
  ctx.lineWidth = 1.2 * s
  ctx.strokeRect(c.x, c.y, c.larghezza, c.altezza)
  ctx.lineWidth = 0.35 * s
  ctx.strokeRect(c.x + 2.5 * s, c.y + 2.5 * s, c.larghezza - 5 * s, c.altezza - 5 * s)
  ctx.fillStyle = COLORI_PAPIRO.oro
  const lato = 3 * s
  for (const [x, y] of angoli(c)) {
    ctx.beginPath()
    ctx.moveTo(x, y - lato)
    ctx.lineTo(x + lato, y)
    ctx.lineTo(x, y + lato)
    ctx.lineTo(x - lato, y)
    ctx.closePath()
    ctx.fill()
  }

  // --- intestazione ------------------------------------------------------
  ctx.textAlign = 'center'
  ctx.fillStyle = stile.colore
  ctx.font = fontTela(imp.titolo.dimensione, '700', SERIF)
  for (const riga of imp.titolo.righe) ctx.fillText(riga.testo, riga.x, riga.y)

  if (imp.sottotitolo) {
    ctx.fillStyle = COLORI_PAPIRO.sottotitolo
    ctx.font = fontTela(imp.sottotitolo.dimensione, 'italic 500', SERIF)
    ctx.fillText(imp.sottotitolo.riga.testo, imp.sottotitolo.riga.x, imp.sottotitolo.riga.y)
  }

  ctx.strokeStyle = COLORI_PAPIRO.oro
  ctx.lineWidth = 0.6 * s
  ctx.beginPath()
  ctx.moveTo(imp.linea.x1, imp.linea.y)
  ctx.lineTo(imp.linea.x2, imp.linea.y)
  ctx.stroke()

  // --- immagine e versi --------------------------------------------------
  if (immagine && imp.immagine) {
    const r = imp.immagine
    ctx.drawImage(immagine, r.x, r.y, r.larghezza, r.altezza)
  }

  ctx.textAlign = 'left'
  ctx.fillStyle = COLORI_PAPIRO.inchiostro
  ctx.font = fontTela(imp.dimensioneTesto, '500', SERIF)
  for (const riga of imp.righe) ctx.fillText(riga.testo, riga.x, riga.y)
}

/** Il PNG ad alta risoluzione, con la risoluzione adatta al formato. */
export async function scaricaPng(papiro: Papiro, stile: StilePapiro, foto: string | null) {
  await attendiCaratteri()
  const immagine = foto ? await caricaImmagine(foto) : null
  const imp = impaginaPerTela(papiro, stile, immagine)
  const scala = FORMATI[papiro.formato].dpi / 25.4

  const tela = document.createElement('canvas')
  tela.width = Math.round(imp.larghezza * scala)
  tela.height = Math.round(imp.altezza * scala)
  const ctx = tela.getContext('2d')
  if (!ctx) throw new Error('Il browser non permette di creare l immagine')
  ctx.scale(scala, scala)
  disegnaPapiro(ctx, imp, papiro, stile, immagine)

  await scaricaTela(tela, `${nomeFile(stile.titolo)}-papiro-${papiro.formato}.png`)
}
