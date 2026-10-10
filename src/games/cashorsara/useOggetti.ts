import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { messaggioErroreFirestore } from '../shared/raccolta'
import { riferimenti } from './riferimenti'
import type { Oggetto } from './types'

export type DatiOggetto = Omit<Oggetto, 'id' | 'createdAt'>

export function useOggetti(eventoId: string) {
  const [oggetti, setOggetti] = useState<Oggetto[]>([])
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    const richiesta = query(riferimenti(eventoId).oggetti, orderBy('ordine', 'asc'))
    return onSnapshot(
      richiesta,
      (istantanea) => {
        setOggetti(istantanea.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Oggetto, 'id'>) })))
        setErrore(null)
        setCaricamento(false)
      },
      (err) => {
        setErrore(messaggioErroreFirestore(err))
        setCaricamento(false)
      },
    )
  }, [eventoId])

  const aggiungi = useCallback(
    async (dati: DatiOggetto) => {
      await addDoc(riferimenti(eventoId).oggetti, { ...dati, createdAt: serverTimestamp() })
    },
    [eventoId],
  )

  const modifica = useCallback(
    async (id: string, dati: Partial<DatiOggetto>) => {
      await updateDoc(doc(riferimenti(eventoId).oggetti, id), { ...dati })
    },
    [eventoId],
  )

  const elimina = useCallback(
    async (id: string) => {
      await deleteDoc(doc(riferimenti(eventoId).oggetti, id))
    },
    [eventoId],
  )

  /** Scambia di posto un oggetto con quello precedente o successivo. */
  const sposta = useCallback(
    async (id: string, direzione: -1 | 1) => {
      const posizione = oggetti.findIndex((o) => o.id === id)
      const vicino = oggetti[posizione + direzione]
      if (posizione < 0 || !vicino) return
      const corrente = oggetti[posizione]
      const r = riferimenti(eventoId)
      await Promise.all([
        updateDoc(doc(r.oggetti, corrente.id), { ordine: vicino.ordine }),
        updateDoc(doc(r.oggetti, vicino.id), { ordine: corrente.ordine }),
      ])
    },
    [oggetti, eventoId],
  )

  return { oggetti, caricamento, errore, aggiungi, modifica, elimina, sposta }
}
