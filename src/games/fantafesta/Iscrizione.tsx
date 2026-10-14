import { useState, type FormEvent } from 'react'
import { impronta } from '../bingo/types'
import { leggiAutore, salvaAutore } from '../shared/autore'
import { NOME_MAX, validaNome, type Giocatore } from './types'
import { messaggioErroreFirestore, type Fantafesta } from './useFantafesta'

interface Props {
  giocatori: Giocatore[]
  isAdmin: boolean
  aggiungi: Fantafesta['giocatori']['aggiungi']
}

/** Gli invitati si mettono in gara da soli; l'admin aggiunge anche chi non ha il telefono. */
export default function Iscrizione({ giocatori, isAdmin, aggiungi }: Props) {
  const [nome, setNome] = useState(() => (isAdmin ? '' : leggiAutore()))
  const [errore, setErrore] = useState<string | null>(null)
  const [conferma, setConferma] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  const mio = leggiAutore()
  const giaInGara = !isAdmin && mio && giocatori.some((g) => impronta(g.nome) === impronta(mio))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setConferma(null)
    const n = validaNome(nome)
    if (!n.ok) return setErrore(n.errore ?? null)
    if (giocatori.some((g) => impronta(g.nome) === impronta(n.valore))) {
      return setErrore(
        isAdmin
          ? 'C’è già un giocatore con questo nome.'
          : 'C’è già qualcuno con questo nome: se non sei tu, aggiungi l’iniziale del cognome.',
      )
    }

    setErrore(null)
    setInCorso(true)
    try {
      await aggiungi({ nome: n.valore })
      if (isAdmin) {
        setNome('')
        setConferma(`${n.valore} è in gara.`)
      } else {
        salvaAutore(n.valore)
        setConferma('Sei in gara! Ora fatti notare.')
      }
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 sm:p-6">
      <h2 className="mb-1 text-2xl font-semibold text-primario-800">
        {isAdmin ? 'Aggiungi un giocatore' : 'Entra in gara'}
      </h2>
      <p className="mb-4 text-sm text-inchiostro/60">
        {isAdmin
          ? 'Gli invitati si iscrivono da soli: qui aggiungi chi non ha il telefono, o i festeggiati.'
          : giaInGara
            ? `Sei già in classifica come ${mio}. Puoi iscrivere anche qualcun altro.`
            : 'Scrivi il tuo nome: durante la festa chi organizza ti darà i punti per quello che combini.'}
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          className="field min-w-0 flex-1"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="es. Marco R."
          autoComplete={isAdmin ? 'off' : 'name'}
          maxLength={NOME_MAX}
          aria-label="Nome"
        />
        <button type="submit" className="btn-primary" disabled={inCorso}>
          {inCorso ? 'Un attimo…' : isAdmin ? 'Aggiungi' : 'Iscrivimi'}
        </button>
      </div>

      {errore && <p className="mt-3 text-sm text-red-700">{errore}</p>}
      {conferma && <p className="mt-3 text-sm text-green-800">{conferma}</p>}
    </form>
  )
}
