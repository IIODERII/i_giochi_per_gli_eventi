import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Guida, { Passi, Passo, SezioneGuida, Testo } from '../components/Guida'
import { useEvento } from '../eventi/eventoContext'
import { titoloGioco, type IdGioco } from '../eventi/types'
import { giochiVisibili } from '../games/registry'

/** Nella home dell'admin: il giro completo, dall'apertura del sito al giorno della festa. */
export default function GuidaOrganizzatore() {
  const { evento, percorso } = useEvento()
  const attivi = new Set(giochiVisibili(evento, true).map((g) => g.id))

  /** "CruciSara e BingoSara", con i collegamenti; solo i giochi accesi. */
  function elenco(ids: IdGioco[]): ReactNode {
    const accesi = ids.filter((id) => attivi.has(id))
    return accesi.map((id, i) => (
      <span key={id}>
        {i > 0 && (i === accesi.length - 1 ? ' e ' : ', ')}
        <Link to={percorso(id)} className="font-semibold text-primario-700 underline">
          {titoloGioco(evento, id)}
        </Link>
      </span>
    ))
  }
  const qualcuno = (ids: IdGioco[]) => ids.some((id) => attivi.has(id))

  const passi: { titolo: string; testo: ReactNode }[] = [
    {
      titolo: 'Imposta la festa',
      testo: (
        <>
          In{' '}
          <Link to={percorso('impostazioni')} className="font-semibold text-primario-700 underline">
            Impostazioni
          </Link>{' '}
          scegli tipo di festa, festeggiati, colore e giochi. Finché non salvi, gli invitati vedono
          solo un avviso di attesa.
        </>
      ),
    },
    {
      titolo: 'Fai entrare gli invitati',
      testo:
        'Qui sotto c’è il messaggio con l’accesso per gli invitati: copialo e mandalo nel gruppo. Un solo nome utente e una sola password valgono per tutti.',
    },
  ]
  if (qualcuno(['cruciverba', 'bingo', 'fantafesta'])) {
    passi.push({
      titolo: 'Lascia che scrivano',
      testo: (
        <>
          {elenco(['cruciverba', 'bingo', 'fantafesta'])} si riempiono con quello che scrivono gli
          invitati. Dai un’occhiata ogni tanto: puoi correggere ed eliminare quello che non va.
        </>
      ),
    })
  }
  if (qualcuno(['cashorsara', 'papiro'])) {
    passi.push({
      titolo: 'Prepara la tua parte',
      testo: <>{elenco(['cashorsara', 'papiro'])}: li prepari tu, gli invitati non li vedono nel menu.</>,
    })
  }
  if (qualcuno(['cruciverba', 'bingo', 'papiro'])) {
    passi.push({
      titolo: 'Qualche giorno prima: stampa',
      testo: (
        <>
          Scarica i PDF dalle pagine di {elenco(['cruciverba', 'bingo', 'papiro'])}.
          {attivi.has('papiro') && ' Il papiro grande va in copisteria: calcola qualche giorno.'}
        </>
      ),
    })
  }

  return (
    <Guida
      id="organizzatore"
      titolo="Come si prepara la festa"
      sottotitolo="Visibile solo a te: i passi dall’inizio alla serata. Ogni gioco ha poi la sua guida."
    >
      <SezioneGuida titolo="Prima della festa">
        <Passi>
          {passi.map((passo, i) => (
            <Passo key={passo.titolo} numero={i + 1} titolo={passo.titolo}>
              <p>{passo.testo}</p>
            </Passo>
          ))}
        </Passi>
      </SezioneGuida>

      <SezioneGuida titolo="Il giorno della festa">
        <Testo>
          Porta i fogli stampati
          {attivi.has('cashorsara') &&
            ` e, per ${titoloGioco(evento, 'cashorsara')}, un portatile da collegare alla TV: la sua guida spiega come condurre il gioco`}
          .
          {attivi.has('fantafesta') &&
            ` Per ${titoloGioco(evento, 'fantafesta')} tieni il telefono a portata di mano: i punti li dai tu, man mano che le cose succedono.`}{' '}
          Dopo la festa il sito resta aperto finché l’evento non viene eliminato.
        </Testo>
      </SezioneGuida>
    </Guida>
  )
}
