import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import "../styles/pages/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

  function handleSubmit(e) {
    e.preventDefault();

    // usuarios predefinidos (igual que en el proyecto original)
    const usuariosHardcode = [
      { nombre: "Xavier Anatoa", email: "xavier.anatoa@epn.edu.ec", contra: "12345", tipoViajero: "estudiante" },
      { nombre: "Angelo Conterón", email: "angelo.conteron@epn.edu.ec", contra: "12345", tipoViajero: "estudiante" },
      { nombre: "Veronica Aguilar", email: "veronica.aguilar@epn.edu.ec", contra: "12345", tipoViajero: "estudiante" }
    ];

    const admin = [
      { nombre: "Admin", email: "admin@epn.edu.ec", contra: "admin123" }
    ];

    // usuarios registrados en localStorage
    const usuariosRegistrados = JSON.parse(localStorage.getItem('usuarios')) || [];

    const todosLosUsuarios = [...usuariosHardcode, ...admin, ...usuariosRegistrados];

    const usuarioEncontrado = todosLosUsuarios.find(u => u.email === email && u.contra === password);

    if (usuarioEncontrado) {
      // Guardar información del usuario en localStorage para compatibilidad
      const storedUser = {
        ...usuarioEncontrado,
        rol: usuarioEncontrado.email === 'admin@epn.edu.ec' ? 'admin' : 'user',
      };
      localStorage.setItem('festi_usuario', JSON.stringify(storedUser));
      // Guardar email del usuario actual (flujo existente)
      localStorage.setItem('currentUserEmail', storedUser.email);
      // Notificar al resto de la app que el usuario cambió (para que headers se actualicen)
      try { window.dispatchEvent(new Event('userChanged')); } catch (e) {}
      // Si el usuario ya existe (no es nueva cuenta), ir directo a home
      navigate('/home');
    } else {
      setModal({
        show: true,
        title: '❌ Credenciales Inválidas',
        message: 'Correo electrónico o contraseña incorrectos.',
        type: 'danger',
        onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
      });
    }
  }

  return (
    <main className="container section-narrow">
      <h2 className="page-title">Iniciar sesión</h2>

      <form className="form" autoComplete="on" id="login-form" onSubmit={handleSubmit}>
        <label className="form__label">
          Correo electrónico
          <input
            type="email"
            className="input"
            placeholder="tucorreo@ejemplo.com"
            required
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="form__label">
          Contraseña
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            required
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <div className="form__row">
          <label className="checkbox">
            <input type="checkbox" /> Recuérdame
          </label>
          <Link className="link" to="/reset-solicitud">¿Olvidaste tu contraseña?</Link>
        </div>

        <input className="btn btn--primary form__submit" type="submit" value="Entrar" />

        <p className="muted center">
          ¿No tienes cuenta? <Link className="link" to="/registro">Regístrate</Link>
        </p>
      </form>

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
