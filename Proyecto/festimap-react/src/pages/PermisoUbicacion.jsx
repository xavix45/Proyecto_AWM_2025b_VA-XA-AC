import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/permiso-ubicacion.css";

export default function PermisoUbicacion() {
  const navigate = useNavigate();

  useEffect(() => {
    // si no hay usuario actual, redirigir a login
    const email = localStorage.getItem('currentUserEmail');
    if (!email) navigate('/login');
  }, [navigate]);

  function guardarPreferenciaUbicacion(permisoConcedido) {
    const emailUsuarioActual = localStorage.getItem('currentUserEmail');
    if (!emailUsuarioActual) return;

    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const index = usuarios.findIndex(u => u.email === emailUsuarioActual);

    if (index !== -1) {
      usuarios[index].permisoUbicacion = permisoConcedido;
    } else {
      // Si no existe en usuarios registrados, añadimos un registro mínimo
      usuarios.push({ email: emailUsuarioActual, permisoUbicacion: permisoConcedido });
    }

    localStorage.setItem('usuarios', JSON.stringify(usuarios));
  }

  function onPermitir(e) {
    e.preventDefault();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Guardamos preferencia y las coordenadas si quieres
          guardarPreferenciaUbicacion(true);
          localStorage.setItem('lastCoords', JSON.stringify({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }));
          navigate('/intereses');
        },
        (error) => {
          console.warn('Error geolocalización:', error.message);
          guardarPreferenciaUbicacion(false);
          navigate('/intereses');
        }
      );
    } else {
        alert('Tu navegador no soporta geolocalización.');
        guardarPreferenciaUbicacion(false);
        navigate('/intereses');
    }
  }

  function onMasTarde(e) {
    e.preventDefault();
    guardarPreferenciaUbicacion(false);
    navigate('/home');
  }

  return (
    <main className="container section-narrow center">
      <h2 className="page-title">Activa tu ubicación</h2>
      <p className="muted">Para mostrarte “Hoy y cerca de ti”, necesitamos tu ubicación aproximada.</p>

      <div className="form__row form__row--center" style={{ marginTop: 18 }}>
        <button className="btn btn--primary" onClick={onPermitir}>Permitir</button>
        <button className="btn btn--ghost" onClick={onMasTarde}>Más tarde</button>
      </div>
    </main>
  );
}
