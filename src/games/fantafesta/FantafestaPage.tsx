import { useEvento } from '../../eventi/eventoContext'
import { titoloGioco } from '../../eventi/types'
import AssegnaPunti from './AssegnaPunti'
import Classifica from './Classifica'
import Cronaca from './Cronaca'
import GuidaFantafesta from './GuidaFantafesta'
import Iscrizione from './Iscrizione'
import RegolaForm from './RegolaForm'
import Regolamento from './Regolamento'
import { calcolaClassifica } from './types'
import { useFantafesta } from './useFantafesta'

export default function FantafestaPage() {
  const { evento, isAdmin } = useEvento()
  const { regole, giocatori, punti, assegna, eliminaGiocatore, caricamento, errore } = useFantafesta()
  const classifica = calcolaClassifica(giocatori.voci, punti.voci)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-primario-800 sm:text-4xl">
          {titoloGioco(evento, 'fantafesta')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-inchiostro/65">
          Il fantacalcio della festa: ogni bravata vale punti. Proponi i bonus e i malus, entra in
          gara e durante la serata guarda la classifica cambiare.
        </p>
      </header>

      <GuidaFantafesta />

      {errore && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errore}
        </p>
      )}

      {isAdmin && <AssegnaPunti giocatori={giocatori.voci} regole={regole.voci} assegna={assegna} />}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Classifica
          classifica={classifica}
          caricamento={caricamento}
          isAdmin={isAdmin}
          rinomina={giocatori.modifica}
          elimina={eliminaGiocatore}
        />
        <div className="space-y-6">
          <Iscrizione giocatori={giocatori.voci} isAdmin={isAdmin} aggiungi={giocatori.aggiungi} />
          <Cronaca
            assegnazioni={punti.voci}
            giocatori={giocatori.voci}
            isAdmin={isAdmin}
            annulla={punti.elimina}
          />
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <RegolaForm regole={regole.voci} aggiungi={regole.aggiungi} />
        <Regolamento
          regole={regole.voci}
          caricamento={regole.caricamento}
          isAdmin={isAdmin}
          modifica={regole.modifica}
          elimina={regole.elimina}
        />
      </div>
    </div>
  )
}
