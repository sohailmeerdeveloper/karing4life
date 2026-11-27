import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './v3.css';
import App from './App.jsx';

/* After a new deploy, a tab opened before it may ask for page chunks that no longer exist.
   Reload once to pick up the new build instead of showing a broken page. */
window.addEventListener('vite:preloadError', (e) => {
  try {
    if (sessionStorage.getItem('k4l-chunk-reload')) return;
    sessionStorage.setItem('k4l-chunk-reload', '1');
  } catch { return; }
  e.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => setTimeout(() => { try { sessionStorage.removeItem('k4l-chunk-reload'); } catch { /* */ } }, 10000));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
