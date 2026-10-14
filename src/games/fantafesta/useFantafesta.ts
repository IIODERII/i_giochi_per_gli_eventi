import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useCallback } from 'react'
import { useEvento } from '../../eventi/eventoContext'
import { auth, db } from '../../firebase'
import { useRaccolta } from '../shared/raccolta'
import type { Assegnazione, Giocatore, Regola } from './types'

export { messaggioErroreFirestore } from '../shared/raccolta'

export interface DatiPunti {
  regolaId: string
  motivo: string
  punti: number
}

/** Regolamento, giocatori e punti dell'evento, sempre aggiornati. */
export function useFantafesta() {
  const { evento } = useEvento()
  const base = `eventi/${evento.id}`
  const regole = useRaccolta<Regola>(`${base}/fantaregole`)
  const giocatori = useRaccolta<Giocatore>(`${base}/fantagiocatori`)
  const punti = useRaccolta<Assegnazione>(`${base}/fantapunti`)

  /** Gli stessi punti a piu' giocatori insieme (es. "tutto il tavolo balla"). */
  const assegna = useCallback(
    async (giocatoreIds: string[], dati: DatiPunti) => {
      const lotto = writeBatch(db)
      for (const giocatoreId of giocatoreIds) {
        lotto.set(doc(collection(db, `${base}/fantapunti`)), {
          ...dati,
          giocatoreId,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.email ?? '',
        })
      }
      await lotto.commit()
    },
    [base],
  )

  /** Toglie il giocatore e i suoi punti, che altrimenti resterebbero orfani. */
  const eliminaGiocatore = useCallback(
    async (id: string) => {
      const lotto = writeBatch(db)
      for (const a of punti.voci) {
        if (a.giocatoreId === id) lotto.delete(doc(db, `${base}/fantapunti`, a.id))
      }
      lotto.delete(doc(db, `${base}/fantagiocatori`, id))
      await lotto.commit()
    },
    [base, punti.voci],
  )

  return {
    regole,
    giocatori,
    punti,
    assegna,
    eliminaGiocatore,
    caricamento: regole.caricamento || giocatori.caricamento || punti.caricamento,
    errore: regole.errore ?? giocatori.errore ?? punti.errore,
  }
}

export type Fantafesta = ReturnType<typeof useFantafesta>
