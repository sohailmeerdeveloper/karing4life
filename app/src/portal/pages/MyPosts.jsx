import { useState } from 'react';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Btn, Card, Empty, IconBtn, Notice, PageHead, Seg, Skel, TrashBtn, confirm, fmtDate } from '../ui.jsx';
import PostCard, { postState } from '../PostCard.jsx';

export function nextFreePost(posts, days = 14) {
  const last = posts.filter((p) => p.kind === 'family').map((p) => new Date(p.created_at)).sort((a, b) => b - a)[0];
  if (!last) return null;
  const next = new Date(last.getTime() + days * 864e5);
  return next > new Date() ? next : null;
}

export default function MyPosts() {
  const { me, role, base, price } = usePortal();
  const isAgency = role === 'agency';
  const kind = isAgency ? 'agency' : 'family';
  const path = base + (isAgency ? '/jobs' : '/requests');
  const [tab, setTab] = useState('open');
  const { data, loading, reload } = useAsync(async () => {
    const posts = await q(supabase.from('posts').select('*').eq('author_id', me).eq('kind', kind).order('created_at', { ascending: false }));
    const ids = posts.map((p) => p.id);
    const [convs, quotas, regions] = await Promise.all([
      ids.length ? q(supabase.from('conversations').select('post_id').in('post_id', ids)) : [],
      !isAgency && ids.length ? q(supabase.from('contact_quotas').select('*').in('post_id', ids)) : [],
      isAgency ? q(supabase.rpc('access_regions', { uid: me, plan_kind: 'agency' })) : [],
    ]);
    const count = {}; convs.forEach((c) => { count[c.post_id] = (count[c.post_id] || 0) + 1; });
    return { posts, count, quotas: Object.fromEntries(quotas.map((x) => [x.post_id, x])), regions };
  }, [me, kind]);

  const posts = data?.posts || [];
  const open = posts.filter((p) => postState(p)[0] === 'Open');
  const past = posts.filter((p) => postState(p)[0] !== 'Open');
  const list = tab === 'open' ? open : past;
  const cooldown = !isAgency ? nextFreePost(posts, price('family_post_cooldown_days', 14)) : null;
  const noRegions = isAgency && data && !data.regions.length;

  const del = async (p) => {
    if (!(await confirm({ title: `Delete “${p.title}”?`, body: 'It disappears for everyone. Conversations stay in Messages. This can’t be undone.', confirm: 'Delete' }))) return;
    const { error } = await supabase.from('posts').delete().eq('id', p.id);
    if (error) { toast.error('Couldn’t delete', errText(error)); return; }
    toast('Post deleted'); reload(true);
  };
  const close = async (p) => {
    const { error } = await supabase.from('posts').update({ status: 'closed' }).eq('id', p.id);
    if (error) { toast.error('Couldn’t close', errText(error)); return; }
    toast('Closed', 'Caregivers no longer see it.'); reload(true);
  };

  const newBtn = cooldown
    ? <span data-tip={`Your next free request opens ${fmtDate(cooldown.toISOString(), { month: 'long', day: 'numeric' })}`}><Btn variant="accent" icon="plus" disabled>New request</Btn></span>
    : noRegions ? <span data-tip="Subscribe to a region first"><Btn variant="accent" icon="plus" disabled>New job post</Btn></span>
    : <Btn variant="accent" icon="plus" to={path + '/new'}>{isAgency ? 'New job post' : 'New request'}</Btn>;

  return (
    <>
      <PageHead title={isAgency ? 'Job posts' : 'My care requests'}
        sub={isAgency ? 'Post as many jobs as you need in your subscribed regions. Caregivers there are notified.' : 'Post one free request every 14 days. Each one lets you contact 10 caregivers free.'}
        help={isAgency ? 'Family requests are never visible to agencies.' : 'Requests stay open for 14 days. You can edit them while open; several edits send the post for a quick review.'}
        actions={newBtn} />
      {cooldown && <Notice icon="hourglass">Your next free request opens on <strong>{fmtDate(cooldown.toISOString(), { weekday: 'long', month: 'long', day: 'numeric' })}</strong>. Meanwhile you can keep messaging caregivers from your open request.</Notice>}
      {noRegions && <Notice tone="warn" icon="map" action={<Btn size="sm" variant="accent" to={base + '/regions'}>Choose regions</Btn>}>Subscribe to at least one region to post jobs.</Notice>}
      <div style={{ margin: '16px 0' }}><Seg value={tab} onChange={setTab} tabs={[['open', 'Open', open.length], ['past', isAgency ? 'Closed' : 'Closed & expired', past.length]]} /></div>
      {loading ? <Skel h={170} n={2} />
        : list.length === 0 ? <Card><Empty icon={isAgency ? 'briefcase' : 'list'} title={tab === 'open' ? (isAgency ? 'No open jobs' : 'No open requests') : 'Nothing here yet'}
          body={tab === 'open' ? (isAgency ? 'Post a job and caregivers in that region will see it right away.' : 'Describe the care you need. It’s free and takes about two minutes.') : 'Closed and expired posts show up here.'}
          action={tab === 'open' && !cooldown && !noRegions && <Btn variant="accent" icon="plus" to={path + '/new'}>{isAgency ? 'Post a job' : 'Post a request'}</Btn>} /></Card>
        : <div className="post-list">{list.map((p) => {
          const qq = data.quotas[p.id];
          const editable = p.status !== 'hidden' && (isAgency || new Date(p.expires_at) > new Date());
          return (
            <PostCard key={p.id} p={p} to={path + '/' + p.id} showState>
              <span className="small muted">
                {data.count[p.id] || 0} conversation{data.count[p.id] === 1 ? '' : 's'}
                {qq && <> · {Math.max(0, qq.free_limit + qq.extra - qq.used)} of {qq.free_limit + qq.extra} contacts left</>}
              </span>
              <span className="actions">
                {editable && <IconBtn icon="edit" size="sm" label="Edit" to={`${path}/${p.id}/edit`} />}
                {p.status === 'open' && editable && <IconBtn icon="lock" size="sm" label="Close post" onClick={() => close(p)} />}
                <TrashBtn size="sm" label="Delete post" onClick={() => del(p)} />
                <Btn size="sm" variant="ghost" iconRight="arrowR" to={path + '/' + p.id}>Open</Btn>
              </span>
            </PostCard>
          );
        })}</div>}
    </>
  );
}
