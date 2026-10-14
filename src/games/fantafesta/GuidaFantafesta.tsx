import Guida, { Passi, Passo, Punti, SezioneGuida, Testo } from '../../components/Guida'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, titoloGioco } from '../../eventi/types'
import { PUNTI_MAX } from './types'

export default function GuidaFantafesta() {
  const { evento, isAdmin } = useEvento()
  const nomi = nomiBrevi(evento) || 'chi festeggia'

  return (
    <Guida
      id="fantafesta"
      titolo={`Come funziona ${titoloGioco(evento, 'fantafesta')}`}
      sottotitolo={
        isAdmin
          ? 'Come si prepara il regolamento e come si danno i punti durante la festa.'
          : 'Come si entra in gara e come si fanno punti.'
      }
      chiusaDiPartenza={!isAdmin}
    >
      <SezioneGuida titolo="Il gioco">
        <Testo>
          Come il fantacalcio, ma i campioni siete voi. Il regolamento è un elenco di cose che
          possono succedere alla festa, ognuna con i suoi punti: i <strong>bonus</strong> si
          guadagnano, i <strong>malus</strong> si perdono. Chi la combina davvero si prende i punti,
          e la classifica dice chi è stato il protagonista della serata.
        </Testo>
        <Testo>
          I punti li dà solo chi organizza: quello che conta è cosa vede succedere, non cosa
          racconti tu.
        </Testo>
      </SezioneGuida>

      <SezioneGuida titolo="Per partecipare">
        <Punti>
          <li>
            <strong>Entra in gara</strong> scrivendo il tuo nome. Se c’è un omonimo aggiungi
            l’iniziale del cognome.
          </li>
          <li>
            <strong>Proponi bonus e malus</strong>: devono essere cose che si vedono succedere, così
            nessuno può contestarle. “Fa un brindisi a {nomi}”, “balla sul tavolo”, “rovescia il
            vino”, “si addormenta prima del dolce”.
          </li>
          <li>
            Più è difficile, più punti vale. I malus servono a tenere a bada i furbi.
          </li>
          <li>Durante la festa segui la classifica e la cronaca da qui: si aggiornano da sole.</li>
        </Punti>
      </SezioneGuida>

      {isAdmin && (
        <SezioneGuida titolo="Per te che organizzi">
          <Passi>
            <Passo numero={1} titolo="Prima della festa: il regolamento">
              <p>
                Gli invitati propongono, tu correggi testo e punti (fino a {PUNTI_MAX}, in più o in
                meno) ed elimini i doppioni o quello che non va. Conviene avere più bonus che
                malus, e qualche bonus grosso per le imprese memorabili.
              </p>
            </Passo>
            <Passo numero={2} titolo="I giocatori">
              <p>
                Gli invitati si iscrivono da soli. Tu puoi aggiungere chi non ha il telefono (o i
                festeggiati, se giocano anche loro), e dalla classifica cambiare nome o togliere
                qualcuno con i suoi punti.
              </p>
            </Passo>
            <Passo numero={3} titolo="Alla festa: dai i punti">
              <p>
                Dal telefono, nel riquadro “Dai i punti”: tocca uno o più nomi, poi una voce del
                regolamento, e conferma. Per le cose impreviste scegli “Punti a mano” e scrivi il
                motivo. Se sbagli, “Annulla” nella cronaca toglie quei punti.
              </p>
            </Passo>
            <Passo numero={4} titolo="La premiazione">
              <p>
                A fine serata la classifica è già pronta. Se qualcuno fa un’impresa che vale un
                premio speciale, con i punti a mano puoi arrivare fino a mille.
              </p>
            </Passo>
          </Passi>
        </SezioneGuida>
      )}
    </Guida>
  )
}
