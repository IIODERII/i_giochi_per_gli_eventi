import type { Cruciverba } from './generator'
import { sfumaturaHex } from '../../eventi/colore'
import { nomeFile } from '../../eventi/types'
import {
  attendiCaratteri,
  fontTela as font,
  misuratoreTela,
  SANS,
  scaricaTela,
  SERIF,
} from '../shared/stampa'
import { calcolaPoster, type FormatoFoglio, type StileStampa } from './poster'

/**
 * Punti per pollice dell'immagine prodotta. 300 e' qualita' di stampa;
 * per l'A3 si scende un po' per non generare un file enorme.
 */
const DPI: Record<FormatoFoglio, number> = { a4: 300, a3: 200 }

/**
 * Stesso cartellone del PDF, ma come immagine PNG ad alta risoluzione:
 * il disegno e' vettoriale fino all'ultimo momento, quindi non si sgrana.
 */
export async function scaricaImmagine(
  cruciverba: Cruciverba,
  stile: StileStampa,
  formato: FormatoFoglio = 'a4',
) {
  await attendiCaratteri()

  const poster = calcolaPoster(cruciverba, formato, misuratoreTela(), stile.titolo)
  const numeri = sfumaturaHex(stile.colore, 0.15)
  const scala = DPI[formato] / 25.4

  const tela = document.createElement('canvas')
  tela.width = Math.round(poster.larghezza * scala)
  tela.height = Math.round(poster.altezza * scala)
  const ctx = tela.getContext('2d')
  if (!ctx) throw new Error('Il browser non permette di creare l immagine')

  ctx.scale(scala, scala)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, poster.larghezza, poster.altezza)

  // --- intestazione ------------------------------------------------------
  ctx.textAlign = 'center'
  ctx.fillStyle = stile.colore
  ctx.font = font(poster.titolo.dimensione, '700', SERIF)
  ctx.fillText(poster.titolo.testo, poster.centro, poster.titolo.y)

  ctx.fillStyle = '#786959'
  ctx.font = font(poster.sottotitolo.dimensione, 'italic 500', SERIF)
  ctx.fillText(poster.sottotitolo.testo, poster.centro, poster.sottotitolo.y)

  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.moveTo(poster.linea.x1, poster.linea.y)
  ctx.lineTo(poster.linea.x2, poster.linea.y)
  ctx.stroke()

  // --- griglia vuota -----------------------------------------------------
  ctx.lineWidth = 0.25
  ctx.strokeStyle = '#463c37'
  for (const cella of poster.celle) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cella.x, cella.y, poster.lato, poster.lato)
    ctx.strokeRect(cella.x, cella.y, poster.lato, poster.lato)
  }

  ctx.textAlign = 'left'
  ctx.fillStyle = numeri
  ctx.font = font(poster.dimensioneNumero, '600', SANS)
  for (const cella of poster.celle) {
    if (cella.numero !== null) {
      ctx.fillText(String(cella.numero), cella.x + poster.lato * 0.13, cella.y + poster.lato * 0.3)
    }
  }

  // --- definizioni -------------------------------------------------------
  for (const colonna of poster.colonne) {
    let y = poster.yColonne
    ctx.fillStyle = stile.colore
    ctx.font = font(poster.dimensioneTesto + 1, '700', SERIF)
    ctx.fillText(colonna.titolo, colonna.x, y)
    y += poster.interlinea * 2

    ctx.fillStyle = '#282320'
    ctx.font = font(poster.dimensioneTesto, '400', SERIF)
    for (const blocco of colonna.blocchi) {
      for (const riga of blocco) {
        ctx.fillText(riga, colonna.x, y)
        y += poster.interlinea
      }
      y += poster.interlinea * 0.3
    }
  }

  await scaricaTela(tela, `${nomeFile(stile.titolo)}-${formato}.png`)
}
