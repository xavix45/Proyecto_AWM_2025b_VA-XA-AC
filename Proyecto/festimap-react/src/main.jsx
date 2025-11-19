// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import BaseLayout from "./layouts/BaseLayout.jsx";

import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import DetalleEvento from "./pages/DetalleEvento.jsx";
import Agenda from "./pages/Agenda.jsx";
import AdminEstadisticas from "./pages/admin/AdminEstadisticas.jsx";
import Region from "./pages/Region.jsx";
import Tema from "./pages/Tema.jsx";
import Ubicacion from "./pages/Ubicacion.jsx";
import PlanViaje from "./pages/PlanViaje.jsx";
import AdminEventosListado from "./pages/admin/EventosListado.jsx";
import EventForm from "./pages/admin/EventForm.jsx";
import PermisoUbicacion from "./pages/PermisoUbicacion.jsx";
import Intereses from "./pages/Intereses.jsx";
import Cuenta from "./pages/Cuenta.jsx";
import Register from "./pages/Register.jsx";

import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/main.css";

const router = createBrowserRouter([
  // 1) Landing SIN BaseLayout
  { path: "/", element: <Landing /> },

  // 2) Login también sin BaseLayout (pantalla independiente)
  { path: "/login", element: <Login /> },
  // más adelante aquí puedes añadir /registro cuando tengas Registro.jsx

  // 3) Resto de la app con BaseLayout (barra superior, etc.)
  {
    element: <BaseLayout />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/login", element: <Login /> },
            { path: "/registro", element: <Register /> },
      { path: "/permiso-ubicacion", element: <PermisoUbicacion /> },
      { path: "/intereses", element: <Intereses /> },
      { path: "/cuenta", element: <Cuenta /> },
      { path: "/agenda", element: <Agenda /> },
      { path: "/region", element: <Region /> },
      { path: "/tema", element: <Tema /> },
      { path: "/ubicacion", element: <Ubicacion /> },
      { path: "/plan", element: <PlanViaje /> },
      { path: "/admin", element: <AdminEventosListado /> },
      { path: "/admin/evento", element: <EventForm /> },
      { path: "/admin/evento/:id", element: <EventForm /> },
      { path: "/evento/:id", element: <DetalleEvento /> },
      { path: "/admin/estadisticas", element: <AdminEstadisticas /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
