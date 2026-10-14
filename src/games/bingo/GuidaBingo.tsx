import Guida, { Passi, Passo, Punti, SezioneGuida, Testo } from '../../components/Guida'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, titoloGioco } from '../../eventi/types'
import { TESTO_COMODO, TESTO_MAX } from './types'

export default function GuidaBingo() {
  const { evento, isAdmin } = useEvento()
  const nomi = nomiBrevi(evento) || 'chi festeggia'

  return (
    <Guida
      id="bingo"
      titolo={`Come funziona ${titoloGioco(evento, 'bingo')}`}
      sottotitolo={
        isAdmin
          ? 'Come si raccolgono le previsioni, si stampano le cartelle e si premiano i vincitori.'
          : 'Come scrivere una buona previsione e come si gioca alla festa.'
      }
      chiusaDiPartenza={!isAdmin}
    >
      <SezioneGuida titolo="Il gioco">
        <Testo>
          Un bingo dove al posto dei numeri ci sono le cose che succederanno alla festa. Prima
          della festa ognuno scrive le sue previsioni; da tutte quelle raccolte nascono le
          cartelle, ognuna diversa dalle altre. Durante la festa, quando una cosa succede davvero,
          chi la ha sulla cartella la segna.
        </Testo>
        <Testo>
          Come a tombola, le combinazioni valgono su una sola riga: due caselle segnate fanno{' '}
          <strong>ambo</strong>, poi <strong>terna</strong> e <strong>quaterna</strong>; la riga
          intera fa <strong>cinquina</strong> (con cinque colonne) e tutta la cartella fa{' '}
          <strong>bingo</strong>.
        </Testo>
      </SezioneGuida>

      <SezioneGuida titolo="Scrivere una previsione">
        <Punti>
          <li>
            Fino a {TESTO_MAX} caratteri, ma sotto i {TESTO_COMODO} si legge meglio nella casella.
          </li>
          <li>
            Deve essere una cosa che si vede succedere, così tutti possono dire se è capitata: “
            {nomi} si commuove al discorso”, “qualcuno rovescia il vino”, “parte il trenino”.
          </li>
          <li>
            Il bello è l’equilibrio: un po’ di cose quasi certe e qualcuna improbabile. Se sono
            tutte impossibili non vince nessuno.
          </li>
          <li>Le previsioni già scritte da altri non si possono ripetere.</li>
        </Punti>
      </SezioneGuida>

      {isAdmin && (
        <SezioneGuida titolo="Per te che organizzi">
          <Passi>
            <Passo numero={1} titolo="Controlla le previsioni">
              <p>
                Dall’elenco puoi correggere o eliminare quelle doppie, troppo vaghe o fuori luogo.
                Gli invitati possono solo aggiungere.
              </p>
            </Passo>
            <Passo numero={2} titolo="Scegli la forma delle cartelle">
              <p>
                Colonne e righe decidono quante caselle ha una cartella (5×3 = 15). Servono almeno
                tante previsioni quante caselle; con il doppio o il triplo le cartelle vengono più
                diverse fra loro. Ogni previsione viene usata più o meno lo stesso numero di volte.
              </p>
            </Passo>
            <Passo numero={3} titolo="Stampa">
              <p>
                Scegli quante cartelle (una a testa o una per coppia) e quante per foglio A4: il
                sito sceglie la disposizione con le caselle più grandi e lascia lo spazio per le
                forbici. Con <strong>le regole sul retro</strong> la stampa diventa fronte-retro:
                indica se la tua stampante gira il foglio sul lato lungo o su quello corto, così le
                regole finiscono dietro la cartella giusta. <strong>Rimescola</strong> cambia tutte
                le cartelle.
              </p>
            </Passo>
            <Passo numero={4} titolo="Gli attestati">
              <p>
                Più in basso scarichi un attestato per ogni premio, in quattro stili. I premi
                seguono la forma delle cartelle; con “più grande il premio, più grande
                l’attestato” si va dal cartoncino 10×15 dell’ambo al foglio intero del bingo.
              </p>
            </Passo>
            <Passo numero={5} titolo="Alla festa">
              <p>
                Distribuisci le cartelle e una penna per tavolo. Chi fa un premio lo grida, tu
                controlli che le cose segnate siano successe davvero e consegni l’attestato.
              </p>
            </Passo>
          </Passi>
        </SezioneGuida>
      )}
    </Guida>
  )
}
