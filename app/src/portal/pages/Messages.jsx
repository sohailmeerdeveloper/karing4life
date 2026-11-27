import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase, errText } from '../../lib/supabase.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal, isUnread, otherOf } from '../context.jsx';
import { Avatar, Btn, Empty, IconBtn, Modal, PIcon, Field, confirm, fmtDate, shortName, timeAgo } from '../ui.jsx';

const ROLE_NAME = { caregiver: 'Caregiver', family: 'Family', agency: 'Agency' };

/** Loads display info for a set of member ids: name, avatar, agency business name.
    member_cards() only returns people you have a reason to see, and gives families as
    "First L." with no town. The table fallback is for databases without qa_round2.sql. */
export async function loadMembers(ids) {
  const uniq = [...new Set(ids)].filter(Boolean);
  if (!uniq.length) return {};
  const { data, error } = await supabase.rpc('member_cards', { ids: uniq });
  if (!error) return Object.fromEntries((data || []).map((m) => [m.id, { ...m, agency: m.business_name || m.logo_url ? { business_name: m.business_name, logo_url: m.logo_url } : null }]));
  const [{ data: ps }, { data: ags }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,avatar_url,town').in('id', uniq),
    supabase.from('agency_profiles').select('user_id,business_name,logo_url').in('user_id', uniq),
  ]);
  const out = Object.fromEntries((ps || []).map((p) => [p.id, { ...p, short_name: shortName(p.full_name) }]));
  (ags || []).forEach((a) => { if (out[a.user_id]) out[a.user_id].agency = a; });
  return out;
}
const ROLE_FALLBACK = { caregiver: 'Caregiver', family: 'Family', agency: 'Agency' };
/** How a member is named in a given role: agencies by business, families as "First L.",
    caregivers in full. Never "Member": if the card hasn't loaded, say what they are. */
export const memberName = (m, role) => (role === 'agency' ? m?.agency?.business_name || m?.full_name
  : role === 'family' ? m?.short_name || shortName(m?.full_name)
  : m?.full_name || m?.short_name) || ROLE_FALLBACK[role] || 'Member';
const display = memberName;
/** Town shown next to a member: never a family's home town (their post shows its own town). */
const memberTown = (m, role) => (role === 'family' ? '' : m?.town || '');

/** Turns http(s) links and www. addresses in a message into safe links; everything else stays text. */
function Linkified({ text }) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]])/gi);
  return parts.map((s, i) => (i % 2 === 1
    ? <a key={i} href={/^www\./i.test(s) ? 'https://' + s : s} target="_blank" rel="noopener noreferrer nofollow ugc">{s}</a>
    : s));
}

export function ReportModal({ open, onClose, target, post, conversation }) {
  const { me } = usePortal();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const { error } = await supabase.from('reports').insert({ reporter_id: me, target_user_id: target || null, target_post_id: post || null, conversation_id: conversation || null, reason, details: details.trim() || null });
    setBusy(false);
    if (error) { toast.error('Couldn’t send report', errText(error)); return; }
    toast('Report sent', 'Our team will review it, usually within a day.'); setDetails(''); onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Report a problem" icon="flag"
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="danger" icon="flag" loading={busy} onClick={send}>Send report</Btn></>}>
      <div className="pf">
        <Field label="What’s wrong?">{(id) => (
          <select id={id} className="psel" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="spam">Spam or repeated messages</option>
            <option value="recruiter">Recruiter or staffing agency posing as a caregiver/family</option>
            <option value="scam">Scam or asking for money</option>
            <option value="inappropriate">Rude or inappropriate</option>
            <option value="safety">Safety concern</option>
            <option value="other">Something else</option>
          </select>
        )}</Field>
        <Field label="Details" optional hint="Only the Karing4Life team sees reports. The member isn’t told who reported them.">{(id) => <textarea id={id} className="pta" value={details} maxLength={2000} onChange={(e) => setDetails(e.target.value)} placeholder="What happened?" />}</Field>
      </div>
    </Modal>
  );
}

export default function Messages() {
  const { id: activeId } = useParams();
  const { me, role, base, refreshCounts } = usePortal();
  const navigate = useNavigate();
  const [convs, setConvs] = useState(null);
  const [members, setMembers] = useState({});
  const [posts, setPosts] = useState({});
  const [blocked, setBlocked] = useState(new Set());
  const [filter, setFilter] = useState('');
  const retried = useRef(false);

  const loadList = useCallback(async () => {
    const { data, error } = await supabase.from('conversations').select('*').or(`user_a.eq.${me},user_b.eq.${me}`).order('last_message_at', { ascending: false });
    if (error) { toast.error('Couldn’t load messages', errText(error)); setConvs([]); return; }
    const mine = data.filter((c) => (c.user_a === me ? c.role_a : c.role_b) === role);
    setConvs(mine);
    const [m, { data: ps }, { data: bl }] = await Promise.all([
      loadMembers(mine.map((c) => otherOf(c, me).id)),
      supabase.from('posts').select('id,title,kind,status').in('id', [...new Set(mine.map((c) => c.post_id).filter(Boolean))]),
      supabase.from('blocks').select('blocked_id').eq('blocker_id', me),
    ]);
    setMembers(m); setPosts(Object.fromEntries((ps || []).map((p) => [p.id, p]))); setBlocked(new Set((bl || []).map((b) => b.blocked_id)));
    // a brand-new conversation can arrive before its member card does: try once more
    if (!retried.current && mine.some((c) => !m[otherOf(c, me).id])) { retried.current = true; setTimeout(() => loadList(), 1500); }
  }, [me, role]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => {
    let t;
    const bump = () => { clearTimeout(t); t = setTimeout(loadList, 250); };
    const ch = supabase.channel('inbox-' + me + role)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_a=eq.${me}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_b=eq.${me}` }, bump)
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [me, role, loadList]);

  const active = convs?.find((c) => c.id === activeId) || null;
  const list = useMemo(() => (convs || []).filter((c) => !filter || display(members[otherOf(c, me).id], otherOf(c, me).role).toLowerCase().includes(filter.toLowerCase())), [convs, members, filter, me]);

  return (
    <div className={'chat' + (active ? ' has-active' : '')}>
      <h1 className="sr-only">Messages</h1>
      <div className="chat-list">
        <div className="chat-list-h">
          <h2>Messages</h2>
          <div className="pin-ic"><PIcon name="search" /><input className="pin" placeholder="Search conversations" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Search conversations" /></div>
        </div>
        <div className="chat-items">
          {convs === null ? <div style={{ padding: 16 }}><div className="skel" style={{ height: 60, marginBottom: 8 }} /><div className="skel" style={{ height: 60 }} /></div>
            : list.length === 0 ? <Empty icon="msg" title={filter ? 'No matches' : 'No conversations yet'} body={role === 'caregiver' ? 'Reply to a post in Find work to start a conversation.' : 'Find a caregiver and send a message to start one.'}
              action={!filter && <Btn variant="primary" icon="search" to={base + (role === 'caregiver' ? '/posts' : '/find')}>{role === 'caregiver' ? 'Find work' : 'Find caregivers'}</Btn>} />
            : list.map((c) => {
              const o = otherOf(c, me), m = members[o.id];
              const un = isUnread(c, me) && c.id !== activeId;
              return (
                <Link key={c.id} to={base + '/messages/' + c.id} className={'chat-item' + (c.id === activeId ? ' active' : '') + (un ? ' unread' : '')}>
                  <Avatar name={display(m, o.role)} url={m?.agency?.logo_url || m?.avatar_url} square={o.role === 'agency'} />
                  <div className="ci-m">
                    <div className="ci-top"><span className="ci-n">{display(m, o.role)}</span><span className="ci-t">{timeAgo(c.last_message_at)}</span></div>
                    <div className="ci-p">{c.last_message || 'New conversation'}</div>
                  </div>
                  {un && <span className="ci-dot" aria-label="Unread" />}
                </Link>
              );
            })}
        </div>
      </div>
      <div className="chat-pane">
        {active ? (
          <Thread key={active.id} conv={active} member={members[otherOf(active, me).id]} post={posts[active.post_id]}
            isBlocked={blocked.has(otherOf(active, me).id)}
            onBlockChange={(v) => setBlocked((s) => { const n = new Set(s); const oid = otherOf(active, me).id; if (v) n.add(oid); else n.delete(oid); return n; })}
            onBack={() => navigate(base + '/messages')} onRead={() => { setConvs((cs) => cs.map((c) => (c.id === active.id ? { ...c, [c.user_a === me ? 'a_read_at' : 'b_read_at']: new Date().toISOString() } : c))); refreshCounts(); }} />
        ) : (
          <div className="chat-empty"><div><span className="e-ic" style={{ width: 64, height: 64, borderRadius: 20, display: 'grid', placeItems: 'center', background: 'var(--olive-50)', color: 'var(--olive)', margin: '0 auto 12px' }}><PIcon name="msg" className="pi-lg" /></span><h3 style={{ color: 'var(--ink)' }}>Pick a conversation</h3><p>Your private messages appear here. Phone numbers and addresses are never shared unless you choose to.</p></div></div>
        )}
      </div>
    </div>
  );
}

function Thread({ conv, member, post, isBlocked, onBlockChange, onBack, onRead }) {
  const { me, role, base } = usePortal();
  const other = otherOf(conv, me);
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState(false);
  const [theirRead, setTheirRead] = useState(conv.user_a === me ? conv.b_read_at : conv.a_read_at);
  const body = useRef(null);
  const ta = useRef(null);
  const name = display(member, other.role);

  const markRead = useCallback(async () => { await supabase.rpc('mark_conversation_read', { p_conv: conv.id }); onRead(); }, [conv.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let live = true;
    supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at').limit(500).then(({ data, error }) => {
      if (!live) return;
      if (error) { toast.error('Couldn’t load messages', errText(error)); setMsgs([]); return; }
      setMsgs(data); markRead();
    });
    const ch = supabase.channel('thread-' + conv.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` }, ({ new: m }) => {
        setMsgs((xs) => (xs?.some((x) => x.id === m.id) ? xs : [...(xs || []).filter((x) => !(x.temp && x.body === m.body && m.sender_id === me)), m]));
        if (m.sender_id !== me) markRead();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${conv.id}` }, ({ new: c }) => {
        setTheirRead(c.user_a === me ? c.b_read_at : c.a_read_at);
      })
      .subscribe();
    return () => { live = false; supabase.removeChannel(ch); };
  }, [conv.id, me, markRead]);

  useEffect(() => { const el = body.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs]);

  const send = async (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || sending) return;
    const temp = { id: 'tmp' + Date.now(), temp: true, body: t, sender_id: me, created_at: new Date().toISOString() };
    setMsgs((xs) => [...(xs || []), temp]); setText(''); setSending(true);
    const { data, error } = await supabase.from('messages').insert({ conversation_id: conv.id, sender_id: me, body: t }).select().single();
    setSending(false);
    if (error) { setMsgs((xs) => xs.filter((x) => x.id !== temp.id)); setText(t); toast.error('Message not sent', errText(error)); return; }
    setMsgs((xs) => (xs.some((x) => x.id === data.id) ? xs.filter((x) => x.id !== temp.id) : xs.map((x) => (x.id === temp.id ? data : x))));
    ta.current?.focus();
  };
  const toggleBlock = async () => {
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', other.id);
      onBlockChange(false); toast('Unblocked', `${name} can message you again.`); return;
    }
    if (!(await confirm({ title: `Block ${name}?`, body: 'Neither of you will be able to send messages in this conversation. You can unblock anytime.', confirm: 'Block', icon: 'ban' }))) return;
    const { error } = await supabase.from('blocks').insert({ blocker_id: me, blocked_id: other.id });
    if (error) { toast.error('Couldn’t block', errText(error)); return; }
    onBlockChange(true); toast('Blocked', 'You won’t get messages from this member.');
  };

  const lastMine = msgs ? [...msgs].reverse().find((m) => m.sender_id === me && !m.temp) : null;
  let lastDay = '';
  const profileLink = other.role === 'caregiver' && role !== 'caregiver' ? `${base}/caregivers/${other.id}` : null;
  const postLink = post ? (role === 'caregiver' ? `${base}/posts/${post.id}` : `${base}/${role === 'agency' ? 'jobs' : 'requests'}/${post.id}`) : null;

  return (
    <>
      <div className="chat-head">
        <IconBtn icon="arrowL" label="All conversations" onClick={onBack} className="only-m" />
        <Avatar name={name} url={member?.agency?.logo_url || member?.avatar_url} square={other.role === 'agency'} />
        <div className="ch-m">
          <strong>{profileLink ? <Link to={profileLink} style={{ color: 'inherit' }}>{name}</Link> : name}</strong>
          <span>{ROLE_NAME[other.role] || ''}{memberTown(member, other.role) ? ' · ' + memberTown(member, other.role) : ''}</span>
        </div>
        {profileLink && <IconBtn icon="user" label="View profile" to={profileLink} className="hide-sm" />}
        <IconBtn icon="flag" label="Report" onClick={() => setReport(true)} />
        <IconBtn icon="ban" tone={isBlocked ? 'success' : 'danger'} label={isBlocked ? 'Unblock' : 'Block'} onClick={toggleBlock} tipPos="left" />
      </div>
      {(post || role === 'family') && (
        <div className="chat-ctx">
          <PIcon name={post ? 'list' : 'info'} />
          <span>
            {post ? <>About: <Link to={postLink}><strong>{post.title}</strong></Link></> : null}
            {role === 'family' && (conv.counted ? <> · Used 1 of your contacts</> : conv.user_a !== me ? <> · Free: the caregiver reached out first</> : null)}
          </span>
        </div>
      )}
      <div className="chat-body" ref={body} aria-live="polite">
        {msgs === null ? <div className="skel" style={{ height: 40, width: '60%' }} /> : msgs.map((m) => {
          const day = fmtDate(m.created_at, { weekday: 'short', month: 'short', day: 'numeric' });
          const showDay = day !== lastDay; lastDay = day;
          const mine = m.sender_id === me;
          return (
            <div key={m.id} style={{ display: 'contents' }}>
              {showDay && <div className="chat-day">{day}</div>}
              <div className={'msg ' + (mine ? 'out' : 'in') + (m.temp ? ' sending' : '')}><Linkified text={m.body} /></div>
              {mine && m.id === lastMine?.id && (
                <div className="msg-meta out">{new Date(theirRead) >= new Date(m.created_at) ? <><PIcon name="checks" className="seen" />Seen</> : <><PIcon name="check" />Sent {timeAgo(m.created_at)}</>}</div>
              )}
            </div>
          );
        })}
      </div>
      {isBlocked ? <div className="chat-blocked">You blocked this member. <button className="pb pb-link" onClick={toggleBlock}>Unblock</button> to keep chatting.</div> : (
        <form className="chat-compose" onSubmit={send}>
          <textarea ref={ta} rows={1} value={text} maxLength={4000} placeholder="Write a message…" aria-label="Write a message"
            onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(160, e.target.scrollHeight) + 'px'; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); send(); } }} />
          <IconBtn icon="send" label="Send" className="send" type="submit" disabled={!text.trim()} tipPos="left" />
        </form>
      )}
      <ReportModal open={report} onClose={() => setReport(false)} target={other.id} conversation={conv.id} post={conv.post_id} />
    </>
  );
}
