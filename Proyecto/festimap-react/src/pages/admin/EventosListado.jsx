// src/pages/admin/EventosListado.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { list as listEventos } from "../../services/eventos.service";
import "../../styles/pages/admin/eventos-listado.css";

const EVENTOS_TODOS = listEventos();

export default function AdminEventosListado() {
    const [q, setQ] = useState("");
    const [tema, setTema] = useState("");

    const temas = useMemo(
        () =>
            Array.from(
                new Set(
                    EVENTOS_TODOS
                        .map((e) => e.tema || e.categoria)
                        .filter(Boolean)
                )
            ).sort(),
        []
    );

    const filtrados = useMemo(() => {
        return EVENTOS_TODOS.filter((e) => {
            const matchTema =
                !tema ||
                String(e.tema || e.categoria || "")
                    .toLowerCase() === tema.toLowerCase();

            if (!matchTema) return false;

            if (!q) return true;

            const texto = [
                e.titulo,
                e.nombre,
                e.ciudad,
                e.region,
                e.tema,
                e.categoria,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return texto.includes(q.toLowerCase());
        });
    }, [q, tema]);

    return (
        <main className="admin-eventos container">
            <header className="admin-eventos__header">
                <h1>Administrar eventos</h1>
                <p>Listado de eventos cargados en el sistema.</p>

                <div className="admin-eventos__toolbar">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, ciudad..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    <select value={tema} onChange={(e) => setTema(e.target.value)}>
                        <option value="">Todos los temas</option>
                        {temas.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>

                    <Link className="btn btn--primary" to="/admin/evento/nuevo">
                        Nuevo evento
                    </Link>
                </div>
            </header>

            <section className="admin-eventos__table-wrapper">
                <table className="admin-eventos__table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Título</th>
                            <th>Ciudad</th>
                            <th>Fecha</th>
                            <th>Tema</th>
                            <th>Región</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((e) => (
                            <tr key={e.id}>
                                <td>{e.id}</td>
                                <td>{e.titulo || e.nombre}</td>
                                <td>{e.ciudad}</td>
                                <td>{e.fecha}</td>
                                <td>{e.tema || e.categoria}</td>
                                <td>{e.region}</td>
                                <td className="admin-eventos__actions">
                                    <Link
                                        className="btn btn--ghost btn--sm"
                                        to={`/admin/evento/${e.id}`}
                                    >
                                        Editar
                                    </Link>
                                    <button
                                        className="btn btn--danger btn--sm"
                                        type="button"
                                        onClick={() => {
                                            alert(
                                                "Eliminar se implementará cuando esté listo el servicio admin."
                                            );
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan="7" className="admin-eventos__empty">
                                    No hay eventos que coincidan con los filtros actuales.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <footer className="admin-eventos__footer">
                <Link className="btn btn--ghost" to="/admin/estadisticas">
                    Ver estadísticas
                </Link>
                <Link className="btn btn--ghost" to="/home">
                    Volver a inicio
                </Link>
            </footer>
        </main>
    );
}
