import { useMemo, useState } from 'react'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, TIPI } from '../../eventi/types'
import { caselleVincenti, motivazione, premiPer, ultimaRiga } from './attestati'
import type { FormaCartella } from './generator'
import { scaricaAttestati, TEMPLATE, type IdTemplate } from './stampaAttestati'

/** Una miniatura indicativa di ogni stile, con il colore dell'evento. */
function Miniatura({ id }: { id: IdTemplate }) {
  const riga = <span className="block h-0.5 w-8 rounded bg-current opacity-40" />
  switch (id) {
    case 'classico':
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1 rounded border-2 border-double border-oro-400 bg-white text-primario-700">
          <span className="h-4 w-4 rounded-full border border-dashed border-oro-500" />
          <span className="font-display text-[10px] font-bold">Congratulazioni!</span>
          <span className="rounded bg-oro-100 px-2 font-display text-xs font-bold">Ambo</span>
          {riga}
        </div>
      )
    case 'festoso':
      return (
        <div className="relative h-full rounded bg-primario-100 p-1.5">
          <span className="absolute top-0.5 left-2 h-1 w-1 rounded-full bg-oro-500" />
          <span className="absolute top-1 right-3 h-1 w-1.5 rotate-45 bg-primario-700" />
          <span className="absolute bottom-0.5 left-5 h-1 w-1 rounded-full bg-primario-400" />
          <div className="flex h-full flex-col items-center justify-center gap-1 rounded bg-white text-primario-700">
            <span className="font-display text-[10px] font-bold italic">Evviva!</span>
            <span className="rounded-full bg-primario-700 px-2 text-[9px] font-bold text-crema-50">AMBO</span>
            {riga}
          </div>
        </div>
      )
    case 'elegante':
      return (
        <div className="h-full rounded bg-white p-1">
          <div className="flex h-full flex-col items-center justify-center gap-1 border border-primario-700 text-primario-700">
            <span className="text-[6px] tracking-[0.3em]">BINGO</span>
            <span className="font-display text-[10px] italic">Congratulazioni</span>
            <span className="flex items-center gap-1 font-display text-xs font-bold">
              <span className="h-px w-2 bg-oro-500" />
              Ambo
              <span className="h-px w-2 bg-oro-500" />
            </span>
            {riga}
          </div>
        </div>
      )
    case 'pop':
      return (
        <div className="flex h-full flex-col items-center gap-1 rounded bg-primario-700 p-1.5">
          <span className="mt-1 flex h-7 w-7 -rotate-12 items-center justify-center rounded-full border border-primario-900 bg-oro-300 text-[5px] font-bold text-primario-900">
            VINCITORE
          </span>
          <div className="flex w-full flex-1 flex-col items-center justify-center rounded bg-white text-primario-700 shadow-[2px_2px_0] shadow-primario-900">
            <span className="text-[10px] font-black">AMBO!</span>
            {riga}
          </div>
        </div>
      )
  }
}

interface Props {
  forma: FormaCartella
  titolo: string
}

export default function AttestatiPanel({ forma, titolo }: Props) {
  const { evento } = useEvento()
  const [template, setTemplate] = useState<IdTemplate>('classico')
  // si tiene traccia di quelli tolti: cambiando forma, i premi nuovi partono spuntati
  const [esclusi, setEsclusi] = useState<Set<string>>(new Set())
  const [crescente, setCrescente] = useState(true)
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const premi = useMemo(() => premiPer(forma), [forma])
  const scelti = premi.filter((p) => !esclusi.has(p.id))

  function alterna(id: string) {
    setEsclusi((attuali) => {
      const nuovi = new Set(attuali)
      if (nuovi.has(id)) nuovi.delete(id)
      else nuovi.add(id)
      return nuovi
    })
  }

  async function scarica() {
    setErrore(null)
    setInCorso(true)
    try {
      const attestati = premi
        .map((premio, indice) => ({ premio, indice }))
        .filter(({ premio }) => !esclusi.has(premio.id))
        .map(({ premio, indice }) => ({
          premio: premio.nome,
          motivazione: motivazione(premio, evento.tipo),
          ultimaRiga: ultimaRiga(evento.tipo, indice, premi.length),
          vincenti: caselleVincenti(premio, forma),
          importanza: premi.length > 1 ? indice / (premi.length - 1) : 1,
        }))
      const datiEvento = {
        titolo,
        occasione: TIPI[evento.tipo].occasione,
        nomi: nomiBrevi(evento),
        colore: evento.colore,
        forma,
      }
      await scaricaAttestati(template, attestati, datiEvento, crescente)
    } catch {
      setErrore('Non sono riuscito a creare il PDF. Riprova.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-semibold text-primario-800">Attestati per i vincitori</h2>
        <span className="rounded-full bg-primario-50 px-2.5 py-1 text-xs font-semibold text-primario-700">
          solo per te
        </span>
      </div>
      <p className="mb-5 text-sm text-inchiostro/60">
        Un attestato per ogni premio, da consegnare a chi lo vince: uno per foglio A4, da
        ritagliare lungo i segni agli angoli. I premi seguono la forma delle cartelle scelta qui
        sopra ({forma.colonne}×{forma.righe}).
      </p>

      <span className="field-label">Stile</span>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TEMPLATE.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            className={`cursor-pointer rounded-lg border-2 p-2 text-left transition ${
              template === t.id
                ? 'border-primario-700 bg-primario-50'
                : 'border-crema-300 bg-crema-50 hover:border-primario-300'
            }`}
          >
            <div className="mx-auto mb-2 h-36 w-24">
              <Miniatura id={t.id} />
            </div>
            <p className="text-sm font-semibold text-primario-800">{t.nome}</p>
            <p className="text-xs text-inchiostro/55">{t.descrizione}</p>
          </button>
        ))}
      </div>

      <span className="field-label">Premi da stampare</span>
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2">
        {premi.map((premio) => (
          <label key={premio.id} className="flex items-center gap-2 text-sm text-inchiostro/80">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primario-700"
              checked={!esclusi.has(premio.id)}
              onChange={() => alterna(premio.id)}
            />
            {premio.nome}
          </label>
        ))}
      </div>

      <label className="mb-5 flex items-start gap-2 text-sm text-inchiostro/80">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-primario-700"
          checked={crescente}
          onChange={(e) => setCrescente(e.target.checked)}
        />
        <span>
          Più grande il premio, più grande l’attestato
          <span className="block text-xs text-inchiostro/50">
            {crescente
              ? 'Dall’ambo su un cartoncino 10×15 fino al bingo su tutto il foglio.'
              : 'Tutti su un cartoncino 10×15.'}
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="btn-primary px-3 py-2 text-xs"
          disabled={inCorso || scelti.length === 0}
          onClick={scarica}
        >
          {inCorso
            ? 'Creo il PDF…'
            : `Scarica ${scelti.length} ${scelti.length === 1 ? 'attestato' : 'attestati'} in PDF`}
        </button>
        {errore && <span className="text-xs text-red-700">{errore}</span>}
      </div>
    </section>
  )
}
