// src/App.jsx
import { useEffect, useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";

import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/main.css";
import "./styles/layout/header.css";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("festi_usuario");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const isAdmin = user?.rol === "admin";

  return (
    <>
      <header className="fm-header">
        <div className="fm-header__inner">
          {/* Marca */}
          <Link to="/home" className="fm-header__brand">
            <div className="fm-header__logo" aria-hidden="true">
              FM
            </div>
            <span className="fm-header__title">FestiMap Ecuador</span>
          </Link>

          {/* Navegación principal */}
          <nav className="fm-header__nav" aria-label="Principal">
            <NavLink
              to="/mapa"
              className={({ isActive }) =>
                "fm-header__link" + (isActive ? " fm-header__link--active" : "")
              }
            >
              Mapa de festivales
            </NavLink>

            <NavLink
              to="/home"
              className={({ isActive }) =>
                "fm-header__link" + (isActive ? " fm-header__link--active" : "")
              }
            >
              Inicio
            </NavLink>

            <NavLink
              to="/region"
              className={({ isActive }) =>
                "fm-header__link" + (isActive ? " fm-header__link--active" : "")
              }
            >
              Región
            </NavLink>

            <NavLink
              to="/agenda"
              className={({ isActive }) =>
                "fm-header__link" + (isActive ? " fm-header__link--active" : "")
              }
            >
              Agenda
            </NavLink>

            <NavLink
              to="/tema"
              className={({ isActive }) =>
                "fm-header__link" + (isActive ? " fm-header__link--active" : "")
              }
            >
              Tema
            </NavLink>

            <NavLink
              to="/ubicacion"
              className={({ isActive }) =>
                "fm-header__link" + (isActive ? " fm-header__link--active" : "")
              }
            >
              Ubicación
            </NavLink>

            <NavLink
              to="/plan-viaje"
              className={({ isActive }) =>
                "fm-header__link" + (isActive ? " fm-header__link--active" : "")
              }
            >
              Plan de viaje
            </NavLink>

            {/* Solo si es admin se ve el menú de administración */}
            {isAdmin && (
              <NavLink
                to="/admin/eventos"
                className={({ isActive }) =>
                  "fm-header__link fm-header__link--admin" +
                  (isActive ? " fm-header__link--active" : "")
                }
              >
                Admin eventos
              </NavLink>
            )}
          </nav>

          {/* Zona usuario / login */}
          <div className="fm-header__user">
            {user ? (
              <>
                <div className="fm-header__avatar">
                  {(user.nombre && user.nombre[0]) || "U"}
                </div>
                <div className="fm-header__user-info">
                  <span className="fm-header__user-name">{user.nombre}</span>
                  <span className="fm-header__user-role">
                    {isAdmin ? "Administrador" : "Viajero"}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--xs"
                  onClick={() => {
                    localStorage.removeItem("festi_usuario");
                    window.location.href = "/login";
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn--primary">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="fm-main">
        <Outlet />
      </main>

      <footer className="fm-footer">
        <small>© 2025 FestiMap Ecuador</small>
      </footer>
    </>
  );
}
