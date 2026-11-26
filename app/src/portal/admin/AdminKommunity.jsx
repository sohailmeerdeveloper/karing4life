import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { Badge, Card, Empty, IconBtn, PageHead, Skel, TrashBtn, confirm, regionName, timeAgo } from '../ui.jsx';
import { loadMembers } from '../pages/Messages.jsx';

export default function AdminKommunity() {
  const { data, loading, reload } = useAsync(async () => {
    const posts = await q(supabase.from('kk_posts').select('*, kk_comments(count)').order('created_at', { ascending: false }).limit(300));
    return { posts, members: await loadMembers(posts.map((p) => p.author_id)) };
  }, []);
  const setStatus = async (p, status) => {
    const { error } = await supabase.from('kk_posts').update({ status }).eq('id', p.id);
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    await supabase.rpc('log_admin', { a: status === 'hidden' ? 'hide_kk' : 'restore_kk', tt: 'kommunity', tid: p.id, d: { title: p.title } });
    toast(status === 'hidden' ? 'Hidden from the Korner' : 'Restored'); reload(true);
  };
  const del = async (p) => {
    if (!(await confirm({ title: `Delete “${p.title}”?`, body: 'The item and its comments are removed. This can’t be undone.', confirm: 'Delete' }))) return;
    const { error } = await supabase.from('kk_posts').delete().eq('id', p.id);
    if (error) { toast.error('Couldn’t delete', errText(error)); return; }
    toast('Deleted'); reload(true);
  };
  return (
    <>
      <PageHead title="Kommunity Korner" sub="Supplies and equipment members share with each other. Hide anything that isn’t allowed (medication, sharps, anything for sale)." />
      <Card flush>
        {loading ? <div style={{ padding: 18 }}><Skel h={48} n={4} /></div> : !data.posts.length ? <Empty icon="gift" title="Nothing shared yet" /> : (
          <div className="tbl-wrap"><table className="tbl stackable">
            <thead><tr><th>Item</th><th>Shared by</th><th>Region</th><th>Status</th><th className="num">Comments</th><th /></tr></thead>
            <tbody>{data.posts.map((p) => (
              <tr key={p.id}>
                <td className="first" style={{ maxWidth: 360 }}><strong className="trunc" style={{ display: 'block' }}>{p.title}</strong><span className="small muted">{p.category} · {p.condition} · {timeAgo(p.created_at)}</span></td>
                <td data-l="By">{data.members[p.author_id]?.full_name || '—'}</td>
                <td data-l="Region">{regionName(p.region_key)}</td>
                <td data-l="Status"><Badge tone={p.status === 'hidden' ? 'danger' : p.status === 'claimed' ? 'line' : 'ok'}>{p.status}</Badge></td>
                <td data-l="Comments" className="num">{p.kk_comments?.[0]?.count ?? 0}</td>
                <td><div className="t-actions">
                  {p.status === 'hidden' ? <IconBtn icon="eye" size="sm" tone="success" label="Restore" onClick={() => setStatus(p, 'open')} /> : <IconBtn icon="eyeOff" size="sm" tone="danger" label="Hide" onClick={() => setStatus(p, 'hidden')} />}
                  <TrashBtn size="sm" label="Delete" tipPos="left" onClick={() => del(p)} />
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
