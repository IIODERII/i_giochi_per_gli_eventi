import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

/**
 * superadmin: Oder, che vede e gestisce tutti gli eventi.
 * admin / ospiti: gli utenti di un solo evento, creati da Oder.
 */
export type Ruolo = 'superadmin' | 'admin' | 'ospiti'

export interface AuthState {
  user: User | null
  /** Nome utente senza dominio, es. "oder" oppure "sara25-ospiti". */
  username: string
  /** null se l'utente non e' collegato a nessun evento (es. evento eliminato). */
  ruolo: Ruolo | null
  /** L'evento dell'utente; per il superadmin e' sempre null. */
  eventoId: string | null
  isSuperadmin: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth va usato dentro <AuthProvider>')
  return ctx
}
