import { useState } from 'react';
import { useTitle } from '../lib/hooks.js';
import { Icon } from '../components/bits.jsx';
import './extra.css';

const FAQ = {
  general: ['help', 'General', [
    ['What is Karing4Life?', 'Karing4Life connects New York families with nurses, caregivers and agencies across all 16 regions of the state. Families post what they need, caregivers reply directly, and we never take a cut of anyone’s rate.'],
    ['Is Karing4Life an agency?', 'No. We are a connector only. We don’t employ caregivers, set rates or supervise care. Families and caregivers agree on the work directly.'],
    ['Which areas do you cover?', 'All of New York State, in 16 regions: Suffolk, Nassau, the five NYC boroughs, Capital Region, Hudson Valley, Central New York, Adirondacks, Catskills, Finger Lakes, Niagara, Thousand Islands and Chautauqua-Allegheny.'],
    ['Do you store medical records?', 'No. Karing4Life never stores patient medical data. Please keep health details out of posts and share only what’s needed in private messages.'],
  ]],
  families: ['heart', 'Families', [
    ['How much does it cost?', 'Nothing. Posting a request, searching and messaging are free. Each request includes 10 free contacts, and caregivers who message you first never count against them.'],
    ['How often can I post?', 'One free care request every 14 days. You can edit it while it’s open; several edits send it for a quick review to keep things fair.'],
    ['What if I need to contact more than 10 caregivers?', 'You can add 10 more contacts for $8.99 on that request. This limit helps keep recruiters off the platform.'],
    ['Is my address shown?', 'Never. Only your town and region appear. Share your phone number or address only when you’re ready.'],
  ]],
  caregivers: ['steth', 'Caregivers', [
    ['How does the free trial work?', 'You get 14 days free in every region you choose. After that, Region Access is $8.99 a month per region. Cancel any region anytime.'],
    ['What do Available and Fill-in mean?', 'Available means you’re open for regular work. Fill-in means you take shifts or a few days. Families can message you either way.'],
    ['How do I get verified?', 'Upload a government ID (or a library card), plus your license if you’re licensed, or 2–3 references if you’re not. Our team reviews every document by hand.'],
    ['Do families pay to receive my messages?', 'No. When you reach out to a family, the conversation is always free for them.'],
  ]],
  agencies: ['building', 'Agencies', [
    ['What does Agency Access include?', 'For $49.99 a month per region: unlimited job posts, caregiver search and messaging in that region, plus a company profile with your logo.'],
    ['Can agencies see family requests?', 'No. Family requests are visible only to caregivers, so families aren’t contacted by recruiters.'],
    ['How are agencies verified?', 'We check your EIN, website and business contact, and review an EIN letter or business registration.'],
  ]],
  account: ['lock', 'Account & safety', [
    ['How do I report someone?', 'Use the flag button on any profile, post or conversation. Reports go straight to our team and the other member isn’t told who reported them.'],
    ['Can I block someone?', 'Yes. Block anyone from the conversation screen and neither of you can message the other until you unblock.'],
    ['How do I delete my account?', 'Go to Settings in your portal and choose Delete account, or email info@karing4life.com.'],
  ]],
};

export default function FaqPage() {
  useTitle('FAQ · Karing4Life');
  const [cat, setCat] = useState('general');
  const [open, setOpen] = useState(0);
  const [, label, items] = FAQ[cat];
  return (
    <section className="xp flow">
      <div className="container">
        <div className="xp-head">
          <span className="eyebrow">Help center</span>
          <h1>Questions, <span className="serif" style={{ color: 'var(--olive)' }}>answered.</span></h1>
          <p className="lead">Can’t find what you need? Email <a href="mailto:info@karing4life.com">info@karing4life.com</a> and a person will reply within one business day.</p>
        </div>
        <div className="faq-layout">
          <nav className="faq-nav" aria-label="FAQ topics">
            {Object.entries(FAQ).map(([k, [ic, l]]) => <button key={k} aria-pressed={cat === k} onClick={() => { setCat(k); setOpen(0); }}><Icon name={ic} />{l}</button>)}
          </nav>
          <div>
            <h2 style={{ fontSize: 26, marginBottom: 16 }}>{label}</h2>
            <div className="faq-list">
              {items.map(([q, a], i) => (
                <div key={q} className={'faq-item' + (open === i ? ' open' : '')}>
                  <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon name="chev" /></button>
                  {open === i && <div className="ans">{a}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
