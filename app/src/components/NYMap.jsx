import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { REGIONS, R, REQUESTS } from '../data/data.js';
import { REDUCED } from '../lib/hooks.js';
import { Icon } from './Icon.jsx';
import MAP from '../data/ny-map.json';

const LABEL_POS = {
  manhattan: { x: 711.5, y: 702, anchor: 'end', leader: [712.5, 702, 720.5, 705.5] },
  'staten-island': { x: 699, y: 763, anchor: 'middle' },
  brooklyn: { x: 727, y: 734 }, queens: { x: 745, y: 722 }, bronx: { x: 737, y: 698 },
  nassau: { x: 770, y: 718 }, suffolk: { x: 862, y: 694 },
  'thousand-islands': { x: 528, y: 150 }, 'hudson-valley': { x: 712, y: 548 },
  'capital-region': { x: 744, y: 360 }, 'central-new-york': { x: 563, y: 372 },
};
const ZOOM_KEYS = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten-island', 'nassau', 'suffolk'];
const CTX_LABELS = [['PENNSYLVANIA', 360, 610], ['NEW JERSEY', 640, 680], ['CONN.', 868, 580], ['MASS.', 900, 450], ['VERMONT', 845, 160]];
const WATER_LABELS = [['Lake Ontario', 300, 215, 0], ['Lake Erie', 52, 395, -38], ['Long Island Sound', 842, 662, -10]];
const TINT = { adirondacks: 'a', 'finger-lakes': 'a', catskills: 'a', niagara: 'b', 'central-new-york': 'b', 'hudson-valley': 'b', 'chautauqua-allegheny': 'c', 'thousand-islands': 'c', 'capital-region': 'c' };
const VB_STATE = [0, 0, MAP.w, MAP.h];
const GEO = Object.fromEntries(MAP.regions.map((m) => [m.name, m.d]));
const area = (r) => (r.bbox[2] - r.bbox[0]) * (r.bbox[3] - r.bbox[1]);
const DRAW = REGIONS.filter((r) => r.g === 'up').concat(REGIONS.filter((r) => r.g !== 'up').sort((a, b) => area(b) - area(a)));
const nCounties = (r) => r.counties.length + (r.counties.length === 1 ? ' county' : ' counties');

function Panel({ r, onPick }) {
  if (!r) {
    return (
      <aside className="region-panel" aria-live="polite" aria-label="Region details">
        <div className="rp-head rp-fade" key="none">
          <div className="rp-group"><span className="badge"><Icon name="map" className="i-sm" />New York State</span></div>
          <h3 className="rp-name">Choose a region</h3>
          <p className="rp-desc">Sixteen regions, from Montauk to Chautauqua. Select one on the map, or open the NYC &amp; Long Island view for the five boroughs.</p>
        </div>
        <div className="rp-body rp-fade">
          <div className="rp-empty-stats"><div><strong>16</strong><span>regions</span></div><div><strong>62</strong><span>counties</span></div><div><strong>3</strong><span>areas</span></div></div>
          <div className="rp-label">Popular right now</div>
          <div className="rp-counties">{['suffolk', 'brooklyn', 'hudson-valley', 'finger-lakes'].map((k) => <button key={k} className="rl-chip" type="button" onClick={() => onPick(k)}>{R[k].name}</button>)}</div>
          <div className="rp-spacer" />
          <div className="rp-actions"><a className="btn btn-accent btn-block" href="/join?role=family"><Icon name="heart" />Find care</a><a className="btn btn-ghost btn-block" href="/membership"><Icon name="steth" />Work in a region</a></div>
          <div className="rp-price"><div>Families<strong>Free</strong></div><div>Caregivers<strong>$8.99 / region</strong></div></div>
        </div>
      </aside>
    );
  }
  const n = REQUESTS.filter((q) => q.region === r.key).length;
  return (
    <aside className="region-panel" aria-live="polite" aria-label="Region details">
      <div className="rp-head rp-fade" key={r.key}>
        <div className="rp-group"><span className="badge badge-sand"><Icon name="pin" className="i-sm" />{r.group}</span><span className="badge badge-line">{nCounties(r)}</span></div>
        <h3 className="rp-name">{r.name}</h3>
        <p className="rp-desc">{r.desc}</p>
      </div>
      <div className="rp-body rp-fade" key={r.key + 'b'}>
        <div className="rp-label">{r.counties.length === 1 ? 'County' : 'Counties'}</div>
        <div className="rp-counties">{r.countyChips.map((c) => <span key={c} className="chip">{c}</span>)}</div>
        <div className="rp-reqs">
          <Icon name="lock" />
          <div><strong>{n ? `${n} open request${n === 1 ? '' : 's'}` : 'No open requests yet'}</strong><span>{n ? `Details unlock with ${r.name} Region Access.` : 'Be the first family to post here, free.'}</span></div>
          {n > 0 && <a className="link-arrow" href={'/requests?region=' + r.key}>View<Icon name="arrow" /></a>}
        </div>
        <div className="rp-spacer" />
        <div className="rp-actions"><a className="btn btn-accent btn-block" href={'/join?role=family&region=' + r.key}><Icon name="heart" />Find care here</a><a className="btn btn-ghost btn-block" href={'/membership?region=' + r.key}><Icon name="steth" />Work in this region</a></div>
        <div className="rp-price"><div>Families<strong>Free, always</strong></div><div>Caregivers<strong>$8.99 / mo</strong></div></div>
      </div>
    </aside>
  );
}

export default function NYMap() {
  const svg = useRef(null), tip = useRef(null), labels = useRef({});
  const vb = useRef(VB_STATE.slice()), anim = useRef(0);
  const [selected, setSelected] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [revealed, setRevealed] = useState(REDUCED);

  const scaleNow = () => { const el = svg.current, w = el.clientWidth || 800, h = el.clientHeight || 600; return Math.min(w / vb.current[2], h / vb.current[3]); };
  const zoomBox = () => {
    const w = svg.current.clientWidth, aspect = MAP.h / MAP.w;
    if (w < 600) { const zw = 200; return [674, 722 - (zw * aspect) / 2 + 4, zw, zw * aspect]; }
    const zw = 336; return [667, 706 - (zw * aspect) / 2, zw, zw * aspect];
  };

  /* Hide labels that don't fit their region or collide with another (measured in screen px). */
  const updateLabels = useCallback(() => {
    const el = svg.current; if (!el) return;
    const s = scaleNow(), fs = 12.5 / s, halo = 3.2 / s, v = vb.current, placed = [];
    const isZoomed = el.classList.contains('is-zoomed');
    REGIONS.slice().sort((a, b) => area(b) - area(a)).forEach((r) => {
      const L = labels.current[r.key]; if (!L) return;
      const t = L.text;
      t.setAttribute('font-size', fs.toFixed(3)); t.setAttribute('stroke-width', halo.toFixed(3));
      let show = isZoomed ? ZOOM_KEYS.includes(r.key) : r.g === 'up' || r.key === 'suffolk';
      if (show) {
        const w = t.getComputedTextLength() * s, h = 13, rw = (r.bbox[2] - r.bbox[0]) * s;
        const manual = LABEL_POS[r.key] && (LABEL_POS[r.key].leader || r.key === 'staten-island');
        if (!manual && w > rw * 1.02) show = false;
        const x = (Number(t.getAttribute('x')) - v[0]) * s, y = (Number(t.getAttribute('y')) - v[1]) * s;
        const anchor = t.getAttribute('text-anchor');
        const x0 = anchor === 'end' ? x - w : anchor === 'middle' || !anchor ? x - w / 2 : x;
        const box = [x0 - 3, y - h, x0 + w + 3, y + 4];
        if (show && placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1])) show = false;
        if (show) placed.push(box);
      }
      t.classList.toggle('hidden', !show);
      if (L.line) L.line.classList.toggle('hidden', !show);
    });
  }, []);

  const setVB = useCallback((box) => {
    vb.current = box;
    svg.current.setAttribute('viewBox', box.map((n) => n.toFixed(2)).join(' '));
    updateLabels();
  }, [updateLabels]);

  const animateTo = useCallback((to) => {
    cancelAnimationFrame(anim.current);
    const from = vb.current.slice(), dur = REDUCED ? 0 : 750; let t0 = null;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (ts) => {
      if (t0 === null) t0 = ts;
      const p = dur ? Math.min(1, (ts - t0) / dur) : 1, e = ease(p);
      setVB(from.map((n, i) => n + (to[i] - n) * e));
      if (p < 1) anim.current = requestAnimationFrame(step); else { anim.current = 0; setScale(scaleNow()); }
    };
    anim.current = requestAnimationFrame(step);
  }, [setVB]);

  // initial viewBox + reveal + resize handling
  useLayoutEffect(() => { setVB(VB_STATE.slice()); setScale(scaleNow()); }, [setVB]);
  useEffect(() => {
    const el = svg.current;
    let io;
    if (!revealed && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { setRevealed(true); io.disconnect(); } }, { threshold: 0.2 });
      io.observe(el);
    } else setRevealed(true);
    let t;
    const relayout = () => { clearTimeout(t); t = setTimeout(() => { if (!el.clientWidth || anim.current) return; if (el.classList.contains('is-zoomed')) setVB(zoomBox()); else updateLabels(); setScale(scaleNow()); }, 80); };
    const ro = 'ResizeObserver' in window ? new ResizeObserver(relayout) : null;
    ro?.observe(el); window.addEventListener('resize', relayout);
    return () => { io?.disconnect(); ro?.disconnect(); window.removeEventListener('resize', relayout); clearTimeout(t); cancelAnimationFrame(anim.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setZoom = useCallback((z) => {
    setZoomed((cur) => {
      if (cur === z) return cur;
      svg.current.classList.toggle('is-zoomed', z);
      animateTo(z ? zoomBox() : VB_STATE.slice());
      return z;
    });
  }, [animateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = useCallback((key) => {
    const r = R[key]; if (!r) return;
    setSelected(key);
    setZoom(r.g !== 'up');
  }, [setZoom]);

  const showTip = (r, x, y) => {
    const t = tip.current; if (!t) return;
    t.innerHTML = '';
    const s = document.createElement('strong'); s.textContent = r.name; t.append(s, `${r.group} · `);
    const sp = document.createElement('span'); sp.textContent = nCounties(r); t.append(sp);
    t.style.left = x + 'px'; t.style.top = y + 'px'; t.classList.add('show');
  };
  const hideTip = () => tip.current?.classList.remove('show');

  const sel = selected ? R[selected] : null;
  const labelNodes = useMemo(() => REGIONS.map((r) => {
    const lp = LABEL_POS[r.key] || {};
    const x = lp.x ?? r.c[0], y = lp.y ?? r.c[1];
    const onDark = r.g === 'nyc' && !lp.leader && r.key !== 'staten-island';
    return (
      <g key={r.key}>
        {lp.leader && <line ref={(el) => { labels.current[r.key] = { ...(labels.current[r.key] || {}), line: el }; }} x1={lp.leader[0]} y1={lp.leader[1]} x2={lp.leader[2]} y2={lp.leader[3]} />}
        <text ref={(el) => { labels.current[r.key] = { ...(labels.current[r.key] || {}), text: el }; }} x={x} y={y} textAnchor={lp.anchor || 'middle'} dominantBaseline="middle" className={onDark ? 'on-dark' : undefined}>{r.name}</text>
      </g>
    );
  }), []);

  return (
    <div className="map-row">
      <div className="map-card">
        <div className="map-toolbar">
          <div className="map-crumbs">
            <Icon name="map" className="i-sm" />
            {zoomed ? <><span>New York State</span><Icon name="chev" className="i-sm" style={{ transform: 'rotate(-90deg)' }} /><strong>NYC &amp; Long Island</strong></>
              : <><strong>New York State</strong><span>· 16 regions · 62 counties</span></>}
          </div>
          <div className="map-tools">
            <div className="map-legend" aria-hidden="true"><span><i className="lg-li" />Long Island</span><span><i className="lg-nyc" />NYC</span><span><i className="lg-up" />Upstate</span></div>
            <button className="map-back" type="button" hidden={!zoomed} onClick={() => setZoom(false)}><Icon name="back" className="i-sm" />Back to state</button>
          </div>
        </div>
        <div className="map-stage">
          <svg ref={svg} className={'map-svg' + (revealed ? ' revealed' : '')} role="group" preserveAspectRatio="xMidYMid meet" style={{ aspectRatio: `${MAP.w} / ${MAP.h}` }}
            aria-label="Map of New York State's 16 Karing4Life regions. Use Tab to move between regions and Enter to select.">
            <g className="ctx" aria-hidden="true">
              {MAP.ctx.map((c, i) => <path key={i} className="ctx-state" d={c.d} />)}
              {WATER_LABELS.map((w) => <text key={w[0]} className="water-label" x={w[1]} y={w[2]} textAnchor="middle" transform={`rotate(${w[3]} ${w[1]} ${w[2]})`}>{w[0]}</text>)}
              {CTX_LABELS.map((w) => <text key={w[0]} className="ctx-label" x={w[1]} y={w[2]} textAnchor="middle">{w[0]}</text>)}
            </g>
            <g>
              {DRAW.map((r, i) => (
                <g key={r.key} className={'region r-anim' + (selected === r.key ? ' selected' : '')} data-key={r.key} data-group={r.g} data-tint={TINT[r.key] || ''}
                  tabIndex={0} role="button" aria-pressed={selected === r.key} aria-label={`${r.name}, ${r.group}, ${nCounties(r)}`}
                  style={{ transitionDelay: revealed && !REDUCED ? i * 55 + 'ms' : '0ms' }}
                  onPointerMove={(e) => { if (e.pointerType !== 'touch') showTip(r, e.clientX, e.clientY); }}
                  onPointerLeave={hideTip}
                  onClick={() => { hideTip(); select(r.key); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.key); } }}
                  onFocus={(e) => { e.currentTarget.classList.add('hover'); const b = e.currentTarget.getBoundingClientRect(); showTip(r, b.left + b.width / 2, b.top + 4); }}
                  onBlur={(e) => { e.currentTarget.classList.remove('hover'); hideTip(); }}>
                  <path className="r-fill" d={GEO[r.name]} />
                  {r.g !== 'up' && <path className="r-hit" d={GEO[r.name]} />}
                </g>
              ))}
            </g>
            <rect className="inset-frame" x="688" y="684" width="300" height="76" rx="6" style={{ opacity: zoomed ? 0 : 1 }} />
            <g className="region-labels" aria-hidden="true">{labelNodes}</g>
            {sel && (
              <g className="map-pulse" key={sel.key + scale.toFixed(3)} aria-hidden="true">
                <circle className="pulse" cx={sel.c[0]} cy={sel.c[1]} r={7 / scale} strokeWidth="3">
                  {!REDUCED && <><animate attributeName="r" from={7 / scale} to={34 / scale} dur="1.6s" repeatCount="indefinite" /><animate attributeName="opacity" from="1" to="0" dur="1.6s" repeatCount="indefinite" /></>}
                </circle>
                <circle className="pulse-core" cx={sel.c[0]} cy={sel.c[1]} r={6 / scale} />
              </g>
            )}
          </svg>
          <button className={'map-inset' + (zoomed ? ' gone' : '')} type="button" aria-label="Zoom into New York City and Long Island" onClick={() => setZoom(true)}>
            <svg aria-hidden="true" viewBox="676 662 314 110" preserveAspectRatio="xMidYMid meet">
              {MAP.ctx.filter((c) => c.ab === 'NJ' || c.ab === 'CT').map((c, i) => <path key={i} className="ctx-state" d={c.d} />)}
              {REGIONS.filter((r) => r.g !== 'up' || r.key === 'hudson-valley').map((r) => (
                <g key={r.key} className={'region' + (selected === r.key ? ' selected' : '')} data-key={r.key} data-group={r.g} data-tint={TINT[r.key] || ''}><path className="r-fill" d={GEO[r.name]} /></g>
              ))}
            </svg>
            <span className="mi-cap">NYC &amp; Long Island <Icon name="zoom" /></span>
          </button>
          <span className="map-hint"><Icon name="info" />Click a region · Tab + Enter works too</span>
        </div>
      </div>
      <Panel r={sel} onPick={select} />
      {createPortal(<div className="map-tooltip" ref={tip} role="tooltip" />, document.body)}
    </div>
  );
}
