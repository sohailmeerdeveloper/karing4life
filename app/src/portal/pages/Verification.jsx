import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Badge, Btn, Card, Field, FileDrop, Modal, Notice, PageHead, PIcon, Skel, TrashBtn, IconBtn, confirm, timeAgo } from '../ui.jsx';
import { LICENSED } from '../caregiver.jsx';

export const DOC_LABEL = { gov_id: 'Government-issued ID', library_card: 'Library card', license: 'Professional license', reference: 'Reference', business: 'Business document (EIN letter)' };
const DOC_ICON = { gov_id: 'id', library_card: 'id', license: 'fileCheck', reference: 'users', business: 'building' };
const STATUS = { approved: ['Approved', 'ok', 'checkCircle'], pending: ['In review', 'warn', 'hourglass'], rejected: ['Needs another look', 'danger', 'alert'] };

export async function signedUrl(path) {
  const { data, error } = await supabase.storage.from('verification').createSignedUrl(path, 120);
  if (error) throw error;
  return data.signedUrl;
}

export default function Verification() {
  const { extra, refresh } = useAuth();
  const { me, role } = usePortal();
  const rp = extra[role] || {};
  const status = rp.verification || 'unverified';
  const licensed = role === 'caregiver' && LICENSED.test(rp.credential || '');
  const [busy, setBusy] = useState('');
  const [ref, setRef] = useState(null);
  const { data: docs, loading, reload } = useAsync(() => q(supabase.from('verification_documents').select('*').eq('user_id', me).order('created_at', { ascending: false })), [me]);

  const has = (t) => (docs || []).some((d) => d.doc_type === t && d.status !== 'rejected');
  const refs = (docs || []).filter((d) => d.doc_type === 'reference' && d.status !== 'rejected').length;

  const markPending = async () => {
    if (status === 'unverified' || status === 'rejected') {
      const table = role === 'caregiver' ? 'caregiver_profiles' : role === 'agency' ? 'agency_profiles' : 'family_profiles';
      await supabase.from(table).update({ verification: 'pending' }).eq('user_id', me);
      await refresh();
    }
  };
  const upload = async (type, file) => {
    if (!/^(image\/(png|jpe?g|webp)|application\/pdf)$/.test(file.type)) { toast.error('Unsupported file', 'Please upload a PNG, JPG, WebP or PDF.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large', 'The limit is 10 MB.'); return; }
    setBusy(type);
    const ext = file.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const path = `${me}/${type}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from('verification').upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(''); toast.error('Upload failed', errText(up.error)); return; }
    const { error } = await supabase.from('verification_documents').insert({ user_id: me, doc_type: type, file_path: path });
    setBusy('');
    if (error) { toast.error('Couldn’t save the document', errText(error)); return; }
    await markPending(); reload(true);
    toast('Uploaded', 'Our team will review it, usually within 1–2 business days.');
  };
  const addRef = async () => {
    if (!ref.name?.trim() || !ref.contact?.trim()) { toast.error('Add a name and a phone or email'); return; }
    setBusy('reference');
    const { error } = await supabase.from('verification_documents').insert({ user_id: me, doc_type: 'reference', ref_name: ref.name.trim(), ref_contact: ref.contact.trim(), ref_relation: ref.relation?.trim() || null });
    setBusy('');
    if (error) { toast.error('Couldn’t add reference', errText(error)); return; }
    setRef(null); await markPending(); reload(true); toast('Reference added');
  };
  const remove = async (d) => {
    if (!(await confirm({ title: 'Remove this document?', body: 'You can upload a new one anytime.', confirm: 'Remove' }))) return;
    if (d.file_path) await supabase.storage.from('verification').remove([d.file_path]);
    const { error } = await supabase.from('verification_documents').delete().eq('id', d.id);
    if (error) { toast.error('Couldn’t remove', errText(error)); return; }
    // removing the last document in review takes the status back out of "In review" (database trigger)
    reload(true); await refresh(); toast('Removed');
  };
  const view = async (d) => { try { window.open(await signedUrl(d.file_path), '_blank', 'noopener'); } catch (e) { toast.error('Couldn’t open file', errText(e)); } };

  const steps = role === 'agency'
    ? [['business', 'Business document', 'An IRS EIN letter (CP 575 / 147C) or state registration.', has('business')], ['gov_id', 'Contact’s photo ID', 'Driver’s license, passport or state ID of the business contact.', has('gov_id') || has('library_card')]]
    : role === 'family'
      ? [['gov_id', 'Photo ID', 'Optional, but caregivers reply more to verified families. A library card also works.', has('gov_id') || has('library_card')]]
      : [['gov_id', 'Government ID or library card', 'Driver’s license, passport, state ID, or a library card.', has('gov_id') || has('library_card')],
        licensed ? ['license', 'Copy of your license', `Your ${(rp.credential || '').split(' (')[0]} license or certificate.`, has('license')] : ['reference', '2–3 references', 'People who’ve seen your work: past clients’ families, supervisors.', refs >= 2]];

  return (
    <>
      <PageHead title="Verification" sub="Documents are seen only by the Karing4Life team, never by other members. Verified members get a badge."
        badge={status === 'verified' ? <Badge tone="ok" icon="badge">Verified</Badge> : status === 'pending' ? <Badge tone="warn" icon="hourglass">In review</Badge> : status === 'rejected' ? <Badge tone="danger" icon="alert">Needs another look</Badge> : null} />
      {status === 'verified' && <Notice tone="ok" icon="badge"><strong>You’re verified.</strong> The badge shows on your profile. If your license renews, upload the new copy here.</Notice>}
      {status === 'rejected' && <Notice tone="danger" icon="alert"><strong>We couldn’t verify the documents you sent.</strong> {(docs || []).find((d) => d.status === 'rejected' && d.note)?.note || 'Please upload a clearer copy.'}</Notice>}
      {status === 'pending' && <Notice tone="warn" icon="hourglass"><strong>Thanks! Your documents are in review.</strong> This usually takes 1–2 business days. We’ll notify you.</Notice>}

      <div className="grid-main" style={{ marginTop: 16 }}>
        <div className="stack">
          {steps.map(([type, title, sub, done], i) => (
            <Card key={type}>
              <div className="flex" style={{ alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <span className="stat-ic" style={done ? { background: 'var(--success-50)', color: 'var(--success)' } : undefined}><PIcon name={done ? 'checkCircle' : DOC_ICON[type]} /></span>
                <div className="grow"><h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Step {i + 1}: {title}</h2><p className="small muted">{sub}</p></div>
                {done && <Badge tone="ok" icon="check">Added</Badge>}
              </div>
              {type === 'reference'
                ? <Btn variant="soft" icon="plus" onClick={() => setRef({})}>Add a reference</Btn>
                : <FileDrop accept="image/png,image/jpeg,image/webp,application/pdf" busy={busy === type} onFile={(f) => upload(type, f)} label={done ? 'Upload another' : 'Drop a file here or click to upload'} />}
              {type === 'gov_id' && role !== 'agency' && !done && (
                <div style={{ marginTop: 10 }}><label className="pb pb-link pb-sm" style={{ cursor: 'pointer' }}>Upload a library card instead<input type="file" hidden accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload('library_card', f); }} /></label></div>
              )}
            </Card>
          ))}
          {licensed && (
            <Card><div className="flex between flex-wrap"><div><h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>References (optional)</h2><p className="small muted">Extra references help families decide faster.</p></div><Btn variant="ghost" icon="plus" onClick={() => setRef({})}>Add reference</Btn></div></Card>
          )}
        </div>
        <div className="stack">
          <Card title="Your documents" icon="file">
            {loading ? <Skel h={56} n={2} /> : !docs.length ? <p className="muted small">Nothing uploaded yet.</p> : (
              <div className="stack-sm">{docs.map((d) => {
                const [l, t, ic] = STATUS[d.status];
                return (
                  <div key={d.id} className="doc-row">
                    <span className="d-ic"><PIcon name={DOC_ICON[d.doc_type]} /></span>
                    <span className="d-m"><strong>{d.doc_type === 'reference' ? d.ref_name : DOC_LABEL[d.doc_type]}</strong><span>{d.doc_type === 'reference' ? `${d.ref_relation || 'Reference'} · ${d.ref_contact}` : timeAgo(d.created_at)}</span></span>
                    <Badge tone={t} icon={ic}>{l}</Badge>
                    {d.file_path && <IconBtn icon="eye" size="sm" label="View" onClick={() => view(d)} />}
                    {d.status === 'pending' && <TrashBtn size="sm" label="Remove" onClick={() => remove(d)} />}
                  </div>
                );
              })}</div>
            )}
          </Card>
          <Notice icon="lock">Files are stored privately and encrypted. Only our verification team can open them.</Notice>
        </div>
      </div>

      <Modal open={!!ref} onClose={() => setRef(null)} title="Add a reference" icon="users"
        footer={<><Btn variant="ghost" onClick={() => setRef(null)}>Cancel</Btn><Btn variant="success" icon="check" loading={busy === 'reference'} onClick={addRef}>Add reference</Btn></>}>
        {ref && <div className="pf">
          <Field label="Name">{(id) => <input id={id} className="pin" maxLength={120} value={ref.name || ''} onChange={(e) => setRef({ ...ref, name: e.target.value })} autoFocus />}</Field>
          <Field label="Phone or email">{(id) => <input id={id} className="pin" maxLength={160} value={ref.contact || ''} onChange={(e) => setRef({ ...ref, contact: e.target.value })} />}</Field>
          <Field label="How do they know you?" optional>{(id) => <input id={id} className="pin" maxLength={120} placeholder="e.g. Former client’s daughter" value={ref.relation || ''} onChange={(e) => setRef({ ...ref, relation: e.target.value })} />}</Field>
          <p className="small muted">We may contact them to confirm. Please let them know.</p>
        </div>}
      </Modal>
    </>
  );
}
