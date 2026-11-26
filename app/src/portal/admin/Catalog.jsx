import { useState } from 'react';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { syncCatalog } from '../../lib/catalog.js';
import { Badge, Btn, Card, Field, IconBtn, Modal, PageHead, Seg, Skel, Switch, TrashBtn, confirm } from '../ui.jsx';
import { GROUPS } from '../../data/data.js';

export default function Catalog() {
  const [tab, setTab] = useState('regions');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, reload } = useAsync(async () => {
    const [regions, cats, cgs, posts] = await Promise.all([
      q(supabase.from('regions').select('*').order('sort')),
      q(supabase.from('care_categories').select('*').order('sort')),
      q(supabase.from('caregiver_profiles').select('care_types,service_regions')),
      q(supabase.from('posts').select('care_types,region_key').eq('status', 'open')),
    ]);
    const use = {};
    cgs.forEach((c) => { c.care_types.forEach((k) => { use[k] = (use[k] || 0) + 1; }); c.service_regions.forEach((k) => { use['r:' + k] = (use['r:' + k] || 0) + 1; }); });
    posts.forEach((p) => { use['p:' + p.region_key] = (use['p:' + p.region_key] || 0) + 1; });
    return { regions, cats, use };
  }, []);

  const save = async () => {
    setBusy(true);
    let res;
    if (edit.type === 'region') res = await supabase.from('regions').update({ name: edit.name.trim(), description: edit.description?.trim() || '' }).eq('key', edit.key);
    else if (edit.isNew) {
      const key = edit.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
      res = await supabase.from('care_categories').insert({ key, label: edit.label.trim(), grp: edit.grp, sort: (data.cats.at(-1)?.sort || 0) + 1, active: true });
    } else res = await supabase.from('care_categories').update({ label: edit.label.trim(), grp: edit.grp }).eq('key', edit.key);
    setBusy(false);
    if (res.error) { toast.error('Couldn’t save', errText(res.error)); return; }
    await supabase.rpc('log_admin', { a: edit.type === 'region' ? 'edit_region' : edit.isNew ? 'add_care_type' : 'edit_care_type', tt: edit.type, tid: edit.key || edit.label, d: {} });
    toast('Saved'); setEdit(null); await syncCatalog(); reload(true);
  };
  const toggleCat = async (c, on) => {
    const { error } = await supabase.from('care_categories').update({ active: on }).eq('key', c.key);
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    toast(on ? `${c.label} is visible` : `${c.label} is hidden`, on ? '' : 'Existing profiles keep it, but nobody can pick it.'); await syncCatalog(); reload(true);
  };
  const delCat = async (c) => {
    if (data.use[c.key]) { toast.error('In use', `${data.use[c.key]} caregiver profile(s) use this. Hide it instead.`); return; }
    if (!(await confirm({ title: `Delete “${c.label}”?`, body: 'Nobody uses it yet. This can’t be undone.', confirm: 'Delete' }))) return;
    const { error } = await supabase.from('care_categories').delete().eq('key', c.key);
    if (error) { toast.error('Couldn’t delete', errText(error)); return; }
    toast('Deleted'); await syncCatalog(); reload(true);
  };

  return (
    <>
      <PageHead title="Regions & care types" sub="Rename regions, update their descriptions, and manage the care categories members can choose."
        actions={tab === 'care' && <Btn variant="success" icon="plus" onClick={() => setEdit({ type: 'care', isNew: true, label: '', grp: 'skilled' })}>Add care type</Btn>} />
      <div style={{ marginBottom: 16 }}><Seg value={tab} onChange={setTab} tabs={[['regions', 'Regions', 16], ['care', 'Care types', data?.cats.length]]} /></div>
      {loading && !data ? <Skel h={48} n={6} /> : tab === 'regions' ? (
        <Card flush><div className="tbl-wrap"><table className="tbl stackable">
          <thead><tr><th>Region</th><th>Area</th><th className="num">Caregivers</th><th className="num">Open posts</th><th /></tr></thead>
          <tbody>{data.regions.map((r) => (
            <tr key={r.key}>
              <td className="first"><strong>{r.name}</strong>{r.description && <div className="small muted trunc" style={{ maxWidth: 380 }}>{r.description}</div>}</td>
              <td data-l="Area">{GROUPS[r.grp]}</td>
              <td data-l="Caregivers" className="num">{data.use['r:' + r.key] || 0}</td>
              <td data-l="Open posts" className="num">{data.use['p:' + r.key] || 0}</td>
              <td><div className="t-actions"><IconBtn icon="edit" size="sm" label="Edit region" tipPos="left" onClick={() => setEdit({ type: 'region', ...r })} /></div></td>
            </tr>
          ))}</tbody>
        </table></div></Card>
      ) : (
        <Card flush><div className="tbl-wrap"><table className="tbl stackable">
          <thead><tr><th>Care type</th><th>Group</th><th className="num">Caregivers</th><th>Visible</th><th /></tr></thead>
          <tbody>{data.cats.map((c) => (
            <tr key={c.key}>
              <td className="first"><strong>{c.label}</strong></td>
              <td data-l="Group"><Badge tone={c.grp === 'skilled' ? 'line' : 'sand'}>{c.grp === 'skilled' ? 'Skilled' : 'Non-skilled'}</Badge></td>
              <td data-l="Caregivers" className="num">{data.use[c.key] || 0}</td>
              <td data-l="Visible"><Switch checked={c.active} onChange={(v) => toggleCat(c, v)} /></td>
              <td><div className="t-actions"><IconBtn icon="edit" size="sm" label="Rename" onClick={() => setEdit({ type: 'care', ...c })} /><TrashBtn size="sm" label="Delete" tipPos="left" onClick={() => delCat(c)} /></div></td>
            </tr>
          ))}</tbody>
        </table></div></Card>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.type === 'region' ? 'Edit region' : edit?.isNew ? 'Add care type' : 'Edit care type'} icon={edit?.type === 'region' ? 'map' : 'steth'}
        footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn variant="success" icon="check" loading={busy} disabled={!(edit?.name || edit?.label)?.trim()} onClick={save}>Save</Btn></>}>
        {edit && (edit.type === 'region' ? (
          <div className="pf">
            <Field label="Name">{(id) => <input id={id} className="pin" value={edit.name} maxLength={60} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />}</Field>
            <Field label="Description" optional hint="Shown on the public map.">{(id) => <textarea id={id} className="pta" maxLength={400} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />}</Field>
          </div>
        ) : (
          <div className="pf">
            <Field label="Label">{(id) => <input id={id} className="pin" value={edit.label} maxLength={60} onChange={(e) => setEdit({ ...edit, label: e.target.value })} placeholder="e.g. Hospice Care" />}</Field>
            <Field label="Group">{(id) => <select id={id} className="psel" value={edit.grp} onChange={(e) => setEdit({ ...edit, grp: e.target.value })}><option value="skilled">Skilled care</option><option value="nonskilled">Non-skilled care</option></select>}</Field>
          </div>
        ))}
      </Modal>
    </>
  );
}
