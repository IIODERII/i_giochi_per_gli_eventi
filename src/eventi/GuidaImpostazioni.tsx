import Guida, { Punti, SezioneGuida, Testo } from '../components/Guida'

export default function GuidaImpostazioni() {
  return (
    <Guida
      id="impostazioni"
      titolo="Come funzionano le impostazioni"
      sottotitolo="Cosa cambia ogni scelta, nel sito e nei fogli da stampare."
    >
      <SezioneGuida titolo="Le scelte">
        <Punti>
          <li>
            <strong>Che festa è:</strong> cambia la frase sopra i nomi nella home, il titolo nella
            barra in alto e l’ultima riga degli attestati del bingo (i voti per la laurea, le
            candeline per il compleanno…).
          </li>
          <li>
            <strong>Chi festeggiamo:</strong> nome e cognome compaiono interi nella home e come
            titolo del papiro; nei titoli dei giochi si usa solo il nome. Con un solo festeggiato i
            titoli giocano sul suo nome (CruciSara, BingoSara, Cash or Sara); con più festeggiati
            diventano Cruciverba, Bingo, Cash or Trash.
          </li>
          <li>
            <strong>Riga in più e data:</strong> facoltative. Compaiono sotto i nomi nella home e
            nel sottotitolo del papiro.
          </li>
          <li>
            <strong>Il colore:</strong> tinge sito, titoli, cartelle, attestati e papiro. Il sito
            cambia subito, così vedi l’effetto prima di salvare. Meglio un colore scuro: sopra ci
            vanno scritte chiare.
          </li>
          <li>
            <strong>I giochi:</strong> spegni quelli che non usate; spariscono da menu e home per
            tutti. Il titolo lascialo vuoto per quello automatico. Cash or … e il papiro li vedi solo
            tu: gli invitati entrano in Cash or … dal QR, e il papiro è una sorpresa.
          </li>
          <li>
            <strong>Il presentatore di Cash or …:</strong> facoltativo. Nome e foto compaiono nella
            proiezione, accanto al fumetto che racconta gli oggetti.
          </li>
        </Punti>
      </SezioneGuida>

      <SezioneGuida titolo="Salvare">
        <Testo>
          Le modifiche valgono solo dopo <strong>Salva</strong>, in fondo alla pagina. Finché non
          salvi la prima volta, gli invitati vedono solo “Stiamo preparando la festa”. Puoi
          tornare qui e cambiare tutto quando vuoi: quello che gli invitati hanno già scritto non
          si perde.
        </Testo>
      </SezioneGuida>
    </Guida>
  )
}
