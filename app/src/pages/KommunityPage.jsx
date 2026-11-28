import { useEffect, useMemo, useRef, useState } from 'react';
import { useFocusTrap, useTitle } from '../lib/hooks.js';
import { Icon, RegionOptions } from '../components/bits.jsx';
import { supabase, errText } from '../lib/supabase.js';
import { useAuth } from '../lib/auth.jsx';
import { toast } from '../lib/toast.jsx';
import { R } from '../data/data.js';
import './extra.css';

const CATS = ['Supplies', 'Equipment', 'Mobility', 'Baby & child', 'Other'];
const CAT_ICON = { Supplies: 'layers', Equipment: 'activity', Mobility: 'users', 'Baby & child': 'smile', Other: 'sparkle' };
const ago = (iso) => { const d = (Date.now() - new Date(iso)) / 864e5; return d < 1 ? 'today' : d < 2 ? 'yesterday' : Math.floor(d) + ' days ago'; };

function Thread({ post, user, onCount }) {
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  // new comments from others show up while the thread is open (every 15 s and when the tab regains focus)
  useEffect(() => {
    let live = true;
    const load = () => supabase.rpc('kk_thread', { pid: post.id }).then(({ data, error }) => {
      if (!live || error) return;
      setItems((xs) => { if (xs && xs.length !== (data || []).length) onCount((data || []).length); return data || []; });
    });
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 15000);
    window.addEventListener('focus', load);
    return () => { live = false; clearInterval(t); window.removeEventListener('focus', load); };
  }, [post.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('kk_comments').insert({ post_id: post.id, author_id: user.id, body: text.trim() });
    setBusy(false);
    if (error) { toast.error('Comment not posted', errText(error)); return; }
    setText(''); const { data } = await supabase.rpc('kk_thread', { pid: post.id }); setItems(data || []); onCount(data?.length || 0);
  };
  return (
    <div className="kk-thread">
      {items === null ? <div className="small muted">Loading…</div> : items.length === 0 ? <div className="small muted">No comments yet.</div>
        : items.map((c) => <div key={c.id} className="kk-c"><strong>{c.author_name}</strong><span>{ago(c.created_at)}</span><div>{c.body}</div></div>)}
      {user ? (
        <form className="kk-form" onSubmit={send}>
          <label className="sr-only" htmlFor={'c' + post.id}>Write a comment</label>
          <input id={'c' + post.id} className="input" maxLength={1000} placeholder="Ask about it or say thanks…" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary btn-sm" style={{ '--bh': '44px' }} disabled={busy || !text.trim()} type="submit">Post</button>
        </form>
      ) : <a className="small" href="/signin?next=/kommunity" style={{ fontWeight: 700 }}>Sign in to comment</a>}
    </div>
  );
}

/** "Remove this item?" — same wording and look as the portal's delete confirmations. */
function ConfirmRemove({ item, onCancel, onConfirm }) {
  const box = useRef(null);
  useFocusTrap(box, true, onCancel);
  return (
    <div className="xm-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="xm xm-sm" ref={box} role="alertdialog" aria-modal="true" aria-labelledby="kk-rm-t" aria-describedby="kk-rm-b">
        <h2 id="kk-rm-t">Remove “{item.title}”?</h2>
        <p id="kk-rm-b" className="small" style={{ color: 'var(--ink-2)', marginTop: 8 }}>It disappears from the Korner for everyone, with its comments. This can’t be undone.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel} autoFocus>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function KommunityPage() {
  useTitle('Kommunity Korner · Karing4Life');
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState('');
  const [region, setRegion] = useState('');
  const [text, setText] = useState('');
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const load = () => supabase.rpc('kk_feed').then(({ data, error }) => { if (error) toast.error('Couldn’t load the Korner', errText(error)); setItems(data || []); });
  useEffect(() => { load(); }, []);
  const list = useMemo(() => (items || []).filter((p) => (!cat || p.category === cat) && (!region || p.region_key === region) && (!text || (p.title + ' ' + p.body).toLowerCase().includes(text.toLowerCase()))), [items, cat, region, text]);

  const share = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 4 || form.body.trim().length < 10) { toast.error('Add a title and a short description'); return; }
    setBusy(true);
    const { error } = await supabase.from('kk_posts').insert({ author_id: user.id, title: form.title.trim(), body: form.body.trim(), category: form.category, condition: form.condition, region_key: form.region_key || null });
    setBusy(false);
    if (error) { toast.error('Couldn’t share', errText(error)); return; }
    toast('Shared with the Korner', 'Neighbors can now see and comment on it.'); setForm(null); load();
  };
  const mine = async (p, action) => {
    setRemoving(null);
    const r = action === 'delete' ? await supabase.from('kk_posts').delete().eq('id', p.id) : await supabase.from('kk_posts').update({ status: p.status === 'claimed' ? 'open' : 'claimed' }).eq('id', p.id);
    if (r.error) { toast.error('Couldn’t update', errText(r.error)); return; }
    toast(action === 'delete' ? 'Removed' : p.status === 'claimed' ? 'Marked available' : 'Marked as claimed'); load();
  };

  return (
    <section className="xp flow">
      <div className="container">
        <div className="xp-head">
          <span className="eyebrow">Kommunity Korner</span>
          <h1>Share what you <span className="serif" style={{ color: 'var(--olive)' }}>don’t need.</span></h1>
          <p className="lead">Unused or opened-box supplies and equipment, passed from one family to the next. Free to give, free to take.</p>
        </div>
        <div className="kk-rules">
          <div className="kk-rule"><Icon name="heart" /><span><strong>Free only.</strong> Nothing here is for sale.</span></div>
          <div className="kk-rule"><Icon name="ban" /><span><strong>No medication</strong>, needles or anything prescription.</span></div>
          <div className="kk-rule"><Icon name="lock" /><span><strong>Meet safely.</strong> Arrange pickup in a public place.</span></div>
        </div>
        <div className="kk-tools">
          <div className="grow"><label className="sr-only" htmlFor="kkq">Search</label><input id="kkq" className="input" placeholder="Search items…" value={text} onChange={(e) => setText(e.target.value)} /></div>
          <label className="sr-only" htmlFor="kkc">Category</label>
          <select id="kkc" className="select" value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: 'auto' }}><option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <label className="sr-only" htmlFor="kkr">Region</label>
          <select id="kkr" className="select" value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: 'auto' }}><RegionOptions any="All regions" /></select>
          {user ? <button className="btn btn-accent" onClick={() => setForm({ title: '', body: '', category: 'Supplies', condition: 'Unopened', region_key: '' })}><Icon name="plus" />Share an item</button>
            : <a className="btn btn-accent" href="/signin?next=/kommunity"><Icon name="plus" />Sign in to share</a>}
        </div>
        {items === null ? <div className="kk-grid">{[1, 2, 3].map((i) => <div key={i} className="kk-card" style={{ height: 220, opacity: .5 }} />)}</div>
          : list.length === 0 ? <div className="kk-card" style={{ alignItems: 'center', textAlign: 'center', padding: 48 }}><span className="kk-ic"><Icon name="sparkle" /></span><h3>Nothing here yet</h3><p>Be the first to share something a neighbor could use.</p></div>
          : <><h2 className="sr-only">Shared items</h2><div className="kk-grid">{list.map((p) => (
            <article key={p.id} className="kk-card">
              <div className="flex" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="kk-ic"><Icon name={CAT_ICON[p.category] || 'sparkle'} /></span>
                <span className={'badge ' + (p.status === 'claimed' ? 'badge-line' : 'badge-sand')}>{p.status === 'claimed' ? 'Claimed' : p.condition}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <div className="kk-meta">
                <span><Icon name="tag" />{p.category}</span>
                {p.region_key && <span><Icon name="pin" />{R[p.region_key]?.name}</span>}
                <span><Icon name="user" />{p.author_name}</span>{/* never a home town: the item's region is shown instead (R3-NEW-01) */}
                <span><Icon name="clock" />{ago(p.created_at)}</span>
              </div>
              <div className="kk-foot">
                <button className="link-btn" onClick={() => setOpenId(openId === p.id ? null : p.id)} aria-expanded={openId === p.id}><Icon name="msg" /> {p.comments} comment{p.comments === 1 ? '' : 's'}</button>
                {(p.mine ?? (!!user && user.id === p.author_id)) && <span style={{ display: 'flex', gap: 8 }}>
                  <button className="link-btn" onClick={() => mine(p, 'claim')}>{p.status === 'claimed' ? 'Mark available' : 'Mark claimed'}</button>
                  <button className="link-btn" style={{ color: '#B8402B' }} onClick={() => setRemoving(p)}>Remove</button>
                </span>}
              </div>
              {openId === p.id && <Thread post={p} user={user} onCount={(n) => setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, comments: n } : x)))} />}
            </article>
          ))}</div></>}
      </div>
      {removing && <ConfirmRemove item={removing} onCancel={() => setRemoving(null)} onConfirm={() => mine(removing, 'delete')} />}
      {form && (
        <div className="xm-back" onMouseDown={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
          <form className="xm" onSubmit={share} role="dialog" aria-modal="true" aria-label="Share an item">
            <h2>Share an item</h2>
            <div className="form-grid">
              <div className="field full"><label htmlFor="kkt">What is it?</label><input id="kkt" className="input" maxLength={120} autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Unopened box of gauze pads" /></div>
              <div className="field full"><label htmlFor="kkb">Details</label><textarea id="kkb" className="textarea" maxLength={2000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Size, how much is left, where to pick up (town only)" /></div>
              <div className="field"><label htmlFor="kkcat">Category</label><select id="kkcat" className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="field"><label htmlFor="kkcond">Condition</label><select id="kkcond" className="select" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}><option>Unopened</option><option>Opened</option><option>Used</option></select></div>
              <div className="field full"><label htmlFor="kkreg">Region</label><select id="kkreg" className="select" value={form.region_key} onChange={(e) => setForm({ ...form, region_key: e.target.value })}><RegionOptions any="Select a region" /></select></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Sharing…' : 'Share'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
