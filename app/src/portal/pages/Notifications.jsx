import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, q } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { usePortal } from '../context.jsx';
import { ICON_OF } from '../PortalLayout.jsx';
import { Btn, Card, Empty, PageHead, PIcon, Seg, Skel, TrashBtn, IconBtn, timeAgo } from '../ui.jsx';
import { toast } from '../../lib/toast.jsx';

export default function Notifications() {
  const { me, base, refreshCounts } = usePortal();
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const { data, loading, setData } = useAsync(() => q(supabase.from('notifications').select('*').eq('user_id', me).order('created_at', { ascending: false }).limit(200)), [me]);
  const list = (data || []).filter((n) => tab === 'all' || !n.read_at);
  const unread = (data || []).filter((n) => !n.read_at).length;
  const now = () => new Date().toISOString();

  const open = async (n) => {
    if (!n.read_at) { await supabase.from('notifications').update({ read_at: now() }).eq('id', n.id); refreshCounts(); }
    if (n.link?.startsWith('/portal/')) navigate(n.link); else navigate(base);
  };
  const markRead = async (n, e) => {
    e.stopPropagation();
    await supabase.from('notifications').update({ read_at: now() }).eq('id', n.id);
    setData((xs) => xs.map((x) => (x.id === n.id ? { ...x, read_at: now() } : x))); refreshCounts();
  };
  const del = async (n, e) => {
    e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', n.id);
    setData((xs) => xs.filter((x) => x.id !== n.id)); refreshCounts(); toast('Notification removed');
  };
  const readAll = async () => {
    await supabase.from('notifications').update({ read_at: now() }).eq('user_id', me).is('read_at', null);
    setData((xs) => xs.map((x) => ({ ...x, read_at: x.read_at || now() }))); refreshCounts();
  };

  return (
    <>
      <PageHead title="Notifications" sub="Messages, new posts in your regions, verification and billing updates."
        actions={unread > 0 && <Btn variant="ghost" icon="checks" onClick={readAll}>Mark all read</Btn>} />
      <div style={{ marginBottom: 16 }}><Seg value={tab} onChange={setTab} tabs={[['all', 'All', data?.length], ['unread', 'Unread', unread]]} /></div>
      <Card flush>
        {loading ? <div style={{ padding: 18 }}><Skel h={56} n={4} /></div>
          : list.length === 0 ? <Empty icon="bell" title={tab === 'unread' ? 'No unread notifications' : 'Nothing here yet'} body="We’ll let you know when something needs your attention." />
          : <div className="rows">{list.map((n) => (
            <div key={n.id} className={'row clickable notif-row' + (n.read_at ? '' : ' unread')} role="button" tabIndex={0} onClick={() => open(n)} onKeyDown={(e) => e.key === 'Enter' && open(n)} style={{ cursor: 'pointer' }}>
              <span className="stat-ic" style={{ flex: 'none' }}><PIcon name={ICON_OF[n.kind] || 'bell'} /></span>
              <span className="r-main"><span className="r-t">{n.title}</span><span className="r-s">{n.body}</span></span>
              <span className="r-time">{timeAgo(n.created_at)}</span>
              <span className="r-end">
                {!n.read_at && <IconBtn icon="check" tone="success" size="sm" label="Mark as read" onClick={(e) => markRead(n, e)} />}
                <TrashBtn size="sm" label="Remove" onClick={(e) => del(n, e)} />
              </span>
            </div>
          ))}</div>}
      </Card>
    </>
  );
}
