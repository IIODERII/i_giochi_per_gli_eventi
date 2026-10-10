import type { Firestore } from 'firebase/firestore'
import { useState, type FormEvent } from 'react'
import IconaEvento from '../../components/IconaEvento'
import Loader from '../../components/Loader'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, titoloGioco } from '../../eventi/types'
import { messaggioErroreFirestore } from '../shared/raccolta'
import { entraInPartita, inviaPuntata, nomiInGara } from './comandi'
import { euro, nomeValido, VALORE_MAX } from './types'
import { usePartitaGiocatore } from './usePartita'

interface Props {
  /** L'identita' anonima di questo telefono (vedi istanzaGioco.ts). */
  mioId: string
  firestore: Firestore
}

export default function GiocaPage({ mioId, firestore }: Props) {
  const { evento } = useEvento()
  const eventoId = evento.id
  const { partita, foto, io, miaPuntata, caricamento } = usePartitaGiocatore(
    firestore,
    eventoId,
    mioId,
  )
  const [nome, setNome] = useState('')
  const [cifra, setCifra] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  const valore = partita.valoriRivelati[String(partita.indice)]
  // esiti e classifica li ha gia' calcolati e salvati chi ha rivelato il valore
  const mioEsito = partita.stato === 'rivelato' ? (partita.esiti[mioId] ?? null) : null
  const generale = partita.classifica
  const miaPosizione = generale.find((r) => r.giocatoreId === mioId) ?? null

  async function entra(e: FormEvent) {
    e.preventDefault()
    const controllo = nomeValido(nome)
    if (!controllo.ok) return setErrore(controllo.errore ?? null)
    setErrore(null)
    setInCorso(true)
    try {
      const altri = await nomiInGara(firestore, eventoId)
      if (
        altri.some((g) => g.id !== mioId && g.nome.toLowerCase() === controllo.valore.toLowerCase())
      ) {
        setErrore('C’è già un altro giocatore con questo nome: aggiungi il cognome.')
        return
      }
      await entraInPartita(firestore, eventoId, mioId, controllo.valore)
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    } finally {
      setInCorso(false)
    }
  }

  async function punta(e: FormEvent) {
    e.preventDefault()
    const importo = Math.round(Number(cifra))
    if (!Number.isFinite(importo) || importo < 0 || importo > VALORE_MAX) {
      return setErrore('Scrivi una cifra in euro.')
    }
    setErrore(null)
    setInCorso(true)
    try {
      await inviaPuntata(firestore, eventoId, partita.indice, mioId, io?.nome ?? 'Ospite', importo)
      setCifra('')
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    } finally {
      setInCorso(false)
    }
  }

  if (caricamento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema-100">
        <Loader testo="Un attimo…" />
      </div>
    )
  }

  if (!evento.configurato || !evento.giochi.cashorsara.attivo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema-100 px-4">
        <div className="card max-w-sm p-6 text-center">
          <h1 className="text-2xl font-semibold text-primario-800">Gioco non disponibile</h1>
          <p className="mt-2 text-sm text-inchiostro/65">
            Questo gioco non è attivo per la festa. Chiedi agli organizzatori!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema-100 px-4 py-6">
      <div className="mx-auto w-full max-w-md space-y-5">
        <header className="text-center">
          <IconaEvento tipo={evento.tipo} className="mx-auto mb-2 h-9 w-12 text-primario-700" />
          <h1 className="font-display text-3xl font-semibold text-primario-800">
            {titoloGioco(evento, 'cashorsara')}
          </h1>
          <p className="text-sm text-inchiostro/55">
            Quanto vale? Indovina il prezzo insieme a {nomiBrevi(evento)}
          </p>
        </header>

        {errore && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errore}
          </p>
        )}

        {!io ? (
          <form onSubmit={entra} className="card p-5">
            <label htmlFor="nome-giocatore" className="field-label">
              Come ti chiami?
            </label>
            <input
              id="nome-giocatore"
              className="field mb-4"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Il tuo nome"
              autoComplete="given-name"
            />
            <button type="submit" className="btn-primary w-full" disabled={inCorso}>
              Entra in partita
            </button>
            <p className="mt-3 text-center text-xs text-inchiostro/45">
              Comparirà sullo schermo insieme agli altri giocatori.
            </p>
          </form>
        ) : (
          <>
            <p className="text-center text-sm text-inchiostro/55">
              Ciao <span className="font-semibold text-primario-700">{io.nome}</span>
              {miaPosizione && miaPosizione.turni > 0 && (
                <> · {miaPosizione.punti} punti, {miaPosizione.posizione}º posto</>
              )}
            </p>

            {partita.stato === 'attesa' && (
              <div className="card p-6 text-center">
                <p className="text-4xl">🍾</p>
                <p className="mt-2 font-semibold text-primario-800">Sei in gara!</p>
                <p className="mt-1 text-sm text-inchiostro/60">
                  Aspetta che venga presentato il primo oggetto. Tieni d'occhio lo schermo.
                </p>
              </div>
            )}

            {partita.stato === 'puntate' && (
              <form onSubmit={punta} className="card p-5">
                {foto && (
                  <img
                    src={foto}
                    alt=""
                    className="mb-3 max-h-44 w-full rounded-lg object-contain"
                  />
                )}
                <h2 className="text-xl font-semibold text-primario-800">{partita.oggettoNome}</h2>
                {/* la storia puo' essere lunga: chiusa, per non spingere giu' la puntata */}
                {partita.oggettoStoria && (
                  <details className="mt-1 mb-4 text-sm text-inchiostro/65">
                    <summary className="cursor-pointer font-medium text-primario-700">
                      {evento.presentatore
                        ? `Rileggi la storia di ${evento.presentatore}`
                        : 'Rileggi la storia'}
                    </summary>
                    <p className="mt-2 whitespace-pre-line">{partita.oggettoStoria}</p>
                  </details>
                )}

                {miaPuntata && (
                  <p className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                    Hai puntato {euro(miaPuntata.valore)}. Puoi ancora cambiare idea.
                  </p>
                )}

                <label htmlFor="cifra" className="field-label">
                  Quanto vale, secondo te?
                </label>
                <div className="flex gap-2">
                  <input
                    id="cifra"
                    className="field flex-1 text-lg"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={VALORE_MAX}
                    value={cifra}
                    onChange={(e) => setCifra(e.target.value)}
                    placeholder="euro"
                  />
                  <button type="submit" className="btn-primary" disabled={inCorso}>
                    {miaPuntata ? 'Cambia' : 'Punta'}
                  </button>
                </div>
              </form>
            )}

            {partita.stato === 'chiuse' && (
              <div className="card p-6 text-center">
                <p className="font-semibold text-primario-800">Puntate chiuse</p>
                <p className="mt-1 text-sm text-inchiostro/60">
                  {miaPuntata
                    ? `La tua stima: ${euro(miaPuntata.valore)}`
                    : 'Questa volta non hai puntato.'}
                </p>
                <p className="mt-2 text-sm text-inchiostro/45">Guarda lo schermo…</p>
              </div>
            )}

            {partita.stato === 'rivelato' && (
              <div className="card p-6 text-center">
                <p className="text-sm uppercase tracking-wide text-inchiostro/45">valutazione</p>
                <p className="font-display text-4xl font-semibold text-primario-800">
                  {valore != null ? euro(valore) : '—'}
                </p>
                {mioEsito ? (
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="text-inchiostro/70">
                      La tua stima: <span className="font-semibold">{euro(mioEsito.stima)}</span>
                    </p>
                    <p className="text-inchiostro/70">
                      Hai sbagliato del {(mioEsito.errore * 100).toFixed(0)}%
                    </p>
                    <p className="text-lg font-semibold text-primario-700">
                      +{mioEsito.punti} punti
                      {mioEsito.piuVicino && ' · il più vicino di tutti!'}
                    </p>
                    <p className="text-inchiostro/50">
                      {mioEsito.posizione}º su {partita.puntateTurno} per questo oggetto
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-inchiostro/55">
                    Non hai puntato su questo oggetto.
                  </p>
                )}
              </div>
            )}

            {partita.stato === 'finita' && (
              <div className="card p-6">
                <p className="mb-3 text-center font-display text-2xl font-semibold text-primario-800">
                  Classifica finale
                </p>
                <ol className="space-y-1.5 text-sm">
                  {generale.map((r) => (
                    <li
                      key={r.giocatoreId}
                      className={`flex items-baseline justify-between gap-2 rounded px-2 py-1 ${
                        r.giocatoreId === mioId ? 'bg-oro-100 font-semibold' : ''
                      }`}
                    >
                      <span>
                        <span className="mr-2 text-inchiostro/40">{r.posizione}º</span>
                        {r.nome}
                      </span>
                      <span className="text-primario-700">{r.punti}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
