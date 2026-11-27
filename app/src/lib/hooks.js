import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const REDUCED = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Sets (or with content=null removes) a <meta> tag in <head>. attr is 'name' or 'property'. */
export function setMeta(attr, key, content) {
  let m = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) { m?.remove(); return; }
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
  m.setAttribute('content', content);
}

/** Page title, also used for the share-card title (og:title / twitter:title). */
export function useTitle(title) {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
  }, [title]);
}

/** Query-string params of the current route as a plain object. */
export function useQuery() {
  const { search } = useLocation();
  return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

/** Fades `.reveal` elements in as they scroll into view. Re-scans when the route changes. */
export function useReveal(key) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal:not(.in)'));
    if (REDUCED || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [key]);
}

export function useScrolled(px = 8) {
  const [s, setS] = useState(() => typeof window !== 'undefined' && window.scrollY > px);
  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setS(window.scrollY > px)); };
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [px]);
  return s;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** While `open`: Tab and Shift+Tab stay inside `ref`, Esc calls `onEscape`. On close, focus
    goes back to whatever had it before (e.g. the button that opened the menu). */
export function useFocusTrap(ref, open, onEscape) {
  const esc = useRef(onEscape);
  esc.current = onEscape;
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape' && esc.current) { e.preventDefault(); e.stopPropagation(); esc.current(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const els = Array.from(ref.current.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (!ref.current.contains(document.activeElement)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      // give the closing element a frame to leave the DOM, then put focus back
      requestAnimationFrame(() => { if (before && before.isConnected && before !== document.body) before.focus({ preventScroll: true }); });
    };
  }, [open, ref]);
}

export function store(k, v) {
  try {
    if (v === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(v));
  } catch { return null; }
  return null;
}
