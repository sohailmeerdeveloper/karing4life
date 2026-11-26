import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Avatar, Badge, Btn, Card, Empty, Field, IconBtn, Modal, PageHead, Seg, Skel, timeAgo } from '../ui.jsx';
import { DOC_LABEL, signedUrl } from '../pages/Verification.jsx';
import { ROLE_BADGE } from './Users.jsx';

/** One card per member with pending documents. Approve or ask for another document. */
export default function VerifyQueue() {
  const { base, refreshCounts } = usePortal();
  const [tab, setTab] = useState('pending');
  const [reject, setReject] = useState(null);
  const [busy, setBusy] = useState('');
  const { data, loading, reload } = useAsync(async () => {
    const docs = await q(supabase.from('verification_documents').select('*').eq('status', tab).order('created_at', { ascending: tab === 'pending' }).limit(300));
    const ids = [...new Set(docs.map((d) => d.user_id))];
    const [ps, cgs, ags] = ids.length ? await Promise.all([
      q(supabase.from('profiles').select('id,full_name,avatar_url,roles,town').in('id', ids)),
      q(supabase.from('caregiver_profiles').select('user_id,credential,license_number').in('user_id', ids)),
      q(supabase.from('agency_profiles').select('user_id,business_name,ein,website').in('user_id', ids)),
    ]) : [[], [], []];
    const by = Object.fromEntries(ps.map((p) => [p.id, { p, docs: [] }]));
    cgs.forEach((c) => { if (by[c.user_id]) by[c.user_id].cg = c; });
    ags.forEach((a) => { if (by[a.user_id]) by[a.user_id].ag = a; });
    docs.forEach((d) => by[d.user_id]?.docs.push(d));
    return Object.values(by).filter((x) => x.docs.length);
  }, [tab]);

  const kindOf = (m) => (m.cg ? 'caregiver' : m.ag ? 'agency' : 'family');
  const decide = async (m, decision, note) => {
    setBusy(m.p.id + decision);
    const { error } = await supabase.rpc('admin_verify', { uid: m.p.id, p_kind: kindOf(m), p_decision: decision, p_note: note || null });
    setBusy('');
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    toast(decision === 'verified' ? `${m.p.full_name} is verified` : 'Sent back to the member', 'They’ve been notified.');
    setReject(null); reload(true); refreshCounts();
  };
  const open = async (d) => { try { window.open(await signedUrl(d.file_path), '_blank', 'noopener'); } catch (e) { toast.error('Couldn’t open file', errText(e)); } };

  return (
    <>
      <PageHead title="Verification queue" sub="Check each document against the member’s profile. Licenses can be checked on the NY Office of the Professions website."
        actions={<Btn variant="ghost" icon="external" href="https://www.op.nysed.gov/verification-search" target="_blank" rel="noreferrer noopener">NY license lookup</Btn>} />
      <div style={{ marginBottom: 16 }}><Seg value={tab} onChange={setTab} tabs={[['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected']]} /></div>
      {loading && !data ? <Skel h={160} n={2} /> : !data.length ? <Card><Empty icon="shieldCheck" title={tab === 'pending' ? 'Queue is clear' : 'Nothing here'} body={tab === 'pending' ? 'New uploads will show up here.' : undefined} /></Card> : (
        <div className="stack">{data.map((m) => (
          <Card key={m.p.id}>
            <div className="flex between flex-wrap" style={{ marginBottom: 14, alignItems: 'flex-start' }}>
              <Link to={base + '/users/' + m.p.id} className="flex" style={{ color: 'inherit' }}>
                <Avatar name={m.ag?.business_name || m.p.full_name} url={m.p.avatar_url} />
                <div><strong>{m.ag?.business_name || m.p.full_name}</strong><div className="small muted">{m.p.roles.filter((r) => r !== 'admin').map((r) => ROLE_BADGE[r]).join(' · ')}{m.cg?.credential ? ' · ' + m.cg.credential : ''}{m.p.town ? ' · ' + m.p.town : ''}</div></div>
              </Link>
              {tab === 'pending' && <div className="flex">
                <Btn size="sm" variant="soft-danger" icon="x" onClick={() => setReject({ m, note: '' })}>Reject</Btn>
                <Btn size="sm" variant="success" icon="check" loading={busy === m.p.id + 'verified'} onClick={() => decide(m, 'verified')}>Approve</Btn>
              </div>}
            </div>
            {(m.cg?.license_number || m.ag) && (
              <div className="tags" style={{ marginBottom: 12 }}>
                {m.cg?.license_number && <span className="tag-s">License #{m.cg.license_number}</span>}
                {m.ag?.ein && <span className="tag-s">EIN {m.ag.ein}</span>}
                {m.ag?.website && <a className="tag-s" href={m.ag.website} target="_blank" rel="noreferrer noopener">{m.ag.website}</a>}
              </div>
            )}
            <div className="stack-sm">{m.docs.map((d) => (
              <div key={d.id} className="doc-row">
                <span className="d-m"><strong>{d.doc_type === 'reference' ? `Reference: ${d.ref_name}` : DOC_LABEL[d.doc_type]}</strong><span>{d.doc_type === 'reference' ? `${d.ref_relation || 'Reference'} · ${d.ref_contact}` : 'Uploaded ' + timeAgo(d.created_at)}{d.note ? ' · ' + d.note : ''}</span></span>
                {d.file_path ? <IconBtn icon="eye" size="sm" bordered label="Open document" onClick={() => open(d)} /> : d.doc_type !== 'reference' && <Badge tone="muted">No file</Badge>}
              </div>
            ))}</div>
          </Card>
        ))}</div>
      )}
      <Modal open={!!reject} onClose={() => setReject(null)} title="Ask for another document" icon="alert"
        footer={<><Btn variant="ghost" onClick={() => setReject(null)}>Cancel</Btn><Btn variant="danger" icon="send" loading={busy.endsWith('rejected')} onClick={() => decide(reject.m, 'rejected', reject.note)}>Send to member</Btn></>}>
        {reject && <Field label="What should they fix?" hint="The member sees this in their notifications.">{(id) => <textarea id={id} className="pta" autoFocus value={reject.note} onChange={(e) => setReject({ ...reject, note: e.target.value })} placeholder="e.g. The license photo is cut off. Please upload the full page." />}</Field>}
      </Modal>
    </>
  );
}
