import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal, otherOf } from '../context.jsx';
import { Avatar, Badge, Btn, Card, CareTags, Empty, IconBtn, Notice, PageHead, PIcon, Progress, ScheduleView, Skel, TrashBtn, confirm, fmtDate, regionName, timeAgo, daysLeft } from '../ui.jsx';
import { postState } from '../PostCard.jsx';
import { loadMembers, memberName, ReportModal } from './Messages.jsx';
import StartChat from '../StartChat.jsx';

export default function PostView() {
  const { id } = useParams();
  const { me, role, base } = usePortal();
  const navigate = useNavigate();
  const own = role !== 'caregiver';
  const listPath = base + (role === 'caregiver' ? '/posts' : role === 'agency' ? '/jobs' : '/requests');
  const [chat, setChat] = useState(false);
  const [report, setReport] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const post = await q(supabase.from('posts').select('*').eq('id', id).maybeSingle());
    if (!post) return null;
    if (own && post.author_id !== me) return null;
    const convs = await q(own
      ? supabase.from('conversations').select('*').eq('post_id', id).or(`user_a.eq.${me},user_b.eq.${me}`).order('last_message_at', { ascending: false })
      : supabase.from('conversations').select('id').eq('post_id', id).eq('user_a', me).eq('role_a', 'caregiver'));
    const quota = own && post.kind === 'family' ? (await supabase.from('contact_quotas').select('*').eq('post_id', id).maybeSingle()).data : null;
    const members = await loadMembers([post.author_id, ...convs.map((c) => otherOf(c, me).id)]);
    return { post, convs, quota, members };
  }, [id, me]);

  if (loading) return <Skel h={200} n={2} />;
  if (error || !data) return <Card><Empty icon="lock" title="This post isn’t available" body={role === 'caregiver' ? 'It may have closed, or it’s in a region you haven’t unlocked.' : 'It may have been deleted.'} action={<Btn variant="primary" to={listPath} icon="arrowL">Back</Btn>} /></Card>;
  const { post: p, convs, quota, members } = data;
  const author = members[p.author_id];
  const isAgency = p.kind === 'agency';
  const [st, tone, ic] = postState(p);
  const editable = own && p.status !== 'hidden' && (isAgency || new Date(p.expires_at) > new Date());
  const authorName = memberName(author, p.kind);

  const setStatus = async (status) => {
    const { error: e } = await supabase.from('posts').update({ status }).eq('id', p.id);
    if (e) { toast.error('Couldn’t update', errText(e)); return; }
    toast(status === 'closed' ? 'Post closed' : 'Post reopened', status === 'closed' ? 'Caregivers no longer see it.' : 'It’s visible to caregivers again.'); reload(true);
  };
  const del = async () => {
    if (!(await confirm({ title: 'Delete this post?', body: 'It disappears for everyone. Your conversations stay in Messages. This can’t be undone.', confirm: 'Delete post' }))) return;
    const { error: e } = await supabase.from('posts').delete().eq('id', p.id);
    if (e) { toast.error('Couldn’t delete', errText(e)); return; }
    toast('Post deleted'); navigate(listPath);
  };

  return (
    <>
      <PageHead back={[listPath, role === 'caregiver' ? 'Find work' : isAgency ? 'Job posts' : 'My requests']} title={p.title}
        badge={<><Badge tone={isAgency ? 'sand' : 'line'}>{isAgency ? 'Job' : 'Care request'}</Badge>{own && <Badge tone={tone} icon={ic}>{st}</Badge>}</>}
        actions={own ? (<>
          {editable && <IconBtn icon="edit" label="Edit post" bordered to={`${listPath}/${p.id}/edit`} />}
          {p.status === 'open' && editable && <Btn variant="ghost" icon="lock" onClick={() => setStatus('closed')}>Close</Btn>}
          {p.status === 'closed' && editable && <Btn variant="ghost" icon="unlock" onClick={() => setStatus('open')}>Reopen</Btn>}
          <TrashBtn label="Delete post" bordered onClick={del} />
        </>) : (<>
          <IconBtn icon="flag" label="Report post" bordered onClick={() => setReport(true)} />
          {convs.length ? <Btn variant="primary" icon="msg" to={base + '/messages/' + convs[0].id}>Open conversation</Btn>
            : <Btn variant="success" icon="send" onClick={() => setChat(true)}>Reply to {isAgency ? 'agency' : 'family'}</Btn>}
        </>)} />

      {own && p.flagged && <Notice tone="warn" icon="flag">This post was edited several times, so our team is giving it a quick review. It stays visible meanwhile.</Notice>}
      {own && p.status === 'hidden' && <Notice tone="danger" icon="eyeOff">Our team hid this post. Check your notifications or contact us for details.</Notice>}

      <div className="grid-main" style={{ marginTop: 16 }}>
        <div className="stack">
          <Card>
            <div className="post-meta" style={{ marginBottom: 14 }}>
              <span><PIcon name="pin" />{p.town ? `${p.town} · ` : ''}{regionName(p.region_key)}</span>
              <span><PIcon name="clock" />Posted {timeAgo(p.created_at)}</span>
              {p.start_date && <span><PIcon name="cal" />Starts {fmtDate(p.start_date)}</span>}
              {p.updated_at && p.edit_count > 0 && <span><PIcon name="edit" />Edited {p.edit_count}×</span>}
            </div>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-2)', fontSize: 16 }}>{p.body}</p>
            <div className="divider" />
            <div className="sec-t">Care needed</div>
            <CareTags keys={p.care_types} />
            <div className="grid-3" style={{ marginTop: 16, gap: 12 }}>
              <div><div className="sec-t">Care recipient</div><strong>{p.recipient || 'Any'}</strong></div>
              <div><div className="sec-t">Duration</div><strong>{p.duration || 'Flexible'}</strong></div>
              <div><div className="sec-t">{isAgency ? 'Pay' : 'Hours / week'}</div><strong>{isAgency ? p.pay_range || '—' : p.hours_per_week || '—'}</strong></div>
            </div>
          </Card>
          <Card title="Schedule" icon="cal"><ScheduleView value={p.schedule} /></Card>
          {own && (
            <Card title={`Conversations about this ${isAgency ? 'job' : 'request'}`} icon="msg" flush>
              {convs.length === 0 ? <Empty icon="msg" title="No conversations yet" body={isAgency ? 'Caregivers in this region can reply. You can also search and message them.' : 'Caregivers in your region are notified. You can also reach out to them.'} action={<Btn variant="primary" icon="search" to={base + '/find'}>Find caregivers</Btn>} />
                : <div className="rows">{convs.map((c) => {
                  const o = otherOf(c, me), m = members[o.id];
                  return (
                    <Link key={c.id} className="row" to={base + '/messages/' + c.id}>
                      <Avatar name={memberName(m, o.role)} url={m?.avatar_url} size="sm" />
                      <span className="r-main"><span className="r-t">{memberName(m, o.role)}</span><span className="r-s">{c.last_message}</span></span>
                      <span className="r-end">{p.kind === 'family' && <Badge tone={c.counted ? 'line' : 'ok'} tip={c.counted ? 'You reached out, used 1 contact' : 'They messaged first, free'}>{c.counted ? 'Used a contact' : 'Free'}</Badge>}<span className="r-time">{timeAgo(c.last_message_at)}</span></span>
                    </Link>
                  );
                })}</div>}
            </Card>
          )}
        </div>
        <div className="stack">
          {!own && (
            <Card title={isAgency ? 'Posted by' : 'Family'} icon={isAgency ? 'building' : 'heart'}>
              <div className="flex"><Avatar name={authorName} url={isAgency ? author?.agency?.logo_url : author?.avatar_url} square={isAgency} /><div><strong>{authorName}</strong><div className="small muted">{isAgency ? author?.town || regionName(p.region_key) : (p.town ? p.town + ' · ' : '') + regionName(p.region_key)}</div></div></div>
              <p className="small muted" style={{ marginTop: 12 }}>{isAgency ? 'Agencies are verified with an EIN and business contact.' : 'The family’s address and phone stay private. Introduce yourself in a message.'}</p>
              <div style={{ marginTop: 14 }}>{convs.length ? <Btn variant="primary" icon="msg" block to={base + '/messages/' + convs[0].id}>Open conversation</Btn> : <Btn variant="success" icon="send" block onClick={() => setChat(true)}>Reply, it’s free</Btn>}</div>
            </Card>
          )}
          {own && p.kind === 'family' && quota && (
            <Card title="Contacts" icon="users">
              <div className="flex between" style={{ marginBottom: 8 }}><strong style={{ fontSize: 26 }}>{Math.max(0, quota.free_limit + quota.extra - quota.used)}</strong><span className="small muted">left of {quota.free_limit + quota.extra}</span></div>
              <Progress value={quota.used} max={quota.free_limit + quota.extra} tone={quota.free_limit + quota.extra - quota.used <= 2 ? 'warn' : ''} />
              <p className="small muted" style={{ margin: '12px 0' }}>Reaching out to a caregiver uses one contact. Caregivers who message you first are always free.</p>
              <Btn variant="soft" icon="plus" block to={base + '/billing?post=' + p.id}>Add 10 contacts</Btn>
            </Card>
          )}
          {own && p.kind === 'family' && p.status === 'open' && (
            <Card title="Time left" icon="hourglass">
              <p><strong>{daysLeft(p.expires_at)} days</strong> until this request closes on {fmtDate(p.expires_at)}.</p>
              <p className="small muted" style={{ marginTop: 8 }}>You can post one free request every 14 days.</p>
            </Card>
          )}
          <Card title="Safety tips" icon="shield">
            <ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)', display: 'grid', gap: 6 }}>
              <li>Meet by video or in a public place first.</li>
              <li>Check references and licenses.</li>
              <li>Never send money or gift cards before work starts.</li>
              <li>Report anything that feels off.</li>
            </ul>
          </Card>
        </div>
      </div>
      {!own && <StartChat open={chat} onClose={() => setChat(false)} postId={p.id} other={{ id: p.author_id, name: authorName, avatar: isAgency ? author?.agency?.logo_url : author?.avatar_url, sub: isAgency ? 'Agency' : 'Family in ' + regionName(p.region_key) }} />}
      <ReportModal open={report} onClose={() => setReport(false)} target={p.author_id} post={p.id} />
    </>
  );
}
