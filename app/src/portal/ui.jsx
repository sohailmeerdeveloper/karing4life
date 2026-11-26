import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { PIcon, TrashIcon } from './icons.jsx';
import { DAYS, DAY_FULL, CARE_BY, R } from '../data/data.js';

export { PIcon };

/* ---------------- formatting ---------------- */
export const money = (cents) => '$' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const initials = (n = '') => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
export const shortName = (n = '') => { const [a, b] = n.trim().split(/\s+/); return b ? `${a} ${b[0]}.` : a || 'Member'; };
export const regionName = (k) => R[k]?.name || k || '—';
export const careLabel = (k) => CARE_BY[k]?.short || k;
export function fmtDate(iso, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
  return d.toLocaleDateString('en-US', opts);
}
export function timeAgo(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 45) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  if (s < 604800) return Math.round(s / 86400) + 'd ago';
  return fmtDate(iso, { month: 'short', day: 'numeric' });
}
export const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5));
export const SLOTS = [['days', 'Days', 'sun'], ['evenings', 'Evenings', 'sunset'], ['overnights', 'Overnights', 'moon'], ['livein', 'Live-in', 'home']];
export function schedSummary(s = {}) {
  const parts = SLOTS.filter(([k]) => s[k]?.length).map(([k, l]) => {
    const d = [...s[k]].sort();
    const days = d.length === 7 ? 'every day' : d.length === 5 && !d.includes(0) && !d.includes(6) ? 'weekdays' : d.map((i) => DAYS[i]).join(', ');
    return `${l}: ${days}`;
  });
  return parts.join(' · ') || 'Flexible';
}

/* ---------------- buttons ---------------- */
export function Btn({ variant = 'primary', size, icon, iconRight, loading, block, children, to, href, className = '', ...rest }) {
  const cls = `pb pb-${variant}${size ? ' pb-' + size : ''}${block ? ' pb-block' : ''}${className ? ' ' + className : ''}`;
  const inner = <>{loading ? <span className="spin" aria-hidden="true" /> : icon && <PIcon name={icon} />}{children}{iconRight && <PIcon name={iconRight} />}</>;
  if (to) return <Link className={cls} to={to} {...rest}>{inner}</Link>;
  if (href) return <a className={cls} href={href} {...rest}>{inner}</a>;
  return <button type="button" className={cls} disabled={loading || rest.disabled} {...rest}>{inner}</button>;
}

/** Icon-only button. Always has an aria-label and a hover tooltip. */
export function IconBtn({ icon, label, tone, size, bordered, to, className = '', tipPos, count, children, ...rest }) {
  const cls = `ib${size ? ' ib-' + size : ''}${tone ? ' tone-' + tone : ''}${bordered ? ' bordered' : ''} ib-${icon}${className ? ' ' + className : ''}`;
  const body = <>{icon === 'trash' ? <TrashIcon /> : <PIcon name={icon} />}{count > 0 && <span className="ib-dot">{count > 99 ? '99+' : count}</span>}{children}</>;
  const common = { className: cls, 'aria-label': label, 'data-tip': label, 'data-tip-pos': tipPos };
  if (to) return <Link to={to} {...common} {...rest}>{body}</Link>;
  return <button type="button" {...common} {...rest}>{body}</button>;
}
export const TrashBtn = ({ label = 'Delete', ...p }) => <IconBtn icon="trash" tone="danger" label={label} className="ib-trash" {...p} />;

export function Info({ tip, pos }) {
  return <span className="info-dot" tabIndex={0} role="img" aria-label={tip} data-tip={tip} data-tip-wide="" data-tip-pos={pos}><PIcon name="info" /></span>;
}

/* ---------------- layout bits ---------------- */
export function PageHead({ title, sub, help, actions, back, badge }) {
  return (
    <>
      {back && <Link className="back-link" to={back[0]}><PIcon name="arrowL" />{back[1]}</Link>}
      <div className="ph">
        <div className="ph-t">
          <h1>{title}{badge}{help && <Info tip={help} />}</h1>
          {sub && <p>{sub}</p>}
        </div>
        {actions && <div className="ph-actions">{actions}</div>}
      </div>
    </>
  );
}

export function Card({ title, icon, action, children, className = '', flush, ...rest }) {
  return (
    <section className={'card' + (flush ? ' card-flush' : '') + (className ? ' ' + className : '')} {...rest}>
      {(title || action) && (
        <div className="card-h" style={flush ? { padding: '18px 20px 0', marginBottom: 12 } : undefined}>
          <h2>{icon && <PIcon name={icon} />}{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ icon, label, value, hint, tone, to, tip }) {
  const body = (
    <>
      <div className="stat-top">
        <span className="stat-ic"><PIcon name={icon} /></span>
        {to ? <PIcon name="arrowR" className="stat-go pi-sm" /> : tip ? <Info tip={tip} /> : null}
      </div>
      <div className="stat-v">{value}</div>
      <div><div className="stat-l">{label}</div>{hint && <div className="stat-hint">{hint}</div>}</div>
    </>
  );
  const cls = 'stat' + (tone ? ' t-' + tone : '');
  return to ? <Link to={to} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Empty({ icon = 'inbox', title, body, action }) {
  return (
    <div className="empty">
      <span className="e-ic"><PIcon name={icon} /></span>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

export function Badge({ tone, icon, children, tip }) {
  return <span className={'pbadge' + (tone ? ' t-' + tone : '')} data-tip={tip}>{icon && <PIcon name={icon} />}{children}</span>;
}

export function Verified({ status, compact }) {
  if (status === 'verified') return <span className="vbadge" data-tip="ID and credentials checked by our team"><PIcon name="badge" />{compact ? '' : 'Verified'}</span>;
  if (status === 'pending') return <Badge tone="warn" icon="hourglass" tip="Documents are being reviewed">In review</Badge>;
  return null;
}

export function Avail({ v }) {
  return v === 'fillin'
    ? <span className="pbadge t-sand" data-tip="Open to shifts or a few days, not regular work"><span className="dot-s fill" />Fill-in</span>
    : <span className="pbadge t-ok" data-tip="Open for regular work"><span className="dot-s" />Available</span>;
}

export function Avatar({ name, url, size, square }) {
  const c = 'c' + ((name || '').length % 4 + 1);
  return (
    <span className={`pav ${c}${size ? ' pav-' + size : ''}${square ? ' sq' : ''}`} aria-hidden="true">
      {url ? <img src={url} alt="" loading="lazy" /> : initials(name)}
    </span>
  );
}

export function Loading() { return <div className="p-loading" role="status" aria-label="Loading"><span className="ring" /></div>; }
export function Skel({ h = 80, n = 3 }) { return <div className="stack-sm">{Array.from({ length: n }, (_, i) => <div key={i} className="skel" style={{ height: h }} />)}</div>; }

export function Notice({ tone, icon = 'info', children, action }) {
  return <div className={'notice' + (tone ? ' ' + tone : '')}><PIcon name={icon} /><div>{children}</div>{action && <div className="n-act">{action}</div>}</div>;
}

export function Progress({ value, max, tone }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div className={'progress' + (tone ? ' ' + tone : '')} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><span style={{ width: pct + '%' }} /></div>;
}

/* ---------------- tabs ---------------- */
export function Seg({ tabs, value, onChange, label = 'Filter' }) {
  return (
    <div className="seg" role="tablist" aria-label={label}>
      {tabs.map(([k, l, n]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}>{l}{n != null && <span className="n">{n}</span>}</button>
      ))}
    </div>
  );
}

/* ---------------- form fields ---------------- */
export function Field({ label, hint, error, optional, children, id, tip }) {
  const gen = useId();
  const fid = id || gen;
  const child = typeof children === 'function' ? children(fid) : children;
  return (
    <div className="pfield">
      {label && <label htmlFor={fid}>{label}{optional && <span className="opt">(optional)</span>}{tip && <Info tip={tip} />}</label>}
      {child}
      {error ? <div className="ph-err" role="alert">{error}</div> : hint && <div className="ph-hint"><PIcon name="info" />{hint}</div>}
    </div>
  );
}

export function Chips({ options, value = [], onChange, multi = true, label }) {
  const toggle = (k) => {
    if (!multi) return onChange(value === k ? '' : k);
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  };
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([k, l, ic]) => {
        const on = multi ? value.includes(k) : value === k;
        return (
          <button type="button" key={k} className="chip-b" aria-pressed={on} onClick={() => toggle(k)}>
            <PIcon name="check" className="ck-ic" />{ic && !on && <PIcon name={ic} />}{l}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="tr" aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}

/** Days / Evenings / Overnights / Live-in, each opens the 7 weekdays (as the client's brief asks). */
export function SchedulePicker({ value = {}, onChange }) {
  const [open, setOpen] = useState(() => SLOTS.find(([k]) => value[k]?.length)?.[0] || 'days');
  const set = (slot, days) => {
    const next = { ...value, [slot]: days };
    if (!days.length) delete next[slot];
    onChange(next);
  };
  return (
    <div className="sched">
      {SLOTS.map(([k, l, ic]) => {
        const days = value[k] || [];
        return (
          <div key={k} className={'sched-slot' + (days.length ? ' on' : '') + (open === k ? ' open' : '')}>
            <button type="button" className="sched-head" aria-expanded={open === k} onClick={() => setOpen(open === k ? null : k)}>
              <span className="si"><PIcon name={ic === 'home' ? 'bed' : ic} /></span>{l}
              <span className="sum">{days.length ? (days.length === 7 ? 'Every day' : [...days].sort().map((d) => DAYS[d]).join(', ')) : 'Not needed'}</span>
              <PIcon name="chevD" className="chev" />
            </button>
            {open === k && (<>
              <div className="sched-days" role="group" aria-label={l + ' days'}>
                {DAYS.map((d, i) => (
                  <button type="button" key={d} className="day-b" aria-pressed={days.includes(i)} aria-label={DAY_FULL[i]}
                    onClick={() => set(k, days.includes(i) ? days.filter((x) => x !== i) : [...days, i])}>{d}</button>
                ))}
              </div>
              <div className="sched-quick">
                <button type="button" onClick={() => set(k, [1, 2, 3, 4, 5])}>Weekdays</button>
                <button type="button" onClick={() => set(k, [0, 6])}>Weekends</button>
                <button type="button" onClick={() => set(k, [0, 1, 2, 3, 4, 5, 6])}>Every day</button>
                {days.length > 0 && <button type="button" onClick={() => set(k, [])}>Clear</button>}
              </div>
            </>)}
          </div>
        );
      })}
    </div>
  );
}

export function ScheduleView({ value = {} }) {
  const rows = SLOTS.filter(([k]) => value[k]?.length);
  if (!rows.length) return <p className="muted small">Flexible schedule</p>;
  return (
    <div className="sched-view">
      {rows.map(([k, l, ic]) => (
        <div className="sched-line" key={k}>
          <span className="sl-l"><PIcon name={ic === 'home' ? 'bed' : ic} className="pi-sm" />{l}</span>
          {DAYS.map((d, i) => <span key={d} className={'sl-d' + (value[k].includes(i) ? ' on' : '')} title={DAY_FULL[i]}>{d[0]}</span>)}
        </div>
      ))}
    </div>
  );
}

export function CareTags({ keys = [], max = 99 }) {
  const shown = keys.slice(0, max);
  return <div className="tags">{shown.map((k) => <span key={k} className="tag-s">{careLabel(k)}</span>)}{keys.length > max && <span className="tag-s">+{keys.length - max}</span>}</div>;
}

/* ---------------- modal + confirm ---------------- */
export function Modal({ open, onClose, title, icon, children, footer, size }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => (ref.current?.querySelector('[autofocus], input, textarea, select') || ref.current)?.focus({ preventScroll: true }), 40);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); }
      if (e.key === 'Tab' && ref.current) {
        const els = ref.current.querySelectorAll('button:not(:disabled), input, textarea, select, a[href]');
        if (!els.length) return;
        const f = els[0], l = els[els.length - 1];
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.({ preventScroll: true }); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return createPortal(
    <div className="pm-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={ref} className={'pm' + (size ? ' ' + size : '')} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} tabIndex={-1}>
        {title && <div className="pm-h"><h2>{icon && <PIcon name={icon} />}{title}</h2><IconBtn icon="x" label="Close" size="sm" className="ib-close" onClick={onClose} /></div>}
        <div className="pm-b">{children}</div>
        {footer && <div className="pm-f">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

let confirmSet = null;
/** await confirm({ title, body, confirm: 'Delete', tone: 'danger' }) → true/false */
export function confirm(opts) { return new Promise((res) => confirmSet?.({ ...opts, res })); }
export function ConfirmHost() {
  const [c, setC] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { confirmSet = setC; return () => { confirmSet = null; }; }, []);
  const done = (v) => { c?.res(v); setC(null); setBusy(false); };
  const tone = c?.tone || 'danger';
  return (
    <Modal open={!!c} onClose={() => done(false)} size="sm"
      footer={<>
        <Btn variant="ghost" onClick={() => done(false)}>{c?.cancel || 'Cancel'}</Btn>
        <Btn variant={tone === 'danger' ? 'danger' : tone === 'ok' ? 'success' : 'primary'} icon={c?.icon || (tone === 'danger' ? undefined : 'check')} loading={busy} autoFocus onClick={() => { setBusy(true); done(true); }}>{c?.confirm || 'Confirm'}</Btn>
      </>}>
      {c && (<>
        <div className={'confirm-ic' + (tone === 'ok' ? ' ok' : tone === 'info' ? ' info' : '')}>{tone === 'danger' ? <TrashIcon /> : <PIcon name={c.icon || 'info'} />}</div>
        <h3 className="confirm-t">{c.title}</h3>
        {c.body && <p className="confirm-s">{c.body}</p>}
      </>)}
    </Modal>
  );
}

/* ---------------- file drop ---------------- */
export function FileDrop({ accept, onFile, label = 'Upload a file', sub = 'PNG, JPG or PDF, up to 10 MB', busy }) {
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const pick = (f) => { if (f) onFile(f); };
  return (
    <div className={'drop' + (over ? ' over' : '')} role="button" tabIndex={0}
      onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}>
      {busy ? <span className="spin" style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--olive)', borderRightColor: 'transparent', animation: 'spin .7s linear infinite' }} /> : <PIcon name="upload" />}
      <strong>{busy ? 'Uploading…' : label}</strong>
      <span className="small">{sub}</span>
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}
