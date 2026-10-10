import { FirebaseError, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  deleteUser,
  inMemoryPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type Auth,
} from 'firebase/auth'
import type { Timestamp } from 'firebase/firestore'
import { usernameToEmail } from '../config'
import { firebaseConfig } from '../firebase'

export type RuoloEvento = 'admin' | 'ospiti'

export interface Account {
  username: string
  password: string
  uid: string
}

/** Documento credenziali/{eventoId}: lo leggono Oder e l'admin dell'evento. */
export interface Credenziali {
  admin: Account
  ospiti: Account
  aggiornateIl?: Timestamp | null
}

/**
 * Dal browser Firebase non lascia creare utenti per conto d'altri: creare un
 * account vorrebbe dire entrarci, e Oder verrebbe disconnesso. Per questo
 * gli account si gestiscono da una seconda istanza di Firebase, che non
 * ricorda nulla (persistenza in memoria) e non tocca l'accesso del sito.
 */
let authGestione: Auth | null = null

function gestione(): Auth {
  if (!authGestione) {
    const app = initializeApp(firebaseConfig, 'gestione-account')
    authGestione = initializeAuth(app, { persistence: inMemoryPersistence })
  }
  return authGestione
}

// lettere e cifre che non si confondono fra loro quando si dettano o si
// ricopiano: niente 0/o, 1/l/i
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789'

/** Password casuale, generata con il generatore crittografico del browser. */
export function generaPassword(lunghezza = 10): string {
  const limite = 256 - (256 % ALFABETO.length) // scarta i valori che falserebbero le probabilita'
  let password = ''
  while (password.length < lunghezza) {
    for (const byte of crypto.getRandomValues(new Uint8Array(lunghezza * 2))) {
      if (byte < limite && password.length < lunghezza) password += ALFABETO[byte % ALFABETO.length]
    }
  }
  return password
}

export function usernameEvento(eventoId: string, ruolo: RuoloEvento): string {
  return `${eventoId}-${ruolo}`
}

/** Crea l'account e restituisce il suo UID. */
export async function creaAccount(username: string, password: string): Promise<string> {
  const a = gestione()
  const { user } = await createUserWithEmailAndPassword(a, usernameToEmail(username), password)
  await signOut(a)
  return user.uid
}

/** Per eliminare un account bisogna entrarci: per questo si conservano le password. */
export async function eliminaAccount(account: Account): Promise<void> {
  const a = gestione()
  const { user } = await signInWithEmailAndPassword(a, usernameToEmail(account.username), account.password)
  await deleteUser(user)
}

export async function cambiaPassword(account: Account, nuova: string): Promise<void> {
  const a = gestione()
  const { user } = await signInWithEmailAndPassword(a, usernameToEmail(account.username), account.password)
  try {
    await updatePassword(user, nuova)
  } finally {
    await signOut(a)
  }
}

export function messaggioErroreAccount(errore: unknown): string {
  if (errore instanceof FirebaseError) {
    switch (errore.code) {
      case 'auth/email-already-in-use':
        return 'Esiste già un utente con questo nome: è rimasto da un evento eliminato a metà. Cancellalo dalla console di Firebase (Authentication → Utenti) oppure scegli un altro nome.'
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'La password salvata non è più valida: forse è stata cambiata dalla console di Firebase.'
      case 'auth/user-not-found':
        return 'L’utente non esiste più.'
      case 'auth/operation-not-allowed':
      case 'auth/admin-restricted-operation':
        return 'Firebase non permette di creare o eliminare utenti: controlla in Authentication → Impostazioni → Azioni utente che creazione ed eliminazione siano abilitate.'
      case 'auth/too-many-requests':
        return 'Troppe operazioni in poco tempo: aspetta qualche minuto e riprova.'
      case 'auth/network-request-failed':
        return 'Connessione assente: controlla la rete e riprova.'
      case 'permission-denied':
        return 'Il database ha rifiutato l’operazione: controlla di aver pubblicato le regole aggiornate.'
      default:
        return `Operazione non riuscita (${errore.code}).`
    }
  }
  return errore instanceof Error ? errore.message : 'Operazione non riuscita. Riprova.'
}
