import { useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { supabase, errText } from '../../lib/supabase.js';
import { toast } from '../../lib/toast.jsx';
import { RegionOptions } from '../../components/bits.jsx';
import { Avatar, Btn, Card, Field, PageHead, Switch, confirm } from '../ui.jsx';
import { usePortal } from '../context.jsx';
import { SUPPORT_EMAIL } from '../../lib/config.js';

export async function uploadAvatar(me, file) {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('Please choose a PNG, JPG or WebP image.');
  if (file.size > 3 * 1024 * 1024) throw new Error('That image is over 3 MB. Please choose a smaller one.');
  const path = `${me}/avatar-${Date.now()}.${file.type.split('/')[1].replace('jpeg', 'jpg')}`;
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

export default function Settings() {
  const { profile, user, refresh, signOut } = useAuth();
  const { me, role } = usePortal();
  const [name, setName] = useState(profile?.full_name || '');
  const [town, setTown] = useState(profile?.town || '');
  const [region, setRegion] = useState(profile?.region_key || '');
  const [prefs, setPrefs] = useState(profile?.settings || {});
  const [pw, setPw] = useState({ a: '', b: '' });
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error('Add your name', 'At least 2 characters.'); return; }
    setBusy('profile');
    const { error } = await supabase.from('profiles').update({ full_name: name.trim(), town: town.trim() || null, region_key: region || null }).eq('id', me);
    setBusy('');
    if (error) { toast.error('Couldn’t save', errText(error)); return; }
    await refresh(); toast('Profile saved');
  };
  const savePrefs = async (k, v) => {
    const next = { ...prefs, [k]: v }; setPrefs(next);
    const { error } = await supabase.from('profiles').update({ settings: next }).eq('id', me);
    if (error) toast.error('Couldn’t save', errText(error)); else toast('Preferences updated');
  };
  const onAvatar = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    setBusy('avatar');
    try {
      const url = await uploadAvatar(me, f);
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', me);
      await refresh(); toast('Photo updated');
    } catch (err) { toast.error('Upload failed', errText(err)); }
    setBusy('');
  };
  const removeAvatar = async () => {
    if (!(await confirm({ title: 'Remove your photo?', body: 'Your initials will show instead.', confirm: 'Remove photo' }))) return;
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', me); await refresh(); toast('Photo removed');
  };
  const changePw = async (e) => {
    e.preventDefault();
    if (pw.a.length < 8) { toast.error('Password too short', 'Use at least 8 characters.'); return; }
    if (pw.a !== pw.b) { toast.error('Passwords don’t match'); return; }
    setBusy('pw');
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    setBusy('');
    if (error) { toast.error('Couldn’t change password', errText(error)); return; }
    setPw({ a: '', b: '' }); toast('Password changed');
  };
  const requestDelete = async () => {
    if (!(await confirm({ title: 'Delete your account?', body: 'We’ll ask our team to delete your account and data within 7 days. Active subscriptions are cancelled first.', confirm: 'Request deletion' }))) return;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Delete my Karing4Life account')}&body=${encodeURIComponent('Please delete the account for ' + user.email)}`;
  };

  return (
    <>
      <PageHead title="Settings" sub="Your account, photo, notifications and password." />
      <div className="grid-2">
        <div className="stack">
          <Card title="Your details" icon="user">
            <div className="flex" style={{ marginBottom: 18, gap: 16 }}>
              <Avatar name={profile?.full_name} url={profile?.avatar_url} size="lg" />
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                <label className="pb pb-soft pb-sm" style={{ cursor: 'pointer' }}>
                  {busy === 'avatar' ? 'Uploading…' : profile?.avatar_url ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onAvatar} />
                </label>
                {profile?.avatar_url && <Btn size="sm" variant="soft-danger" onClick={removeAvatar}>Remove</Btn>}
              </div>
            </div>
            <form className="pf" onSubmit={saveProfile}>
              <Field label="Full name">{(id) => <input id={id} className="pin" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />}</Field>
              <Field label="Email" hint="Contact us to change the email you sign in with.">{(id) => <input id={id} className="pin" value={user?.email || ''} disabled />}</Field>
              <div className="pf-row">
                <Field label="Town or city" optional>{(id) => <input id={id} className="pin" value={town} onChange={(e) => setTown(e.target.value)} maxLength={80} />}</Field>
                <Field label="Home region" optional>{(id) => <select id={id} className="psel" value={region} onChange={(e) => setRegion(e.target.value)}><RegionOptions any="Select a region" /></select>}</Field>
              </div>
              <div className="pf-actions"><Btn type="submit" variant="success" icon="check" loading={busy === 'profile'}>Save changes</Btn></div>
            </form>
          </Card>
          <Card title="Password" icon="key">
            <form className="pf" onSubmit={changePw}>
              <div className="pf-row">
                <Field label="New password">{(id) => <input id={id} type="password" className="pin" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} autoComplete="new-password" minLength={8} />}</Field>
                <Field label="Repeat it">{(id) => <input id={id} type="password" className="pin" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} autoComplete="new-password" />}</Field>
              </div>
              <div className="pf-actions"><Btn type="submit" variant="success" icon="check" loading={busy === 'pw'} disabled={!pw.a}>Update password</Btn></div>
            </form>
          </Card>
        </div>
        <div className="stack">
          <Card title="Email notifications" icon="mail">
            <div className="set-row"><div><strong>New messages</strong><span className="sub">An email when someone messages you</span></div><Switch checked={prefs.email_messages !== false} onChange={(v) => savePrefs('email_messages', v)} /></div>
            {role === 'caregiver' && <div className="set-row"><div><strong>New posts in my regions</strong><span className="sub">Care requests and jobs where you work</span></div><Switch checked={prefs.email_posts !== false} onChange={(v) => savePrefs('email_posts', v)} /></div>}
            <div className="set-row"><div><strong>Billing</strong><span className="sub">Receipts, trial reminders, failed payments</span></div><Switch checked={prefs.email_billing !== false} onChange={(v) => savePrefs('email_billing', v)} /></div>
          </Card>
          <Card title="Account" icon="settings">
            <div className="set-row"><div><strong>Sign out</strong><span className="sub">On this device</span></div><Btn variant="ghost" icon="logout" onClick={signOut}>Sign out</Btn></div>
            <div className="set-row"><div><strong>Delete account</strong><span className="sub">Permanently remove your account and data</span></div><Btn variant="soft-danger" onClick={requestDelete}>Delete…</Btn></div>
          </Card>
        </div>
      </div>
    </>
  );
}
