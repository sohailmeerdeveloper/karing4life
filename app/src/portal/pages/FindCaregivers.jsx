import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Avail, Avatar, Btn, Card, CareTags, CheckList, Empty, IconBtn, Modal, PageHead, PIcon, SchedulePicker, Section, Switch, Verified, careLabel, regionName, schedSummary } from '../ui.jsx';
import { SKILLED, NONSKILLED, RECIPIENTS, DURATIONS } from '../caregiver.jsx';
import { REGIONS, GROUPS } from '../../data/data.js';
import StartChat from '../StartChat.jsx';

const EMPTY = { care: [], regions: [], recipient: '', duration: '', availability: '', schedule: {}, verified: false, q: '' };

export async function toggleSave(me, cgId, on) {
  const r = on ? await supabase.from('saved_caregivers').insert({ user_id: me, caregiver_id: cgId }) : await supabase.from('saved_caregivers').delete().eq('user_id', me).eq('caregiver_id', cgId);
  if (r.error && r.error.code !== '23505') throw r.error;
}

const SLOT_N = (sched) => Object.values(sched || {}).reduce((n, d) => n + d.length, 0);

function Filters({ f, set, reset, count }) {
  return (
    <div className="pfilters">
      <div className="f-h">
        <h2><PIcon name="sliders" className="pi-sm" />Filters{count > 0 && <span className="fsec-n">{count}</span>}</h2>
        {count > 0 && <button type="button" className="pb pb-link pb-sm" onClick={reset}>Clear all</button>}
      </div>
      <Section title="Type of care" icon="steth" count={f.care.length} defaultOpen onClear={() => set({ care: [] })}>
        <div className="fsub">Skilled care</div>
        <CheckList options={SKILLED} value={f.care} onChange={(x) => set({ care: x })} />
        <div className="fsub">Non-skilled care</div>
        <CheckList options={NONSKILLED} value={f.care} onChange={(x) => set({ care: x })} />
      </Section>
      <Section title="Service regions" icon="pin" count={f.regions.length} defaultOpen={f.regions.length > 0} onClear={() => set({ regions: [] })}>
        {['li', 'nyc', 'up'].map((g) => (
          <div key={g}>
            <div className="fsub">{GROUPS[g]}</div>
            <CheckList cols={2} options={REGIONS.filter((r) => r.g === g).map((r) => [r.key, r.name])} value={f.regions} onChange={(x) => set({ regions: x })} />
          </div>
        ))}
      </Section>
      <Section title="Schedule needed" icon="cal" count={SLOT_N(f.schedule)} onClear={() => set({ schedule: {} })}>
        <p className="fhint">Pick a time of day, then the days.</p>
        <SchedulePicker value={f.schedule} onChange={(sc) => set({ schedule: sc })} />
      </Section>
      <Section title="Care recipient" icon="user" count={f.recipient ? 1 : 0} defaultOpen>
        <CheckList multi={false} name="recipient" cols={2} options={RECIPIENTS} value={f.recipient} onChange={(x) => set({ recipient: x })} />
      </Section>
      <Section title="Duration" icon="hourglass" count={f.duration ? 1 : 0}>
        <CheckList multi={false} name="duration" options={[['Fill-in', 'Fill-in', 'A shift or a few days'], ['Short-term', 'Short-term', 'Up to a few months'], ['Long-term', 'Long-term', 'Ongoing']]} value={f.duration} onChange={(x) => set({ duration: x })} />
      </Section>
      <Section title="Availability" icon="clock" count={(f.availability ? 1 : 0) + (f.verified ? 1 : 0)} defaultOpen>
        <CheckList multi={false} name="avail" cols={2} options={[['available', 'Available'], ['fillin', 'Fill-in']]} value={f.availability} onChange={(x) => set({ availability: x })} />
        <div style={{ marginTop: 12 }}><Switch checked={f.verified} onChange={(v) => set({ verified: v })} label="Verified caregivers only" /></div>
      </Section>
    </div>
  );
}

/** The filters that are on, each removable with one click. */
function ActiveFilters({ f, set, reset }) {
  const chips = [
    ...f.care.map((k) => [careLabel(k), () => set({ care: f.care.filter((x) => x !== k) })]),
    ...f.regions.map((k) => [regionName(k), () => set({ regions: f.regions.filter((x) => x !== k) })]),
    ...(SLOT_N(f.schedule) ? [[schedSummary(f.schedule), () => set({ schedule: {} })]] : []),
    ...(f.recipient ? [[f.recipient, () => set({ recipient: '' })]] : []),
    ...(f.duration ? [[f.duration, () => set({ duration: '' })]] : []),
    ...(f.availability ? [[f.availability === 'fillin' ? 'Fill-in' : 'Available', () => set({ availability: '' })]] : []),
    ...(f.verified ? [['Verified only', () => set({ verified: false })]] : []),
  ];
  if (!chips.length) return null;
  return (
    <div className="active-f">
      {chips.map(([l, off]) => <button key={l} type="button" className="af-chip" onClick={off} aria-label={'Remove filter ' + l}>{l}<PIcon name="x" className="pi-sm" /></button>)}
      <button type="button" className="pb pb-link pb-sm" onClick={reset}>Clear all</button>
    </div>
  );
}

export function CaregiverCard({ c, onSave, onMessage, base }) {
  return (
    <article className="cg-card">
      <div className="cg-head">
        <Link to={base + '/caregivers/' + c.user_id} tabIndex={-1} aria-hidden="true"><Avatar name={c.full_name} url={c.avatar_url} size="lg" /></Link>
        <div style={{ minWidth: 0 }}>
          <h3><Link to={base + '/caregivers/' + c.user_id} style={{ color: 'inherit' }}>{c.full_name}</Link></h3>
          <div className="sub">{c.credential}</div>
          <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}><Avail v={c.availability} /><Verified status={c.verification} /></div>
        </div>
        <IconBtn icon="bookmark" className="save save-btn" aria-pressed={c.saved} label={c.saved ? 'Remove from saved' : 'Save caregiver'} onClick={() => onSave(c)} />
      </div>
      {c.headline && <p className="headline">{c.headline}</p>}
      <CareTags keys={c.care_types} max={3} />
      <div className="post-meta">
        <span><PIcon name="pin" />{c.service_regions.slice(0, 2).map(regionName).join(', ')}{c.service_regions.length > 2 ? ` +${c.service_regions.length - 2}` : ''}</span>
        {c.rate_min > 0 && <span><PIcon name="dollar" />From ${Number(c.rate_min).toFixed(0)}/hr</span>}
        {c.years_exp != null && <span><PIcon name="clock" />{c.years_exp} yrs</span>}
        <span title={schedSummary(c.schedule)}><PIcon name="cal" />{Object.keys(c.schedule || {}).length ? schedSummary(c.schedule).split(' · ')[0] : 'Flexible'}</span>
      </div>
      <div className="cg-foot">
        <Btn size="sm" variant="ghost" icon="user" to={base + '/caregivers/' + c.user_id}>Profile<span className="sr-only">: {c.full_name}</span></Btn>
        <Btn size="sm" variant="primary" icon="msg" onClick={() => onMessage(c)}>Message</Btn>
      </div>
    </article>
  );
}

export default function FindCaregivers({ saved }) {
  const { me, role, base } = usePortal();
  const [params] = useSearchParams();
  const [f, setF] = useState(() => ({ ...EMPTY, care: params.get('care') ? params.get('care').split(',') : [], regions: params.get('region') ? [params.get('region')] : [] }));
  const [debounced, setDebounced] = useState(f);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [chat, setChat] = useState(null);
  useEffect(() => { const t = setTimeout(() => setDebounced(f), 250); return () => clearTimeout(t); }, [f]);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const count = f.care.length + f.regions.length + (f.recipient ? 1 : 0) + (f.duration ? 1 : 0) + (f.availability ? 1 : 0) + Object.keys(f.schedule).length + (f.verified ? 1 : 0);

  const { data, loading, error, setData } = useAsync(() => q(supabase.rpc('search_caregivers', { f: { ...debounced, saved: !!saved } })), [debounced, saved]);
  const { data: agRegions } = useAsync(() => (role === 'agency' ? q(supabase.rpc('access_regions', { uid: me, plan_kind: 'agency' })) : Promise.resolve(null)), [role, me]);
  const list = useMemo(() => data || [], [data]);

  const onSave = async (c) => {
    try {
      await toggleSave(me, c.user_id, !c.saved);
      setData((xs) => (saved && c.saved ? xs.filter((x) => x.user_id !== c.user_id) : xs.map((x) => (x.user_id === c.user_id ? { ...x, saved: !c.saved } : x))));
      toast(c.saved ? 'Removed from saved' : 'Saved', c.saved ? '' : 'Find them anytime under Saved caregivers.');
    } catch (e) { toast.error('Couldn’t save', errText(e)); }
  };
  const filters = <Filters f={f} set={set} reset={() => setF({ ...EMPTY, q: f.q })} count={count} />;

  return (
    <>
      <PageHead title={saved ? 'Saved caregivers' : role === 'agency' ? 'Find caregivers' : 'Find a caregiver'}
        sub={saved ? 'Your shortlist. Tap the bookmark to remove someone.' : 'Filter by care type, region, schedule, age group and duration. Pick as many as you like.'} />
      {role === 'agency' && agRegions && !agRegions.length && (
        <div className="notice warn" style={{ marginBottom: 16 }}><PIcon name="map" /><div>You can browse, but messaging caregivers needs an active region. <Link to={base + '/regions'}><strong>Choose regions</strong></Link></div></div>
      )}
      <div className="toolbar">
        <div className="pin-ic"><PIcon name="search" /><input className="pin" placeholder="Search by name, town or keyword" value={f.q} onChange={(e) => set({ q: e.target.value })} aria-label="Search caregivers" /></div>
        {!saved && <Btn variant={count ? 'soft' : 'ghost'} icon="sliders" className="only-m" onClick={() => setMobileFilters(true)}>Filters{count ? ` (${count})` : ''}</Btn>}
      </div>
      <div className={saved ? '' : 'filters-layout'}>
        {!saved && <Card className="hide-m filter-card">{filters}</Card>}
        <div>
          <h2 className="sr-only">{saved ? "Saved caregivers" : "Caregivers"}</h2>
          <div className="results-h"><span className="small muted"><strong style={{ color: 'var(--ink)' }}>{loading ? '…' : list.length}</strong> caregiver{list.length === 1 ? '' : 's'}{count ? ' match your filters' : ''}</span></div>
          {!saved && <ActiveFilters f={f} set={set} reset={() => setF({ ...EMPTY, q: f.q })} />}
          {loading && !data ? <div className="cg-grid">{[1, 2, 3, 4].map((i) => <div key={i} className="skel" style={{ height: 280 }} />)}</div>
            : error ? <Card><Empty icon="alert" title="Search isn’t available" body={errText(error)} /></Card>
            : list.length === 0 ? <Card><Empty icon={saved ? 'bookmark' : 'search'} title={saved ? 'No saved caregivers yet' : 'No caregivers match'} body={saved ? 'Tap the bookmark on any caregiver to keep them here.' : 'Try removing a filter or two. New caregivers join every week.'} action={saved ? <Btn variant="primary" icon="search" to={base + '/find'}>Find caregivers</Btn> : count > 0 && <Btn variant="ghost" onClick={() => setF({ ...EMPTY })}>Clear filters</Btn>} /></Card>
            : <div className="cg-grid" style={{ opacity: loading ? .6 : 1, transition: 'opacity .2s' }}>{list.map((c) => <CaregiverCard key={c.user_id} c={c} base={base} onSave={onSave} onMessage={setChat} />)}</div>}
        </div>
      </div>
      <Modal open={mobileFilters} onClose={() => setMobileFilters(false)} title="Filters" icon="sliders" footer={<><Btn variant="ghost" onClick={() => setF({ ...EMPTY, q: f.q })} disabled={!count}>Clear all</Btn><Btn variant="primary" onClick={() => setMobileFilters(false)}>Show {list.length} caregiver{list.length === 1 ? '' : 's'}</Btn></>}>{filters}</Modal>
      <StartChat open={!!chat} onClose={() => setChat(null)} other={chat && { id: chat.user_id, name: chat.full_name, avatar: chat.avatar_url, sub: chat.credential }} />
    </>
  );
}
