/**
 * Rime e metrica dei versi, quanto basta per aiutare chi scrive il papiro.
 *
 * L'italiano scritto non dice dove cade l'accento, quindi qui si fanno delle
 * ipotesi ragionevoli: parola tronca se finisce con la vocale accentata (o e'
 * di una sillaba sola), altrimenti piana, che e' il caso di gran lunga piu'
 * comune. Le sdrucciole ("tavolo") vengono trattate come piane: le rime che
 * escono sono assonanze, non errori gravi. Per questo il sito parla sempre di
 * sillabe "circa".
 */

const VOCALE = /[aeiouàèéìíòóùú]/
const VOCALE_FORTE = /[aeoàèéìíòóùú]/
const ACCENTATA_IN_FONDO = /[àèéìíòóùú]$/

/** "perché" -> "perche". */
export function senzaAccenti(testo: string): string {
  return testo.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Solo lettere minuscole: "Po'" -> "po", "dell'anno" -> "dellanno". */
function pulisci(parola: string): string {
  return parola.toLowerCase().replace(/[^a-zàèéìíòóùú]/g, '')
}

/**
 * La i di "ci", "gi", "sci", "gli" davanti a vocale non si pronuncia, e la
 * u di "qu" fa parte della consonante: si sostituiscono con una lettera
 * maiuscola che conta come consonante. Cosi' "faccia" fa rima con "braccia"
 * ma non con "vacca", e "qua" vale una sillaba sola.
 */
function pronuncia(parola: string): string {
  return parola
    .replace(/sci(?=[aeiouàèéìòù])/g, 'S')
    .replace(/gli(?=[aeiouàèéìòù])/g, 'L')
    .replace(/ci(?=[aeiouàèéìòù])/g, 'C')
    .replace(/gi(?=[aeiouàèéìòù])/g, 'G')
    .replace(/qu(?=[aeiouàèéìòù])/g, 'Q')
}

/**
 * Dove comincia la vocale di ogni sillaba. Due vocali "forti" (a, e, o o
 * accentate) vicine si separano ("pa-e-se"); i e u si uniscono alla vocale
 * accanto (dittongo), tranne quando stanno fra due vocali ("no-ia", "a-iu-to").
 * La parola deve essere gia' passata da pronuncia().
 */
function nuclei(parola: string): number[] {
  const inizi: number[] = []
  let precedente: 'forte' | 'debole' | null = null
  for (let i = 0; i < parola.length; i++) {
    const c = parola[i]
    if (!VOCALE.test(c)) {
      precedente = null
      continue
    }
    const forte = VOCALE_FORTE.test(c)
    const seguitaDaVocale = i + 1 < parola.length && VOCALE.test(parola[i + 1])
    if (
      precedente === null ||
      (forte && precedente === 'forte') ||
      (!forte && precedente === 'forte' && seguitaDaVocale)
    ) {
      inizi.push(i)
    }
    precedente = forte ? 'forte' : 'debole'
  }
  return inizi
}

/**
 * La parte della parola che deve coincidere perche' due parole facciano rima:
 * dalla vocale accentata alla fine. "amore" e "cuore" danno entrambe "ore",
 * "città" e "perché" finiscono con "#" perche' tronche (e rimano solo con
 * altre tronche). Null se la parola non ha vocali.
 */
export function chiaveRima(grezza: string): string | null {
  const parola = pronuncia(pulisci(grezza))
  const inizi = nuclei(parola)
  if (inizi.length === 0) return null

  // tronca: "città", "perché", "più"
  if (ACCENTATA_IN_FONDO.test(parola)) return `${senzaAccenti(parola.slice(-1))}#`
  // una sillaba sola ("tre", "qua", "poi", "mio") vale come tronca; nei
  // trittonghi la prima vocale non conta ("guai" come "mai", "suoi" come "poi")
  if (inizi.length === 1) {
    let inizio = inizi[0]
    if (/[iu]/.test(parola[inizio]) && /^[aeiou]{2}/.test(parola.slice(inizio + 1))) inizio++
    return `${senzaAccenti(parola.slice(inizio))}#`
  }

  // piana: dalla penultima sillaba, saltando la i e la u che aprono un
  // dittongo ("cuore" -> "ore", "chiesa" -> "esa", "aiuto" -> "uto")
  let inizio = inizi[inizi.length - 2]
  while (/[iu]/.test(parola[inizio]) && VOCALE.test(parola[inizio + 1] ?? '')) inizio++
  return senzaAccenti(parola.slice(inizio))
}

/** L'ultima parola di un verso, senza punteggiatura: e' quella che deve rimare. */
export function ultimaParola(verso: string): string | null {
  const parole = verso.match(/[\p{L}]+(?:['’][\p{L}]+)*['’]?/gu)
  if (!parole) return null
  // "dell'anno" -> "anno"; "po'" resta "po'"
  const ultima = parole[parole.length - 1]
  const pezzi = ultima.split(/['’](?=\p{L})/u)
  return pezzi[pezzi.length - 1]
}

/** Sillabe grammaticali di una parola: "paese" 3, "cuore" 2, "aiuto" 3. */
function sillabeParola(parola: string): number {
  return nuclei(pronuncia(parola)).length
}

function tronca(parola: string): boolean {
  return ACCENTATA_IN_FONDO.test(parola) || (sillabeParola(parola) === 1 && VOCALE.test(parola))
}

/**
 * Le sillabe del verso come le conta la metrica: con la sinalefe (la vocale
 * finale di una parola si fonde con quella iniziale della successiva) e
 * contando fino all'ultimo accento piu' una. Un endecasillabo da' 11.
 */
export function sillabeVerso(verso: string): number | null {
  // gli apostrofi uniscono: "l'amore" si conta come una parola sola
  const parole = (verso.toLowerCase().replace(/['’]/g, '').match(/[a-zàèéìíòóùú]+/g) ?? []).filter((p) =>
    VOCALE.test(p),
  )
  if (parole.length === 0) return null

  let totale = 0
  parole.forEach((parola, i) => {
    totale += sillabeParola(parola)
    const prima = parole[i - 1]
    if (prima && VOCALE.test(prima.slice(-1)) && /^h?[aeiouàèéìíòóùú]/.test(parola)) totale--
  })
  if (tronca(parole[parole.length - 1])) totale++
  return totale
}

/** I nomi dei versi piu' usati, per dare un nome al numero. */
export const NOMI_VERSI: Record<number, string> = {
  5: 'quinario',
  6: 'senario',
  7: 'settenario',
  8: 'ottonario',
  9: 'novenario',
  10: 'decasillabo',
  11: 'endecasillabo',
}

export interface AnalisiVerso {
  /** Riga del testo (da 0), per allinearsi all'editor. */
  riga: number
  testo: string
  sillabe: number | null
  chiave: string | null
  /** A, B, C... dentro la strofa; null per i versi senza parole. */
  lettera: string | null
  /** Falso se nella strofa nessun altro verso rima con questo. */
  rima: boolean
  /** Il numero di sillabe piu' comune nella strofa. */
  sillabeStrofa: number | null
  strofa: number
  /** Posizione nella strofa (da 0). */
  posizione: number
}

/** Le strofe sono separate da una riga vuota. */
export function analizzaTesto(testo: string): AnalisiVerso[] {
  const righe = testo.split('\n')
  const risultato: AnalisiVerso[] = []
  let strofa: AnalisiVerso[] = []
  let numeroStrofa = 0

  function chiudiStrofa() {
    if (strofa.length === 0) return
    const conteggi = new Map<string, number>()
    for (const v of strofa) if (v.chiave) conteggi.set(v.chiave, (conteggi.get(v.chiave) ?? 0) + 1)
    const lettere = new Map<string, string>()
    for (const v of strofa) {
      if (!v.chiave) continue
      if (!lettere.has(v.chiave)) lettere.set(v.chiave, String.fromCharCode(65 + (lettere.size % 26)))
      v.lettera = lettere.get(v.chiave)!
      v.rima = (conteggi.get(v.chiave) ?? 0) > 1
    }
    const frequenze = new Map<number, number>()
    for (const v of strofa) if (v.sillabe) frequenze.set(v.sillabe, (frequenze.get(v.sillabe) ?? 0) + 1)
    let piuComune: number | null = null
    for (const [n, volte] of frequenze) {
      if (volte > 1 && (piuComune === null || volte > (frequenze.get(piuComune) ?? 0))) piuComune = n
    }
    for (const v of strofa) v.sillabeStrofa = piuComune
    risultato.push(...strofa)
    strofa = []
    numeroStrofa++
  }

  righe.forEach((riga, i) => {
    if (!riga.trim()) {
      chiudiStrofa()
      return
    }
    const parola = ultimaParola(riga)
    strofa.push({
      riga: i,
      testo: riga,
      sillabe: sillabeVerso(riga),
      chiave: parola ? chiaveRima(parola) : null,
      lettera: null,
      rima: false,
      sillabeStrofa: null,
      strofa: numeroStrofa,
      posizione: strofa.length,
    })
  })
  chiudiStrofa()
  return risultato
}

/** Gli schemi classici: la lettera di ogni posizione nella strofa. */
export const SCHEMI = {
  libero: { nome: 'Libero', lettere: '' },
  baciata: { nome: 'Baciata (AABB)', lettere: 'AABB' },
  alternata: { nome: 'Alternata (ABAB)', lettere: 'ABAB' },
  incrociata: { nome: 'Incrociata (ABBA)', lettere: 'ABBA' },
} as const

export type Schema = keyof typeof SCHEMI

/**
 * Con quale verso precedente deve rimare il verso in quella posizione della
 * strofa, secondo lo schema. Lo schema si ripete per le strofe piu' lunghe di
 * quattro versi: AABB AABB... Null se e' il primo della sua lettera.
 */
export function posizioneCompagna(schema: Schema, posizione: number): number | null {
  const lettere = SCHEMI[schema].lettere
  if (!lettere) return null
  const giro = Math.floor(posizione / lettere.length) * lettere.length
  const mia = lettere[posizione % lettere.length]
  for (let p = (posizione % lettere.length) - 1; p >= 0; p--) {
    if (lettere[p] === mia) return giro + p
  }
  return null
}
