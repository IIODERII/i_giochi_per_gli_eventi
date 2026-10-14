import { useMemo, useState, type ChangeEvent } from 'react'
import Loader from '../../components/Loader'
import { useEvento } from '../../eventi/eventoContext'
import { dataLeggibile, nomiCompleti, titoloGioco } from '../../eventi/types'
import { comprimiFoto } from '../cashorsara/foto'
import { messaggioErroreFirestore } from '../shared/raccolta'
import Anteprima from './Anteprima'
import GuidaPapiro from './GuidaPapiro'
import { SOTTOTITOLO_MAX, TITOLO_MAX } from './types'
import { usePapiro } from './usePapiro'
import Versi from './Versi'

/** Un poster si guarda da vicino: si tengono piu' pixel che per le foto di Cash or ... */
const LATO_IMMAGINE = 2000

export default function PapiroPage() {
  const { evento } = useEvento()
  const { papiro, immagine, stato, errore, aggiorna, salvaImmagine } = usePapiro(evento.id)
  const [erroreImmagine, setErroreImmagine] = useState<string | null>(null)
  const [caricaFoto, setCaricaFoto] = useState(false)

  const titoloPredefinito = nomiCompleti(evento) || titoloGioco(evento, 'papiro')
  const sottotitoloPredefinito = [evento.dettaglio, dataLeggibile(evento.data)].filter(Boolean).join(' · ')
  const titolo = papiro?.titolo.trim() || titoloPredefinito
  const sottotitolo = papiro?.sottotitolo.trim() || sottotitoloPredefinito
  const stile = useMemo(
    () => ({ colore: evento.colore, titolo, sottotitolo }),
    [evento.colore, titolo, sottotitolo],
  )

  async function scegliImmagine(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErroreImmagine(null)
    setCaricaFoto(true)
    try {
      await salvaImmagine(await comprimiFoto(file, { trasparenza: true, latoMassimo: LATO_IMMAGINE }))
    } catch (err) {
      setErroreImmagine(err instanceof Error && !('code' in err) ? err.message : messaggioErroreFirestore(err))
    } finally {
      setCaricaFoto(false)
    }
  }

  async function togliImmagine() {
    setErroreImmagine(null)
    try {
      await salvaImmagine(null)
    } catch (err) {
      setErroreImmagine(messaggioErroreFirestore(err))
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-primario-800 sm:text-4xl">
          {titoloGioco(evento, 'papiro')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-inchiostro/65">
          Il poema da appendere alla festa: un’immagine al centro e i versi tutto intorno. Lo
          prepari tu, gli invitati non lo vedono.
        </p>
      </header>

      <GuidaPapiro />

      {errore && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errore}</p>
      )}

      {!papiro ? (
        <Loader />
      ) : (
        <>
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-2xl font-semibold text-primario-800">Intestazione e immagine</h2>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-4">
                <div>
                  <label htmlFor="titolo-papiro" className="field-label">
                    Titolo
                  </label>
                  <input
                    id="titolo-papiro"
                    className="field"
                    value={papiro.titolo}
                    maxLength={TITOLO_MAX}
                    placeholder={titoloPredefinito}
                    onChange={(e) => aggiorna({ titolo: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="sottotitolo-papiro" className="field-label">
                    Sottotitolo <span className="font-normal text-inchiostro/45">(facoltativo)</span>
                  </label>
                  <input
                    id="sottotitolo-papiro"
                    className="field"
                    value={papiro.sottotitolo}
                    maxLength={SOTTOTITOLO_MAX}
                    placeholder={sottotitoloPredefinito || 'es. Laurea in Lettere · 12 dicembre 2026'}
                    onChange={(e) => aggiorna({ sottotitolo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <span className="field-label">Immagine al centro</span>
                <div className="flex items-center gap-3">
                  {immagine ? (
                    <img
                      src={immagine}
                      alt=""
                      className="h-28 w-28 rounded-lg border border-oro-200 bg-crema-100 object-contain"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-crema-300 text-center text-xs text-inchiostro/40">
                      nessuna immagine
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className={`btn-secondary cursor-pointer text-xs ${caricaFoto ? 'opacity-50' : ''}`}>
                      {caricaFoto ? 'Carico…' : immagine ? 'Cambia immagine' : 'Scegli un’immagine'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={caricaFoto}
                        onChange={scegliImmagine}
                      />
                    </label>
                    {immagine && (
                      <button type="button" className="btn-ghost text-xs" onClick={togliImmagine}>
                        Togli l’immagine
                      </button>
                    )}
                  </div>
                </div>
                {erroreImmagine && <p className="mt-2 text-xs text-red-700">{erroreImmagine}</p>}
              </div>
            </div>
          </section>

          <Versi testo={papiro.testo} onChange={(testo) => aggiorna({ testo })} stato={stato} />

          <Anteprima papiro={papiro} stile={stile} immagine={immagine} aggiorna={aggiorna} />
        </>
      )}
    </div>
  )
}
