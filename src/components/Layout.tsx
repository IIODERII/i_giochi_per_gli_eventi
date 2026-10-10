import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { useEvento } from '../eventi/eventoContext'
import { nomiCompleti, titoloEvento, titoloGioco } from '../eventi/types'
import { giochiVisibili } from '../games/registry'
import IconaEvento from './IconaEvento'

const voceMenu = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-oro-400 text-primario-900'
      : 'bg-crema-50/10 text-crema-50 hover:bg-crema-50/20'
  }`

export default function Layout() {
  const { username, logout } = useAuth()
  const { evento, isAdmin, isSuperadmin, percorso } = useEvento()
  const giochi = giochiVisibili(evento, isAdmin)
  const piede = [nomiCompleti(evento), evento.dettaglio].filter(Boolean).join(' · ')

  return (
    <div className="flex min-h-screen flex-col">
      {isSuperadmin && (
        <div className="bg-inchiostro text-xs text-crema-50/80">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
            <Link to="/" className="font-semibold hover:text-crema-50">
              ← Tutti gli eventi
            </Link>
            <span className="truncate">
              Sei dentro <span className="font-mono">{evento.id}</span> come Oder
            </span>
          </div>
        </div>
      )}

      <header className="bg-primario-800 text-crema-50 shadow-md">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link to={percorso()} className="flex min-w-0 items-center gap-2.5">
              <IconaEvento tipo={evento.tipo} className="h-7 w-9 shrink-0 text-oro-400" />
              <span className="truncate font-display text-xl font-semibold sm:text-2xl">
                {titoloEvento(evento)}
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-crema-50/70 sm:inline">
                {username}
                {isAdmin && !isSuperadmin && ' · admin'}
              </span>
              <button
                onClick={() => logout()}
                className="rounded-lg border border-crema-50/30 px-3 py-1.5 text-xs font-semibold
                           transition hover:bg-crema-50/10"
              >
                Esci
              </button>
            </div>
          </div>

          {(giochi.length > 1 || isAdmin) && (
            <nav className="mt-3 flex flex-wrap gap-2">
              {giochi.map((gioco) => (
                <NavLink key={gioco.id} to={percorso(gioco.percorso)} className={voceMenu}>
                  {titoloGioco(evento, gioco.id)}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink to={percorso('impostazioni')} className={voceMenu}>
                  ⚙ Impostazioni
                </NavLink>
              )}
            </nav>
          )}
        </div>
        <div className="h-1 bg-oro-500" />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      {piede && (
        <footer className="border-t border-crema-300 bg-crema-50 py-5 text-center text-xs text-inchiostro/45">
          {piede}
        </footer>
      )}
    </div>
  )
}
