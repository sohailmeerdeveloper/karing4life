import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Badge, Btn, Card, Empty, IconBtn, Modal, PageHead, PIcon, Seg, Skel, TrashBtn, ScheduleView, CareTags, confirm, regionName, timeAgo } from '../ui.jsx';
import { postState } from '../PostCard.jsx';
import { loadMembers } from '../pages/Messages.jsx';
import { RegionOptions } from '../../components/bits.jsx';

export default function AdminPosts() {
  const { base, refreshCounts } = usePortal();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('f') || 'all');
  const [text, setText] = useState('');
  const [region, setRegion] = useState('');
  const [view, setView] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const posts = await q(supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(500));
    return { posts, members: await loadMembers(posts.map((p) => p.author_id)) };
  }, []);
  const posts = data?.posts || [];
  const list = useMemo(() => posts.filter((p) =>
    (tab === 'all' || (tab === 'flagged' && p.flagged && p.status !== 'hidden') || (tab === 'hidden' && p.status === 'hidden') || (tab === p.kind)) &&
    (!region || p.region_key === region) && (!text || (p.title + ' ' + p.body).toLowerCase().includes(text.toLowerCase()))), [posts, tab, region, text]);

  const log = (a, p) => supabase.rpc('log_admin', { a, tt: 'post', tid: p.id, d: { title: p.title } });
  const act = async (p, patch, msg, action) => {
    const { error } = await supabase.from('posts').update(patch).eq('id', p.id);
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    await log(action, p); toast(msg); setView(null); reload(true); refreshCounts();
  };
  const del = async (p) => {
    if (!(await confirm({ title: 'Delete this post?', body: `“${p.title}” is removed for everyone. This can’t be undone. Hiding is usually better.`, confirm: 'Delete post' }))) return;
    const { error } = await supabase.from('posts').delete().eq('id', p.id);
    if (error) { toast.error('Couldn’t delete', errText(error)); return; }
    await log('delete_post', p); toast('Post deleted'); setView(null); reload(true); refreshCounts();
  };
  const author = (p) => { const m = data.members[p.author_id]; return p.kind === 'agency' ? m?.agency?.business_name || m?.full_name : m?.full_name; };
  const actions = (p) => (<>
    {p.flagged && p.status !== 'hidden' && <IconBtn icon="check" size="sm" tone="success" label="Looks fine, clear flag" onClick={() => act(p, { flagged: false }, 'Flag cleared', 'approve_post')} />}
    {p.status === 'hidden' ? <IconBtn icon="eye" size="sm" tone="success" label="Restore post" onClick={() => act(p, { status: 'open', flagged: false }, 'Post restored', 'restore_post')} />
      : <IconBtn icon="eyeOff" size="sm" tone="danger" label="Hide post" onClick={() => act(p, { status: 'hidden', flagged: false }, 'Post hidden', 'hide_post')} />}
    <TrashBtn size="sm" label="Delete post" tipPos="left" onClick={() => del(p)} />
  </>);

  return (
    <>
      <PageHead title="Posts" sub="Every care request and job post. Hide anything that breaks the rules; flagged posts were edited several times." />
      <div className="toolbar">
        <div className="pin-ic"><PIcon name="search" /><input className="pin" placeholder="Search titles and text" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search posts" /></div>
        <select className="psel" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region"><RegionOptions any="All regions" /></select>
      </div>
      <div style={{ marginBottom: 16 }}><Seg value={tab} onChange={setTab} tabs={[['all', 'All', posts.length], ['flagged', 'Flagged', posts.filter((p) => p.flagged && p.status !== 'hidden').length], ['family', 'Care requests'], ['agency', 'Jobs'], ['hidden', 'Hidden', posts.filter((p) => p.status === 'hidden').length]]} /></div>
      <Card flush>
        {loading && !data ? <div style={{ padding: 18 }}><Skel h={48} n={5} /></div> : !list.length ? <Empty icon="list" title="No posts here" /> : (
          <div className="tbl-wrap"><table className="tbl stackable">
            <thead><tr><th>Post</th><th>Author</th><th>Region</th><th>Status</th><th>Posted</th><th /></tr></thead>
            <tbody>{list.map((p) => {
              const [st, tone] = postState(p);
              return (
                <tr key={p.id} className="clickable" onClick={() => setView(p)}>
                  <td className="first" style={{ maxWidth: 340 }}><strong className="trunc" style={{ display: 'block' }}>{p.title}</strong><span className="small muted">{p.kind === 'family' ? 'Care request' : 'Job'}{p.edit_count ? ` · edited ${p.edit_count}×` : ''}</span></td>
                  <td data-l="Author" onClick={(e) => e.stopPropagation()}><Link to={base + '/users/' + p.author_id}>{author(p) || '—'}</Link></td>
                  <td data-l="Region">{regionName(p.region_key)}</td>
                  <td data-l="Status"><div className="tags"><Badge tone={tone}>{st}</Badge>{p.flagged && p.status !== 'hidden' && <Badge tone="warn" icon="flag">Flagged</Badge>}</div></td>
                  <td data-l="Posted">{timeAgo(p.created_at)}</td>
                  <td onClick={(e) => e.stopPropagation()}><div className="t-actions">{actions(p)}</div></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </Card>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.title} icon="list" size="lg" footer={view && <div className="flex" style={{ gap: 4 }}>{actions(view)}</div>}>
        {view && <div className="stack-sm">
          <div className="post-meta"><span><PIcon name="user" />{author(view)}</span><span><PIcon name="pin" />{view.town ? view.town + ' · ' : ''}{regionName(view.region_key)}</span><span><PIcon name="clock" />{timeAgo(view.created_at)}</span></div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{view.body}</p>
          <CareTags keys={view.care_types} />
          <ScheduleView value={view.schedule} />
        </div>}
      </Modal>
    </>
  );
}
