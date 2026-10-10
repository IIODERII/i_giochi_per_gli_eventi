import type { TipoEvento } from '../eventi/types'
import Tocco from './Tocco'

interface Props {
  className?: string
}

function Torta({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 64 50" className={className} aria-hidden="true" fill="none">
      <path d="M32 0c2.5 3.2 3.2 5.6 0 7.6-3.2-2-2.5-4.4 0-7.6z" fill="currentColor" />
      <rect x="30" y="9" width="4" height="9" rx="1" fill="currentColor" />
      <rect x="15" y="19.5" width="34" height="11" rx="2.5" stroke="currentColor" strokeWidth="3.5" />
      <rect x="7" y="32" width="50" height="15" rx="3" fill="currentColor" />
    </svg>
  )
}

function Anelli({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 64 50" className={className} aria-hidden="true" fill="none">
      <circle cx="24" cy="31" r="14" stroke="currentColor" strokeWidth="4" />
      <circle cx="40" cy="31" r="14" stroke="currentColor" strokeWidth="4" />
      <path d="M40 15 35 9l3-4h4l3 4z" fill="currentColor" />
    </svg>
  )
}

function Stella({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 64 50" className={className} aria-hidden="true" fill="none">
      <path
        d="M32 4l5.3 13.7 14.7.8-11.4 9.3 3.7 14.2L32 34l-12.3 8 3.7-14.2L12 18.5l14.7-.8z"
        fill="currentColor"
      />
      <path
        d="M54 3v8M50 7h8M10 33v8M6 37h8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Il piccolo stemma del sito, diverso per ogni tipo di evento. */
export default function IconaEvento({ tipo, className }: Props & { tipo: TipoEvento | null }) {
  switch (tipo) {
    case 'laurea':
      return <Tocco className={className} />
    case 'compleanno':
      return <Torta className={className} />
    case 'matrimonio':
    case 'anniversario':
      return <Anelli className={className} />
    default:
      return <Stella className={className} />
  }
}
