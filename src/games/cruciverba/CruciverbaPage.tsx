import { useMemo, useState } from 'react'
import { useEvento } from '../../eventi/eventoContext'
import { titoloGioco } from '../../eventi/types'
import CrosswordPreview from './CrosswordPreview'
import { generaCruciverba } from './generator'
import { useParole } from './useParole'
import WordForm from './WordForm'
import WordList from './WordList'

export default function CruciverbaPage() {
  const { evento, isAdmin } = useEvento()
  const titolo = titoloGioco(evento, 'cruciverba')
  const { parole, caricamento, errore, aggiungi, modifica, elimina } = useParole()
  const [seme, setSeme] = useState(1)

  // stesso elenco di parole + stesso seme = stessa griglia, cosi' non cambia
  // a ogni ricaricamento della pagina
  const cruciverba = useMemo(() => generaCruciverba(parole, { seme }), [parole, seme])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-primario-800 sm:text-4xl">{titolo}</h1>
        <p className="mt-1 max-w-2xl text-sm text-inchiostro/65">
          Il cruciverba della festa si costruisce da solo con le parole che proponete: ogni parola
          nuova viene incastrata nella griglia insieme alle altre.
        </p>
      </header>

      {errore && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errore}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <WordForm parole={parole} aggiungi={aggiungi} />
        <WordList
          parole={parole}
          caricamento={caricamento}
          isAdmin={isAdmin}
          modifica={modifica}
          elimina={elimina}
        />
      </div>

      <CrosswordPreview
        cruciverba={cruciverba}
        titolo={titolo}
        colore={evento.colore}
        isAdmin={isAdmin}
        onRigenera={() => setSeme((s) => s + 1)}
      />
    </div>
  )
}
