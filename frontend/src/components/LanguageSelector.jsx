import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import i18n from '../i18n';

export default function LanguageSelector({ currentLng, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'zh', label: '中文' },
    { code: 'hi', label: 'हिंदी' },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const changeLanguage = (lng) => {
    try {
      i18n.changeLanguage(lng);
      try { window.localStorage.setItem('i18nextLng', lng); } catch (e) {}
    } catch (e) {}
    setIsOpen(false);
  };

  const active = languages.find(l => l.code === (currentLng || i18n.language)) || languages[0];

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(s => !s)} className={`theme-toggle-btn ${compact ? 'compact' : ''}`} aria-label="Select language">
        <Globe size={18} />
        <span style={{ marginLeft: 6, fontSize: 13 }}>{active.label}</span>
      </button>
      {isOpen && (
        <div className="theme-menu" role="menu" style={compact ? { left: '100%', bottom: '0', transform: 'translateX(8px) translateY(-8px)' } : undefined}>
          {languages.map(l => (
            <button key={l.code} onClick={() => changeLanguage(l.code)} className={`theme-menu-item ${i18n.language === l.code ? 'active' : ''}`} role="menuitem">
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
      <style>{` 
        .theme-toggle-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 6px; border-radius: 8px; display:flex; align-items:center; gap:6px; }
        .theme-toggle-btn.compact { padding: 8px; border-radius: 50%; }
        .theme-toggle-btn.compact span { display: none; }
        .theme-menu { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); width: 140px; background: var(--bg-primary); border-radius: 12px; box-shadow: 0 8px 30px rgba(2,6,23,0.06); overflow: hidden; border: 1px solid var(--border-default); z-index: 60; padding:6px; }
        .theme-menu-item { display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding: 8px 10px; border:none; background:transparent; cursor:pointer; color:var(--text-primary); font-weight:600; border-radius:6px; }
        .theme-menu-item:hover { background: var(--bg-tertiary); }
        .theme-menu-item.active { background: var(--accent); color: var(--text-on-primary); }
      `}</style>
    </div>
  );
}
