import { useMemo, useState } from 'react';
import { supabase, q } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { Card, Empty, PageHead, PIcon, Skel, fmtDate } from '../ui.jsx';
import { loadMembers } from '../pages/Messages.jsx';

const LABEL = (a) => a.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export default function Logs() {
  const [text, setText] = useState('');
  const { data, loading } = useAsync(async () => {
    const logs = await q(supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(500));
    return { logs, members: await loadMembers(logs.map((l) => l.admin_id)) };
  }, []);
  const list = useMemo(() => (data?.logs || []).filter((l) => !text || (l.action + JSON.stringify(l.details)).toLowerCase().includes(text.toLowerCase())), [data, text]);
  return (
    <>
      <PageHead title="Activity log" sub="Every admin action, newest first. Useful when more than one person manages the site." />
      <div className="toolbar"><div className="pin-ic"><PIcon name="search" /><input className="pin" placeholder="Search actions" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search log" /></div></div>
      <Card flush>
        {loading ? <div style={{ padding: 18 }}><Skel h={40} n={6} /></div> : !list.length ? <Empty icon="log" title="No activity yet" /> : (
          <div className="tbl-wrap"><table className="tbl stackable">
            <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>{list.map((l) => (
              <tr key={l.id}>
                <td className="first">{fmtDate(l.created_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                <td data-l="Admin">{data.members[l.admin_id]?.full_name || '—'}</td>
                <td data-l="Action"><strong>{LABEL(l.action)}</strong> <span className="muted small">{l.target_type}</span></td>
                <td data-l="Details" className="small muted">{Object.entries(l.details || {}).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
