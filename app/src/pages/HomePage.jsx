import { lazy, Suspense } from 'react';
import { useTitle } from '../lib/hooks.js';
import { HeroSwitch } from '../components/HeroSwitch.jsx';
const NYMap = lazy(() => import('../components/NYMap.jsx'));
import { AUDIENCE_TILES, CareTiles, CtaBand, Examples, HowSteps, HowToggle, Icon } from '../components/bits.jsx';

export default function HomePage() {
  useTitle("Karing4Life · Connecting New York families with caregivers, nurses and agencies");
  return (
    <>
    <section className="hero screen" aria-labelledby="hero-title">
      <div className="hero-orbs" aria-hidden="true"><i /><i /><i /></div>
      <div className="container">
        <div className="grid">
          <div className="hero-inner">
            <span className="hero-kicker"><span className="k-pill">New York State</span>Connecting families, caregivers &amp; agencies</span>
            <h1 id="hero-title">Where New York families and caregivers <span className="serif">find each other.</span></h1>
            <p className="hero-sub">Families post the care they need for free. Verified nurses and caregivers reply directly. No agency in the middle, and no cut of anyone's rate.</p>
            <HeroSwitch />
            <div className="trust-row">
              <span><svg className="i" aria-hidden="true"><use href="#i-heart" /></svg>Free for families</span>
              <span><svg className="i" aria-hidden="true"><use href="#i-shield" /></svg>Verified caregivers</span>
              <span><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg>Private messaging</span>
              <span><svg className="i" aria-hidden="true"><use href="#i-sparkle" /></svg>14-day free trial</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section map-section" id="map-section" aria-label="Coverage map of New York State">
      <div className="stage stage-map">
        <div className="container">
          <Suspense fallback={<div className="map-row map-loading" aria-hidden="true" />}>
            <NYMap />
          </Suspense>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="who-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head center reveal">
            <div className="sh-main">
              <span className="eyebrow">Who it's for</span>
              <h2 id="who-title">Care is a relationship, <span className="serif">not a referral fee.</span></h2>
              <p>Families and caregivers both have profiles, both can search, and both talk to each other directly. Agencies and facilities recruit in the regions they serve.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="aud-grid">
            <article className="aud-card reveal">
              <div className="aud-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-heart" /></svg></span>
                <span className="badge badge-sand">Free</span>
              </div>
              <h3>Families</h3>
              <p className="aud-lead">Describe the care you need and choose who you talk to.</p>
              <div className="aud-price"><div className="ap-big">$0 <small>always</small></div><div className="ap-sub">to post, to reply and to message</div></div>
              <ul className="aud-list">
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>One free care request every 2 weeks</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Message 10 caregivers per post for free</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Replies from caregivers never cost you a thing</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Your phone and address are never published</li>
              </ul>
              <div className="aud-foot">
                <a className="btn btn-primary btn-block" href="/join?role=family">Post a care request <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </article>
            <article className="aud-card featured reveal">
              <div className="aud-top">
                <span className="icon-circle ink"><svg className="i" aria-hidden="true"><use href="#i-steth" /></svg></span>
                <span className="badge badge-rust">14 days free</span>
              </div>
              <h3>Nurses &amp; caregivers</h3>
              <p className="aud-lead">Own your profile: your rates, your schedule, your clients.</p>
              <div className="aud-price"><div className="ap-big">$8.99 <small>/ month per region</small></div><div className="ap-sub">after a 14-day trial with every region</div></div>
              <ul className="aud-list">
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Read every family request in your regions</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Set your status: Available or Fill-in</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Messaging families is always free</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>No contracts and no cut of your rate</li>
              </ul>
              <div className="aud-foot">
                <a className="btn btn-accent btn-block" href="/join?role=caregiver">Create your caregiver profile <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </article>
            <article className="aud-card reveal">
              <div className="aud-top">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-building" /></svg></span>
                <span className="badge badge-sand">Per region</span>
              </div>
              <h3>Agencies &amp; facilities</h3>
              <p className="aud-lead">Post jobs and recruit verified caregivers where you operate.</p>
              <div className="aud-price"><div className="ap-big">$49.99 <small>/ month per region</small></div><div className="ap-sub">unlimited job posts and messaging</div></div>
              <ul className="aud-list">
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Post open roles in each region you unlock</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Message verified caregivers directly</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Verified business badge (EIN checked)</li>
                <li><svg className="i" aria-hidden="true"><use href="#i-check" /></svg>Family requests stay private from agencies</li>
              </ul>
              <div className="aud-foot">
                <a className="btn btn-primary btn-block" href="/join?role=agency">Create an agency profile <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-white" aria-labelledby="how-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">How it works</span><h2 id="how-title">Three steps from hello <span className="serif">to help.</span></h2><p>The path looks a little different depending on who you are. Pick yours.</p></div>
            <div className="sh-aside" style={{ textAlign: 'right' }}><HowToggle id="home" /></div>
          </div>
        </div>
      </div>
      <div className="stage"><div className="container"><HowSteps id="home" /></div></div>
    </section>
    <section className="section" aria-labelledby="types-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Types of care</span>
              <h2 id="types-title">From skilled nursing to <span className="serif">a friendly visit.</span></h2>
              <p>Thirteen kinds of care, posted by families and offered by caregivers across the state. Pick one to see matching requests.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="care-panels">
            <div className="care-panel reveal">
              <div className="care-panel-head"><div><h3>Skilled care</h3><p>Licensed or certified professionals</p></div><span className="badge">7 types</span></div>
              <CareTiles group="skilled" />
            </div>
            <div className="care-panel reveal">
              <div className="care-panel-head"><div><h3>Non-skilled care</h3><p>Everyday support at home</p></div><span className="badge">6 types</span></div>
              <CareTiles group="nonskilled" />
            </div>
          </div>
          <div className="group-cards">
            <div className="group-card reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-coffee" /></svg></span>
              <div>
                <h4>Companion care</h4>
                <p>Conversation, errands, meals and outings, for loved ones who are safe alone but shouldn't feel alone.</p>
              </div>
            </div>
            <div className="group-card reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-hand" /></svg></span>
              <div>
                <h4>Personal &amp; respite care</h4>
                <p>Help with bathing, dressing and mobility, or a short break so family caregivers can rest.</p>
              </div>
            </div>
            <div className="group-card reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-steth" /></svg></span>
              <div>
                <h4>Private duty &amp; nursing</h4>
                <p>Longer hours, live-in and skilled nursing for complex needs or recovery after a hospital stay.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-alt" aria-labelledby="ex-title">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Profiles</span>
              <h2 id="ex-title">Two kinds of profile. <span className="serif">One community.</span></h2>
              <p>How a family request and a caregiver profile read on Karing4Life. Names and details are placeholders.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage"><div className="container"><Examples /></div></div>
    </section>
    <section className="section screen" aria-labelledby="trust-title">
      <div className="container">
        <div className="trust-grid">
          <div className="trust-intro reveal">
            <span className="eyebrow">Trust &amp; safety</span>
            <h2 id="trust-title">Built on trust from <span className="serif">the first message.</span></h2>
            <p>A family arranging care for a parent or child is sharing something personal. Every rule here exists to protect that.</p>
            <div style={{ marginTop: '32px' }}>
              <a className="link-arrow" href="/how">Read the full rules <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
            </div>
          </div>
          <div className="trust-items">
            <div className="trust-item reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-shield" /></svg></span>
              <h3>Verified before they reply</h3>
              <p>Licensed caregivers upload their HHA, CNA, LPN or RN license. Everyone else verifies with a government ID. Each one is reviewed by hand.</p>
            </div>
            <div className="trust-item reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-lock" /></svg></span>
              <h3>Private messaging only</h3>
              <p>No phone numbers or home addresses are published. The first conversation always happens on the site, and you choose when to share more.</p>
            </div>
            <div className="trust-item reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-gauge" /></svg></span>
              <h3>Limits that stop spam</h3>
              <p>Families post once every 2 weeks and contact 10 caregivers per post, so inboxes stay calm and every message is a real one.</p>
            </div>
            <div className="trust-item reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-eye-off" /></svg></span>
              <h3>Agencies can't see families</h3>
              <p>Agency accounts recruit caregivers only. Family care requests are hidden from them entirely, so no recruiter can cold-call a family.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-home" title="Ready to" accent="get started?"
      text="Free for families. $8.99 a month per region for caregivers and nurses, $49.99 per region for agencies. Serving all of New York State."
      tiles={AUDIENCE_TILES} />
    </>
  );
}
