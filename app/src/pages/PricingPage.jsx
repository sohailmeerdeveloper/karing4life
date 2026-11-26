import { useState } from 'react';
import { useTitle } from '../lib/hooks.js';
import { Icon } from '../components/bits.jsx';
import { PRICE_CG, PRICE_AG } from '../data/data.js';
import './extra.css';

const PLANS = [
  { k: 'family', icon: 'heart', label: 'Families', big: '$0', small: 'always', sub: 'Find care for someone you love.', cta: ['/join?role=family', 'Post a free request', 'btn-ghost'],
    items: ['One free care request every 14 days', '10 free contacts with every request', 'Caregivers who message you first are always free', `Need more? 10 extra contacts for $${PRICE_CG}`, 'Your address is never shown'] },
  { k: 'caregiver', icon: 'steth', label: 'Nurses & caregivers', big: `$${PRICE_CG}`, small: '/ region / month', sub: '14 days free in every region you choose.', cta: ['/join?role=caregiver', 'Start free trial', 'btn-accent'], hl: true,
    items: ['See every family request and job in your regions', 'Reply to families for free, no per-message fees', 'Available or Fill-in status', 'Verified badge after document review', 'Cancel any region anytime'] },
  { k: 'agency', icon: 'building', label: 'Agencies & facilities', big: `$${PRICE_AG}`, small: '/ region / month', sub: 'Recruit verified caregivers across New York.', cta: ['/join?role=agency', 'Create agency profile', 'btn-primary'],
    items: ['Unlimited job posts in your regions', 'Unlimited caregiver search and messaging', 'Company profile with your logo', 'Billing history and receipts', 'Family requests stay private from agencies'] },
];

export default function PricingPage() {
  useTitle('Pricing · Karing4Life');
  const [who, setWho] = useState('caregiver');
  const [n, setN] = useState(2);
  const each = who === 'caregiver' ? PRICE_CG : PRICE_AG;
  return (
    <section className="xp flow">
      <div className="container">
        <div className="xp-head center">
          <span className="eyebrow">Pricing</span>
          <h1>Simple, fair, <span className="serif" style={{ color: 'var(--olive)' }}>per region.</span></h1>
          <p className="lead">Families never pay to find care. Caregivers and agencies pay only for the regions they work in. No contracts, no commissions, no cut of anyone’s rate.</p>
        </div>
        <div className="pricing-grid">
          {PLANS.map((p) => (
            <article key={p.k} className={'price-card' + (p.hl ? ' hl' : '')}>
              {p.hl && <span className="pc-flag">14 days free</span>}
              <div className="pc-head"><span className="icon-circle"><Icon name={p.icon} /></span><span className="pc-label">{p.label}</span></div>
              <div className="pc-big">{p.big} <small>{p.small}</small></div>
              <p className="pc-sub">{p.sub}</p>
              <ul>{p.items.map((t) => <li key={t}><Icon name="check" />{t}</li>)}</ul>
              <a className={'btn btn-block ' + p.cta[2]} href={p.cta[0]}>{p.cta[1]}</a>
            </article>
          ))}
        </div>
        <div className="calc">
          <div>
            <h3>What would it cost me?</h3>
            <div className="seg-btns" role="group" aria-label="I am a" style={{ marginTop: 14 }}>
              <button aria-pressed={who === 'caregiver'} onClick={() => setWho('caregiver')}>Caregiver</button>
              <button aria-pressed={who === 'agency'} onClick={() => setWho('agency')}>Agency</button>
            </div>
            <label htmlFor="calcN" style={{ display: 'block', marginTop: 18, fontWeight: 700 }}>Regions: {n}</label>
            <input id="calcN" className="range" type="range" min="1" max="16" value={n} onChange={(e) => setN(+e.target.value)} />
            <p className="small muted" style={{ marginTop: 8 }}>All regions are billed together in one monthly charge. {who === 'caregiver' && 'Your first 14 days are free.'}</p>
          </div>
          <div className="total" aria-live="polite"><span>Per month</span><strong>${(n * each).toFixed(2)}</strong><span>{n} × ${each}</span></div>
        </div>
      </div>
    </section>
  );
}
