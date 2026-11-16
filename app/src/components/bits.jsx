import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CARE, GROUPS, REGIONS, STEPS, MOCK } from '../data/data.js';
import { LOGOS, useTheme } from '../lib/theme.jsx';
import { REDUCED } from '../lib/hooks.js';
import { Icon } from './Icon.jsx';

export { Icon };

export function LogoImg({ alt = 'Karing4Life logo', ...rest }) {
  const { palette } = useTheme();
  return <img src={LOGOS[palette]} alt={alt} decoding="async" {...rest} />;
}

export function CareOptions({ any = 'Any' }) {
  return (
    <>
      <option value="">{any}</option>
      <optgroup label="Skilled care">{CARE.filter((c) => c.g === 'skilled').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</optgroup>
      <optgroup label="Non-skilled care">{CARE.filter((c) => c.g === 'nonskilled').map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</optgroup>
    </>
  );
}

export function RegionOptions({ any = 'Any' }) {
  return (
    <>
      <option value="">{any}</option>
      {['li', 'nyc', 'up'].map((g) => (
        <optgroup key={g} label={GROUPS[g]}>{REGIONS.filter((r) => r.g === g).map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</optgroup>
      ))}
    </>
  );
}

export function CareTiles({ group }) {
  const list = CARE.filter((c) => c.g === group);
  return (
    <div className="care-tiles">
      {list.map((c, i) => (
        <a key={c.key} className={'care-tile' + (list.length % 2 === 1 && i === list.length - 1 ? ' full' : '')} href={'/requests?care=' + c.key}>
          <span className="icon-square"><Icon name={c.icon} /></span>
          <span><span className="ct-title">{c.label}</span><span className="ct-desc">{c.desc}</span></span>
          <span className="ct-go"><Icon name="arrow" className="i-sm" /></span>
        </a>
      ))}
    </div>
  );
}

export function Examples() {
  return (
    <div className="example-grid">
      <article className="ex-card reveal">
        <span className="ex-flag">Example</span>
        <div className="ex-kind"><Icon name="heart" />Family request</div>
        <div className="ex-head"><span className="avatar lg">AR</span><div><h3>Care for Dad, 79</h3><div className="ex-meta"><span><Icon name="pin" />Patchogue · Suffolk</span><span><Icon name="user" />Posted by Ana R.</span></div></div></div>
        <p className="ex-body">Looking for weekday afternoons: companionship plus light mobility support. Dog-friendly home, and Spanish is a plus.</p>
        <div className="ex-tags"><span className="tag">20 hrs / wk</span><span className="tag">Starting Oct</span><span className="tag">Companion + Personal</span></div>
        <div className="ex-spacer" />
        <div className="ex-foot"><span className="ex-fi"><Icon name="lock" className="i-sm" />Address never shown</span><span className="ex-fi"><Icon name="users" className="i-sm" />4 of 10 free contacts used</span></div>
      </article>
      <article className="ex-card reveal">
        <span className="ex-flag">Example</span>
        <div className="ex-kind"><Icon name="steth" />Caregiver profile</div>
        <div className="ex-head"><span className="avatar lg olive">DM</span><div><h3>Denise M., CNA</h3><div className="ex-meta"><span><Icon name="pin" />Islip · Suffolk</span><span className="verified"><Icon name="shield" />Verified</span></div></div></div>
        <p className="ex-body">Eleven years in senior care and post-hospital recovery. References available, and has her own transportation.</p>
        <div className="ex-tags"><span className="tag">From $28 / hr</span><span className="tag">Weekdays</span><span className="tag">Verified</span></div>
        <div className="ex-spacer" />
        <div className="ex-foot"><span className="status-pill"><span className="dot dot-available" />Available</span><span className="ex-fi"><Icon name="car" className="i-sm" />Own transportation</span></div>
      </article>
    </div>
  );
}

export function RegionCloud() {
  return <>{REGIONS.map((r) => <span key={r.key} className="chip"><Icon name="pin" className="i-sm" />{r.name}</span>)}</>;
}

export function RegionChips({ prefix }) {
  return <>{REGIONS.map((r) => <label key={r.key} className="chk-chip"><input type="checkbox" name={prefix + 'reg'} value={r.key} /><span>{r.name}</span></label>)}</>;
}

/* ---- "How it works" toggle + steps share state per id ---- */
const howState = new Map(), howSubs = new Set();
export function setHow(id, v) { howState.set(id, v); howSubs.forEach((f) => f()); }
function useHow(id) {
  return useSyncExternalStore((f) => { howSubs.add(f); return () => howSubs.delete(f); }, () => howState.get(id) || 'families');
}
const HOW_KEYS = ['families', 'caregivers', 'agencies'];

export function HowToggle({ id }) {
  const cur = useHow(id);
  const refs = useRef([]);
  const go = (i, focus) => { setHow(id, HOW_KEYS[i]); if (focus) refs.current[i]?.focus(); };
  return (
    <div className="how-toggle" role="tablist" aria-label="Show steps for">
      {HOW_KEYS.map((k, i) => (
        <button key={k} ref={(el) => (refs.current[i] = el)} role="tab" aria-selected={cur === k} tabIndex={cur === k ? 0 : -1}
          onClick={() => go(i)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); go((i + 1) % 3, true); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); go((i + 2) % 3, true); }
          }}>{k[0].toUpperCase() + k.slice(1)}</button>
      ))}
    </div>
  );
}

export function HowSteps({ id }) {
  const cur = useHow(id);
  const ref = useRef(null);
  const [drawn, setDrawn] = useState(REDUCED);
  useEffect(() => {
    if (drawn || !('IntersectionObserver' in window)) { setDrawn(true); return; }
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // replay the line drawing when the audience changes
  const [tick, setTick] = useState(0);
  useEffect(() => { if (!REDUCED) setTick((t) => t + 1); }, [cur]);
  return (
    <div ref={ref} key={tick} className={'how-wrap' + (drawn ? ' drawn' : '')}>
      <div className="how-set active" role="tabpanel">
        {/* connector runs through the centres of the step icons */}
        <div className="how-line" aria-hidden="true">
          <svg viewBox="0 0 1000 2" preserveAspectRatio="none"><line className="hl-base" x1="0" y1="1" x2="1000" y2="1" /><line className="hl-draw" x1="0" y1="1" x2="1000" y2="1" /></svg>
        </div>
        {STEPS[cur].map((s, i) => (
          <div className="how-step" key={s[1]}>
            <span className="step-icon"><Icon name={s[0]} /><span className="step-num">{i + 1}</span></span>
            <h3>{s[1]}</h3>
            <p>{s[2]}</p>
            {/* static, authored markup */}
            <div className="mock" dangerouslySetInnerHTML={{ __html: MOCK[s[3]] }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Call-to-action band: big tile on top, two below (or two side by side) ---- */
export function CtaBand({ id, title, accent, text, tiles }) {
  return (
    <section className="cta-band screen" aria-labelledby={id}>
      <div className="container">
        <div className="cta-inner">
          <div className="cta-text reveal">
            <div className="cta-top">
              <span className="eyebrow cta-eyebrow">Get started</span>
              <h2 id={id}>{title} <span className="serif">{accent}</span></h2>
            </div>
            <div className="cta-bottom">
              {text && <p>{text}</p>}
              <ul className="cta-facts">
                <li><Icon name="heart" />Free for families</li>
                <li><Icon name="shield" />Verified caregivers</li>
                <li><Icon name="pin" />All 16 NY regions</li>
              </ul>
            </div>
          </div>
          <div className={'cta-tiles reveal n' + tiles.length}>
            {tiles.map((t, i) => (
              <a key={t.href + i} className={'cta-tile ' + (t.tone || 'glass')} href={t.href}>
                <span className="ct-icon"><Icon name={t.icon} /></span>
                <span className="ct-copy"><strong>{t.label}</strong>{t.sub && <span>{t.sub}</span>}</span>
                <span className="ct-arrow"><Icon name="arrow" /></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const AUDIENCE_TILES = [
  { href: '/join?role=family', icon: 'heart', label: "I'm a family", sub: 'Post a free care request and hear from verified caregivers near you.', tone: 'light' },
  { href: '/join?role=caregiver', icon: 'steth', label: "I'm a caregiver or nurse", sub: '14 days free in every region, then $8.99 a month per region.', tone: 'accent' },
  { href: '/join?role=agency', icon: 'building', label: "I'm an agency or facility", sub: 'Recruit verified caregivers for $49.99 a month per region.', tone: 'glass' },
];
