/** Interview UI: questionnaire -> TaxInput -> POST /compute -> results. */

export const UI_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>tax-engine — TY2025 interview</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root { --bg:#0b0f14; --card:#12181f; --line:#1f2a33; --txt:#dbe4ea; --dim:#7d8b96; --acc:#34d399; --warn:#fbbf24; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--txt); font:14px/1.5 -apple-system, "SF Mono", ui-monospace, monospace; }
  .wrap { max-width:880px; margin:0 auto; padding:24px 16px 80px; }
  h1 { font-size:1.3rem; margin:0 0 4px; }
  .sub { color:var(--dim); margin-bottom:24px; }
  fieldset { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:16px; margin:0 0 16px; }
  legend { color:var(--acc); font-weight:600; padding:0 6px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px 16px; }
  label { display:flex; flex-direction:column; gap:3px; font-size:.8rem; color:var(--dim); }
  input, select { background:#0d1319; border:1px solid var(--line); border-radius:6px; color:var(--txt); padding:7px 9px; font:inherit; width:100%; }
  input:focus, select:focus { outline:1px solid var(--acc); }
  .check { flex-direction:row; align-items:center; gap:8px; }
  .check input { width:auto; }
  button { background:var(--acc); color:#06281c; border:0; border-radius:8px; padding:11px 26px; font:600 .95rem inherit; cursor:pointer; }
  button.sec { background:#1f2a33; color:var(--txt); }
  #out { margin-top:20px; }
  .result { display:flex; gap:24px; flex-wrap:wrap; margin-bottom:12px; }
  .big { font-size:1.6rem; font-weight:700; }
  .refund { color:var(--acc); } .owed { color:#f87171; }
  table { border-collapse:collapse; width:100%; font-size:.8rem; }
  td { border-bottom:1px solid var(--line); padding:4px 8px; }
  td:last-child { text-align:right; font-variant-numeric:tabular-nums; }
  .diag { color:var(--warn); font-size:.8rem; margin:10px 0; }
  details { margin-top:12px; } summary { cursor:pointer; color:var(--dim); }
  textarea { width:100%; height:220px; background:#0d1319; color:var(--txt); border:1px solid var(--line); border-radius:8px; font:12px/1.4 ui-monospace,monospace; padding:10px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>TY2025 Federal Tax Interview</h1>
  <div class="sub">Deterministic engine — every line is keyed to its form. Nothing is stored unless you POST /returns yourself.</div>

  <fieldset><legend>Filing</legend><div class="grid">
    <label>Filing status
      <select id="filingStatus">
        <option value="single">Single</option><option value="mfj">Married filing jointly</option>
        <option value="mfs">Married filing separately</option><option value="hoh">Head of household</option>
        <option value="qss">Qualifying surviving spouse</option>
      </select></label>
    <label class="check"><input type="checkbox" id="senior"> Taxpayer 65+</label>
    <label class="check"><input type="checkbox" id="spSenior"> Spouse 65+</label>
    <label class="check"><input type="checkbox" id="dep"> Claimed as a dependent</label>
    <label>Dependents (count)<input type="number" id="depCount" value="0" min="0"></label>
    <label>CTC-eligible kids under 17<input type="number" id="ctcKids" value="0" min="0"></label>
    <label>EITC-eligible kids<input type="number" id="eitcKids" value="0" min="0"></label>
  </div></fieldset>

  <fieldset><legend>Income</legend><div class="grid">
    <label>W-2 wages<input type="number" id="wages" value="0"></label>
    <label>Federal withholding<input type="number" id="wh" value="0"></label>
    <label>Taxable interest<input type="number" id="int" value="0"></label>
    <label>Ordinary dividends<input type="number" id="div" value="0"></label>
    <label>Qualified dividends<input type="number" id="qdiv" value="0"></label>
    <label>IRA distributions (taxable)<input type="number" id="ira" value="0"></label>
    <label>Pensions (taxable)<input type="number" id="pen" value="0"></label>
    <label>Social Security benefits<input type="number" id="ss" value="0"></label>
    <label>Short-term net gain/loss<input type="number" id="stg" value="0"></label>
    <label>Long-term net gain/loss<input type="number" id="ltg" value="0"></label>
    <label>Unrecaptured §1250 gain<input type="number" id="u1250" value="0"></label>
    <label>28% collectibles gain<input type="number" id="cg28" value="0"></label>
    <label>Self-employment / Sch C<input type="number" id="se" value="0"></label>
    <label>Rental / partnership / Sch E<input type="number" id="rent" value="0"></label>
    <label>Unemployment<input type="number" id="ui" value="0"></label>
    <label>Other income<input type="number" id="oth" value="0"></label>
    <label>Qualified tips (Sch 1-A)<input type="number" id="tips" value="0"></label>
    <label>Qualified overtime (Sch 1-A)<input type="number" id="ot" value="0"></label>
    <label>Car loan interest (Sch 1-A)<input type="number" id="car" value="0"></label>
  </div></fieldset>

  <fieldset><legend>Adjustments & deductions</legend><div class="grid">
    <label>Student loan interest paid<input type="number" id="sli" value="0"></label>
    <label>IRA contributions<input type="number" id="iraC" value="0"></label>
    <label class="check"><input type="checkbox" id="covered"> Covered by employer plan</label>
    <label>HSA deduction<input type="number" id="hsa" value="0"></label>
    <label>SALT (income/sales + RE + PP tax)<input type="number" id="salt" value="0"></label>
    <label>Mortgage interest<input type="number" id="mtg" value="0"></label>
    <label>Charitable (cash, 60% limit)<input type="number" id="char" value="0"></label>
    <label>Medical expenses<input type="number" id="med" value="0"></label>
    <label>Other itemized<input type="number" id="oitem" value="0"></label>
  </div></fieldset>

  <fieldset><legend>Credits & other</legend><div class="grid">
    <label>AOC students — expenses, comma-sep<input id="aoc" placeholder="3000, 2500"></label>
    <label>LLC expenses<input type="number" id="llc" value="0"></label>
    <label>Windows/skylights cost<input type="number" id="win" value="0"></label>
    <label>Heat pump / biomass cost<input type="number" id="hp" value="0"></label>
    <label>Solar electric cost<input type="number" id="sol" value="0"></label>
    <label>Dependent care expenses<input type="number" id="dcare" value="0"></label>
    <label>Care qualifying persons (1-2)<input type="number" id="dqp" value="0" min="0" max="2"></label>
    <label>Estimated tax payments<input type="number" id="est" value="0"></label>
    <label>Prior-year tax (Form 2210)<input type="number" id="pyt" value="0"></label>
    <label>ISO exercise spread (AMT)<input type="number" id="iso" value="0"></label>
  </div></fieldset>

  <fieldset><legend>Minnesota (optional)</legend><div class="grid">
    <label class="check"><input type="checkbox" id="mnOn"> File M1</label>
    <label>MN withholding<input type="number" id="mnWh" value="0"></label>
    <label>MN additions<input type="number" id="mnAdd" value="0"></label>
    <label>MN subtractions<input type="number" id="mnSub" value="0"></label>
  </div></fieldset>

  <div style="display:flex;gap:12px;align-items:center;">
    <button onclick="go()">Compute</button>
    <button class="sec" onclick="dlMef()">Download MeF XML</button>
    <button class="sec" onclick="document.getElementById('raw').style.display='block'">Show TaxInput JSON</button>
  </div>
  <textarea id="raw" style="display:none;margin-top:12px"></textarea>
  <div id="out"></div>
</div>
<script>
const v = id => +document.getElementById(id).value || 0;
const on = id => document.getElementById(id).checked;

function buildInput() {
  const deps = [];
  for (let i = 0; i < v('depCount'); i++) deps.push({ qualifyingChildForCtc: i < v('ctcKids'), under17: i < v('ctcKids'), eitcQualifyingChild: i < v('eitcKids') });
  const aoc = document.getElementById('aoc').value.split(',').map(s => +s.trim()).filter(n => n > 0);
  const inp = {
    filingStatus: document.getElementById('filingStatus').value,
    taxpayer: { senior65Plus: on('senior'), iraContributions: v('iraC'), coveredByEmployerPlan: on('covered') },
    spouse: { senior65Plus: on('spSenior') },
    claimedAsDependent: on('dep') || undefined,
    dependents: deps.length ? deps : undefined,
    wages: v('wages') || undefined, federalWithholding: v('wh') || undefined,
    taxableInterest: v('int') || undefined, ordinaryDividends: v('div') || undefined,
    qualifiedDividends: v('qdiv') || undefined, iraDistributions: v('ira') || undefined,
    pensions: v('pen') || undefined, socialSecurityBenefits: v('ss') || undefined,
    capital: (v('stg') || v('ltg') || v('u1250') || v('cg28')) ? { shortTermNet: v('stg'), longTermNet: v('ltg'), unrecaptured1250Gain: v('u1250'), collectiblesGain: v('cg28') } : undefined,
    businessIncome: v('se') || undefined, rentalRoyaltyPartnership: v('rent') || undefined,
    unemploymentCompensation: v('ui') || undefined, otherIncome: v('oth') || undefined,
    qualifiedTips: v('tips') || undefined, qualifiedOvertime: v('ot') || undefined, carLoanInterest: v('car') || undefined,
    studentLoanInterestPaid: v('sli') || undefined,
    adjustments: v('hsa') ? { hsaDeduction: v('hsa') } : undefined,
    itemized: (v('salt')||v('mtg')||v('char')||v('med')||v('oitem')) ? {
      stateLocalIncomeOrSalesTax: 0, realEstateTax: 0, personalPropertyTax: 0,
      homeMortgageInterest: v('mtg'), charitableGifts: v('char'), medicalExpenses: v('med'), otherItemized: v('oitem'),
      _saltCombined: v('salt')
    } : undefined,
    education: (aoc.length || v('llc')) ? { aocStudents: aoc.map(q => ({ qualifiedExpenses: q })), llcExpenses: v('llc') || undefined } : undefined,
    energy: (v('win')||v('hp')||v('sol')) ? { windowsSkylights: v('win'), heatPumpOrBiomass: v('hp'), solarElectric: v('sol') } : undefined,
    dependentCare: (v('dcare') && v('dqp')) ? { expenses: v('dcare'), qualifyingPersons: Math.min(2, Math.max(1, v('dqp'))) } : undefined,
    estimatedTaxPayments: v('est') || undefined,
    underpayment: v('pyt') ? { priorYearTax: v('pyt') } : undefined,
    amt: v('iso') ? { isoAdjustment: v('iso') } : undefined,
    mn: on('mnOn') ? { withholding: v('mnWh'), additions: v('mnAdd'), subtractions: v('mnSub') } : undefined,
  };
  // split combined SALT input across the three tax lines
  if (inp.itemized && inp.itemized._saltCombined) {
    inp.itemized.stateLocalIncomeOrSalesTax = inp.itemized._saltCombined;
    delete inp.itemized._saltCombined;
  }
  return inp;
}

async function go() {
  const input = buildInput();
  document.getElementById('raw').value = JSON.stringify(input, null, 2);
  const r = await fetch('/compute', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(input) });
  const res = await r.json();
  render(res);
}

async function dlMef() {
  const input = buildInput();
  const r = await fetch('/mef', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ input }) });
  const blob = await r.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'return-2025.xml'; a.click();
}

function render(res) {
  if (res.error) { document.getElementById('out').innerHTML = '<div class="diag">'+res.error+'</div>'; return; }
  const rows = Object.entries(res.lines).sort().map(([k,v]) => '<tr><td>'+k+'</td><td>'+v.toLocaleString()+'</td></tr>').join('');
  document.getElementById('out').innerHTML =
    '<div class="result"><div><div class="sub">refund</div><div class="big refund">$'+res.refund.toLocaleString()+'</div></div>' +
    '<div><div class="sub">amount owed</div><div class="big owed">$'+res.amountOwed.toLocaleString()+'</div></div></div>' +
    (res.diagnostics.length ? '<div class="diag">'+res.diagnostics.join('<br>')+'</div>' : '') +
    '<details><summary>form lines ('+Object.keys(res.lines).length+')</summary><table>'+rows+'</table></details>';
}
</script>
</body>
</html>`;
