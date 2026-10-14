import Guida, { Passi, Passo, Punti, SezioneGuida, Testo } from '../../components/Guida'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, titoloGioco } from '../../eventi/types'
import { DEFINIZIONE_MAX, LUNGHEZZA_MAX, LUNGHEZZA_MIN } from './normalize'

export default function GuidaCruciverba() {
  const { evento, isAdmin } = useEvento()
  const nomi = nomiBrevi(evento) || 'chi festeggia'

  return (
    <Guida
      id="cruciverba"
      titolo={`Come funziona ${titoloGioco(evento, 'cruciverba')}`}
      sottotitolo={
        isAdmin
          ? 'Come si raccolgono le parole, come si controllano e come si stampa il cruciverba.'
          : 'Come proporre una parola e cosa succede dopo.'
      }
      // gli invitati la trovano chiusa: per loro il modulo qui sotto si spiega da se'
      chiusaDiPartenza={!isAdmin}
    >
      <SezioneGuida titolo="Il gioco">
        <Testo>
          Un cruciverba fatto apposta per {nomi}: ognuno propone una parola legata alla festa o a un
          ricordo insieme, con la sua definizione. Il sito le incastra tutte da solo in una griglia
          e prepara il cartellone da stampare, con la griglia vuota e le definizioni sotto.
        </Testo>
      </SezioneGuida>

      <SezioneGuida titolo="Proporre una parola">
        <Passi>
          <Passo numero={1} titolo="La parola">
            <p>
              Da {LUNGHEZZA_MIN} a {LUNGHEZZA_MAX} lettere. Accenti, spazi, apostrofi e numeri
              vengono tolti: “Mar Rosso” diventa MARROSSO, “caffè” diventa CAFFE. Sotto il campo
              vedi come comparirà nella griglia. Le parole già proposte da altri non si possono
              ripetere.
            </p>
          </Passo>
          <Passo numero={2} titolo="La definizione">
            <p>
              Fino a {DEFINIZIONE_MAX} caratteri. Il bello è che la capisca chi conosce {nomi}: un
              aneddoto, una battuta di famiglia, un luogo del cuore. Evita di scrivere la parola
              dentro la definizione.
            </p>
          </Passo>
          <Passo numero={3} titolo="Il tuo nome">
            <p>
              Facoltativo: serve a sapere chi ha proposto cosa. Il sito lo ricorda per le prossime
              parole (e per gli altri giochi).
            </p>
          </Passo>
        </Passi>
      </SezioneGuida>

      <SezioneGuida titolo="L’anteprima">
        <Testo>
          In fondo alla pagina c’è il cruciverba già risolto, nascosto dietro un avviso: se vuoi
          giocarci alla festa senza sapere le risposte, meglio non guardarlo.
        </Testo>
      </SezioneGuida>

      {isAdmin && (
        <SezioneGuida titolo="Per te che organizzi">
          <Punti>
            <li>
              <strong>Controlla le parole</strong> nell’elenco: puoi correggere un errore di
              battitura o eliminare quelle fuori luogo. Gli invitati possono solo aggiungere.
            </li>
            <li>
              <strong>Parole rimaste fuori:</strong> sotto l’anteprima vedi quelle che non si
              incastrano con le altre (o sono doppioni). Spesso basta aggiungere qualche parola
              con lettere comuni, o premere <strong>Rigenera griglia</strong> per provare un’altra
              disposizione.
            </li>
            <li>
              <strong>Quante parole:</strong> fra 15 e 30 viene un cruciverba bello pieno. Con
              molte di più la griglia si allarga e le caselle sul foglio rimpiccioliscono: meglio
              l’A3.
            </li>
            <li>
              <strong>Stampa:</strong> scegli A4 o A3 e scarica il PDF (da stampare) o il PNG (da
              mandare in chat). La soluzione non viene stampata. Se le definizioni sono tante il
              sito rimpicciolisce prima la griglia, fino a caselle ancora scrivibili a mano, e solo
              dopo il testo.
            </li>
            <li>
              <strong>Alla festa:</strong> appendi il cartellone A3 o lasciane una copia A4 per
              tavolo; vince chi lo completa per primo.
            </li>
          </Punti>
        </SezioneGuida>
      )}
    </Guida>
  )
}
