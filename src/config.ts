/**
 * Costanti del sito e dell'accesso. Quello che cambia da un evento all'altro
 * (festeggiati, colore, titoli dei giochi) sta invece nel documento
 * dell'evento su Firestore: vedi src/eventi/types.ts.
 */

export const NOME_SITO = 'I giochi per gli eventi'
export const SOTTOTITOLO_SITO = 'I giochi per festeggiare insieme'

/** Il colore del sito fuori dagli eventi, e quello di partenza di ogni evento. */
export const COLORE_PREDEFINITO = '#7b1e3a'

// --- Accesso -------------------------------------------------------------
/**
 * Firebase Authentication vuole indirizzi email: il dominio qui sotto e'
 * fittizio e non deve esistere davvero. Nel form di login si digita solo il
 * nome utente (es. "oder" oppure "sara25-ospiti") e il codice aggiunge il resto.
 */
export const DOMINIO_UTENTI = 'eventi.local'

/**
 * Chi gestisce tutti gli eventi. Lo stesso UID e' scritto in firestore.rules:
 * se cambia, va cambiato in entrambi i posti.
 */
export const SUPERADMIN_UID = '2coos8n46YPOGzSAe2zhTUs23ls1'

export function usernameToEmail(username: string): string {
  const pulito = username.trim().toLowerCase()
  return pulito.includes('@') ? pulito : `${pulito}@${DOMINIO_UTENTI}`
}

export function emailToUsername(email: string | null | undefined): string {
  if (!email) return ''
  return email.split('@')[0]
}
