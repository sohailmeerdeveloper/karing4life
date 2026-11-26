import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, errText, isQuotaError } from '../lib/supabase.js';
import { toast } from '../lib/toast.jsx';
import { usePortal } from './context.jsx';
import { Btn, Field, Modal, Notice, Progress, Avatar } from './ui.jsx';

/**
 * "Send a message" dialog that opens a conversation through the start_conversation rule:
 *  family → picks one of their open requests (uses 1 of its contacts)
 *  caregiver → replying to a post (free)
 *  agency → unlimited in their regions
 */
export default function StartChat({ open, onClose, other, postId }) {
  const { me, role, base, refreshCounts } = usePortal();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [posts, setPosts] = useState(null);
  const [post, setPost] = useState(postId || '');
  const [quota, setQuota] = useState({});
  const [existing, setExisting] = useState(null);
  const [quotaHit, setQuotaHit] = useState(false);

  useEffect(() => {
    if (!open || !other) return;
    setQuotaHit(false);
    supabase.from('conversations').select('id').or(`and(user_a.eq.${me},role_a.eq.${role},user_b.eq.${other.id}),and(user_b.eq.${me},role_b.eq.${role},user_a.eq.${other.id})`).maybeSingle()
      .then(({ data }) => setExisting(data?.id || null));
    if (role !== 'family') return;
    Promise.all([
      supabase.from('posts').select('id,title,expires_at,status').eq('author_id', me).eq('kind', 'family').eq('status', 'open').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
      supabase.from('contact_quotas').select('*').eq('family_id', me),
    ]).then(([{ data: ps }, { data: qs }]) => {
      setPosts(ps || []);
      setQuota(Object.fromEntries((qs || []).map((x) => [x.post_id, x])));
      setPost((p) => p || ps?.[0]?.id || '');
    });
  }, [open, other, me, role]);

  if (!other) return null;
  const qq = quota[post];
  const left = qq ? qq.free_limit + qq.extra - qq.used : 10;

  const send = async () => {
    if (!text.trim()) { toast.error('Write a message first'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('start_conversation', { p_as: role, p_other: other.id, p_post: role === 'agency' ? null : (post || null), p_body: text.trim() });
    setBusy(false);
    if (error) {
      if (isQuotaError(error)) { setQuotaHit(true); return; }
      toast.error('Message not sent', errText(error)); return;
    }
    toast('Message sent', existing ? 'Added to your conversation.' : 'You’ll get a notification when they reply.');
    setText(''); onClose(); refreshCounts();
    navigate(base + '/messages/' + data);
  };

  const noPost = role === 'family' && !existing && posts && posts.length === 0;
  return (
    <Modal open={open} onClose={onClose} title="Send a message" icon="msg"
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        {noPost ? <Btn variant="primary" icon="plus" to={base + '/requests/new'}>Post a request first</Btn>
          : quotaHit ? <Btn variant="accent" icon="plus" to={base + '/billing?post=' + post}>Get 10 more contacts</Btn>
          : <Btn variant="success" icon="send" loading={busy} onClick={send}>Send message</Btn>}
      </>}>
      <div className="pf">
        <div className="flex"><Avatar name={other.name} url={other.avatar} /><div><strong>{other.name}</strong><div className="small muted">{other.sub}</div></div></div>
        {existing && <Notice icon="msg">You already have a conversation with {other.name.split(' ')[0]}. This message is added to it and doesn’t use a contact.</Notice>}
        {role === 'family' && !existing && (noPost
          ? <Notice tone="warn" icon="list">To reach out to caregivers, first post a care request. Each request includes 10 free contacts.</Notice>
          : posts && (<>
            <Field label="Which request is this about?" hint="Each request lets you contact 10 caregivers for free.">{(id) => (
              <select id={id} className="psel" value={post} onChange={(e) => { setPost(e.target.value); setQuotaHit(false); }}>
                {posts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}</Field>
            <div>
              <div className="flex between small" style={{ marginBottom: 6 }}><strong>Contacts left on this request</strong><span className="money">{Math.max(0, left)} of {qq ? qq.free_limit + qq.extra : 10}</span></div>
              <Progress value={qq ? qq.used : 0} max={qq ? qq.free_limit + qq.extra : 10} tone={left <= 2 ? 'warn' : ''} />
            </div>
          </>))}
        {quotaHit && <Notice tone="danger" icon="alert">You’ve used all the contacts on this request. Add 10 more for $8.99, or wait for caregivers to message you (that’s always free).</Notice>}
        {!noPost && (
          <Field label="Your message">{(id) => <textarea id={id} className="pta" value={text} maxLength={4000} autoFocus onChange={(e) => setText(e.target.value)}
            placeholder={role === 'caregiver' ? 'Introduce yourself: experience, availability and why you’re a good fit.' : role === 'agency' ? 'Tell them about the role, schedule and pay.' : 'Say hello and describe what you need.'} />}</Field>
        )}
        <p className="small muted">Keep phone numbers and addresses private until you’re comfortable. Never send money to someone you haven’t met.</p>
      </div>
    </Modal>
  );
}
