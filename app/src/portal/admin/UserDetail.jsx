import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Avatar, Badge, Btn, Card, Empty, Field, IconBtn, Modal, PageHead, PIcon, Skel, TrashBtn, Verified, confirm, daysLeft, fmtDate, money, regionName, timeAgo, CareTags, ScheduleView } from '../ui.jsx';
import { RegionOptions } from '../../components/bits.jsx';
import { ROLE_BADGE, setUserStatus, deleteUser } from './Users.jsx';
import { DOC_LABEL, signedUrl } from '../pages/Verification.jsx';
import { PaymentTable } from '../pages/Billing.jsx';
import { postState } from '../PostCard.jsx';

export default function UserDetail() {
  const { id } = useParams();
  const { me, base } = usePortal();
  const navigate = useNavigate();
  const [grant, setGrant] = useState(null);
  const [reject, setReject] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const [list, p, cg, fam, ag, subs, posts, pays, docs, reps] = await Promise.all([
      q(supabase.rpc('admin_users', { f: {} })),
      q(supabase.from('profiles').select('*').eq('id', id).maybeSingle()),
      q(supabase.from('caregiver_profiles').select('*').eq('user_id', id).maybeSingle()),
      q(supabase.from('family_profiles').select('*').eq('user_id', id).maybeSingle()),
      q(supabase.from('agency_profiles').select('*').eq('user_id', id).maybeSingle()),
      q(supabase.from('region_subscriptions').select('*').eq('user_id', id).order('created_at')),
      q(supabase.from('posts').select('*').eq('author_id', id).order('created_at', { ascending: false })),
      q(supabase.from('payments').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      q(supabase.from('verification_documents').select('*').eq('user_id', id).order('created_at', { ascending: false })),
      q(supabase.from('reports').select('*').or(`target_user_id.eq.${id},reporter_id.eq.${id}`).order('created_at', { ascending: false })),
    ]);
    if (!p) return null;
    return { u: list.find((x) => x.id === id) || { id, email: '' }, p, cg, fam, ag, subs, posts, pays, docs, reps };
  }, [id]);

  if (loading && !data) return <Skel h={160} n={3} />;
  if (!data) return <Card><Empty icon="user" title="Member not found" action={<Btn variant="primary" icon="arrowL" to={base + '/users'}>All users</Btn>} /></Card>;
  const { u, p, cg, fam, ag, subs, posts, pays, docs, reps } = data;
  const name = ag?.business_name || p.full_name || u.email;
  const verifyKind = cg ? 'caregiver' : ag ? 'agency' : 'family';
  const verification = (cg || ag || fam)?.verification;

  const decide = async (decision, note) => {
    const { error } = await supabase.rpc('admin_verify', { uid: id, p_kind: verifyKind, p_decision: decision, p_note: note || null });
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    toast(decision === 'verified' ? 'Verified' : 'Marked as needing another look', 'The member has been notified.'); setReject(null); reload(true);
  };
  const doGrant = async () => {
    if (!grant.region) { toast.error('Choose a region'); return; }
    const { error } = await supabase.rpc('admin_grant_region', { uid: id, plan_kind: grant.plan, region: grant.region, on_off: true });
    if (error) { toast.error('Couldn’t grant', errText(error)); return; }
    toast('Region access granted', `${regionName(grant.region)} for 30 days, no charge.`); setGrant(null); reload(true);
  };
  const revoke = async (s) => {
    if (!(await confirm({ title: `Remove ${regionName(s.region_key)} access?`, body: s.source === 'stripe' ? 'This stops access now. Cancel the Stripe subscription too so they aren’t charged.' : 'This ends the courtesy access right away.', confirm: 'Remove access' }))) return;
    const { error } = await supabase.rpc('admin_grant_region', { uid: id, plan_kind: s.plan, region: s.region_key, on_off: false });
    if (error) { toast.error('Couldn’t remove', errText(error)); return; }
    toast('Access removed'); reload(true);
  };
  const extend = async (days) => {
    const { error } = await supabase.rpc('admin_extend_trial', { uid: id, days });
    if (error) { toast.error('Couldn’t extend', errText(error)); return; }
    toast(`Trial extended by ${days} days`); reload(true);
  };
  const addContacts = async (post) => {
    const { error } = await supabase.rpc('admin_add_contacts', { p_post: post.id, n: 10 });
    if (error) { toast.error('Couldn’t add contacts', errText(error)); return; }
    toast('10 contacts added', post.title); reload(true);
  };
  const hidePost = async (post, hide) => {
    const { error } = await supabase.from('posts').update({ status: hide ? 'hidden' : 'open', flagged: false }).eq('id', post.id);
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    await supabase.rpc('log_admin', { a: hide ? 'hide_post' : 'restore_post', tt: 'post', tid: post.id, d: { title: post.title } });
    toast(hide ? 'Post hidden' : 'Post restored'); reload(true);
  };
  const viewDoc = async (d) => { try { window.open(await signedUrl(d.file_path), '_blank', 'noopener'); } catch (e) { toast.error('Couldn’t open file', errText(e)); } };

  return (
    <>
      <PageHead back={[base + '/users', 'All users']} title={name}
        badge={<>{p.roles.map((r) => <Badge key={r} tone={r === 'admin' ? 'ink' : 'line'}>{ROLE_BADGE[r]}</Badge>)}{p.status === 'suspended' && <Badge tone="danger" icon="ban">Suspended</Badge>}</>}
        actions={id !== me && <>
          {p.status === 'active'
            ? <Btn variant="soft-danger" icon="ban" onClick={async () => { if (await setUserStatus({ ...u, full_name: name }, 'suspended')) reload(true); }}>Suspend</Btn>
            : <Btn variant="success" icon="undo" onClick={async () => { if (await setUserStatus({ ...u, full_name: name }, 'active')) reload(true); }}>Reactivate</Btn>}
          <TrashBtn bordered label="Delete member" onClick={async () => { if (await deleteUser({ ...u, full_name: name })) navigate(base + '/users'); }} />
        </>} />

      <div className="grid-main">
        <div className="stack">
          <Card>
            <div className="prof-head">
              <Avatar name={name} url={ag?.logo_url || p.avatar_url} size="lg" square={!!ag} />
              <div className="ph-m">
                <div className="kv">
                  <div><span className="k">Email</span><span className="v" style={{ wordBreak: 'break-all' }}>{u.email}</span></div>
                  <div><span className="k">Town · region</span><span className="v">{p.town || '—'} · {regionName(p.region_key)}</span></div>
                  <div><span className="k">Joined</span><span className="v">{fmtDate(p.created_at)}</span></div>
                  <div><span className="k">Last seen</span><span className="v">{p.last_seen_at ? timeAgo(p.last_seen_at) : 'Never'}</span></div>
                  <div><span className="k">Setup finished</span><span className="v">{p.onboarded ? 'Yes' : 'Not yet'}</span></div>
                  {fam?.address && <div><span className="k">Address (private)</span><span className="v">{fam.address}{fam.zip ? ', ' + fam.zip : ''}</span></div>}
                </div>
              </div>
            </div>
          </Card>

          {cg && (
            <Card title="Caregiver profile" icon="steth">
              <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 12 }}><Badge tone="line">{cg.credential || 'No credential'}</Badge>{cg.license_number && <Badge tone="line" icon="fileCheck">License {cg.license_number}</Badge>}<Badge tone={cg.availability === 'fillin' ? 'sand' : 'ok'}>{cg.availability === 'fillin' ? 'Fill-in' : 'Available'}</Badge></div>
              {cg.headline && <p style={{ fontWeight: 700 }}>{cg.headline}</p>}
              <p className="small" style={{ color: 'var(--ink-2)', margin: '6px 0 12px', whiteSpace: 'pre-wrap' }}>{cg.bio}</p>
              <CareTags keys={cg.care_types} />
              <div className="divider" />
              <ScheduleView value={cg.schedule} />
              <div className="divider" />
              <div className="flex between flex-wrap"><span className="small"><strong>Trial:</strong> {daysLeft(cg.trial_ends_at) > 0 ? `${daysLeft(cg.trial_ends_at)} days left (until ${fmtDate(cg.trial_ends_at)})` : `ended ${fmtDate(cg.trial_ends_at)}`}</span>
                <span className="flex"><Btn size="sm" variant="ghost" onClick={() => extend(7)}>+7 days</Btn><Btn size="sm" variant="ghost" onClick={() => extend(14)}>+14 days</Btn></span></div>
            </Card>
          )}
          {ag && (
            <Card title="Agency details" icon="building">
              <div className="kv">
                <div><span className="k">Type</span><span className="v">{ag.agency_type}</span></div>
                <div><span className="k">EIN</span><span className="v">{ag.ein || '—'}</span></div>
                <div><span className="k">Website</span><span className="v">{ag.website ? <a href={ag.website} target="_blank" rel="noreferrer noopener">{ag.website}</a> : '—'}</span></div>
                <div><span className="k">Contact</span><span className="v">{ag.contact_name || '—'}</span></div>
              </div>
            </Card>
          )}

          <Card title={`Posts (${posts.length})`} icon="list" flush>
            {!posts.length ? <p className="muted small" style={{ padding: '0 20px 18px' }}>No posts.</p> : <div className="rows">{posts.map((x) => {
              const [st, tone] = postState(x);
              return (
                <div key={x.id} className="row">
                  <span className="r-main"><span className="r-t">{x.title}</span><span className="r-s">{x.kind === 'family' ? 'Care request' : 'Job'} · {regionName(x.region_key)} · {timeAgo(x.created_at)}{x.edit_count ? ` · edited ${x.edit_count}×` : ''}</span></span>
                  <span className="r-end">
                    {x.flagged && <Badge tone="warn" icon="flag">Flagged</Badge>}<Badge tone={tone}>{st}</Badge>
                    {x.kind === 'family' && <IconBtn icon="plus" size="sm" tone="success" label="Add 10 contacts (free)" onClick={() => addContacts(x)} />}
                    {x.status === 'hidden' ? <IconBtn icon="eye" size="sm" tone="success" label="Restore post" onClick={() => hidePost(x, false)} /> : <IconBtn icon="eyeOff" size="sm" tone="danger" label="Hide post" onClick={() => hidePost(x, true)} />}
                  </span>
                </div>
              );
            })}</div>}
          </Card>
          <Card title="Payments" icon="receipt" flush><PaymentTable rows={pays} /></Card>
        </div>

        <div className="stack">
          <Card title="Verification" icon="shieldCheck">
            <div className="flex between" style={{ marginBottom: 12 }}><span>{verification === 'verified' ? <Verified status="verified" /> : <Badge tone={verification === 'pending' ? 'warn' : verification === 'rejected' ? 'danger' : 'muted'}>{verification === 'pending' ? 'In review' : verification === 'rejected' ? 'Rejected' : 'Not verified'}</Badge>}</span></div>
            {docs.length === 0 ? <p className="small muted">No documents uploaded.</p> : <div className="stack-sm">{docs.map((d) => (
              <div key={d.id} className="doc-row">
                <span className="d-m"><strong>{d.doc_type === 'reference' ? `Reference: ${d.ref_name}` : DOC_LABEL[d.doc_type]}</strong><span>{d.doc_type === 'reference' ? `${d.ref_relation || ''} · ${d.ref_contact}` : `${d.status} · ${timeAgo(d.created_at)}`}</span></span>
                {d.file_path && <IconBtn icon="eye" size="sm" label="Open document" onClick={() => viewDoc(d)} />}
              </div>
            ))}</div>}
            <div className="flex" style={{ marginTop: 14 }}>
              <Btn variant="success" icon="check" size="sm" onClick={() => decide('verified')} disabled={verification === 'verified'}>Approve</Btn>
              <Btn variant="soft-danger" icon="x" size="sm" onClick={() => setReject({ note: '' })}>Reject</Btn>
            </div>
          </Card>

          {(cg || ag) && (
            <Card title="Region access" icon="map" action={<IconBtn icon="plus" tone="success" label="Grant region access" bordered size="sm" onClick={() => setGrant({ plan: cg ? 'caregiver' : 'agency', region: '' })} />}>
              {subs.filter((s) => s.status !== 'canceled').length === 0 ? <p className="small muted">No active regions{cg && daysLeft(cg.trial_ends_at) > 0 ? ' (on free trial)' : ''}.</p> : (
                <div className="stack-sm">{subs.filter((s) => s.status !== 'canceled').map((s) => (
                  <div key={s.id} className="doc-row">
                    <span className="d-m"><strong>{regionName(s.region_key)}</strong><span>{s.plan} · {s.source === 'admin' ? 'courtesy' : 'paid'} · renews {fmtDate(s.current_period_end)}</span></span>
                    <Badge tone={s.status === 'active' ? 'ok' : 'warn'}>{s.status === 'active' ? 'Active' : 'Past due'}</Badge>
                    <TrashBtn size="sm" label="Remove access" tipPos="left" onClick={() => revoke(s)} />
                  </div>
                ))}</div>
              )}
              {cg && <p className="small muted" style={{ marginTop: 10 }}>Chosen regions: {cg.service_regions.map(regionName).join(', ') || 'none'}</p>}
            </Card>
          )}

          <Card title={`Reports (${reps.length})`} icon="flag">
            {reps.length === 0 ? <p className="small muted">No reports involving this member.</p> : <div className="stack-sm">{reps.map((r) => (
              <Link key={r.id} to={base + '/reports'} className="doc-row" style={{ color: 'inherit' }}>
                <span className="d-m"><strong>{r.target_user_id === id ? 'Reported' : 'Filed a report'}: {r.reason}</strong><span>{r.details || '—'}</span></span>
                <Badge tone={r.status === 'open' ? 'danger' : 'muted'}>{r.status}</Badge>
              </Link>
            ))}</div>}
          </Card>
          {p.roles.includes('caregiver') || p.roles.includes('family') || p.roles.includes('agency') ? (
            <Card title="Total paid" icon="dollar"><strong style={{ fontSize: 26 }}>{money(pays.filter((x) => x.status === 'paid').reduce((s, x) => s + x.amount_cents, 0))}</strong><p className="small muted">{pays.length} payment{pays.length === 1 ? '' : 's'}</p></Card>
          ) : null}
        </div>
      </div>

      <Modal open={!!grant} onClose={() => setGrant(null)} title="Grant region access" icon="map"
        footer={<><Btn variant="ghost" onClick={() => setGrant(null)}>Cancel</Btn><Btn variant="success" icon="check" onClick={doGrant}>Grant 30 days</Btn></>}>
        {grant && <div className="pf">
          <p className="muted small">Gives free access to a region for 30 days (a courtesy or goodwill gesture). No charge is made.</p>
          <Field label="Plan">{(fid) => <select id={fid} className="psel" value={grant.plan} onChange={(e) => setGrant({ ...grant, plan: e.target.value })}>{cg && <option value="caregiver">Caregiver Region Access</option>}{ag && <option value="agency">Agency Access</option>}</select>}</Field>
          <Field label="Region">{(fid) => <select id={fid} className="psel" value={grant.region} onChange={(e) => setGrant({ ...grant, region: e.target.value })}><RegionOptions any="Select a region" /></select>}</Field>
        </div>}
      </Modal>
      <Modal open={!!reject} onClose={() => setReject(null)} title="Ask for another document" icon="alert"
        footer={<><Btn variant="ghost" onClick={() => setReject(null)}>Cancel</Btn><Btn variant="danger" icon="send" onClick={() => decide('rejected', reject.note)}>Send to member</Btn></>}>
        {reject && <Field label="What should they fix?" hint="The member sees this message.">{(fid) => <textarea id={fid} className="pta" value={reject.note} onChange={(e) => setReject({ note: e.target.value })} placeholder="e.g. The photo is blurry. Please upload a clear photo of the front of your ID." autoFocus />}</Field>}
      </Modal>
    </>
  );
}
