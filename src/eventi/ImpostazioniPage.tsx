import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import IconaEvento from '../components/IconaEvento'
import { db } from '../firebase'
import { comprimiFoto } from '../games/cashorsara/foto'
import { useFotoPresentatore } from '../games/cashorsara/useFotoPresentatore'
import { giochi } from '../games/registry'
import { messaggioErroreFirestore } from '../games/shared/raccolta'
import { COLORI_PROPOSTI, coloreValido, contrastoConBianco } from './colore'
import { useEvento } from './eventoContext'
import {
  DETTAGLIO_MAX,
  ELENCO_TIPI,
  FESTEGGIATI_MAX,
  NOME_FESTEGGIATO_MAX,
  PRESENTATORE_MAX,
  TIPI,
  TITOLO_GIOCO_MAX,
  titoloPredefinito,
  type IdGioco,
  type ImpostazioniGioco,
  type TipoEvento,
} from './types'

interface PropsSezione {
  titolo: string
  spiegazione?: string
  children: ReactNode
}

function Sezione({ titolo, spiegazione, children }: PropsSezione) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-2xl font-semibold text-primario-800">{titolo}</h2>
      {spiegazione && <p className="mt-1 text-sm text-inchiostro/60">{spiegazione}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function ImpostazioniPage() {
  const { evento, percorso, setAnteprimaColore } = useEvento()
  const navigate = useNavigate()
  const presentatore = useFotoPresentatore(evento.id)

  const [tipo, setTipo] = useState<TipoEvento>(evento.tipo)
  const [festeggiati, setFesteggiati] = useState<string[]>(
    evento.festeggiati.length > 0 ? evento.festeggiati : [''],
  )
  const [dettaglio, setDettaglio] = useState(evento.dettaglio)
  const [data, setData] = useState(evento.data)
  const [colore, setColore] = useState(evento.colore)
  const [impostazioniGiochi, setImpostazioniGiochi] = useState(evento.giochi)
  const [nomePresentatore, setNomePresentatore] = useState(evento.presentatore)
  /** undefined = foto non toccata, null = da togliere. */
  const [fotoNuova, setFotoNuova] = useState<string | null | undefined>(undefined)
  const [errore, setErrore] = useState<string | null>(null)
  const [conferma, setConferma] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  // uscendo dalla pagina il sito torna al colore salvato
  useEffect(() => () => setAnteprimaColore(null), [setAnteprimaColore])

  function scegliColore(nuovo: string) {
    setColore(nuovo)
    // il sito cambia colore subito, cosi' si vede l'effetto prima di salvare
    if (coloreValido(nuovo)) setAnteprimaColore(nuovo)
  }

  function cambiaGioco(id: IdGioco, modifica: Partial<ImpostazioniGioco>) {
    setImpostazioniGiochi((attuali) => ({ ...attuali, [id]: { ...attuali[id], ...modifica } }))
  }

  async function scegliFoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErrore(null)
    try {
      setFotoNuova(await comprimiFoto(file, { trasparenza: true }))
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Foto non caricata')
    }
  }

  // l'evento come sarebbe con le modifiche: serve per mostrare i titoli automatici
  const bozza = { ...evento, tipo, festeggiati, configurato: true }
  const nomi = festeggiati.map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean)
  const contrastoBasso = coloreValido(colore) && contrastoConBianco(colore) < 4.5
  const fotoMostrata = fotoNuova === undefined ? presentatore.foto : fotoNuova

  async function salva(e: FormEvent) {
    e.preventDefault()
    setConferma(null)
    if (nomi.length === 0) return setErrore('Scrivi il nome di almeno un festeggiato.')
    if (!coloreValido(colore)) return setErrore('Il colore non è valido.')

    setErrore(null)
    setInCorso(true)
    const primaVolta = !evento.configurato
    try {
      const pulitiGiochi = Object.fromEntries(
        Object.entries(impostazioniGiochi).map(([id, g]) => [id, { attivo: g.attivo, titolo: g.titolo.trim() }]),
      )
      await updateDoc(doc(db, 'eventi', evento.id), {
        configurato: true,
        tipo,
        festeggiati: nomi,
        dettaglio: dettaglio.trim(),
        data,
        colore: colore.toLowerCase(),
        giochi: pulitiGiochi,
        presentatore: nomePresentatore.trim(),
        aggiornatoIl: serverTimestamp(),
      })
      if (fotoNuova !== undefined) {
        await presentatore.salva(fotoNuova)
        setFotoNuova(undefined)
      }
      if (primaVolta) navigate(percorso())
      else setConferma('Impostazioni salvate.')
    } catch (err) {
      setErrore(messaggioErroreFirestore(err))
    } finally {
      setInCorso(false)
    }
  }

  return (
    <form onSubmit={salva} className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-primario-800 sm:text-4xl">Impostazioni</h1>
        <p className="mt-1 max-w-2xl text-sm text-inchiostro/65">
          Chi festeggiamo, con che colore e con quali giochi. Puoi tornare a cambiare tutto quando
          vuoi.
        </p>
      </header>

      <Sezione titolo="Che festa è?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ELENCO_TIPI.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                tipo === t
                  ? 'border-primario-700 bg-primario-700 text-crema-50'
                  : 'border-crema-300 bg-crema-50 text-primario-800 hover:border-primario-300'
              }`}
            >
              <IconaEvento tipo={t} className="h-6 w-8" />
              {TIPI[t].etichetta}
            </button>
          ))}
        </div>
      </Sezione>

      <Sezione
        titolo="Chi festeggiamo"
        spiegazione="Nome e cognome, come vuoi che compaiano nella home. Nei giochi si usa solo il nome."
      >
        <div className="space-y-2">
          {festeggiati.map((nome, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="field flex-1"
                value={nome}
                maxLength={NOME_FESTEGGIATO_MAX}
                placeholder={i === 0 ? 'es. Sara Miglienti' : 'es. Marco Rossi'}
                onChange={(e) =>
                  setFesteggiati((attuali) => attuali.map((n, j) => (j === i ? e.target.value : n)))
                }
              />
              {festeggiati.length > 1 && (
                <button
                  type="button"
                  className="btn-ghost px-3 text-red-700 hover:bg-red-50"
                  aria-label="Togli"
                  onClick={() => setFesteggiati((attuali) => attuali.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {festeggiati.length < FESTEGGIATI_MAX && (
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={() => setFesteggiati((attuali) => [...attuali, ''])}
            >
              + Aggiungi un festeggiato
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="dettaglio" className="field-label">
              Una riga in più <span className="font-normal text-inchiostro/45">(facoltativa)</span>
            </label>
            <input
              id="dettaglio"
              className="field"
              value={dettaglio}
              maxLength={DETTAGLIO_MAX}
              placeholder={TIPI[tipo].esempioDettaglio}
              onChange={(e) => setDettaglio(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="data" className="field-label">
              Data <span className="font-normal text-inchiostro/45">(facoltativa)</span>
            </label>
            <input
              id="data"
              type="date"
              className="field"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>
      </Sezione>

      <Sezione titolo="Il colore" spiegazione="Il sito cambia subito, così vedi l’effetto prima di salvare.">
        <div className="flex flex-wrap items-center gap-2">
          {COLORI_PROPOSTI.map((c) => (
            <button
              key={c.valore}
              type="button"
              title={c.nome}
              aria-label={c.nome}
              onClick={() => scegliColore(c.valore)}
              className={`h-10 w-10 cursor-pointer rounded-full border-2 transition ${
                colore.toLowerCase() === c.valore ? 'scale-110 border-oro-500 ring-2 ring-oro-300' : 'border-white'
              }`}
              style={{ backgroundColor: c.valore }}
            />
          ))}
          <label className="ml-2 flex cursor-pointer items-center gap-2 text-sm text-inchiostro/70">
            <input
              type="color"
              className="h-10 w-12 cursor-pointer rounded border border-crema-300 bg-white"
              value={coloreValido(colore) ? colore : '#7b1e3a'}
              onChange={(e) => scegliColore(e.target.value)}
            />
            Un altro colore
          </label>
        </div>
        {contrastoBasso && (
          <p className="mt-3 rounded-lg border border-oro-300 bg-oro-100/60 px-3 py-2 text-sm text-inchiostro/75">
            Questo colore è molto chiaro: le scritte bianche sopra si leggeranno male. Meglio una
            tinta più scura.
          </p>
        )}
      </Sezione>

      <Sezione
        titolo="I giochi"
        spiegazione="Spegni quelli che non usate. Il titolo lascialo vuoto per quello automatico."
      >
        <div className="space-y-3">
          {giochi.map((gioco) => {
            const impostazioni = impostazioniGiochi[gioco.id]
            return (
              <div key={gioco.id} className="rounded-lg border border-oro-200 bg-crema-50 p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-primario-700"
                    checked={impostazioni.attivo}
                    onChange={(e) => cambiaGioco(gioco.id, { attivo: e.target.checked })}
                  />
                  <span className="text-lg">{gioco.emoji}</span>
                  <span className="font-semibold text-primario-800">
                    {impostazioni.titolo.trim() || titoloPredefinito(bozza, gioco.id)}
                  </span>
                  {!impostazioni.attivo && <span className="text-xs text-inchiostro/45">spento</span>}
                </label>

                {impostazioni.attivo && (
                  <div className="mt-3 space-y-3 pl-8">
                    <div>
                      <label htmlFor={`titolo-${gioco.id}`} className="field-label">
                        Titolo
                      </label>
                      <input
                        id={`titolo-${gioco.id}`}
                        className="field"
                        value={impostazioni.titolo}
                        maxLength={TITOLO_GIOCO_MAX}
                        placeholder={titoloPredefinito(bozza, gioco.id)}
                        onChange={(e) => cambiaGioco(gioco.id, { titolo: e.target.value })}
                      />
                    </div>

                    {gioco.id === 'cashorsara' && (
                      <div className="rounded-lg border border-crema-300 bg-white p-3">
                        <p className="text-sm font-semibold text-primario-800">
                          Il presentatore <span className="font-normal text-inchiostro/45">(facoltativo)</span>
                        </p>
                        <p className="mb-3 text-xs text-inchiostro/55">
                          Sulla proiezione compare a tutta altezza e “racconta” gli oggetti in un
                          fumetto. Meglio una foto scontornata (PNG con lo sfondo trasparente).
                        </p>
                        <input
                          className="field mb-3"
                          value={nomePresentatore}
                          maxLength={PRESENTATORE_MAX}
                          placeholder="Nome del presentatore"
                          onChange={(e) => setNomePresentatore(e.target.value)}
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="btn-secondary cursor-pointer text-xs">
                            {fotoMostrata ? 'Cambia foto' : 'Scegli una foto'}
                            <input type="file" accept="image/*" className="hidden" onChange={scegliFoto} />
                          </label>
                          {fotoMostrata && (
                            <>
                              <img
                                src={fotoMostrata}
                                alt=""
                                className="h-20 w-20 rounded-lg border border-oro-200 bg-crema-100 object-contain"
                              />
                              <button type="button" className="btn-ghost text-xs" onClick={() => setFotoNuova(null)}>
                                Togli la foto
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Sezione>

      {errore && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errore}</p>
      )}
      {conferma && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {conferma}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-crema-300 bg-crema-100/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={inCorso}>
          {inCorso ? 'Salvataggio…' : evento.configurato ? 'Salva le impostazioni' : 'Salva e apri la festa'}
        </button>
      </div>
    </form>
  )
}
