import { useMemo, useRef, useState } from 'react';
import MAP from '../data/ny-map.json';
import { REGIONS, GROUPS } from '../data/data.js';
import { Btn, PIcon } from './ui.jsx';

const BY_NAME = Object.fromEntries(MAP.regions.map((m) => [m.name, m.d]));
const TINT = { adirondacks: 't-a', 'finger-lakes': 't-a', catskills: 't-a', niagara: 't-b', 'central-new-york': 't-b', 'hudson-valley': 't-b' };
const METRO = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten-island', 'nassau', 'suffolk'];
const VB = { state: '0 0 1000 776', metro: '682 614 302 146' };

/**
 * Interactive New York map, synced with a checkbox list.
 *   value: region keys selected · onChange(keys)
 *   status(key) → 'paid' | 'trial' | undefined (colours + labels in the list)
 *   readOnly: map only shows, no picking
 */
export default function RegionPicker({ value = [], onChange, status, readOnly, listLabel = 'Regions', note }) {
  const [view, setView] = useState('state');
  const [tip, setTip] = useState(null);
  const [flash, setFlash] = useState(null);
  const stage = useRef(null);
  const sel = useMemo(() => new Set(value), [value]);

  const toggle = (k) => {
    if (readOnly) return;
    const next = sel.has(k) ? value.filter((x) => x !== k) : [...value, k];
    onChange(next);
    setFlash(k); setTimeout(() => setFlash((f) => (f === k ? null : f)), 520);
  };
  const setGroup = (g, on) => {
    const keys = REGIONS.filter((r) => r.g === g).map((r) => r.key);
    onChange(on ? [...new Set([...value, ...keys])] : value.filter((k) => !keys.includes(k)));
  };
  const move = (e, r) => {
    const box = stage.current.getBoundingClientRect();
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, name: r.name, on: sel.has(r.key) });
  };
  const shown = view === 'metro' ? REGIONS.filter((r) => METRO.includes(r.key)) : REGIONS;

  return (
    <div className="rmap">
      <div>
        <div ref={stage} className={'rmap-stage' + (view === 'metro' ? ' zoom' : '')} onMouseLeave={() => setTip(null)}>
          <svg viewBox={VB[view]} role="group" aria-label="Map of New York's 16 regions" preserveAspectRatio="xMidYMid meet">
            {view === 'state' && MAP.ctx.map((c) => <path key={c.ab} className="ctx" d={c.d} />)}
            {shown.map((r) => {
              const st = status?.(r.key);
              const cls = ['rg', TINT[r.key] || '', r.g !== 'up' ? r.g : '', sel.has(r.key) ? 'on' : '', st === 'paid' && !sel.has(r.key) ? 'paid' : '', flash === r.key ? 'pulse' : ''].join(' ');
              return (
                <path key={r.key} d={BY_NAME[r.name]} className={cls}
                  tabIndex={readOnly ? -1 : 0} role={readOnly ? undefined : 'checkbox'} aria-checked={readOnly ? undefined : sel.has(r.key)} aria-label={r.name}
                  onClick={() => toggle(r.key)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(r.key); } }}
                  onMouseMove={(e) => move(e, r)} />
              );
            })}
          </svg>
          <div className="rmap-tools">
            <Btn size="sm" variant="ghost" icon={view === 'state' ? 'search' : 'map'} onClick={() => { setView(view === 'state' ? 'metro' : 'state'); setTip(null); }}>
              {view === 'state' ? 'Zoom to NYC & Long Island' : 'Show all of New York'}
            </Btn>
          </div>
          <div className="rmap-legend" aria-hidden="true">
            <span><i style={{ background: 'var(--olive)' }} />Selected</span>
            {status && <span><i style={{ background: 'var(--success)' }} />Active</span>}
          </div>
          {tip && <div className="rmap-tip" style={{ left: tip.x, top: tip.y }}>{tip.name}{!readOnly && (tip.on ? ' · click to remove' : ' · click to add')}</div>}
        </div>
        {note && <p className="small muted" style={{ marginTop: 10 }}>{note}</p>}
      </div>
      <div className="rlist" aria-label={listLabel}>
        {['li', 'nyc', 'up'].map((g) => {
          const list = REGIONS.filter((r) => r.g === g);
          const all = list.every((r) => sel.has(r.key));
          return (
            <div className="rlist-g" key={g}>
              <h5>{GROUPS[g]}{!readOnly && <button type="button" onClick={() => setGroup(g, !all)}>{all ? 'Clear' : 'Select all'}</button>}</h5>
              {list.map((r) => {
                const st = status?.(r.key);
                return (
                  <label key={r.key} className={'rck' + (sel.has(r.key) ? ' on' : '') + (flash === r.key ? ' flash' : '')}>
                    <input type="checkbox" checked={sel.has(r.key)} disabled={readOnly} onChange={() => toggle(r.key)} />
                    {r.name}
                    {st && <span className="rck-end">{st === 'paid' ? <><PIcon name="checkCircle" className="pi-sm" style={{ color: 'var(--success)', verticalAlign: -3 }} /> Active</> : st === 'trial' ? 'Free trial' : st}</span>}
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
