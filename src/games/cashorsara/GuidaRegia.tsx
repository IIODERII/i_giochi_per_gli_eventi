import { Link } from 'react-router-dom'
import Guida, { Passi, Passo, Punti, SezioneGuida } from '../../components/Guida'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, titoloGioco } from '../../eventi/types'
import { BONUS_PIU_VICINO } from './punteggi'
import { STORIA_MAX } from './types'

/** Tutto quello che serve sapere per preparare e condurre il gioco della serata. */
export default function GuidaRegia() {
  const { evento, percorso } = useEvento()
  const titolo = titoloGioco(evento, 'cashorsara')
  const presentatore = evento.presentatore.trim()

  return (
    <Guida
      id="cashorsara"
      titolo={`Come funziona ${titolo}`}
      sottotitolo="La guida per prepararlo e condurlo: oggetti, foto, proiezione, punteggi."
    >
      <SezioneGuida titolo="Il gioco">
        <p className="text-sm text-inchiostro/75">
          Una versione da festa di <em>Cash or Trash</em>: sullo schermo compare un oggetto alla
          volta e gli invitati indovinano dal telefono quanto vale. Più ci si avvicina alla
          valutazione vera, più punti si fanno. Alla fine vince chi ne ha di più. Gli invitati
          non devono avere nessun account: inquadrano il QR, scrivono il nome e giocano.
        </p>
        <p className="mt-2 text-sm text-inchiostro/75">
          Le valutazioni vere le vedi solo tu, qui in regia: non arrivano a nessun telefono
          finché non le riveli, nemmeno curiosando nel database.
        </p>
      </SezioneGuida>

      <SezioneGuida titolo="Prima della festa">
        <Passi>
          <Passo numero={1} titolo="Aggiungi gli oggetti (più sotto, in “Gli oggetti”)">
            <p>
              Per ognuno servono un <strong>nome</strong> e la <strong>valutazione vera</strong>{' '}
              in euro, un numero intero maggiore di zero. Facoltativi ma consigliati: una{' '}
              <strong>storia</strong> (fino a {STORIA_MAX} caratteri) e una{' '}
              <strong>foto</strong>.
            </p>
            <p>
              Bastano 8–12 oggetti per una mezz’ora di gioco. Funzionano meglio quelli con un
              valore sorprendente: il cimelio che vale poco, la cosa banale che vale tanto.
            </p>
          </Passo>
          <Passo numero={2} titolo="La storia">
            <p>
              Durante le puntate compare in grande sulla proiezione, in un fumetto
              {presentatore ? `, come se la raccontasse ${presentatore}` : ''}. Scrivila in
              prima persona e con qualche indizio sul valore, senza svelarlo. Il testo si
              rimpicciolisce da solo per stare nello schermo, ma sotto le 600 battute si legge
              meglio da lontano.
            </p>
          </Passo>
          <Passo numero={3} titolo="Le foto">
            <p>
              Scegli una foto dal telefono o dal computer: il sito la riduce da solo (al massimo
              1000 pixel di lato) prima di salvarla, quindi va bene anche quella appena
              scattata. Meglio se l’oggetto riempie l’inquadratura e lo sfondo è semplice. Se
              una foto è troppo pesante anche dopo la riduzione, il sito te lo dice: ritagliala
              e riprova.
            </p>
            <p>La foto si vede in grande sulla proiezione e in piccolo sui telefoni.</p>
          </Passo>
          <Passo numero={4} titolo="L’ordine">
            <p>
              Gli oggetti escono nell’ordine dell’elenco: spostali con le frecce ↑ ↓. Conviene
              tenere il pezzo forte per ultimo.
            </p>
          </Passo>
          <Passo numero={5} titolo="Il presentatore (facoltativo)">
            <p>
              In{' '}
              <Link to={percorso('impostazioni')} className="font-semibold text-primario-700 underline">
                Impostazioni
              </Link>{' '}
              puoi dare un nome e una foto a chi “racconta” gli oggetti: compare a tutta altezza
              sul lato sinistro della proiezione, con il fumetto che parte da lui. Rende
              moltissimo una foto scontornata (PNG con lo sfondo trasparente). Senza foto il
              fumetto resta da solo.
            </p>
          </Passo>
          <Passo numero={6} titolo="Fai una prova">
            <p>
              Apri la proiezione, inquadra il QR con il tuo telefono e fai un giro completo.
              Alla fine usa <strong>Azzera la partita</strong> per cancellare giocatori e
              puntate della prova: gli oggetti restano.
            </p>
          </Passo>
        </Passi>
      </SezioneGuida>

      <SezioneGuida titolo="Alla festa">
        <Passi>
          <Passo numero={1} titolo="Collega il portatile alla TV e apri la proiezione">
            <p>
              Con <strong>Apri la proiezione ↗</strong> si apre lo schermo per gli invitati in
              una scheda a parte: mettilo a tutto schermo (F11). In attesa mostra il QR
              grande e i nomi di chi è entrato.
            </p>
            <p>
              <strong>Attenzione:</strong> se il portatile <em>duplica</em> lo schermo sulla
              TV, non tornare su questa pagina durante il gioco, perché tutti vedrebbero le
              valutazioni vere. Per questo la proiezione ha in basso a destra il suo
              pulsante per andare avanti: puoi condurre tutta la partita da lì. Se invece la
              TV è un secondo schermo <em>esteso</em>, tieni la regia sul portatile e la
              proiezione sulla TV.
            </p>
          </Passo>
          <Passo numero={2} titolo="Fai entrare gli invitati">
            <p>
              Inquadrano il QR (lo trovi anche in fondo a questa pagina), scrivono il nome e
              sono in gara. Chi arriva tardi può entrare anche a partita iniziata. Chi non ha il
              telefono lo fai giocare tu: quando le puntate sono aperte, scrivi qui il suo nome
              e la sua cifra in “Punta per chi non ha il telefono”.
            </p>
          </Passo>
          <Passo numero={3} titolo="Per ogni oggetto">
            <p>
              <strong>Comincia</strong> (o <strong>Prossimo oggetto</strong>) apre le puntate:
              su TV e telefoni compaiono foto, nome e storia. Mentre leggi o fai leggere la
              storia, gli invitati puntano, e possono cambiare idea finché le puntate sono
              aperte. Sulla TV si vede quanti hanno già puntato.
            </p>
            <p>
              <strong>Chiudi le puntate</strong> quando ci sono tutti, poi{' '}
              <strong>Rivela</strong>: sulla TV compaiono la valutazione, i tre più vicini e
              tutte le stime, e ogni telefono mostra il proprio risultato. Se hai chiuso troppo
              presto, qui in regia c’è <strong>Riapri le puntate</strong>.
            </p>
          </Passo>
          <Passo numero={4} titolo="Il gran finale">
            <p>
              Dopo l’ultimo oggetto il pulsante diventa <strong>Classifica finale</strong>: la
              TV mostra i primi dieci e ogni telefono la sua posizione. Il momento giusto per
              premiare il vincitore, magari insieme a {nomiBrevi(evento) || 'chi festeggia'}.
            </p>
          </Passo>
        </Passi>
      </SezioneGuida>

      <SezioneGuida titolo="I punti">
        <Punti>
          <li>
            Per ogni oggetto si parte da <strong>100 punti</strong> e se ne perde uno per ogni
            punto percentuale di errore: chi sbaglia del 30% fa 70 punti, chi sbaglia del 100%
            o più fa zero.
          </li>
          <li>
            Chi si avvicina di più di tutti prende <strong>{BONUS_PIU_VICINO} punti in più</strong>{' '}
            (se sono in due alla pari, li prendono entrambi).
          </li>
          <li>
            Chi non punta su un oggetto fa zero per quell’oggetto, ma resta in gara per gli
            altri.
          </li>
          <li>
            La classifica è la somma di tutti gli oggetti rivelati. In regia la vedi sempre
            aggiornata qui sotto, con l’esito di ogni oggetto subito dopo la rivelazione.
          </li>
        </Punti>
      </SezioneGuida>

      <SezioneGuida titolo="Se qualcosa va storto">
        <Punti>
          <li>
            <strong>Un invitato ha sbagliato nome o è entrato due volte:</strong> toglilo con la
            × nell’elenco “In sala”.
          </li>
          <li>
            <strong>Un telefono non si aggiorna:</strong> basta ricaricare la pagina. Nome e
            puntate non si perdono, perché il telefono viene riconosciuto.
          </li>
          <li>
            <strong>La proiezione si è chiusa:</strong> riaprila da qui, riparte dal punto in
            cui era la partita.
          </li>
          <li>
            <strong>Vuoi ricominciare da capo:</strong> “Azzera la partita” cancella giocatori e
            puntate, ma non gli oggetti.
          </li>
        </Punti>
      </SezioneGuida>
    </Guida>
  )
}
