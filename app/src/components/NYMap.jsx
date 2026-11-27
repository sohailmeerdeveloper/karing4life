import { useState } from 'react';
import { REGIONS, R, REQUESTS } from '../data/data.js';
import { Icon } from './Icon.jsx';
import RegionMap from './RegionMap.jsx';

const nCounties = (r) => r.counties.length + (r.counties.length === 1 ? ' county' : ' counties');

function Panel({ r, onPick }) {
  if (!r) {
    return (
      <aside className="region-panel" aria-live="polite" aria-label="Region details">
        <div className="rp-head rp-fade" key="none">
          <div className="rp-group"><span className="badge"><Icon name="map" className="i-sm" />New York State</span></div>
          <h2 className="rp-name">Choose a region</h2>
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
        <h2 className="rp-name">{r.name}</h2>
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
  const [selected, setSelected] = useState(null);
  const sel = selected ? R[selected] : null;
  return (
    <div className="map-row">
      <div className="map-card">
        <div className="map-toolbar">
          <div className="map-crumbs">
            <Icon name="map" className="i-sm" />
            {sel ? <><span>New York State</span><Icon name="chev" className="i-sm" style={{ transform: 'rotate(-90deg)' }} /><strong>{sel.name}</strong></>
              : <><strong>New York State</strong><span>· 16 regions · 62 counties</span></>}
          </div>
          <div className="map-tools">
            <div className="map-legend" aria-hidden="true"><span><i className="lg-li" />Long Island &amp; NYC</span><span><i className="lg-up" />Upstate</span><span><i className="lg-sel" />Selected</span></div>
            {sel && <button className="map-back" type="button" onClick={() => setSelected(null)}><Icon name="back" className="i-sm" />Clear</button>}
          </div>
        </div>
        <div className="map-stage">
          <RegionMap mode="single" value={selected} onChange={setSelected} search className="rm-home" />
        </div>
      </div>
      <Panel r={sel} onPick={setSelected} />
    </div>
  );
}
