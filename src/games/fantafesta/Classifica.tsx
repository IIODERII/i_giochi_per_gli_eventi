import { useState } from 'react'
import Loader from '../../components/Loader'
import { impronta } from '../bingo/types'
import { leggiAutore } from '../shared/autore'
import PuntiBadge from './PuntiBadge'
import { NOME_MAX, validaNome, type Posizione } from './types'
import { messaggioErroreFirestore, type Fantafesta } from './useFantafesta'

const MEDAGLIE = ['🥇', '🥈', '🥉']

interface Props {
  classifica: Posizione[]
  caricamento: boolean
  isAdmin: boolean
  rinomina: Fantafesta['giocatori']['modifica']
  elimina: (id: string) => Promise<void>
}

export default function Classifica({ classifica, caricamento, isAdmin, rinomina, elimina }: Props) {
  const [aperto, setAperto] = useState<string | null>(null)
  const [inModifica, setInModifica] = useState<string | null>(null)
  const [bozza, setBozza] = useState('')
  const [daEliminare, setDaEliminare] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  const mio = impronta(leggiAutore())

  function apri(id: string) {
    setAperto(aperto === id ? null : id)
    setInModifica(null)
    setDaEliminare(null)
    setErrore(null)
  }

  async function salvaNome(id: string) {
    const n = validaNome(bozza)
    if (!n.ok) return setErrore(n.errore ?? null)
    if (classifica.some((p) => p.giocatore.id !== id && impronta(p.giocatore.nome) === impronta(n.valore))) {
      return setErrore('C’è già un giocatore con questo nome.')
    }
    try {
      await rinomina(id, { nome: n.valore })
      setInModifica(null)
      setErrore(null)
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    }
  }

  async function conferma(id: string) {
    try {
      await elimina(id)
      setAperto(null)
      setErrore(null)
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-1 text-2xl font-semibold text-primario-800">
        La classifica{' '}
        <span className="text-base font-normal text-inchiostro/50">({classifica.length})</span>
      </h2>
      <p className="mb-4 text-xs text-inchiostro/55">
        Si aggiorna da sola. Tocca un nome per vedere da dove arrivano i suoi punti.
      </p>

      {caricamento ? (
        <Loader testo="Carico la classifica…" />
      ) : classifica.length === 0 ? (
        <p className="py-8 text-center text-sm text-inchiostro/55">
          Ancora nessuno in gara: iscriviti per primo!
        </p>
      ) : (
        <ol className="space-y-1.5">
          {classifica.map(({ giocatore, totale, posto, assegnazioni }) => {
            const sono = mio !== '' && impronta(giocatore.nome) === mio
            const espanso = aperto === giocatore.id
            return (
              <li
                key={giocatore.id}
                className={`rounded-lg border ${
                  sono ? 'border-oro-400 bg-oro-100/50' : 'border-crema-200 bg-crema-50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => apri(giocatore.id)}
                  aria-expanded={espanso}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left"
                >
                  <span className="w-8 shrink-0 text-center font-display text-xl font-semibold text-primario-700">
                    {totale !== 0 && MEDAGLIE[posto - 1] ? MEDAGLIE[posto - 1] : `${posto}°`}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-inchiostro">
                    {giocatore.nome}
                    {sono && <span className="ml-2 text-xs font-normal text-oro-600">tu</span>}
                  </span>
                  <span
                    className={`shrink-0 text-lg font-bold tabular-nums ${
                      totale < 0 ? 'text-red-700' : 'text-primario-800'
                    }`}
                  >
                    {totale}
                  </span>
                </button>

                {espanso && (
                  <div className="border-t border-crema-200 px-3 py-3">
                    {assegnazioni.length === 0 ? (
                      <p className="text-sm text-inchiostro/55">Ancora nessun punto.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {assegnazioni.map((a) => (
                          <li key={a.id} className="flex items-start gap-2 text-sm">
                            <PuntiBadge punti={a.punti} />
                            <span className="text-inchiostro/80">{a.motivo}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isAdmin && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-crema-200 pt-3">
                        {inModifica === giocatore.id ? (
                          <>
                            <input
                              className="field min-w-0 flex-1 py-1.5"
                              value={bozza}
                              maxLength={NOME_MAX}
                              onChange={(e) => setBozza(e.target.value)}
                              aria-label="Nuovo nome"
                            />
                            <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => salvaNome(giocatore.id)}>
                              Salva
                            </button>
                            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setInModifica(null)}>
                              Annulla
                            </button>
                          </>
                        ) : daEliminare === giocatore.id ? (
                          <>
                            <span className="text-xs text-red-700">
                              Tolgo {giocatore.nome} e tutti i suoi punti?
                            </span>
                            <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => conferma(giocatore.id)}>
                              Sì, togli
                            </button>
                            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setDaEliminare(null)}>
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-ghost px-3 py-1.5 text-xs"
                              onClick={() => {
                                setInModifica(giocatore.id)
                                setBozza(giocatore.nome)
                              }}
                            >
                              Cambia nome
                            </button>
                            <button
                              className="btn-ghost px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                              onClick={() => setDaEliminare(giocatore.id)}
                            >
                              Togli dalla gara
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {errore && <p className="mt-2 text-xs text-red-700">{errore}</p>}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
