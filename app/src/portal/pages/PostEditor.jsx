import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Btn, Card, Chips, Field, Notice, PageHead, SchedulePicker, Skel, Empty, regionName } from '../ui.jsx';
import { SKILLED, NONSKILLED, RECIPIENTS, DURATIONS } from '../caregiver.jsx';
import { REGIONS, GROUPS } from '../../data/data.js';

const BLANK = { title: '', body: '', region_key: '', town: '', care_types: [], recipient: 'Adult', duration: 'Long-term', schedule: {}, hours_per_week: '', start_date: '', pay_range: '' };

export default function PostEditor() {
  const { id } = useParams();
  const { profile } = useAuth();
  const { me, role, base, price } = usePortal();
  const navigate = useNavigate();
  const isAgency = role === 'agency';
  const path = base + (isAgency ? '/jobs' : '/requests');
  const [v, setV] = useState(null);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);

  const { data, loading } = useAsync(async () => {
    const regions = isAgency ? await q(supabase.rpc('access_regions', { uid: me, plan_kind: 'agency' })) : REGIONS.map((r) => r.key);
    const post = id ? await q(supabase.from('posts').select('*').eq('id', id).eq('author_id', me).maybeSingle()) : null;
    return { regions, post };
  }, [id, me]);

  useEffect(() => {
    if (!data) return;
    if (data.post) setV({ ...BLANK, ...data.post, hours_per_week: data.post.hours_per_week ?? '', start_date: data.post.start_date || '', town: data.post.town || '', pay_range: data.post.pay_range || '' });
    else setV({ ...BLANK, region_key: data.regions.includes(profile?.region_key) ? profile.region_key : data.regions.length === 1 ? data.regions[0] : '', town: profile?.town || '' });
  }, [data, profile]);

  if (loading || !v) return <Skel h={300} n={1} />;
  if (id && !data.post) return <Card><Empty icon="lock" title="Post not found" action={<Btn to={path} icon="arrowL" variant="primary">Back</Btn>} /></Card>;
  const set = (patch) => { setV((x) => ({ ...x, ...patch })); setErrs((e) => { const n = { ...e }; Object.keys(patch).forEach((k) => delete n[k]); return n; }); };
  const editing = !!data.post;
  const flagAfter = price('post_edit_flag_after', 3);

  const validate = () => {
    const e = {};
    if (v.title.trim().length < 4) e.title = 'Give it a short title (at least 4 characters).';
    if (v.body.trim().length < 10) e.body = 'Add a few details (at least 10 characters).';
    if (!v.region_key) e.region_key = 'Choose the region.';
    if (!v.care_types.length) e.care_types = 'Pick at least one type of care.';
    if (/\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b|@\w+\.\w+/.test(v.body)) e.body = 'Please don’t include phone numbers or emails. Share them in private messages.';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (!validate()) { toast.error('A few details are missing'); return; }
    setBusy(true);
    const payload = { title: v.title.trim(), body: v.body.trim(), region_key: v.region_key, town: v.town.trim(), care_types: v.care_types, recipient: v.recipient || '', duration: v.duration || '', schedule: v.schedule, hours_per_week: v.hours_per_week === '' ? '' : String(v.hours_per_week), start_date: v.start_date || '', pay_range: v.pay_range.trim() };
    let res;
    if (editing) {
      res = await supabase.from('posts').update({ ...payload, town: payload.town || null, recipient: payload.recipient || null, duration: payload.duration || null, hours_per_week: v.hours_per_week === '' ? null : +v.hours_per_week, start_date: v.start_date || null, pay_range: payload.pay_range || null }).eq('id', data.post.id).select('id').single();
    } else {
      res = await supabase.rpc('create_post', { p: { as: role, ...payload } });
    }
    setBusy(false);
    if (res.error) { toast.error(editing ? 'Couldn’t save changes' : 'Couldn’t post', errText(res.error)); return; }
    const newId = editing ? data.post.id : res.data;
    toast(editing ? 'Changes saved' : isAgency ? 'Job posted' : 'Request posted', editing ? '' : 'Caregivers in ' + regionName(v.region_key) + ' are being notified.');
    navigate(path + '/' + newId);
  };

  const regionOpts = ['li', 'nyc', 'up'].map((g) => [g, REGIONS.filter((r) => r.g === g && data.regions.includes(r.key))]).filter(([, rs]) => rs.length);

  return (
    <>
      <PageHead back={[path, isAgency ? 'Job posts' : 'My requests']} title={editing ? 'Edit post' : isAgency ? 'Post a job' : 'Post a care request'}
        sub={isAgency ? 'Describe the role. Caregivers in the region get notified.' : 'Describe what you need. Your address is never shown, only your town and region.'} />
      {editing && !isAgency && (
        <Notice tone={data.post.edit_count + 1 >= flagAfter ? 'warn' : undefined} icon="info">
          {data.post.edit_count + 1 >= flagAfter ? <>This will be edit #{data.post.edit_count + 1}. Posts edited {flagAfter}+ times get a quick review by our team (it stays visible).</> : <>You can edit while the request is open. The region can’t be changed.</>}
        </Notice>
      )}
      <form className="grid-main" style={{ marginTop: 16 }} onSubmit={save} noValidate>
        <div className="stack">
          <Card title="The basics" icon="pen">
            <div className="pf">
              <Field label="Title" error={errs.title} hint={isAgency ? 'e.g. “Weekend HHA in Westchester”' : 'e.g. “Afternoon companion for my mother, 81”'}>{(fid) => <input id={fid} className="pin" maxLength={120} value={v.title} onChange={(e) => set({ title: e.target.value })} aria-invalid={!!errs.title} autoFocus />}</Field>
              <Field label="Details" error={errs.body} hint="Routine, personality, pets, languages, anything that helps. No phone numbers or medical records.">{(fid) => (
                <><textarea id={fid} className="pta" style={{ minHeight: 160 }} maxLength={3000} value={v.body} onChange={(e) => set({ body: e.target.value })} aria-invalid={!!errs.body} /><div className="counter">{v.body.length} / 3000</div></>
              )}</Field>
              <div className="pf-row">
                <Field label="Region" error={errs.region_key} hint={editing && !isAgency ? 'Fixed for this request' : isAgency ? 'Only regions you subscribe to' : undefined}>{(fid) => (
                  <select id={fid} className="psel" value={v.region_key} onChange={(e) => set({ region_key: e.target.value })} disabled={editing && !isAgency} aria-invalid={!!errs.region_key}>
                    <option value="">Select a region</option>
                    {regionOpts.map(([g, rs]) => <optgroup key={g} label={GROUPS[g]}>{rs.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}</optgroup>)}
                  </select>
                )}</Field>
                <Field label="Town or neighborhood" optional>{(fid) => <input id={fid} className="pin" maxLength={80} value={v.town} onChange={(e) => set({ town: e.target.value })} placeholder="e.g. Huntington" />}</Field>
              </div>
            </div>
          </Card>
          <Card title="Type of care" icon="steth">
            <div className="pf">
              <div><div className="chip-group-label">Skilled care</div><Chips options={SKILLED} value={v.care_types} onChange={(x) => set({ care_types: x })} /></div>
              <div><div className="chip-group-label">Non-skilled care</div><Chips options={NONSKILLED} value={v.care_types} onChange={(x) => set({ care_types: x })} /></div>
              {errs.care_types && <div className="ph-err" role="alert">{errs.care_types}</div>}
              <div className="pf-row">
                <div className="pfield"><span className="pl">Care recipient</span><Chips multi={false} options={RECIPIENTS} value={v.recipient} onChange={(x) => set({ recipient: x })} /></div>
                <div className="pfield"><span className="pl">Duration</span><Chips multi={false} options={DURATIONS.map(([k]) => [k, k])} value={v.duration} onChange={(x) => set({ duration: x })} /></div>
              </div>
            </div>
          </Card>
          <Card title="Schedule" icon="cal">
            <p className="small muted" style={{ marginBottom: 14 }}>Tap Days, Evenings, Overnights or Live-in, then pick the days.</p>
            <SchedulePicker value={v.schedule} onChange={(s) => set({ schedule: s })} />
            <div className="pf-row" style={{ marginTop: 16 }}>
              {!isAgency && <Field label="Hours per week" optional>{(fid) => <input id={fid} className="pin" type="number" min="0" max="168" value={v.hours_per_week} onChange={(e) => set({ hours_per_week: e.target.value === '' ? '' : Math.max(0, Math.min(168, +e.target.value)) })} />}</Field>}
              {isAgency && <Field label="Pay" optional hint="e.g. $24–28 / hr">{(fid) => <input id={fid} className="pin" maxLength={60} value={v.pay_range} onChange={(e) => set({ pay_range: e.target.value })} />}</Field>}
              <Field label="Start date" optional>{(fid) => <input id={fid} className="pin" type="date" value={v.start_date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ start_date: e.target.value })} />}</Field>
            </div>
          </Card>
        </div>
        <div className="stack" style={{ position: 'sticky', top: 'calc(var(--top-h) + 16px)' }}>
          <Card title={editing ? 'Save changes' : 'Ready to post?'} icon="send">
            <ul className="small" style={{ margin: '0 0 16px', paddingLeft: 18, color: 'var(--ink-2)', display: 'grid', gap: 6 }}>
              {isAgency ? (<><li>Visible to caregivers in the region.</li><li>Unlimited posts while you’re subscribed.</li><li>Open for 60 days; close it anytime.</li></>)
                : (<><li>Free. One request every 14 days.</li><li>Open for 14 days.</li><li>10 free contacts with this request.</li><li>Caregivers who message you first are always free.</li></>)}
            </ul>
            <div className="stack-sm">
              <Btn type="submit" variant="success" size="lg" icon="check" block loading={busy}>{editing ? 'Save changes' : isAgency ? 'Post job' : 'Post request'}</Btn>
              <Btn variant="ghost" block to={editing ? path + '/' + id : path}>Cancel</Btn>
            </div>
          </Card>
          <p className="small muted" style={{ padding: '0 4px' }}>Karing4Life connects you with caregivers but isn’t an agency or employer. Don’t share medical records in posts.</p>
        </div>
      </form>
    </>
  );
}
