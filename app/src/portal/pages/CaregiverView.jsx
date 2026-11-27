import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, q, errText } from '../../lib/supabase.js';
import { useAsync } from '../../lib/useAsync.js';
import { toast } from '../../lib/toast.jsx';
import { usePortal } from '../context.jsx';
import { Btn, Card, Empty, IconBtn, PageHead, Skel } from '../ui.jsx';
import { CaregiverProfileView } from '../caregiver.jsx';
import { toggleSave } from './FindCaregivers.jsx';
import { ReportModal } from './Messages.jsx';
import StartChat from '../StartChat.jsx';

export default function CaregiverView() {
  const { id } = useParams();
  const { me, base } = usePortal();
  const [chat, setChat] = useState(false);
  const [report, setReport] = useState(false);
  const { data, loading, setData } = useAsync(async () => {
    const [p, cg, sv] = await Promise.all([
      q(supabase.from('profiles').select('id,full_name,avatar_url,town,created_at,status').eq('id', id).maybeSingle()),
      q(supabase.from('caregiver_profiles').select('*').eq('user_id', id).maybeSingle()),
      q(supabase.from('saved_caregivers').select('caregiver_id').eq('user_id', me).eq('caregiver_id', id)),
    ]);
    return p && cg && p.status === 'active' ? { p, cg, saved: sv.length > 0 } : null;
  }, [id, me]);

  const who = data?.p?.full_name;
  useEffect(() => { if (who) document.title = who + ' · Caregiver profile · Karing4Life'; }, [who]);
  if (loading) return <Skel h={180} n={2} />;
  if (!data) return <Card><Empty icon="user" title="Caregiver not found" body="This profile may no longer be available." action={<Btn variant="primary" icon="arrowL" to={base + '/find'}>Back to search</Btn>} /></Card>;
  const save = async () => {
    try { await toggleSave(me, id, !data.saved); setData((d) => ({ ...d, saved: !d.saved })); toast(data.saved ? 'Removed from saved' : 'Saved'); }
    catch (e) { toast.error('Couldn’t save', errText(e)); }
  };
  return (
    <>
      <PageHead back={[base + '/find', 'Search']} title="Caregiver profile" />
      <CaregiverProfileView p={data.p} cg={data.cg} actions={<>
        <IconBtn icon="flag" label="Report profile" bordered onClick={() => setReport(true)} />
        <IconBtn icon="bookmark" className="save-btn" bordered aria-pressed={data.saved} label={data.saved ? 'Remove from saved' : 'Save caregiver'} onClick={save} />
        <Btn variant="primary" icon="msg" onClick={() => setChat(true)}>Message</Btn>
      </>} />
      <StartChat open={chat} onClose={() => setChat(false)} other={{ id, name: data.p.full_name, avatar: data.p.avatar_url, sub: data.cg.credential }} />
      <ReportModal open={report} onClose={() => setReport(false)} target={id} />
    </>
  );
}
