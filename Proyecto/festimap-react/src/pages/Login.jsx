import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/pages/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      // Guardar email del usuario actual
      localStorage.setItem('currentUserEmail', usuarioEncontrado.email);
      // Si el usuario ya existe (no es nueva cuenta), ir directo a home
      navigate('/home');
    } else {
      alert('Correo electrónico o contraseña incorrectos.');
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
    </main>
  );
}
