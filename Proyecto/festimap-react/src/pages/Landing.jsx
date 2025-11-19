// src/pages/Landing.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { list as listEventos } from "../services/eventos.service";
import "../styles/pages/landing.css";

export default function Landing() {
  // Ponemos / quitamos la clase en el body para el modo oscuro de bienvenida
  useEffect(() => {
    document.body.classList.add("modo-oscuro-bienvenida");
    return () => {
      document.body.classList.remove("modo-oscuro-bienvenida");
    };
  }, []);

  // Tomamos algunos eventos de la data como “de temporada”
  const destacados = listEventos().slice(0, 5);

  return (
    <>
      {/* HEADER SIMPLE (sin menú de navegación) */}
      <header className="site-header">
        <nav className="nav container">
          <strong className="logo">FestiMap Ecuador</strong>
          <div className="nav-actions">
            <Link to="/login" className="btn-login">
              Inicio de sesión
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO CON VIDEO */}
        <section className="hero">
          <video
            className="hero__video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/intro2.mp4" type="video/mp4" />
          </video>

          <div className="hero__content">
            <h1>Explora, vive y comparte — Descubre Ecuador</h1>
            <p>
              Encuentra festividades cerca de ti, arma rutas culturales y crea tu
              itinerario.
            </p>

            <div className="hero__buttons">
              {/* Crear cuenta → registro (cuando tengas la ruta) */}
              <Link to="/registro" className="btn btn-primary">
                Crear cuenta gratuita
              </Link>

              {/* Scroll a sección “servicios” */}
              <a href="#servicios" className="btn btn-secondary">
                Cómo funciona
              </a>
            </div>
          </div>
        </section>

        {/* FESTIVIDADES DE TEMPORADA (usando tu data) */}
        <section className="section temporada">
          <div className="container">
            <h2>
              Festividades <strong>de temporada</strong>
            </h2>

            <div className="cards">
              {destacados.map((ev) => {
                const titulo =
                  ev.titulo || ev.nombre || ev.ciudad || "Evento cultural";

                const imgSrc = ev.imagen
                  ? ev.imagen.startsWith("http")
                    ? ev.imagen
                    : `/images/${ev.imagen}`
                  : "/images/placeholder.jpg";

                return (
                  <article key={ev.id} className="card">
                    <img src={imgSrc} alt={titulo} />
                    <div className="card__overlay"></div>
                    <div className="card__content">
                      <h3>{titulo}</h3>

                      {/* Igual que tu HTML: si no hay sesión, todo lleva a login */}
                      <Link to="/login" className="btn btn-ghost">
                        Ver más
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECCIÓN “¿Qué podemos hacer juntos?” */}
        <section id="servicios" className="section servicios">
          <div className="container">
            <h2>¿Qué podemos hacer juntos?</h2>

            <div className="features">
              <article className="feature">
                <div className="feature__icon">📍</div>
                <div className="feature__text">
                  <span className="chip">Eventos cerca de ti</span>
                  <h3>Hoy y esta semana</h3>
                  <p>
                    Filtra por región, tipo y fecha. Mira el mapa, abre detalles
                    y llega sin perderte.
                  </p>
                </div>
              </article>

              <article className="feature">
                <div className="feature__icon">🧭</div>
                <div className="feature__text">
                  <span className="chip">Plan de viaje</span>
                  <h3>Traza tu recorrido</h3>
                  <p>
                    Crea un plan A→B con paradas recomendadas y guarda tus
                    favoritos.
                  </p>
                </div>
              </article>

              <article className="feature">
                <div className="feature__icon">🗓️</div>
                <div className="feature__text">
                  <span className="chip">Agenda e itinerario</span>
                  <h3>Recibe alertas y guarda</h3>
                  <p>
                    Confirma asistencia, agrega recordatorios y comenta para
                    otros viajeros.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER COMO EL ANTIGUO INDEX */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <div className="footer-logo">FM</div>
            <p className="muted">
              Guía de festividades y rutas culturales de Ecuador.
            </p>
          </div>

          <div>
            <h4>Más de Ecuador</h4>
            <ul>
              <li>
                <a href="#">Costa</a>
              </li>
              <li>
                <a href="#">Sierra</a>
              </li>
              <li>
                <a href="#">Amazonía</a>
              </li>
              <li>
                <a href="#">Galápagos</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Enlaces</h4>
            <ul>
              <li>
                <a href="#">Acerca de</a>
              </li>
              <li>
                <a href="#">Contacto</a>
              </li>
              <li>
                <a href="#">Términos</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">© 2025 FestiMap Ecuador</div>
        </div>
      </footer>
    </>
  );
}