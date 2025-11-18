// src/pages/Ubicacion.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJSON, setJSON } from "../lib/storage";
import "../styles/pages/ubicacion.css";

const DEMO_USER_ID = "demo-user";
const STORAGE_KEY = `fm:ubicacion:${DEMO_USER_ID}`;

export default function Ubicacion() {
    const [estado, setEstado] = useState({
        permiso: null,     // true | false | null
        ciudad: "",
        lat: null,
        lng: null,
    });

    useEffect(() => {
        const saved = getJSON(STORAGE_KEY, null);
        if (saved) {
            setEstado((prev) => ({ ...prev, ...saved }));
        }
    }, []);

    function guardar(nuevo) {
        const merged = { ...estado, ...nuevo };
        setEstado(merged);
        setJSON(STORAGE_KEY, merged);
    }

    function manejarPermitir() {
        // Mock: fijamos una ciudad y coords de ejemplo
        guardar({
            permiso: true,
            ciudad: "Quito (simulado)",
            lat: -0.1807,
            lng: -78.4678,
        });
    }

    function manejarRechazar() {
        guardar({
            permiso: false,
            ciudad: "",
            lat: null,
            lng: null,
        });
    }

    return (
        <main className="page-ubicacion container">
            <header className="page-ubicacion__header">
                <h1>Permiso de ubicación</h1>
                <p>
                    FestiMap puede usar tu ubicación aproximada para mostrar eventos cercanos.
                    En esta versión se usa un valor simulado que se guarda en tu navegador.
                </p>
            </header>

            <section className="page-ubicacion__card">
                <h2>¿Permitir acceso a tu ubicación?</h2>

                <div className="page-ubicacion__actions">
                    <button className="btn btn--primary" onClick={manejarPermitir}>
                        Permitir
                    </button>
                    <button className="btn btn--ghost" onClick={manejarRechazar}>
                        No ahora
                    </button>
                </div>

                <div className="page-ubicacion__estado">
                    <h3>Estado actual</h3>
                    {estado.permiso === null && <p>No has respondido todavía.</p>}
                    {estado.permiso === false && <p>Ubicación desactivada para este usuario.</p>}
                    {estado.permiso === true && (
                        <>
                            <p>Ubicación activada.</p>
                            {estado.ciudad && <p>Ciudad estimada: {estado.ciudad}</p>}
                        </>
                    )}
                </div>
            </section>

            <footer className="page-ubicacion__footer">
                <Link className="btn btn--ghost" to="/home">
                    Volver a inicio
                </Link>
            </footer>
        </main>
    );
}
