import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useEvento } from '../../eventi/eventoContext'
import { nomiBrevi, titoloGioco } from '../../eventi/types'
import {
  apriOggetto,
  caricaOggetti,
  chiudiPuntate,
  rivelaValore,
  terminaPartita,
} from './comandi'
import Fumetto from './Fumetto'
import { classifica, esitiTurno } from './punteggi'
import Qr from './Qr'
import { indirizzoGioco } from './riferimenti'
import { euro, type Giocatore, type Partita, type Risposta } from './types'
import { useFotoPresentatore } from './useFotoPresentatore'
import { usePartita } from './usePartita'

/**
 * Il presentatore a tutta altezza sul lato sinistro: e' lui che "parla" nei
 * fumetti. Senza foto (o se non si carica) la colonna sparisce.
 */
function Presentatore({ nome, foto }: { nome: string; foto: string }) {
  const [mancante, setMancante] = useState(false)
  if (mancante) return null

  return (
    // la foto e' scontornata e quasi quadrata: resta alta quanto lo schermo e
    // deborda dalla colonna, a sinistra fuori schermo e a destra sotto il fumetto
    <aside className="relative hidden h-screen w-[30vw] max-w-160 shrink-0 md:block">
      <img
        src={foto}
        alt={nome}
        onError={() => setMancante(true)}
        className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 drop-shadow-2xl"
      />
      {nome && (
        <p className="absolute bottom-6 left-6 rounded-full bg-primario-900/85 px-6 py-2 font-display text-4xl font-semibold text-oro-300">
          {nome}
        </p>
      )}
    </aside>
  )
}

interface PropsBarra {
  eventoId: string
  partita: Partita
  risposte: Risposta[]
  giocatori: Giocatore[]
}

/**
 * Comandi essenziali direttamente sullo schermo proiettato. Serve quando il
 * portatile duplica la TV: la regia mostrerebbe la valutazione vera a tutti,
 * mentre qui compaiono solo i pulsanti. Il valore da rivelare viene letto al
 * volo dal database e non finisce mai in pagina.
 */
function BarraComandi({ eventoId, partita, risposte, giocatori }: PropsBarra) {
  const [inCorso, setInCorso] = useState(false)
  const ultimo = partita.indice >= partita.totale - 1

  const etichetta =
    partita.stato === 'attesa'
      ? 'Comincia'
      : partita.stato === 'puntate'
        ? 'Chiudi le puntate'
        : partita.stato === 'chiuse'
          ? 'Rivela'
          : partita.stato === 'rivelato'
            ? ultimo
              ? 'Classifica finale'
              : 'Prossimo oggetto'
            : ''

  async function avanti() {
    setInCorso(true)
    try {
      const oggetti = await caricaOggetti(eventoId)
      if (partita.stato === 'attesa') await apriOggetto(eventoId, oggetti, 0)
      else if (partita.stato === 'puntate') await chiudiPuntate(eventoId)
      else if (partita.stato === 'chiuse') {
        const valore = oggetti[partita.indice]?.valore ?? 0
        await rivelaValore(eventoId, partita, valore, risposte, giocatori)
      } else if (partita.stato === 'rivelato') {
        if (ultimo) await terminaPartita(eventoId)
        else await apriOggetto(eventoId, oggetti, partita.indice + 1)
      }
    } finally {
      setInCorso(false)
    }
  }

  if (!etichetta) return null

  return (
    <div className="fixed bottom-4 right-4 z-20">
      <button
        onClick={avanti}
        disabled={inCorso}
        className="rounded-full bg-oro-400/90 px-6 py-3 text-lg font-semibold text-primario-900
                   shadow-lg transition hover:bg-oro-300 disabled:opacity-50"
      >
        {inCorso ? '…' : etichetta}
      </button>
    </div>
  )
}

export default function ProiezionePage() {
  const { evento, isAdmin, percorso } = useEvento()
  const eventoId = evento.id
  const { partita, foto, giocatori, risposte, risposteDelTurno } = usePartita(eventoId)
  const { foto: fotoPresentatore } = useFotoPresentatore(eventoId)
  const titolo = titoloGioco(evento, 'cashorsara')
  const nome = nomiBrevi(evento)
  const conPresentatore = Boolean(fotoPresentatore)

  // il valore vero arriva solo dopo la rivelazione: su questo schermo non
  // esiste nessuna copia anticipata della valutazione
  const valore = partita.valoriRivelati[String(partita.indice)]
  const esiti = useMemo(
    () => (valore != null ? esitiTurno(risposteDelTurno, valore) : []),
    [risposteDelTurno, valore],
  )
  const generale = useMemo(
    () => classifica(risposte, partita.valoriRivelati, giocatori),
    [risposte, partita.valoriRivelati, giocatori],
  )

  if (!isAdmin) return <Navigate to={percorso()} replace />

  return (
    <div className="flex h-screen overflow-hidden bg-primario-900 text-crema-50">
      <BarraComandi
        eventoId={eventoId}
        partita={partita}
        risposte={risposte}
        giocatori={giocatori}
      />
      {fotoPresentatore && <Presentatore nome={evento.presentatore} foto={fotoPresentatore} />}
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto px-8 py-8">
        <header className="mb-6 flex shrink-0 items-baseline justify-between">
          <h1 className="font-display text-4xl font-semibold text-oro-300">{titolo}</h1>
          {partita.stato !== 'attesa' && partita.stato !== 'finita' && (
            <p className="text-2xl text-crema-50/60">
              oggetto {partita.indice + 1} di {partita.totale}
            </p>
          )}
        </header>

        {partita.stato === 'attesa' && (
          <div className="flex flex-col items-center gap-8">
            <Fumetto massimo={44} punta={conPresentatore} className="self-start">
              {conPresentatore
                ? `Benvenuti! Inquadrate il codice e giocate con me e ${nome}!`
                : `Benvenuti! Inquadrate il codice e giocate con ${nome}!`}
            </Fumetto>
            <Qr testo={indirizzoGioco(eventoId)} lato={340} />
            <p className="text-2xl text-crema-50/70">
              {giocatori.length === 0
                ? 'Nessuno ancora in gara'
                : `${giocatori.length} in gara`}
            </p>
            <div className="flex max-w-5xl flex-wrap justify-center gap-3">
              {giocatori.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full bg-crema-50/10 px-5 py-2 text-2xl text-crema-50"
                >
                  {g.nome}
                </span>
              ))}
            </div>
          </div>
        )}

        {(partita.stato === 'puntate' || partita.stato === 'chiuse') && (
          // la storia puo' essere lunga: il fumetto prende tutto lo spazio che
          // resta e il testo si adatta, l'oggetto sta sotto senza mai scorrere
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            {partita.oggettoStoria && (
              <Fumetto punta={conPresentatore} className="min-h-0 flex-1">
                {partita.oggettoStoria}
              </Fumetto>
            )}

            <div
              className={`flex shrink-0 items-center gap-8 ${
                partita.oggettoStoria ? '' : 'flex-1 justify-center'
              }`}
            >
              {foto && (
                <img
                  src={foto}
                  alt=""
                  className={`max-w-[45%] rounded-2xl border-4 border-oro-400 object-contain shadow-2xl ${
                    partita.oggettoStoria ? 'max-h-[34vh]' : 'max-h-[55vh]'
                  }`}
                />
              )}
              <div className="flex min-w-0 flex-col gap-4">
                <h2 className="font-display text-6xl leading-tight font-semibold text-oro-200">
                  {partita.oggettoNome}
                </h2>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-3xl">
                  <p>
                    <span className="font-semibold text-oro-300">{giocatori.length}</span> in gara
                  </p>
                  <p>
                    <span className="font-semibold text-oro-300">{risposteDelTurno.length}</span>{' '}
                    hanno già puntato
                  </p>
                </div>
                <p className="text-4xl font-semibold text-oro-300">
                  {partita.stato === 'puntate' ? 'Puntate aperte!' : 'Puntate chiuse'}
                </p>
              </div>
            </div>
          </div>
        )}

        {partita.stato === 'rivelato' && (
          <div className="flex flex-col items-center gap-6">
            <h2 className="font-display text-5xl font-semibold text-oro-200">
              {partita.oggettoNome}
            </h2>
            <div className="rounded-2xl border-4 border-oro-400 bg-crema-50/10 px-12 py-6 text-center">
              <p className="text-2xl uppercase tracking-widest text-crema-50/60">valutazione</p>
              <p className="font-display text-7xl font-semibold text-oro-300">
                {valore != null ? euro(valore) : '—'}
              </p>
            </div>

            {esiti.length > 0 && (
              <>
                <div className="flex flex-wrap justify-center gap-4">
                  {esiti.slice(0, 3).map((e, i) => (
                    <div
                      key={e.giocatoreId}
                      className={`rounded-xl px-8 py-4 text-center ${
                        i === 0 ? 'bg-oro-400 text-primario-900' : 'bg-crema-50/10 text-crema-50'
                      }`}
                    >
                      <p className="text-lg opacity-70">{i + 1}º</p>
                      <p className="text-3xl font-semibold">{e.nome}</p>
                      <p className="text-xl">
                        {euro(e.stima)} · {e.punti} punti
                      </p>
                    </div>
                  ))}
                </div>

                <div className="w-full max-w-6xl columns-2 gap-x-8 text-xl md:columns-3 lg:columns-4">
                  {esiti.map((e) => (
                    <p
                      key={e.giocatoreId}
                      className="mb-1.5 flex break-inside-avoid items-baseline justify-between gap-3 border-b border-crema-50/10 pb-1"
                    >
                      <span className="truncate text-crema-50/85">
                        <span className="mr-1.5 text-crema-50/40">{e.posizione}.</span>
                        {e.nome}
                      </span>
                      <span className="shrink-0 text-oro-200">{euro(e.stima)}</span>
                    </p>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {partita.stato === 'finita' && (
          <div className="flex flex-col items-center gap-8">
            <p className="font-display text-6xl font-semibold text-oro-200">Classifica finale</p>
            <div className="w-full max-w-4xl space-y-3">
              {generale.slice(0, 10).map((r, i) => (
                <div
                  key={r.giocatoreId}
                  className={`flex items-baseline justify-between rounded-xl px-8 py-4 ${
                    i === 0 ? 'bg-oro-400 text-primario-900' : 'bg-crema-50/10'
                  }`}
                >
                  <span className="text-3xl">
                    <span className="mr-4 opacity-60">{r.posizione}º</span>
                    {r.nome}
                  </span>
                  <span className="text-3xl font-semibold">{r.punti} punti</span>
                </div>
              ))}
            </div>
            {generale.length > 10 && (
              <p className="text-xl text-crema-50/50">
                e altri {generale.length - 10} giocatori
              </p>
            )}
          </div>
        )}

        {partita.stato !== 'attesa' && partita.stato !== 'finita' && generale.length > 0 && (
          <footer className="mt-6 flex shrink-0 flex-wrap justify-center gap-x-8 gap-y-2 text-xl text-crema-50/60">
            {generale.slice(0, 5).map((r) => (
              <span key={r.giocatoreId}>
                {r.posizione}º {r.nome} · {r.punti}
              </span>
            ))}
          </footer>
        )}
      </main>
    </div>
  )
}
