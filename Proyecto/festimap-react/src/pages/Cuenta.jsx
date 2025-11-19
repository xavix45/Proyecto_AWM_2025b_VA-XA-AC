import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/cuenta.css";

const LS_USUARIOS_KEY = 'usuarios';
const LS_CURRENT_USER_KEY = 'currentUserEmail';

export default function Cuenta() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [indexUser, setIndexUser] = useState(-1);
  const [usuarios, setUsuarios] = useState([]);
  const DEFAULT_NOTIFS = { alerta24h: false, alerta1h: false, cambios: false, cercanos: false };
  const [notificaciones, setNotificaciones] = useState(DEFAULT_NOTIFS);

  useEffect(() => {
    const email = localStorage.getItem(LS_CURRENT_USER_KEY);
    if (!email) {
      alert('Debes iniciar sesión para ver tu cuenta.');
      navigate('/login');
      return;
    }

    const all = JSON.parse(localStorage.getItem(LS_USUARIOS_KEY) || '[]');
    let idx = all.findIndex(u => u.email === email);

    // Si el usuario no existe en 'usuarios' (por ejemplo usuarios hardcode),
    // creamos un perfil mínimo y lo guardamos para que la página de cuenta funcione.
    if (idx === -1) {
      const nombre = email.split('@')[0] || email;
      const nuevo = {
        nombre,
        email,
        preferencias: {},
        intereses: { tags: [] },
        notificaciones: { alerta24h: false, alerta1h: false, cambios: false, cercanos: false },
      };
      all.push(nuevo);
      localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(all));
      idx = all.length - 1;
    }

    setUsuarios(all);
    setIndexUser(idx);
    setCurrentUser(all[idx]);
    setNotificaciones(all[idx].notificaciones || DEFAULT_NOTIFS);
  }, [navigate]);
  // Toggle handler using a dedicated state slice for notifications
  function setupNotifToggle(field) {
    return (e) => {
      e?.preventDefault?.();
      const newVal = !notificaciones[field];
      const updated = { ...notificaciones, [field]: newVal };
      setNotificaciones(updated);

      // Also update currentUser in memory and persist to localStorage
      setCurrentUser(prev => {
        const copy = { ...(prev || {}) };
        copy.notificaciones = updated;
        try {
          const all = JSON.parse(localStorage.getItem(LS_USUARIOS_KEY) || '[]');
          const idx = all.findIndex(u => u.email === copy.email);
          if (idx !== -1) {
            all[idx] = copy;
            localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(all));
            setUsuarios(all);
            setIndexUser(idx);
            console.log('[Cuenta] persisted notificaciones:', all[idx].notificaciones);
          }
        } catch (err) {
          console.error('[Cuenta] error persisting notifs', err);
        }
        return copy;
      });
    };
  }

  function handleGuardar() {
    if (!currentUser || indexUser === -1) return;
    const copyUsuarios = [...usuarios];
    copyUsuarios[indexUser] = currentUser;
    localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(copyUsuarios));
    setUsuarios(copyUsuarios);
    alert('¡Cambios guardados con éxito!');
    navigate('/home');
  }

  function handleLogout() {
    if (confirm('¿Deseas guardar los cambios antes de salir?')) {
      handleGuardar();
      // handleGuardar redirects to /home, but we want to logout
    }
    localStorage.removeItem(LS_CURRENT_USER_KEY);
    window.location.href = '/';
  }

  if (!currentUser) return null;

  return (
    <main className="container section">
      <h2 className="page-title">Mi cuenta / Perfil</h2>

      <div className="grid-perfil">
        <aside className="panel-usuario">
          <h3>Usuario registrado</h3>
          <p><strong>Nombre:</strong> <span id="user-name">{currentUser.nombre}</span></p>
          <p><strong>Email:</strong> <span id="user-email">{currentUser.email}</span></p>
          <p className="muted" id="user-location">{currentUser.permisoUbicacion ? 'Ubicación: Permiso activo' : 'Ubicación: (no especificada)'}</p>
          <button type="button" className="btn btn--ghost btn--full-width" id="btn-editar" onClick={() => navigate('/permiso-ubicacion')}>Editar</button>
        </aside>

        <div className="panel-ajustes">
          <section className="form-section">
            <h3 className="section-title-sm">Preferencias</h3>
            <div className="form-grid-3">
              <label className="form__label">Región base
                <select className="input" id="select-region" value={(currentUser.preferencias && currentUser.preferencias.region) || 'ninguna'} onChange={e => setCurrentUser(prev => ({ ...prev, preferencias: { ...(prev.preferencias || {}), region: e.target.value } }))}>
                  <option value="ninguna">Selecciona...</option>
                  <option value="sierra">Sierra</option>
                  <option value="costa">Costa</option>
                  <option value="amazonia">Amazonia</option>
                  <option value="galapagos">Galapagos</option>
                </select>
              </label>

              <label className="form__label">Idioma
                <select className="input" id="select-idioma" value={(currentUser.preferencias && currentUser.preferencias.idioma) || 'es'} onChange={e => setCurrentUser(prev => ({ ...prev, preferencias: { ...(prev.preferencias || {}), idioma: e.target.value } }))}>
                  <option value="es">Español</option>
                </select>
              </label>

              <label className="form__label">Moneda
                <select className="input" id="select-moneda" value={(currentUser.preferencias && currentUser.preferencias.moneda) || 'usd'} onChange={e => setCurrentUser(prev => ({ ...prev, preferencias: { ...(prev.preferencias || {}), moneda: e.target.value } }))}>
                  <option value="usd">USD</option>
                </select>
              </label>
            </div>

            <h4 className="section-subtitle">Mis Intereses</h4>
            <div className="chips" id="interes-chips-container">
              {currentUser.intereses && currentUser.intereses.tags && currentUser.intereses.tags.length > 0 ? (
                currentUser.intereses.tags.map((tag, i) => (
                  <button key={i} className="chip is-on" disabled>{tag.replace(/_/g, ' ')}</button>
                ))
              ) : (
                <p className="muted">Aún no has seleccionado intereses.</p>
              )}
            </div>
          </section>

          <section className="form-section">
            <h3 className="section-title-sm">Notificaciones</h3>
            <div className="form-row-line">
              <label>Alertas 24 h antes</label>
              <button type="button" className={`btn ${notificaciones.alerta24h ? 'is-on' : ''}`} id="btn-notif-24h" onClick={setupNotifToggle('alerta24h')}>{notificaciones.alerta24h ? 'On' : 'Off'}</button>
            </div>
            <div className="form-row-line">
              <label>Alertas 1 h antes</label>
              <button type="button" className={`btn ${notificaciones.alerta1h ? 'is-on' : ''}`} id="btn-notif-1h" onClick={setupNotifToggle('alerta1h')}>{notificaciones.alerta1h ? 'On' : 'Off'}</button>
            </div>
            <div className="form-row-line">
              <label>Cambios de evento</label>
              <button type="button" className={`btn ${notificaciones.cambios ? 'is-on' : ''}`} id="btn-notif-cambios" onClick={setupNotifToggle('cambios')}>{notificaciones.cambios ? 'On' : 'Off'}</button>
            </div>
            <div className="form-row-line">
              <label>Nuevos cercanos</label>
              <button type="button" className={`btn ${notificaciones.cercanos ? 'is-on' : ''}`} id="btn-notif-cercanos" onClick={setupNotifToggle('cercanos')}>{notificaciones.cercanos ? 'On' : 'Off'}</button>
            </div>
          </section>

          <section className="form-actions">
            <button className="btn btn--accent" id="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
            <button className="btn btn--primary" id="btn-guardar" onClick={handleGuardar}>Guardar cambios</button>
          </section>

        </div>
      </div>
        {/* Debug: mostrar usuario actual (temporal) */}
        <div style={{ marginTop: 18, padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 8, fontSize: 12 }}>
          <strong>Debug user:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 220, overflow: 'auto' }}>{JSON.stringify(currentUser, null, 2)}</pre>
        </div>
    </main>
  );
}

