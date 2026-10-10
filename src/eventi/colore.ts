import { COLORE_PREDEFINITO } from '../config'

export type Rgb = [number, number, number]

/** Colori gia' provati: tutti abbastanza scuri da reggere il testo chiaro sopra. */
export const COLORI_PROPOSTI: { nome: string; valore: string }[] = [
  { nome: 'Bordeaux', valore: '#7b1e3a' },
  { nome: 'Rosa antico', valore: '#9c3a64' },
  { nome: 'Viola', valore: '#5b2a86' },
  { nome: 'Blu notte', valore: '#1e3a7b' },
  { nome: 'Petrolio', valore: '#145a64' },
  { nome: 'Verde bosco', valore: '#1f5f3f' },
  { nome: 'Terracotta', valore: '#a0461e' },
  { nome: 'Antracite', valore: '#33373d' },
]

export function coloreValido(colore: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(colore)
}

export function rgb(colore: string): Rgb {
  const esadecimale = coloreValido(colore) ? colore : COLORE_PREDEFINITO
  return [1, 3, 5].map((i) => parseInt(esadecimale.slice(i, i + 2), 16)) as Rgb
}

function esadecimale([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Schiarisce (quota positiva, verso il bianco) o scurisce (quota negativa,
 * verso il nero) un colore. Serve a PDF e QR, che non leggono le variabili CSS.
 */
export function sfumatura(colore: string, quota: number): Rgb {
  const verso = quota >= 0 ? 255 : 0
  const peso = Math.abs(quota)
  return rgb(colore).map((v) => Math.round(v + (verso - v) * peso)) as Rgb
}

export function sfumaturaHex(colore: string, quota: number): string {
  return esadecimale(sfumatura(colore, quota))
}

function luminanza(colore: string): number {
  const [r, g, b] = rgb(colore).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrasto con il bianco secondo le WCAG: sotto 4,5 il testo chiaro si legge male. */
export function contrastoConBianco(colore: string): number {
  return 1.05 / (luminanza(colore) + 0.05)
}

/**
 * Cambia il colore di tutto il sito. Le sfumature (primario-50 ... 900) le
 * ricava il CSS da questa sola variabile: vedi index.css.
 */
export function applicaColore(colore: string) {
  const valore = coloreValido(colore) ? colore : COLORE_PREDEFINITO
  document.documentElement.style.setProperty('--primario', valore)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', valore)
}
