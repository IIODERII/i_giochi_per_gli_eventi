import { doc, onSnapshot, type Firestore } from 'firebase/firestore'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/authContext'
import Loader from '../components/Loader'
import { COLORE_PREDEFINITO, NOME_SITO } from '../config'
import { db } from '../firebase'
import { messaggioErroreFirestore } from '../games/shared/raccolta'
import { applicaColore } from './colore'
import { EventoContext, percorsoEvento, type EventoState } from './eventoContext'
import { normalizzaEvento, titoloEvento, type Evento } from './types'

interface Props {
  eventoId: string
  /**
   * La pagina di gioco del QR legge con un'istanza Firebase tutta sua (vedi
   * cashorsara/istanzaGioco.ts): per questo il database si puo' passare.
   */
  firestore?: Firestore
  children: ReactNode
}

function Avviso({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-crema-100 px-4">
      <div className="card max-w-sm p-6 text-center">
        <h1 className="text-2xl font-semibold text-primario-800">{titolo}</h1>
        <p className="mt-2 text-sm text-inchiostro/65">{testo}</p>
      </div>
    </div>
  )
}

/** Tiene in pagina l'evento e veste il sito con il suo colore e il suo titolo. */
export default function EventoProvider({ eventoId, firestore = db, children }: Props) {
  const { ruolo, eventoId: mioEvento } = useAuth()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [stato, setStato] = useState<'caricamento' | 'pronto' | 'mancante' | 'errore'>('caricamento')
  const [errore, setErrore] = useState('')
  const [anteprimaColore, setAnteprimaColore] = useState<string | null>(null)

  // cambiando evento il componente si ricrea (vedi la key in EventoRoute e
  // GiocaRoute), quindi lo stato parte sempre da "caricamento"
  useEffect(() => {
    return onSnapshot(
      doc(firestore, 'eventi', eventoId),
      (istantanea) => {
        if (!istantanea.exists()) {
          setEvento(null)
          setStato('mancante')
          return
        }
        setEvento(normalizzaEvento(istantanea.id, istantanea.data() as Partial<Evento>))
        setStato('pronto')
      },
      (err) => {
        setErrore(messaggioErroreFirestore(err))
        setStato('errore')
      },
    )
  }, [eventoId, firestore])

  const colore = anteprimaColore ?? evento?.colore ?? COLORE_PREDEFINITO
  useEffect(() => {
    applicaColore(colore)
    return () => applicaColore(COLORE_PREDEFINITO)
  }, [colore])

  const titolo = evento ? titoloEvento(evento) : NOME_SITO
  useEffect(() => {
    document.title = titolo
    return () => {
      document.title = NOME_SITO
    }
  }, [titolo])

  const percorso = useCallback((sotto?: string) => percorsoEvento(eventoId, sotto), [eventoId])

  const value = useMemo<EventoState | null>(
    () =>
      evento && {
        evento,
        isAdmin: ruolo === 'superadmin' || (ruolo === 'admin' && mioEvento === evento.id),
        isSuperadmin: ruolo === 'superadmin',
        percorso,
        setAnteprimaColore,
      },
    [evento, ruolo, mioEvento, percorso],
  )

  if (stato === 'caricamento') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema-100">
        <Loader testo="Un attimo…" />
      </div>
    )
  }
  if (stato === 'mancante') {
    return (
      <Avviso
        titolo="Evento non trovato"
        testo="Questo evento non esiste, oppure è stato eliminato. Controlla l'indirizzo."
      />
    )
  }
  if (stato === 'errore' || !value) {
    return <Avviso titolo="Qualcosa non va" testo={errore || 'Evento non disponibile.'} />
  }

  return <EventoContext.Provider value={value}>{children}</EventoContext.Provider>
}
