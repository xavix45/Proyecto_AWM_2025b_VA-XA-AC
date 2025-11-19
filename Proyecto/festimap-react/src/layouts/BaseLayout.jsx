// src/layouts/BaseLayout.jsx
import { Outlet, NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/reset.css";
import "../styles/tokens.css";
import "../styles/main.css";

function getStoredUser() {
    try {
        // Compatibilidad con implementaciones anteriores
        const raw = localStorage.getItem("festi_usuario");
        if (raw) return JSON.parse(raw);

        // Flujo actual: login guarda 'currentUserEmail' y usuarios en 'usuarios'
        const email = localStorage.getItem('currentUserEmail');
        if (!email) return null;

        const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
        const usuario = usuarios.find(u => u.email === email);
        if (usuario) return usuario;

        // Usuarios hardcode (por ejemplo el admin del proyecto)
        if (email === 'admin@epn.edu.ec') {
            return { nombre: 'Administrador', email, rol: 'admin' };
        }

        // Si encontramos un email en currentUserEmail pero no está en 'usuarios',
        // asumimos que es un usuario registrado vía el formulario hardcodeado
        // o un usuario conocido; devolvemos un objeto básico para mostrar el header.
        return { nombre: email.split('@')[0] || email, email, rol: 'user' };
    } catch {
        return null;
    }
}

export default function BaseLayout() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const update = () => setUser(getStoredUser());
        // Inicial
        update();
        // Escuchar cambios broadcast (login/logout)
        window.addEventListener('userChanged', update);
        // También escuchar storage (útil si otra pestaña hace login)
        window.addEventListener('storage', update);
        return () => {
            window.removeEventListener('userChanged', update);
            window.removeEventListener('storage', update);
        };
    }, []);

    const isAdmin = user?.rol === "admin";

    return (
        <>
            <header className="site-header">
                <nav className="container">
                    <ul className="nav" style={{ display: "flex", gap: 16, listStyle: "none", padding: 0 }}>
                        <li><NavLink to="/" end>Mapa de festivales</NavLink></li>
                        <li><NavLink to="/home">Inicio</NavLink></li>
                        <li><NavLink to="/region">Región</NavLink></li>
                        <li><NavLink to="/agenda">Agenda</NavLink></li>
                        <li><NavLink to="/tema">Tema</NavLink></li>
                        <li><NavLink to="/ubicacion">Ubicación</NavLink></li>
                        <li><NavLink to="/plan">PlanViaje</NavLink></li>
                        {isAdmin && (
                            <li><NavLink to="/admin">AdminEventosListado</NavLink></li>
                        )}

                        {/* Zona usuario */}
                        {user ? (
                            <>
                                <li>
                                    <Link to="/cuenta">Mi cuenta</Link>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem("festi_usuario");
                                            localStorage.removeItem('currentUserEmail');
                                            // Forzar recarga para actualizar el header
                                            window.location.href = "/login";
                                        }}
                                    >
                                        Salir
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li><NavLink to="/login">Ingresar</NavLink></li>
                        )}
                    </ul>
                </nav>
            </header>

            <Outlet />

            <footer className="site-footer">
                <div className="container">© 2025 FestiMap Ecuador</div>
            </footer>
        </>
    );
}
