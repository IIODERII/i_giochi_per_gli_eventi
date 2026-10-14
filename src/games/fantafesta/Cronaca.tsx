import { useState } from 'react'
import PuntiBadge from './PuntiBadge'
import type { Assegnazione, Giocatore } from './types'
import { messaggioErroreFirestore } from './useFantafesta'

const MOSTRATE = 15

interface Props {
  /** Dalla piu' recente. */
  assegnazioni: Assegnazione[]
  giocatori: Giocatore[]
  isAdmin: boolean
  annulla: (id: string) => Promise<void>
}

function ora(a: Assegnazione): string {
  const quando = a.createdAt?.toDate?.()
  return quando ? quando.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'ora'
}

/** Gli ultimi punti dati: per gli invitati e' la telecronaca, per l'admin il posto dove rimediare. */
export default function Cronaca({ assegnazioni, giocatori, isAdmin, annulla }: Props) {
  const [tutte, setTutte] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const nomi = new Map(giocatori.map((g) => [g.id, g.nome]))
  const visibili = tutte ? assegnazioni : assegnazioni.slice(0, MOSTRATE)

  async function togli(id: string) {
    try {
      await annulla(id)
      setErrore(null)
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 text-2xl font-semibold text-primario-800">La cronaca</h2>
      {errore && <p className="mb-3 text-sm text-red-700">{errore}</p>}

      {assegnazioni.length === 0 ? (
        <p className="py-6 text-center text-sm text-inchiostro/55">
          Nessun punto ancora: la gara comincia alla festa.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-crema-200">
            {visibili.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-2.5">
                <PuntiBadge punti={a.punti} />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-inchiostro">{nomi.get(a.giocatoreId) ?? '—'}</span>{' '}
                  <span className="text-inchiostro/75">{a.motivo}</span>
                  <span className="ml-1.5 text-xs text-inchiostro/40">{ora(a)}</span>
                </div>
                {isAdmin && (
                  <button
                    className="btn-ghost shrink-0 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    onClick={() => togli(a.id)}
                  >
                    Annulla
                  </button>
                )}
              </li>
            ))}
          </ul>
          {assegnazioni.length > MOSTRATE && (
            <button className="btn-ghost mt-2 w-full text-xs" onClick={() => setTutte(!tutte)}>
              {tutte ? 'Mostra solo le ultime' : `Mostra tutte (${assegnazioni.length})`}
            </button>
          )}
        </>
      )}
    </section>
  )
}
