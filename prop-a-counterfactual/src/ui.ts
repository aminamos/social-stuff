export const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Uncapping Michigan's Proposal A — counterfactual tax model</title>
<style>
:root{--ink:#1a2332;--mut:#5b6b7f;--bg:#f6f7f9;--card:#fff;--acc:#0b5fff;--warn:#b3541e;--ok:#0f7b3d;--line:#dde3ea}
*{box-sizing:border-box}body{font:15px/1.55 system-ui,sans-serif;color:var(--ink);background:var(--bg);margin:0}
main{max-width:1080px;margin:0 auto;padding:24px 18px 80px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:28px 0 8px;border-bottom:1px solid var(--line);padding-bottom:6px}
.sub{color:var(--mut);margin:0 0 20px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:13px 15px}
.card .k{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}
.card .v{font-size:23px;font-weight:650;margin-top:2px}
.card .v small{font-size:13px;color:var(--mut);font-weight:500}
.card .s{font-size:12px;color:var(--mut)}
.card .d{font-size:12px;margin-top:3px}.d.up{color:var(--ok)}.d.dn{color:var(--warn)}
.panel{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin-top:12px}
.calc{display:grid;grid-template-columns:minmax(300px,380px) 1fr;gap:18px}
@media(max-width:820px){.calc{grid-template-columns:1fr}}
.levers{display:flex;flex-direction:column;gap:11px}
.lv{border:1px solid var(--line);border-radius:8px;padding:9px 11px;background:#fbfcfe}
.lv .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.lv b{font-size:13px;font-weight:600}
.lv .val{font-size:14px;font-weight:650;color:var(--acc);font-variant-numeric:tabular-nums;white-space:nowrap}
.lv input[type=range]{width:100%;margin:5px 0 2px;accent-color:var(--acc)}
.lv .note{font-size:11px;color:var(--mut);line-height:1.3}
.lv .tog{display:flex;gap:6px;margin-top:4px}
.lv .tog button{flex:1;border:1px solid var(--line);background:#fff;border-radius:6px;padding:4px;font-size:12px;cursor:pointer}
.lv .tog button.on{background:var(--acc);color:#fff;border-color:var(--acc)}
.out .cards{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.outbox{margin-bottom:12px}
.outbox h3{font-size:13px;margin:14px 0 6px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}
.outbox h3:first-child{margin-top:0}
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
.reset{margin-left:auto;font-size:12px;color:var(--acc);cursor:pointer;border:1px solid var(--line);background:#fff;border-radius:6px;padding:3px 10px}
.share{font-size:12px;color:var(--mut);margin-top:10px}
</style>
</head>
<body><main>
<h1>Uncapping Michigan's Proposal A</h1>
<p class="sub">Counterfactual calculator: every parcel taxed on state equalized value, not capped taxable value. 2024 assessment data, MI Treasury / State Tax Commission.</p>

<h2>Calculator</h2>
<div class="panel calc">
  <div>
    <div class="levers" id="levers"></div>
    <div style="display:flex;margin-top:10px"><button class="reset" id="reset">Reset to defaults</button></div>
    <div class="share">Levers are shareable — every change updates the URL query string.</div>
  </div>
  <div class="out">
    <div class="outbox">
      <h3>Revenue</h3>
      <div class="cards" id="c_rev"></div>
    </div>
    <div class="outbox">
      <h3>vs. income tax</h3>
      <div class="cards" id="c_itx"></div>
    </div>
    <div class="outbox">
      <h3>Turnover &amp; prices</h3>
      <div class="cards" id="c_house"></div>
    </div>
  </div>
</div>

<h2>What the numbers say</h2>
<div class="panel" id="itx"></div>
<div class="panel" id="housing"></div>

<h2>The gap by county (2024)</h2>
<div class="panel" style="padding:0;max-height:480px;overflow:auto"><table id="ctab">
<thead><tr><th data-k="county">County</th><th data-k="sev">SEV</th><th data-k="tv">Taxable value</th><th data-k="gap">Cap gap</th><th data-k="ratio">SEV/TV</th><th data-k="avg_rate">Avg mills</th><th data-k="uplift_applied">Uncap uplift</th></tr></thead>
<tbody></tbody></table></div>

<h2>The gap over time</h2>
<div class="panel" id="series"></div>

<h2>Method &amp; sources</h2>
<div class="panel" id="method"></div>
<div class="foot">Counterfactual policy model, not tax or legal advice. Headlee rollbacks, deed-transfer-tax revenue, and demand-side effects are flagged where they matter. API: <code>GET /api/model?uncapShare=…</code></div>
</main>
<script>
const $=s=>document.querySelector(s);
const B=n=>'$'+(n/1e9).toFixed(2)+'B', M=n=>'$'+(n/1e6).toFixed(0)+'M', T=n=>'$'+(n/1e12).toFixed(2)+'T';
const N=n=>Math.round(n).toLocaleString(), P=n=>(n*100).toFixed(1)+'%';
const LEVERS=[
 {k:'uncapShare',l:'Share of gap taxed',min:0,max:1,step:.05,f:v=>P(v),note:'1 = full uncap to SEV; 0.5 = close half the gap'},
 {k:'residentialOnly',l:'Scope',type:'tog',opts:[['All classes',0],['Residential only',1]],note:'Commercial/industrial/personal stay capped in res-only mode'},
 {k:'millMult',l:'Millage multiplier',min:.8,max:1.6,step:.02,f:v=>v.toFixed(2)+'×',note:'Scales each county’s avg millage — uncap + rate hike/cut'},
 {k:'incomeTaxRevenue',l:'Net income tax to replace',min:8e9,max:14e9,step:.1e9,f:v=>B(v)+'/yr',note:'CY24 Census ≈$11.4B; FY24 SFA net ≈$12.1B. MI has no separate capital-gains tax'},
 {k:'baseAnnualSales',l:'Baseline home sales/yr',min:90000,max:140000,step:1000,f:v=>N(v),note:'Realcomp 2024: 105,862 closed (SE Michigan MLS)'},
 {k:'longTenureShare',l:'Locked-in share of sellers',min:.2,max:.7,step:.05,f:v=>P(v),note:'Owners whose TV≪SEV subsidy keeps them from selling'},
 {k:'turnoverLiftLow',l:'Mobility lift — low',min:.02,max:.3,step:.01,f:v=>P(v)},
 {k:'turnoverLiftHigh',l:'Mobility lift — high',min:.05,max:.4,step:.01,f:v=>P(v),note:'Ferreira 2010: +25% mobility at age 55 under Prop-13 portability'},
 {k:'capShare',l:'Price capitalization share',min:0,max:1,step:.05,f:v=>P(v),note:'How much of the new tax PV lands on prices'},
 {k:'discountRate',l:'Discount rate',min:.03,max:.08,step:.005,f:v=>P(v),note:'For PV of the annual uplift'},
];
let data=null, P0=null, R0=null;

// mirror of src/model.ts runModel() + sanitizeParams() — keep bounds in sync
function san(P){
  const clamp=(v,lo,hi)=>Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):lo;
  return {...P,
    uncapShare:clamp(P.uncapShare,0,1), millMult:clamp(P.millMult,0,2),
    residentialOnly:P.residentialOnly?1:0,
    incomeTaxRevenue:Math.max(0,Number.isFinite(P.incomeTaxRevenue)?P.incomeTaxRevenue:0),
    baseAnnualSales:Math.max(0,Number.isFinite(P.baseAnnualSales)?P.baseAnnualSales:0),
    longTenureShare:clamp(P.longTenureShare,0,1),
    turnoverLiftLow:clamp(P.turnoverLiftLow,0,1), turnoverLiftHigh:clamp(P.turnoverLiftHigh,0,1),
    capShare:clamp(P.capShare,0,1), discountRate:clamp(P.discountRate,0.01,0.5)};
}
function compute(raw){
  const P=san(raw);
  const resGap=data.classes.filter(c=>c.year===2024&&c.cls==='residential').reduce((a,c)=>a+c.gap,0);
  const resSev=data.classes.filter(c=>c.year===2024&&c.cls==='residential').reduce((a,c)=>a+c.sev,0);
  const cs=data.counties.map(c=>{
    const gap=P.residentialOnly?c.gap*Math.min(1,c.sev_res/c.sev):c.gap;
    return {...c,uplift_applied:gap*c.avg_rate*P.millMult*P.uncapShare/1000};
  });
  const tv=cs.reduce((a,c)=>a+c.tv,0), sev=cs.reduce((a,c)=>a+c.sev,0), gap=sev-tv;
  const levy=cs.reduce((a,c)=>a+c.total_tax,0), uplift=cs.reduce((a,c)=>a+c.uplift_applied,0);
  const avgRate=levy/tv*1000;
  const resUplift=resGap*avgRate*P.millMult*P.uncapShare/1000;
  const locked=P.baseAnnualSales*P.longTenureShare;
  const exLo=locked*P.turnoverLiftLow, exHi=locked*P.turnoverLiftHigh;
  const resMkt=resSev*2;
  const pv=resUplift/P.discountRate*P.capShare;
  return {
    counties:cs,
    state:{tv,sev,gap,gapPctOfSev:gap/sev,levy,avgRate,uplift,uncappedLevy:levy+uplift,
      incomeTaxCoveragePct:P.incomeTaxRevenue>0?uplift/P.incomeTaxRevenue:0,
      incomeTaxShortfall:Math.max(0,P.incomeTaxRevenue-uplift),
      millsNeededForFullReplacement:(levy+P.incomeTaxRevenue)/sev*1000,
      residentialUplift:resUplift},
    turnover:{baseSales:P.baseAnnualSales,extraSalesLow:exLo,extraSalesHigh:exHi,
      pctOfBaselineLow:exLo/P.baseAnnualSales,pctOfBaselineHigh:exHi/P.baseAnnualSales},
    prices:{residentialMarketValue:resMkt,pvOfUplift:pv,
      priceDeclinePctLow:pv/resMkt*.5,priceDeclinePctHigh:pv/resMkt},
  };
}
function delta(now,base,f){
  const d=now-base,dir=d>1e-9?'up':d<-1e-9?'dn':'';
  const sign=d>=0?'+':'−';
  return '<div class="d '+dir+'">'+(dir?sign+''+f(Math.abs(d))+' vs default':'—')+'</div>';
}
function card(k,v,s,d){return '<div class="card"><div class="k">'+k+'</div><div class="v">'+v+'</div><div class="s">'+s+'</div>'+(d||'')+'</div>'}
function render(){
  const R=compute(P0), s=R.state, t=R.turnover, p=R.prices;
  const bs=R0.state,bt=R0.turnover,bp=R0.prices;
  $('#c_rev').innerHTML=[
    card('Cap gap (SEV−TV)',B(s.gap),P(s.gapPctOfSev)+' of SEV escapes tax today'),
    card('Uncap uplift','+'+B(s.uplift),'levy '+B(s.levy)+' → '+B(s.uncappedLevy),delta(s.uplift,bs.uplift,B)),
    card('Residential share',B(s.residentialUplift),'of uplift lands on homes',delta(s.residentialUplift,bs.residentialUplift,B)),
  ].join('');
  const cov=s.incomeTaxCoveragePct;
  $('#c_itx').innerHTML=[
    card('IIT coverage','<span class="pill '+(cov>=1?'yes':'no')+'">'+P(cov)+'</span>','of '+B(P0.incomeTaxRevenue)+' net IIT',delta(cov,bs.incomeTaxCoveragePct,P)),
    card('Shortfall',s.incomeTaxShortfall>0?B(s.incomeTaxShortfall):'—','to fully replace the IIT'),
    card('Mills for 100%',s.millsNeededForFullReplacement.toFixed(1),'on SEV vs '+s.avgRate.toFixed(1)+' today'),
  ].join('');
  $('#c_house').innerHTML=[
    card('Extra sales/yr','+'+N(t.extraSalesLow)+'–'+N(t.extraSalesHigh),P(t.pctOfBaselineLow)+'–'+P(t.pctOfBaselineHigh)+' of baseline',delta((t.extraSalesLow+t.extraSalesHigh)/2,(bt.extraSalesLow+bt.extraSalesHigh)/2,N)),
    card('Price effect','−'+P(p.priceDeclinePctLow)+' to −'+P(p.priceDeclinePctHigh),'on '+T(p.residentialMarketValue)+' residential stock',delta((p.priceDeclinePctLow+p.priceDeclinePctHigh)/2,(bp.priceDeclinePctLow+bp.priceDeclinePctHigh)/2,P)),
  ].join('');
  $('#itx').innerHTML='<p><b>'+(cov>=1?'Covers it.':'Short answer: not quite.')+'</b> This scenario raises ≈ <b>'+B(s.uplift)+'</b>/yr — <b>'+P(cov)+'</b> of '+B(P0.incomeTaxRevenue)+' net individual income tax (no separate capital-gains tax; gains ride the flat 4.25% IIT).'+
   (s.incomeTaxShortfall>0?' Shortfall <b>'+B(s.incomeTaxShortfall)+'</b>; full replacement via the uncapped base needs ≈<b>'+s.millsNeededForFullReplacement.toFixed(1)+' mills</b> on SEV.':'')+'</p>'+
   '<div class="note">Caveat: Headlee can force millage rollbacks; base arithmetic, not a scored fiscal note.</div>';
  $('#housing').innerHTML='<p><b>Turnover:</b> <b>+'+N(t.extraSalesLow)+' to +'+N(t.extraSalesHigh)+' sales/yr</b> on '+N(t.baseSales)+' baseline ('+P(t.pctOfBaselineLow)+'–'+P(t.pctOfBaselineHigh)+' lift), front-loaded as the capped stock turns over once.</p>'+
   '<p><b>Prices:</b> <b>−'+P(p.priceDeclinePctLow)+' to −'+P(p.priceDeclinePctHigh)+'</b> on residential. A buyer already pays on full SEV — the cap discount dies at sale — so declines come from carrying cost + added supply; an income-tax cut pushes demand back up. Net effect is ambiguous and county-specific.</p>';
  drawTable(R.counties);
}
function drawTable(rows){
  const tb=document.querySelector('#ctab tbody');
  tb.innerHTML=rows.slice().sort((a,b)=>b.gap-a.gap).map(c=>'<tr><td>'+c.county+'</td><td>'+B(c.sev)+'</td><td>'+B(c.tv)+'</td><td>'+B(c.gap)+'</td><td>'+(c.sev/c.tv).toFixed(2)+'×</td><td>'+c.avg_rate.toFixed(1)+'</td><td>'+M(c.uplift_applied)+'</td></tr>').join('');
}
function syncUrl(){
  const qs=new URLSearchParams();
  LEVERS.forEach(l=>{ if(P0[l.k]!==R0._def[l.k]) qs.set(l.k,P0[l.k]); });
  history.replaceState(null,'',qs.toString()?'?'+qs:'?');
}
function buildLevers(){
  $('#levers').innerHTML=LEVERS.map(l=>{
    if(l.type==='tog'){
      return '<div class="lv"><div class="row"><b>'+l.l+'</b></div><div class="tog">'+l.opts.map((o,i)=>'<button data-k="'+l.k+'" data-v="'+o[1]+'" class="'+(P0[l.k]===o[1]?'on':'')+'">'+o[0]+'</button>').join('')+'</div>'+(l.note?'<div class="note">'+l.note+'</div>':'')+'</div>';
    }
    return '<div class="lv"><div class="row"><b>'+l.l+'</b><span class="val" id="v_'+l.k+'">'+l.f(P0[l.k])+'</span></div><input type="range" id="'+l.k+'" min="'+l.min+'" max="'+l.max+'" step="'+l.step+'" value="'+P0[l.k]+'">'+(l.note?'<div class="note">'+l.note+'</div>':'')+'</div>';
  }).join('');
  LEVERS.forEach(l=>{
    if(l.type==='tog'){
      document.querySelectorAll('button[data-k="'+l.k+'"]').forEach(b=>b.onclick=()=>{
        P0[l.k]=Number(b.dataset.v);
        document.querySelectorAll('button[data-k="'+l.k+'"]').forEach(x=>x.classList.toggle('on',x===b));
        render();syncUrl();
      });
    }else{
      const el=document.getElementById(l.k);
      el.addEventListener('input',()=>{
        P0[l.k]=Number(el.value);
        document.getElementById('v_'+l.k).textContent=l.f(P0[l.k]);
        render();syncUrl();
      });
    }
  });
  $('#reset').onclick=()=>{
    P0={...R0._def};
    LEVERS.forEach(l=>{ if(l.type==='tog'){document.querySelectorAll('button[data-k="'+l.k+'"]').forEach(x=>x.classList.toggle('on',Number(x.dataset.v)===P0[l.k]));}else{const el=document.getElementById(l.k);el.value=P0[l.k];document.getElementById('v_'+l.k).textContent=l.f(P0[l.k]);}});
    render();syncUrl();
  };
}
function fatal(msg){
  document.querySelector('#c_rev').innerHTML='<div class="card"><div class="k">Error</div><div class="v">Unavailable</div><div class="s">'+msg+'</div></div>';
}
async function load(){
  let d;
  try{
    const r=await fetch('/api/model');
    if(!r.ok) throw new Error('model '+r.status);
    d=await r.json();
    if(!d.result) throw new Error('bad model payload');
  }catch(e){ fatal('Could not load model data ('+(e.message||e)+').'); return; }
  try{
    const rc=await fetch('/api/classes');
    if(!rc.ok) throw new Error('classes '+rc.status);
    data={counties:d.result.counties,classes:(await rc.json()).classes};
  }catch(e){ fatal('Could not load class data ('+(e.message||e)+').'); return; }
  const def=d.result.params;
  P0=san({...def});
  const q=new URLSearchParams(location.search);
  q.forEach((v,k)=>{const n=Number(v);if(Number.isFinite(n)&&k in P0)P0[k]=n;});
  P0=san(P0);
  R0=compute({...def});
  R0._def=san({...def});
  buildLevers(); render();
  // sorting
  document.querySelectorAll('#ctab th').forEach(th=>th.onclick=()=>{
    const k=th.dataset.k,asc=th.dataset.asc!=='1';th.dataset.asc=asc?'1':'0';
    const rows=data.counties.map(c=>({...c,uplift_applied:(P0.residentialOnly?c.gap*Math.min(1,c.sev_res/c.sev):c.gap)*c.avg_rate*P0.millMult*P0.uncapShare/1000}));
    const sorted=rows.sort((a,b)=>k==='county'?(asc?a.county.localeCompare(b.county):b.county.localeCompare(a.county)):(asc?a[k]-b[k]:b[k]-a[k]));
    drawTable(sorted);
  });
}
fetch('/api/series').then(r=>r.json()).then(d=>{
  const max=Math.max(...d.series.map(x=>x.gap));
  document.querySelector('#series').innerHTML=d.series.map(x=>{
    const w=(x.gap/max*100).toFixed(1);
    return '<div style="display:grid;grid-template-columns:44px 1fr 90px;gap:10px;align-items:center;font-size:12px;margin:3px 0"><div>'+x.year+'</div><div class="bar"><i style="width:'+w+'%"></i></div><div>'+B(x.gap)+'</div></div>';
  }).join('')+'<div class="note">Gap nearly tripled since 2021 ($118B → $198B) as market values outran the inflation cap.</div>';
}).catch(()=>{ document.querySelector('#series').innerHTML='<div class="note">Series data unavailable.</div>'; });
fetch('/api/sources').then(r=>r.json()).then(d=>{
  document.querySelector('#method').innerHTML='<ul style="margin:0;padding-left:18px">'+d.documents.map(x=>'<li><a href="'+x.download+'">'+x.title+'</a> · <a href="'+x.source_url+'">original</a><br><span class="note">'+x.notes+'</span></li>').join('')+'</ul>'+
  '<details><summary>Definitions</summary>SEV = state equalized value ≈ 50% of market value. TV = taxable value, capped at lesser of inflation or 5%/yr until transfer (Proposal A, 1994), then reset to SEV. Uplift = gap × county average millage — i.e. the levy the same millages would raise on the uncapped base.</details>';
}).catch(()=>{ document.querySelector('#method').innerHTML='<div class="note">Source registry unavailable.</div>'; });
load();
</script></body></html>`;
