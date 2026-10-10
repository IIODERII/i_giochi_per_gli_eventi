import { collection, doc, type Firestore } from 'firebase/firestore'
import { db } from '../../firebase'

/**
 * Dove stanno i dati di Cash or ... di un evento. Il database si puo'
 * passare perche' i telefoni degli invitati usano un'istanza Firebase a parte
 * (vedi istanzaGioco.ts).
 */
export function riferimenti(eventoId: string, firestore: Firestore = db) {
  const base = `eventi/${eventoId}`
  return {
    partita: doc(firestore, base, 'partita', 'corrente'),
    vetrina: doc(firestore, base, 'partita', 'vetrina'),
    giocatori: collection(firestore, base, 'partita', 'corrente', 'giocatori'),
    risposte: collection(firestore, base, 'partita', 'corrente', 'risposte'),
    oggetti: collection(firestore, base, 'oggetti'),
    /** La foto del presentatore: pesa, quindi non sta nel documento dell'evento. */
    presentatore: doc(firestore, base, 'media', 'presentatore'),
  }
}

/** Indirizzo da mettere nel QR: la pagina di gioco di questo evento. */
export function indirizzoGioco(eventoId: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/e/${eventoId}/gioca`
}
