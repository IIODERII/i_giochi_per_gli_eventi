import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { emailToUsername, SUPERADMIN_UID, usernameToEmail } from '../config'
import { auth, db } from '../firebase'
import { AuthContext, type AuthState, type Ruolo } from './authContext'

interface Profilo {
  ruolo: Ruolo | null
  eventoId: string | null
}

/**
 * Chi non e' il superadmin trova ruolo ed evento in utenti/{uid}, scritto da
 * Oder quando crea l'evento. Le regole di Firestore leggono lo stesso
 * documento, quindi quello che si vede qui coincide con quello che si puo' fare.
 */
async function caricaProfilo(utente: User): Promise<Profilo> {
  if (utente.uid === SUPERADMIN_UID) return { ruolo: 'superadmin', eventoId: null }
  if (utente.isAnonymous) return { ruolo: null, eventoId: null }
  try {
    const istantanea = await getDoc(doc(db, 'utenti', utente.uid))
    const dati = istantanea.data()
    if (dati && (dati.ruolo === 'admin' || dati.ruolo === 'ospiti') && typeof dati.eventoId === 'string') {
      return { ruolo: dati.ruolo, eventoId: dati.eventoId }
    }
  } catch {
    /* profilo illeggibile: l'utente resta senza evento */
  }
  return { ruolo: null, eventoId: null }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profilo, setProfilo] = useState<Profilo>({ ruolo: null, eventoId: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ultimo = 0
    return onAuthStateChanged(auth, async (utente) => {
      // se l'utente cambia mentre il profilo si sta caricando, vince l'ultimo
      const turno = ++ultimo
      setLoading(true)
      const nuovo = utente ? await caricaProfilo(utente) : { ruolo: null, eventoId: null }
      if (turno !== ultimo) return
      setUser(utente)
      setProfilo(nuovo)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      username: emailToUsername(user?.email),
      ruolo: profilo.ruolo,
      eventoId: profilo.eventoId,
      isSuperadmin: profilo.ruolo === 'superadmin',
      loading,
      login: async (username: string, password: string) => {
        await signInWithEmailAndPassword(auth, usernameToEmail(username), password)
      },
      logout: async () => {
        await signOut(auth)
      },
    }),
    [user, profilo, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
