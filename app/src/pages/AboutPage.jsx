import { useTitle } from '../lib/hooks.js';
import { CtaBand, RegionCloud } from '../components/bits.jsx';

export default function AboutPage() {
  useTitle('About · Karing4Life');
  return (
    <>
    <section className="page-hero screen">
      <div className="container">
        <div className="ph-grid">
          <div className="ph-text">
            <nav className="crumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
              <span>About</span>
            </nav>
            <span className="eyebrow">About Karing4Life</span>
            <h1>Why Karing4Life <span className="serif">exists.</span></h1>
            <p className="lead">Finding good, reliable care in New York shouldn't take dozens of phone calls and a leap of faith.</p>
            <p className="lead" style={{ marginTop: '16px' }}>So we built a two-sided platform: families post what they need, verified caregivers and nurses reply directly, and the two decide together, with verification built in from the first message.</p>
          </div>
          <div className="ph-aside">
            <div className="price-card">
              <div className="pc-label">At a glance</div>
              <div className="rp-empty-stats" style={{ marginTop: '16px' }}><div><strong>16</strong><span>regions</span></div><div><strong>62</strong><span>counties</span></div><div><strong>$0</strong><span>for families</span></div></div>
              <p className="pc-sub">One place for families, caregivers and agencies, across the whole state.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section screen" aria-labelledby="ab-mission">
      <div className="container">
        <div className="mission reveal">
          <span className="eyebrow" id="ab-mission">Our mission</span>
          <blockquote>Families deserve access to the right resources, caregivers deserve meaningful opportunities, and no one should have to navigate the caregiving journey alone.</blockquote>
          <cite>The belief Karing4Life was founded on</cite>
        </div>
      </div>
    </section>
    <section className="section section-white" aria-labelledby="ab-how">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">In three lines</span><h2 id="ab-how">How Karing4Life <span className="serif">works.</span></h2></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="steps-row">
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-pen" /></svg></span>
                <span className="step-n">POST</span>
              </div>
              <h3>Post a profile</h3>
              <p>Family, caregiver, nurse or agency: say who you are, where you are, and what you need or offer.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/join?role=caregiver">Join as a caregiver <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-msg" /></svg></span>
                <span className="step-n">REPLY</span>
              </div>
              <h3>Caregivers reply</h3>
              <p>Verified caregivers and nurses in your region read your request and reply with how they can help.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/requests">See a preview <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg></span>
                <span className="step-n">TALK</span>
              </div>
              <h3>Talk directly</h3>
              <p>Private messaging keeps your details safe until you decide to share them.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/how">How it works <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="ab-values">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">Values</span><h2 id="ab-values">What we <span className="serif">stand for.</span></h2></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="feature-grid cols-4">
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-users" /></svg></span>
              <h3>Direct connection</h3>
              <p>Families and caregivers talk to each other, not to a call center.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg></span>
              <h3>Privacy first</h3>
              <p>No phone numbers or addresses published, ever. You choose what to share.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-shield" /></svg></span>
              <h3>Verified by people</h3>
              <p>Every license, ID and agency is reviewed by hand before it goes live.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-dollar" /></svg></span>
              <h3>Fair, flat pricing</h3>
              <p>Free for families. A flat fee for members, never a cut of a caregiver's rate.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-alt" aria-labelledby="ab-dir">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Our role</span>
              <h2 id="ab-dir">Where we start, <span className="serif">and where you take over.</span></h2>
              <p>Here's exactly what Karing4Life does, and what families and caregivers decide together.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="dodont">
            <div className="dd-col yes reveal">
              <h3>
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-check" /></svg></span>
                What we do
              </h3>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Give families a free place to post the care they need</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Verify caregiver licenses, IDs and agency businesses by hand</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Provide private, on-site messaging</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Let agencies post jobs and recruit caregivers</li>
              </ul>
            </div>
            <div className="dd-col no reveal">
              <h3>
                <span className="icon-circle sand"><svg className="i" aria-hidden="true"><use href="#i-x" /></svg></span>
                What we don't do
              </h3>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-x" /></svg>Employ, place, schedule or supervise caregivers</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-x" /></svg>Give medical advice</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-x" /></svg>Take a percentage of any caregiver's rate</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-x" /></svg>Set terms: families and caregivers agree on those directly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section dark-section screen" aria-labelledby="ab-ny">
      <div className="container">
        <div className="split center">
          <div className="split-l reveal">
            <span className="eyebrow">Local</span>
            <h2 id="ab-ny">We're in <span className="serif" style={{ color: 'var(--sand)' }}>New York too.</span></h2>
            <p className="lead" style={{ marginTop: '16px' }}>Serving Upstate, Downstate and Long Island, every one of the state's 62 counties.</p>
          </div>
          <div className="split-r reveal"><div className="region-cloud"><RegionCloud /></div></div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-ab" title="Join" accent="Karing4Life."
      text="Free for families. $8.99 a month per region for caregivers and nurses, $49.99 per region for agencies and facilities."
      tiles={[
        { href: "/join?role=family", icon: "pen", label: "Post a care request", tone: "light", sub: "Post a free care request in about a minute." },
        { href: "/join?role=caregiver", icon: "user-plus", label: "Create a caregiver or agency profile", tone: "accent", sub: "Build your profile, get verified and reply to families." },
        { href: "/contact", icon: "mail", label: "Contact us", tone: "glass", sub: "Talk to a real person. We reply within one business day." },
      ]} />
    </>
  );
}
