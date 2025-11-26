import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/registro.css";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [viajero, setViajero] = useState("turista");

  function handleSubmit(e) {
    e.preventDefault();

    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    const existe = usuarios.find(u => u.email === email);
    if (existe) {
      alert('Error: El correo electrónico ya está registrado.');
      return;
    }

    const nuevoUsuario = { nombre: name, email, contra: password, tipoViajero: viajero };
    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem('currentUserEmail', nuevoUsuario.email);
    // Also store a small user object for the app header (compatibility)
    const storedUser = { nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, tipoViajero: nuevoUsuario.tipoViajero, rol: 'user' };
    try { localStorage.setItem('festi_usuario', JSON.stringify(storedUser)); } catch (e) { console.warn('[Register] could not store festi_usuario', e); }
    // Notify app that user changed so header (BaseLayout) updates immediately
    try { window.dispatchEvent(new Event('userChanged')); } catch (e) {}

    alert('¡Cuenta creada con éxito!');
    navigate('/home');
  }

  return (
    <main className="container section-narrow">
      <h2 className="page-title">Crear cuenta</h2>

      <form className="form" autoComplete="on" id="register-form" onSubmit={handleSubmit}>
        <label className="form__label" htmlFor="reg-name">Nombre y apellido
          <input id="reg-name" className="input" name="name" value={name} onChange={e => setName(e.target.value)} required />
        </label>

        <label className="form__label" htmlFor="reg-email">Correo
          <input id="reg-email" className="input" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>

        <label className="form__label" htmlFor="reg-pass">Contraseña
          <input id="reg-pass" className="input" type="password" name="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} pattern="(?=.*[A-Z])(?=.*\d).{8,}" aria-describedby="pass-help" required />
          <small id="pass-help" className="muted">Mínimo 8 caracteres, 1 mayúscula y 1 número.</small>
        </label>

        <fieldset className="form__row" role="radiogroup" aria-label="Tipo de viajero">
          <label className="radio"><input type="radio" name="viajero" value="turista" checked={viajero==='turista'} onChange={() => setViajero('turista')} /> Turista</label>
          <label className="radio"><input type="radio" name="viajero" value="residente" checked={viajero==='residente'} onChange={() => setViajero('residente')} /> Residente</label>
          <label className="radio"><input type="radio" name="viajero" value="estudiante" checked={viajero==='estudiante'} onChange={() => setViajero('estudiante')} /> Estudiante</label>
        </fieldset>

        <button className="btn btn--primary form__submit" type="submit">Crear cuenta</button>
      </form>
    </main>
  );
}
