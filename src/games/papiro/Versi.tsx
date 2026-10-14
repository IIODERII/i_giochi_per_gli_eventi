import { useMemo, useRef, useState, type SyntheticEvent } from 'react'
import AiutoRime from './AiutoRime'
import { analizzaTesto, NOMI_VERSI, SCHEMI, type AnalisiVerso, type Schema } from './rime'
import { TESTO_MAX } from './types'
import type { StatoSalvataggio } from './usePapiro'

/** Altezza di una riga dell'editor: la colonna di analisi deve combaciare. */
const RIGA_PX = 30
/** Il padding verticale della classe "field" (py-2.5). */
const PADDING_PX = 10

const CHIAVE_AIUTO = 'giochieventi:papiro-aiuto-rime'
const CHIAVE_SCHEMA = 'giochieventi:papiro-schema'

function leggi(chiave: string): string | null {
  try {
    return localStorage.getItem(chiave)
  } catch {
    return null
  }
}

function scrivi(chiave: string, valore: string) {
  try {
    localStorage.setItem(chiave, valore)
  } catch {
    /* localStorage non disponibile: la scelta vale fino alla chiusura della pagina */
  }
}

const COLORI_LETTERE = [
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-lime-100 text-lime-800',
]

const STATI: Record<StatoSalvataggio, { testo: string; classe: string }> = {
  salvato: { testo: 'Salvato', classe: 'text-inchiostro/45' },
  'da-salvare': { testo: 'Modifiche da salvare…', classe: 'text-inchiostro/45' },
  salvataggio: { testo: 'Salvataggio…', classe: 'text-inchiostro/45' },
  errore: { testo: 'Non salvato: riprovo alla prossima modifica', classe: 'text-red-700' },
}

const ESEMPIO = `Scrivi qui i versi, uno per riga.
Lascia una riga vuota fra una strofa e l'altra.

Ecco, son giunti i giorni dell'alloro,
dopo anni di studio e di lavoro…`

function Analisi({ verso }: { verso: AnalisiVerso }) {
  const fuoriMisura = verso.sillabe !== null && verso.sillabeStrofa !== null && verso.sillabe !== verso.sillabeStrofa
  const nome = verso.sillabe ? NOMI_VERSI[verso.sillabe] : undefined
  return (
    <div className="flex items-center justify-end gap-1.5 pr-2" style={{ height: RIGA_PX }}>
      {verso.sillabe !== null && (
        <span
          className={`w-6 text-right text-xs tabular-nums ${fuoriMisura ? 'font-bold text-amber-700' : 'text-inchiostro/50'}`}
          title={`circa ${verso.sillabe} sillabe${nome ? ` (${nome})` : ''}${
            fuoriMisura ? ` · gli altri versi della strofa ne hanno ${verso.sillabeStrofa}` : ''
          }`}
        >
          {verso.sillabe}
        </span>
      )}
      {verso.lettera && (
        <span
          className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${
            verso.rima
              ? COLORI_LETTERE[(verso.lettera.charCodeAt(0) - 65) % COLORI_LETTERE.length]
              : 'border border-dashed border-inchiostro/30 text-inchiostro/40'
          }`}
          title={verso.rima ? `rima ${verso.lettera}` : 'nessun altro verso della strofa rima con questo'}
        >
          {verso.lettera}
        </span>
      )}
    </div>
  )
}

interface Props {
  testo: string
  onChange: (testo: string) => void
  stato: StatoSalvataggio
}

export default function Versi({ testo, onChange, stato }: Props) {
  const area = useRef<HTMLTextAreaElement>(null)
  const [aiuto, setAiuto] = useState(() => leggi(CHIAVE_AIUTO) === '1')
  const [schema, setSchema] = useState<Schema>(() => {
    const salvato = leggi(CHIAVE_SCHEMA)
    return salvato && salvato in SCHEMI ? (salvato as Schema) : 'libero'
  })
  const [scorrimento, setScorrimento] = useState(0)
  const [rigaCorrente, setRigaCorrente] = useState(0)

  const analisi = useMemo(() => analizzaTesto(testo), [testo])
  const perRiga = useMemo(() => new Map(analisi.map((v) => [v.riga, v])), [analisi])
  const righe = useMemo(() => testo.split('\n').length, [testo])
  const strofe = analisi.length > 0 ? analisi[analisi.length - 1].strofa + 1 : 0
  const senzaRima = analisi.filter((v) => v.lettera && !v.rima).length

  function alternaAiuto(acceso: boolean) {
    setAiuto(acceso)
    scrivi(CHIAVE_AIUTO, acceso ? '1' : '0')
  }

  function scegliSchema(nuovo: Schema) {
    setSchema(nuovo)
    scrivi(CHIAVE_SCHEMA, nuovo)
  }

  function seguiCursore(e: SyntheticEvent<HTMLTextAreaElement>) {
    const { value, selectionStart } = e.currentTarget
    setRigaCorrente(value.slice(0, selectionStart).split('\n').length - 1)
  }

  /** Mette la parola scelta dove sta il cursore, con uno spazio davanti se serve. */
  function inserisci(parola: string) {
    const el = area.current
    if (!el) return
    const inizio = el.selectionStart
    const prima = testo.slice(0, inizio)
    const spazio = prima && !/[\s(«"'’]$/.test(prima) ? ' ' : ''
    const nuovo = prima + spazio + parola + testo.slice(el.selectionEnd)
    if (nuovo.length > TESTO_MAX) return
    onChange(nuovo)
    const dopo = inizio + spazio.length + parola.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(dopo, dopo)
    })
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-primario-800">I versi</h2>
          <p className="text-sm text-inchiostro/60">
            {analisi.length} {analisi.length === 1 ? 'verso' : 'versi'} in {strofe}{' '}
            {strofe === 1 ? 'strofa' : 'strofe'}
            {aiuto && senzaRima > 0 && ` · ${senzaRima} senza rima`}
            {' · '}
            <span className={STATI[stato].classe}>{STATI[stato].testo}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-primario-800">
            <input
              type="checkbox"
              className="h-5 w-5 accent-primario-700"
              checked={aiuto}
              onChange={(e) => alternaAiuto(e.target.checked)}
            />
            Aiuto rime
          </label>
          {aiuto && (
            <select
              className="field w-auto py-1.5 text-sm"
              value={schema}
              onChange={(e) => scegliSchema(e.target.value as Schema)}
              aria-label="Schema delle rime"
            >
              {Object.entries(SCHEMI).map(([id, s]) => (
                <option key={id} value={id}>
                  {s.nome}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className={aiuto ? 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]' : ''}>
        <div className="flex overflow-hidden rounded-lg border border-crema-300 bg-crema-50 focus-within:border-primario-400 focus-within:ring-2 focus-within:ring-primario-200">
          <textarea
            ref={area}
            className="min-h-[28rem] flex-1 resize-y bg-transparent px-3 font-display text-lg text-inchiostro outline-none placeholder:text-inchiostro/35"
            style={{ lineHeight: `${RIGA_PX}px`, paddingTop: PADDING_PX, paddingBottom: PADDING_PX }}
            value={testo}
            maxLength={TESTO_MAX}
            placeholder={ESEMPIO}
            // con l'aiuto acceso ogni verso e' una riga sola, cosi' l'analisi a lato combacia
            wrap={aiuto ? 'off' : 'soft'}
            spellCheck
            onChange={(e) => {
              onChange(e.target.value)
              seguiCursore(e)
            }}
            onSelect={seguiCursore}
            onScroll={(e) => setScorrimento(e.currentTarget.scrollTop)}
            aria-label="I versi del papiro"
          />
          {aiuto && (
            <div className="w-20 shrink-0 overflow-hidden border-l border-crema-300 bg-white/60" aria-hidden>
              <div style={{ transform: `translateY(${PADDING_PX - scorrimento}px)` }}>
                {Array.from({ length: righe }, (_, i) => {
                  const verso = perRiga.get(i)
                  return verso ? (
                    <Analisi key={i} verso={verso} />
                  ) : (
                    <div key={i} style={{ height: RIGA_PX }} />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {aiuto && (
          <AiutoRime
            testo={testo}
            analisi={analisi}
            rigaCorrente={rigaCorrente}
            schema={schema}
            onInserisci={inserisci}
          />
        )}
      </div>

      {aiuto && (
        <p className="mt-3 text-xs text-inchiostro/55">
          A lato di ogni verso: le sillabe (circa, contando le fusioni fra vocali come in metrica) e
          la lettera della rima dentro la strofa. Stesso colore = fanno rima; lettera tratteggiata =
          nessun altro verso della strofa rima con quello; numero arancione = il verso è più lungo
          o più corto degli altri della strofa.
        </p>
      )}
    </section>
  )
}
