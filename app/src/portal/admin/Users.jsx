import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Avatar, Badge, Btn, Card, Empty, IconBtn, PageHead, PIcon, Skel, TrashBtn, confirm, fmtDate, regionName, timeAgo } from '../ui.jsx';

export const ROLE_BADGE = { caregiver: 'Caregiver', family: 'Family', agency: 'Agency', admin: 'Admin' };
const VER = { verified: ['Verified', 'ok'], pending: ['In review', 'warn'], rejected: ['Rejected', 'danger'], unverified: ['Not verified', 'muted'] };

export async function setUserStatus(u, next) {
  const suspend = next === 'suspended';
  if (!(await confirm({ title: suspend ? `Suspend ${u.full_name || u.email}?` : `Reactivate ${u.full_name || u.email}?`, body: suspend ? 'They lose access to every feature right away, their posts stop showing and they can’t message. You can undo this.' : 'They’ll be able to sign in and use Karing4Life again.', confirm: suspend ? 'Suspend' : 'Reactivate', tone: suspend ? 'danger' : 'ok', icon: suspend ? 'ban' : 'check' }))) return false;
  const { error } = await supabase.rpc('admin_set_status', { uid: u.id, new_status: next, reason: null });
  if (error) { toast.error('Couldn’t update', errText(error)); return false; }
  toast(suspend ? 'Member suspended' : 'Member reactivated'); return true;
}
export async function deleteUser(u) {
  if (!(await confirm({ title: `Delete ${u.full_name || u.email} permanently?`, body: 'Their account, profile, posts and messages are deleted. This can’t be undone. Consider suspending instead.', confirm: 'Delete forever' }))) return false;
  const { error } = await supabase.rpc('admin_delete_user', { uid: u.id });
  if (error) { toast.error('Couldn’t delete', errText(error)); return false; }
  toast('Member deleted'); return true;
}

function csv(rows) {
  const head = ['Name', 'Email', 'Roles', 'Status', 'Verification', 'Region', 'Joined'];
  const lines = rows.map((u) => [u.business_name || u.full_name, u.email, u.roles.join('/'), u.status, u.verification || '', regionName(u.region_key), u.created_at.slice(0, 10)].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const url = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = 'karing4life-members.csv'; a.click(); URL.revokeObjectURL(url);
}

export default function Users() {
  const { me, base } = usePortal();
  const navigate = useNavigate();
  const [f, setF] = useState({ q: '', role: '', status: '' });
  const [dq, setDq] = useState(f);
  useEffect(() => { const t = setTimeout(() => setDq(f), 250); return () => clearTimeout(t); }, [f]);
  const { data, loading, reload } = useAsync(() => q(supabase.rpc('admin_users', { f: dq })), [dq]);

  return (
    <>
      <PageHead title="Users" sub="Search every member, open their details, verify, suspend or delete." help="Click a row to see everything about a member."
        actions={<Btn variant="ghost" icon="download" disabled={!data?.length} onClick={() => csv(data)}>Export CSV</Btn>} />
      <div className="toolbar">
        <div className="pin-ic"><PIcon name="search" /><input className="pin" placeholder="Name, email or business" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Search users" /></div>
        <select className="psel" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} aria-label="Role"><option value="">All roles</option>{Object.entries(ROLE_BADGE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className="psel" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      <Card flush>
        {loading && !data ? <div style={{ padding: 18 }}><Skel h={48} n={5} /></div> : !data.length ? <Empty icon="users" title="No members match" /> : (
          <div className="tbl-wrap"><table className="tbl stackable">
            <thead><tr><th>Member</th><th>Role</th><th>Verification</th><th>Region</th><th>Joined</th><th>Last seen</th><th /></tr></thead>
            <tbody>{data.map((u) => {
              const [vl, vt] = VER[u.verification || 'unverified'];
              return (
                <tr key={u.id} className="clickable" onClick={() => navigate(base + '/users/' + u.id)}>
                  <td className="first"><div className="cell-user"><Avatar name={u.business_name || u.full_name} size="sm" /><div style={{ minWidth: 0 }}><strong>{u.business_name || u.full_name || '—'}</strong><span>{u.email}</span></div></div></td>
                  <td data-l="Role"><div className="tags">{u.roles.map((r) => <Badge key={r} tone={r === 'admin' ? 'ink' : 'line'}>{ROLE_BADGE[r]}</Badge>)}{u.status === 'suspended' && <Badge tone="danger" icon="ban">Suspended</Badge>}</div></td>
                  <td data-l="Verification"><Badge tone={vt}>{vl}</Badge></td>
                  <td data-l="Region">{regionName(u.region_key)}</td>
                  <td data-l="Joined">{fmtDate(u.created_at)}</td>
                  <td data-l="Last seen">{u.last_seen_at ? timeAgo(u.last_seen_at) : 'Never'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="t-actions">
                      <IconBtn icon="eye" size="sm" label="Open details" to={base + '/users/' + u.id} />
                      {u.id !== me && (u.status === 'active'
                        ? <IconBtn icon="ban" size="sm" tone="danger" label="Suspend" onClick={async () => { if (await setUserStatus(u, 'suspended')) reload(true); }} />
                        : <IconBtn icon="undo" size="sm" tone="success" label="Reactivate" onClick={async () => { if (await setUserStatus(u, 'active')) reload(true); }} />)}
                      {u.id !== me && <TrashBtn size="sm" label="Delete member" tipPos="left" onClick={async () => { if (await deleteUser(u)) reload(true); }} />}
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
