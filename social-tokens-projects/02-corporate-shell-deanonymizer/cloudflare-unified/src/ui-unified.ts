// Unified landing UI: one site to browse every city/area for
// bad landlords, wage theft, and dual offenders. Tabs call the
// /api/* endpoints; the three legacy UIs live on at
// /housing, /labor, and /crossover.
export function renderUnifiedUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>US Housing & Labor Registry — Bad Landlords, Wage Theft, Dual Offenders</title>
  <style>
    :root { --bg: #0b1220; --card: #111c33; --border: #22345c; --text: #e6edf7; --dim: #93a4c4; --accent: #38bdf8; --green: #34d399; --red: #f87171; --amber: #fbbf24; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, system-ui, sans-serif; }
    header { padding: 28px 20px 10px; max-width: 1100px; margin: 0 auto; }
    header h1 { margin: 0 0 6px; font-size: 1.6rem; }
    header p { margin: 0; color: var(--dim); }
    nav.legacy { max-width: 1100px; margin: 10px auto 0; padding: 0 20px; font-size: 0.85rem; color: var(--dim); }
    nav.legacy a { color: var(--accent); margin-right: 14px; }
    .stats { max-width: 1100px; margin: 14px auto; padding: 0 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
    .stat { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
    .stat b { display: block; font-size: 1.3rem; }
    .stat span { color: var(--dim); font-size: 0.75rem; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 10px 20px 40px; }
    .tabs { display: flex; gap: 8px; margin: 14px 0; flex-wrap: wrap; }
    .tabs button { background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 10px 16px; cursor: pointer; font-weight: 700; }
    .tabs button.active { background: var(--accent); color: #06121f; border-color: var(--accent); }
    .controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .controls input, .controls select { background: #0e1830; color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
    .controls input { flex: 2; min-width: 200px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 10px; }
    .card h3 { margin: 0 0 6px; font-size: 1rem; }
    .meta { color: var(--dim); font-size: 0.82rem; }
    .badge { display: inline-block; font-size: 0.7rem; font-weight: 800; border-radius: 6px; padding: 2px 8px; margin-right: 6px; }
    .b-red { background: rgba(248,113,113,.15); color: var(--red); border: 1px solid rgba(248,113,113,.4); }
    .b-green { background: rgba(52,211,153,.12); color: var(--green); border: 1px solid rgba(52,211,153,.4); }
    .b-amber { background: rgba(251,191,36,.12); color: var(--amber); border: 1px solid rgba(251,191,36,.4); }
    .loading { color: var(--dim); padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <header>
    <h1>🏘️⚖️ US Housing & Labor Registry</h1>
    <p>Browse every city/area for bad landlords, wage theft, and landlords who do both. Data: D1 <code>social-housing-db</code> + R2 <code>landlord-directory-data</code>.</p>
  </header>
  <nav class="legacy">Full apps: <a href="/housing">Housing registry</a><a href="/labor">Wage theft registry</a><a href="/crossover">Crossover matrix</a></nav>
  <div class="stats" id="statBar"><div class="stat"><b>…</b><span>loading</span></div></div>
  <div class="wrap">
    <div class="tabs">
      <button data-tab="landlords" class="active">🏚️ Bad landlords</button>
      <button data-tab="wage">💸 Wage theft</button>
      <button data-tab="dual">🚨 Dual offenders</button>
      <button data-tab="cities">🌆 Cities / areas</button>
    </div>
    <div class="controls">
      <input id="q" placeholder="Search name, street, email, LLC, or case…">
      <input id="city" placeholder="City / area filter (e.g. Minneapolis)" style="flex:1;min-width:160px">
      <button id="go" class="tabs active" style="border:none;background:var(--accent);color:#06121f;border-radius:8px;padding:10px 18px;font-weight:800;cursor:pointer">Search</button>
    </div>
    <div id="results"><div class="loading">Pick a tab and search — or browse cities/areas.</div></div>
  </div>
  <script>
    let tab = 'landlords';
    const $ = (id) => document.getElementById(id);
    document.querySelectorAll('.tabs button[data-tab]').forEach(b => b.onclick = () => {
      document.querySelectorAll('.tabs button[data-tab]').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); tab = b.dataset.tab; run();
    });
    $('go').onclick = run;
    $('q').onkeypress = (e) => { if (e.key === 'Enter') run(); };
    $('city').onkeypress = (e) => { if (e.key === 'Enter') run(); };

    async function loadStats() {
      try {
        const r = await fetch('/api/stats'); const d = await r.json();
        const h = d.housing || {}, l = d.labor || {}, c = d.crossover || {};
        $('statBar').innerHTML =
          stat(h.total, 'rental licenses') + stat(h.units_total, 'units tracked') +
          stat(h.jurisdictions, 'jurisdictions') + stat(l.total_cases, 'wage theft cases') +
          stat(l.total_recovered, 'stolen wages recovered $', 1) + stat(c.syndicates_count, 'dual offenders');
      } catch (e) { $('statBar').innerHTML = '<div class="stat"><b>—</b><span>stats unavailable</span></div>'; }
    }
    function stat(v, label, money) {
      const n = v == null ? '—' : (money ? '$' + Number(v).toLocaleString(undefined, {maximumFractionDigits: 0}) : Number(v).toLocaleString());
      return '<div class="stat"><b>' + n + '</b><span>' + label + '</span></div>';
    }

    async function run() {
      const q = $('q').value.trim(), city = $('city').value.trim();
      const box = $('results'); box.innerHTML = '<div class="loading">Loading…</div>';
      try {
        if (tab === 'cities') return renderCities(box);
        if (tab === 'landlords') {
          if (!q && !city) { box.innerHTML = '<div class="loading">Enter a name, street, or city — or open the Cities tab.</div>'; return; }
          const r = await fetch('/api/landlords?q=' + encodeURIComponent(q) + '&city=' + encodeURIComponent(city));
          const d = await r.json();
          box.innerHTML = '<div class="meta">Found <b>' + (d.results || []).length + '</b> properties' +
            ((d.results || []).some(x => x.wage_theft_match) ? ' — <span class="badge b-red">has wage-theft match</span> flags a dual offender' : '') + '</div><br>' +
            (d.results || []).map(cardLandlord).join('') || '<div class="loading">No matches.</div>';
        } else if (tab === 'wage') {
          const r = await fetch('/api/wage-theft?q=' + encodeURIComponent(q) + '&city=' + encodeURIComponent(city));
          const d = await r.json();
          box.innerHTML = '<div class="meta">Found <b>' + (d.cases || []).length + '</b> enforcement cases</div><br>' +
            (d.cases || []).map(cardCase).join('') || '<div class="loading">No matches.</div>';
        } else {
          const r = await fetch('/api/crossover?q=' + encodeURIComponent(q) + '&city=' + encodeURIComponent(city));
          const d = await r.json();
          const live = (d.live_matches || []).map(cardDualLive).join('');
          const curated = (d.curated || []).map(cardDualCurated).join('');
          box.innerHTML = '<div class="meta"><b>' + (d.live_matches || []).length + '</b> live D1 dual matches + <b>' +
            (d.curated || []).length + '</b> curated dossier entries</div><br>' + live + curated || '<div class="loading">No matches.</div>';
        }
      } catch (e) { box.innerHTML = '<div class="loading">Error: ' + e.message + '</div>'; }
    }

    async function renderCities(box) {
      const r = await fetch('/api/cities'); const d = await r.json();
      const byState = (rows) => {
        const g = {};
        (rows || []).forEach(c => { const s = c.state || '—'; (g[s] = g[s] || []).push(c); });
        return Object.keys(g).sort().map(s =>
          '<h4 style="margin:16px 0 8px;color:var(--dim)">📍 ' + esc(s) + ' (' + g[s].length + ')</h4>' +
          g[s].map(card).join('')).join('');
        function card(c) {
          const isLabor = c.case_count != null;
          return '<div class="card"><h3>' + esc(c.city) +
            (c.county ? ' <span class="meta">' + esc(c.county) + '</span>' : '') + '</h3>' +
            (isLabor
              ? '<div class="meta">' + (c.case_count || 0) + ' wage theft cases · $' + Number(c.total_back_wages || 0).toLocaleString() + ' back wages ' +
                '<a href="#" onclick="jump(\\'' + esc(c.city) + '\\', true);return false">browse cases →</a></div>'
              : '<div class="meta">' + (c.license_count || 0).toLocaleString() + ' licenses · ' + (c.total_units || 0).toLocaleString() + ' units ' +
                '<a href="#" onclick="jump(\\'' + esc(c.city) + '\\');return false">browse landlords →</a></div>') + '</div>';
        }
      };
      box.innerHTML = '<h3>🏘️ Housing coverage (' + (d.housing_cities || []).length + ' areas)</h3>' + byState(d.housing_cities) +
        '<h3>⚖️ Labor coverage (' + (d.labor_cities || []).length + ' areas)</h3>' + byState(d.labor_cities);
    }
    function jump(city, wage) { $('city').value = city; tab = wage ? 'wage' : 'landlords';
      document.querySelectorAll('.tabs button[data-tab]').forEach(x => x.classList.toggle('active', x.dataset.tab === tab)); run(); }

    function cardLandlord(x) {
      return '<div class="card"><h3>' + esc(x.address) + ' <span class="meta">' + esc(x.city) + ', ' + esc(x.state) + '</span></h3>' +
        '<div>' + (x.wage_theft_match ? '<span class="badge b-red">DUAL OFFENDER — wage theft on file</span>' : '') +
        ((x.severity_class === 'C' || (x.tier || '').includes('3')) ? '<span class="badge b-red">TIER 3 / CLASS C</span>' : '<span class="badge b-green">' + esc(x.tier || x.severity_class || 'licensed') + '</span>') +
        '<span class="badge b-amber">' + (x.units || 1) + ' units</span></div>' +
        '<div class="meta">Owner: ' + esc(x.owner_name) + ' · Contact: ' + esc(x.applicant_name || '—') + ' (' + esc(x.applicant_email || 'no email') + ')' +
        (x.open_violations ? ' · ' + x.open_violations + ' open violations' : '') +
        (x.sister_properties_count > 1 ? ' · ' + x.sister_properties_count + ' sister properties' : '') + '</div></div>';
    }
    function cardCase(c) {
      const total = (parseFloat(c.back_wages_recovered || 0) + parseFloat(c.civil_penalties_assessed || 0)).toLocaleString();
      return '<div class="card"><h3>' + esc(c.respondent_legal_name) + ' <span class="meta">d/b/a ' + esc(c.trade_name || '—') + '</span></h3>' +
        '<div>' + (c.provenance_type === 'VERIFIED_PUBLIC_ACTION' ? '<span class="badge b-green">VERIFIED</span>' : '<span class="badge b-amber">SEED / PENDING FOIA</span>') +
        (c.repeat_violator ? '<span class="badge b-red">REPEAT OFFENDER</span>' : '') + '</div>' +
        '<div class="meta">' + esc(c.case_id || '') + ' · ' + esc(c.source_agency || '') + ' · ' + esc(c.city || '') + ', ' + esc(c.state || '') +
        ' · $' + total + ' · ' + (c.workers_affected || 0) + ' workers' +
        (c.case_id ? ' · <a href="/docs/' + encodeURIComponent(c.case_id) + '.pdf" target="_blank">case doc ↗</a>' : '') + '</div></div>';
    }
    function cardDualLive(x) {
      return '<div class="card"><h3>' + esc(x.landlord_name) + ' <span class="meta">' + esc(x.landlord_city || '') + '</span></h3>' +
        '<div><span class="badge b-red">LIVE DUAL MATCH</span><span class="badge b-amber">' + (x.properties_count || 0) + ' properties · ' + (x.total_units || 0) + ' units</span></div>' +
        '<div class="meta">Case ' + esc(x.case_id || '') + ' (' + esc(x.source_agency || '') + ') · ' + esc(x.violation_type || '') +
        ' · $' + Number(x.back_wages_recovered || 0).toLocaleString() + ' · ' + (x.workers_affected || 0) + ' workers' +
        (x.case_id ? ' · <a href="/docs/' + encodeURIComponent(x.case_id) + '.pdf" target="_blank">case doc ↗</a>' : '') + '</div></div>';
    }
    function evLink(excerptFile, pages, docTitle, label) {
      const txt = esc(label || docTitle || 'source doc') + (pages ? ' ' + esc(pages) : '') + ' ↗';
      if (excerptFile) return '<a href="/docs/' + encodeURIComponent(excerptFile) + '" target="_blank">' + txt + '</a>';
      return '';
    }
    function cardDualCurated(s) {
      const labor = evLink(s.source_excerpt_file || (s.case_id ? s.case_id + '.pdf' : ''), s.source_pages, s.source_doc_title);
      const housing = s.housing_source_excerpt_file && s.housing_source_excerpt_file !== s.source_excerpt_file
        ? evLink(s.housing_source_excerpt_file, s.housing_source_pages, s.housing_source_doc_title, 'housing source')
        : '';
      const full = s.source_full_file && s.source_full_file !== s.source_excerpt_file
        ? evLink(s.source_full_file, '', 'full source report')
        : '';
      const ev = [labor, housing, full].filter(Boolean).length
        ? '📄 ' + [labor, housing, full].filter(Boolean).join(' · 📄 ')
        : '';
      return '<div class="card"><h3>' + esc(s.entity_name) + '</h3>' +
        '<div><span class="badge b-red">' + esc(s.risk_tier) + '</span><span class="badge b-amber">score ' + s.composite_score + '/100</span></div>' +
        '<div class="meta">' + esc(s.city) + ' · ' + s.properties_count + ' properties · ' + s.total_units + ' units · $' +
        Number(s.total_wage_theft_recovered || 0).toLocaleString() + ' recovered · ' + s.workers_affected + ' workers' +
        (ev ? '<br>' + ev : '') + '</div></div>';
    }
    function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    loadStats();
  </script>
</body>
</html>`;
}
