import { useState } from 'react'
import Scelta from '../../components/Scelta'
import { impronta } from '../bingo/types'
import PuntiBadge from './PuntiBadge'
import {
  ordinaRegole,
  PUNTI_LIBERI_MAX,
  puntiConSegno,
  TESTO_MAX,
  validaPunti,
  validaTesto,
  type Giocatore,
  type Regola,
} from './types'
import { messaggioErroreFirestore, type DatiPunti } from './useFantafesta'

type Modo = 'regola' | 'mano'

interface Props {
  giocatori: Giocatore[]
  regole: Regola[]
  assegna: (giocatoreIds: string[], dati: DatiPunti) => Promise<void>
}

/** Il pannello dell'admin alla festa: chi, per cosa, e via. Pensato per il telefono. */
export default function AssegnaPunti({ giocatori, regole, assegna }: Props) {
  const [scelti, setScelti] = useState<string[]>([])
  const [cercaGiocatore, setCercaGiocatore] = useState('')
  const [modo, setModo] = useState<Modo>('regola')
  const [regolaId, setRegolaId] = useState<string | null>(null)
  const [cercaRegola, setCercaRegola] = useState('')
  const [puntiMano, setPuntiMano] = useState('')
  const [motivo, setMotivo] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [conferma, setConferma] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  const ordinati = [...giocatori].sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
  const giocatoriVisibili = cercaGiocatore
    ? ordinati.filter((g) => impronta(g.nome).includes(impronta(cercaGiocatore)) || scelti.includes(g.id))
    : ordinati
  const regoleVisibili = ordinaRegole(
    cercaRegola ? regole.filter((r) => impronta(r.testo).includes(impronta(cercaRegola))) : regole,
  )
  const regola = regole.find((r) => r.id === regolaId) ?? null

  const puntiScelti = modo === 'regola' ? (regola?.punti ?? null) : Number(puntiMano) || null
  const nomeScelti =
    scelti.length === 1
      ? (giocatori.find((g) => g.id === scelti[0])?.nome ?? '')
      : `${scelti.length} giocatori`

  function alterna(id: string) {
    setConferma(null)
    setScelti((attuali) => (attuali.includes(id) ? attuali.filter((x) => x !== id) : [...attuali, id]))
  }

  async function dai() {
    setConferma(null)
    if (scelti.length === 0) return setErrore('Scegli a chi dare i punti.')

    let dati: DatiPunti
    if (modo === 'regola') {
      if (!regola) return setErrore('Scegli una voce del regolamento.')
      dati = { regolaId: regola.id, motivo: regola.testo, punti: regola.punti }
    } else {
      const p = validaPunti(Number(puntiMano), PUNTI_LIBERI_MAX)
      if (!p.ok) return setErrore(p.errore ?? null)
      const m = validaTesto(motivo)
      if (!m.ok) return setErrore('Scrivi il motivo: comparirà nella cronaca.')
      dati = { regolaId: '', motivo: m.valore, punti: p.valore }
    }

    setErrore(null)
    setInCorso(true)
    try {
      await assegna(scelti, dati)
      setConferma(`${puntiConSegno(dati.punti)} a ${nomeScelti}: ${dati.motivo}`)
      setScelti([])
      setRegolaId(null)
      setPuntiMano('')
      setMotivo('')
      setCercaGiocatore('')
      setCercaRegola('')
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <section className="card border-oro-400 p-5 sm:p-6">
      <h2 className="mb-1 text-2xl font-semibold text-primario-800">Dai i punti</h2>
      <p className="mb-5 text-sm text-inchiostro/60">
        Visibile solo a te. Scegli chi, poi per cosa: classifica e cronaca si aggiornano subito sui
        telefoni di tutti.
      </p>

      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="field-label mb-0">1. A chi</span>
          {scelti.length > 0 && (
            <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setScelti([])}>
              Deseleziona ({scelti.length})
            </button>
          )}
        </div>
        {giocatori.length === 0 ? (
          <p className="text-sm text-inchiostro/55">Ancora nessuno in gara.</p>
        ) : (
          <>
            {giocatori.length > 12 && (
              <input
                className="field mb-2"
                placeholder="Cerca un nome…"
                value={cercaGiocatore}
                onChange={(e) => setCercaGiocatore(e.target.value)}
              />
            )}
            <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
              {giocatoriVisibili.map((g) => {
                const scelto = scelti.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => alterna(g.id)}
                    aria-pressed={scelto}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      scelto
                        ? 'border-primario-700 bg-primario-700 text-crema-50'
                        : 'border-primario-300 bg-white text-primario-700 hover:bg-primario-50'
                    }`}
                  >
                    {g.nome}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-xs text-inchiostro/50">
              Puoi sceglierne più di uno: tutti prendono gli stessi punti.
            </p>
          </>
        )}
      </div>

      <div className="mb-5">
        <span className="field-label">2. Per cosa</span>
        <div className="mb-3 max-w-xs">
          <Scelta
            valore={modo}
            opzioni={['regola', 'mano'] as const}
            onChange={(m) => {
              setModo(m)
              setConferma(null)
            }}
            etichetta={(m) => (m === 'regola' ? 'Dal regolamento' : 'Punti a mano')}
          />
        </div>

        {modo === 'regola' ? (
          regole.length === 0 ? (
            <p className="text-sm text-inchiostro/55">Il regolamento è vuoto: usa i punti a mano.</p>
          ) : (
            <>
              {regole.length > 8 && (
                <input
                  className="field mb-2"
                  placeholder="Cerca nel regolamento…"
                  value={cercaRegola}
                  onChange={(e) => setCercaRegola(e.target.value)}
                />
              )}
              <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-crema-200 p-1">
                {regoleVisibili.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setRegolaId(r.id === regolaId ? null : r.id)
                        setConferma(null)
                      }}
                      aria-pressed={r.id === regolaId}
                      className={`flex w-full cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition ${
                        r.id === regolaId
                          ? 'bg-primario-100 ring-2 ring-primario-400'
                          : 'hover:bg-crema-100'
                      }`}
                    >
                      <PuntiBadge punti={r.punti} />
                      <span className="text-inchiostro/85">{r.testo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )
        ) : (
          <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <input
              type="number"
              inputMode="numeric"
              className="field"
              placeholder="es. 15 o -10"
              value={puntiMano}
              min={-PUNTI_LIBERI_MAX}
              max={PUNTI_LIBERI_MAX}
              onChange={(e) => setPuntiMano(e.target.value)}
              aria-label="Punti"
            />
            <input
              className="field"
              placeholder="Il motivo, es. ha cantato al karaoke"
              value={motivo}
              maxLength={TESTO_MAX}
              onChange={(e) => setMotivo(e.target.value)}
              aria-label="Motivo"
            />
          </div>
        )}
      </div>

      {errore && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errore}
        </p>
      )}
      {conferma && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Fatto: {conferma}. Se hai sbagliato, annulla dalla cronaca.
        </p>
      )}

      <button
        type="button"
        className="btn-primary w-full sm:w-auto"
        disabled={inCorso || scelti.length === 0 || puntiScelti === null}
        onClick={dai}
      >
        {inCorso
          ? 'Un attimo…'
          : scelti.length === 0
            ? 'Scegli a chi'
            : puntiScelti === null
              ? `Scegli per cosa (${nomeScelti})`
              : `Dai ${puntiConSegno(puntiScelti)} a ${nomeScelti}`}
      </button>
    </section>
  )
}
