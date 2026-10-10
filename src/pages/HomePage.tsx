import { Link } from 'react-router-dom'
import CredenzialiPanel from '../admin/CredenzialiPanel'
import IconaEvento from '../components/IconaEvento'
import { useEvento } from '../eventi/eventoContext'
import {
  dataLeggibile,
  nomiBrevi,
  nomiCompleti,
  occhiello,
  titoloEvento,
  titoloGioco,
} from '../eventi/types'
import { giochiVisibili } from '../games/registry'

function InPreparazione() {
  const { isAdmin, percorso } = useEvento()

  if (!isAdmin) {
    return (
      <section className="card px-6 py-12 text-center">
        <IconaEvento tipo={null} className="mx-auto mb-4 h-12 w-16 text-primario-700" />
        <h1 className="text-3xl font-semibold text-primario-800">Stiamo preparando la festa</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-inchiostro/65">
          I giochi non sono ancora pronti. Torna a trovarci tra un po’!
        </p>
      </section>
    )
  }

  return (
    <section className="card px-6 py-10 text-center">
      <IconaEvento tipo={null} className="mx-auto mb-4 h-12 w-16 text-primario-700" />
      <h1 className="text-3xl font-semibold text-primario-800">Benvenuto!</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-inchiostro/65">
        Prima di invitare gli altri racconta chi festeggiamo: tipo di festa, nomi e il colore del
        sito. Finché non lo fai, gli invitati vedono solo un avviso di attesa.
      </p>
      <Link to={percorso('impostazioni')} className="btn-primary mt-6">
        Completa le impostazioni
      </Link>
    </section>
  )
}

export default function HomePage() {
  const { evento, isAdmin, percorso } = useEvento()
  const giochi = giochiVisibili(evento, isAdmin)
  const data = dataLeggibile(evento.data)

  return (
    <div className="space-y-8">
      {evento.configurato ? (
        <section className="card relative overflow-hidden px-6 py-10 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-oro-300 via-oro-500 to-oro-300" />
          <IconaEvento tipo={evento.tipo} className="mx-auto mb-4 h-12 w-16 text-primario-700" />
          <p className="font-display text-lg text-inchiostro/55">{occhiello(evento)}</p>
          <h1 className="mt-1 text-4xl font-semibold text-primario-800 sm:text-5xl">
            {nomiCompleti(evento)}
          </h1>
          {evento.dettaglio && (
            <p className="mx-auto mt-3 max-w-md text-sm text-inchiostro/65">{evento.dettaglio}</p>
          )}
          {data && <p className="mt-2 text-sm font-medium text-primario-600">{data}</p>}
          <p className="mx-auto mt-5 max-w-lg text-sm text-inchiostro/70">
            Aiutaci a preparare i giochi della festa: quello che scrivi qui finisce dritto nel
            materiale che useremo per festeggiare {nomiBrevi(evento)}.
          </p>
        </section>
      ) : (
        <InPreparazione />
      )}

      {giochi.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold text-primario-800">I giochi</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {giochi.map((gioco) => (
              <Link
                key={gioco.id}
                to={percorso(gioco.percorso)}
                className="card group p-5 transition hover:-translate-y-0.5 hover:border-oro-400 hover:shadow-md"
              >
                <span className="text-2xl">{gioco.emoji}</span>
                <h3 className="mt-2 text-xl font-semibold text-primario-800">
                  {titoloGioco(evento, gioco.id)}
                </h3>
                <p className="mt-1 text-sm text-inchiostro/65">{gioco.descrizione}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-primario-600 group-hover:underline">
                  {gioco.soloAdmin ? 'Prepara e conduci →' : 'Partecipa →'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="card p-5 sm:p-6">
          <h2 className="mb-1 text-xl font-semibold text-primario-800">L’accesso per gli invitati</h2>
          <p className="mb-4 text-sm text-inchiostro/60">
            Visibile solo a te. Copia il messaggio e mandalo nel gruppo degli invitati: un solo
            accesso vale per tutti.
          </p>
          <CredenzialiPanel
            eventoId={evento.id}
            titolo={evento.configurato ? titoloEvento(evento) : undefined}
            ruoli={['ospiti']}
          />
        </section>
      )}
    </div>
  )
}
