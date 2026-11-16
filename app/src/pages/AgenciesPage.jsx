import { useEffect } from 'react';
import { useTitle, useQuery, REDUCED } from '../lib/hooks.js';
import { CtaBand } from '../components/bits.jsx';

export default function AgenciesPage() {
  useTitle('For agencies & facilities · Karing4Life');
  const { s } = useQuery();
  useEffect(() => { if (s === 'pricing') setTimeout(() => document.getElementById('agency-pricing')?.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }), 80); }, [s]);
  return (
    <>
    <section className="page-hero screen">
      <div className="container">
        <div className="ph-grid">
          <div className="ph-text">
            <nav className="crumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
              <span>For agencies</span>
            </nav>
            <span className="eyebrow">For agencies &amp; facilities</span>
            <h1>Recruit verified caregivers <span className="serif">across New York.</span></h1>
            <p className="lead">Agency Access gives home care agencies, nursing homes and care facilities unlimited job posts and direct messaging with verified caregivers and nurses, region by region.</p>
            <div className="ph-actions">
              <a className="btn btn-accent btn-lg" href="/join?role=agency">Create an agency profile <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              <a className="btn btn-ghost btn-lg" href="/contact">Talk to us</a>
            </div>
          </div>
          <div className="ph-aside">
            <div className="price-card">
              <div className="pc-label">Agency Access</div>
              <div className="pc-big" style={{ marginTop: '12px' }}>$49.99 <small>/ month per region</small></div>
              <p className="pc-sub">Unlimited access in every region you choose. All regions billed together, cancel anytime.</p>
              <ul>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Unlimited job posts</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Message verified caregivers directly</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Verified business badge</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="ag-what">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">What you get</span><h2 id="ag-what">Everything you need <span className="serif">to hire well.</span></h2></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="feature-grid cols-4">
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-briefcase" /></svg></span>
              <h3>Post jobs</h3>
              <p>List open roles, shifts and per-diem work in each region you unlock.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-search" /></svg></span>
              <h3>Recruit caregivers</h3>
              <p>Find HHAs, CNAs, LPNs, RNs and therapists who work in your area.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-msg" /></svg></span>
              <h3>Message directly</h3>
              <p>Reach caregivers through private on-site messaging. No middlemen.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-layers" /></svg></span>
              <h3>Unlimited access</h3>
              <p>No per-post or per-hire fees. One flat price per region, per month.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section dark-section screen" aria-labelledby="ag-priv">
      <div className="container">
        <div className="split center">
          <div className="split-l reveal">
            <span className="eyebrow">Privacy</span>
            <h2 id="ag-priv">Agencies can't see family requests. <span className="serif" style={{ color: 'var(--sand)' }}>Ever.</span></h2>
          </div>
          <div className="split-r reveal">
            <p className="lead">Karing4Life is where families find caregivers on their own terms. To keep it that way, agency and facility accounts never see family care requests: not the details, not the titles, not even that a request exists.</p>
            <p className="lead" style={{ marginTop: '16px' }}>You recruit caregivers. Families stay free from recruiter calls. Everyone knows where they stand.</p>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="ag-ver">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Verification</span>
              <h2 id="ag-ver">Three things we check <span className="serif">before you recruit.</span></h2>
              <p>Caregivers trust the badge. Here's what earns it. Every agency is reviewed by hand.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="steps-row">
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-file" /></svg></span>
                <span className="step-n">EIN</span>
              </div>
              <h3>Employer ID number</h3>
              <p>Your federal EIN confirms that the business is registered.</p>
            </div>
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-globe" /></svg></span>
                <span className="step-n">WEBSITE</span>
              </div>
              <h3>Business website</h3>
              <p>We check that your website matches the agency or facility on your profile.</p>
            </div>
            <div className="step-card reveal">
              <div className="step-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-user" /></svg></span>
                <span className="step-n">CONTACT</span>
              </div>
              <h3>Business contact</h3>
              <p>A named person at the business we can reach, so caregivers know who they're talking to.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-white screen" id="agency-pricing" aria-labelledby="ag-price">
      <div className="container">
        <div className="split center">
          <div className="split-l reveal">
            <span className="eyebrow">Pricing</span>
            <h2 id="ag-price">$49.99 per region. <span className="serif">That's it.</span></h2>
            <p className="lead" style={{ marginTop: '16px' }}>Pick the regions you hire in. Every region is billed together in one monthly charge. No contracts, cancel anytime.</p>
          </div>
          <div className="split-r reveal">
            <div className="rule-list" style={{ gridTemplateColumns: '1fr' }}>
              <div className="rule">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-pin" /></svg></span>
                <div><h4>One region</h4><p>For example, Hudson Valley.</p></div>
                <span className="rule-val">$49.99 / mo</span>
              </div>
              <div className="rule">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-map" /></svg></span>
                <div><h4>Three regions</h4><p>For example, the Bronx, Manhattan and Queens.</p></div>
                <span className="rule-val">$149.97 / mo</span>
              </div>
              <div className="rule">
                <span className="icon-circle sand"><svg className="i" aria-hidden="true"><use href="#i-globe" /></svg></span>
                <div><h4>Statewide</h4><p>All 16 regions.</p></div>
                <span className="rule-val">$799.84 / mo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section screen" aria-labelledby="faq-ag">
      <div className="container">
        <div className="split">
          <div className="split-l reveal"><span className="eyebrow">FAQ</span><h2 id="faq-ag">Agency <span className="serif">questions.</span></h2></div>
          <div className="split-r faq reveal">
            <details>
              <summary>Why can't we see family requests?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Families come to Karing4Life to talk with caregivers directly. Keeping requests private from agencies protects that, and keeps families' trust in Karing4Life, which is what brings caregivers here too.</div>
            </details>
            <details>
              <summary>Can caregivers message us first?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Yes. Caregivers in your regions can see your job posts and message you. You can message them too.</div>
            </details>
            <details>
              <summary>How long does verification take?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">We review every agency by hand. Most are approved within one business day of sending the EIN, website and business contact.</div>
            </details>
            <details>
              <summary>Is there a limit on job posts?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">No. Agency Access is unlimited within each region you unlock.</div>
            </details>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-ag" title="Start recruiting in" accent="your regions."
      text="$49.99 a month per region. Verified business badge, unlimited posts, direct messaging."
      tiles={[
        { href: "/join?role=agency", icon: "building", label: "Create an agency profile", tone: "accent", sub: "Verify your business and start recruiting." },
        { href: "/contact", icon: "mail", label: "Ask about Agency Access", tone: "glass", sub: "Talk to a real person. We reply within one business day." },
      ]} />
    </>
  );
}
