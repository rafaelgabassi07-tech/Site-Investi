import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Try multiple times to ensure elements are rendered (useful for slow renders)
      let attempts = 0;
      const tryScroll = () => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else if (attempts < 10) {
          attempts++;
          setTimeout(tryScroll, 100);
        }
      };
      tryScroll();
      return;
    }

    window.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    
    // Fallback for some browsers/containers
    const main = document.querySelector('main');
    if (main) main.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
