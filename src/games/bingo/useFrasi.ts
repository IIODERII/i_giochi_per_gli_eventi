import { useCallback } from 'react'
import { useEvento } from '../../eventi/eventoContext'
import { useRaccolta } from '../shared/raccolta'
import type { DatiFrase, Frase } from './types'

export { messaggioErroreFirestore } from '../shared/raccolta'

export function useFrasi() {
  const { evento } = useEvento()
  const raccolta = useRaccolta<Frase>(`eventi/${evento.id}/frasi`)

  const aggiungi = useCallback(
    (dati: DatiFrase) => raccolta.aggiungi({ testo: dati.testo, autore: dati.autore ?? '' }),
    [raccolta],
  )

  const modifica = useCallback(
    (id: string, dati: DatiFrase) =>
      raccolta.modifica(id, { testo: dati.testo, autore: dati.autore ?? '' }),
    [raccolta],
  )

  return {
    frasi: raccolta.voci,
    caricamento: raccolta.caricamento,
    errore: raccolta.errore,
    aggiungi,
    modifica,
    elimina: raccolta.elimina,
  }
}
