// src/layouts/BaseLayout.jsx
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/reset.css";
import "../styles/tokens.css";
import "../styles/main.css";
import "../styles/components/_header.css";

function getStoredUser() {
    try {
        const u = localStorage.getItem('festi_usuario');
        if (u) return JSON.parse(u);
    } catch (e) {}
    // fallback to currentUserEmail (legacy)
    const email = localStorage.getItem('currentUserEmail');
    if (email) return { email };
    return null;
}

export default function BaseLayout() {
    const navigate = useNavigate();
    const [user, setUser] = useState(getStoredUser());
    const location = useLocation();

    useEffect(() => {
        function onUserChanged() { setUser(getStoredUser()); }
        window.addEventListener('userChanged', onUserChanged);
        return () => window.removeEventListener('userChanged', onUserChanged);
    }, []);

  

    const isAdmin = user && (user.rol === 'admin' || (user.email && user.email === 'admin@epn.edu.ec'));

    function handleLogout() {
        localStorage.removeItem('festi_usuario');
        localStorage.removeItem('currentUserEmail');
        try { window.dispatchEvent(new Event('userChanged')); } catch (e) {}
        setUser(null);
        // Redirect to landing (root) when logging out
        navigate('/');
    }

  

    return (
        <>
            {/* Hide header on registration page */}
            {location && location.pathname !== '/registro' && (
                <header className="site-header">
                    <div className="container header-inner">
                        <div className="site-logo" aria-hidden="true">FestiMap</div>

                        <nav className="main-nav" aria-label="Main navigation">
                            <ul className="nav-list">
                                <li><NavLink to="/home">Inicio</NavLink></li>
                                <li><NavLink to="/region">Región</NavLink></li>
                                <li><NavLink to="/agenda">Agenda</NavLink></li>
                                <li><NavLink to="/tema">Tema</NavLink></li>
                                <li><NavLink to="/plan">Plan de viaje</NavLink></li>
                            </ul>
                        </nav>

                        <div className="user-area">
                            {isAdmin && (
                                <div className="nav-admin">
                                    <button className="btn btn--ghost">Admin</button>
                                    <ul className="admin-submenu" aria-label="Admin menu">
                                        <li><NavLink to="/admin">Eventos (Listado)</NavLink></li>
                                        <li><NavLink to="/admin/evento/nuevo">Crear evento</NavLink></li>
                                        <li><NavLink to="/admin/estadisticas">Estadísticas</NavLink></li>
                                    </ul>
                                </div>
                            )}

                            {user ? (
                                <>
                                    <NavLink className="user-link" to="/cuenta">Mi cuenta</NavLink>
                                    <button className="btn-logout" onClick={handleLogout}>Salir</button>
                                </>
                            ) : (
                                <NavLink className="login-link" to="/login">Ingresar</NavLink>
                            )}

                            {/* Tema toggle removed per user request */}
                        </div>
                    </div>
                </header>
            )}

            <Outlet />

            <footer className="site-footer">
                <div className="container">© 2025 FestiMap Ecuador</div>
            </footer>
        </>
    );
}
