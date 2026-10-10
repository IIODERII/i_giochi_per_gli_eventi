import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { firebaseConfig } from '../../firebase'

let istanza: { auth: Auth; db: Firestore } | null = null

/**
 * La pagina del QR entra con un'identita' anonima tutta sua, separata
 * dall'accesso del sito. Senza questa separazione chi ha gia' fatto login
 * come "<evento>-ospiti" giocherebbe con l'utente condiviso da tutti gli
 * invitati, e i telefoni si ruberebbero nome e puntate a vicenda.
 */
export function istanzaGioco(): { auth: Auth; db: Firestore } {
  if (!istanza) {
    const app = initializeApp(firebaseConfig, 'gioco')
    istanza = { auth: getAuth(app), db: getFirestore(app) }
  }
  return istanza
}
