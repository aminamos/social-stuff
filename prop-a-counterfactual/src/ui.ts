export const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Uncapping Michigan's Proposal A — counterfactual tax model</title>
<style>
:root{--ink:#1a2332;--mut:#5b6b7f;--bg:#f6f7f9;--card:#fff;--acc:#0b5fff;--warn:#b3541e;--ok:#0f7b3d}
*{box-sizing:border-box}body{font:15px/1.55 system-ui,sans-serif;color:var(--ink);background:var(--bg);margin:0}
main{max-width:1080px;margin:0 auto;padding:24px 18px 80px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 8px;border-bottom:1px solid #dde3ea;padding-bottom:6px}
.sub{color:var(--mut);margin:0 0 20px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}
.card{background:var(--card);border:1px solid #dde3ea;border-radius:10px;padding:14px 16px}
.card .k{font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}
.card .v{font-size:24px;font-weight:650;margin-top:2px}
.card .s{font-size:12px;color:var(--mut)}
.panel{background:var(--card);border:1px solid #dde3ea;border-radius:10px;padding:16px 18px;margin-top:12px}
.sliders{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px 24px}
label.sl{display:block;font-size:13px}
label.sl b{font-weight:600}
input[type=range]{width:100%}
table{border-collapse:collapse;width:100%;font-size:13px;background:var(--card)}
th,td{padding:7px 9px;text-align:right;border-bottom:1px solid #eef1f4;white-space:nowrap}
th{position:sticky;top:0;background:var(--card);cursor:pointer;user-select:none}
td:first-child,th:first-child{text-align:left}
tr:hover td{background:#f2f6fc}
.note{font-size:13px;color:var(--mut);margin-top:10px}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600}
.pill.no{background:#fdeee3;color:var(--warn)}.pill.yes{background:#e4f4ea;color:var(--ok)}
a{color:var(--acc)}
details{margin-top:8px;font-size:13px}summary{cursor:pointer;font-weight:600}
.bar{height:10px;background:#e7ecf3;border-radius:6px;overflow:hidden}.bar>i{display:block;height:100%;background:var(--acc)}
.foot{margin-top:28px;font-size:12px;color:var(--mut)}
code{background:#eef1f5;padding:1px 5px;border-radius:4px}
</style>
</head>
<body><main>
<h1>Uncapping Michigan's Proposal A</h1>
<p class="sub">Counterfactual: every parcel taxed on state equalized value, not capped taxable value. 2024 assessment data, MI Treasury / State Tax Commission.</p>

<div class="cards" id="headline"></div>

<h2>Can it replace the income tax?</h2>
<div class="panel" id="itx"></div>

<h2>Housing turnover &amp; prices</h2>
<div class="panel" id="housing"></div>

<h2>Assumptions</h2>
<div class="panel"><div class="sliders" id="sliders"></div>
<div class="note">Defaults are sourced below; drag to stress-test. Scenario links: every control maps to a query param on <code>/api/model</code>.</div></div>

<h2>The gap by county (2024)</h2>
<div class="panel" style="padding:0;max-height:480px;overflow:auto"><table id="ctab">
<thead><tr><th data-k="county">County</th><th data-k="sev">SEV</th><th data-k="tv">Taxable value</th><th data-k="gap">Cap gap</th><th data-k="ratio">SEV/TV</th><th data-k="avg_rate">Avg mills</th><th data-k="uplift_applied">Uncap uplift</th></tr></thead>
<tbody></tbody></table></div>

<h2>The gap over time</h2>
<div class="panel" id="series"></div>

<h2>Method &amp; sources</h2>
<div class="panel" id="method"></div>
<div class="foot">Counterfactual policy model, not tax or legal advice. Headlee rollbacks, deed-transfer-tax revenue, and demand-side effects are flagged where they matter.</div>
</main>
<script>
const $=s=>document.querySelector(s);
const B=n=>'$'+(n/1e9).toFixed(2)+'B'; const M=n=>'$'+(n/1e6).toFixed(0)+'M';
const T=n=>'$'+(n/1e12).toFixed(2)+'T'; const N=n=>Math.round(n).toLocaleString();
const P=n=>(n*100).toFixed(1)+'%';
const CONTROLS=[
 ['uncapShare','Share of gap taxed',0,1,.05,'1 = full uncap to SEV'],
 ['residentialOnly','Residential class only',0,1,1,'0 = all classes, 1 = homes only'],
 ['incomeTaxRevenue','Net income tax to replace ($B/yr)',8,14,.1,'CY24 Census: ~$11.4B; FY24 SFA net: ~$12.1B'],
 ['baseAnnualSales','Baseline home sales/yr',90000,140000,1000,'Realcomp 2024: 105,862 closed'],
 ['longTenureShare','Locked-in share of sellers',0.2,0.7,.05,'Owners whose TV<<SEV subsidy keeps them put'],
 ['turnoverLiftHigh','Mobility lift if unlocked (high)',0.05,0.4,.01,'Ferreira 2010: +25% at age 55 under Prop 13 portability'],
 ['capShare','Price capitalization share',0,1,.05,'How much of the new tax PV lands on prices'],
 ['discountRate','Discount rate',0.03,0.08,.005,'For PV of the annual uplift'],
];
let state=null;
async function load(){
  const qs=new URLSearchParams(location.search);
  const r=await fetch('/api/model?'+qs.toString()); state=await r.json(); render();
}
function render(){
  const s=state.result.state,t=state.result.turnover,p=state.result.prices,pa=state.result.params;
  document.querySelector('#headline').innerHTML=[
    ['2024 cap gap (SEV−TV)',B(s.gap),P(s.gapPctOfSev)+' of all SEV escapes taxation'],
    ['Current levy',B(s.levy),s.avgRate.toFixed(2)+' avg mills on TV'],
    ['Uncap revenue uplift','+'+B(s.uplift),'levy would total '+B(s.uncappedLevy)],
    ['Income-tax coverage','<span class="pill '+(s.incomeTaxCoveragePct>=1?'yes':'no')+'">'+P(s.incomeTaxCoveragePct)+'</span>','of '+B(pa.incomeTaxRevenue)+' net IIT'],
  ].map(c=>'<div class="card"><div class="k">'+c[0]+'</div><div class="v">'+c[1]+'</div><div class="s">'+c[2]+'</div></div>').join('');

  const short=s.incomeTaxShortfall;
  $('#itx').innerHTML=
   '<p><b>Short answer: not quite.</b> Full uncapping raises ≈ <b>'+B(s.uplift)+'</b>/yr — about <b>'+P(s.incomeTaxCoveragePct)+'</b> of Michigan\u2019s '+
   B(pa.incomeTaxRevenue)+' net individual income tax (Michigan has no separate capital-gains tax; gains ride the flat 4.25% IIT).</p>'+
   (short>0?'<p>Remaining shortfall: <b>'+B(short)+'</b>. Replacing the whole IIT through the uncapped base would need an average of <b>'+s.millsNeededForFullReplacement.toFixed(1)+' mills</b> on SEV vs '+s.avgRate.toFixed(1)+' today — i.e. uncap <i>and</i> roughly an 11% millage bump. Residential-only uncapping raises ≈ '+B(s.residentialUplift)+'.</p>'
    :'<p>Full replacement achieved, with '+B(-short)+' to spare.</p>')+
   '<div class="note">Caveat: the Headlee amendment can force millage rollbacks; Prop A also embedded the homestead/non-homestead rate split. This is base arithmetic, not a scored fiscal note.</div>';

  $('#housing').innerHTML=
   '<p><b>Turnover:</b> applying the Prop-13 portability estimate (Ferreira 2010) to Michigan\u2019s locked-in cohort implies <b>+'+N(t.extraSalesLow)+' to +'+N(t.extraSalesHigh)+
   ' extra sales/yr</b> on a '+N(t.baseSales)+' baseline — a '+P(t.pctOfBaselineLow)+'–'+P(t.pctOfBaselineHigh)+' lift, front-loaded as the capped-TV stock turns over once.</p>'+
   '<p><b>Prices:</b> estimated <b>'+P(p.priceDeclinePctLow)+'–'+P(p.priceDeclinePctHigh)+'</b> on the residential stock ('+T(p.residentialMarketValue)+'). '+
   'Note the honest caveat: a buyer already pays tax on full SEV — the cap\u2019s discount dies at sale — so it is a wealth transfer to incumbents, not a wedge in purchase prices. The declines come from higher carrying cost + added supply; an income-tax cut pushes demand back up, so net effect is ambiguous and county-specific.</p>';

  $('#sliders').innerHTML=CONTROLS.map(c=>{
    const v=pa[c[0]];
    return '<label class="sl"><b>'+c[1]+'</b>: <span id="v_'+c[0]+'">'+v+'</span><br><input type="range" id="'+c[0]+'" min="'+c[2]+'" max="'+c[3]+'" step="'+c[4]+'" value="'+v+'"><span class="note">'+c[5]+'</span></label>';
  }).join('');
  CONTROLS.forEach(c=>{
    const el=document.getElementById(c[0]);
    el.addEventListener('input',()=>{
      document.getElementById('v_'+c[0]).textContent=el.value;
      const qs=new URLSearchParams(location.search);qs.set(c[0],el.value);
      history.replaceState(null,'','?'+qs.toString());
      fetch('/api/model?'+qs.toString()).then(r=>r.json()).then(d=>{state=d;render();});
    });
  });

  const tbody=document.querySelector('#ctab tbody');
  const rows=state.result.counties.slice().sort((a,b)=>b.gap-a.gap);
  tbody.innerHTML=rows.map(c=>'<tr><td>'+c.county+'</td><td>'+B(c.sev)+'</td><td>'+B(c.tv)+'</td><td>'+B(c.gap)+'</td><td>'+(c.sev/c.tv).toFixed(2)+'×</td><td>'+c.avg_rate.toFixed(1)+'</td><td>'+M(c.uplift_applied)+'</td></tr>').join('');
  document.querySelectorAll('#ctab th').forEach(th=>th.onclick=()=>{
    const k=th.dataset.k; const asc=th.dataset.asc!=='1'; th.dataset.asc=asc?'1':'0';
    const sorted=state.result.counties.slice().sort((a,b)=>k==='county'?(asc?a.county.localeCompare(b.county):b.county.localeCompare(a.county)):(asc?a[k]-b[k]:b[k]-a[k]));
    tbody.innerHTML=sorted.map(c=>'<tr><td>'+c.county+'</td><td>'+B(c.sev)+'</td><td>'+B(c.tv)+'</td><td>'+B(c.gap)+'</td><td>'+(c.sev/c.tv).toFixed(2)+'×</td><td>'+c.avg_rate.toFixed(1)+'</td><td>'+M(c.uplift_applied)+'</td></tr>').join('');
  });
}
fetch('/api/series').then(r=>r.json()).then(d=>{
  const max=Math.max(...d.series.map(x=>x.gap));
  document.querySelector('#series').innerHTML=d.series.map(x=>{
    const w=(x.gap/max*100).toFixed(1);
    return '<div style="display:grid;grid-template-columns:44px 1fr 90px;gap:10px;align-items:center;font-size:12px;margin:3px 0"><div>'+x.year+'</div><div class="bar"><i style="width:'+w+'%"></i></div><div>'+B(x.gap)+'</div></div>';
  }).join('')+'<div class="note">Gap nearly tripled since 2021 ($118B → $198B) as market values outran the inflation cap.</div>';
});
fetch('/api/sources').then(r=>r.json()).then(d=>{
  document.querySelector('#method').innerHTML='<ul style="margin:0;padding-left:18px">'+d.documents.map(x=>'<li><a href="'+x.download+'">'+x.title+'</a> · <a href="'+x.source_url+'">original</a><br><span class="note">'+x.notes+'</span></li>').join('')+'</ul>'+
  '<details><summary>Definitions</summary>SEV = state equalized value ≈ 50% of market value. TV = taxable value, capped at lesser of inflation or 5%/yr until transfer (Proposal A, 1994), then reset to SEV. Uplift = gap × county average millage — i.e. the levy the same millages would raise on the uncapped base.</details>';
});
load();
</script></body></html>`;
