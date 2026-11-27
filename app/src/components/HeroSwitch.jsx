import { useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useNavigate } from 'react-router-dom';
import { Icon, CareOptions, RegionOptions } from './bits.jsx';
import { REDUCED } from '../lib/hooks.js';

const TABS = [
  { key: 'need', icon: 'heart', label: 'I need care' },
  { key: 'give', icon: 'steth', label: 'I give care' },
  { key: 'hire', icon: 'building', label: "I'm hiring" },
];
const PANES = {
  need: { careIcon: 'heart', careLabel: 'Type of care', careAny: 'Any type of care', regAny: 'Anywhere in New York', btn: 'Find caregivers',
    noteIcon: 'check-circle', note: <><strong>Always free for families.</strong> Post one request every 2 weeks and message 10 caregivers per post.</>, badge: '$0' },
  give: { careIcon: 'steth', careLabel: 'Your specialty', careAny: 'All specialties', regAny: 'All 16 regions', btn: 'Find families near you',
    noteIcon: 'sparkle', note: <><strong>14-day free trial</strong> with every region, then $8.99 a month per region. Cancel anytime.</>, badge: '14 days free' },
  hire: { careIcon: 'briefcase', careLabel: "Role you're hiring for", careAny: 'Any role', regAny: 'All 16 regions', btn: 'Find candidates',
    noteIcon: 'building', note: <><strong>Agency Access:</strong> post jobs and recruit verified caregivers for $49.99 a month per region.</>, badge: '$49.99 / region' },
};

/** Liquid indicator: the pill drains through a thin neck into a new pill that swells
    at the target; an SVG goo filter (#as-goo) merges the shapes. */
function useGoo() {
  const layer = useRef(null), A = useRef(null), B = useRef(null), N = useRef(null);
  const cur = useRef(0), running = useRef([]);
  function go(to) {
    const from = cur.current; cur.current = to;
    running.current.forEach((a) => a.cancel()); running.current = [];
    const a = A.current, b = B.current, n = N.current;
    if (from === to || REDUCED || !a.animate) { a.style.setProperty('--i', to); return; }
    const w = layer.current.clientWidth / 3, dir = to > from ? 1 : -1, span = Math.abs(to - from);
    const dur = 520 + span * 140, easing = 'cubic-bezier(.55,0,.25,1)', opt = { duration: dur, easing, fill: 'forwards' };
    a.style.setProperty('--i', from); b.style.setProperty('--i', to);
    const lo = Math.min(from, to), hi = Math.max(from, to);
    n.style.left = (lo + 0.5) * w + 'px'; n.style.width = (hi - lo) * w + 'px';
    const pull = dir * w * 0.28, o1 = dir > 0 ? 'left center' : 'right center', o2 = dir > 0 ? 'right center' : 'left center';
    running.current = [
      a.animate([
        { transform: 'translateX(0) scale(1, 1)', opacity: 1 },
        { transform: `translateX(${pull}px) scale(.92, .9)`, opacity: 1, offset: 0.25 },
        { transform: `translateX(${pull * 1.6}px) scale(.42, .5)`, opacity: 1, offset: 0.62 },
        { transform: `translateX(${pull * 2}px) scale(.1, .2)`, opacity: 0 },
      ], opt),
      b.animate([
        { transform: `translateX(${-pull * 1.4}px) scale(.2, .3)`, opacity: 0 },
        { transform: `translateX(${-pull * 1.1}px) scale(.38, .5)`, opacity: 1, offset: 0.22 },
        { transform: `translateX(${-pull * 0.3}px) scale(1.06, .94)`, opacity: 1, offset: 0.7 },
        { transform: `translateX(${pull * 0.06}px) scale(.98, 1.03)`, opacity: 1, offset: 0.86 },
        { transform: 'translateX(0) scale(1, 1)', opacity: 1 },
      ], opt),
      n.animate([
        { transform: 'scale(.05, 1)', transformOrigin: o1, opacity: 1 },
        { transform: 'scale(1, .8)', transformOrigin: o1, opacity: 1, offset: 0.35 },
        { transform: 'scale(1, .25)', transformOrigin: o1, opacity: 1, offset: 0.68 },
        { transform: 'scale(0, .1)', transformOrigin: o2, opacity: 0 },
      ], opt),
    ];
    running.current[1].onfinish = () => {
      a.style.setProperty('--i', to);
      running.current.forEach((x) => x.cancel()); running.current = [];
    };
  }
  return { layer, A, B, N, go };
}

export function HeroSwitch() {
  const [sel, setSel] = useState(0);
  const tabs = useRef([]);
  const goo = useGoo();
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const select = (i, focus) => { setSel(i); goo.go(i); if (focus) tabs.current[i]?.focus(); };

  const submit = (kind) => (e) => {
    e.preventDefault();
    const f = e.currentTarget, care = f.elements.care.value, reg = f.elements.region.value;
    const q = new URLSearchParams(); if (care) q.set('care', care); if (reg) q.set('region', reg);
    // signed-in members go straight to the matching search in their portal, filters kept
    const portal = { need: 'family', hire: 'agency', give: 'caregiver' }[kind];
    if (user && roles.includes(portal)) { navigate(`/portal/${portal}/${kind === 'give' ? 'posts' : 'find'}` + (q.toString() ? '?' + q : '')); return; }
    if (kind === 'need') { q.set('role', 'family'); navigate('/join?' + q); }
    else if (kind === 'give') navigate('/requests' + (q.toString() ? '?' + q : ''));
    else { q.set('role', 'agency'); navigate('/join?' + q); }
  };

  return (
    <>
      <div className="audience-switch" role="tablist" aria-label="Choose your path">
        <span className="as-goo" ref={goo.layer} aria-hidden="true"><i className="as-blob as-a" ref={goo.A} /><i className="as-blob as-b" ref={goo.B} /><i className="as-neck" ref={goo.N} /></span>
        {TABS.map((t, i) => (
          <button key={t.key} ref={(el) => (tabs.current[i] = el)} role="tab" id={'tab-' + t.key} aria-selected={sel === i} aria-controls={'pane-' + t.key} tabIndex={sel === i ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % 3, true); }
              if (e.key === 'ArrowLeft') { e.preventDefault(); select((i + 2) % 3, true); }
            }}>
            <Icon name={t.icon} />{t.label}
          </button>
        ))}
      </div>
      <div className="search-panel">
        <div className="sp-viewport">
          {TABS.map((t, i) => {
            const p = PANES[t.key];
            return (
              <div key={t.key} className={'sp-pane' + (sel === i ? ' active' : '')} role="tabpanel" id={'pane-' + t.key} aria-labelledby={'tab-' + t.key}>
                <form className="sp-form" onSubmit={submit(t.key)}>
                  <div className="sp-field"><Icon name={p.careIcon} /><div className="sp-text"><label htmlFor={'h' + t.key + '-care'}>{p.careLabel}</label><select id={'h' + t.key + '-care'} name="care"><CareOptions any={p.careAny} /></select></div></div>
                  <div className="sp-field"><Icon name="pin" /><div className="sp-text"><label htmlFor={'h' + t.key + '-region'}>Region</label><select id={'h' + t.key + '-region'} name="region"><RegionOptions any={p.regAny} /></select></div></div>
                  <button className="btn btn-accent" type="submit"><Icon name="search" />{p.btn}</button>
                </form>
                <div className="sp-meta"><span className="sp-note"><Icon name={p.noteIcon} /><span>{p.note}</span></span><span className="badge badge-sand">{p.badge}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
