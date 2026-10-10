import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import EventoProvider from '../../eventi/EventoProvider'
import GiocaPage from './GiocaPage'
import { istanzaGioco } from './istanzaGioco'

/**
 * La pagina del QR: aperta a tutti, senza password. Il telefono entra con
 * un'identita' anonima dell'istanza di gioco, che resta la stessa anche se
 * si ricarica la pagina: nome e puntate non vanno persi.
 */
export default function GiocaRoute() {
  const { eventoId = '' } = useParams()
  const { auth, db } = istanzaGioco()
  const [utente, setUtente] = useState<User | null>(null)
  const [errore, setErrore] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (attuale) => {
      if (attuale) setUtente(attuale)
      else signInAnonymously(auth).catch(() => setErrore(true))
    })
  }, [auth])

  if (!utente) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema-100 px-4">
        {errore ? (
          <p className="text-center text-sm text-red-700">
            Non riesco a collegarmi al gioco: controlla la connessione e ricarica la pagina.
          </p>
        ) : (
          <Loader testo="Un attimo…" />
        )}
      </div>
    )
  }

  return (
    <EventoProvider key={eventoId} eventoId={eventoId} firestore={db}>
      <GiocaPage mioId={utente.uid} firestore={db} />
    </EventoProvider>
  )
}
