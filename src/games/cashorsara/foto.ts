/** Oltre questo lato l'immagine viene rimpicciolita prima di salvarla. */
const LATO_MASSIMO = 1000
/** Un documento Firestore sta sotto 1 MB: si tiene un buon margine. */
const PESO_MASSIMO = 650_000

interface Opzioni {
  /**
   * Mantiene le parti trasparenti (serve alla foto scontornata del
   * presentatore): il JPEG le riempirebbe di nero.
   */
  trasparenza?: boolean
  /** Lato massimo in pixel: il papiro, che si stampa grande, ne vuole di piu'. */
  latoMassimo?: number
}

/** I formati da provare, dal piu' leggero: WebP non tutti i browser lo sanno scrivere. */
function formati(trasparenza: boolean): { tipo: string; qualita: number[] }[] {
  return trasparenza
    ? [
        { tipo: 'image/webp', qualita: [0.8, 0.65, 0.5] },
        { tipo: 'image/png', qualita: [1] },
      ]
    : [{ tipo: 'image/jpeg', qualita: [0.7, 0.6, 0.5, 0.4] }]
}

/**
 * Riduce una foto scelta dal telefono o dal computer a una stringa che sta
 * dentro un documento Firestore. Cosi' non serve Firebase Storage, che sul
 * piano gratuito non e' disponibile.
 */
export async function comprimiFoto(
  file: File,
  { trasparenza = false, latoMassimo = LATO_MASSIMO }: Opzioni = {},
): Promise<string> {
  const immagine = await createImageBitmap(file)
  let lato = latoMassimo

  for (let tentativo = 0; tentativo < 5; tentativo++) {
    const scala = Math.min(1, lato / Math.max(immagine.width, immagine.height))
    const larghezza = Math.round(immagine.width * scala)
    const altezza = Math.round(immagine.height * scala)

    const tela = document.createElement('canvas')
    tela.width = larghezza
    tela.height = altezza
    const ctx = tela.getContext('2d')
    if (!ctx) throw new Error('Il browser non permette di elaborare l immagine')
    ctx.drawImage(immagine, 0, 0, larghezza, altezza)

    for (const { tipo, qualita } of formati(trasparenza)) {
      for (const q of qualita) {
        const risultato = tela.toDataURL(tipo, q)
        // se il browser non sa scrivere il formato, restituisce un PNG: si passa al prossimo
        if (!risultato.startsWith(`data:${tipo}`)) break
        if (risultato.length <= PESO_MASSIMO) {
          immagine.close()
          return risultato
        }
      }
    }
    lato = Math.round(lato * 0.75)
  }

  immagine.close()
  throw new Error('Foto troppo pesante: provane una piu piccola')
}
