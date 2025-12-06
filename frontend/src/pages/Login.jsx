import React, { useState } from 'react';
import api from '../services/api';
import cfg from '../services/config';
import { saveToken, saveUsuario } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login({ onSuccess, onSwitchMode }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverStep, setRecoverStep] = useState('email'); // 'email' | 'verify' | 'setPassword'
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetErr, setResetErr] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const nav = useNavigate();
  // Detectar tema 'midnight' para ajustar estilos del modal
  const isMidnight = typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute('data-theme') === 'midnight';

  const handleGoogleLogin = () => {
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
            if (onSuccess) onSuccess('google'); else nav('/bienvenida');
          } else if (d.error) {
            setErr(d.error);
            window.removeEventListener('message', onMessage);
            try { popup.close(); } catch (e) {}
          }
        } catch (e) { console.error('oauth message handling failed', e); }
      };

      window.addEventListener('message', onMessage, false);
    } catch (e) {
      console.error('Google login failed', e);
      setErr('No se pudo iniciar el login con Google');
    }
  };

  const handle = async (e) => {
    e.preventDefault();
    setErr('');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErr(t('err_invalid_email', 'Por favor ingresa un correo válido'));
  if (!password || password.length < 6) return setErr(t('err_password_length', 'La contraseña debe tener al menos 6 caracteres'));

    try {
  // Backend expects 'correo' and 'password'
  const res = await api.post(cfg.paths.login, { correo: email, password });
      const data = res.data || {};
      const token = data[cfg.tokenField] || data.access_token || data.access;
      const usuario = data[cfg.usuarioField] || data.usuario || null;

      if (!token) {
        setErr(t('err_no_token', 'No access_token found in response'));
        return;
      }

      saveToken(token);
      try { const apiInstance = require('../services/api').default; apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`; } catch {}
      if (usuario) saveUsuario(usuario);
  // hide forgot password hint on successful login
  setShowForgot(false);
  if (onSuccess) { try { onSuccess('Iniciar Sesión'); } catch (e) { onSuccess(); } }
  else nav('/bienvenida');
    } catch (error) {
      console.error(error);
      const serverMsg = error.response?.data?.error || error.response?.data || error.message;
      setErr(serverMsg);
      // Mostrar opción de recuperar contraseña solo cuando es error de credenciales (401)
      if (error.response && error.response.status === 401) {
        // mostrar el texto centrado
        setResetEmail(email);
        setShowForgot(true);
      }
    }
  };
  const handleOpenRecoverModal = () => {
    setResetErr('');
    setResetMsg('');
    setResetCode('');
    setResetNewPassword('');
    setRecoverStep('email');
    setShowRecoverModal(true);
  };

  const handleCloseRecoverModal = () => {
    setShowRecoverModal(false);
  };

  const handleSendResetCode = async () => {
    setResetErr('');
    setResetMsg('');
    if (!resetEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(resetEmail)) return setResetErr(t('err_invalid_email', 'Por favor ingresa un correo válido'));
    try {
      const res = await api.post(cfg.paths.requestPasswordReset, { correo: resetEmail });
      const dev_code = res.data?.dev_code;
      setResetMsg(res.data?.message || 'Se ha enviado el código. Revisa tu correo.');
      if (dev_code) {
        // Mostrar código en dev para pruebas
        setResetMsg(prev => prev + ` (dev code: ${dev_code})`);
      }
      setRecoverStep('verify');
    } catch (e) {
      console.error(e);
      setResetErr(e.response?.data?.error || e.message);
    }
  };

  const handleVerifyResetCode = async () => {
    setResetErr('');
    setResetMsg('');
    if (!resetCode || resetCode.length < 4) return setResetErr('Código inválido');
    try {
      const res = await api.post(cfg.paths.verifyResetCode, { correo: resetEmail, code: resetCode });
      setResetMsg(res.data?.message || 'Código verificado');
      setRecoverStep('setPassword');
    } catch (e) {
      console.error(e);
      setResetErr(e.response?.data?.error || e.message);
    }
  };

  const handleConfirmReset = async () => {
    setResetErr('');
    setResetMsg('');
    if (!resetNewPassword || resetNewPassword.length < 6) return setResetErr(t('err_password_length', 'La contraseña debe tener al menos 6 caracteres'));
    try {
      const res = await api.post(cfg.paths.resetPassword, { correo: resetEmail, code: resetCode, new_password: resetNewPassword });
      const token = res.data?.access_token || res.data?.token;
      const usuario = res.data?.usuario;
      setResetMsg(res.data?.message || 'Contraseña restablecida.');

      if (token) {
        // Backend returned a token: log the user in
        saveToken(token);
        if (usuario) saveUsuario(usuario);
        try { const apiInstance = require('../services/api').default; apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`; } catch {}
        setShowRecoverModal(false);
        if (onSuccess) onSuccess('password-reset'); else nav('/bienvenida');
        return;
      }

      // No token returned: show success message, close modal and redirect to login
      setTimeout(() => {
        setShowRecoverModal(false);
        try { nav('/login'); } catch (e) { /* ignore navigation errors */ }
      }, 1400);
    } catch (e) {
      console.error(e);
      setResetErr(e.response?.data?.error || e.message);
    }
  };

  return (
   <div style={{ fontFamily: 'Inter, system-ui, Arial' }}> 

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('Iniciar Sesión')}</h2>
      </div>

      <button className="google-btn" type="button" onClick={handleGoogleLogin}>
        <span className="google-icon"><img src="/static/IMG/google.svg" alt={t('google_alt', 'Google')} /></span>
        <span>{t('continue_with_google', 'Continuar con Google')}</span>
      </button>

      <div className="or-sep">{t('or_with_email', 'o con tu correo')}</div>

      {err && <div style={{ color: 'crimson', fontSize: 13, marginBottom: 8 }}>{err}</div>}

      <form onSubmit={handle}>
        <div className="input-wrap" style={{ marginBottom: 10 }}>
          <span className="input-icon"><Mail size={18} /></span>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            onBlur={() => setEmail(email.trim().toLowerCase())}
            onPaste={(e) => e.preventDefault()}
            placeholder={t('email_placeholder', 'Correo electrónico')}
          />
        </div>

        <div className="input-wrap">
          <span className="input-icon"><Lock size={18} /></span>
          <input className="auth-input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('password_placeholder', 'Contraseña')} />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? t('hide_password', 'Ocultar contraseña') : t('show_password', 'Mostrar contraseña')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

  <button type="submit" className="submit-btn">{t('Iniciar Sesión')}</button>
      </form>

      {/* Mostrar el texto centrado SOLO cuando hubo error de contraseña */}
      {showForgot && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button className="link-btn" type="button" onClick={handleOpenRecoverModal} style={{ padding: '8px 16px', borderRadius: 8 }}>{t('forgot_password', '¿Olvidaste tu contraseña?')}</button>
        </div>
      )}

      {showRecoverModal && (
        <div style={{ position: 'fixed', inset: 0, background: isMidnight ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: isMidnight ? '#0b0f1a' : '#fff', padding: 20, width: 420, borderRadius: 8, boxShadow: isMidnight ? '0 8px 30px rgba(0,0,0,0.6)' : '0 6px 18px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: isMidnight ? '#ffffff' : undefined }}>{t('forgot_password_title', 'Recuperar contraseña')}</h3>
            {resetErr && <div style={{ color: 'crimson', fontSize: 13 }}>{resetErr}</div>}
            {resetMsg && <div style={{ color: 'green', fontSize: 13 }}>{resetMsg}</div>}

            {recoverStep === 'email' && (
              <div>
                <div style={{ marginBottom: 8, fontSize: 13 }}>{t('forgot_password_prompt', 'Ingresa tu correo para recibir un código')}</div>
                <div className="input-wrap" style={{ marginBottom: 8 }}>
                  <input className="auth-input" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder={t('email_placeholder', 'Correo electrónico')} style={{ background: isMidnight ? '#0f1724' : undefined, color: isMidnight ? '#fff' : undefined, border: isMidnight ? '1px solid rgba(255,255,255,0.06)' : undefined }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="small-btn" type="button" onClick={handleSendResetCode} style={isMidnight ? { background: 'linear-gradient(90deg,#2b0b5a,#8b3bd9)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : undefined}>{t('send_code', 'Enviar código')}</button>
                  <button className="small-btn" type="button" onClick={handleCloseRecoverModal} style={isMidnight ? { background: 'linear-gradient(90deg,#1f1236,#5a2bb6)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : undefined}>{t('cancel', 'Cancelar')}</button>
                </div>
              </div>
            )}

            {recoverStep === 'verify' && (
              <div>
                <div style={{ marginBottom: 8, fontSize: 13 }}>{t('enter_code_prompt', 'Ingresa el código que recibiste en tu correo')}</div>
                <div className="input-wrap" style={{ marginBottom: 8 }}>
                  <input className="auth-input" type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder={t('code_placeholder', 'Código')} style={{ background: isMidnight ? '#0f1724' : undefined, color: isMidnight ? '#fff' : undefined, border: isMidnight ? '1px solid rgba(255,255,255,0.06)' : undefined }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="small-btn" type="button" onClick={handleVerifyResetCode} style={isMidnight ? { background: 'linear-gradient(90deg,#2b0b5a,#8b3bd9)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : undefined}>{t('verify_code', 'Verificar código')}</button>
                  <button className="small-btn" type="button" onClick={() => { setRecoverStep('email'); setResetCode(''); setResetErr(''); setResetMsg(''); }} style={isMidnight ? { background: 'linear-gradient(90deg,#1f1236,#5a2bb6)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : undefined}>{t('back', 'Atrás')}</button>
                </div>
              </div>
            )}

            {recoverStep === 'setPassword' && (
              <div>
                <div style={{ marginBottom: 8, fontSize: 13 }}>{t('set_new_password', 'Ingresa tu nueva contraseña')}</div>
                <div className="input-wrap" style={{ marginBottom: 8 }}>
                  <input className="auth-input" type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder={t('new_password_placeholder', 'Nueva contraseña')} style={{ background: isMidnight ? '#0f1724' : undefined, color: isMidnight ? '#fff' : undefined, border: isMidnight ? '1px solid rgba(255,255,255,0.06)' : undefined }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="small-btn" type="button" onClick={handleConfirmReset} style={isMidnight ? { background: 'linear-gradient(90deg,#2b0b5a,#8b3bd9)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : undefined}>{t('confirm_reset', 'Restablecer contraseña')}</button>
                  <button className="small-btn" type="button" onClick={() => { setRecoverStep('verify'); setResetNewPassword(''); setResetErr(''); setResetMsg(''); }} style={isMidnight ? { background: 'linear-gradient(90deg,#1f1236,#5a2bb6)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8 } : undefined}>{t('back', 'Atrás')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    <div className="auth-footer">
  <span>{t('no_account', '¿No tienes cuenta?')} </span>
  <button className="switch-link" onClick={() => onSwitchMode && onSwitchMode()}>{t('login_here', 'Registrate aquí' )}</button>
    </div>
  <style>{`
  /* Eliminar modo 'dark' y usar 'midnight' para encabezados en tema oscuro */
  [data-theme='midnight'] h2 {
  color: white !important;
  }
  `}</style>
    </div>
  );
}