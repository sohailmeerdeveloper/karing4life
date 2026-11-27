import { useTitle } from '../lib/hooks.js';
import { toast } from '../lib/toast.jsx';
import { supabase } from '../lib/supabase.js';
import { CtaBand, AUDIENCE_TILES } from '../components/bits.jsx';

export default function ContactPage() {
  useTitle('Contact · Karing4Life');
  const onSubmit = async (e) => {
    e.preventDefault();
    const f = e.currentTarget, bad = Array.from(f.querySelectorAll('[required]')).filter((i) => !i.checkValidity());
    if (bad.length) { bad[0].focus(); toast.error('Please complete the form', 'Name, a valid email and a message are needed.'); return; }
    const v = (id) => f.querySelector('#' + id)?.value?.trim() || null;
    const btn = f.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
    const { error } = await supabase.from('contact_messages').insert({ name: v('cName'), email: v('cEmail').toLowerCase(), role: v('cRole'), subject: v('cSubject'), message: v('cMsg') });
    if (btn) btn.disabled = false;
    if (error) { toast.error('Message not sent', 'Please check your connection and try again, or email info@karing4life.com.'); return; }
    toast('Message sent', 'Thanks! A member of the team will reply within one business day.'); f.reset();
  };
  return (
    <>
    <section className="page-hero screen">
      <div className="container">
        <div className="ph-grid">
          <div className="ph-text">
            <nav className="crumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <svg className="i" aria-hidden="true"><use href="#i-chev" transform="rotate(-90 12 12)" /></svg>
              <span>Contact</span>
            </nav>
            <span className="eyebrow">Contact</span>
            <h1>Talk to <span className="serif">a person.</span></h1>
            <p className="lead">Questions about care, about joining as a caregiver, or about Agency Access for your agency or facility? Email us and a member of the Karing4Life team will get back to you within one business day.</p>
          </div>
          <div className="ph-aside">
            <div className="contact-email">
              <span className="icon-circle lg"><svg className="i i-lg" aria-hidden="true"><use href="#i-mail" /></svg></span>
              <div>
                <span>Email us</span>
                <a href="mailto:info@karing4life.com">info@karing4life.com</a>
                <span>
                  <svg className="i i-sm" aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px' }}><use href="#i-clock" /></svg>
                   Reply within one business day
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section" aria-labelledby="ct-help">
      <div className="section-intro">
        <div className="container">
          <div className="section-head reveal">
            <div className="sh-main"><span className="eyebrow">Who's asking?</span><h2 id="ct-help">Help for <span className="serif">every side.</span></h2></div>
          </div>
        </div>
      </div>
      <div className="stage">
        <div className="container">
          <div className="feature-grid">
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-heart" /></svg></span>
              <h3>Families</h3>
              <p>Questions about finding care, how Karing4Life works, or what it costs. (It's free for you, always.)</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/families">For families <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-steth" /></svg></span>
              <h3>Caregivers &amp; nurses</h3>
              <p>Questions about verification, region pricing, or using your trial code.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/caregivers">For caregivers <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
            <div className="feature reveal">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-building" /></svg></span>
              <h3>Agencies &amp; facilities</h3>
              <p>Agency Access pricing, verification, posting jobs and recruiting caregivers in your regions.</p>
              <div className="feature-foot">
                <a className="link-arrow" href="/agencies">For agencies <svg className="i" aria-hidden="true"><use href="#i-arrow" /></svg></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section className="section section-white screen" aria-labelledby="ct-form">
      <div className="container">
        <div className="split">
          <div className="split-l reveal">
            <span className="eyebrow">Write to us</span>
            <h2 id="ct-form">Send a <span className="serif">message.</span></h2>
            <p className="muted" style={{ marginTop: '16px' }}>Prefer email? Use <a href="mailto:info@karing4life.com">info@karing4life.com</a>. Either way, a person reads it.</p>
            <div className="points" style={{ marginTop: '32px' }}>
              <div className="point">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-user-plus" /></svg></span>
                <div>
                  <h3>Looking to join?</h3>
                  <p>Families can <a href="/join?role=family">post a care request</a> right away. Caregivers and agencies can <a href="/join">create a profile</a> in about two minutes.</p>
                </div>
              </div>
              <div className="point">
                <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-sparkle" /></svg></span>
                <div><h3>Press or partnerships?</h3><p>Same address. Mention it in the subject line so it reaches the right person.</p></div>
              </div>
            </div>
          </div>
          <div className="split-r reveal">
            <form className="card card-pad" id="contactForm" noValidate onSubmit={onSubmit}>
              <div className="form-grid">
                <div className="field"><label htmlFor="cName">Your name</label><input className="input" id="cName" name="name" autoComplete="name" required /></div>
                <div className="field">
                  <label htmlFor="cEmail">Email</label>
                  <input className="input" id="cEmail" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="field">
                  <label htmlFor="cRole">I am a…</label>
                  <select className="select" id="cRole">
                    <option>Family member</option>
                    <option>Caregiver or nurse</option>
                    <option>Agency or facility</option>
                    <option>Press or partner</option>
                  </select>
                </div>
                <div className="field"><label htmlFor="cSubject">Subject</label><input className="input" id="cSubject" placeholder="e.g. Using my trial code" /></div>
                <div className="field full"><label htmlFor="cMsg">Message</label><textarea className="textarea" id="cMsg" required placeholder="How can we help?" /></div>
                <div className="full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span className="small muted">We reply within one business day.</span>
                  <button className="btn btn-accent" type="submit"><svg className="i" aria-hidden="true"><use href="#i-send" /></svg>Send message</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
    <CtaBand id="cta-ct" title="We're in" accent="New York too."
      text="Serving Upstate, Downstate and Long Island, from Montauk to Chautauqua."
      tiles={AUDIENCE_TILES} />
    </>
  );
}
