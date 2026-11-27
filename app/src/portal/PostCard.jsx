import { Link } from 'react-router-dom';
import { Avatar, Badge, CareTags, PIcon, regionName, schedSummary, shortName, timeAgo, daysLeft } from './ui.jsx';

export function postState(p) {
  if (p.status === 'hidden') return ['Hidden by admin', 'danger', 'eyeOff'];
  if (p.status === 'closed') return ['Closed', 'muted', 'lock'];
  if (p.kind === 'family' && new Date(p.expires_at) < new Date()) return ['Expired', 'muted', 'clock'];
  return ['Open', 'ok', 'checkCircle'];
}

/** One care request / job post. `author` = member info, `to` = link, `children` = footer actions. */
export default function PostCard({ p, author, to, children, showState, replied }) {
  const isAgency = p.kind === 'agency';
  const name = isAgency ? author?.agency?.business_name || author?.full_name : author?.short_name || shortName(author?.full_name);
  const [st, tone, ic] = postState(p);
  const head = (
    <>
      <div className="post-top">
        <div className="flex" style={{ minWidth: 0, alignItems: 'flex-start' }}>
          {author && <Avatar name={name} url={isAgency ? author?.agency?.logo_url : author?.avatar_url} size="sm" square={isAgency} />}
          <div style={{ minWidth: 0 }}>
            <h3>{p.title}</h3>
            <div className="post-meta" style={{ marginTop: 4 }}>
              {author && <span><PIcon name={isAgency ? 'building' : 'heart'} />{name}</span>}
              <span><PIcon name="pin" />{p.town ? `${p.town} · ` : ''}{regionName(p.region_key)}</span>
              <span><PIcon name="clock" />{timeAgo(p.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex" style={{ gap: 6, flex: 'none' }}>
          {replied && <Badge tone="ok" icon="msg">Replied</Badge>}
          <Badge tone={isAgency ? 'sand' : 'line'}>{isAgency ? 'Job' : 'Care request'}</Badge>
          {showState && <Badge tone={tone} icon={ic}>{st}</Badge>}
          {p.flagged && showState && <Badge tone="warn" icon="flag" tip="Edited several times, waiting for a quick review">In review</Badge>}
        </div>
      </div>
      <p className="post-body">{p.body}</p>
      <CareTags keys={p.care_types} max={4} />
      <div className="post-meta">
        {p.recipient && <span><PIcon name="user" />{p.recipient}</span>}
        {p.duration && <span><PIcon name="hourglass" />{p.duration}</span>}
        <span><PIcon name="cal" />{schedSummary(p.schedule)}</span>
        {p.hours_per_week > 0 && <span><PIcon name="clock" />{p.hours_per_week} hrs / wk</span>}
        {p.pay_range && <span><PIcon name="dollar" />{p.pay_range}</span>}
        {p.kind === 'family' && p.status === 'open' && daysLeft(p.expires_at) > 0 && showState && <span><PIcon name="hourglass" />{daysLeft(p.expires_at)} days left</span>}
      </div>
    </>
  );
  return (
    <article className="post-card">
      {to ? <Link to={to} style={{ color: 'inherit', display: 'grid', gap: 12 }}>{head}</Link> : head}
      {children && <div className="post-foot">{children}</div>}
    </article>
  );
}
