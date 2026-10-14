import { useState, type ReactNode } from 'react'

/** Ricorda nel browser se una guida e' stata chiusa: e' una comodita', non un dato. */
function chiave(id: string) {
  return `giochieventi:guida-${id}-chiusa`
}

function leggiChiusa(id: string, chiusaDiPartenza: boolean): boolean {
  try {
    const salvata = localStorage.getItem(chiave(id))
    return salvata === null ? chiusaDiPartenza : salvata === '1'
  } catch {
    return chiusaDiPartenza
  }
}

function salvaChiusa(id: string, chiusa: boolean) {
  try {
    localStorage.setItem(chiave(id), chiusa ? '1' : '0')
  } catch {
    /* localStorage non disponibile: la guida tornera' come all'inizio */
  }
}

interface Props {
  /** Distingue le guide fra loro nel ricordo aperta/chiusa. */
  id: string
  titolo: string
  sottotitolo: string
  /** Gli invitati la trovano chiusa, l'admin che prepara la trova aperta. */
  chiusaDiPartenza?: boolean
  children: ReactNode
}

/** Il riquadro "Come funziona ..." che si apre e si chiude in cima a ogni sezione. */
export default function Guida({ id, titolo, sottotitolo, chiusaDiPartenza = false, children }: Props) {
  const [chiusa, setChiusa] = useState(() => leggiChiusa(id, chiusaDiPartenza))

  function alterna() {
    setChiusa((attuale) => {
      salvaChiusa(id, !attuale)
      return !attuale
    })
  }

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={alterna}
        aria-expanded={!chiusa}
        className="flex w-full cursor-pointer items-center justify-between gap-3 bg-oro-100/60 px-5 py-3 text-left transition hover:bg-oro-100 sm:px-6"
      >
        <span>
          <span className="block font-semibold text-primario-800">{titolo}</span>
          <span className="block text-xs text-inchiostro/55">{sottotitolo}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-primario-700">
          {chiusa ? 'Apri la guida ▾' : 'Chiudi ▴'}
        </span>
      </button>

      {!chiusa && <div className="space-y-7 px-5 py-5 sm:px-6">{children}</div>}
    </section>
  )
}

export function SezioneGuida({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 border-b border-oro-200 pb-1 text-lg font-semibold text-primario-800">{titolo}</h3>
      {children}
    </section>
  )
}

export function Passi({ children }: { children: ReactNode }) {
  return <ol className="space-y-4">{children}</ol>
}

export function Passo({ numero, titolo, children }: { numero: number; titolo: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primario-700 text-xs font-bold text-crema-50">
        {numero}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-primario-800">{titolo}</p>
        <div className="mt-0.5 space-y-1 text-sm text-inchiostro/75">{children}</div>
      </div>
    </li>
  )
}

/** Un paragrafo di testo della guida. */
export function Testo({ children }: { children: ReactNode }) {
  return <p className="text-sm text-inchiostro/75 [&+&]:mt-2">{children}</p>
}

/** Elenco puntato: consigli, problemi e soluzioni. */
export function Punti({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5 text-sm text-inchiostro/75">{children}</ul>
}
