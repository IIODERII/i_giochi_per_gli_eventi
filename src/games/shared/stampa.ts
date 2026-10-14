/** Un punto tipografico in millimetri: serve a passare dalle misure dei
 *  caratteri a quelle del foglio. */
export const MM_PER_PUNTO = 0.3528

/** I caratteri del sito, per i file disegnati sul canvas. */
export const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif'
export const SANS = 'Inter, system-ui, sans-serif'

/**
 * Spezza il testo in righe che stanno dentro la larghezza data (in mm).
 * Ogni formato di uscita ha il suo: jsPDF e il canvas misurano diversamente.
 */
export interface Misuratore {
  (testo: string, larghezzaMax: number, dimensione: number): string[]
}

/** Il canvas lavora in millimetri, quindi le dimensioni dei caratteri si convertono. */
export function fontTela(dimensione: number, stile: string, famiglia: string): string {
  return `${stile} ${(dimensione * MM_PER_PUNTO).toFixed(3)}px ${famiglia}`
}

/** Misura come il canvas: serve al PNG e alle anteprime disegnate. */
export function misuratoreTela(famiglia = SERIF, stile = ''): Misuratore {
  const contesto = document.createElement('canvas').getContext('2d')
  const precisione = 10 // si misura piu' grandi e si divide: meno errori di arrotondamento

  return (testo, larghezzaMax, dimensione) => {
    if (!contesto) return [testo]
    contesto.font = `${stile} ${dimensione * MM_PER_PUNTO * precisione}px ${famiglia}`
    const larghezza = (t: string) => contesto.measureText(t).width / precisione

    const righe: string[] = []
    let corrente = ''
    for (const parola of testo.split(/\s+/)) {
      const prova = corrente ? `${corrente} ${parola}` : parola
      if (!corrente || larghezza(prova) <= larghezzaMax) {
        corrente = prova
      } else {
        righe.push(corrente)
        corrente = parola
      }
    }
    if (corrente) righe.push(corrente)
    return righe.length > 0 ? righe : ['']
  }
}

/**
 * Senza questa attesa il canvas potrebbe disegnare con un carattere di
 * ripiego, diverso da quello che si vede nel sito.
 */
export async function attendiCaratteri(): Promise<void> {
  try {
    await document.fonts.ready
  } catch {
    /* niente */
  }
}

export function scaricaTela(tela: HTMLCanvasElement, nome: string): Promise<void> {
  return new Promise((risolvi, rifiuta) => {
    tela.toBlob((blob) => {
      if (!blob) {
        rifiuta(new Error('Non sono riuscito a creare l immagine'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = nome
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      risolvi()
    }, 'image/png')
  })
}
