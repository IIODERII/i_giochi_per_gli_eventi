import { useEffect, useMemo, useState } from 'react'
import { caricaDizionario, type Dizionario } from './dizionario'
import { posizioneCompagna, ultimaParola, type AnalisiVerso, type Schema } from './rime'

const PER_PAGINA = 60

interface Props {
  testo: string
  analisi: AnalisiVerso[]
  /** La riga dove sta il cursore nell'editor. */
  rigaCorrente: number
  schema: Schema
  onInserisci: (parola: string) => void
}

interface Obiettivo {
  parola: string
  spiegazione: string
}

/**
 * Per quale parola cercare le rime: quella del verso con cui il verso
 * corrente deve rimare secondo lo schema, altrimenti l'ultima parola del
 * verso corrente (o di quello appena sopra, se si sta iniziando una riga).
 */
function trovaObiettivo(testo: string, analisi: AnalisiVerso[], riga: number, schema: Schema): Obiettivo | null {
  const verso = analisi.find((v) => v.riga === riga)
  let strofa: number
  let posizione: number
  if (verso) {
    strofa = verso.strofa
    posizione = verso.posizione
  } else {
    // riga vuota subito sotto un verso: e' il verso che si sta per scrivere
    const sopra = testo.split('\n')[riga - 1]?.trim() ? analisi.find((v) => v.riga === riga - 1) : undefined
    if (!sopra) return null
    strofa = sopra.strofa
    posizione = sopra.posizione + 1
  }

  const compagna = posizioneCompagna(schema, posizione)
  const compagno =
    compagna === null ? undefined : analisi.find((v) => v.strofa === strofa && v.posizione === compagna)
  const parolaCompagno = compagno && ultimaParola(compagno.testo)
  if (parolaCompagno) {
    return {
      parola: parolaCompagno,
      spiegazione: `Il verso ${posizione + 1} della strofa deve rimare con il ${compagna! + 1}:`,
    }
  }

  if (verso) {
    const propria = ultimaParola(verso.testo)
    return propria ? { parola: propria, spiegazione: 'Rime per l’ultima parola di questo verso:' } : null
  }
  // schema libero su una riga nuova: si propone di rimare con il verso sopra
  const precedente = analisi.find((v) => v.strofa === strofa && v.posizione === posizione - 1)
  const parola = precedente && ultimaParola(precedente.testo)
  return parola ? { parola, spiegazione: 'Per rimare con il verso sopra:' } : null
}

export default function AiutoRime({ testo, analisi, rigaCorrente, schema, onInserisci }: Props) {
  const [dizionario, setDizionario] = useState<Dizionario | null>(null)
  const [erroreCaricamento, setErroreCaricamento] = useState(false)
  const [tentativo, setTentativo] = useState(0)
  const [ricerca, setRicerca] = useState('')
  const [quante, setQuante] = useState(PER_PAGINA)

  useEffect(() => {
    let attivo = true
    caricaDizionario()
      .then((d) => {
        if (!attivo) return
        setDizionario(d)
        setErroreCaricamento(false)
      })
      .catch(() => {
        if (attivo) setErroreCaricamento(true)
      })
    return () => {
      attivo = false
    }
  }, [tentativo])

  const automatico = useMemo(
    () => trovaObiettivo(testo, analisi, rigaCorrente, schema),
    [testo, analisi, rigaCorrente, schema],
  )
  const cercata = ricerca.trim()
  const perFinale = cercata.startsWith('-')
  const parola = cercata || automatico?.parola || ''

  const risultati = useMemo(() => {
    if (!dizionario || !parola) return []
    return perFinale ? dizionario.conFinale(parola) : dizionario.rime(parola)
  }, [dizionario, parola, perFinale])

  // cambiando parola si riparte dalla prima pagina di risultati
  const [ultimaCercata, setUltimaCercata] = useState(parola)
  if (ultimaCercata !== parola) {
    setUltimaCercata(parola)
    setQuante(PER_PAGINA)
  }

  return (
    <aside className="flex flex-col rounded-lg border border-oro-200 bg-crema-50 p-3">
      <p className="text-sm font-semibold text-primario-800">Rime</p>

      <div className="mt-2 flex gap-1">
        <input
          className="field py-1.5 text-sm"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca una parola, o -ezza"
          aria-label="Cerca le rime di una parola"
        />
        {ricerca && (
          <button type="button" className="btn-ghost px-2 text-xs" onClick={() => setRicerca('')}>
            ×
          </button>
        )}
      </div>

      <p className="mt-2 min-h-10 text-xs text-inchiostro/60">
        {cercata ? (
          perFinale ? (
            <>
              Parole che finiscono in <strong>{cercata.slice(1)}</strong>:
            </>
          ) : (
            <>
              Rime per <strong>{cercata}</strong>:
            </>
          )
        ) : automatico ? (
          <>
            {automatico.spiegazione} <strong className="text-primario-700">{automatico.parola}</strong>
          </>
        ) : (
          'Metti il cursore su un verso, oppure cerca una parola qui sopra.'
        )}
      </p>

      <div className="mt-1 max-h-80 min-h-24 overflow-y-auto">
        {erroreCaricamento ? (
          <p className="text-xs text-red-700">
            Non sono riuscito a scaricare il dizionario.{' '}
            <button type="button" className="font-semibold underline" onClick={() => setTentativo((t) => t + 1)}>
              Riprova
            </button>
          </p>
        ) : !dizionario ? (
          <p className="text-xs text-inchiostro/50">Carico il dizionario…</p>
        ) : parola && risultati.length === 0 ? (
          <p className="text-xs text-inchiostro/50">
            Nessuna rima trovata. Prova a cercare solo la fine della parola, con il trattino davanti
            (es. <span className="font-mono">-ore</span>).
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {risultati.slice(0, quante).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onInserisci(r)}
                title="Inserisci nel testo"
                className="cursor-pointer rounded border border-crema-300 bg-white px-1.5 py-0.5 text-sm text-inchiostro/85 transition hover:border-primario-300 hover:bg-primario-50"
              >
                {r}
              </button>
            ))}
            {risultati.length > quante && (
              <button
                type="button"
                className="btn-ghost px-2 py-0.5 text-xs"
                onClick={() => setQuante((n) => n + PER_PAGINA)}
              >
                altre {Math.min(PER_PAGINA, risultati.length - quante)}…
              </button>
            )}
          </div>
        )}
      </div>
      {dizionario && risultati.length > 0 && (
        <p className="mt-2 text-[11px] text-inchiostro/45">
          Prima le parole più comuni. Clicca per inserirla dove sta il cursore.
        </p>
      )}
    </aside>
  )
}
