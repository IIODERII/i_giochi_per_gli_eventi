import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db } from '../../firebase'
import { messaggioErroreFirestore } from '../shared/raccolta'
import { normalizzaPapiro, type Papiro } from './types'

/** Dopo quanto dall'ultima modifica il testo viene salvato. */
const RITARDO_SALVATAGGIO = 1500

export type StatoSalvataggio = 'salvato' | 'da-salvare' | 'salvataggio' | 'errore'

/**
 * Il papiro lo scrive solo l'admin, quindi si legge una volta sola e poi si
 * lavora sulla copia nel browser, salvandola poco dopo ogni modifica: niente
 * aggiornamenti dal database che spostino il cursore mentre si scrive.
 */
export function usePapiro(eventoId: string) {
  const rifTesto = useMemo(() => doc(db, 'eventi', eventoId, 'papiro', 'testo'), [eventoId])
  const rifImmagine = useMemo(() => doc(db, 'eventi', eventoId, 'papiro', 'immagine'), [eventoId])

  const [papiro, setPapiro] = useState<Papiro | null>(null)
  const [immagine, setImmagine] = useState<string | null>(null)
  const [stato, setStato] = useState<StatoSalvataggio>('salvato')
  const [errore, setErrore] = useState<string | null>(null)

  const daSalvare = useRef<Papiro | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let attivo = true
    Promise.all([getDoc(rifTesto), getDoc(rifImmagine)])
      .then(([testo, foto]) => {
        if (!attivo) return
        setPapiro(normalizzaPapiro(testo.data() as Partial<Papiro> | undefined))
        setImmagine((foto.data() as { foto?: string } | undefined)?.foto ?? null)
      })
      .catch((err) => {
        if (!attivo) return
        setErrore(messaggioErroreFirestore(err))
        setPapiro(normalizzaPapiro(undefined))
      })
    return () => {
      attivo = false
    }
  }, [rifTesto, rifImmagine])

  const salvaOra = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const dati = daSalvare.current
    if (!dati) return
    daSalvare.current = null
    setStato('salvataggio')
    try {
      await setDoc(rifTesto, dati)
      setErrore(null)
      setStato(daSalvare.current ? 'da-salvare' : 'salvato')
    } catch (err) {
      // si rimette in coda, a meno che nel frattempo non sia arrivato di meglio
      daSalvare.current ??= dati
      setErrore(messaggioErroreFirestore(err))
      setStato('errore')
    }
  }, [rifTesto])

  const aggiorna = useCallback(
    (modifica: Partial<Papiro>) => {
      setPapiro((attuale) => {
        if (!attuale) return attuale
        const nuovo = { ...attuale, ...modifica }
        daSalvare.current = nuovo
        return nuovo
      })
      setStato('da-salvare')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(salvaOra, RITARDO_SALVATAGGIO)
    },
    [salvaOra],
  )

  // uscendo dalla pagina si salva subito quello che manca; chiudendo la
  // scheda con modifiche in sospeso il browser chiede conferma
  useEffect(() => {
    function avvisa(e: BeforeUnloadEvent) {
      if (daSalvare.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', avvisa)
    return () => {
      window.removeEventListener('beforeunload', avvisa)
      void salvaOra()
    }
  }, [salvaOra])

  const salvaImmagine = useCallback(
    async (nuova: string | null) => {
      if (nuova) await setDoc(rifImmagine, { foto: nuova })
      else await deleteDoc(rifImmagine)
      setImmagine(nuova)
    },
    [rifImmagine],
  )

  return { papiro, immagine, stato, errore, aggiorna, salvaOra, salvaImmagine }
}
