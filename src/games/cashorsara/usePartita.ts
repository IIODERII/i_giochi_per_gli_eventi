import { doc, onSnapshot, type Firestore } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { messaggioErroreFirestore } from '../shared/raccolta'
import { riferimenti } from './riferimenti'
import {
  idRisposta,
  PARTITA_VUOTA,
  type Giocatore,
  type Partita,
  type Risposta,
  type Vetrina,
} from './types'

/**
 * Per regia e proiezione: segue in tempo reale stato della partita, foto in
 * vetrina, giocatori presenti e tutte le puntate. Sono solo un paio di
 * schermi, quindi possono permettersi di ascoltare tutto.
 */
export function usePartita(eventoId: string) {
  const [partita, setPartita] = useState<Partita>(PARTITA_VUOTA)
  const [vetrina, setVetrina] = useState<Vetrina | null>(null)
  const [giocatori, setGiocatori] = useState<Giocatore[]>([])
  const [risposte, setRisposte] = useState<Risposta[]>([])
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    const r = riferimenti(eventoId)

    const fermaPartita = onSnapshot(
      r.partita,
      (istantanea) => {
        const dati = istantanea.data() as Partita | undefined
        setPartita(dati ? { ...PARTITA_VUOTA, ...dati } : PARTITA_VUOTA)
        setErrore(null)
        setCaricamento(false)
      },
      (err) => {
        setErrore(messaggioErroreFirestore(err))
        setCaricamento(false)
      },
    )

    const fermaVetrina = onSnapshot(r.vetrina, (istantanea) => {
      setVetrina((istantanea.data() as Vetrina | undefined) ?? null)
    })

    const fermaGiocatori = onSnapshot(r.giocatori, (istantanea) => {
      setGiocatori(
        istantanea.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Giocatore, 'id'>) }))
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      )
    })

    const fermaRisposte = onSnapshot(r.risposte, (istantanea) => {
      setRisposte(istantanea.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Risposta, 'id'>) })))
    })

    return () => {
      fermaPartita()
      fermaVetrina()
      fermaGiocatori()
      fermaRisposte()
    }
  }, [eventoId])

  const risposteDelTurno = risposte.filter((r) => r.indice === partita.indice)
  const foto = vetrina && vetrina.indice === partita.indice ? vetrina.foto : null

  return { partita, foto, giocatori, risposte, risposteDelTurno, caricamento, errore }
}

/**
 * Per il telefono di un invitato: solo la partita, la foto in vetrina, se
 * stesso e la propria puntata. Esiti e classifica arrivano gia' calcolati
 * dentro la partita, quindi ogni passo del gioco costa una sola lettura per
 * telefono invece di una per ogni puntata di ogni altro giocatore.
 */
export function usePartitaGiocatore(firestore: Firestore, eventoId: string, giocatoreId: string) {
  const [partita, setPartita] = useState<Partita>(PARTITA_VUOTA)
  const [vetrina, setVetrina] = useState<Vetrina | null>(null)
  const [io, setIo] = useState<Giocatore | null>(null)
  const [miaPuntata, setMiaPuntata] = useState<Risposta | null>(null)
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    const r = riferimenti(eventoId, firestore)
    const fermaPartita = onSnapshot(
      r.partita,
      (istantanea) => {
        const dati = istantanea.data() as Partita | undefined
        setPartita(dati ? { ...PARTITA_VUOTA, ...dati } : PARTITA_VUOTA)
        setErrore(null)
        setCaricamento(false)
      },
      (err) => {
        setErrore(messaggioErroreFirestore(err))
        setCaricamento(false)
      },
    )
    const fermaVetrina = onSnapshot(r.vetrina, (istantanea) => {
      setVetrina((istantanea.data() as Vetrina | undefined) ?? null)
    })
    const fermaIo = onSnapshot(doc(r.giocatori, giocatoreId), (istantanea) => {
      setIo(istantanea.exists() ? { id: istantanea.id, ...(istantanea.data() as Omit<Giocatore, 'id'>) } : null)
    })
    return () => {
      fermaPartita()
      fermaVetrina()
      fermaIo()
    }
  }, [firestore, eventoId, giocatoreId])

  // la puntata ha un id prevedibile (indice__giocatore): basta seguire quel documento
  const indice = partita.indice
  useEffect(() => {
    const r = riferimenti(eventoId, firestore)
    return onSnapshot(doc(r.risposte, idRisposta(indice, giocatoreId)), (istantanea) => {
      setMiaPuntata(
        istantanea.exists() ? { id: istantanea.id, ...(istantanea.data() as Omit<Risposta, 'id'>) } : null,
      )
    })
  }, [firestore, eventoId, giocatoreId, indice])

  const foto = vetrina && vetrina.indice === partita.indice ? vetrina.foto : null
  // appena cambia oggetto, finche' non arriva la nuova, resta in mano la vecchia puntata
  const puntataAttuale = miaPuntata && miaPuntata.indice === indice ? miaPuntata : null

  return { partita, foto, io, miaPuntata: puntataAttuale, caricamento, errore }
}
