import { useTitle } from '../lib/hooks.js';
import { CtaBand } from '../components/bits.jsx';

export default function CaregiversPage() {
  useTitle('For caregivers & nurses · Karing4Life');
  return (
    <>
    <section className="page-hero screen">
      <div className="container">
        <div className="ph-grid">
          <div className="ph-text">
            <nav className="crumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
              <span>For caregivers</span>
            </nav>
            <span className="eyebrow">For caregivers &amp; nurses</span>
            <h1>Your profile. Your rates. <span className="serif">Your schedule.</span></h1>
            <p className="lead">HHAs, PCAs, CNAs, LPNs, RNs, therapists and companions reply directly to families who need care in the regions you serve. Karing4Life never takes a cut of your hourly rate.</p>
            <div className="ph-actions">
              <a className="btn btn-accent btn-lg" href="/join?role=caregiver">Create your caregiver profile <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              <a className="btn btn-ghost btn-lg" href="/requests">Browse requests</a>
            </div>
          </div>
          <div className="ph-aside">
            <div className="price-card">
              <div className="pc-label">Pick your regions</div>
              <h3 style={{ marginTop: '8px', fontSize: '22px' }}>Pay only for where you work.</h3>
              <div className="pc-big" style={{ marginTop: '16px' }}>$8.99 <small>/ month per region</small></div>
              <p className="pc-sub">Choose any of New York's 16 regions and cancel anytime. Every family request in those regions is yours to read and reply to.</p>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-sparkle" /></svg><span>Have a trial code? Get <strong>14 days of every region free</strong>.</span></li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg><span>No contracts. All regions in one monthly charge.</span></li>
              </ul>
              <a className="btn btn-primary btn-block" href="/membership">See regions &amp; pricing <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="cg-status">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">Your status</span><h2 id="cg-status">Available or Fill-in. <span className="serif">Your call.</span></h2><p>Tell families how much work you're open to. Switch any time from your profile.</p></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="status-grid">
            <div className="status-card reveal">
              <span className="status-pill"><span className="dot dot-available" />Available</span>
              <h3>Open for regular work</h3>
              <p>You're in the pool of caregivers families see first when they're looking for ongoing care.</p>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Best for weekly, long-term or live-in clients</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Families can message you about any request</li>
              </ul>
            </div>
            <div className="status-card reveal">
              <span className="status-pill"><span className="dot dot-fillin" />Fill-in</span>
              <h3>Open for shifts or a few days</h3>
              <p>Families can still message you, but they'll know you're only taking single shifts or short stints.</p>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Great alongside a full-time job or another client</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Perfect when a family's regular caregiver is away</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-white" aria-labelledby="cg-built">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Why caregivers join</span>
              <h2 id="cg-built">Built for the person <span className="serif">doing the work.</span></h2>
              <p>You set your hourly rate, your availability and the care you provide. You read the full request before you reply, so the conversations you have are the right ones.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="feature-grid">
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-dollar" /></svg></span>
              <h3>Keep what you earn</h3>
              <p>A flat monthly membership, never a percentage of your rate. What the family pays you is yours.</p>
            </div>
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-check-circle" /></svg></span>
              <h3>Choose your clients</h3>
              <p>Browse family requests in your regions and reply only to the ones that fit your schedule and skills.</p>
            </div>
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg></span>
              <h3>Your details stay private</h3>
              <p>Your profile isn't public. Families message you through the site once you've replied, and agencies hiring in your regions can message you too. You decide when to share a phone number.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="cg-steps">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">Getting started</span><h2 id="cg-steps">Up and replying <span className="serif">this week.</span></h2></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="steps-row">
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-pen" /></svg></span>
                <span className="step-n">STEP 1</span>
              </div>
              <h3>Build your profile</h3>
              <p>Credentials, the care you provide, languages, the regions you serve and your hourly rate. About two minutes.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/join?role=caregiver">Get started <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-shield" /></svg></span>
                <span className="step-n">STEP 2</span>
              </div>
              <h3>Get verified</h3>
              <p>Upload your license or a government ID. We review it before you can reply to families. That badge is what families trust.</p>
              <div className="feature-foot">
                <span className="verified"><svg className="i" aria-hidden="true"><use href="#i-shield" /></svg>Verified badge</span>
              </div>
            </div>
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-unlock" /></svg></span>
                <span className="step-n">STEP 3</span>
              </div>
              <h3>Reply to families</h3>
              <p>Unlock a region and every family request there opens up. Reply to the ones that fit, and agencies hiring nearby can find you too.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/membership">See regions &amp; pricing <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-alt" aria-labelledby="cg-verify">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Verification</span>
              <h2 id="cg-verify">What <span className="serif">we verify.</span></h2>
              <p>Every caregiver is reviewed by the Karing4Life team before they can reply to a family.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="verify-grid">
            <div className="verify-card reveal">
              <span className="icon-circle lg"><svg className="i i-lg" aria-hidden="true"><use href="#i-file" /></svg></span>
              <div className="vc-kicker">Credentials</div>
              <h3>Your license.</h3>
              <p>An HHA, CNA, LPN or RN license, with a copy kept on file. Companions and other non-skilled caregivers are verified by ID instead.</p>
              <div className="ex-tags"><span className="tag">Reviewed by hand</span><span className="tag">Kept on file</span></div>
            </div>
            <div className="verify-card reveal">
              <span className="icon-circle lg"><svg className="i i-lg" aria-hidden="true"><use href="#i-id" /></svg></span>
              <div className="vc-kicker">Identity</div>
              <h3>Who you say you are.</h3>
              <p>A government ID, checked against your profile name before approval. Only Karing4Life sees your ID, and it's never shown on the site.</p>
              <div className="ex-tags"><span className="tag">Private to us</span><span className="tag">Never published</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section screen" aria-labelledby="cg-price">
      <div className="container">
        <div className="card card-pad reveal" style={{ padding: '48px' }}>
          <div className="split center">
            <div className="split-l">
              <span className="eyebrow">Pricing</span>
              <h2 id="cg-price">One region or all sixteen. <span className="serif">You choose.</span></h2>
              <p className="lead" style={{ marginTop: '16px' }}>$8.99 a month per region, billed together in one monthly charge. Start with 14 days of every region, free.</p>
              <div className="ph-actions">
                <a className="btn btn-accent" href="/membership">Choose your regions <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="split-r">
              <div className="rule-list" style={{ gridTemplateColumns: '1fr' }}>
                <div className="rule">
                  <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-pin" /></svg></span>
                  <div><h4>Just your county</h4><p>For example, Suffolk only.</p></div>
                  <span className="rule-val">$8.99 / mo</span>
                </div>
                <div className="rule">
                  <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-map" /></svg></span>
                  <div><h4>A few neighbouring regions</h4><p>For example, Brooklyn, Queens and Nassau.</p></div>
                  <span className="rule-val">$26.97 / mo</span>
                </div>
                <div className="rule">
                  <span className="icon-circle sand"><svg className="i" aria-hidden="true"><use href="#i-globe" /></svg></span>
                  <div><h4>All of New York State</h4><p>All 16 regions in one charge.</p></div>
                  <span className="rule-val">$143.84 / mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-white screen" aria-labelledby="faq-cg">
      <div className="container">
        <div className="split">
          <div className="split-l reveal"><span className="eyebrow">FAQ</span><h2 id="faq-cg">Caregiver <span className="serif">questions.</span></h2></div>
          <div className="split-r faq reveal">
            <details>
              <summary>Do I need a license to join?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">No. Licensed caregivers (HHA, CNA, LPN, RN) upload their license. Companions and other non-skilled caregivers verify with a government ID.</div>
            </details>
            <details>
              <summary>How does the 14-day trial work?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Enter your trial code at checkout and every region is free for 14 days. After that, you keep only the regions you choose, at $8.99 a month each.</div>
            </details>
            <details>
              <summary>Does it cost anything to message a family?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">No. Once you've unlocked a region, replying to and messaging families there is always free, for you and for them.</div>
            </details>
            <details>
              <summary>Can I cancel anytime?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Yes. There are no contracts. Remove a region or cancel your membership whenever you like.</div>
            </details>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-cg" title="Start replying to families" accent="this week."
      text="$8.99 a month per region. No contracts, cancel anytime."
      tiles={[
        { href: "/join?role=caregiver", icon: "user-plus", label: "Get started", tone: "accent", sub: "Build your profile, get verified and reply to families." },
        { href: "/membership", icon: "map", label: "See regions & pricing", tone: "glass", sub: "Pick the regions you work in. $8.99 a month each, 14 days free." },
      ]} />
    </>
  );
}
