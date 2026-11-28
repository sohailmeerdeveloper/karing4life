import { useState } from 'react';
import { Btn, Card, Modal, PageHead, PIcon } from '../ui.jsx';
import { usePortal } from '../context.jsx';
import { SUPPORT_EMAIL } from '../../lib/config.js';

const GUIDE = {
  caregiver: [
    ['sparkle', 'Welcome to your caregiver portal', 'This is where families and agencies find you. Here’s a 30-second tour.'],
    ['user', 'Build your profile', 'Add your credential, care types, schedule and rate. A complete profile shows up higher in family searches.'],
    ['map', 'Pick your regions', 'Choose the regions you work in on the map. You get 14 days free in every region, then $8.99 a month per region.'],
    ['search', 'Find work and reply', 'Open “Find work” to see care requests and jobs in your regions. Replying to a family is always free for them.'],
    ['shieldCheck', 'Get verified', 'Upload your license or ID. Once our team checks it, a verified badge appears on your profile.'],
  ],
  family: [
    ['sparkle', 'Welcome to your family portal', 'Finding care is free. Here’s how it works in 30 seconds.'],
    ['pen', 'Post a care request', 'Describe the care you need, the schedule and your region. You can post once every 14 days, free.'],
    ['search', 'Find a caregiver', 'Search by care type, region, schedule, age group and duration. Save the ones you like.'],
    ['msg', 'Reach out', 'Each request lets you contact 10 caregivers free. Caregivers who message you first never count against that.'],
    ['lock', 'Your privacy', 'Your address is never shown. Talk in private messages and share your number only when you’re ready.'],
  ],
  agency: [
    ['sparkle', 'Welcome to your agency portal', 'Recruit verified caregivers across New York. A quick tour:'],
    ['building', 'Complete your company profile', 'Add your logo, description and business details so caregivers know who you are.'],
    ['map', 'Choose your regions', 'Agency Access is $49.99 a month per region and unlocks unlimited job posts, search and messaging there.'],
    ['briefcase', 'Post jobs', 'Post as many openings as you need in your regions. Caregivers there are notified.'],
    ['search', 'Search and message', 'Search caregivers who work in your regions and message them directly. Family requests stay private.'],
  ],
  admin: [
    ['shield', 'Welcome to the admin console', 'Everything that keeps Karing4Life safe and running lives here.'],
    ['shieldCheck', 'Verification queue', 'Review uploaded IDs, licenses and references, then approve or ask for another document.'],
    ['flag', 'Reports & posts', 'Handle member reports and posts flagged after repeated edits. You can hide posts or suspend members.'],
    ['users', 'Users', 'Search any member, see their details, grant region access, extend trials or suspend them.'],
    ['chart', 'Revenue & settings', 'Track subscriptions and revenue, handle refunds, and change prices, quotas and regions.'],
  ],
};
const KEY = (r) => 'k4l-guide-' + r;
export const hasSeenGuide = (r) => { try { return !!localStorage.getItem(KEY(r)); } catch { return true; } };

export function WelcomeGuide({ open, onClose, role }) {
  const [i, setI] = useState(0);
  const steps = GUIDE[role] || GUIDE.family;
  const close = () => { try { localStorage.setItem(KEY(role), '1'); } catch { /* */ } setI(0); onClose(); };
  const s = steps[i];
  const last = i === steps.length - 1;
  return (
    <Modal open={open} onClose={close} size="sm"
      footer={<>
        {i > 0 ? <Btn variant="ghost" icon="arrowL" onClick={() => setI(i - 1)}>Back</Btn> : <Btn variant="ghost" onClick={close}>Skip tour</Btn>}
        <Btn variant={last ? 'success' : 'primary'} iconRight={last ? undefined : 'arrowR'} icon={last ? 'check' : undefined} onClick={() => (last ? close() : setI(i + 1))}>{last ? 'Get started' : 'Next'}</Btn>
      </>}>
      <div className="guide-body fade-in" key={i}>
        <div className="guide-ic"><PIcon name={s[0]} /></div>
        <h2>{s[1]}</h2>
        <p>{s[2]}</p>
      </div>
      <div className="guide-steps" aria-label={`Step ${i + 1} of ${steps.length}`}>{steps.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
    </Modal>
  );
}

const FAQ = {
  caregiver: [
    ['How does the free trial work?', 'New caregiver accounts get 14 days of access to every region you choose. After that, each region is $8.99 a month. If you don’t subscribe, posts in that region lock again but your profile stays visible to families.'],
    ['Why can’t I see some posts?', 'You only see care requests and job posts in regions you have access to. Add regions on the Regions page.'],
    ['What do “Available” and “Fill-in” mean?', 'Available means you’re open for regular work. Fill-in means you take shifts or a few days. Families see this on your profile.'],
    ['Who can see my documents?', 'Only the Karing4Life team. Families see the verified badge, never the documents.'],
  ],
  family: [
    ['Is Karing4Life really free for families?', 'Yes. Posting a request and messaging are free. You can post once every 14 days and contact 10 caregivers per request. If you need more, add 10 contacts for $8.99.'],
    ['Do caregivers who message me use my contacts?', 'No. Conversations a caregiver starts are always free. Only caregivers you reach out to first count.'],
    ['Can I edit my request?', 'Yes, while it’s open (14 days). Several edits send it to our team for a quick review to keep things fair.'],
    ['Is Karing4Life an agency?', 'No. We connect you directly with caregivers. You interview, hire and pay them yourself.'],
  ],
  agency: [
    ['How does Agency Access work?', 'Each region is $49.99 a month. It unlocks unlimited job posts, caregiver search and messaging in that region.'],
    ['Can agencies see family requests?', 'No. Family requests are private to caregivers, so families aren’t contacted by recruiters.'],
    ['How do we get verified?', 'Upload an EIN letter or business document on the Verification page. Our team reviews it by hand.'],
  ],
  admin: [
    ['What happens when I suspend someone?', 'They’re signed out of every feature, their posts stop showing, and they can’t message. You can reactivate them anytime.'],
    ['How are refunds handled?', 'Mark the payment refunded on Subscriptions & revenue. Once Stripe is connected (Milestone 3) this also sends the refund through Stripe.'],
    ['Where do the prices come from?', 'Platform settings. Changing them updates the site’s prices for new purchases.'],
  ],
};

export default function Help() {
  const { role } = usePortal();
  const [guide, setGuide] = useState(false);
  const [open, setOpen] = useState(0);
  return (
    <>
      <PageHead title="Help & guide" sub="Quick answers about how this portal works." actions={<Btn variant="soft" icon="sparkle" onClick={() => setGuide(true)}>Replay the tour</Btn>} />
      <div className="grid-main">
        <Card title="Frequently asked" icon="help" flush>
          <div className="rows">
            {(FAQ[role] || []).map(([q, a], i) => (
              <div key={q} className="row" style={{ display: 'block', padding: 0 }}>
                <button className="row" style={{ borderTop: 0 }} aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
                  <span className="r-main"><span className="r-t" style={{ whiteSpace: 'normal' }}>{q}</span></span>
                  <PIcon name="chevD" style={{ transform: open === i ? 'rotate(180deg)' : '', transition: 'transform .2s' }} />
                </button>
                {open === i && <p className="fade-in" style={{ padding: '0 18px 16px', color: 'var(--ink-2)' }}>{a}</p>}
              </div>
            ))}
          </div>
        </Card>
        <div className="stack">
          <Card title="Still stuck?" icon="mail">
            <p className="muted" style={{ marginBottom: 14 }}>Write to us and a person will reply within one business day.</p>
            <Btn variant="primary" icon="mail" href={'mailto:' + SUPPORT_EMAIL} block>Email {SUPPORT_EMAIL}</Btn>
          </Card>
          <Card title="Good to know" icon="shield">
            <p className="small muted">Karing4Life connects families with caregivers and agencies. We are not an employer or agency, and we never store medical records. Keep health details out of messages unless they’re needed.</p>
          </Card>
        </div>
      </div>
      <WelcomeGuide open={guide} onClose={() => setGuide(false)} role={role} />
    </>
  );
}
