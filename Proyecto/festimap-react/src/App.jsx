// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom'

// Estilos globales (traemos tu sistema)
import './styles/reset.css'
import './styles/tokens.css'
import './styles/main.css'

// Páginas (cascarones que ya generamos)
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Intereses from './pages/Intereses.jsx'
import Region from './pages/Region.jsx'
import Tema from './pages/Tema.jsx'
import DetalleEvento from './pages/DetalleEvento.jsx'
import PlanViaje from './pages/PlanViaje.jsx'
import Cuenta from './pages/Cuenta.jsx'

export default function App() {
  return (
    <>
      {/* Barra de navegación temporal para probar rutas */}
      <nav style={{ display: 'flex', gap: '12px', padding: '12px', borderBottom: '1px solid #ddd' }}>
        <Link to="/">Landing</Link>
        <Link to="/home">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/intereses">Intereses</Link>
        <Link to="/region">Región</Link>
        <Link to="/tema">Tema</Link>
        <Link to="/plan">Plan de viaje</Link>
        <Link to="/cuenta">Mi cuenta</Link>
      </nav>

      {/* Mapa de rutas */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/intereses" element={<Intereses />} />
        <Route path="/region" element={<Region />} />
        <Route path="/tema" element={<Tema />} />
        {/* Ejemplo con parámetro de URL para futuro detalle por id */}
        <Route path="/detalle/:id" element={<DetalleEvento />} />
        <Route path="/plan" element={<PlanViaje />} />
        <Route path="/cuenta" element={<Cuenta />} />
        {/* 404 simple: si luego quieres, agregamos una página NotFound */}
        <Route path="*" element={<main style={{ padding: '24px' }}>404</main>} />
      </Routes>
    </>
  )
}
