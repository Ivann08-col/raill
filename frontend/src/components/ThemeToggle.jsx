import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <>
      <button onClick={toggleTheme} className="theme-toggle-btn" aria-label={`Switch to ${theme === 'light' ? 'midnight' : 'light'} mode`}>
        {theme === 'light' ? (
          <Sun size={20} />
        ) : (
          /* Mantenemos el icono de luna para 'midnight' */
          <Moon size={20} />
        )}
      </button>
      <style>{`
        .theme-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .theme-toggle-btn:hover {
          color: var(--text-primary);
          background-color: color-mix(in srgb, var(--text-primary) 10%, transparent);
        }
        .theme-toggle-btn svg {
          transition: transform 0.3s ease;
        }
        .theme-toggle-btn:hover svg {
          transform: rotate(15deg);
        }
      `}</style>
    </>
  );
}