import {
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type CollectionReference,
  type Firestore,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { riepilogoRivelazione } from './punteggi'
import { riferimenti } from './riferimenti'
import {
  idRisposta,
  PARTITA_VUOTA,
  type Giocatore,
  type Oggetto,
  type Partita,
  type Risposta,
} from './types'

async function svuota(riferimento: CollectionReference) {
  const istantanea = await getDocs(riferimento)
  if (istantanea.empty) return
  const lotto = writeBatch(db)
  istantanea.docs.forEach((d) => lotto.delete(d.ref))
  await lotto.commit()
}

/** Azzera tutto: giocatori, puntate e stato. Serve dopo le prove. */
export async function azzeraPartita(eventoId: string, oggetti: Oggetto[]) {
  const r = riferimenti(eventoId)
  await Promise.all([svuota(r.risposte), svuota(r.giocatori)])
  const lotto = writeBatch(db)
  lotto.set(r.partita, { ...PARTITA_VUOTA, totale: oggetti.length, aggiornataIl: serverTimestamp() })
  lotto.set(r.vetrina, { indice: 0, foto: null })
  await lotto.commit()
}

/** Apre le puntate su un oggetto. Del valore vero non si scrive nulla. */
export async function apriOggetto(eventoId: string, oggetti: Oggetto[], indice: number) {
  const oggetto = oggetti[indice]
  if (!oggetto) return
  const r = riferimenti(eventoId)
  const lotto = writeBatch(db)
  lotto.set(r.vetrina, { indice, foto: oggetto.foto ?? null })
  lotto.set(
    r.partita,
    {
      stato: 'puntate',
      indice,
      totale: oggetti.length,
      oggettoId: oggetto.id,
      oggettoNome: oggetto.nome,
      oggettoStoria: oggetto.storia,
      esiti: {},
      puntateTurno: 0,
      aggiornataIl: serverTimestamp(),
    },
    { merge: true },
  )
  await lotto.commit()
}

export async function chiudiPuntate(eventoId: string) {
  await updateDoc(riferimenti(eventoId).partita, { stato: 'chiuse', aggiornataIl: serverTimestamp() })
}

/**
 * Rende pubblico il valore vero e salva esiti e classifica gia' calcolati:
 * da qui in poi tutti possono vedere i punti.
 */
export async function rivelaValore(
  eventoId: string,
  partita: Partita,
  valore: number,
  risposte: Risposta[],
  giocatori: Giocatore[],
) {
  const riepilogo = riepilogoRivelazione(
    partita.indice,
    valore,
    risposte,
    giocatori,
    partita.valoriRivelati,
  )
  await updateDoc(riferimenti(eventoId).partita, {
    stato: 'rivelato',
    [`valoriRivelati.${partita.indice}`]: valore,
    ...riepilogo,
    aggiornataIl: serverTimestamp(),
  })
}

export async function terminaPartita(eventoId: string) {
  await updateDoc(riferimenti(eventoId).partita, { stato: 'finita', aggiornataIl: serverTimestamp() })
}

/** Un giocatore entra (o cambia nome) usando la propria identita' anonima. */
export async function entraInPartita(
  firestore: Firestore,
  eventoId: string,
  giocatoreId: string,
  nome: string,
) {
  await setDoc(
    doc(riferimenti(eventoId, firestore).giocatori, giocatoreId),
    { nome, entratoIl: serverTimestamp() },
    { merge: true },
  )
}

export async function inviaPuntata(
  firestore: Firestore,
  eventoId: string,
  indice: number,
  giocatoreId: string,
  nome: string,
  valore: number,
) {
  await setDoc(doc(riferimenti(eventoId, firestore).risposte, idRisposta(indice, giocatoreId)), {
    indice,
    giocatoreId,
    nome,
    valore,
    inviataIl: serverTimestamp(),
  })
}

/** Giocatore senza telefono: lo iscrive l'admin e punta al posto suo. */
export async function aggiungiGiocatoreManuale(eventoId: string, nome: string): Promise<string> {
  const id = `manuale_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  await setDoc(doc(riferimenti(eventoId).giocatori, id), {
    nome,
    manuale: true,
    entratoIl: serverTimestamp(),
  })
  return id
}

export async function rimuoviGiocatore(eventoId: string, giocatoreId: string) {
  await deleteDoc(doc(riferimenti(eventoId).giocatori, giocatoreId))
}

/**
 * Legge gli oggetti una volta sola, senza restare in ascolto: serve alla
 * proiezione per eseguire i comandi (per esempio la rivelazione) senza mai
 * tenere in pagina la valutazione vera.
 */
export async function caricaOggetti(eventoId: string): Promise<Oggetto[]> {
  const istantanea = await getDocs(riferimenti(eventoId).oggetti)
  return istantanea.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Oggetto, 'id'>) }))
    .sort((a, b) => a.ordine - b.ordine)
}

/** Nomi gia' in gara: letti una volta sola, al momento di entrare. */
export async function nomiInGara(firestore: Firestore, eventoId: string): Promise<Giocatore[]> {
  const istantanea = await getDocs(riferimenti(eventoId, firestore).giocatori)
  return istantanea.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Giocatore, 'id'>) }))
}
