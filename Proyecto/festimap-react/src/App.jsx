import { Outlet } from "react-router-dom";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/main.css";

export default function App() {
  return (
    <>
      <header className="fm-header">
        <nav className="fm-nav">
          <a className="brand" href="/">FestiMap</a>
          <a href="/home">Inicio</a>
          <a href="/login">Ingresar</a>
        </nav>
      </header>

      <Outlet />

      <footer className="fm-footer">
        <small>© 2025 FestiMap Ecuador</small>
      </footer>
    </>
  );
}
