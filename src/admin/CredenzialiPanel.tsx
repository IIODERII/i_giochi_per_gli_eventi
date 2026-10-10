import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import Copia from '../components/Copia'
import Loader from '../components/Loader'
import { db } from '../firebase'
import type { Credenziali, RuoloEvento } from './account'
import { rigeneraPassword } from './gestioneEventi'
import { messaggioAdmin, messaggioOspiti } from './messaggi'

const ETICHETTE: Record<RuoloEvento, { titolo: string; spiegazione: string }> = {
  admin: {
    titolo: 'Organizzatore (admin)',
    spiegazione: 'Imposta la festa, modera i contenuti, stampa e conduce i giochi.',
  },
  ospiti: {
    titolo: 'Invitati',
    spiegazione: 'Un solo accesso per tutti: propongono parole e previsioni.',
  },
}

interface Props {
  eventoId: string
  /** Il titolo dell'evento, se gia' impostato: finisce nel messaggio agli invitati. */
  titolo?: string
  ruoli?: RuoloEvento[]
  /** Solo Oder puo' rigenerare le password. */
  gestione?: boolean
}

export default function CredenzialiPanel({
  eventoId,
  titolo,
  ruoli = ['admin', 'ospiti'],
  gestione = false,
}: Props) {
  const [credenziali, setCredenziali] = useState<Credenziali | null>(null)
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)
  const [daRigenerare, setDaRigenerare] = useState<RuoloEvento | null>(null)
  const [inCorso, setInCorso] = useState(false)

  useEffect(() => {
    return onSnapshot(
      doc(db, 'credenziali', eventoId),
      (istantanea) => {
        setCredenziali((istantanea.data() as Credenziali | undefined) ?? null)
        setCaricamento(false)
      },
      () => {
        setErrore('Non riesco a leggere le credenziali.')
        setCaricamento(false)
      },
    )
  }, [eventoId])

  async function rigenera(ruolo: RuoloEvento) {
    if (!credenziali) return
    setErrore(null)
    setInCorso(true)
    try {
      await rigeneraPassword(eventoId, credenziali, ruolo)
      setDaRigenerare(null)
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Password non cambiata.')
    } finally {
      setInCorso(false)
    }
  }

  if (caricamento) return <Loader testo="Carico le credenziali…" />
  if (!credenziali) {
    return <p className="text-sm text-red-700">{errore ?? 'Credenziali non trovate.'}</p>
  }

  return (
    <div className="space-y-3">
      {errore && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errore}
        </p>
      )}

      {ruoli.map((ruolo) => {
        const account = credenziali[ruolo]
        const messaggio =
          ruolo === 'admin' ? messaggioAdmin(account) : messaggioOspiti(account, titolo)
        return (
          <div key={ruolo} className="rounded-lg border border-oro-200 bg-crema-50 p-4">
            <p className="font-semibold text-primario-800">{ETICHETTE[ruolo].titolo}</p>
            <p className="mb-3 text-xs text-inchiostro/55">{ETICHETTE[ruolo].spiegazione}</p>

            <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 text-sm">
              <dt className="text-inchiostro/55">Utente</dt>
              <dd className="truncate font-mono font-semibold">{account.username}</dd>
              <Copia testo={account.username} />
              <dt className="text-inchiostro/55">Password</dt>
              <dd className="truncate font-mono font-semibold">{account.password}</dd>
              <Copia testo={account.password} />
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Copia
                testo={messaggio}
                etichetta="Copia il messaggio da inviare"
                className="btn-primary px-3 py-1.5 text-xs"
              />
              {gestione &&
                (daRigenerare === ruolo ? (
                  <>
                    <span className="text-xs text-inchiostro/60">
                      La vecchia password smetterà di funzionare.
                    </span>
                    <button
                      className="btn-danger px-2.5 py-1 text-xs"
                      disabled={inCorso}
                      onClick={() => rigenera(ruolo)}
                    >
                      {inCorso ? 'Un attimo…' : 'Sì, cambiala'}
                    </button>
                    <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setDaRigenerare(null)}>
                      No
                    </button>
                  </>
                ) : (
                  <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => setDaRigenerare(ruolo)}>
                    Nuova password
                  </button>
                ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
