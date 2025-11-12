import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import BaseLayout from "./layouts/BaseLayout.jsx";

import Landing from "./pages/Landing.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import DetalleEvento from "./pages/DetalleEvento.jsx";

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
      { path: "/evento/:id", element: <DetalleEvento /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
