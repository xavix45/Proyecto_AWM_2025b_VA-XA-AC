import { Outlet, NavLink } from "react-router-dom";
import "../styles/reset.css";
import "../styles/tokens.css";
import "../styles/main.css";

export default function BaseLayout() {
    return (
        <>
            <header className="site-header">
                <nav className="container">
                    <ul className="nav" style={{ display: "flex", gap: 16, listStyle: "none", padding: 0 }}>
                        <li><NavLink to="/" end>Mapa de festivales</NavLink></li>
                        <li><NavLink to="/home">Inicio</NavLink></li>
                        <li><NavLink to="/agenda">Agenda</NavLink></li>   {/* <-- nuevo */}
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
