import { useEffect, useMemo, useRef, useState } from 'react';
import { useTitle, useQuery, REDUCED } from '../lib/hooks.js';
import { CtaBand, RegionOptions, Icon } from '../components/bits.jsx';
import { CARE, CARE_BY, R, REQUESTS, SCHED, DAYS, DAY_FULL, fmtDate } from '../data/data.js';
import { supabase } from '../lib/supabase.js';

/* Real open family requests come from the public_request_teasers() database function, which
   returns only non-identifying fields (no title, description, author or town). The blurred block
   shows placeholder text, so nothing private ever reaches the browser. Until that function is
   installed the page falls back to the sample requests (also without their text). */
const toCard = (p) => ({
  id: p.id, added: p.created_at.slice(0, 10), start: p.start_date, region: p.region_key, care: (p.care_types || []).filter((k) => CARE_BY[k]),
  recipient: p.recipient || 'Adult', duration: p.duration || 'Long-term', sched: p.schedule || {}, hours: p.hours_per_week,
});
const SAMPLES = REQUESTS.map(({ title, text, town, ...r }) => r); // eslint-disable-line no-unused-vars
const PLACEHOLDER = ['Care request details', 'The family’s full description is shown to caregivers with this region unlocked. Families never share addresses here.'];
function useRequests() {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let live = true;
    supabase.rpc('public_request_teasers').then(({ data, error }) => {
      if (live) setRows(error ? SAMPLES : data.map(toCard).filter((r) => R[r.region]));
    });
    return () => { live = false; };
  }, []);
  return rows;
}

const EMPTY = { q: '', care: [], region: '', recipient: '', duration: '', sched: [], sort: 'new' };
const GROUPS = [['skilled', 'Skilled Care'], ['nonskilled', 'Non-Skilled Care']];

function schedText(r) {
  return SCHED.filter((s) => r.sched[s[0]]).map((s) => {
    const d = r.sched[s[0]]; return s[1] + ': ' + (d.length === 7 ? 'every day' : d.map((i) => DAYS[i]).join(', '));
  }).join(' · ');
}

function Check({ checked, indeterminate, onChange, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return <label className="check"><input ref={ref} type="checkbox" checked={checked} onChange={onChange} {...rest} />{children}</label>;
}

function Card({ r }) {
  const reg = R[r.region];
  return (
    <article className="req-card">
      <div className="rc-top"><span className="badge badge-ink"><Icon name="heart" className="i-sm" />Family request</span><span className="rc-date">Added on {fmtDate(r.added)}</span></div>
      <div className="rc-locked">
        <div className="rc-blur" aria-hidden="true"><h3>{PLACEHOLDER[0]}</h3><p>{PLACEHOLDER[1]}</p></div>
        <span className="rc-lock-badge"><Icon name="lock" />Unlock {reg.name} to read</span>
        <span className="sr-only">Title and description are hidden until the {reg.name} region is unlocked.</span>
      </div>
      <div className="rc-fields">
        <div className="rc-field wide"><div className="k"><Icon name="heart" />Care types</div><div className="v">{r.care.map((k) => CARE_BY[k].short).join(', ') || 'Ask the family'}</div></div>
        <div className="rc-field"><div className="k"><Icon name="pin" />Region</div><div className="v">{reg.name}</div></div>
        <div className="rc-field wide"><div className="k"><Icon name="cal" />Schedule</div><div className="v">{schedText(r) || 'Flexible'}</div></div>
        <div className="rc-field"><div className="k"><Icon name="user" />Recipient</div><div className="v">{r.recipient}</div></div>
        <div className="rc-field"><div className="k"><Icon name="clock" />Starting</div><div className="v">{r.start ? fmtDate(r.start) : 'Flexible'}</div></div>
        <div className="rc-field"><div className="k"><Icon name="hourglass" />Duration</div><div className="v">{r.duration}</div></div>
        <div className="rc-field"><div className="k"><Icon name="clock" />Hours</div><div className="v">{r.hours ? r.hours + ' hrs / wk' : r.sched.livein ? 'Live-in' : 'To discuss'}</div></div>
      </div>
      <div className="rc-foot"><span className="rc-note">$8.99/mo · cancel anytime · every region free for 14 days</span><a className="btn btn-accent btn-sm" href={'/membership?region=' + reg.key}><Icon name="unlock" />Unlock {reg.name} · $8.99/mo</a></div>
    </article>
  );
}

export default function RequestsPage() {
  useTitle('Care requests · Karing4Life');
  const params = useQuery();
  const [f, setF] = useState(EMPTY);
  const [qDraft, setQDraft] = useState('');
  const [open, setOpen] = useState({ skilled: true, nonskilled: true });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listRef = useRef(null), countRef = useRef(null), toggleRef = useRef(null);
  const set = (patch) => setF((s) => ({ ...s, ...patch }));
  // phones: Esc closes the open filter panel and returns focus to the Filters button
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') { setFiltersOpen(false); toggleRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

  // deep links: /requests?care=rn,lpn&region=suffolk&q=…
  useEffect(() => {
    if (params.care || params.region || params.q) {
      const care = (params.care || '').split(',').filter((k) => CARE_BY[k]);
      setF({ ...EMPTY, care, region: R[params.region] ? params.region : '', q: (params.q || '').toLowerCase() });
      setQDraft(params.q || '');
    }
  }, [params.care, params.region, params.q]);

  const toggleIn = (arr, v, on) => (on ? [...new Set([...arr, v])] : arr.filter((x) => x !== v));
  const rows = useRequests();
  const list = useMemo(() => {
    const out = (rows || []).filter((r) => {
      if (f.q) {
        const hay = [R[r.region].name, r.care.map((k) => CARE_BY[k].label).join(' '), r.recipient, r.duration, schedText(r)].join(' ').toLowerCase();
        if (!hay.includes(f.q)) return false;
      }
      if (f.care.length && !r.care.some((k) => f.care.includes(k))) return false;
      if (f.region && r.region !== f.region) return false;
      if (f.recipient && r.recipient !== f.recipient) return false;
      if (f.duration && r.duration !== f.duration) return false;
      if (f.sched.length && !f.sched.some((v) => { const [k, d] = v.split(':'); return r.sched[k] && r.sched[k].includes(+d); })) return false;
      return true;
    });
    return out.sort((a, b) => (f.sort === 'old' ? a.added.localeCompare(b.added) : f.sort === 'start' ? (a.start || '9').localeCompare(b.start || '9') : b.added.localeCompare(a.added)));
  }, [f, rows]);

  const chips = [];
  if (f.q) chips.push(['q', '“' + f.q + '”']);
  f.care.forEach((k) => chips.push(['care:' + k, CARE_BY[k].short]));
  if (f.region) chips.push(['region', R[f.region].name]);
  if (f.recipient) chips.push(['recipient', f.recipient]);
  if (f.duration) chips.push(['duration', f.duration]);
  f.sched.forEach((v) => { const [k, d] = v.split(':'); chips.push(['sched:' + v, SCHED.find((x) => x[0] === k)[1] + ' ' + DAYS[+d]]); });
  const removeChip = (k) => {
    if (k === 'q') { set({ q: '' }); setQDraft(''); }
    else if (k.startsWith('care:')) set({ care: f.care.filter((x) => x !== k.slice(5)) });
    else if (k.startsWith('sched:')) set({ sched: f.sched.filter((x) => x !== k.slice(6)) });
    else set({ [k]: '' });
  };
  const reset = () => { setF((s) => ({ ...EMPTY, sort: s.sort })); setQDraft(''); };
  const smooth = REDUCED ? 'auto' : 'smooth';

  return (
    <>
    <section className="page-hero screen">
      <div className="container">
        <nav className="crumb" aria-label="Breadcrumb"><a href="/">Home</a><Icon name="chev" style={{ transform: 'rotate(-90deg)' }} /><span>Care requests</span></nav>
        <div className="ph-grid">
          <div className="ph-text">
            <span className="eyebrow">For caregivers &amp; nurses</span>
            <h1>Care requests <span className="serif">across New York.</span></h1>
            <p className="lead">Families post what they need, for free. Browse by care type, region and schedule. Unlock a region to read the full details and reply.</p>
          </div>
        </div>
        <form className="req-search" role="search" onSubmit={(e) => { e.preventDefault(); set({ q: qDraft.trim().toLowerCase() }); listRef.current?.scrollIntoView({ behavior: smooth, block: 'start' }); }}>
          <div className="rs-in">
            <Icon name="search" />
            <label className="sr-only" htmlFor="reqQ">Search care requests</label>
            <input id="reqQ" type="search" placeholder="Search by care type or region, e.g. live-in, nursing, Brooklyn" value={qDraft}
              onChange={(e) => { setQDraft(e.target.value); set({ q: e.target.value.trim().toLowerCase() }); }} />
          </div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>
    </section>
    <section className="section-tight flow">
      <div className="container">
        <div className="req-layout">
          <aside className={'filters' + (filtersOpen ? ' open' : '')} id="filters" aria-label="Filters">
            <form onSubmit={(e) => { e.preventDefault(); if (window.innerWidth <= 1024) { setFiltersOpen(false); countRef.current?.scrollIntoView({ behavior: smooth, block: 'center' }); } }}>
              <div className="filters-head"><h2><Icon name="filter" />Filters</h2><button type="button" onClick={reset}>Reset all</button></div>
              <div className="f-group">
                <span className="f-title" id="ft-care">Type of care</span>
                <ul className="tree" aria-labelledby="ft-care">
                  {GROUPS.map(([g, label]) => {
                    const kids = CARE.filter((c) => c.g === g), n = kids.filter((c) => f.care.includes(c.key)).length;
                    return (
                      <li key={g}>
                        <div className="tree-row">
                          <span className="tree-parent"><Check checked={n === kids.length} indeterminate={n > 0 && n < kids.length}
                            onChange={(e) => set({ care: e.target.checked ? [...new Set([...f.care, ...kids.map((c) => c.key)])] : f.care.filter((k) => !kids.some((c) => c.key === k)) })}>{label}</Check></span>
                          <button type="button" className="tree-toggle" aria-expanded={open[g]} aria-label={(open[g] ? 'Collapse ' : 'Expand ') + label} onClick={() => setOpen((o) => ({ ...o, [g]: !o[g] }))}><Icon name="chev" /></button>
                        </div>
                        <ul hidden={!open[g]}>
                          {kids.map((c) => <li key={c.key}><Check checked={f.care.includes(c.key)} onChange={(e) => set({ care: toggleIn(f.care, c.key, e.target.checked) })}>{c.label}</Check></li>)}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="f-group">
                <div className="field"><label htmlFor="fRegion">Service region</label><select className="select" id="fRegion" value={f.region} onChange={(e) => set({ region: e.target.value })}><RegionOptions any="All regions" /></select></div>
                <div className="field">
                  <label htmlFor="fRecipient">Care recipient</label>
                  <select className="select" id="fRecipient" value={f.recipient} onChange={(e) => set({ recipient: e.target.value })}><option value="">Any recipient</option><option value="Pediatric">Pediatric</option><option value="Adult">Adult</option></select>
                </div>
                <div className="field">
                  <label htmlFor="fDuration">Duration</label>
                  <select className="select" id="fDuration" value={f.duration} onChange={(e) => set({ duration: e.target.value })}>
                    <option value="">Any duration</option>
                    <option value="Fill-in">Fill-in (a shift or a few days)</option>
                    <option value="Short-term">Short-term (up to a few months)</option>
                    <option value="Long-term">Long-term</option>
                  </select>
                </div>
              </div>
              <div className="f-group">
                <span className="f-title">Schedule needed</span>
                <div className="sched">
                  {SCHED.map(([k, label]) => {
                    const vals = DAYS.map((_, i) => k + ':' + i), n = vals.filter((v) => f.sched.includes(v)).length;
                    return (
                      <div className="sched-row" role="group" aria-label={label} key={k}>
                        <Check checked={n === 7} indeterminate={n > 0 && n < 7} onChange={(e) => set({ sched: e.target.checked ? [...new Set([...f.sched, ...vals])] : f.sched.filter((v) => !vals.includes(v)) })}>{label}</Check>
                        <div className="days">
                          {DAYS.map((d, i) => (
                            <label className="day" key={d}><input type="checkbox" aria-label={label + ': ' + DAY_FULL[i]} checked={f.sched.includes(k + ':' + i)} onChange={(e) => set({ sched: toggleIn(f.sched, k + ':' + i, e.target.checked) })} /><span>{d}</span></label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="f-actions"><button className="btn btn-primary btn-block" type="submit">Show results</button></div>
            </form>
          </aside>
          <div className="results">
            <div className="results-head">
              <p className="count" ref={countRef} aria-live="polite">{!rows ? <>Loading requests…</> : list.length ? <>Showing 1–{list.length} of {list.length} <span>{list.length === 1 ? 'result' : 'results'}</span></> : <>No results <span>for these filters</span></>}</p>
              <div className="rh-actions">
                <button ref={toggleRef} className="btn btn-ghost btn-sm filters-toggle" aria-expanded={filtersOpen} aria-controls="filters" onClick={() => setFiltersOpen(!filtersOpen)}><Icon name="filter" />Filters</button>
                <div className="sort">
                  <label htmlFor="sortBy">Sort by</label>
                  <select className="select" id="sortBy" value={f.sort} onChange={(e) => set({ sort: e.target.value })}><option value="new">Newest first</option><option value="old">Oldest first</option><option value="start">Start date</option></select>
                </div>
              </div>
            </div>
            <div className="active-filters">
              {chips.map(([k, l]) => <button key={k} className="af-chip" type="button" aria-label={'Remove filter ' + l} onClick={() => removeChip(k)}>{l}<Icon name="x" /></button>)}
            </div>
            <div className="req-list" ref={listRef}>
              {list.length ? list.map((r) => <Card key={r.id} r={r} />) : (
                <div className="no-results">
                  <span className="icon-circle lg"><Icon name="search" className="i-lg" /></span>
                  <h3>No requests match yet</h3>
                  <p>Try fewer filters, or a different region. New family requests are posted every day.</p>
                  <button className="btn btn-ghost" type="button" style={{ marginTop: 24 }} onClick={reset}>Clear all filters</button>
                </div>
              )}
            </div>
            <div className="notice" style={{ marginTop: 24 }}>
              <Icon name="info" />
              <p><strong>Titles and descriptions are blurred</strong> until you unlock that region for $8.99 a month. New caregivers get every region free for 14 days.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-req" title="Read every request" accent="in your region."
      text="Unlock the regions you work in for $8.99 a month each, or try all 16 free for 14 days."
      tiles={[
        { href: '/membership', icon: 'map', label: 'Choose your regions', tone: 'accent', sub: 'Pick the regions you work in. $8.99 a month each, 14 days free.' },
        { href: '/join?role=caregiver', icon: 'user-plus', label: 'Create your caregiver profile', tone: 'light', sub: 'Build your profile, get verified and reply to families.' },
      ]} />
    </>
  );
}
