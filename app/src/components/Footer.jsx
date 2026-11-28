import { LogoImg, Icon } from './bits.jsx';
import { toast } from '../lib/toast.jsx';
import { joinWaitlist, markJoined } from '../lib/waitlist.js';

export function Footer() {
  const onSubmit = async (e) => {
    e.preventDefault();
    const i = e.currentTarget.elements.ftEmail;
    if (!i.value || !i.checkValidity()) { i.focus(); toast.error('Enter a valid email'); return; }
    try { await joinWaitlist(i.value); markJoined(); toast('You’re on the list', 'Occasional updates only. Unsubscribe anytime.'); i.value = ''; }
    catch { toast.error('Couldn’t save that', 'Please check your connection and try again.'); }
  };
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a className="footer-logo" href="/" aria-label="Karing4Life home">
                <LogoImg alt="Karing4Life logo" width="56" height="56" />
                <span className="brand-text"><span className="brand-name">Karing<b>4</b>Life</span></span>
              </a>
              <p>Connecting New York families with nurses, caregivers and agencies. Families post what they need, verified caregivers and nurses reply directly, and Karing4Life never takes a cut.</p>
              <div className="footer-serving"><svg className="i" aria-hidden="true"><use href="#i-pin" /></svg>Serving all 16 regions of New York State</div>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h2>Families</h2>
                <ul><li><a href="/families">For families</a></li><li><a href="/join?role=family">Post a care request</a></li><li><a href="/how?aud=families">How it works</a></li><li><a href="/kommunity">Kommunity Korner</a></li></ul>
              </div>
              <div className="footer-col">
                <h2>Caregivers</h2>
                <ul>
                  <li><a href="/caregivers">Caregivers &amp; nurses</a></li>
                  <li><a href="/requests">Care requests</a></li>
                  <li><a href="/membership">Membership</a></li>
                  <li><a href="/join?role=caregiver">Join as a caregiver</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h2>Agencies</h2>
                <ul><li><a href="/agencies">For agencies</a></li><li><a href="/agencies?s=pricing">Agency Access</a></li><li><a href="/join?role=agency">Create a profile</a></li></ul>
              </div>
              <div className="footer-col">
                <h2>Company</h2>
                <ul>
                  <li><a href="/about">About</a></li>
                  <li><a href="/pricing">Pricing</a></li>
                  <li><a href="/faq">FAQ</a></li>
                  <li><a href="/contact">Contact</a></li>
                  <li><a href="/signin">Sign in</a></li>
                  <li><a href="/join">Join Karing4Life</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-signup">
            <div className="fs-text">
              <span className="icon-circle"><svg className="i" aria-hidden="true"><use href="#i-mail" /></svg></span>
              <div><strong>Questions? Talk to a person.</strong><span>info@karing4life.com · reply within one business day</span></div>
            </div>
            <form id="footerForm" noValidate onSubmit={onSubmit}>
              <label className="sr-only" htmlFor="ftEmail">Email for updates</label>
              <input id="ftEmail" type="email" placeholder="Your email for updates" autoComplete="email" />
              <button className="btn" type="submit">Keep me posted</button>
            </form>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <div className="fb-row">
            <span>© 2026 Karing4Life. All rights reserved.</span>
            <div className="fb-links"><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a><a href="/refunds">Refund Policy</a><a href="mailto:info@karing4life.com">info@karing4life.com</a></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
