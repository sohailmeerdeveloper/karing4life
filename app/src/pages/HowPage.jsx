import { useEffect } from 'react';
import { useTitle, useQuery } from '../lib/hooks.js';
import { AUDIENCE_TILES, CtaBand, Examples, HowSteps, HowToggle, setHow } from '../components/bits.jsx';

export default function HowPage() {
  useTitle('How it works · Karing4Life');
  const { aud } = useQuery();
  useEffect(() => { if (['families', 'caregivers', 'agencies'].includes(aud)) setHow('how', aud); }, [aud]);
  return (
    <>
    <section className="page-hero screen">
      <div className="container">
        <div className="ph-grid">
          <div className="ph-text">
            <nav className="crumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
              <span>How it works</span>
            </nav>
            <span className="eyebrow">How it works</span>
            <h1>Families post. <span className="serif">Caregivers reply.</span></h1>
            <p className="lead">A family describes the care they need, for free. Verified caregivers and nurses in that region read the request and answer directly. Nobody takes a referral fee or a percentage of anyone's rate.</p>
            <div className="ph-actions">
              <a className="btn btn-accent" href="/join?role=family">Post a care request <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              <a className="btn btn-ghost" href="/join?role=caregiver">Join as a caregiver</a>
            </div>
          </div>
          <div className="ph-aside">
            <div className="price-card">
              <div className="pc-label">Who pays what</div>
              <p className="pc-sub">Caregivers and agencies pay a flat monthly membership for each New York region they work in. Families never pay.</p>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-heart" /></svg><span><strong>Families:</strong> free, always</span></li>
                <li>
                  <svg className="i" aria-hidden="true"><use href="#i-steth" /></svg>
                  <span><strong>Caregivers &amp; nurses:</strong> $8.99 / month per region, after a 14-day trial</span>
                </li>
                <li><svg className="i" aria-hidden="true"><use href="#i-building" /></svg><span><strong>Agencies &amp; facilities:</strong> $49.99 / month per region</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="how2-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">Step by step</span><h2 id="how2-title">Your path, <span className="serif">in three steps.</span></h2></div>
            <div className="sh-aside" style={{ textAlign: 'right' }}><HowToggle id="how" /></div>
          </div>
        </div>
      </div>
      <div className="stage"><div className="container"><HowSteps id="how" /></div></div>
    </section>
    <section className="section section-white" aria-labelledby="rules-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">The rules</span><h2 id="rules-title">The rules, <span className="serif">in plain English.</span></h2><p>Short, fair and the same for everyone. They keep inboxes calm and families safe.</p></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="rule-list">
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-cal" /></svg></span>
              <div><h4>One free request every 2 weeks</h4><p>Each family can post a new care request once every two weeks, at no cost.</p></div>
              <span className="rule-val">Free</span>
            </div>
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-users" /></svg></span>
              <div><h4>10 free contacts per post</h4><p>A family can start conversations with up to 10 caregivers for every request.</p></div>
              <span className="rule-val">10 free</span>
            </div>
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></span>
              <div>
                <h4>Need more? 10 more for $8.99</h4>
                <p>If you'd like a wider circle, add another 10 contacts to that post for a one-time $8.99.</p>
              </div>
              <span className="rule-val">$8.99</span>
            </div>
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-msg" /></svg></span>
              <div>
                <h4>Replies are always free</h4>
                <p>When a caregiver or nurse messages a family, it never costs the family anything and never counts toward the 10.</p>
              </div>
              <span className="rule-val">Free</span>
            </div>
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-clock" /></svg></span>
              <div>
                <h4>Available or Fill-in</h4>
                <p>Caregivers choose a status. <strong>Available</strong> means open for regular work. <strong>Fill-in</strong> means open for single shifts or a few days.</p>
              </div>
            </div>
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-unlock" /></svg></span>
              <div>
                <h4>Region access</h4>
                <p>Caregivers can see that a request exists in any region, but details stay blurred until they unlock that region.</p>
              </div>
              <span className="rule-val">$8.99/mo</span>
            </div>
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg></span>
              <div>
                <h4>Messaging only</h4>
                <p>No phone numbers or addresses are ever published. First contact always happens in private on-site messages.</p>
              </div>
            </div>
            <div className="rule reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-eye-off" /></svg></span>
              <div>
                <h4>Agencies can't see family requests</h4>
                <p>Agency and facility accounts recruit caregivers only. Family requests are hidden from them completely.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="looks-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">Examples</span><h2 id="looks-title">What it <span className="serif">looks like.</span></h2><p>An example family request and caregiver profile. Details shown are placeholders.</p></div>
          </div>
        </div>
      </div>
      <div className="stage"><div className="container"><Examples /></div></div>
    </section>
    <section className="section section-alt screen" aria-labelledby="msg-title">
      <div className="container">
        <div className="split">
          <div className="split-l reveal">
            <span className="eyebrow">Privacy</span>
            <h2 id="msg-title">Messaging only. <span className="serif">On purpose.</span></h2>
            <p className="lead" style={{ marginTop: '16px' }}>Karing4Life doesn't publish phone numbers or home addresses, not for families and not for caregivers. For a family arranging care for a loved one, that matters.</p>
          </div>
          <div className="split-r points">
            <div className="point reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-eye-off" /></svg></span>
              <div>
                <h4>Locked until a region is unlocked</h4>
                <p>A caregiver who hasn't unlocked a region sees only that a request exists there, never the details.</p>
              </div>
            </div>
            <div className="point reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-building" /></svg></span>
              <div>
                <h4>Agencies don't see families at all</h4>
                <p>Agency accounts can post jobs and message caregivers, but family requests never appear for them.</p>
              </div>
            </div>
            <div className="point reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-msg" /></svg></span>
              <div>
                <h4>You decide what to share</h4>
                <p>Every first conversation happens in private messages on the site. You choose when to share contact details, and with whom.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="ver-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Verification</span>
              <h2 id="ver-title">What we check, <span className="serif">and how.</span></h2>
              <p>Every account that can contact a family or recruit a caregiver is reviewed by a person before it goes live.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="feature-grid">
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-file" /></svg></span>
              <h3>Licensed caregivers</h3>
              <p>HHAs, CNAs, LPNs and RNs upload a copy of their license. We check it and keep it on file.</p>
              <div className="feature-foot"><span className="tag">Reviewed by hand</span></div>
            </div>
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-id" /></svg></span>
              <h3>Non-skilled caregivers</h3>
              <p>Companions and other non-skilled caregivers verify with a government ID, matched against their profile name.</p>
              <div className="feature-foot"><span className="tag">Never published</span></div>
            </div>
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-building" /></svg></span>
              <h3>Agencies &amp; facilities</h3>
              <p>Agencies give us their EIN, website and a business contact. We confirm the business is real before it can recruit.</p>
              <div className="feature-foot"><span className="tag">EIN · website · contact</span></div>
            </div>
          </div>
          <p className="muted small reveal" style={{ marginTop: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}><svg className="i i-sm" aria-hidden="true"><use href="#i-lock" /></svg>IDs and licenses are seen only by the Karing4Life team. They're never shown on the site.</p>
        </div>
      </div>
    </section>
    <section className="section section-white screen" aria-labelledby="faq-how">
      <div className="container">
        <div className="split">
          <div className="split-l reveal">
            <span className="eyebrow">FAQ</span>
            <h2 id="faq-how">Questions, <span className="serif">answered.</span></h2>
            <p className="muted" style={{ marginTop: '16px' }}>Still unsure? Write to <a href="mailto:info@karing4life.com">info@karing4life.com</a> and a person replies within one business day.</p>
          </div>
          <div className="split-r faq reveal">
            <details>
              <summary>Do families ever pay?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">No. Posting, replying and messaging are free. The only optional cost is $8.99 if you want to contact 10 more caregivers on a single post, beyond the first 10.</div>
            </details>
            <details>
              <summary>Can a caregiver see my request before paying?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">They can see that a request exists in your region, and the type of care, but the title and description stay blurred until they unlock that region.</div>
            </details>
            <details>
              <summary>What's the difference between Available and Fill-in?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Available caregivers are open for regular or ongoing work. Fill-in caregivers can still be messaged, but they're only looking for single shifts or a few days, which is ideal when your regular caregiver is away.</div>
            </details>
            <details>
              <summary>How does billing work for several regions?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Each region is $8.99 a month for caregivers ($49.99 for agencies). Add as many as you like and they're billed together in one monthly charge. Cancel anytime.</div>
            </details>
            <details>
              <summary>Does Karing4Life employ or place caregivers?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">No. We verify accounts and provide private messaging. Families and caregivers agree on rates, schedules and terms directly.</div>
            </details>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-how" title="Ready" accent="when you are."
      text="Free for families. $8.99 a month per region for caregivers and nurses, $49.99 per region for agencies."
      tiles={AUDIENCE_TILES} />
    </>
  );
}
