import React, { useState } from 'react';
import api from '../services/api';
import cfg from '../services/config';
import { saveToken, saveUsuario } from '../services/auth';

export default function Register({ onSuccess, onSwitchMode }){
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setErr('');
    const normalized = (email || '').trim().toLowerCase();
    if (!name) return setErr('Ingresa tu nombre');
    if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) return setErr('Ingresa un correo válido');
    if (!password) return setErr('Ingresa la contraseña');

    try {
      const res = await api.post(cfg.paths.register, { username: name, correo: normalized, password });
      const data = res.data || {};
      const token = data[cfg.tokenField] || data.access_token || data.access;
      const usuario = data[cfg.usuarioField] || data.usuario || null;
      if (token) {
        saveToken(token);
        if (usuario) saveUsuario(usuario);
      }
      if (onSuccess) onSuccess(usuario || { email: normalized });
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || 'Error al registrar';
      setErr(msg);
    }
  };

  return (
    <div className="page page-auth">
      <h2>Registrar</h2>
      {err && <div className="error">{err}</div>}
      <form onSubmit={handle}>
        <label>
          Nombre
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            onPaste={(e) => e.preventDefault()}
            onBlur={() => setEmail(email.trim().toLowerCase())}
            placeholder="correo@ejemplo.com"
          />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <div className="actions">
          <button type="submit" className="btn btn-register-action">Crear cuenta</button>
          <button type="button" className="link" onClick={() => onSwitchMode && onSwitchMode()}>¿Ya tienes cuenta?</button>
        </div>
      </form>
    </div>
  );
}
