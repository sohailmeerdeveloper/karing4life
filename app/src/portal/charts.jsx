import { useRef, useState } from 'react';

/** Vertical bars with hover tooltips. data: [{ label, value }] */
export function BarChart({ data = [], format = (v) => v, height = 220 }) {
  const [tip, setTip] = useState(null);
  const box = useRef(null);
  const W = 600, H = height, pad = { l: 44, r: 8, t: 12, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = niceMax(max);
  const bw = (W - pad.l - pad.r) / Math.max(1, data.length);
  return (
    <div ref={box} style={{ position: 'relative' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} role="img" aria-label="Bar chart">
        {[0, .25, .5, .75, 1].map((f) => {
          const y = pad.t + (H - pad.t - pad.b) * (1 - f);
          return <g key={f}><line className="gl" x1={pad.l} x2={W - pad.r} y1={y} y2={y} /><text className="ax" x={pad.l - 6} y={y + 4} textAnchor="end">{format(nice * f, true)}</text></g>;
        })}
        {data.map((d, i) => {
          const h = (H - pad.t - pad.b) * (d.value / nice);
          const x = pad.l + i * bw + bw * .18, y = H - pad.b - h;
          return (
            <g key={d.label}>
              <rect className="bar" x={x} y={y} width={bw * .64} height={Math.max(h, d.value ? 2 : 0)} rx="5"
                onMouseEnter={(e) => { const r = box.current.getBoundingClientRect(), b = e.target.getBoundingClientRect(); setTip({ x: b.left - r.left + b.width / 2, y: b.top - r.top, t: `${d.label}: ${format(d.value)}` }); }}
                onMouseLeave={() => setTip(null)} />
              <text className="ax" x={x + bw * .32} y={H - 8} textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {tip && <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>{tip.t}</div>}
    </div>
  );
}

/** Area + line chart. data: [{ label, value }] */
export function LineChart({ data = [], height = 200, format = (v) => (Number.isInteger(v) ? v : Math.round(v * 10) / 10) }) {
  const [hover, setHover] = useState(null);
  const box = useRef(null);
  const W = 600, H = height, pad = { l: 34, r: 10, t: 12, b: 26 };
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join('');
  const area = data.length ? `${line}L${x(data.length - 1)},${H - pad.b}L${x(0)},${H - pad.b}Z` : '';
  const step = Math.ceil(data.length / 6);
  const h = hover != null ? data[hover] : null;
  return (
    <div ref={box} style={{ position: 'relative' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }} role="img" aria-label="Line chart"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (data.length - 1)); setHover(Math.max(0, Math.min(data.length - 1, i))); }}>
        {(max >= 2 ? [0, .5, 1] : [0, 1]).map((f) => <g key={f}><line className="gl" x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} /><text className="ax" x={pad.l - 6} y={y(max * f) + 4} textAnchor="end">{format(max * f, true)}</text></g>)}
        <path className="area" d={area} />
        <path className="line" d={line} vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => i % step === 0 && <text key={i} className="ax" x={x(i)} y={H - 6} textAnchor="middle">{d.label}</text>)}
        {h && <><line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--line-strong)" strokeDasharray="3 3" /><circle className="pt on" cx={x(hover)} cy={y(h.value)} r="5" /></>}
      </svg>
      {h && <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: (y(h.value) / H) * height }}>{h.label}: {format(h.value)}</div>}
    </div>
  );
}

/** Horizontal two-series bars. rows: [{ label, a, b }] */
export function HBars({ rows = [], aLabel, bLabel }) {
  const max = Math.max(1, ...rows.map((r) => r.a + (r.b || 0)));
  return (
    <div className="hbar">
      {rows.map((r) => (
        <div className="hbar-row" key={r.label} data-tip={`${aLabel}: ${r.a}${bLabel ? ` · ${bLabel}: ${r.b}` : ''}`}>
          <span className="hb-l">{r.label}</span>
          <span className="hb-t"><span style={{ width: (r.a / max) * 100 + '%' }} />{bLabel && <span className="b2" style={{ width: (r.b / max) * 100 + '%' }} />}</span>
          <span className="hb-n">{r.a + (r.b || 0)}</span>
        </div>
      ))}
    </div>
  );
}

function niceMax(v) {
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
