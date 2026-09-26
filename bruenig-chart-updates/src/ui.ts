/* Self-contained HTML/CSS + inline-SVG helpers.
 * No JS, no external dependencies — pages are data and citations.
 * Pattern follows workers/planning-bot (a `page()` helper + small builders).
 */

export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
}

/** Recipe/provenance text: escape HTML, then re-link markdown [t](u) and bare URLs. */
export function mdLite(src: string): string {
  let h = esc(src);
  h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  h = h.replace(/(^|[\s(])((?:https?:\/\/)[^\s<)]+)/g, '$1<a href="$2" rel="noopener">$2</a>');
  return h;
}

export function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:62rem;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#1a1a1a}
a{color:#1d4ed8}
.nav{font-size:.9em;color:#555}
.nav a{margin-right:.75em}
h1{margin-bottom:.1em}
.subtitle{color:#555;margin-top:.2em}
table{border-collapse:collapse;width:100%;margin:.75em 0}
td,th{border:1px solid #ddd;padding:.4em .6em;text-align:left;font-size:.92em}
th{background:#f6f6f6}
.badge{font-size:.78em;border-radius:.5em;padding:.12em .55em;white-space:nowrap}
.badge.ok{background:#e7f6ec;color:#166534}
.badge.stale{background:#fef3c7;color:#92400e}
.badge.family{background:#eef2ff;color:#3730a3}
.banner{background:#fef3c7;border:1px solid #f59e0b;border-radius:.4em;padding:.6em .9em;margin:1em 0}
figure.chart{margin:1.25em 0}
figure.chart svg{width:100%;height:auto;display:block;border:1px solid #eee;border-radius:.4em}
.legend{display:flex;flex-wrap:wrap;gap:.4em 1.2em;margin:.4em 0 0;font-size:.88em}
.legend .key{display:inline-flex;align-items:center;gap:.4em}
.legend i{display:inline-block;width:.8em;height:.8em;border-radius:2px}
figcaption{font-size:.82em;color:#666;margin-top:.2em}
.provenance{border:1px solid #d7d7d7;border-left:4px solid #1d4ed8;border-radius:.3em;background:#fafafa;padding:.8em 1.1em;margin-top:1.75em}
.provenance h2{font-size:1.05em;margin:.1em 0 .5em}
.provenance p{margin:.35em 0}
.recipe{white-space:pre-wrap;font-size:.88em;color:#333;border-top:1px dashed #ddd;padding-top:.55em;margin-top:.55em}
.empty{color:#777}
svg text{font-family:system-ui,sans-serif}
</style>
</head><body>${body}</body></html>`;
}

export interface Point {
  x: string;
  y: number;
}
export interface SeriesData {
  id: string;
  label: string;
  unit: string;
  points: Point[];
}

const PALETTE = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2", "#be185d", "#4d7c0f"];

const SVG_W = 720;
const SVG_H = 360;
const ML = 56;
const MR = 16;
const MT = 14;
const MB = 46;
const PW = SVG_W - ML - MR;
const PH = SVG_H - MT - MB;
const TICKS = 5;

function fmt(v: number): string {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const r = v / mag;
  const f = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10;
  return f * mag;
}

/** [lo, hi] rounded to nice bounds; lo is 0 unless data dips negative. */
function yDomain(ys: number[]): [number, number] {
  if (!ys.length) return [0, 1];
  let lo = Math.min(0, ...ys);
  let hi = niceCeil(Math.max(...ys, 0) || 1);
  if (lo < 0) lo = -niceCeil(-lo);
  if (hi <= lo) hi = lo + 1;
  return [lo, hi];
}

/** x position for time-series charts: '2024' → 2024, '1989:Q3' → 1989.5.
 *  Returns null for categorical x like 'USA:2023'. */
function xTime(x: string): number | null {
  const q = /^(\d{4}):Q([1-4])$/.exec(x.trim());
  if (q) return Number(q[1]) + (Number(q[2]) - 1) / 4;
  if (/^-?\d+(\.\d+)?$/.test(x.trim())) return Number(x);
  return null;
}

function yAxis(lo: number, hi: number, unit: string): string {
  const Y = (v: number) => MT + ((hi - v) / (hi - lo)) * PH;
  const step = (hi - lo) / TICKS;
  const pct = unit === "percent" ? "%" : "";
  let out = "";
  for (let i = 0; i <= TICKS; i++) {
    const v = lo + i * step;
    const y = Y(v);
    out += `<line x1="${ML}" y1="${y.toFixed(1)}" x2="${ML + PW}" y2="${y.toFixed(1)}" stroke="${i === 0 && lo === 0 ? "#999" : "#eee"}"/>`;
    out += `<text x="${ML - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#666">${fmt(v)}${pct}</text>`;
  }
  return out;
}

function lineChart(series: SeriesData[], lo: number, hi: number): string {
  const positions = series
    .flatMap((s) => s.points.map((p) => xTime(p.x)))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const xMin = positions[0];
  const xMax = positions[positions.length - 1];
  const X = (v: number) => ML + (xMax === xMin ? PW / 2 : ((v - xMin) / (xMax - xMin)) * PW);
  const Y = (v: number) => MT + ((hi - v) / (hi - lo)) * PH;

  // One label per calendar year, at the year's first plotted point.
  const firstXByYear = new Map<number, number>();
  for (const v of positions) {
    const yr = Math.floor(v);
    if (!firstXByYear.has(yr)) firstXByYear.set(yr, v);
  }
  const years = [...firstXByYear.keys()];
  const stride = Math.max(1, Math.ceil(years.length / 14));
  let xTicks = "";
  for (let i = 0; i < years.length; i++) {
    if (years.length > 1 && i % stride !== 0 && i !== years.length - 1) continue;
    xTicks += `<text x="${X(firstXByYear.get(years[i])!).toFixed(1)}" y="${SVG_H - MB + 18}" text-anchor="middle" font-size="11" fill="#666">${years[i]}</text>`;
  }

  let paths = "";
  series.forEach((s, si) => {
    const color = PALETTE[si % PALETTE.length];
    const pts = s.points
      .map((p) => ({ t: xTime(p.x), y: p.y, raw: p.x }))
      .filter((p): p is { t: number; y: number; raw: string } => p.t !== null)
      .sort((a, b) => a.t - b.t);
    const d = pts.map((p) => `${X(p.t).toFixed(1)},${Y(p.y).toFixed(1)}`).join(" ");
    paths += `<polyline fill="none" stroke="${color}" stroke-width="2" points="${d}"><title>${esc(s.label)}</title></polyline>`;
    for (const p of pts) {
      paths += `<circle cx="${X(p.t).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6" fill="${color}"><title>${esc(s.label)} — ${esc(p.raw)}: ${fmt(p.y)}</title></circle>`;
    }
  });

  return `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" role="img">${yAxis(lo, hi, series[0]?.unit ?? "")}${xTicks}${paths}</svg>`;
}

function barChart(series: SeriesData[], lo: number, hi: number): string {
  const groups: string[] = [];
  for (const s of series) for (const p of s.points) if (!groups.includes(p.x)) groups.push(p.x);
  const Y = (v: number) => MT + ((hi - v) / (hi - lo)) * PH;
  const slot = PW / Math.max(1, groups.length);
  const barW = Math.min(30, (slot * 0.72) / Math.max(1, series.length));
  const y0 = Y(Math.max(0, lo));
  const rotate = groups.length > 8;

  let bars = "";
  groups.forEach((g, gi) => {
    const base = ML + gi * slot + slot / 2 - (barW * series.length) / 2;
    series.forEach((s, si) => {
      const p = s.points.find((pt) => pt.x === g);
      if (!p) return;
      const top = Y(Math.max(0, p.y));
      const h = Math.abs(Y(p.y) - y0);
      const bx = base + si * barW;
      bars += `<rect x="${bx.toFixed(1)}" y="${Math.min(top, y0).toFixed(1)}" width="${(barW - 1.5).toFixed(1)}" height="${h.toFixed(1)}" fill="${PALETTE[si % PALETTE.length]}"><title>${esc(s.label)} — ${esc(g)}: ${fmt(p.y)}</title></rect>`;
    });
    const lx = ML + gi * slot + slot / 2;
    bars += rotate
      ? `<text x="${lx.toFixed(1)}" y="${SVG_H - MB + 14}" text-anchor="end" font-size="11" fill="#666" transform="rotate(-32 ${lx.toFixed(1)} ${SVG_H - MB + 14})">${esc(g)}</text>`
      : `<text x="${lx.toFixed(1)}" y="${SVG_H - MB + 18}" text-anchor="middle" font-size="11" fill="#666">${esc(g)}</text>`;
  });

  return `<svg viewBox="0 0 ${SVG_W} ${SVG_H}" role="img">${yAxis(lo, hi, series[0]?.unit ?? "")}${bars}</svg>`;
}

/** Inline SVG figure: line chart on a time axis (years or 'YYYY:Qn'
 *  quarters), grouped bars for categorical x like 'USA:2023'. */
export function chartFigure(series: SeriesData[]): string {
  const has = series.some((s) => s.points.length > 0);
  if (!has) return `<p class="empty">No data loaded for this chart yet — it populates on the next pipeline run.</p>`;
  const numeric = series.every((s) => s.points.every((p) => xTime(p.x) !== null));
  const [lo, hi] = yDomain(series.flatMap((s) => s.points.map((p) => p.y)));
  const svg = numeric ? lineChart(series, lo, hi) : barChart(series, lo, hi);
  const unit = series[0]?.unit ?? "";
  const legend = `<div class="legend">${series
    .map((s, i) => `<span class="key"><i style="background:${PALETTE[i % PALETTE.length]}"></i>${esc(s.label)}</span>`)
    .join("")}</div>`;
  return `<figure class="chart">${svg}${legend}${unit ? `<figcaption>Unit: ${esc(unit)}</figcaption>` : ""}</figure>`;
}
