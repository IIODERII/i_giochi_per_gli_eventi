import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import IconaEvento from '../components/IconaEvento'
import Loader from '../components/Loader'
import { NOME_SITO } from '../config'
import { percorsoEvento } from '../eventi/eventoContext'
import {
  dataLeggibile,
  normalizzaEvento,
  TIPI,
  titoloEvento,
  type Evento,
} from '../eventi/types'
import { db } from '../firebase'
import { messaggioErroreFirestore } from '../games/shared/raccolta'
import CredenzialiPanel from './CredenzialiPanel'
import {
  contaMateriale,
  creaEvento,
  eliminaEvento,
  normalizzaIdEvento,
  validaIdEvento,
  type Conteggi,
} from './gestioneEventi'

function NuovoEvento({ onCreato }: { onCreato: (id: string) => void }) {
  const [nome, setNome] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  const id = normalizzaIdEvento(nome).replace(/-+$/, '')

  async function crea(e: FormEvent) {
    e.preventDefault()
    const problema = validaIdEvento(id)
    if (problema) return setErrore(problema)
    setErrore(null)
    setInCorso(true)
    try {
      await creaEvento(id)
      setNome('')
      onCreato(id)
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Evento non creato.')
    } finally {
      setInCorso(false)
    }
  }

  return (
    <form onSubmit={crea} className="card p-5 sm:p-6">
      <h2 className="mb-1 text-2xl font-semibold text-primario-800">Nuovo evento</h2>
      <p className="mb-4 text-sm text-inchiostro/60">
        Scegli un nome breve: diventa l’indirizzo dell’evento e il prefisso dei due utenti. Tipo,
        festeggiati e colore li sceglie poi l’organizzatore.
      </p>

      <label htmlFor="id-evento" className="field-label">
        Nome breve
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="id-evento"
          className="field flex-1 font-mono"
          value={nome}
          onChange={(e) => setNome(normalizzaIdEvento(e.target.value))}
          placeholder="es. sara25"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button type="submit" className="btn-primary" disabled={inCorso || !id}>
          {inCorso ? 'Creo gli utenti…' : 'Crea evento'}
        </button>
      </div>
      {id && (
        <p className="mt-2 text-xs text-inchiostro/55">
          Utenti: <span className="font-mono font-semibold">{id}-admin</span> e{' '}
          <span className="font-mono font-semibold">{id}-ospiti</span>
        </p>
      )}
      {errore && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errore}
        </p>
      )}
    </form>
  )
}

function Conteggio({ valore, etichetta }: { valore: number | undefined; etichetta: string }) {
  return (
    <span>
      <span className="font-semibold text-inchiostro/80">{valore ?? '…'}</span> {etichetta}
    </span>
  )
}

function SchedaEvento({ evento, appenaCreato }: { evento: Evento; appenaCreato: boolean }) {
  const [conteggi, setConteggi] = useState<Conteggi | null>(null)
  // null = nessuna scelta: le credenziali si aprono da sole sull'evento appena creato
  const [aperte, setAperte] = useState<boolean | null>(null)
  const credenziali = aperte ?? appenaCreato
  const [conferma, setConferma] = useState<string | null>(null)
  const [eliminazione, setEliminazione] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    contaMateriale(evento.id)
      .then(setConteggi)
      .catch(() => setConteggi(null))
  }, [evento.id])

  async function elimina() {
    setErrore(null)
    setEliminazione(true)
    try {
      const rimasti = await eliminaEvento(evento.id)
      if (rimasti.length > 0) {
        window.alert(
          `Evento eliminato, ma questi utenti vanno tolti a mano dalla console di Firebase ` +
            `(Authentication → Utenti): ${rimasti.join(', ')}`,
        )
      }
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
      setEliminazione(false)
    }
  }

  const data = dataLeggibile(evento.data)

  return (
    <li className={`card overflow-hidden ${appenaCreato ? 'ring-2 ring-oro-400' : ''}`}>
      <div className="h-1.5" style={{ backgroundColor: evento.colore }} />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-oro-300"
              style={{ backgroundColor: evento.colore }}
            >
              <IconaEvento tipo={evento.configurato ? evento.tipo : null} className="h-6 w-8" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-inchiostro">
                {evento.configurato ? titoloEvento(evento) : 'Da completare'}
              </p>
              <p className="text-xs text-inchiostro/55">
                <span className="font-mono">{evento.id}</span>
                {evento.configurato && ` · ${TIPI[evento.tipo].etichetta}`}
                {data && ` · ${data}`}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              evento.configurato ? 'bg-green-50 text-green-800' : 'bg-oro-100 text-oro-600'
            }`}
          >
            {evento.configurato ? 'Pronto' : 'In attesa dell’organizzatore'}
          </span>
        </div>

        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-inchiostro/55">
          <Conteggio valore={conteggi?.parole} etichetta="parole" />
          <Conteggio valore={conteggi?.frasi} etichetta="previsioni" />
          <Conteggio valore={conteggi?.oggetti} etichetta="oggetti" />
          <Conteggio valore={conteggi?.giocatori} etichetta="giocatori" />
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link to={percorsoEvento(evento.id)} className="btn-primary px-3 py-2 text-xs">
            Entra nell’evento
          </Link>
          <button className="btn-secondary px-3 py-2 text-xs" onClick={() => setAperte(!credenziali)}>
            {credenziali ? 'Nascondi credenziali' : 'Credenziali'}
          </button>
          {conferma === null ? (
            <button
              className="btn-ghost ml-auto px-3 py-2 text-xs text-red-700 hover:bg-red-50"
              onClick={() => setConferma('')}
            >
              Elimina
            </button>
          ) : (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <input
                className="field w-40 py-1.5 font-mono text-xs"
                placeholder={`scrivi ${evento.id}`}
                value={conferma}
                onChange={(e) => setConferma(e.target.value)}
                autoCapitalize="none"
              />
              <button
                className="btn-danger px-3 py-2 text-xs"
                disabled={conferma !== evento.id || eliminazione}
                onClick={elimina}
              >
                {eliminazione ? 'Elimino…' : 'Elimina per sempre'}
              </button>
              <button className="btn-ghost px-3 py-2 text-xs" onClick={() => setConferma(null)}>
                Annulla
              </button>
            </div>
          )}
        </div>

        {conferma !== null && (
          <p className="mt-2 text-xs text-red-700">
            Si cancellano utenti, parole, previsioni, fantafesta, oggetti, papiro e partita. Non si
            torna indietro.
          </p>
        )}
        {errore && <p className="mt-2 text-xs text-red-700">{errore}</p>}

        {credenziali && (
          <div className="mt-4">
            {appenaCreato && (
              <p className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                Evento creato! Manda all’organizzatore il messaggio completo: dentro ci sono
                entrambi gli accessi e la spiegazione di chi può fare cosa.
              </p>
            )}
            <CredenzialiPanel
              eventoId={evento.id}
              titolo={evento.configurato ? titoloEvento(evento) : undefined}
              gestione
            />
          </div>
        )}
      </div>
    </li>
  )
}

/** La pagina di Oder: tutti gli eventi, la creazione e le credenziali. */
export default function DashboardPage() {
  const { logout } = useAuth()
  const [eventi, setEventi] = useState<Evento[]>([])
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)
  const [appenaCreato, setAppenaCreato] = useState<string | null>(null)

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'eventi'), orderBy('creatoIl', 'desc')),
      (istantanea) => {
        setEventi(istantanea.docs.map((d) => normalizzaEvento(d.id, d.data() as Partial<Evento>)))
        setErrore(null)
        setCaricamento(false)
      },
      (err) => {
        setErrore(messaggioErroreFirestore(err))
        setCaricamento(false)
      },
    )
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primario-800 text-crema-50 shadow-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <IconaEvento tipo={null} className="h-7 w-9 shrink-0 text-oro-400" />
            <span className="truncate font-display text-xl font-semibold sm:text-2xl">{NOME_SITO}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs text-crema-50/70 sm:inline">oder · gestione</span>
            <button
              onClick={() => logout()}
              className="rounded-lg border border-crema-50/30 px-3 py-1.5 text-xs font-semibold
                         transition hover:bg-crema-50/10"
            >
              Esci
            </button>
          </div>
        </div>
        <div className="h-1 bg-oro-500" />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <NuovoEvento onCreato={setAppenaCreato} />

        <section>
          <h2 className="mb-3 text-xl font-semibold text-primario-800">
            Gli eventi{' '}
            <span className="text-base font-normal text-inchiostro/50">({eventi.length})</span>
          </h2>

          {errore && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errore}
            </p>
          )}

          {caricamento ? (
            <Loader testo="Carico gli eventi…" />
          ) : eventi.length === 0 ? (
            <p className="card p-6 text-center text-sm text-inchiostro/55">
              Ancora nessun evento: crea il primo qui sopra.
            </p>
          ) : (
            <ul className="space-y-4">
              {eventi.map((evento) => (
                <SchedaEvento
                  key={evento.id}
                  evento={evento}
                  appenaCreato={evento.id === appenaCreato}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
