import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { eventoVuoto } from '../eventi/types'
import {
  cambiaPassword,
  creaAccount,
  eliminaAccount,
  generaPassword,
  messaggioErroreAccount,
  usernameEvento,
  type Account,
  type Credenziali,
  type RuoloEvento,
} from './account'

export const ID_EVENTO_MIN = 3
export const ID_EVENTO_MAX = 30

/** "Laurea Sara 25" -> "laurea-sara-25": va bene come nome utente e nell'indirizzo. */
export function normalizzaIdEvento(grezzo: string): string {
  return grezzo
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, ID_EVENTO_MAX)
}

export function validaIdEvento(id: string): string | null {
  if (id.length < ID_EVENTO_MIN) return `Almeno ${ID_EVENTO_MIN} caratteri.`
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(id)) {
    return 'Solo lettere minuscole, numeri e trattini (non all’inizio né alla fine).'
  }
  return null
}

/**
 * Crea l'evento con i suoi due utenti. Se qualcosa va storto a meta' strada
 * gli account gia' creati vengono eliminati, cosi' si puo' riprovare con lo
 * stesso nome.
 */
export async function creaEvento(eventoId: string): Promise<Credenziali> {
  const errore = validaIdEvento(eventoId)
  if (errore) throw new Error(errore)
  if ((await getDoc(doc(db, 'eventi', eventoId))).exists()) {
    throw new Error('Esiste già un evento con questo nome: scegline un altro.')
  }

  const creati: Partial<Record<RuoloEvento, Account>> = {}
  try {
    for (const ruolo of ['admin', 'ospiti'] as const) {
      const username = usernameEvento(eventoId, ruolo)
      const password = generaPassword()
      const uid = await creaAccount(username, password)
      creati[ruolo] = { username, password, uid }
    }
    const credenziali = { admin: creati.admin!, ospiti: creati.ospiti! }

    const lotto = writeBatch(db)
    lotto.set(doc(db, 'eventi', eventoId), { ...eventoVuoto(), creatoIl: serverTimestamp() })
    for (const ruolo of ['admin', 'ospiti'] as const) {
      const account = credenziali[ruolo]
      lotto.set(doc(db, 'utenti', account.uid), { eventoId, ruolo, username: account.username })
    }
    lotto.set(doc(db, 'credenziali', eventoId), { ...credenziali, aggiornateIl: serverTimestamp() })
    await lotto.commit()
    return credenziali
  } catch (err) {
    for (const account of Object.values(creati)) {
      await eliminaAccount(account).catch(() => undefined)
    }
    throw new Error(messaggioErroreAccount(err), { cause: err })
  }
}

/** Nuova password per uno dei due utenti dell'evento. */
export async function rigeneraPassword(
  eventoId: string,
  credenziali: Credenziali,
  ruolo: RuoloEvento,
): Promise<void> {
  const nuova = generaPassword()
  try {
    await cambiaPassword(credenziali[ruolo], nuova)
    await updateDoc(doc(db, 'credenziali', eventoId), {
      [`${ruolo}.password`]: nuova,
      aggiornateIl: serverTimestamp(),
    })
  } catch (err) {
    throw new Error(messaggioErroreAccount(err), { cause: err })
  }
}

/** Le sottocollezioni di un evento: vanno svuotate a mano, Firestore non lo fa da solo. */
const SOTTOCOLLEZIONI = [
  'parole',
  'frasi',
  'oggetti',
  'media',
  'papiro',
  'partita/corrente/giocatori',
  'partita/corrente/risposte',
  'partita',
]

async function svuota(percorso: string) {
  const istantanea = await getDocs(collection(db, percorso))
  // un lotto accetta al massimo 500 operazioni
  for (let i = 0; i < istantanea.docs.length; i += 400) {
    const lotto = writeBatch(db)
    istantanea.docs.slice(i, i + 400).forEach((d) => lotto.delete(d.ref))
    await lotto.commit()
  }
}

/**
 * Elimina l'evento con tutti i suoi dati e i suoi utenti. Restituisce i nomi
 * degli utenti che non e' stato possibile eliminare (vanno tolti a mano dalla
 * console di Firebase).
 */
export async function eliminaEvento(eventoId: string): Promise<string[]> {
  // prima i dati: se qualcosa si interrompe, account e password sono ancora
  // al loro posto e basta riprovare
  for (const percorso of SOTTOCOLLEZIONI) await svuota(`eventi/${eventoId}/${percorso}`)

  const istantanea = await getDoc(doc(db, 'credenziali', eventoId))
  const credenziali = istantanea.data() as Credenziali | undefined
  const rimasti: string[] = []

  for (const ruolo of ['admin', 'ospiti'] as const) {
    const account = credenziali?.[ruolo]
    if (!account) continue
    try {
      await eliminaAccount(account)
    } catch {
      rimasti.push(account.username)
    }
    await deleteDoc(doc(db, 'utenti', account.uid))
  }

  await deleteDoc(doc(db, 'credenziali', eventoId))
  await deleteDoc(doc(db, 'eventi', eventoId))
  return rimasti
}

export interface Conteggi {
  parole: number
  frasi: number
  oggetti: number
  giocatori: number
}

/** Quanto materiale ha raccolto un evento. Ogni conteggio costa una sola lettura. */
export async function contaMateriale(eventoId: string): Promise<Conteggi> {
  const conta = async (percorso: string) =>
    (await getCountFromServer(collection(db, `eventi/${eventoId}/${percorso}`))).data().count
  const [parole, frasi, oggetti, giocatori] = await Promise.all([
    conta('parole'),
    conta('frasi'),
    conta('oggetti'),
    conta('partita/corrente/giocatori'),
  ])
  return { parole, frasi, oggetti, giocatori }
}
