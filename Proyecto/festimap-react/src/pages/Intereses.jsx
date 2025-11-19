import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/intereses.css";

const LS_USUARIOS_KEY = "usuarios";
const LS_CURRENT_USER_KEY = "currentUserEmail";

function getIntereses() {
  try {
    const email = localStorage.getItem(LS_CURRENT_USER_KEY);
    if (!email) return { tags: [], edad: 30 };
    const usuarios = JSON.parse(localStorage.getItem(LS_USUARIOS_KEY) || "[]");
    const usuario = usuarios.find(u => u.email === email);
    return usuario?.intereses || { tags: [], edad: 30 };
  } catch {
    return { tags: [], edad: 30 };
  }
}

function saveIntereses(data) {
  try {
    const email = localStorage.getItem(LS_CURRENT_USER_KEY);
    if (!email) {
      alert("Error: no has iniciado sesión.");
      return false;
    }

    let usuarios = JSON.parse(localStorage.getItem(LS_USUARIOS_KEY) || "[]");
    const idx = usuarios.findIndex(u => u.email === email);
    if (idx !== -1) {
      usuarios[idx].intereses = data;
    } else {
      usuarios.push({ email, intereses: data });
    }
    localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(usuarios));
    console.log("Intereses guardados para:", email, data);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export default function Intereses() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(new Set());
  const [edad, setEdad] = useState(30);

  useEffect(() => {
    const saved = getIntereses();
    setSelected(new Set(saved.tags || []));
    setEdad(saved.edad || 30);
  }, []);

  function toggleTag(value) {
    setSelected(prev => {
      const copy = new Set(prev);
      if (copy.has(value)) copy.delete(value);
      else copy.add(value);
      return copy;
    });
  }

  function handleSave() {
    const data = { tags: Array.from(selected), edad: Number(edad) };
    const ok = saveIntereses(data);
    if (ok) {
      alert("Intereses guardados correctamente ✅");
      navigate('/home');
    }
  }

  function handleClear() {
    setSelected(new Set());
    setEdad(30);
    saveIntereses({ tags: [], edad: 30 });
  }

  // helper to render check input with controlled behaviour
  const Checkbox = ({ value, label }) => (
    <label>
      <input
        type="checkbox"
        value={value}
        checked={selected.has(value)}
        onChange={() => toggleTag(value)}
      />
      {label}
    </label>
  );

  return (
    <main className="page-intereses">
      <h2 className="page-title">Cuéntanos tus intereses culturales</h2>
      <p className="page-subtitle">Elige los temas que más te gustan. Usaremos esta información para sugerirte festividades y eventos que se ajusten a tu estilo de viaje.</p>

      <section className="chips-grid" aria-label="Intereses culturales">
        <details className="chip">
          <summary><span className="chip__icon">🎉</span><span>Fiestas y tradiciones</span></summary>
          <div className="subchips">
            <Checkbox value="fiestas_quito" label="Fiestas de Quito / desfiles cívicos" />
            <Checkbox value="mama_negra" label="Mama Negra y fiestas de Cotopaxi" />
            <Checkbox value="carnaval" label="Carnavales y comparsas" />
            <Checkbox value="anoviejo" label="Año Viejo y quema de monigotes" />
          </div>
        </details>

        <details className="chip">
          <summary><span className="chip__icon">🍲</span><span>Sabores y gastronomía</span></summary>
          <div className="subchips">
            <Checkbox value="colada_morada" label="Colada morada y guaguas de pan" />
            <Checkbox value="ferias_gastro" label="Ferias gastronómicas y festivales de comida" />
            <Checkbox value="cacao_chocolate" label="Rutas del cacao y chocolate" />
            <Checkbox value="comida_tipica" label="Comidas típicas de sierra y costa" />
          </div>
        </details>

        <details className="chip">
          <summary><span className="chip__icon">🎶</span><span>Música y danza</span></summary>
          <div className="subchips">
            <Checkbox value="bandas_pueblo" label="Bandas de pueblo y comparsas" />
            <Checkbox value="folklore" label="Danzas folklóricas" />
            <Checkbox value="fusion_moderno" label="Fusión tradicional + música moderna" />
          </div>
        </details>

        <details className="chip">
          <summary><span className="chip__icon">🌿</span><span>Naturaleza y comunidad</span></summary>
          <div className="subchips">
            <Checkbox value="caminatas" label="Caminatas, cascadas y rutas verdes" />
            <Checkbox value="comunidades" label="Visitas a comunidades indígenas" />
            <Checkbox value="artesania" label="Artesanías y mercados locales" />
          </div>
        </details>

        <details className="chip">
          <summary><span className="chip__icon">👨‍👩‍👧</span><span>Planes en familia</span></summary>
          <div className="subchips">
            <Checkbox value="ninos" label="Actividades para niños" />
            <Checkbox value="petfriendly" label="Lugares pet-friendly" />
            <Checkbox value="seguro" label="Lugares tranquilos / seguros" />
          </div>
        </details>
      </section>

      <section className="age-block">
        <label className="age-label" htmlFor="age-range">Rango de edad del grupo viajero (promedio)</label>
        <div className="age-legend">
          <span>18</span>
          <span>25</span>
          <span>35</span>
          <span>45</span>
          <span>55</span>
          <span>65+</span>
        </div>

        <input id="age-range" className="age-range" type="range" min="18" max="70" step="1" value={edad} onChange={e => setEdad(e.target.value)} list="age-ticks" />

        <datalist id="age-ticks">
          <option value="18"></option>
          <option value="25"></option>
          <option value="35"></option>
          <option value="45"></option>
          <option value="55"></option>
          <option value="65"></option>
        </datalist>

        <p id="age-output" className="muted center" style={{ marginTop: 8 }}>
          Edad promedio seleccionada: <strong>{edad}</strong> años
        </p>
      </section>

      <div className="actions">
        <button id="btn-save-interests" className="btn--primary" type="button" onClick={handleSave}>Guardar intereses</button>
        <button id="btn-clear-interests" className="btn--ghost" type="button" onClick={handleClear}>Limpiar selección</button>
      </div>

      <p className="muted center">Puedes cambiar tus intereses cuando quieras. Más adelante los usaremos para sugerirte rutas y festividades personalizadas.</p>
    </main>
  );
}
