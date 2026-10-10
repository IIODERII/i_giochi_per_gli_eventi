import { deleteDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { useCallback, useEffect, useState } from 'react'
import { riferimenti } from './riferimenti'

/** La foto del presentatore di Cash or ...: la vedono solo admin e proiezione. */
export function useFotoPresentatore(eventoId: string) {
  const [foto, setFoto] = useState<string | null>(null)
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    return onSnapshot(
      riferimenti(eventoId).presentatore,
      (istantanea) => {
        const dati = istantanea.data() as { foto?: string | null } | undefined
        setFoto(dati?.foto ?? null)
        setCaricamento(false)
      },
      () => setCaricamento(false),
    )
  }, [eventoId])

  const salva = useCallback(
    async (nuova: string | null) => {
      const rif = riferimenti(eventoId).presentatore
      if (nuova) await setDoc(rif, { foto: nuova })
      else await deleteDoc(rif)
    },
    [eventoId],
  )

  return { foto, caricamento, salva }
}
