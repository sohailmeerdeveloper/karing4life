import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const REDUCED = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useTitle(title) {
  useEffect(() => { if (title) document.title = title; }, [title]);
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

export function store(k, v) {
  try {
    if (v === undefined) return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify(v));
  } catch { return null; }
  return null;
}
