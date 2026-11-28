import { useMemo, useState } from 'react';
import { REGIONS, GROUPS, R } from '../data/data.js';
import { PIcon } from './ui.jsx';
import RegionMap from '../components/RegionMap.jsx';
import { toast } from '../lib/toast.jsx';

/**
 * Real New York map (MapLibre + OpenStreetMap) synced with a checkbox list.
 *   value: region keys · onChange(keys) · status(key) → 'paid' | 'trial'
 *   search: show "find my address" (adds the region it falls in)
 */
export default function RegionPicker({ value = [], onChange, status, courtesy, readOnly, listLabel = 'Regions', note, search = true, onAddress }) {
  const [flash, setFlash] = useState(null);
  const sel = useMemo(() => new Set(value), [value]);
  const ping = (k) => { setFlash(k); setTimeout(() => setFlash((f) => (f === k ? null : f)), 600); };

  const change = (next) => {
    const added = next.find((k) => !value.includes(k));
    if (added) ping(added);
    onChange(next);
  };
  const toggle = (k) => { if (!readOnly) change(sel.has(k) ? value.filter((x) => x !== k) : [...value, k]); };
  const setGroup = (g, on) => {
    const keys = REGIONS.filter((r) => r.g === g).map((r) => r.key);
    onChange(on ? [...new Set([...value, ...keys])] : value.filter((k) => !keys.includes(k)));
  };
  const address = (a) => {
    onAddress?.(a);
    if (!a.region) { toast.error('That address is outside New York State'); return; }
    if (!sel.has(a.region) && !readOnly) { change([...value, a.region]); toast(`${R[a.region].name} added`, 'Based on the address you searched.'); }
    else toast(`That’s in ${R[a.region].name}`);
  };

  return (
    <div className="rmap">
      <div>
        <div className="rmap-stage">
          <RegionMap mode="multi" value={value} onChange={readOnly ? undefined : change} status={status} readOnly={readOnly} search={search} onAddress={address} />
        </div>
        {note && <p className="small muted" style={{ marginTop: 10 }}>{note}</p>}
      </div>
      <div className="rlist" aria-label={listLabel}>
        {['li', 'nyc', 'up'].map((g) => {
          const list = REGIONS.filter((r) => r.g === g);
          const all = list.every((r) => sel.has(r.key));
          return (
            <div className="rlist-g" key={g}>
              <h2>{GROUPS[g]}{!readOnly && <button type="button" onClick={() => setGroup(g, !all)}>{all ? 'Clear' : 'Select all'}</button>}</h2>
              <div className={list.length > 1 ? 'rlist-items' : undefined}>
              {list.map((r) => {
                const st = status?.(r.key);
                return (
                  <label key={r.key} className={'rck' + (sel.has(r.key) ? ' on' : '') + (flash === r.key ? ' flash' : '')}>
                    <input type="checkbox" checked={sel.has(r.key)} disabled={readOnly} onChange={() => toggle(r.key)} />
                    <span className="rck-box" aria-hidden="true"><PIcon name="check" /></span>
                    {r.name}
                    {st && <span className={'rck-end ' + st} data-tip={st === 'paid' ? (courtesy?.has(r.key) ? 'Courtesy region, free from our team' : 'Active subscription') : 'Free during your trial'} data-tip-pos="left">{st === 'paid' ? <PIcon name="checkCircle" className="pi-sm" /> : 'Trial'}</span>}
                  </label>
                );
              })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
