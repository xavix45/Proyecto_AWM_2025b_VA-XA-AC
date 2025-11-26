import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { list as listAgenda } from "../services/agenda.service";
import { getById } from "../services/eventos.service";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/pages/cuenta.css";

// Página de perfil del usuario. Lee `usuarios` y `currentUserEmail` de
// localStorage para mostrar y editar preferencias, intereses y notificaciones.
// Notas:
// - Si no existe el usuario en la lista `usuarios`, se crea un perfil mínimo
//   para que la página funcione (nombre derivado del email).
// - Los toggles de notificaciones actualizan `currentUser.notificaciones`
//   y persisten en localStorage.

const LS_USUARIOS_KEY = 'usuarios';
const LS_CURRENT_USER_KEY = 'currentUserEmail';

export default function Cuenta() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [indexUser, setIndexUser] = useState(-1);
  const [usuarios, setUsuarios] = useState([]);
  const [agendaItems, setAgendaItems] = useState([]);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

  useEffect(() => {
    const email = localStorage.getItem(LS_CURRENT_USER_KEY);
    if (!email) {
      setModal({
        show: true,
        title: '🔒 Acceso Requerido',
        message: 'Debes iniciar sesión para ver tu cuenta.',
        type: 'warning',
        onConfirm: () => {
          setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null });
          navigate('/login');
        }
      });
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
      };
      all.push(nuevo);
      localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(all));
      idx = all.length - 1;
    }

    setUsuarios(all);
    setIndexUser(idx);
    setCurrentUser(all[idx]);
    
    // Cargar agenda del usuario
    try {
      const agenda = listAgenda(email);
      setAgendaItems(agenda || []);
    } catch (e) {
      console.warn('[Cuenta] Error cargando agenda:', e);
      setAgendaItems([]);
    }
  }, [navigate]);

  // Calcular estadísticas de la agenda del usuario
  const stats = useMemo(() => {
    const eventos = agendaItems.map(item => getById(item.idEvento)).filter(Boolean);
    const categorias = {};
    const regiones = {};
    
    eventos.forEach(ev => {
      if (ev.categoria) categorias[ev.categoria] = (categorias[ev.categoria] || 0) + 1;
      if (ev.region) regiones[ev.region] = (regiones[ev.region] || 0) + 1;
    });
    
    const topCategoria = Object.entries(categorias).sort((a, b) => b[1] - a[1])[0];
    const topRegion = Object.entries(regiones).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalEventos: eventos.length,
      categorias: Object.keys(categorias).length,
      topCategoria: topCategoria ? topCategoria[0] : 'Ninguna',
      topRegion: topRegion ? topRegion[0] : 'Ninguna',
    };
  }, [agendaItems]);

  function handleGuardar() {
    if (!currentUser || indexUser === -1) return;
    const copyUsuarios = [...usuarios];
    copyUsuarios[indexUser] = currentUser;
    localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(copyUsuarios));
    setUsuarios(copyUsuarios);
    setModal({
      show: true,
      title: '✅ Guardado Exitoso',
      message: '¡Cambios guardados con éxito!',
      type: 'success',
      onConfirm: () => {
        setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null });
        navigate('/home');
      }
    });
  }

  function handleLogout() {
    setModal({
      show: true,
      title: '💾 Guardar Cambios',
      message: '¿Deseas guardar los cambios antes de cerrar sesión?',
      type: 'warning',
      onConfirm: () => {
        handleGuardar();
        localStorage.removeItem(LS_CURRENT_USER_KEY);
        setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null });
        window.location.href = '/';
      },
      onCancel: () => {
        localStorage.removeItem(LS_CURRENT_USER_KEY);
        setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null });
        window.location.href = '/';
      }
    });
  }

  if (!currentUser) return null;

  const displayName = (currentUser && (currentUser.nombre || currentUser.name)) || (currentUser && currentUser.email ? currentUser.email.split('@')[0] : 'Usuario');

  return (
    <main className="container section">
      <h2 className="page-title">Mi cuenta / Perfil</h2>

      <div className="grid-perfil">
        <aside className="panel-usuario">
          <h3>Información Personal</h3>
          <div className="user-info">
            <label className="form__label">Nombre completo
              <input 
                className="input" 
                type="text" 
                value={currentUser.nombre || ''} 
                onChange={e => setCurrentUser(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Tu nombre completo"
              />
            </label>
            
            <label className="form__label">Correo electrónico
              <input 
                className="input" 
                type="email" 
                value={currentUser.email || ''} 
                disabled
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
              <small style={{ fontSize: '0.85rem', color: '#666' }}>El correo no se puede cambiar</small>
            </label>

            <label className="form__label">Tipo de viajero
              <select 
                className="input" 
                value={currentUser.tipoViajero || 'turista'} 
                onChange={e => setCurrentUser(prev => ({ ...prev, tipoViajero: e.target.value }))}
              >
                <option value="turista">Turista</option>
                <option value="residente">Residente</option>
                <option value="estudiante">Estudiante</option>
                <option value="guia">Guía turístico</option>
              </select>
            </label>
          </div>
        </aside>

        <div className="panel-ajustes">
          <section className="form-section">
            <h3 className="section-title-sm">Preferencias de Viaje</h3>
            <label className="form__label">Región favorita
              <select className="input" id="select-region" value={(currentUser.preferencias && currentUser.preferencias.region) || 'ninguna'} onChange={e => setCurrentUser(prev => ({ ...prev, preferencias: { ...(prev.preferencias || {}), region: e.target.value } }))}>
                <option value="ninguna">Todas las regiones</option>
                <option value="Sierra">Sierra</option>
                <option value="Costa">Costa</option>
                <option value="Amazonía">Amazonía</option>
                <option value="Galápagos">Galápagos</option>
              </select>
              <small style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>Se priorizarán eventos de esta región en las recomendaciones</small>
            </label>
          </section>

          <section className="form-section">
            <h3 className="section-title-sm">Categorías de Interés</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Cultural', 'Gastronomía', 'Religiosa', 'Naturaleza', 'Artesanía', 'Deportes', 'Turismo'].map(cat => {
                const isSelected = currentUser.intereses?.tags?.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`btn ${isSelected ? 'btn--primary' : 'btn--ghost'}`}
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    onClick={() => {
                      const current = currentUser.intereses?.tags || [];
                      const updated = isSelected 
                        ? current.filter(t => t !== cat)
                        : [...current, cat];
                      setCurrentUser(prev => ({
                        ...prev,
                        intereses: { ...(prev.intereses || {}), tags: updated }
                      }));
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            <small style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem', display: 'block' }}>
              Selecciona tus categorías favoritas para recibir recomendaciones personalizadas
            </small>
          </section>

          <section className="form-section">
            <h3 className="section-title-sm">Estadísticas de tu Cuenta</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#0ea5e9' }}>{stats.totalEventos}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>Eventos en Agenda</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4caf50' }}>{stats.categorias}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>Categorías Exploradas</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderLeft: '3px solid #0ea5e9', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.9rem', color: '#333' }}>
                <strong>Categoría favorita:</strong> {stats.topCategoria}<br />
                <strong>Región más visitada:</strong> {stats.topRegion}
              </div>
            </div>
            <Link to="/agenda" className="btn btn--ghost" style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>
              Ver mi Agenda Completa →
            </Link>
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

      {modal.show && (
        <ConfirmModal
          show={modal.show}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel || (() => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null }))}
        />
      )}
    </main>
  );
}

