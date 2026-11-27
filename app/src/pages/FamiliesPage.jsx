import { useTitle } from '../lib/hooks.js';
import { CtaBand } from '../components/bits.jsx';

export default function FamiliesPage() {
  useTitle('For families · Karing4Life');
  return (
    <>
    <section className="page-hero screen">
      <div className="container">
        <div className="ph-grid">
          <div className="ph-text">
            <nav className="crumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
              <span>For families</span>
            </nav>
            <span className="eyebrow">For families · Always free</span>
            <h1>Find care you can trust <span className="serif">for the people you love.</span></h1>
            <p className="lead">Describe the care your loved one needs, hear from verified caregivers and nurses in your region, and message them yourself. No markup and no call center.</p>
            <div className="ph-actions">
              <a className="btn btn-accent btn-lg" href="/join?role=family">Post a care request <svg className="i i-arrow" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              <a className="btn btn-ghost btn-lg" href="/how?aud=families">How it works</a>
            </div>
            <div className="ph-chips">
              <span className="chip"><svg className="i i-sm" aria-hidden="true"><use href="#i-pin" /></svg>Upstate, Downstate &amp; Long Island</span>
              <span className="chip"><svg className="i i-sm" aria-hidden="true"><use href="#i-clock" /></svg>About a minute to post</span>
            </div>
          </div>
          <div className="ph-aside">
            <div className="price-card">
              <div className="pc-label">What it costs · Free, forever</div>
              <div className="zero-stack"><div><strong>$0</strong><span>to post</span></div><div><strong>$0</strong><span>to reply</span></div><div><strong>$0</strong><span>to message</span></div></div>
              <p className="pc-sub">Families never pay Karing4Life to post. Caregivers, nurses and agencies hold the paid memberships.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="fam-rules">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">Posting rules</span><h2 id="fam-rules">Simple rules that <span className="serif">keep it calm.</span></h2><p>Limits keep your inbox manageable and make every conversation count.</p></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="feature-grid cols-4">
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-cal" /></svg></span>
              <h3>1 free request every 2 weeks</h3>
              <p>Post a new care request every two weeks, always free.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-users" /></svg></span>
              <h3>10 caregivers per post, free</h3>
              <p>Start conversations with up to 10 caregivers on each request.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></span>
              <h3>10 more for $8.99</h3>
              <p>Want a wider search? Add 10 more contacts to that post, once.</p>
            </div>
            <div className="feature compact reveal">
              <span className="icon-circle sand"><svg className="i" aria-hidden="true"><use href="#i-msg" /></svg></span>
              <h3>Their messages are free</h3>
              <p>When a caregiver messages you first, it's always free and doesn't count.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-white" aria-labelledby="fam-types">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main">
              <span className="eyebrow">Kinds of care</span>
              <h2 id="fam-types">Not sure what to ask for? <span className="serif">Start here.</span></h2>
              <p>Most families need one of these three. You can tick as many care types as you like when you post.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="feature-grid">
            <div className="feature reveal">
              <span className="icon-circle lg"><svg className="i i-lg" aria-hidden="true"><use href="#i-coffee" /></svg></span>
              <h3>Companion care</h3>
              <p>Conversation, errands, meals and outings, for loved ones who are safe on their own but shouldn't feel alone.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/requests?care=companion">See companion requests <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="feature reveal">
              <span className="icon-circle lg"><svg className="i i-lg" aria-hidden="true"><use href="#i-hand" /></svg></span>
              <h3>Personal &amp; respite care</h3>
              <p>Help with bathing, dressing, mobility and daily routines, or short-term relief so family caregivers can rest.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/requests?care=personal,respite">See personal care requests <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="feature reveal">
              <span className="icon-circle lg"><svg className="i i-lg" aria-hidden="true"><use href="#i-steth" /></svg></span>
              <h3>Private duty &amp; nursing</h3>
              <p>Longer-hour, live-in and skilled nursing support for complex needs or recovery after a hospital stay.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/requests?care=rn,lpn,livein">See nursing requests <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section screen" aria-labelledby="fam-priv">
      <div className="container">
        <div className="split">
          <div className="split-l reveal">
            <span className="eyebrow">Privacy</span>
            <h2 id="fam-priv">Your details <span className="serif">stay yours.</span></h2>
            <p className="lead" style={{ marginTop: '16px' }}>Karing4Life never publishes your phone number or home address. Not on your profile, not to paying members, not anywhere.</p>
          </div>
          <div className="split-r points">
            <div className="point reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-msg" /></svg></span>
              <div>
                <h3>They reply to you</h3>
                <p>Only members who've unlocked your region can read your request and reply, and every conversation starts privately on the site. Share contact details only when you're ready.</p>
              </div>
            </div>
            <div className="point reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-shield" /></svg></span>
              <div>
                <h3>Every caregiver is reviewed</h3>
                <p>Credentials and identity are checked before anyone can reply to you, so the people you hear from have already been screened.</p>
              </div>
            </div>
            <div className="point reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-info" /></svg></span>
              <div>
                <h3>You choose who you hire</h3>
                <p>We connect you with verified caregivers. You interview, choose and agree on terms with your caregiver directly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-alt screen" aria-labelledby="fam-build">
      <div className="container">
        <div className="split center">
          <div className="split-l reveal">
            <span className="eyebrow">Your request</span>
            <h2 id="fam-build">How a request <span className="serif">is built.</span></h2>
            <p className="lead" style={{ marginTop: '16px' }}>Four quick choices tell caregivers exactly what you need, so the replies you get are the right ones.</p>
            <div className="points" style={{ marginTop: '32px' }}>
              <div className="point">
                <span className="icon-square"><svg className="i" aria-hidden="true"><use href="#i-heart" /></svg></span>
                <div><h3>Type of care</h3><p>Tick any mix of skilled and non-skilled care, from RN visits to companionship.</p></div>
              </div>
              <div className="point">
                <span className="icon-square"><svg className="i" aria-hidden="true"><use href="#i-cal" /></svg></span>
                <div><h3>Schedule</h3><p>Days, evenings, overnights or live-in, on any of the seven weekdays.</p></div>
              </div>
              <div className="point">
                <span className="icon-square"><svg className="i" aria-hidden="true"><use href="#i-user" /></svg></span>
                <div><h3>Care recipient</h3><p>Pediatric or adult, so caregivers with the right experience reply.</p></div>
              </div>
              <div className="point">
                <span className="icon-square"><svg className="i" aria-hidden="true"><use href="#i-hourglass" /></svg></span>
                <div><h3>Duration</h3><p>Fill-in (a shift or a few days), short-term (up to a few months) or long-term.</p></div>
              </div>
            </div>
          </div>
          <div className="split-r reveal">
            <div className="mock-card" style={{ padding: '24px' }}>
              <div className="mock-row" style={{ justifyContent: 'space-between' }}><span className="badge">Family request · Preview</span><span className="mock-label">Suffolk</span></div>
              <h3 style={{ marginTop: '16px', fontSize: '20px' }}>Care for Dad, 79, Patchogue</h3>
              <p className="muted" style={{ fontSize: '14px', marginTop: '4px' }}>Weekday afternoons, companionship and light mobility support.</p>
              <div style={{ marginTop: '20px' }} className="mock-label">Type of care</div>
              <div className="mock-row" style={{ flexWrap: 'wrap', marginTop: '8px' }}>
                <span className="mock-pill on">Companion Care</span>
                <span className="mock-pill on">Personal Care</span>
                <span className="mock-pill">Respite Care</span>
                <span className="mock-pill">RN</span>
              </div>
              <div style={{ marginTop: '16px' }} className="mock-label">Schedule · Days</div>
              <div className="days" style={{ marginTop: '8px' }} aria-hidden="true">
                <span className="day"><span>Sun</span></span>
                <span className="day">
                  <span style={{ background: 'var(--rust-ink)', color: 'var(--on-accent)', borderColor: 'var(--rust-ink)' }}>Mon</span>
                </span>
                <span className="day">
                  <span style={{ background: 'var(--rust-ink)', color: 'var(--on-accent)', borderColor: 'var(--rust-ink)' }}>Tue</span>
                </span>
                <span className="day">
                  <span style={{ background: 'var(--rust-ink)', color: 'var(--on-accent)', borderColor: 'var(--rust-ink)' }}>Wed</span>
                </span>
                <span className="day">
                  <span style={{ background: 'var(--rust-ink)', color: 'var(--on-accent)', borderColor: 'var(--rust-ink)' }}>Thu</span>
                </span>
                <span className="day">
                  <span style={{ background: 'var(--rust-ink)', color: 'var(--on-accent)', borderColor: 'var(--rust-ink)' }}>Fri</span>
                </span>
                <span className="day"><span>Sat</span></span>
              </div>
              <div className="rc-fields" style={{ marginTop: '16px' }}>
                <div className="rc-field"><div className="k">Recipient</div><div className="v">Adult</div></div>
                <div className="rc-field"><div className="k">Duration</div><div className="v">Long-term</div></div>
                <div className="rc-field"><div className="k">Hours</div><div className="v">20 hrs / wk</div></div>
              </div>
              <div className="mock-btn" style={{ marginTop: '20px' }}><svg className="i i-sm" aria-hidden="true"><use href="#i-send" /></svg>Post request · Free</div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section screen" aria-labelledby="faq-fam">
      <div className="container">
        <div className="split">
          <div className="split-l reveal"><span className="eyebrow">FAQ</span><h2 id="faq-fam">Family <span className="serif">questions.</span></h2></div>
          <div className="split-r faq reveal">
            <details>
              <summary>Is it really free?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Yes. Posting, reading replies and messaging are free for families. The only optional extra is $8.99 to contact 10 more caregivers on a single post.</div>
            </details>
            <details>
              <summary>Who can see my request?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">Only verified caregivers and nurses who have unlocked your region can read the details. Agencies and facilities can't see family requests at all.</div>
            </details>
            <details>
              <summary>Why do you ask for the address where care is needed?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">So we can place your request in the right region. The address is never shown to caregivers or anyone else; they see only the town and region.</div>
            </details>
            <details>
              <summary>Do you check caregivers' backgrounds?<svg className="i" aria-hidden="true"><use href="#i-plus" /></svg></summary>
              <div className="faq-a">We verify licenses for HHAs, CNAs, LPNs and RNs, and government ID for non-skilled caregivers. We also encourage families to interview, check references and agree on terms in writing.</div>
            </details>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-fam" title="Tell us what" accent="you're looking for."
      text="It takes about a minute, it's free, and there's no commitment."
      tiles={[
        { href: "/join?role=family", icon: "pen", label: "Post a care request", tone: "accent", sub: "Post a free care request in about a minute." },
        { href: "/how?aud=families", icon: "layers", label: "See how it works", tone: "glass", sub: "Posting rules, private messaging and privacy." },
      ]} />
    </>
  );
}
