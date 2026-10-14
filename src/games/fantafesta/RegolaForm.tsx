import { useState, type FormEvent } from 'react'
import Scelta from '../../components/Scelta'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi } from '../../eventi/types'
import { impronta } from '../bingo/types'
import { leggiAutore, salvaAutore } from '../shared/autore'
import PuntiBadge from './PuntiBadge'
import {
  AUTORE_MAX,
  PUNTI_PROPOSTI,
  TESTO_MAX,
  validaTesto,
  type Regola,
} from './types'
import { messaggioErroreFirestore, type Fantafesta } from './useFantafesta'

type Segno = 'bonus' | 'malus'

interface Props {
  regole: Regola[]
  aggiungi: Fantafesta['regole']['aggiungi']
}

export default function RegolaForm({ regole, aggiungi }: Props) {
  const { evento } = useEvento()
  const [testo, setTesto] = useState('')
  const [segno, setSegno] = useState<Segno>('bonus')
  const [valore, setValore] = useState(10)
  const [autore, setAutore] = useState(leggiAutore)
  const [errore, setErrore] = useState<string | null>(null)
  const [conferma, setConferma] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  const punti = segno === 'bonus' ? valore : -valore

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setConferma(null)

    const t = validaTesto(testo)
    if (!t.ok) return setErrore(t.errore ?? null)
    const nome = autore.trim().replace(/\s+/g, ' ')
    if (nome.length > AUTORE_MAX) {
      return setErrore(`Il nome può avere al massimo ${AUTORE_MAX} caratteri.`)
    }
    if (regole.some((r) => impronta(r.testo) === impronta(t.valore))) {
      return setErrore('Questa c’è già nel regolamento. Inventane un’altra!')
    }

    setErrore(null)
    setInCorso(true)
    try {
      await aggiungi({ testo: t.valore, punti, autore: nome })
      salvaAutore(nome)
      setTesto('')
      setConferma('Aggiunta al regolamento!')
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-5 sm:p-6">
      <h2 className="mb-1 text-2xl font-semibold text-primario-800">Proponi un bonus o un malus</h2>
      <p className="mb-5 text-sm text-inchiostro/60">
        Una cosa che qualcuno potrebbe fare alla festa: chi la fa davvero guadagna (o perde) i punti.
      </p>

      <div className="mb-4">
        <label htmlFor="regola" className="field-label">
          Cosa deve succedere
        </label>
        <textarea
          id="regola"
          className="field min-h-20 resize-y"
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder={
            segno === 'bonus'
              ? `es. Fa un brindisi a ${nomiBrevi(evento) || 'chi festeggia'} e si commuove`
              : 'es. Rovescia il vino sulla tovaglia'
          }
          maxLength={TESTO_MAX}
        />
        <p className="mt-1.5 text-xs text-inchiostro/50">
          Ancora {TESTO_MAX - testo.trim().length} caratteri.
        </p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[auto_1fr]">
        <div>
          <span className="field-label">È un…</span>
          <Scelta
            valore={segno}
            opzioni={['bonus', 'malus'] as const}
            onChange={setSegno}
            etichetta={(s) => (s === 'bonus' ? 'Bonus' : 'Malus')}
          />
        </div>
        <div>
          <span className="field-label">Quanti punti</span>
          <Scelta valore={valore} opzioni={PUNTI_PROPOSTI} onChange={setValore} etichetta={String} />
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="autore-fanta" className="field-label">
          Il tuo nome <span className="font-normal text-inchiostro/45">(facoltativo)</span>
        </label>
        <input
          id="autore-fanta"
          className="field"
          value={autore}
          onChange={(e) => setAutore(e.target.value)}
          placeholder="es. Marco"
          autoComplete="name"
          maxLength={AUTORE_MAX}
        />
      </div>

      {errore && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errore}
        </p>
      )}
      {conferma && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {conferma}
        </p>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={inCorso}>
        {inCorso ? (
          'Salvataggio…'
        ) : (
          <>
            Aggiungi <PuntiBadge punti={punti} />
          </>
        )}
      </button>
    </form>
  )
}
