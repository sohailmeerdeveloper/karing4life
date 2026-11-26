import { useCallback, useEffect, useRef, useState } from 'react';
import { REDUCED } from '../lib/hooks.js';
import { Icon } from './Icon.jsx';
import './regionmap.css';

/*
  Interactive New York map: OpenStreetMap data via OpenFreeMap (free, open source, no API key),
  drawn with MapLibre GL (the open-source fork of Mapbox GL). The 16 Karing4Life regions are
  dissolved from US Census county boundaries (public/maps/*.geojson, built by scripts/build-regions.mjs).

  Props
    mode       'single' | 'multi'
    value      key (single) or array of keys (multi)
    onChange   (next) => void
    status     (key) => 'paid' | 'trial' | undefined   (green fill for active regions)
    search     show the address search box
    onAddress  ({ label, town, zip, lat, lon, region }) => void
    readOnly   map only, no picking
*/
export const STYLE = 'https://tiles.openfreemap.org/styles/liberty';
export const NY_BOUNDS = [[-79.9, 40.45], [-71.75, 45.1]];
export const METRO_BOUNDS = [[-74.3, 40.48], [-71.8, 41.2]];
export const NYC_BOUNDS = [[-74.26, 40.49], [-73.69, 40.92]];
const METRO = new Set(['manhattan', 'brooklyn', 'queens', 'bronx', 'staten-island', 'nassau', 'suffolk']);
const NYC = new Set(['manhattan', 'brooklyn', 'queens', 'bronx', 'staten-island']);

let geoCache = null;
export function loadGeo() {
  if (!geoCache) {
    geoCache = Promise.all(['ny-regions', 'ny-labels', 'ny-mask'].map((f) => fetch(`/maps/${f}.geojson`).then((r) => r.json())))
      .then(([regions, labels, mask]) => ({ regions, labels, mask }));
    geoCache.catch(() => { geoCache = null; });
  }
  return geoCache;
}

/* --- geometry helpers (no extra libraries) --- */
function ringContains(ring, [x, y]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polysOf(g) { return g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; }
/** Which region contains [lon, lat]? */
export async function regionAt(lon, lat) {
  const { regions } = await loadGeo();
  const f = regions.features.find((ft) => polysOf(ft.geometry).some((p) => ringContains(p[0], [lon, lat]) && !p.slice(1).some((h) => ringContains(h, [lon, lat]))));
  return f?.properties.key || null;
}
function bboxOf(g) {
  let a = 180, b = 90, c = -180, d = -90;
  polysOf(g).forEach((p) => p[0].forEach(([x, y]) => { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }));
  return [[a, b], [c, d]];
}

/* --- address search (Photon by Komoot: open source geocoder over OpenStreetMap) --- */
export async function geocode(q, signal) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=-79.8,40.45,-71.8,45.05`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('search');
  const j = await res.json();
  return j.features
    .filter((f) => !f.properties.state || f.properties.state === 'New York')
    .map((f) => {
      const p = f.properties;
      const line1 = [p.housenumber, p.street || p.name].filter(Boolean).join(' ');
      const town = p.city || p.town || p.village || p.district || p.county || '';
      return { label: [line1, town, p.postcode].filter(Boolean).join(', '), line1, town, zip: p.postcode || '', lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
    });
}

export function AddressSearch({ onPick, placeholder = 'Search an address, town or ZIP', autoFocus }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const ctl = useRef(null);
  const picked = useRef(false);
  useEffect(() => {
    if (picked.current) { picked.current = false; return undefined; }
    if (q.trim().length < 3) { setItems([]); return undefined; }
    const t = setTimeout(async () => {
      ctl.current?.abort(); ctl.current = new AbortController();
      setBusy(true);
      try { setItems(await geocode(q.trim(), ctl.current.signal)); setOpen(true); setActive(-1); } catch { /* aborted or offline */ }
      setBusy(false);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);
  const pick = async (it) => { picked.current = true; setOpen(false); setItems([]); setQ(it.label); onPick({ ...it, region: await regionAt(it.lon, it.lat) }); };
  return (
    <div className="addr" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <Icon name="search" className="i-sm addr-ic" />
      <input className="addr-in" value={q} placeholder={placeholder} autoFocus={autoFocus} autoComplete="street-address" aria-label="Search an address" aria-expanded={open} role="combobox" aria-autocomplete="list"
        onChange={(e) => setQ(e.target.value)} onFocus={() => items.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); pick(items[Math.max(0, active)]); }
          else if (e.key === 'Escape') setOpen(false);
        }} />
      {busy && <span className="addr-spin" aria-hidden="true" />}
      {open && items.length > 0 && (
        <ul className="addr-list" role="listbox">
          {items.map((it, i) => (
            <li key={it.label + i} role="option" aria-selected={i === active}>
              <button type="button" className={i === active ? 'on' : ''} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(it)}><Icon name="pin" className="i-sm" />{it.label}</button>
            </li>
          ))}
        </ul>
      )}
      {open && !busy && q.trim().length >= 3 && items.length === 0 && !picked.current && <div className="addr-list addr-empty">No New York matches. Try a town or ZIP.</div>}
    </div>
  );
}

const css = (name, fb) => (typeof window === 'undefined' ? fb : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb);

export default function RegionMap({ mode = 'single', value, onChange, status, search, onAddress, readOnly, height, onHover, flyOnSelect = mode === 'single', className = '' }) {
  const box = useRef(null);
  const map = useRef(null);
  const lib = useRef(null);
  const geo = useRef(null);
  const hoverId = useRef(null);
  const marker = useRef(null);
  const skipFly = useRef(false);
  const props = useRef({});
  props.current = { mode, value, onChange, status, readOnly, onHover, flyOnSelect };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tip, setTip] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(6);

  const fly = useCallback((bounds, opts = {}) => {
    map.current?.fitBounds(bounds, { padding: 32, duration: REDUCED ? 0 : 1100, essential: true, ...opts });
  }, []);
  const showMetro = useCallback(() => { fly(METRO_BOUNDS); setZoomed(true); }, [fly]);
  const showNyc = useCallback(() => { fly(NYC_BOUNDS, { padding: 24 }); setZoomed(true); }, [fly]);
  const showState = useCallback(() => { fly(NY_BOUNDS, { padding: 16 }); setZoomed(false); }, [fly]);

  // create the map once
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [{ default: maplibregl }, data] = await Promise.all([import('maplibre-gl'), loadGeo(), import('maplibre-gl/dist/maplibre-gl.css')]);
        if (dead || !box.current) return;
        lib.current = maplibregl; geo.current = data;
        const m = new maplibregl.Map({
          container: box.current, style: STYLE, bounds: NY_BOUNDS, fitBoundsOptions: { padding: 16 },
          maxBounds: [[-84, 38.6], [-67.5, 47.4]], minZoom: 4, maxZoom: 17, attributionControl: { compact: true },
          cooperativeGestures: true, dragRotate: false, pitchWithRotate: false, touchPitch: false,
        });
        map.current = m;
        if (import.meta.env.DEV) window.__rm = m;
        m.touchZoomRotate.disableRotation();
        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
        m.on('load', () => {
          if (dead) return;
          const olive = css('--olive', '#606C38'), sand = css('--sand', '#DDA15E'), rust = css('--rust-ink', '#A85D1E'), ok = css('--ok', '#4E8A3A'), cream = css('--cream', '#FEFAE0'), ink = css('--ink', '#283618');
          const firstSymbol = m.getStyle().layers.find((l) => l.type === 'symbol')?.id;
          m.addSource('k-regions', { type: 'geojson', data: data.regions, promoteId: 'key' });
          m.addSource('k-mask', { type: 'geojson', data: data.mask });
          m.addSource('k-labels', { type: 'geojson', data: data.labels });
          m.addLayer({ id: 'k-mask', type: 'fill', source: 'k-mask', paint: { 'fill-color': cream, 'fill-opacity': 0.72 } }, firstSymbol);
          m.addLayer({
            id: 'k-fill', type: 'fill', source: 'k-regions',
            paint: {
              'fill-color': ['case',
                ['boolean', ['feature-state', 'selected'], false], olive,
                ['boolean', ['feature-state', 'hover'], false], sand,
                ['boolean', ['feature-state', 'paid'], false], ok,
                ['match', ['get', 'key'],
                  ['adirondacks', 'finger-lakes', 'catskills'], '#B9C48A',
                  ['niagara', 'central-new-york', 'hudson-valley'], '#A9B57A',
                  ['chautauqua-allegheny', 'thousand-islands', 'capital-region'], '#CBD3A2',
                  '#7F8F4E']],
              'fill-opacity': ['interpolate', ['linear'], ['zoom'],
                6, ['case', ['boolean', ['feature-state', 'selected'], false], 0.62, ['boolean', ['feature-state', 'hover'], false], 0.55, ['boolean', ['feature-state', 'paid'], false], 0.42, 0.42],
                9, ['case', ['boolean', ['feature-state', 'selected'], false], 0.48, ['boolean', ['feature-state', 'hover'], false], 0.4, ['boolean', ['feature-state', 'paid'], false], 0.3, 0.2],
                12, ['case', ['boolean', ['feature-state', 'selected'], false], 0.36, ['boolean', ['feature-state', 'hover'], false], 0.3, ['boolean', ['feature-state', 'paid'], false], 0.22, 0.1]],
              'fill-opacity-transition': { duration: 250 }, 'fill-color-transition': { duration: 250 },
            },
          }, firstSymbol);
          m.addLayer({ id: 'k-casing', type: 'line', source: 'k-regions', paint: { 'line-color': olive, 'line-opacity': 0.55, 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2.2, 10, 5] } }, firstSymbol);
          m.addLayer({ id: 'k-line', type: 'line', source: 'k-regions', paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 10, 2.5], 'line-opacity': 0.95 } }, firstSymbol);
          m.addLayer({
            id: 'k-line-sel', type: 'line', source: 'k-regions',
            paint: { 'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], rust, ['boolean', ['feature-state', 'hover'], false], olive, 'rgba(0,0,0,0)'], 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.6, 10, 3.2] },
          });
          m.addLayer({
            id: 'k-labels', type: 'symbol', source: 'k-labels',
            filter: ['any', ['==', ['get', 'grp'], 'up'], ['>=', ['zoom'], 7.6], ['==', ['get', 'key'], 'suffolk']],
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 13, 11, 17], 'text-max-width': 8, 'text-allow-overlap': true, 'text-padding': 4 },
            paint: { 'text-color': ink, 'text-halo-color': 'rgba(255,255,255,.92)', 'text-halo-width': 1.6 },
            maxzoom: 12.5,
          });

          const setHover = (id) => {
            if (hoverId.current === id) return;
            if (hoverId.current) m.setFeatureState({ source: 'k-regions', id: hoverId.current }, { hover: false });
            hoverId.current = id;
            if (id) m.setFeatureState({ source: 'k-regions', id }, { hover: true });
            props.current.onHover?.(id);
          };
          m.on('mousemove', 'k-fill', (e) => {
            const f = e.features?.[0]; if (!f) return;
            setHover(f.properties.key);
            m.getCanvas().style.cursor = props.current.readOnly ? '' : 'pointer';
            setTip({ x: e.point.x, y: e.point.y, name: f.properties.name, key: f.properties.key });
          });
          m.on('mouseleave', 'k-fill', () => { setHover(null); m.getCanvas().style.cursor = ''; setTip(null); });
          m.on('click', 'k-fill', (e) => {
            const f = e.features?.[0]; if (!f) return;
            const key = f.properties.key, P = props.current;
            const tiny = NYC.has(key) && m.getZoom() < 8.6;
            if (tiny) { showNyc(); return; }        // boroughs are small: zoom in to the five boroughs first, then pick
            if (P.readOnly || !P.onChange) return;
            if (P.mode === 'multi') { const cur = P.value || []; P.onChange(cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]); }
            else P.onChange(P.value === key ? null : key);
          });
          m.on('movestart', () => setTip(null));
          m.on('moveend', () => { setZoomed(m.getZoom() > 7.4); setZoomLevel(m.getZoom()); });
          m.resize();
          if (!props.current.value || props.current.mode === 'multi') m.fitBounds(NY_BOUNDS, { padding: 16, duration: 0 });
          setReady(true);
        });
        m.on('error', (e) => { if (/Failed to fetch|style/i.test(String(e?.error?.message || ''))) setFailed(true); });
      } catch { if (!dead) setFailed(true); }
    })();
    return () => { dead = true; map.current?.remove(); map.current = null; };
  }, [showNyc]);

  // keep feature-state in sync with the selection
  useEffect(() => {
    const m = map.current; if (!ready || !m || !geo.current) return;
    const sel = new Set(mode === 'multi' ? value || [] : value ? [value] : []);
    geo.current.regions.features.forEach((f) => {
      const k = f.properties.key;
      m.setFeatureState({ source: 'k-regions', id: k }, { selected: sel.has(k), paid: status?.(k) === 'paid' });
    });
  }, [ready, value, mode, status]);

  // single mode: glide to the picked region
  useEffect(() => {
    if (!ready || mode !== 'single' || !value || !flyOnSelect) return;
    if (skipFly.current) { skipFly.current = false; return; }
    const f = geo.current.regions.features.find((x) => x.properties.key === value);
    if (f) fly(bboxOf(f.geometry), { padding: METRO.has(value) ? 60 : 40, maxZoom: NYC.has(value) ? 11 : 9 });
  }, [ready, value, mode, fly, flyOnSelect]);

  // resize with its container
  useEffect(() => {
    if (!box.current || !('ResizeObserver' in window)) return undefined;
    let w = 0;
    const ro = new ResizeObserver(([en]) => {
      const m = map.current; if (!m) return;
      m.resize();
      const nw = Math.round(en.contentRect.width);
      if (w && Math.abs(nw - w) > 40 && m.getZoom() < 7.2) m.fitBounds(NY_BOUNDS, { padding: 16, duration: 0 });
      w = nw;
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const pickAddress = (a) => {
    const m = map.current, L = lib.current;
    if (m && L) {
      marker.current?.remove();
      const el = document.createElement('div'); el.className = 'rm-pin';
      el.innerHTML = '<svg viewBox="0 0 32 42" aria-hidden="true"><path d="M16 41s14-13.6 14-25A14 14 0 0 0 2 16c0 11.4 14 25 14 25z"/><circle cx="16" cy="16" r="5.5"/></svg>';
      marker.current = new L.Marker({ element: el, anchor: 'bottom' }).setLngLat([a.lon, a.lat]).addTo(m);
      m.flyTo({ center: [a.lon, a.lat], zoom: 12.5, duration: REDUCED ? 0 : 1400, essential: true });
    }
    if (mode === 'single' && a.region && onChange && !readOnly) { skipFly.current = true; onChange(a.region); }
    onAddress?.(a);
  };

  return (
    <div className={'rm ' + className} style={height ? { height } : undefined}>
      <div ref={box} className="rm-map" role="application" aria-label="Map of New York State's 16 regions" />
      {!ready && !failed && <div className="rm-loading" aria-hidden="true"><span /></div>}
      {failed && <div className="rm-loading rm-failed">The map couldn’t load. You can still use the list.</div>}
      <div className="rm-top">
        {search && <AddressSearch onPick={pickAddress} />}
        <div className="rm-tools">
          {!zoomed && <button type="button" className="rm-btn" onClick={showMetro}><Icon name="zoom" className="i-sm" />NYC &amp; Long Island</button>}
          {zoomed && zoomLevel < 9.4 && <button type="button" className="rm-btn" onClick={showNyc}><Icon name="zoom" className="i-sm" />5 boroughs</button>}
          {zoomed && <button type="button" className="rm-btn" onClick={showState}><Icon name="map" className="i-sm" />All of New York</button>}
        </div>
      </div>
      {tip && (
        <div className="rm-tip" style={{ left: tip.x, top: tip.y }}>
          <strong>{tip.name}</strong>
          {!readOnly && <span>{NYC.has(tip.key) && zoomLevel < 8.6 ? 'Click to zoom in' : mode === 'multi' ? ((value || []).includes(tip.key) ? 'Click to remove' : 'Click to add') : value === tip.key ? 'Selected' : 'Click to select'}</span>}
        </div>
      )}
    </div>
  );
}
