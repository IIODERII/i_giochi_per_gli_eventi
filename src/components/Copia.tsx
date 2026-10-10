import { useEffect, useState } from 'react'

async function copiaNegliAppunti(testo: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(testo)
    return true
  } catch {
    // vecchi browser o pagina non sicura: si passa da un campo nascosto
    const campo = document.createElement('textarea')
    campo.value = testo
    campo.style.position = 'fixed'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    const riuscito = document.execCommand('copy')
    campo.remove()
    return riuscito
  }
}

interface Props {
  testo: string
  etichetta?: string
  className?: string
}

/** Pulsante che copia un testo e per un attimo conferma di averlo fatto. */
export default function Copia({ testo, etichetta = 'Copia', className = 'btn-secondary px-2.5 py-1 text-xs' }: Props) {
  const [esito, setEsito] = useState<'copiato' | 'errore' | null>(null)

  useEffect(() => {
    if (!esito) return
    const timer = setTimeout(() => setEsito(null), 1800)
    return () => clearTimeout(timer)
  }, [esito])

  return (
    <button
      type="button"
      className={className}
      onClick={async () => setEsito((await copiaNegliAppunti(testo)) ? 'copiato' : 'errore')}
    >
      {esito === 'copiato' ? 'Copiato ✓' : esito === 'errore' ? 'Non riuscito' : etichetta}
    </button>
  )
}
