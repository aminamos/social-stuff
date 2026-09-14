export function renderCrossoverUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twin Cities Slumlord & Wage Theft Crossover Matrix</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070a11;
      --card-bg: #0e1422;
      --card-border: #1e293b;
      --text: #f8fafc;
      --text-dim: #94a3b8;
      --primary: #ef4444;
      --accent-purple: #c084fc;
      --accent-purple-bg: rgba(192, 132, 252, 0.12);
      --accent-amber: #fbbf24;
      --accent-amber-bg: rgba(251, 191, 36, 0.12);
      --accent-cyan: #38bdf8;
      --accent-cyan-bg: rgba(56, 189, 248, 0.12);
      --accent-green: #34d399;
      --accent-green-bg: rgba(52, 211, 153, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding-bottom: 60px;
    }
    .container { max-width: 1240px; margin: 0 auto; padding: 0 20px; }

    /* Header */
    header {
      background: radial-gradient(circle at 50% 0%, #29152a 0%, #070a11 75%);
      border-bottom: 1px solid var(--card-border);
      padding: 44px 0 32px 0;
      text-align: center;
    }
    .badge-crossover {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 14px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(239, 68, 68, 0.18);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.4);
      margin-bottom: 16px;
    }
    h1 {
      font-size: 2.7rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      margin-bottom: 14px;
      background: linear-gradient(90deg, #ffffff 0%, #fca5a5 50%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: var(--text-dim);
      font-size: 1.1rem;
      max-width: 820px;
      margin: 0 auto 24px auto;
      line-height: 1.6;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-top: 28px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
      text-align: center;
    }
    .stat-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.8rem;
      font-weight: 800;
      color: #ef4444;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 6px;
    }

    /* Tabs & Nav */
    .tabs-bar {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 0.95rem;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
    }
    .tab-btn.active {
      color: #fff;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    /* Search Box */
    .search-section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .search-row {
      display: flex;
      gap: 12px;
    }
    .search-input {
      flex: 1;
      background: #070a11;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      color: var(--text);
      font-size: 1rem;
      padding: 14px 18px;
      outline: none;
    }
    .search-input:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
    .search-btn {
      background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 800;
      padding: 0 26px;
      cursor: pointer;
    }

    /* Dual Cards Matrix */
    .matrix-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 16px;
    }
    .dual-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      display: grid;
      grid-template-columns: 280px 1fr 1fr;
      gap: 24px;
      position: relative;
      transition: border-color 0.15s, transform 0.15s;
    }
    .dual-card:hover {
      border-color: #f87171;
      transform: translateY(-2px);
    }
    @media (max-width: 992px) {
      .dual-card { grid-template-columns: 1fr; }
    }

    /* Pillar 1: Entity & Risk Score */
    .pillar-overview {
      border-right: 1px solid var(--card-border);
      padding-right: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    @media (max-width: 992px) {
      .pillar-overview { border-right: none; border-bottom: 1px solid var(--card-border); padding-right: 0; padding-bottom: 20px; }
    }
    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.35);
      margin-bottom: 8px;
    }
    .syndicate-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .score-meter {
      background: #070a11;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px;
      margin: 14px 0;
    }
    .score-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 2rem;
      font-weight: 900;
      color: #ef4444;
    }
    .score-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: var(--text-dim);
      letter-spacing: 0.05em;
    }

    /* Pillar 2: Housing Exploitation */
    .pillar-box {
      background: #070a11;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .pillar-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--card-border);
    }
    .pillar-header.housing { color: #38bdf8; }
    .pillar-header.labor { color: #f87171; }

    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 8px;
    }
    .stat-row-key { color: var(--text-dim); }
    .stat-row-val { font-weight: 700; color: #fff; font-family: 'JetBrains Mono', monospace; }

    .pill-tag {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .pill-tier3 { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .pill-shell { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

    /* Cross-Action Banner */
    .action-plan-box {
      grid-column: 1 / -1;
      background: rgba(192, 132, 252, 0.08);
      border: 1px solid rgba(192, 132, 252, 0.3);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .action-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: #c084fc;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .action-desc {
      font-size: 0.85rem;
      color: #e2e8f0;
      max-width: 800px;
    }

    .cta-btn {
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.15s;
    }
    .cta-btn:hover { opacity: 0.85; }
    .cta-housing { background: #38bdf8; color: #070a11; }
    .cta-labor { background: #ef4444; color: #fff; }

    /* Whistleblower Form */
    .form-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
    }
    .form-group { margin-bottom: 20px; }
    .form-label { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 6px; color: #cbd5e1; }
    .form-input, .form-textarea {
      width: 100%;
      background: #070a11;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text);
      font-size: 0.95rem;
      padding: 12px 14px;
      outline: none;
    }
    .form-input:focus, .form-textarea:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
    .submit-btn {
      background: linear-gradient(90deg, #ef4444 0%, #c084fc 100%);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 800;
      padding: 14px 28px;
      font-size: 1rem;
      cursor: pointer;
      width: 100%;
    }

    .loading { text-align: center; padding: 40px; color: var(--text-dim); }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #ef4444;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-bottom: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <header>
    <div class="container">
      <div class="badge-crossover">⚡ THE DUAL EXPLOITATION INDEX</div>
      <h1>Twin Cities Slumlord & Wage Theft Crossover Matrix</h1>
      <p class="subtitle">
        Unmasking the corporate syndicates and private equity networks cited for 
        <strong>substandard habitability / slumlord code violations</strong> while 
        <strong>simultaneously stealing overtime and minimum wage</strong> from the caretakers and cleaners who maintain their buildings.
      </p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val" id="statUnits">2,300+</div>
          <div class="stat-label">Tenant Units Under Dual Violation</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="color: #c084fc;" id="statSyndicates">6</div>
          <div class="stat-label">Confirmed Corporate Syndicates</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="color: #38bdf8;" id="statRecovered">$220,000+</div>
          <div class="stat-label">Stolen Wages & Penalties in Matrix</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="color: #34d399;" id="statTier3">Active</div>
          <div class="stat-label">Tier 3 Slumlord Overlap</div>
        </div>
      </div>
    </div>
  </header>

  <main class="container" style="margin-top: 24px;">
    <!-- Tabs Navigation -->
    <div class="tabs-bar">
      <button class="tab-btn active" onclick="switchTab('matrix')">🎯 Dual Violators Matrix</button>
      <button class="tab-btn" onclick="switchTab('report')">📢 Report Dual Exploitation</button>
      <button class="tab-btn" onclick="switchTab('api')">⚡ Crossover API</button>
      
      <a href="https://mpls-rental-sync-worker.a-8c6.workers.dev" target="_blank" class="tab-btn" style="margin-left: auto; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
        🏢 Landlord De-anonymizer ↗
      </a>
      <a href="https://twin-cities-wage-theft-worker.a-8c6.workers.dev" target="_blank" class="tab-btn" style="color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">
        ⚖️ Wage Theft Registry ↗
      </a>
    </div>

    <!-- TAB 1: DUAL VIOLATORS MATRIX -->
    <div id="matrixTab" class="tab-pane active">
      <div class="search-section">
        <div class="search-row">
          <input type="text" id="searchInput" class="search-input" placeholder="Search crossover matrix by landlord, management email, or address (e.g. Fitterer, Dominium, Kleinman)..." value="">
          <button class="search-btn" onclick="executeSearch()">Filter Matrix</button>
        </div>
      </div>

      <div id="matrixContainer" class="matrix-grid"></div>
    </div>

    <!-- TAB 2: REPORT DUAL EXPLOITATION -->
    <div id="reportTab" class="tab-pane">
      <div class="form-card">
        <h2 style="font-size: 1.5rem; font-weight: 900; margin-bottom: 8px;">Report Dual Housing & Labor Abuse</h2>
        <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 24px;">
          Does your landlord refuse to fix heat/mold while also stiffing the building caretaker or turnover cleaners? Submit an incident report to assist tenant union and labor organizers.
        </p>

        <form id="dualReportForm" onsubmit="submitDualReport(event)">
          <div class="form-group">
            <label class="form-label">Property Owner / Management Company *</label>
            <input type="text" id="reportEmployer" class="form-input" required placeholder="e.g. Dominium, IPG Living, or shell LLC name">
          </div>

          <div class="form-group">
            <label class="form-label">Building Address</label>
            <input type="text" id="reportAddress" class="form-input" placeholder="e.g. 2312 Blaisdell Ave S, Minneapolis">
          </div>

          <div class="form-group">
            <label class="form-label">Housing Habitability Issues Observed</label>
            <input type="text" id="reportHousing" class="form-input" placeholder="e.g. No heat in winter, black mold, rodent infestation, broken security doors">
          </div>

          <div class="form-group">
            <label class="form-label">Worker Exploitation Observed</label>
            <input type="text" id="reportLabor" class="form-input" placeholder="e.g. Caretaker worked 50 hrs/wk for $800 rent credit, unpaid overtime, 1099 misclassification">
          </div>

          <div class="form-group">
            <label class="form-label">Detailed Incident Narrative *</label>
            <textarea id="reportNarrative" class="form-textarea" rows="4" required placeholder="Describe what you observed, dates, and names of individuals involved..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Confidential Contact Info (Optional)</label>
            <input type="text" id="reportContact" class="form-input" placeholder="Email or phone for confidential organizer follow-up">
          </div>

          <button type="submit" class="submit-btn" id="submitBtn">Submit Joint Exploitation Report</button>
          <div id="reportResult" style="margin-top: 16px; font-weight: 600;"></div>
        </form>
      </div>
    </div>

    <!-- TAB 3: API -->
    <div id="apiTab" class="tab-pane">
      <div class="search-section">
        <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">Crossover Intelligence API</h2>
        <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 20px;">
          Direct REST endpoints querying the intersection of housing and labor violations.
        </p>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="background: #070a11; padding: 14px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-family: 'JetBrains Mono', monospace; color: #ef4444; font-weight: 700;">GET /matrix?q={search}</div>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-top: 4px;">Returns ranked syndicates with composite exploitation scores and dual dossiers.</div>
          </div>
          <div style="background: #070a11; padding: 14px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-family: 'JetBrains Mono', monospace; color: #ef4444; font-weight: 700;">GET /stats</div>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-top: 4px;">Aggregate counts of units, properties, and stolen wages within the crossover dataset.</div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById(tabId + 'Tab').classList.add('active');
    }

    async function executeSearch() {
      const q = document.getElementById('searchInput').value.trim();
      const container = document.getElementById('matrixContainer');
      container.innerHTML = '<div class="loading"><div class="spinner"></div>Analyzing dual housing and labor crossover...</div>';

      try {
        const resp = await fetch('/matrix?q=' + encodeURIComponent(q));
        const data = await resp.json();
        const records = data.matrix || [];

        if (records.length === 0) {
          container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim);">No crossover syndicates found matching query.</div>';
          return;
        }

        container.innerHTML = records.map(s => {
          return \`
            <div class="dual-card">
              <!-- Pillar 1: Syndicate Overview & Score -->
              <div class="pillar-overview">
                <div>
                  <span class="risk-badge">🚨 JOINT EXPLOITATION RISK: \${s.risk_tier}</span>
                  <h3 class="syndicate-title">\${s.entity_name}</h3>
                  <div style="font-size: 0.85rem; color: #c084fc; font-weight: 600;">\${s.trade_name}</div>
                  <div style="font-size: 0.78rem; color: var(--text-dim); margin-top: 4px;">\${s.city}, MN • Primary: \${s.applicant_email || 'Multiple Agents'}</div>

                  <div class="score-meter">
                    <div class="score-val">\${s.composite_score}<span style="font-size: 1rem; color: var(--text-dim);">/100</span></div>
                    <div class="score-label">Dual Exploitation Score</div>
                  </div>
                </div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <a href="https://mpls-rental-sync-worker.a-8c6.workers.dev/search?q=\${encodeURIComponent(s.search_slug)}" target="_blank" class="cta-btn cta-housing">
                    🏢 Properties (\${s.total_units} units) ↗
                  </a>
                  <a href="https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=\${encodeURIComponent(s.search_slug)}" target="_blank" class="cta-btn cta-labor">
                    ⚖️ Labor Docket ↗
                  </a>
                </div>
              </div>

              <!-- Pillar 2: Housing Exploitation -->
              <div class="pillar-box">
                <div>
                  <div class="pillar-header housing">
                    <span>🏢 Housing Exploitation Profile</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-row-key">Total Units Monitored:</span>
                    <span class="stat-row-val" style="color: #38bdf8;">\${(s.total_units || 0).toLocaleString()} Units</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-row-key">Unmasked Sister Buildings:</span>
                    <span class="stat-row-val">\${s.properties_count} Properties</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-row-key">Habitability Violations:</span>
                    <span class="stat-row-val" style="color: \${s.has_tier3 ? '#f87171' : '#34d399'};">\${s.has_tier3 ? 'TIER 3 SLUMLORD' : 'Tier 1/2'}</span>
                  </div>
                  <div style="margin-top: 12px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.4;">
                    \${s.housing_narrative}
                  </div>
                </div>

                <div style="margin-top: 14px;">
                  \${s.has_tier3 ? '<span class="pill-tag pill-tier3">⚠️ TIER 3 CHRONIC SLUMLORD</span>' : ''}
                  <span class="pill-tag pill-shell">🔗 \${s.properties_count} SISTER SHELLS</span>
                </div>
              </div>

              <!-- Pillar 3: Labor Exploitation -->
              <div class="pillar-box">
                <div>
                  <div class="pillar-header labor">
                    <span>⚖️ Labor Exploitation Profile</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-row-key">Enforcement Action:</span>
                    <span class="stat-row-val" style="color: #f87171;">\${s.case_id}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-row-key">Violation Type:</span>
                    <span class="stat-row-val">\${s.violation_type}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-row-key">Stolen Wages Recovered:</span>
                    <span class="stat-row-val" style="color: #34d399;">$\${parseFloat(s.total_wage_theft_recovered || 0).toLocaleString()}</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-row-key">Affected Workforce:</span>
                    <span class="stat-row-val">\${s.workers_affected} Workers</span>
                  </div>
                  <div style="margin-top: 12px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.4;">
                    \${s.labor_narrative}
                  </div>
                </div>

                <div style="margin-top: 14px;">
                  <span class="pill-tag pill-tier3">🚨 CONFIRMED WAGE THEFT</span>
                  <span class="pill-tag" style="background: rgba(192, 132, 252, 0.15); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.3);">\${s.source_agency}</span>
                </div>
              </div>

              <!-- Action Strategy Footer -->
              <div class="action-plan-box">
                <div>
                  <div class="action-title">✊ Recommended Joint Organizing Action</div>
                  <div class="action-desc">\${s.organizing_playbook}</div>
                </div>
                <button onclick="window.open('https://twin-cities-wage-theft-worker.a-8c6.workers.dev', '_blank')" class="cta-btn" style="background: #c084fc; color: #070a11;">
                  Join Worker-Tenant Coalition ↗
                </button>
              </div>
            </div>
          \`;
        }).join('');

      } catch (err) {
        container.innerHTML = \`<div style="color: #ef4444; padding: 20px;">Failed to load crossover matrix: \${err.message}</div>\`;
      }
    }

    async function submitDualReport(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const res = document.getElementById('reportResult');

      btn.disabled = true;
      btn.innerText = 'Submitting report...';
      res.innerHTML = '';

      const payload = {
        employer_name: document.getElementById('reportEmployer').value.trim(),
        worksite_address: document.getElementById('reportAddress').value.trim(),
        housing_issues: document.getElementById('reportHousing').value.trim(),
        labor_issues: document.getElementById('reportLabor').value.trim(),
        narrative: document.getElementById('reportNarrative').value.trim(),
        contact: document.getElementById('reportContact').value.trim()
      };

      try {
        const resp = await fetch('/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (resp.ok) {
          res.innerHTML = \`<span style="color: #34d399;">✅ Dual exploitation report received! Tracking Ticket #\${data.report_id}. Thank you for documenting both housing and labor violations.</span>\`;
          document.getElementById('dualReportForm').reset();
        } else {
          res.innerHTML = \`<span style="color: #f87171;">Error: \${data.error || 'Server error'}</span>\`;
        }
      } catch (err) {
        res.innerHTML = \`<span style="color: #f87171;">Network error: \${err.message}</span>\`;
      } finally {
        btn.disabled = false;
        btn.innerText = 'Submit Joint Exploitation Report';
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') executeSearch();
    });
  </script>
</body>
</html>
`;
}
