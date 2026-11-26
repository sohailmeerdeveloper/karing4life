import { useState } from 'react';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Badge, Btn, Card, Empty, IconBtn, PageHead, Seg, Skel, TrashBtn, confirm, timeAgo } from '../ui.jsx';

export default function Inbox() {
  const { refreshCounts } = usePortal();
  const [tab, setTab] = useState('new');
  const { data, loading, reload } = useAsync(() => q(supabase.from('contact_messages').select('*').eq('status', tab).order('created_at', { ascending: false }).limit(300)), [tab]);
  const mark = async (m, status) => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', m.id);
    if (error) { toast.error('Couldn’t update', errText(error)); return; }
    toast(status === 'done' ? 'Marked as handled' : 'Moved back to new'); reload(true); refreshCounts();
  };
  const del = async (m) => {
    if (!(await confirm({ title: 'Delete this message?', body: 'This can’t be undone.', confirm: 'Delete' }))) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', m.id);
    if (error) { toast.error('Couldn’t delete', errText(error)); return; }
    toast('Deleted'); reload(true); refreshCounts();
  };
  return (
    <>
      <PageHead title="Contact inbox" sub="Messages sent through the website’s contact form. Reply by email, then mark them handled." />
      <div style={{ marginBottom: 16 }}><Seg value={tab} onChange={setTab} tabs={[['new', 'New'], ['done', 'Handled']]} /></div>
      {loading && !data ? <Skel h={120} n={3} /> : !data.length ? <Card><Empty icon="mail" title={tab === 'new' ? 'No new messages' : 'Nothing handled yet'} /></Card> : (
        <div className="stack">{data.map((m) => (
          <Card key={m.id}>
            <div className="flex between flex-wrap" style={{ alignItems: 'flex-start', marginBottom: 8 }}>
              <div><strong>{m.subject || 'No subject'}</strong><div className="small muted">{m.name} · {m.email}{m.role ? ' · ' + m.role : ''} · {timeAgo(m.created_at)}</div></div>
              <div className="flex" style={{ gap: 4 }}>
                {tab === 'new' && <Badge tone="sand">New</Badge>}
                <IconBtn icon="mail" size="sm" label="Reply by email" onClick={() => { window.location.href = `mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message to Karing4Life'))}`; }} />
                {tab === 'new' ? <IconBtn icon="check" size="sm" tone="success" label="Mark handled" onClick={() => mark(m, 'done')} /> : <IconBtn icon="undo" size="sm" label="Move back to new" onClick={() => mark(m, 'new')} />}
                <TrashBtn size="sm" label="Delete" tipPos="left" onClick={() => del(m)} />
              </div>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-2)' }}>{m.message}</p>
            {tab === 'new' && <div style={{ marginTop: 12 }}><Btn size="sm" variant="ghost" icon="mail" href={`mailto:${m.email}`}>Reply</Btn></div>}
          </Card>
        ))}</div>
      )}
    </>
  );
}
