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
import Region from "./pages/Region.jsx";   // <- nuevo
import Tema from "./pages/Tema.jsx";   // <- nuevo
import Ubicacion from "./pages/Ubicacion.jsx";   // <- nuevo
import PlanViaje from "./pages/PlanViaje.jsx";
import AdminEventosListado from "./pages/admin/EventosListado.jsx";

import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/main.css";


const router = createBrowserRouter([
  {
    element: <BaseLayout />,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/home", element: <Home /> },
      { path: "/login", element: <Login /> },
      { path: "/agenda", element: <Agenda /> },
      { path: "/region", element: <Region /> },          // <- nueva ruta
      { path: "/tema", element: <Tema /> },            // <- nuevo
      { path: "/ubicacion", element: <Ubicacion /> },   // <- nuevo
      { path: "/plan", element: <PlanViaje /> },
      { path: "/admin", element: <AdminEventosListado /> },
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
