import type { Account, Credenziali } from './account'

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

/**
 * Il messaggio lungo che Oder manda all'organizzatore la prima volta: entrambi
 * gli accessi e chi puo' fare cosa. Gli asterischi diventano grassetto su WhatsApp.
 */
export function messaggioSpiegazione(credenziali: Credenziali): string {
  const { admin, ospiti } = credenziali
  return [
    'Ciao! Ti spiego come funziona il sito dei giochi per la festa 🎉',
    '',
    `Sito: ${indirizzoSito()}`,
    '',
    'Ci sono *due accessi*, con poteri diversi.',
    '',
    '*1) Il tuo, da organizzatore (admin)*',
    `Nome utente: ${admin.username}`,
    `Password: ${admin.password}`,
    'È solo per te (e per chi organizza con te): non girarlo agli invitati. Con questo:',
    '• imposti la festa: tipo, festeggiati, colore e quali giochi usare. Finché non salvi le impostazioni, gli invitati vedono solo "Stiamo preparando la festa";',
    '• controlli quello che scrivono gli invitati: puoi correggerlo ed eliminarlo, loro possono solo aggiungere;',
    '• prepari i giochi a sorpresa (Cash or Trash e il papiro), che gli invitati non vedono proprio;',
    '• stampi cruciverba, cartelle del bingo e papiro, e alla festa conduci i giochi e dai i punti del fantafesta.',
    '',
    '*2) Quello degli invitati*',
    `Nome utente: ${ospiti.username}`,
    `Password: ${ospiti.password}`,
    'Uno solo per tutti: lo ritrovi nella home del sito, con il messaggio già pronto da mandare nel gruppo. ' +
      'Gli invitati propongono parole per il cruciverba, previsioni per il bingo, bonus e malus per il fantafesta, ' +
      'si iscrivono al fantafesta e ne seguono la classifica. Non possono modificare né cancellare niente, e non vedono i giochi a sorpresa.',
    '',
    '*Cash or Trash, alla festa*',
    'Lì gli invitati non usano nessuna password: inquadrano il QR che compare sulla TV e giocano dal telefono.',
    '',
    '*Se serve aiuto*',
    'In cima a ogni pagina c’è una guida "Come funziona". Se una password finisce dove non deve, scrivimi e la cambio. ' +
      'Dopo la festa il sito resta aperto finché non mi chiedi di eliminarlo, insieme a tutto quello che c’è dentro.',
  ].join('\n')
}
