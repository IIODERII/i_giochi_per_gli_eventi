import Guida, { Passi, Passo, Punti, SezioneGuida, Testo } from '../../components/Guida'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, titoloGioco } from '../../eventi/types'

export default function GuidaPapiro() {
  const { evento } = useEvento()
  const nomi = nomiBrevi(evento) || 'chi festeggia'

  return (
    <Guida
      id="papiro"
      titolo={`Come funziona ${titoloGioco(evento, 'papiro')}`}
      sottotitolo="Come scriverlo, impaginarlo, usare l’aiuto rime e mandarlo in stampa."
    >
      <SezioneGuida titolo="Il papiro">
        <Testo>
          Il grande foglio goliardico da appendere alla festa: al centro un’immagine (di solito una
          caricatura o una foto buffa di {nomi}), tutto intorno i versi in rima che raccontano
          vita, studi e figuracce. Lo prepari solo tu: gli invitati non lo vedono nel menu, così
          resta una sorpresa fino alla festa.
        </Testo>
        <Testo>
          Tutto si salva da solo poco dopo ogni modifica, e puoi riprendere da qualunque
          computer. Se chiudi la pagina con delle modifiche non ancora salvate, il browser ti
          avvisa.
        </Testo>
      </SezioneGuida>

      <SezioneGuida titolo="Come si prepara">
        <Passi>
          <Passo numero={1} titolo="Titolo e sottotitolo">
            <p>
              Il titolo va in grande in cima, nel colore della festa. Se lo lasci vuoto si usano i
              nomi dei festeggiati; il sottotitolo vuoto prende la riga in più e la data dalle
              impostazioni. Classici: “Dottoressa …”, “Dottore in …”, o una dedica scherzosa.
            </p>
          </Passo>
          <Passo numero={2} titolo="L’immagine">
            <p>
              Scegli una foto o un disegno dal telefono o dal computer. Il sito la riduce a 2000
              pixel di lato al massimo, che bastano per un A3 e reggono bene un poster visto da
              qualche passo. Rende moltissimo un’immagine scontornata (PNG con lo sfondo
              trasparente): i versi le scorrono intorno senza riquadro. L’immagine è facoltativa:
              senza, i versi occupano tutto il foglio.
            </p>
          </Passo>
          <Passo numero={3} titolo="I versi">
            <p>
              Uno per riga; una riga vuota separa una strofa dall’altra. Le strofe non vengono
              spezzate fra una colonna e l’altra, a meno che una sola sia più lunga di una colonna
              intera. I versi troppo lunghi per la colonna vanno a capo con un piccolo rientro.
            </p>
          </Passo>
          <Passo numero={4} titolo="Impaginazione">
            <p>
              Scegli formato, numero di colonne, larghezza dell’immagine e fondo. Il carattere si
              adatta da solo: è il più grande con cui ci sta tutto il testo, e se il testo è corto
              viene distribuito su tutte le colonne. Più colonne vuol dire versi più corti per
              riga ma più spazio in tutto.
            </p>
          </Passo>
          <Passo numero={5} titolo="Scarica e stampa">
            <p>
              Il <strong>PDF</strong> è vettoriale: nitido a qualunque misura, è quello da
              portare in copisteria. Il <strong>PNG</strong> è un’immagine ad alta risoluzione,
              comoda da mandare su WhatsApp o da far stampare dove chiedono una foto.
            </p>
          </Passo>
        </Passi>
      </SezioneGuida>

      <SezioneGuida titolo="L’aiuto rime">
        <Testo>
          Si accende con l’interruttore <strong>Aiuto rime</strong> sopra l’editor; il sito ricorda
          la scelta in questo browser. La prima volta scarica un dizionario di circa 77.000 parole
          (circa 240 KB).
        </Testo>
        <Punti>
          <li>
            <strong>Accanto a ogni verso</strong> compaiono le sillabe e la lettera della rima
            dentro la strofa (A, B, C…). Stesso colore = fanno rima. Lettera tratteggiata = nessun
            altro verso della strofa rima con quello. Numero arancione = il verso ha più o meno
            sillabe degli altri della strofa.
          </li>
          <li>
            <strong>Le rime proposte</strong> seguono il cursore: si cercano le parole che rimano
            con l’ultima parola del verso, le più comuni per prime. Clicca una parola per
            inserirla dove sta il cursore.
          </li>
          <li>
            <strong>Lo schema</strong> (baciata AABB, alternata ABAB, incrociata ABBA) fa capire
            al sito con quale verso deve rimare quello che stai scrivendo: con l’alternata, al
            terzo verso propone le rime del primo.
          </li>
          <li>
            <strong>La ricerca</strong> accetta una parola qualunque, oppure una terminazione con
            il trattino davanti (es. <span className="font-mono">-ezza</span>) per avere tutte le
            parole che finiscono così.
          </li>
          <li>
            <strong>È un aiuto, non un giudice.</strong> L’italiano scritto non dice dove cade
            l’accento: il sito tratta come piane le parole che non hanno l’accento in fondo, quindi
            sulle sdrucciole (“tàvolo”, “làurea”) può sbagliare, e le sillabe sono contate “a
            orecchio”, con la fusione fra vocali vicine come in metrica. Fidati del tuo orecchio.
          </li>
        </Punti>
      </SezioneGuida>

      <SezioneGuida titolo="Consigli per la stampa">
        <Punti>
          <li>
            Il papiro classico è un <strong>70×100</strong> o un <strong>50×70</strong>: in
            copisteria lo stampano su carta da poster o con il plotter. Chiedi la stampa “al vivo”
            o con un margine bianco: la cornice ha già il suo spazio.
          </li>
          <li>
            Per stamparlo a casa scegli <strong>A3</strong>; se la stampante arriva solo all’A4,
            dal programma del PDF scegli “Adatta alla pagina” oppure “Poster” per dividerlo su più
            fogli da unire con lo scotch.
          </li>
          <li>
            Un poster appeso si guarda da qualche passo: se il sito ti avvisa che il carattere è
            piccolo, passa al formato più grande o accorcia il testo.
          </li>
          <li>
            Il fondo pergamena consuma inchiostro: per una stampa economica scegli il bianco.
          </li>
        </Punti>
      </SezioneGuida>
    </Guida>
  )
}
