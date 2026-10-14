import { rgb } from '../../eventi/colore'
import { nomeFile } from '../../eventi/types'
import type { Misuratore } from '../shared/stampa'
import { caricaImmagine, COLORI_PAPIRO, type StilePapiro } from './disegno'
import { impagina } from './impaginazione'
import { FORMATI, type Papiro } from './types'

/**
 * I caratteri standard dei PDF conoscono solo l'alfabeto latino: apostrofi e
 * virgolette tipografiche diventano dritti, il resto (emoji) si toglie.
 */
function perPdf(testo: string): string {
  return testo
    .replace(/[‘’]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/…/g, '...')
    .replace(/[–—]/g, '-')
    // gli a capo restano: separano versi e strofe
    .replace(/[^\n -ÿ]/g, '')
}

/** jsPDF non legge il WebP: l'immagine passa da un canvas e diventa PNG (trasparenza compresa). */
async function immaginePerPdf(foto: string): Promise<{ dati: string; tipo: 'PNG' | 'JPEG'; proporzione: number }> {
  const immagine = await caricaImmagine(foto)
  const proporzione = immagine.naturalWidth / immagine.naturalHeight
  if (foto.startsWith('data:image/jpeg')) return { dati: foto, tipo: 'JPEG', proporzione }
  if (foto.startsWith('data:image/png')) return { dati: foto, tipo: 'PNG', proporzione }

  const tela = document.createElement('canvas')
  tela.width = immagine.naturalWidth
  tela.height = immagine.naturalHeight
  const ctx = tela.getContext('2d')
  if (!ctx) throw new Error('Il browser non permette di elaborare l immagine')
  ctx.drawImage(immagine, 0, 0)
  return { dati: tela.toDataURL('image/png'), tipo: 'PNG', proporzione }
}

/** Il PDF vettoriale: si stampa nitido a qualunque misura. */
export async function scaricaPdf(papiro: Papiro, stile: StilePapiro, foto: string | null) {
  const { jsPDF } = await import('jspdf')
  const foglio = FORMATI[papiro.formato]
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [foglio.larghezza, foglio.altezza] })

  const misuratore =
    (peso: 'normal' | 'bold'): Misuratore =>
    (testo, larghezzaMax, dimensione) => {
      doc.setFont('times', peso)
      doc.setFontSize(dimensione)
      return doc.splitTextToSize(perPdf(testo), larghezzaMax) as string[]
    }

  const immagine = foto ? await immaginePerPdf(foto) : null
  const imp = impagina({
    papiro: { ...papiro, testo: perPdf(papiro.testo) },
    titolo: perPdf(stile.titolo),
    sottotitolo: perPdf(stile.sottotitolo),
    proporzioneImmagine: immagine?.proporzione ?? null,
    misura: misuratore('normal'),
    misuraTitolo: misuratore('bold'),
  })
  const s = imp.scala
  const [r, g, b] = rgb(stile.colore)
  const [ro, go, bo] = rgb(COLORI_PAPIRO.oro)

  if (papiro.pergamena) {
    doc.setFillColor(...rgb(COLORI_PAPIRO.pergamena))
    doc.rect(0, 0, imp.larghezza, imp.altezza, 'F')
  }

  // --- cornice -----------------------------------------------------------
  const c = imp.cornice
  doc.setDrawColor(r, g, b)
  doc.setLineWidth(1.2 * s)
  doc.rect(c.x, c.y, c.larghezza, c.altezza, 'S')
  doc.setLineWidth(0.35 * s)
  doc.rect(c.x + 2.5 * s, c.y + 2.5 * s, c.larghezza - 5 * s, c.altezza - 5 * s, 'S')
  doc.setFillColor(ro, go, bo)
  const lato = 3 * s
  for (const [x, y] of [
    [c.x, c.y],
    [c.x + c.larghezza, c.y],
    [c.x, c.y + c.altezza],
    [c.x + c.larghezza, c.y + c.altezza],
  ]) {
    doc.triangle(x, y - lato, x + lato, y, x - lato, y, 'F')
    doc.triangle(x, y + lato, x + lato, y, x - lato, y, 'F')
  }

  // --- intestazione ------------------------------------------------------
  doc.setFont('times', 'bold')
  doc.setFontSize(imp.titolo.dimensione)
  doc.setTextColor(r, g, b)
  for (const riga of imp.titolo.righe) doc.text(riga.testo, riga.x, riga.y, { align: 'center' })

  if (imp.sottotitolo) {
    doc.setFont('times', 'italic')
    doc.setFontSize(imp.sottotitolo.dimensione)
    doc.setTextColor(...rgb(COLORI_PAPIRO.sottotitolo))
    doc.text(imp.sottotitolo.riga.testo, imp.sottotitolo.riga.x, imp.sottotitolo.riga.y, { align: 'center' })
  }

  doc.setDrawColor(ro, go, bo)
  doc.setLineWidth(0.6 * s)
  doc.line(imp.linea.x1, imp.linea.y, imp.linea.x2, imp.linea.y)

  // --- immagine e versi --------------------------------------------------
  if (immagine && imp.immagine) {
    const q = imp.immagine
    doc.addImage(immagine.dati, immagine.tipo, q.x, q.y, q.larghezza, q.altezza)
  }

  doc.setFont('times', 'normal')
  doc.setFontSize(imp.dimensioneTesto)
  doc.setTextColor(...rgb(COLORI_PAPIRO.inchiostro))
  for (const riga of imp.righe) doc.text(riga.testo, riga.x, riga.y)

  doc.save(`${nomeFile(stile.titolo)}-papiro-${papiro.formato}.pdf`)
}
