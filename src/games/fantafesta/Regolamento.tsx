import { useState } from 'react'
import Loader from '../../components/Loader'
import { impronta } from '../bingo/types'
import PuntiBadge from './PuntiBadge'
import { ordinaRegole, PUNTI_MAX, TESTO_MAX, validaPunti, validaTesto, type Regola } from './types'
import { messaggioErroreFirestore, type Fantafesta } from './useFantafesta'

interface Props {
  regole: Regola[]
  caricamento: boolean
  isAdmin: boolean
  modifica: Fantafesta['regole']['modifica']
  elimina: Fantafesta['regole']['elimina']
}

export default function Regolamento({ regole, caricamento, isAdmin, modifica, elimina }: Props) {
  const [filtro, setFiltro] = useState('')
  const [inModifica, setInModifica] = useState<string | null>(null)
  const [daEliminare, setDaEliminare] = useState<string | null>(null)
  const [bozzaTesto, setBozzaTesto] = useState('')
  const [bozzaPunti, setBozzaPunti] = useState('')
  const [errore, setErrore] = useState<string | null>(null)

  const cercato = impronta(filtro)
  const visibili = ordinaRegole(
    cercato ? regole.filter((r) => impronta(r.testo).includes(cercato)) : regole,
  )
  const bonus = regole.filter((r) => r.punti > 0).length

  function apriModifica(r: Regola) {
    setInModifica(r.id)
    setDaEliminare(null)
    setErrore(null)
    setBozzaTesto(r.testo)
    setBozzaPunti(String(r.punti))
  }

  async function salva(r: Regola) {
    const t = validaTesto(bozzaTesto)
    if (!t.ok) return setErrore(t.errore ?? null)
    const p = validaPunti(Number(bozzaPunti), PUNTI_MAX)
    if (!p.ok) return setErrore(p.errore ?? null)
    try {
      await modifica(r.id, { testo: t.valore, punti: p.valore, autore: r.autore ?? '' })
      setInModifica(null)
      setErrore(null)
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    }
  }

  async function conferma(id: string) {
    try {
      await elimina(id)
      setDaEliminare(null)
      setErrore(null)
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-1 text-2xl font-semibold text-primario-800">
        Il regolamento{' '}
        <span className="text-base font-normal text-inchiostro/50">({regole.length})</span>
      </h2>
      {regole.length > 0 && (
        <p className="mb-4 text-xs text-inchiostro/55">
          {bonus} bonus e {regole.length - bonus} malus
        </p>
      )}

      {regole.length > 6 && (
        <input
          className="field mb-4"
          placeholder="Cerca nel regolamento…"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      )}

      {errore && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errore}
        </p>
      )}

      {caricamento ? (
        <Loader testo="Carico il regolamento…" />
      ) : visibili.length === 0 ? (
        <p className="py-8 text-center text-sm text-inchiostro/55">
          {regole.length === 0
            ? 'Il regolamento è ancora vuoto: proponi il primo bonus!'
            : 'Niente corrisponde alla ricerca.'}
        </p>
      ) : (
        <ul className="divide-y divide-crema-200">
          {visibili.map((r) => (
            <li key={r.id} className="py-3">
              {inModifica === r.id ? (
                <div className="space-y-2">
                  <textarea
                    className="field min-h-16 resize-y"
                    value={bozzaTesto}
                    maxLength={TESTO_MAX}
                    onChange={(e) => setBozzaTesto(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm text-inchiostro/70">
                    Punti
                    <input
                      type="number"
                      className="field w-28"
                      value={bozzaPunti}
                      min={-PUNTI_MAX}
                      max={PUNTI_MAX}
                      onChange={(e) => setBozzaPunti(e.target.value)}
                    />
                    <span className="text-xs text-inchiostro/50">negativo per un malus</span>
                  </label>
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={() => salva(r)}>
                      Salva
                    </button>
                    <button className="btn-ghost" onClick={() => setInModifica(null)}>
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <PuntiBadge punti={r.punti} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-inchiostro/90">{r.testo}</p>
                    {r.autore && <p className="mt-0.5 text-xs text-inchiostro/45">{r.autore}</p>}
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => apriModifica(r)}>
                        Modifica
                      </button>
                      {daEliminare === r.id ? (
                        <span className="flex items-center gap-1">
                          <button className="btn-danger px-2 py-1 text-xs" onClick={() => conferma(r.id)}>
                            Confermi?
                          </button>
                          <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setDaEliminare(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          className="btn-ghost px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          onClick={() => setDaEliminare(r.id)}
                        >
                          Elimina
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
