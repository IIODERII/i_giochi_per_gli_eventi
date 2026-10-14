/** Una fila di pulsanti attaccati in cui se ne sceglie uno: formati, colonne, righe... */
export default function Scelta<T extends string | number>({
  valore,
  opzioni,
  onChange,
  etichetta,
  disattivate = [],
}: {
  valore: T
  opzioni: readonly T[]
  onChange: (v: T) => void
  etichetta: (v: T) => string
  /** Opzioni visibili ma non selezionabili in questo momento. */
  disattivate?: readonly T[]
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-primario-300">
      {opzioni.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disattivate.includes(o)}
          onClick={() => onChange(o)}
          className={`flex-1 cursor-pointer px-2.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            valore === o
              ? 'bg-primario-700 text-crema-50'
              : 'bg-white text-primario-700 hover:bg-primario-50'
          }`}
        >
          {etichetta(o)}
        </button>
      ))}
    </div>
  )
}
