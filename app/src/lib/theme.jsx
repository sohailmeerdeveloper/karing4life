import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { REDUCED, store } from './hooks.js';

/* Palette (olive | forest) × mode (light | dark). index.html sets the attributes
   before first paint; this context keeps React in sync and handles switching. */
const ThemeCtx = createContext(null);
const THEME_COLOR = { 'olive-light': '#FEFAE0', 'olive-dark': '#11160A', 'forest-light': '#F2F7F3', 'forest-dark': '#010F0A' };
export const LOGOS = { olive: '/logo-olive.webp', forest: '/logo-forest.webp' };

function read() {
  const d = document.documentElement;
  return { palette: d.dataset.palette === 'forest' ? 'forest' : 'olive', mode: d.dataset.mode === 'dark' ? 'dark' : 'light' };
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(read);

  useEffect(() => {
    const d = document.documentElement;
    d.dataset.palette = theme.palette; d.dataset.mode = theme.mode;
    const mt = document.querySelector('meta[name="theme-color"]');
    if (mt) mt.setAttribute('content', THEME_COLOR[theme.palette + '-' + theme.mode]);
    store('k4l-theme', { p: theme.palette, m: theme.mode });
  }, [theme]);

  /** Switch with a circular reveal from the clicked control (View Transitions), else a short cross-fade. */
  const switchTo = useCallback((next, originEl) => {
    const apply = () => {
      const d = document.documentElement;
      d.dataset.palette = next.palette; d.dataset.mode = next.mode;  // paint synchronously inside the transition
      setTheme(next);
    };
    if (REDUCED || !originEl) return apply();
    if (document.startViewTransition) {
      const r = originEl.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(apply);
      vt.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
          { duration: 650, easing: 'cubic-bezier(.65,0,.25,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => {});
      return;
    }
    apply();
  }, []);

  return <ThemeCtx.Provider value={{ ...theme, switchTo }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
