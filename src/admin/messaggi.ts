import type { Account } from './account'

/** L'indirizzo del sito, senza la parte dopo il # (la pagina di login). */
export function indirizzoSito(): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}`
}

/** Da mandare all'organizzatore della festa, per esempio su WhatsApp. */
export function messaggioAdmin(account: Account): string {
  return [
    'Ciao! Ecco il tuo accesso da organizzatore per i giochi della festa.',
    '',
    `Sito: ${indirizzoSito()}`,
    `Nome utente: ${account.username}`,
    `Password: ${account.password}`,
    '',
    'Al primo accesso completa le impostazioni: tipo di festa, festeggiati e colore. ' +
      'Nella home trovi anche l’accesso da girare agli invitati.',
  ].join('\n')
}

/** Da girare agli invitati: con questo accesso si partecipa ai giochi. */
export function messaggioOspiti(account: Account, titolo?: string): string {
  return [
    titolo ? `Partecipa ai giochi per ${titolo.charAt(0).toLowerCase()}${titolo.slice(1)}!` : 'Partecipa ai giochi della festa!',
    '',
    `Sito: ${indirizzoSito()}`,
    `Nome utente: ${account.username}`,
    `Password: ${account.password}`,
  ].join('\n')
}
