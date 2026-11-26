import { useLocation } from 'react-router-dom';
import { useTitle } from '../lib/hooks.js';
import { Icon } from '../components/bits.jsx';
import './extra.css';

/* Plain-language summaries. The client's lawyer supplies the final wording before launch
   (proposal §7); replace the DOCS text below when it arrives. */
const DOCS = {
  terms: ['Terms of Service', [
    ['What Karing4Life is', ['Karing4Life is an online marketplace that connects families, nurses, caregivers and agencies in New York State. We are a connector only: we are not an employer, staffing agency or home care provider, and we do not supervise or guarantee any care.']],
    ['Your account', ['You must be 18 or older and give accurate information. Keep your password private; you are responsible for activity on your account. One person or business per account.']],
    ['Using the site fairly', ['Families may post one free care request every 14 days and contact up to 10 caregivers per request, with optional paid contact packs.', 'Don’t post false information, recruit for other services while posing as a family or caregiver, harass anyone, or share someone else’s private information.', 'We may hide posts, limit features or suspend accounts that break these rules.']],
    ['Hiring and payment for care', ['Families and caregivers agree on schedules, rates and terms directly. Karing4Life is not a party to those agreements and does not handle wages, taxes or insurance for care work.']],
    ['Subscriptions', ['Caregiver Region Access and Agency Access are billed monthly per region through Stripe. Caregivers receive a 14-day free trial. You can cancel any region at any time; access continues until the end of the paid period.']],
    ['Verification', ['We review uploaded documents by hand, but verification is not a background check or a guarantee. Always interview, check references and use your own judgment.']],
    ['Liability', ['Karing4Life is provided “as is”. To the extent allowed by law, we are not liable for the conduct of members or for any care provided or received through connections made on the site.']],
    ['Changes', ['We may update these terms. If changes are significant we’ll let you know by email or in your portal.']],
  ]],
  privacy: ['Privacy Policy', [
    ['What we collect', ['Account details (name, email, password), profile information you choose to add, your town and region, messages you send on the site, and documents you upload for verification.', 'Families may add a street address; it is private and never shown to other members.']],
    ['What we don’t collect', ['We do not store patient medical records. Please don’t upload or message medical documents.']],
    ['How we use it', ['To run your account, show your profile or posts to the right members, deliver messages, process payments, prevent fraud and spam, and send emails about your account (you can turn most off in Settings).']],
    ['Who can see what', ['Other members see only what you put on your profile or posts: never your email, phone, street address or documents.', 'Verification documents are visible only to the Karing4Life team.', 'Agencies cannot see family care requests.']],
    ['Service providers', ['We use Supabase (database and files), Vercel (hosting), Stripe (payments) and Resend (email). They process data only to provide those services.']],
    ['Your choices', ['You can edit or delete your profile and posts at any time, and request deletion of your account and data by emailing info@karing4life.com.']],
    ['Security', ['Data is encrypted in transit, passwords are hashed, and row-level security limits each member to their own data.']],
  ]],
  refunds: ['Refund Policy', [
    ['Subscriptions', ['Region subscriptions renew monthly. You can cancel anytime; you keep access until the end of the period you paid for. We don’t offer partial refunds for unused days, except where required by law.']],
    ['Free trial', ['Caregivers aren’t charged during the 14-day trial. If you don’t subscribe, nothing is charged.']],
    ['Contact packs', ['Contact packs are one-time purchases. Unused contacts can be refunded within 7 days of purchase if none of them were used.']],
    ['Billing mistakes', ['If you were charged in error or twice, email info@karing4life.com within 30 days and we’ll make it right.']],
    ['How refunds are paid', ['Approved refunds go back to the original card through Stripe, usually within 5–10 business days.']],
  ]],
};

export default function LegalPage() {
  const key = useLocation().pathname.replace('/', '');
  const [title, sections] = DOCS[key] || DOCS.terms;
  useTitle(title + ' · Karing4Life');
  const id = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');
  return (
    <section className="xp flow">
      <div className="container">
        <div className="xp-head">
          <span className="eyebrow">Legal</span>
          <h1>{title}</h1>
          <p className="lead">Last updated November 2026.</p>
        </div>
        <div className="legal-tabs">
          {Object.entries(DOCS).map(([k, [t]]) => <a key={k} href={'/' + k} className={'btn btn-sm ' + (k === key ? 'btn-primary' : 'btn-ghost')}>{t}</a>)}
        </div>
        <div className="legal">
          <nav className="legal-toc" aria-label="On this page">{sections.map(([h]) => <a key={h} href={'#' + id(h)} onClick={(e) => { e.preventDefault(); document.getElementById(id(h))?.scrollIntoView({ behavior: 'smooth' }); }}>{h}</a>)}</nav>
          <div className="prose">
            <div className="legal-note"><Icon name="info" /><span>This is a plain-language summary. The complete legal text will be published here before Karing4Life opens. Questions? <a href="mailto:info@karing4life.com">info@karing4life.com</a></span></div>
            {sections.map(([h, ps]) => (
              <div key={h}>
                <h2 id={id(h)}>{h}</h2>
                {ps.map((p) => <p key={p}>{p}</p>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
