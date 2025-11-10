import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Intereses from './pages/Intereses.jsx'
import Region from './pages/Region.jsx'
import Tema from './pages/Tema.jsx'
import DetalleEvento from './pages/DetalleEvento.jsx'
import PlanViaje from './pages/PlanViaje.jsx'
import Cuenta from './pages/Cuenta.jsx'

import './styles/reset.css'
import './styles/tokens.css'
import './styles/main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/intereses" element={<Intereses />} />
        <Route path="/region" element={<Region />} />
        <Route path="/tema" element={<Tema />} />
        <Route path="/evento/:id" element={<DetalleEvento />} />
        <Route path="/plan" element={<PlanViaje />} />
        <Route path="/cuenta" element={<Cuenta />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
