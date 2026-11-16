import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../lib/theme.jsx';
import { Icon } from './Icon.jsx';

export function ThemeDock() {
  const { palette, mode, switchTo } = useTheme();
  const [open, setOpen] = useState(false);   // phones: folded into one round button
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return (
    <div ref={ref} className={'theme-dock' + (open ? ' open' : '')} id="themeDock" role="group" aria-label="Display settings">
      <button className="td-fab" type="button" aria-expanded={open} aria-controls="themeDock" aria-label="Theme settings" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <Icon name="palette" />
      </button>
      <button className="td-switch td-palette" type="button" role="switch" aria-checked={palette === 'forest'} aria-label="Forest colour theme" title="Colour theme: Olive / Forest"
        onClick={(e) => switchTo({ palette: palette === 'forest' ? 'olive' : 'forest', mode }, e.currentTarget)}>
        <span className="td-track"><span className="td-knob" /><span className="td-opt"><i className="sw sw-olive" /></span><span className="td-opt"><i className="sw sw-forest" /></span></span>
      </button>
      <span className="td-sep" aria-hidden="true" />
      <button className="td-switch td-mode" type="button" role="switch" aria-checked={mode === 'dark'} aria-label="Dark mode" title="Light / Dark"
        onClick={(e) => switchTo({ palette, mode: mode === 'dark' ? 'light' : 'dark' }, e.currentTarget)}>
        <span className="td-track"><span className="td-knob" /><span className="td-opt"><Icon name="sun" /></span><span className="td-opt"><Icon name="moon" /></span></span>
      </button>
    </div>
  );
}
