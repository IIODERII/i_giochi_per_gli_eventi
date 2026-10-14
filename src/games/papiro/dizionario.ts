import { chiaveRima, senzaAccenti } from './rime'

/**
 * Il dizionario delle rime: circa 77.000 parole, dalla piu' usata alla meno
 * usata (vedi scripts/dizionario-rime.mjs). Sta in public/rime/parole.txt e
 * si scarica solo quando qualcuno accende l'aiuto rime: sono circa 240 KB.
 */
export interface Dizionario {
  /** Le parole che fanno rima con questa, le piu' comuni per prime. */
  rime: (parola: string) => string[]
  /** Le parole che finiscono cosi' ("ore", "-ezza"): quando la rima automatica non convince. */
  conFinale: (finale: string) => string[]
}

function costruisci(testo: string): Dizionario {
  const parole = testo.split('\n').filter(Boolean)
  const perChiave = new Map<string, string[]>()
  for (const parola of parole) {
    const chiave = chiaveRima(parola)
    if (!chiave) continue
    const elenco = perChiave.get(chiave)
    if (elenco) elenco.push(parola)
    else perChiave.set(chiave, [parola])
  }
  const semplici = parole.map(senzaAccenti)

  return {
    rime(parola) {
      const chiave = chiaveRima(parola)
      if (!chiave) return []
      const io = senzaAccenti(parola.toLowerCase())
      return (perChiave.get(chiave) ?? []).filter((p) => senzaAccenti(p) !== io)
    },
    conFinale(finale) {
      const cercato = senzaAccenti(finale.toLowerCase().replace(/[^\p{L}]/gu, ''))
      if (!cercato) return []
      return parole.filter((_, i) => semplici[i].endsWith(cercato) && semplici[i] !== cercato)
    },
  }
}

let inArrivo: Promise<Dizionario> | null = null

export function caricaDizionario(): Promise<Dizionario> {
  if (!inArrivo) {
    inArrivo = fetch(`${import.meta.env.BASE_URL}rime/parole.txt`)
      .then((risposta) => {
        if (!risposta.ok) throw new Error(`dizionario non trovato (${risposta.status})`)
        return risposta.text()
      })
      .then(costruisci)
    // se la rete cade, al prossimo tentativo si riprova da capo
    inArrivo.catch(() => {
      inArrivo = null
    })
  }
  return inArrivo
}
