// src/pages/Home.jsx
import { useEffect, useState } from "react";
import EVENTOS from "../data/eventos.js"; // si usaste export default
// o: import { USUARIOS } from "../data/usuarios.js";

export default function Home() {
  const [destacados, setDestacados] = useState([]);

  useEffect(() => {
    // ejemplo: tomar 6 primeros
    setDestacados(EVENTOS.slice(0, 6));
  }, []);

  return (
    <main className="home container">
      <h1>Hogar</h1>
      <section className="grid">
        {destacados.map(ev => (
          <article key={ev.id} className="card">
            <h3>{ev.titulo}</h3>
            <p>{ev.ciudad} · {ev.fecha}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
