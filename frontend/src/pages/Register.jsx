import React, { useState } from 'react';
import api from '../services/api';
import cfg from '../services/config';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { saveToken, saveUsuario } from '../services/auth';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// === VALIDACIONES IDÉNTICAS AL BACKEND ===
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

function validateEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

function validatePassword(password) {
  if (password.length < 8) return 'err_password_length';
  if (!/[A-Z]/.test(password)) return 'err_password_uppercase';
  if (!/[a-z]/.test(password)) return 'err_password_lowercase';
  if (!/[0-9]/.test(password)) return 'err_password_digit';
  if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) return 'err_password_special';
  return null;
}

const getErrorMessage = (key, t) => {
  const messages = {
    err_password_length: t('err_password_length', 'La contraseña debe tener al menos 8 caracteres'),
    err_password_uppercase: t('err_password_uppercase', 'La contraseña debe contener al menos una letra mayúscula'),
    err_password_lowercase: t('err_password_lowercase', 'La contraseña debe contener al menos una letra minúscula'),
    err_password_digit: t('err_password_digit', 'La contraseña debe contener al menos un número'),
    err_password_special: t('err_password_special', 'La contraseña debe contener al menos un carácter especial (!@#$%^&*, etc.)'),
    err_invalid_email: t('err_invalid_email', 'Por favor ingresa un correo válido'),
    err_name_length: t('err_name_length', 'El nombre debe tener al menos 2 caracteres'),
    err_password_mismatch: t('err_password_mismatch', 'Las contraseñas no coinciden'),
  };
  return messages[key] || key;
};

export default function Register({ onSuccess, onSwitchMode }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState('');
  const [touched, setTouched] = useState({});
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);

  const validName = name.trim().length >= 2;
  const emailNormalized = email.trim().toLowerCase();
  const validEmail = validateEmail(emailNormalized);
  const passwordErrorKey = validatePassword(password);
  const validPassword = !passwordErrorKey;
  const passwordsMatch = password === password2 && password2.length > 0;

  const handle = async (e) => {
    e.preventDefault();
    setErr('');

    if (!validName) return setErr(getErrorMessage('err_name_length', t));
    if (!validEmail) return setErr(getErrorMessage('err_invalid_email', t));
    if (!validPassword) return setErr(getErrorMessage(passwordErrorKey, t));
    if (!passwordsMatch) return setErr(getErrorMessage('err_password_mismatch', t));

    try {
      // ensure correo is lowercase when sent to backend
      await api.post(cfg.paths.register, { username: name, correo: emailNormalized, password });
      // Si el registro fue por formulario, abrimos el modal de login
      if (onSuccess) onSuccess('register');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || error.message || t('err_generic', 'Error al registrar');
      setErr(msg);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('Regístrate')}</h2>
      </div>

      <button className="google-btn" type="button" style={{ marginBottom: 12 }} onClick={() => {
        try {
          const popup = window.open(`${cfg.apiBase}/auth/google`, 'google_oauth', 'width=600,height=700');
          if (!popup) return setErr(t('err_popup_blocked', 'El navegador bloqueó el popup. Permite popups y vuelve a intentarlo'));
          const onMessage = (ev) => {
            try {
              const d = ev.data;
              if (!d || d.type !== 'oauth' || d.provider !== 'google') return;
              if (d.token) {
                saveToken(d.token);
                if (d.usuario) saveUsuario(d.usuario);
                window.removeEventListener('message', onMessage);
                try { popup.close(); } catch (e) {}
                // Notificar al contenedor (App.jsx) que la autenticación fue exitosa
                try {
                  if (onSuccess) onSuccess('google');
                } catch (e) { /* ignore */ }
                // Asegurar redirección al dashboard/landing
                try { nav('/bienvenida'); } catch (e) { /* ignore */ }
              } else if (d.error) {
                setErr(d.error);
                window.removeEventListener('message', onMessage);
                try { popup.close(); } catch (e) {}
              }
            } catch (e) { console.error('oauth message handling failed', e); }
          };
          window.addEventListener('message', onMessage, false);
        } catch (e) {
          console.error('Google auth open failed', e);
          setErr('No se pudo iniciar el login con Google');
        }
      }}>
        <span className="google-icon"><img src="/static/IMG/google.svg" alt={t('google_alt', 'Google')} /></span>
        <span>{t('continue_with_google', 'Continuar con Google')}</span>
      </button>

      {err && <div style={{ color: 'crimson', fontSize: 13, marginBottom: 8 }}>{err}</div>}

      <form onSubmit={handle}>
        {/* Nombre */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, name: true }))}>
          <span className="input-icon"><User size={18} /></span>
          <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name_placeholder', 'Nombre')} />
        </div>
        {!validName && touched.name && <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage('err_name_length', t)}</div>}

        {/* Email (force lowercase) */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, email: true }))}>
          <span className="input-icon"><Mail size={18} /></span>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            onBlur={() => setEmail(email.trim().toLowerCase())}
            onPaste={(e) => e.preventDefault()}
            placeholder={t('email_placeholder', 'Correo electrónico')}
            autoCapitalize="none"
            autoComplete="email"
          />
        </div>
        {!validEmail && touched.email && <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage('err_invalid_email', t)}</div>}

        {/* Contraseña */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, password: true }))}>
          <span className="input-icon"><Lock size={18} /></span>
          <input
            className="auth-input"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password_placeholder', 'Contraseña')}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShow(s => !s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {touched.password && passwordErrorKey && (
          <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage(passwordErrorKey, t)}</div>
        )}

        {/* Confirmar contraseña */}
        <div className="input-wrap" onFocus={() => setTouched(t => ({ ...t, password2: true }))}>
          <span className="input-icon"><Lock size={18} /></span>
          <input
            className="auth-input"
            type={show2 ? 'text' : 'password'}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder={t('confirm_password_placeholder', 'Confirmar contraseña')}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShow2(s => !s)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {!passwordsMatch && touched.password2 && (
          <div style={{ color: '#f43f5e', fontSize: 12, marginTop: 6 }}>{getErrorMessage('err_password_mismatch', t)}</div>
        )}

        <button
          type="submit"
          className="submit-btn"
          disabled={!(validName && validEmail && validPassword && passwordsMatch)}
        >
          {t('Registrarse')}
        </button>
      </form>

      <div className="auth-footer">
        <span>{t('already_have_account', '¿Ya tienes cuenta?')} </span>
        <button className="switch-link" onClick={() => onSwitchMode && onSwitchMode()}>{t('Inicia Sesión aquí')}</button>
      </div>
    </div>
  );
}