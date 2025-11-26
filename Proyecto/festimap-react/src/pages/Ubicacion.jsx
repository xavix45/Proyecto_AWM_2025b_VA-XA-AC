// src/pages/Ubicacion.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getJSON, setJSON } from "../lib/storage";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/pages/ubicacion.css";

const DEMO_USER_ID = "demo-user";
const STORAGE_KEY = `fm:ubicacion:${DEMO_USER_ID}`;

export default function Ubicacion() {
    const navigate = useNavigate();

    const [estado, setEstado] = useState({
        permiso: null, // true | false | null
        ciudad: "",
        lat: null,
        lng: null,
    });
    const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

    // Cargamos preferencia guardada (si existe)
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
        if (!("geolocation" in navigator)) {
            setModal({
                show: true,
                title: '❌ Geolocalización No Disponible',
                message: 'Tu navegador no soporta la geolocalización.',
                type: 'danger',
                onConfirm: () => {
                    setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null });
                    guardar({
                        permiso: false,
                        ciudad: "",
                        lat: null,
                        lng: null,
                    });
                    navigate("/home");
                }
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                guardar({
                    permiso: true,
                    ciudad: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
                    lat: latitude,
                    lng: longitude,
                });

                // En el proyecto original iba a intereses.html.
                // Aquí lo mandamos a Home (puedes cambiar a otra ruta si luego creas "intereses").
                navigate("/home");
            },
            (error) => {
                console.warn("Error al obtener ubicación:", error.message);
                guardar({
                    permiso: false,
                    ciudad: "",
                    lat: null,
                    lng: null,
                });
                navigate("/home");
            }
        );
    }

    function manejarMasTarde() {
        guardar({
            permiso: false,
            ciudad: "",
            lat: null,
            lng: null,
        });
        navigate("/home");
    }

    return (
        <main className="page-ubicacion container">
            <header className="page-ubicacion__header">
                <h1>Activa tu ubicación</h1>
                <p>
                    Para mostrarte <strong>“Hoy y cerca de ti”</strong>, necesitamos tu
                    ubicación aproximada. Tus datos se guardan solo en este navegador
                    (modo demo).
                </p>
            </header>

            <section className="page-ubicacion__card">
                <h2>¿Permitir acceso a tu ubicación?</h2>

                <div className="page-ubicacion__actions">
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={manejarPermitir}
                    >
                        Permitir
                    </button>
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={manejarMasTarde}
                    >
                        Más tarde
                    </button>
                </div>

                <div className="page-ubicacion__estado">
                    <h3>Estado actual</h3>
                    {estado.permiso === null && (
                        <p>No has respondido todavía a la solicitud de ubicación.</p>
                    )}
                    {estado.permiso === false && (
                        <p>Ubicación desactivada para este usuario (demo).</p>
                    )}
                    {estado.permiso === true && (
                        <>
                            <p>Ubicación activada.</p>
                            {estado.ciudad && <p>Referencia: {estado.ciudad}</p>}
                        </>
                    )}
                </div>
            </section>

            <footer className="page-ubicacion__footer">
                <Link className="btn btn--ghost" to="/home">
                    Volver al mapa
                </Link>
            </footer>

            {modal.show && (
                <ConfirmModal
                    show={modal.show}
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                    onConfirm={modal.onConfirm}
                    onCancel={() => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })}
                />
            )}
        </main>
    );
}
