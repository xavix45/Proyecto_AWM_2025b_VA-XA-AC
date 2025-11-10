// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import "../styles/pages/landing.css";

export default function Landing() {
  return (
    <main className="bienvenida">
      {/* Hero con video de fondo */}
      <section className="hero">
        <video
          className="hero__video"
          src="/intro2.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="hero__overlay">
          <h1 className="hero__title">FestiMap Ecuador</h1>
          <p className="hero__subtitle">
            Descubrimos eventos y rutas culturales por todo el país.
          </p>

          {/* Botones de acción inicial */}
          <div className="hero__actions">
            <Link className="btn btn--primary" to="/home">Explorar ahora</Link>
            <Link className="btn btn--ghost" to="/login">Iniciar sesión</Link>
          </div>
        </div>
      </section>

      {/* Secciones “placeholders” que puedes rellenar con tu HTML original */}
      <section className="temporada section">
        <h2>Temporadas destacadas</h2>
        {/* Pega aquí las tarjetas/figuras que tienes en index.html */}
      </section>

      <section className="servicios section">
        <h2>Planifica tu viaje</h2>
        {/* Pega aquí tu bloque de “plan-de-viaje” si existía en index.html */}
      </section>
    </main>
  );
}
