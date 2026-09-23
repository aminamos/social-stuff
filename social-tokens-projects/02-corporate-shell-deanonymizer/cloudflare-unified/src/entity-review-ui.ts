// Entity-review queue UI: pending merge/flag proposals from
// finalizeEntities (multi_jurisdiction_name, cross_jurisdiction_name_domain,
// large_auto_group). GET is public; POST approve/reject needs AUTH_SECRET
// (entered once, kept in localStorage).
export function renderEntityReviewUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Entity Review Queue — Housing & Labor Registry</title>
  <style>
    :root { --bg: #0b1220; --card: #111c33; --border: #22345c; --text: #e6edf7; --dim: #93a4c4; --accent: #38bdf8; --green: #34d399; --red: #f87171; --amber: #fbbf24; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, system-ui, sans-serif; }
    header { padding: 28px 20px 10px; max-width: 1100px; margin: 0 auto; }
    header h1 { margin: 0 0 6px; font-size: 1.6rem; }
    header p { margin: 0; color: var(--dim); }
    nav { max-width: 1100px; margin: 10px auto 0; padding: 0 20px; font-size: 0.85rem; }
    nav a { color: var(--accent); margin-right: 14px; }
    .wrap { max-width: 1100px; margin: 0 auto; padding: 10px 20px 40px; }
    .controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; align-items: center; }
    .controls input, .controls select { background: #0e1830; color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
    .controls input { flex: 1; min-width: 240px; }
    .controls button { background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 10px 16px; cursor: pointer; font-weight: 700; }
    .controls button.primary { background: var(--accent); color: #06121f; border-color: var(--accent); }
    .count { color: var(--dim); font-size: 0.85rem; margin-left: auto; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 10px; }
    .card.done { opacity: 0.45; }
    .row { display: flex; gap: 12px; align-items: flex-start; }
    .col { flex: 1; min-width: 0; }
    .col h4 { margin: 0 0 4px; font-size: 0.95rem; }
    .eid { color: var(--dim); font-size: 0.72rem; font-family: ui-monospace, monospace; word-break: break-all; }
    .meta { color: var(--dim); font-size: 0.8rem; margin-top: 4px; }
    .badge { display: inline-block; font-size: 0.7rem; font-weight: 800; border-radius: 6px; padding: 2px 8px; }
    .b-amber { background: rgba(251,191,36,.12); color: var(--amber); border: 1px solid rgba(251,191,36,.4); }
    .b-blue { background: rgba(56,189,248,.12); color: var(--accent); border: 1px solid rgba(56,189,248,.4); }
    .b-red { background: rgba(248,113,113,.15); color: var(--red); border: 1px solid rgba(248,113,113,.4); }
    .ev { background: #0e1830; border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 0.75rem; font-family: ui-monospace, monospace; color: var(--dim); margin-top: 8px; word-break: break-all; }
    .actions { display: flex; flex-direction: column; gap: 6px; }
    .actions button { border-radius: 8px; padding: 8px 14px; cursor: pointer; font-weight: 800; font-size: 0.8rem; }
    .approve { background: rgba(52,211,153,.15); color: var(--green); border: 1px solid rgba(52,211,153,.5); }
    .reject { background: rgba(248,113,113,.12); color: var(--red); border: 1px solid rgba(248,113,113,.5); }
    .approve:hover { background: var(--green); color: #06121f; }
    .reject:hover { background: var(--red); color: #06121f; }
    .toast { position: fixed; bottom: 20px; right: 20px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 10px 16px; font-size: 0.85rem; display: none; }
    .loading { color: var(--dim); padding: 30px; text-align: center; }
    .hint { color: var(--dim); font-size: 0.78rem; margin-top: 4px; }
  </style>
</head>
<body>
  <header>
    <h1>Entity Review Queue</h1>
    <p>Proposed merges/flags from entity resolution. Approve merges B into A (links re-point, B retires); reject keeps them separate. Decisions are permanent.</p>
  </header>
  <nav><a href="/">← Registry home</a><a href="/housing">Housing</a><a href="/crossover">Crossover</a></nav>
  <div class="wrap">
    <div class="controls">
      <input id="token" type="password" placeholder="Auth token (Bearer AUTH_SECRET) — required to approve/reject">
      <select id="status">
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <select id="reason">
        <option value="">All reasons</option>
        <option value="multi_jurisdiction_name">Same name, multiple jurisdictions</option>
        <option value="cross_jurisdiction_name_domain">Name ↔ email-domain crossover</option>
        <option value="large_auto_group">Oversized auto group</option>
      </select>
      <button class="primary" id="reload">Reload</button>
      <span class="count" id="count"></span>
    </div>
    <div id="list"><div class="loading">Loading…</div></div>
    <div class="hint">Showing up to 200 items per load (API limit). Reload after deciding to pull the next page.</div>
  </div>
  <div class="toast" id="toast"></div>
<script>
const list = document.getElementById('list');
const countEl = document.getElementById('count');
const toast = document.getElementById('toast');
const tokenInput = document.getElementById('token');
tokenInput.value = localStorage.getItem('review_token') || '';
tokenInput.addEventListener('change', () => localStorage.setItem('review_token', tokenInput.value));

const REASON_LABEL = {
  multi_jurisdiction_name: 'Same name, multiple jurisdictions',
  cross_jurisdiction_name_domain: 'Name ↔ email-domain crossover',
  large_auto_group: 'Oversized auto group',
};
const REASON_CLASS = {
  multi_jurisdiction_name: 'b-blue',
  cross_jurisdiction_name_domain: 'b-amber',
  large_auto_group: 'b-red',
};

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function entityCol(name, kind, parcels, jurs, eid) {
  return '<div class="col"><h4>' + esc(name || '(unknown)') + '</h4>'
    + '<div class="meta">' + esc(kind || '?') + ' · ' + (parcels ?? 0) + ' parcels · ' + (jurs ?? 0) + ' jurisdictions</div>'
    + '<div class="eid">' + esc(eid || '') + '</div></div>';
}

function show(msg) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(show._t);
  show._t = setTimeout(() => toast.style.display = 'none', 3000);
}

async function decide(id, action, card) {
  const token = tokenInput.value.trim();
  if (!token) { show('Enter the auth token first'); tokenInput.focus(); return; }
  card.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    const r = await fetch('/api/entity-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ id, action }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || r.status);
    card.classList.add('done');
    card.querySelector('.actions').innerHTML = '<span class="badge ' + (action === 'approve' ? 'b-blue' : 'b-red') + '">' + j.status + '</span>';
    show('#' + id + ' ' + j.status);
  } catch (e) {
    card.querySelectorAll('button').forEach(b => b.disabled = false);
    show('Failed: ' + e.message);
  }
}

async function load() {
  const status = document.getElementById('status').value;
  const reason = document.getElementById('reason').value;
  list.innerHTML = '<div class="loading">Loading…</div>';
  const r = await fetch('/api/entity-review?status=' + encodeURIComponent(status));
  const j = await r.json();
  let rows = j.review || [];
  if (reason) rows = rows.filter(x => x.reason === reason);
  countEl.textContent = rows.length + ' ' + status + ' item' + (rows.length === 1 ? '' : 's') + (rows.length >= 200 ? ' (page cap)' : '');
  if (!rows.length) { list.innerHTML = '<div class="loading">Queue empty.</div>'; return; }
  list.innerHTML = '';
  for (const it of rows) {
    const card = document.createElement('div');
    card.className = 'card';
    let ev = {};
    try { ev = JSON.parse(it.evidence || '{}'); } catch {}
    const isPair = !!it.entity_id_b;
    card.innerHTML =
      '<div class="row">'
      + entityCol(it.a_name, it.a_kind, it.a_parcels, it.a_jurs, it.entity_id_a)
      + (isPair
          ? '<div style="align-self:center;color:var(--dim);font-weight:800">⇄</div>' + entityCol(it.b_name, it.b_kind, it.b_parcels, it.b_jurs, it.entity_id_b)
          : '<div class="col"></div>')
      + '<div class="actions">'
      + '<button class="approve">' + (isPair ? 'Approve merge' : 'Confirm') + '</button>'
      + '<button class="reject">Reject</button>'
      + '</div></div>'
      + '<div style="margin-top:8px"><span class="badge ' + (REASON_CLASS[it.reason] || 'b-blue') + '">' + (REASON_LABEL[it.reason] || esc(it.reason)) + '</span>'
      + ' <span class="meta">#' + it.id + ' · ' + esc(it.created_at || '') + '</span></div>'
      + '<div class="ev">' + esc(JSON.stringify(ev)) + '</div>';
    const [approveBtn, rejectBtn] = card.querySelectorAll('button');
    approveBtn.onclick = () => decide(it.id, 'approve', card);
    rejectBtn.onclick = () => decide(it.id, 'reject', card);
    if (status !== 'pending') card.querySelector('.actions').remove();
    list.appendChild(card);
  }
}

document.getElementById('reload').onclick = load;
document.getElementById('status').onchange = load;
document.getElementById('reason').onchange = load;
load();
</script>
</body>
</html>`;
}
