// src/layouts/BaseLayout.jsx
import { Outlet, NavLink } from "react-router-dom";
import "../styles/reset.css";
import "../styles/tokens.css";
import "../styles/main.css";

export default function BaseLayout() {
    return (
        <>
            <header className="site-header">
                <nav className="container">
                    <ul className="nav">
                        <li><NavLink to="/" end>FestiMap</NavLink></li>
                        <li><NavLink to="/home">Inicio</NavLink></li>
                        <li><NavLink to="/login">Ingresar</NavLink></li>
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
