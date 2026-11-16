import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon, LogoImg } from './bits.jsx';
import { useScrolled } from '../lib/hooks.js';

const NAV_OF = { how: 'how', requests: 'caregivers', families: 'families', caregivers: 'caregivers', membership: 'caregivers', agencies: 'agencies', about: 'about', contact: 'contact' };

const MENUS = [
  { key: 'families', label: 'Families', id: 'dd-fam', links: [
    ['/families', 'heart', 'For families', 'Free, always. Find care for someone you love.'],
    ['/join?role=family', 'pen', 'Post a care request', 'About a minute. Caregivers in your region reply.'],
    ['/how?aud=families', 'layers', 'How it works for families', 'Posting rules, messaging and privacy.'],
  ], foot: ['check-circle', '$0 to post · $0 to reply · $0 to message'] },
  { key: 'caregivers', label: 'Caregivers', id: 'dd-cg', links: [
    ['/caregivers', 'steth', 'For caregivers & nurses', 'Your profile, your rates, your schedule.'],
    ['/requests', 'search', 'Browse care requests', 'See what families need, region by region.'],
    ['/membership', 'map', 'Membership & regions', '$8.99 a month per region. Cancel anytime.'],
  ], foot: ['sparkle', '14-day free trial with every region'] },
  { key: 'agencies', label: 'Agencies', id: 'dd-ag', links: [
    ['/agencies', 'building', 'For agencies & facilities', 'Recruit verified caregivers across New York.'],
    ['/agencies?s=pricing', 'tag', 'Agency Access pricing', '$49.99 a month per region.'],
    ['/join?role=agency', 'user-plus', 'Create an agency profile', 'EIN, website and business contact.'],
  ] },
];

function Dropdown({ menu, active, open, setOpen }) {
  const timer = useRef(0);
  const ref = useRef(null);
  const hoverable = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  const show = () => { clearTimeout(timer.current); setOpen(menu.key); };
  const hide = () => setOpen((o) => (o === menu.key ? null : o));
  const onKey = (e) => {
    const links = Array.from(ref.current.querySelectorAll('.dd-link')), idx = links.indexOf(document.activeElement);
    if (e.key === 'Escape') { hide(); ref.current.querySelector('.nav-link').focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); show(); setTimeout(() => (links[idx + 1] || links[0]).focus(), 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (links[idx - 1] || links[links.length - 1])?.focus(); }
  };
  return (
    <div ref={ref} className={'nav-item' + (open ? ' open' : '')} data-dd=""
      onMouseEnter={hoverable ? show : undefined}
      onMouseLeave={hoverable ? () => { timer.current = setTimeout(hide, 160); } : undefined}
      onKeyDown={onKey}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) hide(); }}>
      <button className={'nav-link' + (active ? ' active' : '')} aria-current={active ? 'page' : undefined} aria-expanded={open} aria-haspopup="true" aria-controls={menu.id}
        onClick={(e) => { e.stopPropagation(); open ? hide() : show(); }}>
        {menu.label} <Icon name="chev" />
      </button>
      <div className="dropdown" id={menu.id} role="menu">
        {menu.links.map(([href, ic, t, d]) => (
          <a key={href} className="dd-link" role="menuitem" href={href}>
            <span className="icon-square"><Icon name={ic} /></span>
            <span><span className="dd-title">{t}</span><span className="dd-desc">{d}</span></span>
          </a>
        ))}
        {menu.foot && <div className="dd-foot"><Icon name={menu.foot[0]} />{menu.foot[1]}</div>}
      </div>
    </div>
  );
}

export function Header({ onOpenMenu, menuOpen }) {
  const { pathname } = useLocation();
  const page = pathname.replace(/^\//, '') || 'home';
  const scrolled = useScrolled();
  const [open, setOpen] = useState(null);
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    const close = (e) => { if (!e.target.closest('.nav-item')) setOpen(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  const nav = NAV_OF[page];
  const simple = [['how', 'How it works'], ['about', 'About'], ['contact', 'Contact']];
  return (
    <header className={'site-header' + (scrolled ? ' scrolled' : '')} id="siteHeader">
      <div className="utility">
        <div className="container">
          <div className="u-left">
            <Icon name="pin" />
            <span>Serving all 16 regions of New York State</span>
            <span className="u-sep u-email" aria-hidden="true">·</span>
            <a className="u-email" href="mailto:info@karing4life.com">info@karing4life.com</a>
          </div>
          <div className="u-right">
            <span>Always free for families</span>
            <a href="/membership">Caregivers: 14-day free trial</a>
          </div>
        </div>
      </div>
      <div className="mainbar">
        <div className="container">
          <a className="brand" href="/" aria-label="Karing4Life home">
            <LogoImg width="52" height="52" fetchPriority="high" />
            <span className="brand-text"><span className="brand-name">Karing<b>4</b>Life</span></span>
          </a>
          <nav className="nav" aria-label="Main">
            {MENUS.map((m) => <Dropdown key={m.key} menu={m} active={nav === m.key} open={open === m.key} setOpen={setOpen} />)}
            {simple.map(([k, l]) => (
              <div className="nav-item" key={k}><a className={'nav-link' + (nav === k ? ' active' : '')} aria-current={nav === k ? 'page' : undefined} href={'/' + k}>{l}</a></div>
            ))}
          </nav>
          <div className="header-actions">
            <a className="signin-link" href="/signin"><Icon name="user" />Sign in</a>
            <a className="btn btn-accent btn-sm btn-join" href="/join">Join free</a>
            <a className="btn btn-accent btn-join-m" href="/join">Join free</a>
            <button className="menu-toggle" id="menuOpen" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="mobileMenu" onClick={onOpenMenu}><Icon name="menu" /></button>
          </div>
        </div>
      </div>
    </header>
  );
}

const MM = [
  ['heart', 'Families', [['/families', 'For families'], ['/join?role=family', 'Post a care request']]],
  ['steth', 'Caregivers & nurses', [['/caregivers', 'For caregivers'], ['/requests', 'Browse care requests'], ['/membership', 'Membership & regions']]],
  ['building', 'Agencies & facilities', [['/agencies', 'For agencies'], ['/join?role=agency', 'Create an agency profile']]],
  ['info', 'Karing4Life', [['/how', 'How it works'], ['/about', 'About'], ['/contact', 'Contact']]],
];

export function MobileMenu({ open, onClose }) {
  const { pathname } = useLocation();
  const closeRef = useRef(null);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => closeRef.current?.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose(); };
    const onResize = () => { if (window.innerWidth > 1024 && open) onClose(); };
    document.addEventListener('keydown', onKey); window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open, onClose]);
  return (
    <div className={'mobile-menu' + (open ? ' open' : '')} id="mobileMenu" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="mm-top">
        <a className="brand" href="/" aria-label="Karing4Life home"><LogoImg width="44" height="44" style={{ width: 44, height: 44 }} /><span className="brand-text"><span className="brand-name">Karing<b>4</b>Life</span></span></a>
        <button ref={closeRef} className="menu-toggle" aria-label="Close menu" style={{ display: 'inline-flex' }} onClick={onClose}><Icon name="x" /></button>
      </div>
      <div className="mm-body">
        {MM.map(([ic, label, links]) => (
          <div className="mm-group" key={label}>
            <div className="mm-label"><Icon name={ic} />{label}</div>
            {links.map(([href, l]) => <a key={href} className={'mm-link' + (pathname === href ? ' active' : '')} href={href}>{l} <Icon name="arrow" /></a>)}
          </div>
        ))}
      </div>
      <div className="mm-foot">
        <a className="btn btn-ghost" href="/signin">Sign in</a>
        <a className="btn btn-accent" href="/join">Join free</a>
      </div>
    </div>
  );
}
