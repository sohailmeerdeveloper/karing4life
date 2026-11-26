import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Badge, Btn, Card, Empty, Field, Modal, PageHead, PIcon, Seg, Skel, fmtDate, timeAgo } from '../ui.jsx';
import { loadMembers } from '../pages/Messages.jsx';
import { setUserStatus } from './Users.jsx';

const REASON = { spam: 'Spam', recruiter: 'Recruiter', scam: 'Scam', inappropriate: 'Inappropriate', safety: 'Safety concern', other: 'Other' };

export default function Reports() {
  const { base, refreshCounts } = usePortal();
  const [tab, setTab] = useState('open');
  const [resolve, setResolve] = useState(null);
  const [chat, setChat] = useState(null);
  const { data, loading, reload } = useAsync(async () => {
    const reps = await q(supabase.from('reports').select('*').eq('status', tab).order('created_at', { ascending: false }).limit(200));
    const postIds = reps.map((r) => r.target_post_id).filter(Boolean);
    const [members, posts] = await Promise.all([
      loadMembers(reps.flatMap((r) => [r.reporter_id, r.target_user_id])),
      postIds.length ? q(supabase.from('posts').select('id,title,status').in('id', postIds)) : [],
    ]);
    return { reps, members, posts: Object.fromEntries(posts.map((p) => [p.id, p])) };
  }, [tab]);

  const close = async (r, status, resolution) => {
    const { error } = await supabase.from('reports').update({ status, resolution: resolution || null, resolved_at: new Date().toISOString() }).eq('id', r.id);
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    await supabase.rpc('log_admin', { a: status === 'resolved' ? 'resolve_report' : 'dismiss_report', tt: 'report', tid: r.id, d: { note: resolution || null } });
    toast(status === 'resolved' ? 'Report resolved' : 'Report dismissed'); setResolve(null); reload(true); refreshCounts();
  };
  const hidePost = async (r) => {
    const { error } = await supabase.from('posts').update({ status: 'hidden' }).eq('id', r.target_post_id);
    if (error) { toast.error('Couldn’t hide', errText(error)); return; }
    await supabase.rpc('log_admin', { a: 'hide_post', tt: 'post', tid: r.target_post_id, d: { report: r.id } });
    toast('Post hidden'); reload(true);
  };
  const openChat = async (r) => {
    const msgs = await q(supabase.from('messages').select('*').eq('conversation_id', r.conversation_id).order('created_at').limit(200));
    setChat({ r, msgs });
  };
  const name = (id) => data.members[id]?.agency?.business_name || data.members[id]?.full_name || 'Member';

  return (
    <>
      <PageHead title="Reports" sub="Reports from members about people, posts or conversations. Reporters stay anonymous to the reported member." />
      <div style={{ marginBottom: 16 }}><Seg value={tab} onChange={setTab} tabs={[['open', 'Open'], ['resolved', 'Resolved'], ['dismissed', 'Dismissed']]} /></div>
      {loading && !data ? <Skel h={150} n={2} /> : !data.reps.length ? <Card><Empty icon="flag" title={tab === 'open' ? 'No open reports' : 'Nothing here'} body={tab === 'open' ? 'Nice and quiet.' : undefined} /></Card> : (
        <div className="stack">{data.reps.map((r) => (
          <Card key={r.id}>
            <div className="flex between flex-wrap" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
              <div className="flex flex-wrap" style={{ gap: 8 }}><Badge tone={r.reason === 'safety' || r.reason === 'scam' ? 'danger' : 'warn'} icon="flag">{REASON[r.reason]}</Badge><span className="small muted">{timeAgo(r.created_at)}</span></div>
              {r.status !== 'open' && <Badge tone="muted">{r.status} {r.resolved_at && fmtDate(r.resolved_at)}</Badge>}
            </div>
            <p style={{ marginBottom: 12 }}>{r.details || <span className="muted">No details given.</span>}</p>
            <div className="post-meta" style={{ marginBottom: 14 }}>
              <span><PIcon name="user" />By <Link to={base + '/users/' + r.reporter_id}>{name(r.reporter_id)}</Link></span>
              {r.target_user_id && <span><PIcon name="alert" />About <Link to={base + '/users/' + r.target_user_id}><strong>{name(r.target_user_id)}</strong></Link></span>}
              {r.target_post_id && data.posts[r.target_post_id] && <span><PIcon name="list" />Post: {data.posts[r.target_post_id].title} ({data.posts[r.target_post_id].status})</span>}
            </div>
            {r.resolution && <p className="small muted" style={{ marginBottom: 12 }}><strong>Resolution:</strong> {r.resolution}</p>}
            {r.status === 'open' && (
              <div className="flex flex-wrap">
                {r.conversation_id && <Btn size="sm" variant="ghost" icon="msg" onClick={() => openChat(r)}>Read conversation</Btn>}
                {r.target_post_id && data.posts[r.target_post_id]?.status !== 'hidden' && <Btn size="sm" variant="soft-danger" icon="eyeOff" onClick={() => hidePost(r)}>Hide post</Btn>}
                {r.target_user_id && <Btn size="sm" variant="soft-danger" icon="ban" onClick={async () => { if (await setUserStatus({ id: r.target_user_id, full_name: name(r.target_user_id) }, 'suspended')) reload(true); }}>Suspend member</Btn>}
                <span style={{ flex: 1 }} />
                <Btn size="sm" variant="ghost" onClick={() => close(r, 'dismissed')}>Dismiss</Btn>
                <Btn size="sm" variant="success" icon="check" onClick={() => setResolve({ r, note: '' })}>Resolve</Btn>
              </div>
            )}
          </Card>
        ))}</div>
      )}
      <Modal open={!!resolve} onClose={() => setResolve(null)} title="Resolve report" icon="check"
        footer={<><Btn variant="ghost" onClick={() => setResolve(null)}>Cancel</Btn><Btn variant="success" icon="check" onClick={() => close(resolve.r, 'resolved', resolve.note)}>Resolve</Btn></>}>
        {resolve && <Field label="What did you do?" optional hint="For your records only.">{(id) => <textarea id={id} className="pta" autoFocus value={resolve.note} onChange={(e) => setResolve({ ...resolve, note: e.target.value })} placeholder="e.g. Warned the member; post hidden." />}</Field>}
      </Modal>
      <Modal open={!!chat} onClose={() => setChat(null)} title="Reported conversation" icon="msg" size="lg">
        {chat && <div className="chat-body" style={{ maxHeight: '60vh', borderRadius: 12 }}>
          {chat.msgs.map((m) => (
            <div key={m.id} style={{ display: 'contents' }}>
              <div className="msg-meta" style={{ alignSelf: m.sender_id === chat.r.target_user_id ? 'flex-start' : 'flex-end' }}>{name(m.sender_id)} · {timeAgo(m.created_at)}</div>
              <div className={'msg ' + (m.sender_id === chat.r.target_user_id ? 'in' : 'out')}>{m.body}</div>
            </div>
          ))}
        </div>}
      </Modal>
    </>
  );
}
