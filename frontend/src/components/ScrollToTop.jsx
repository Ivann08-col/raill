import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop({ behavior = 'smooth' }) {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.scrollTo) {
        window.scrollTo({ top: 0, left: 0, behavior });
      }
    } catch (e) {
      // Fallback for older browsers
      try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
    }
  }, [pathname, behavior]);

  return null;
}
