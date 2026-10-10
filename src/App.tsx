import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import LoginPage from './auth/LoginPage'
import ProtectedRoute from './auth/ProtectedRoute'
import Layout from './components/Layout'
import EventoRoute, { SoloAdmin } from './eventi/EventoRoute'
import ImpostazioniPage from './eventi/ImpostazioniPage'
import GiocaRoute from './games/cashorsara/GiocaRoute'
import ProiezionePage from './games/cashorsara/ProiezionePage'
import GiocoRoute from './games/GiocoRoute'
import { giochi } from './games/registry'
import HomePage from './pages/HomePage'
import InizioPage from './pages/InizioPage'

export default function App() {
  return (
    // HashRouter: gli indirizzi diventano .../#/e/sara25/cruciverba, cosi' il
    // sito funziona anche su GitHub Pages senza dare 404 al ricaricamento.
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* pagina del QR: aperta agli invitati, che entrano senza password */}
          <Route path="/e/:eventoId/gioca" element={<GiocaRoute />} />

          <Route element={<ProtectedRoute />}>
            {/* Oder vede la dashboard, gli altri vengono mandati al loro evento */}
            <Route path="/" element={<InizioPage />} />

            <Route path="/e/:eventoId" element={<EventoRoute />}>
              <Route element={<SoloAdmin />}>
                {/* schermo da proiettare: a tutta pagina, senza intestazione */}
                <Route path="proiezione" element={<ProiezionePage />} />
              </Route>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                {giochi.map((gioco) => (
                  <Route key={gioco.id} path={gioco.percorso} element={<GiocoRoute gioco={gioco} />} />
                ))}
                <Route element={<SoloAdmin />}>
                  <Route path="impostazioni" element={<ImpostazioniPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
