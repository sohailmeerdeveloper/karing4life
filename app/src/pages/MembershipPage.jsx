import { useEffect, useState } from 'react';
import { useTitle, useQuery, store, REDUCED } from '../lib/hooks.js';
import { CtaBand, Icon } from '../components/bits.jsx';
import { GROUPS, REGIONS, R, PRICE_CG, money } from '../data/data.js';
import { toast } from '../lib/toast.jsx';

function MemPicker() {
  const params = useQuery();
  const [sel, setSel] = useState(() => (store('k4l-regions') || []).filter((k) => R[k]));
  const [code, setCode] = useState('');
  const [trialText, setTrialText] = useState("Your first 14 days include every region, free. You won't be charged until the trial ends.");
  useEffect(() => { store('k4l-regions', sel); }, [sel]);
  useEffect(() => {
    if (params.region && R[params.region]) {
      setSel((s) => (s.includes(params.region) ? s : [...s, params.region]));
      setTimeout(() => document.getElementById('mem-' + params.region)?.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' }), 80);
    }
  }, [params.region]);
  const toggle = (k, on) => setSel((s) => { const has = s.includes(k); if (on == null) on = !has; return on ? (has ? s : [...s, k]) : s.filter((x) => x !== k); });
  const n = sel.length, total = n * PRICE_CG;
  return (
    <div className="mem-layout">
      <div className="mem-regions">
        {['li', 'nyc', 'up'].map((g) => {
          const keys = REGIONS.filter((r) => r.g === g).map((r) => r.key), all = keys.every((k) => sel.includes(k));
          return (
            <div className="mem-group" key={g}>
              <div className="mem-group-head"><h3>{GROUPS[g]}</h3><button type="button" onClick={() => setSel((s) => all ? s.filter((k) => !keys.includes(k)) : [...new Set([...s, ...keys])])}>{all ? 'Remove all' : 'Add all ' + keys.length}</button></div>
              <div className="mem-cards">
                {REGIONS.filter((r) => r.g === g).map((r) => {
                  const on = sel.includes(r.key);
                  return (
                    <article className={'mem-card' + (on ? ' on' : '')} key={r.key} id={'mem-' + r.key}>
                      <div className="mc-top"><div><h4>{r.name.replace(/ Region$/, '')} Region Access</h4><div className="mc-counties">{r.countyChips.join(', ')}</div></div><div className="mc-price">$8.99 <small>/ mo</small></div></div>
                      <p>Open and reply to every family care request posted in the {r.name} region. Cancel anytime, and add more regions whenever you like.</p>
                      <button className="mem-toggle" type="button" aria-pressed={on} aria-label={(on ? 'Remove ' : 'Add ') + r.name + ' region'} onClick={() => toggle(r.key)}><Icon name={on ? 'check' : 'plus'} /><span>{on ? 'Added' : 'Add region'}</span></button>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <aside className="mem-summary" aria-label="Membership summary">
        <div className="summary-card">
          <div className="sum-head"><h3>Your regions</h3><span className="badge">{n} selected</span></div>
          <ul className="sum-list">
            {n ? REGIONS.filter((r) => sel.includes(r.key)).map((r) => (
              <li key={r.key}><span>{r.name}</span><span className="sum-li-r"><span>$8.99</span><button type="button" aria-label={'Remove ' + r.name} onClick={() => toggle(r.key, false)}><Icon name="x" /></button></span></li>
            )) : <li className="sum-empty">No regions yet. Add the regions you work in.</li>}
          </ul>
          <div className="sum-rows"><div><span>{n} × $8.99</span><span>{money(total)}</span></div><div><span>Billed</span><span>Monthly, in one charge</span></div></div>
          <div className="sum-total"><span>Monthly total</span><strong>{money(total)} <small>/ mo</small></strong></div>
          <div className="sum-trial"><Icon name="sparkle" /><span>{trialText}</span></div>
          <form className="trial-code" onSubmit={(e) => {
            e.preventDefault(); const v = code.trim();
            if (!v) { toast('Enter a trial code', 'Codes look like K4L-TRIAL.'); return; }
            setTrialText('Trial code ' + v.toUpperCase() + ' applied: every region is free for 14 days.'); toast('Trial code applied', 'Every region is free for 14 days.');
          }}>
            <label className="sr-only" htmlFor="trialCode">Trial code</label>
            <input className="input" id="trialCode" placeholder="Trial code (optional)" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn btn-ghost btn-sm" type="submit">Apply</button>
          </form>
          <button className="btn btn-accent btn-block" style={{ marginTop: 16 }} type="button"
            onClick={() => toast('14-day trial started', n ? `After the trial you’ll keep ${n} ${n === 1 ? 'region' : 'regions'} for ${money(n * PRICE_CG)} a month.` : 'You have every region for 14 days. Pick the ones to keep any time.')}>Start 14-day free trial</button>
          <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 8 }} type="button" onClick={() => setSel(n === REGIONS.length ? [] : REGIONS.map((r) => r.key))}>{n === REGIONS.length ? 'Clear all regions' : 'Add all 16 regions'}</button>
        </div>
      </aside>
    </div>
  );
}

export default function MembershipPage() {
  useTitle('Caregiver Membership · Karing4Life');
  return (
    <>
    <div className="mem-banner">
      <div className="container">
        <svg className="i" aria-hidden="true"><use href="#i-info" /></svg>
        <span>New here? Create your caregiver profile first (about 2 minutes), then choose your regions.</span>
        <a href="/join?role=caregiver">Create your profile <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
      </div>
    </div>
    <section className="page-hero screen" style={{ paddingBottom: '48px' }}>
      <div className="container">
        <nav className="crumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
          <a href="/caregivers">Caregivers</a>
          <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
          <span>Membership</span>
        </nav>
        <div className="ph-grid">
          <div className="ph-text">
            <span className="eyebrow">Region Access</span>
            <h1>Caregiver <span className="serif">Membership.</span></h1>
            <p className="lead">Region Access lets caregivers and nurses open family care requests and reply to families directly. Each New York region is $8.99 a month, cancel anytime. Add every region you work in, then check out once: your regions are billed together in one monthly charge.</p>
          </div>
          <div className="ph-aside">
            <div className="notice">
              <svg className="i" aria-hidden="true"><use href="#i-sparkle" /></svg>
              <p><strong>Have a trial code?</strong> Start your 14-day all-access trial. Enter your code at checkout and every region is free for 14 days.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section-tight flow">
      <div className="container">
        <MemPicker />
      </div>
    </section>
    <section className="section section-white screen" aria-labelledby="faq-mem">
      <div className="container">
        <div className="split">
          <div className="split-l reveal"><span className="eyebrow">Billing</span><h2 id="faq-mem">Billing, <span className="serif">simply.</span></h2></div>
          <div className="split-r faq reveal">
            <details>
              <summary>What does Region Access unlock?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Every family care request posted in that region: the full title and description, plus the ability to reply and message the family privately.</div>
            </details>
            <details>
              <summary>Can I add or remove regions later?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Yes. Add more regions whenever you like. Your monthly charge updates to match, and you can cancel any region at any time.</div>
            </details>
            <details>
              <summary>What happens after the 14-day trial?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">You keep the regions you selected here at $8.99 a month each, billed in one charge. If you select none, nothing is charged.</div>
            </details>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-mem" title="Not sure where to start?" accent="Try them all."
      text="Fourteen days of every region, free. Then keep only the ones you work in."
      tiles={[
        { href: "/join?role=caregiver", icon: "user-plus", label: "Create your caregiver profile", tone: "accent", sub: "Build your profile, get verified and reply to families." },
        { href: "/requests", icon: "search", label: "Browse care requests", tone: "glass", sub: "See what families need, region by region." },
      ]} />
    </>
  );
}
