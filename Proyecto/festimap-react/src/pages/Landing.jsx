import { Link } from "react-router-dom";
import "../styles/pages/landing.css";

export default function Landing() {
  return (
    <main className="bienvenida">
      <section className="hero">
        <video className="hero__video" src="/intro2.mp4" autoPlay muted loop playsInline />
        <div className="hero__overlay">
          <h1 className="hero__title">FestiMap Ecuador</h1>
          <p className="hero__subtitle">Descubrimos eventos y rutas culturales por todo el país.</p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to="/home">Explorar ahora</Link>
            <Link className="btn btn--ghost" to="/login">Iniciar sesión</Link>
          </div>
        </div>
      </section>
    </main>
  );
}