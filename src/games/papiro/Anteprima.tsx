import { useEffect, useRef, useState } from 'react'
import Scelta from '../../components/Scelta'
import { attendiCaratteri, MM_PER_PUNTO } from '../shared/stampa'
import { caricaImmagine, disegnaPapiro, impaginaPerTela, scaricaPng, type StilePapiro } from './disegno'
import { scaricaPdf } from './exportPdf'
import {
  COLONNE_PAPIRO,
  colonneImmagine,
  ELENCO_FORMATI,
  FORMATI,
  type LarghezzaImmagine,
  type Papiro,
} from './types'

interface Props {
  papiro: Papiro
  stile: StilePapiro
  immagine: string | null
  aggiorna: (modifica: Partial<Papiro>) => void
}

interface Esito {
  dimensione: number
  versiFuori: number
  piccolo: boolean
  occupazione: number
}

export default function Anteprima({ papiro, stile, immagine, aggiorna }: Props) {
  const tela = useRef<HTMLCanvasElement>(null)
  const [caricata, setCaricata] = useState<{ sorgente: string; immagine: HTMLImageElement } | null>(null)
  const foto = immagine && caricata?.sorgente === immagine ? caricata.immagine : null
  const [esito, setEsito] = useState<Esito | null>(null)
  const [esportazione, setEsportazione] = useState<'pdf' | 'png' | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const foglio = FORMATI[papiro.formato]

  useEffect(() => {
    if (!immagine) return
    let attivo = true
    caricaImmagine(immagine)
      .then((i) => attivo && setCaricata({ sorgente: immagine, immagine: i }))
      .catch(() => undefined)
    return () => {
      attivo = false
    }
  }, [immagine])

  // ridisegna poco dopo l'ultima modifica, non a ogni tasto
  useEffect(() => {
    const timer = setTimeout(async () => {
      await attendiCaratteri()
      const el = tela.current
      const ctx = el?.getContext('2d')
      if (!el || !ctx) return
      const imp = impaginaPerTela(papiro, stile, foto)
      const scala = ((el.clientWidth || 600) * (window.devicePixelRatio || 1)) / imp.larghezza
      el.width = Math.round(imp.larghezza * scala)
      el.height = Math.round(imp.altezza * scala)
      ctx.setTransform(scala, 0, 0, scala, 0, 0)
      disegnaPapiro(ctx, imp, papiro, stile, foto)
      setEsito({
        dimensione: imp.dimensioneTesto,
        versiFuori: imp.versiFuori,
        piccolo: imp.dimensioneTesto < imp.dimensioneComoda,
        occupazione: imp.occupazione,
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [papiro, stile, foto])

  async function esporta(tipo: 'pdf' | 'png') {
    setErrore(null)
    setEsportazione(tipo)
    try {
      await (tipo === 'pdf' ? scaricaPdf : scaricaPng)(papiro, stile, immagine)
    } catch {
      setErrore('Non sono riuscito a creare il file. Riprova.')
    } finally {
      setEsportazione(null)
    }
  }

  const larghePossibili = colonneImmagine(papiro.colonne, 'larga') !== colonneImmagine(papiro.colonne, 'stretta')
  // altezza delle minuscole stampate, in mm: piu' facile da immaginare dei punti
  const millimetri = esito ? (esito.dimensione * MM_PER_PUNTO * 0.45).toFixed(1) : null

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-2xl font-semibold text-primario-800">Impaginazione e stampa</h2>
      <p className="mb-5 text-sm text-inchiostro/60">
        Il testo si adatta da solo: viene scelto il carattere più grande con cui tutti i versi
        stanno nel foglio.
      </p>

      <div className="mb-5 grid gap-4 rounded-lg border border-oro-200 bg-crema-50 p-4 sm:grid-cols-2">
        <div>
          <span className="field-label">Formato</span>
          <Scelta
            valore={papiro.formato}
            opzioni={ELENCO_FORMATI}
            onChange={(formato) => aggiorna({ formato })}
            etichetta={(f) => FORMATI[f].nome}
          />
        </div>
        <div>
          <span className="field-label">Colonne di versi</span>
          <Scelta
            valore={papiro.colonne}
            opzioni={COLONNE_PAPIRO}
            onChange={(colonne) => aggiorna({ colonne })}
            etichetta={(c) => String(c)}
          />
        </div>
        <div>
          <span className="field-label">Immagine</span>
          <Scelta<LarghezzaImmagine>
            valore={larghePossibili ? papiro.immagine : 'stretta'}
            opzioni={['stretta', 'larga']}
            disattivate={larghePossibili ? [] : ['larga']}
            onChange={(i) => aggiorna({ immagine: i })}
            etichetta={(i) => (i === 'stretta' ? 'Stretta' : 'Larga')}
          />
          {!larghePossibili && (
            <p className="mt-1 text-xs text-inchiostro/50">Larga solo con 5 o 6 colonne.</p>
          )}
        </div>
        <div>
          <span className="field-label">Fondo</span>
          <Scelta
            valore={papiro.pergamena ? 'pergamena' : 'bianco'}
            opzioni={['pergamena', 'bianco'] as const}
            onChange={(f) => aggiorna({ pergamena: f === 'pergamena' })}
            etichetta={(f) => (f === 'pergamena' ? 'Pergamena' : 'Bianco')}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary px-3 py-2 text-xs"
          disabled={esportazione !== null}
          onClick={() => esporta('pdf')}
        >
          {esportazione === 'pdf' ? 'Creo il PDF…' : `Scarica PDF ${foglio.nome}`}
        </button>
        <button
          type="button"
          className="btn-primary px-3 py-2 text-xs"
          disabled={esportazione !== null}
          onClick={() => esporta('png')}
        >
          {esportazione === 'png' ? 'Creo l immagine…' : `Scarica PNG ${foglio.nome}`}
        </button>
        {errore && <span className="text-xs text-red-700">{errore}</span>}
      </div>

      {esito && (
        <p className="mb-3 text-xs text-inchiostro/55">
          Versi a {esito.dimensione.toFixed(1)} pt (lettere minuscole alte circa {millimetri} mm
          sul foglio stampato).
        </p>
      )}
      {esito && esito.versiFuori > 0 && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {esito.versiFuori === 1 ? 'Un verso non ci sta' : `${esito.versiFuori} versi non ci stanno`}{' '}
          nemmeno con il carattere più piccolo. Scegli un formato più grande, più colonne o
          l’immagine stretta, oppure accorcia il testo.
        </p>
      )}
      {esito && esito.versiFuori === 0 && esito.piccolo && (
        <p className="mb-4 rounded-lg border border-oro-300 bg-oro-100/60 px-4 py-3 text-sm text-inchiostro/75">
          Per farci stare tutto il testo il carattere è piccolo: appeso al muro si leggerà solo da
          vicino. Se puoi, scegli un formato più grande.
        </p>
      )}

      {esito && esito.versiFuori === 0 && esito.occupazione < 0.5 && papiro.testo.trim() && (
        <p className="mb-4 rounded-lg border border-oro-200 bg-crema-50 px-4 py-3 text-sm text-inchiostro/70">
          I versi occupano solo {Math.round(esito.occupazione * 100)}% dello spazio.{' '}
          {papiro.colonne > 3
            ? 'Con meno colonne, più larghe, il carattere può crescere senza mandare a capo i versi.'
            : 'Con un formato più piccolo il foglio sarà più pieno, oppure aggiungi qualche strofa.'}
        </p>
      )}

      <canvas
        ref={tela}
        className="mx-auto block w-full max-w-2xl rounded border border-crema-300 shadow-sm"
        style={{ aspectRatio: `${foglio.larghezza} / ${foglio.altezza}` }}
        role="img"
        aria-label="Anteprima del papiro"
      />
      <p className="mt-2 text-center text-xs text-inchiostro/45">
        Anteprima. Nel PDF il carattere è un Times, quindi gli a capo possono cambiare di poco.
      </p>
    </section>
  )
}
