export const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Roseville STR Feasibility — Ch. 907/908/909 engine</title>
<style>
  :root{
    --ink:#17202a; --paper:#f4f1ea; --card:#fffdf8; --line:#d8d2c4;
    --good:#1a7f4b; --bad:#b23a3a; --warn:#a06a00; --accent:#23486b;
    --mono:ui-monospace,"Cascadia Mono",Consolas,monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);
    font:15px/1.45 ui-sans-serif,system-ui,"Segoe UI",sans-serif}
  header{border-bottom:2px solid var(--ink);padding:14px 22px;display:flex;
    align-items:baseline;gap:14px;flex-wrap:wrap;background:var(--card)}
  header h1{font-size:18px;margin:0;letter-spacing:.02em}
  header .tag{font:12px var(--mono);color:var(--accent)}
  main{max-width:1080px;margin:0 auto;padding:20px 22px 60px}
  .panel{background:var(--card);border:1px solid var(--line);padding:16px;margin-bottom:16px}
  .panel h2{font:11px var(--mono);text-transform:uppercase;letter-spacing:.14em;
    color:#6b6252;margin:0 0 12px}
  form{display:grid;grid-template-columns:2.2fr 1fr 1fr 1.3fr auto;gap:10px;align-items:end}
  label{font:11px var(--mono);text-transform:uppercase;letter-spacing:.08em;color:#6b6252;display:block;margin-bottom:4px}
  input,select{width:100%;padding:8px 10px;border:1px solid var(--line);background:#fff;
    font:14px/1.2 inherit;border-radius:2px}
  button{padding:9px 18px;background:var(--ink);color:var(--paper);border:0;
    font:600 14px inherit;border-radius:2px;cursor:pointer;white-space:nowrap}
  button:disabled{opacity:.5;cursor:wait}
  .verdict{border-left:6px solid var(--accent);padding:14px 16px}
  .verdict .code{font:12px var(--mono);letter-spacing:.1em}
  .verdict .head{font-size:17px;font-weight:600;margin-top:4px}
  .v-ok{border-color:var(--good)} .v-ok .code{color:var(--good)}
  .v-bad{border-color:var(--bad)} .v-bad .code{color:var(--bad)}
  .v-warn{border-color:var(--warn)} .v-warn .code{color:var(--warn)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  @media(max-width:900px){form,.grid2{grid-template-columns:1fr 1fr}form{grid-template-columns:1fr 1fr}}
  @media(max-width:640px){form,.grid2{grid-template-columns:1fr}}
  dl{display:grid;grid-template-columns:auto 1fr;gap:4px 18px;margin:0;font-size:14px}
  dt{font:11px var(--mono);text-transform:uppercase;color:#6b6252;align-self:center}
  dd{margin:0;font-variant-numeric:tabular-nums}
  table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}
  th{font:11px var(--mono);text-transform:uppercase;letter-spacing:.08em;color:#6b6252;
    text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}
  td{padding:7px 8px;border-bottom:1px solid #ece7db;vertical-align:top}
  td.r,th.r{text-align:right}
  ul{margin:0;padding-left:18px} li{margin-bottom:6px;font-size:14px}
  .flag{background:#fbf3e2;border:1px solid #e4d5ac;padding:10px 12px;margin-bottom:8px;
    font-size:13.5px;border-radius:2px}
  .narr{white-space:pre-wrap;font-size:14.5px;background:#f6f9fc;border:1px solid #cfdeed;
    padding:14px 16px;border-radius:2px}
  .narr .src{font:11px var(--mono);color:var(--accent);display:block;margin-top:10px}
  .err{background:#fdecec;border:1px solid #e5b0b0;color:#7c2020;padding:12px 14px}
  .muted{color:#6b6252;font-size:12.5px}
  .pill{display:inline-block;font:11px var(--mono);padding:1px 7px;border:1px solid var(--line);
    border-radius:10px;background:#fff;margin-left:6px}
  #cands button{display:block;width:100%;text-align:left;background:#fff;color:var(--ink);
    border:1px solid var(--line);padding:7px 10px;margin-top:5px;font-weight:400}
  #cands button:hover{background:#eef3f8}
  footer{font:11.5px var(--mono);color:#8a8272;margin-top:24px;line-height:1.7}
  a{color:var(--accent)}
</style>
</head>
<body>
<header>
  <h1>Roseville Rental Feasibility</h1>
  <span class="tag">Roseville, MN · City Code Ch. 907 / 908 / 909 · Ramsey County open data</span>
</header>
<main>
  <div class="panel">
    <h2>Property &amp; pro-forma assumptions</h2>
    <form id="f">
      <div><label for="addr">Street address</label>
        <input id="addr" name="address" required placeholder="2080 Fry St" autocomplete="off"></div>
      <div><label for="adr">Nightly rate $</label>
        <input id="adr" name="adr" type="number" min="30" max="2000" value="185"></div>
      <div><label for="stay">Avg stay (nights)</label>
        <input id="stay" name="stay" type="number" min="1" max="30" value="3"></div>
      <div><label for="oo">Owner-occupied</label>
        <select id="oo" name="ownerOccupied">
          <option value="auto">auto (homestead)</option>
          <option value="yes">yes</option>
          <option value="no">no</option>
        </select></div>
      <div><button id="go" type="submit">Run feasibility</button></div>
    </form>
    <div id="cands"></div>
  </div>

  <div id="out"></div>

  <footer>
    Deterministic engine: Roseville City Code Ch. 909 (Ord. 1657, eff. 2024-02-12), Ch. 907, Ch. 908,
    Ch. 312 lodging tax (3%), Fee Schedule §314.05. Parcel data: Ramsey County Open Data FeatureServer (layer 12).
    Not legal advice — verify the 500-ft spacing rule and current fees with Community Development (651-792-7013).
  </footer>
</main>
<script>
const f = document.getElementById('f'), out = document.getElementById('out'),
      go = document.getElementById('go'), cands = document.getElementById('cands');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const usd = n => '$' + Math.round(n).toLocaleString();

function vClass(v){
  if (v === 'STR_LICENSED_PATH' || v === 'STR_EXEMPT_OWNER_OCCUPIED') return 'v-ok';
  if (v === 'MIDTERM_907_PATH') return 'v-warn';
  return 'v-bad';
}

function render(d){
  if (d.error){ out.innerHTML = '<div class="panel err"><b>'+esc(d.error)+'</b>'+
    (d.candidates ? '<div id="candlist"></div>' : '') + '</div>';
    if (d.candidates){
      document.getElementById('candlist').innerHTML = d.candidates.map(c =>
        '<button data-a="'+esc(c.address)+'">'+esc(c.address)+' <span class="muted">score '+Math.round(c.score)+'</span></button>').join('');
      document.querySelectorAll('#candlist button').forEach(b => b.onclick = () => {
        document.getElementById('addr').value = b.dataset.a; f.requestSubmit(); });
    }
    return;
  }
  const p = d.parcel || {}, r = d.engine, a = r.annual;
  const rows = r.seasons.map(m => '<tr><td>'+m.season+'</td><td class="r">'+m.windowDays+'</td>'+
    '<td class="r">1 per '+m.minStartSpacingDays+'d</td><td class="r">'+m.maxBookings+'</td>'+
    '<td class="r">'+m.sellableNights+'</td><td class="r">'+m.optimalStayNights+'n → '+m.optimalNights+'</td></tr>').join('');
  const lic = r.licensing.map(l => '<tr><td>Ch. '+l.chapter+'</td><td>'+esc(l.name)+'</td>'+
    '<td>'+esc(l.trigger)+'</td><td class="r">'+(l.annualFeeUsd==null?'—':usd(l.annualFeeUsd))+'</td>'+
    '<td class="muted">'+esc(l.notes)+'</td></tr>').join('');
  const comp = r.compliance.map(c => '<li>'+esc(c)+'</li>').join('');
  const flags = r.flags.map(x => '<div class="flag">'+esc(x)+'</div>').join('');

  out.innerHTML =
  '<div class="panel verdict '+vClass(r.verdict)+'"><div class="code">'+r.verdict+
    (r.exemption?'<span class="pill">909.08 exemption</span>':'')+'</div>'+
    '<div class="head">'+esc(r.headline)+'</div></div>'+

  '<div class="grid2">'+
  '<div class="panel"><h2>Parcel — Ramsey County</h2><dl>'+
    '<dt>Address</dt><dd>'+esc(p.siteAddress)+', '+esc(p.siteCity)+'</dd>'+
    '<dt>PIN</dt><dd>'+esc(p.parcelId)+'</dd>'+
    '<dt>Classification</dt><dd>'+esc(p.dwellingType || p.landUseDescription || '—')+'</dd>'+
    '<dt>Living units</dt><dd>'+(p.livingUnits ?? '—')+'</dd>'+
    '<dt>Homestead</dt><dd>'+(p.homestead==null?'—':p.homestead?'Yes — owner-occupied':'No — absentee')+'</dd>'+
    '<dt>Tax class</dt><dd>'+esc(p.useType || '—')+'</dd>'+
    '<dt>Beds / built</dt><dd>'+(p.bedrooms ?? '—')+' / '+(p.yearBuilt ?? '—')+'</dd>'+
    '<dt>County EMV</dt><dd>'+(p.emvTotal?usd(p.emvTotal):'—')+'</dd>'+
    '<dt>Owner</dt><dd>'+esc(p.ownerName || '—')+' <span class="muted">'+esc(p.ownerCityStateZIP || '')+'</span></dd>'+
    (p.lastSaleDate?'<dt>Last sale</dt><dd>'+p.lastSaleDate+' · '+usd(p.salePrice||0)+'</dd>':'')+
  '</dl></div>'+

  '<div class="panel"><h2>Notification &amp; spacing context</h2><dl>'+
    '<dt>300-ft notice list</dt><dd>~'+(d.context?.noticeParcels300ft ?? '—')+' residential parcels (909.07.C)</dd>'+
    '<dt>500-ft zone</dt><dd>~'+(d.context?.spacingZoneParcels500ft ?? '—')+' residential parcels to check for existing STR licenses (909.03.B)</dd>'+
    '<dt>Geocoder</dt><dd>'+esc(d.geocode?.address || '—')+' <span class="muted">score '+Math.round(d.geocode?.score||0)+'</span></dd>'+
  '</dl></div></div>'+

  (r.seasons.length ? '<div class="panel"><h2>Booking-window math — 909.02 frequency caps</h2>'+
    '<table><tr><th>Season window</th><th class="r">Days</th><th class="r">Min spacing</th>'+
    '<th class="r">Max bookings</th><th class="r">Sellable nights @ '+d.scenario.avgStayNights+'n</th>'+
    '<th class="r">Optimal play</th></tr>'+rows+'</table>'+
    '<table style="margin-top:14px"><tr><th></th><th class="r">Nights</th><th class="r">Occupancy</th>'+
    '<th class="r">Gross</th><th class="r">3% lodging tax</th><th class="r">License</th><th class="r">Net</th></tr>'+
    '<tr><td>Regulation-constrained</td><td class="r">'+a.sellableNights+'</td><td class="r">'+a.occupancyPct+'%</td>'+
    '<td class="r">'+usd(a.grossRevenue)+'</td><td class="r">'+usd(a.lodgingTax)+'</td>'+
    '<td class="r">'+usd(a.licenseAndFees)+'</td><td class="r"><b>'+usd(a.netRevenue)+'</b></td></tr>'+
    '<tr><td>Naive Airbnb pro-forma (75% occ)</td><td class="r">'+Math.round(365*.75)+'</td><td class="r">75%</td>'+
    '<td class="r">'+usd(a.naiveRevenue)+'</td><td class="r">'+usd(a.naiveRevenue*.03)+'</td><td class="r">'+usd(a.licenseAndFees)+'</td>'+
    '<td class="r">'+usd(a.naiveRevenue*.97-a.licenseAndFees)+'</td></tr>'+
    '<tr><td>Best legal block strategy</td><td class="r">'+a.optimalNights+'</td><td class="r">'+Math.round(a.optimalNights/365*100)+'%</td>'+
    '<td class="r">'+usd(a.optimalRevenue)+'</td><td class="r">'+usd(a.optimalRevenue*.03)+'</td><td class="r">'+usd(a.licenseAndFees)+'</td>'+
    '<td class="r">'+usd(a.optimalRevenue*.97-a.licenseAndFees)+'</td></tr></table></div>' : '')+

  (r.licensing.length ? '<div class="panel"><h2>Licensing paths &amp; fees</h2>'+
    '<table><tr><th>Code</th><th>Instrument</th><th>Trigger</th><th class="r">Annual fee</th><th>Notes</th></tr>'+lic+'</table></div>' : '')+

  (r.compliance.length ? '<div class="panel"><h2>Operating requirements</h2><ul>'+comp+'</ul></div>' : '')+
  (r.flags ? '<div class="panel"><h2>Risk flags</h2>'+flags+'</div>' : '')+

  '<div class="panel"><h2>Analyst narrative '+
    '<span class="pill">'+(d.narrative.source==='workers-ai'?'Workers AI · llama-3.3-70b':'deterministic fallback')+'</span></h2>'+
    '<div class="narr">'+esc(d.narrative.text)+'</div></div>';
}

f.addEventListener('submit', async ev => {
  ev.preventDefault(); cands.innerHTML='';
  go.disabled = true; go.textContent = 'Running…';
  out.innerHTML = '<div class="panel muted">Geocoding, pulling parcel record, running Ch. 907/908/909 engine…</div>';
  const p = new URLSearchParams(new FormData(f));
  try{
    const res = await fetch('/api/feasibility?' + p.toString());
    render(await res.json());
  }catch(e){ out.innerHTML = '<div class="panel err"><b>Request failed:</b> '+esc(e.message)+'</div>'; }
  go.disabled = false; go.textContent = 'Run feasibility';
});
</script>
</body>
</html>`;
