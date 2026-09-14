export function renderWageTheftUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twin Cities Wage Theft & Labor Standards Registry</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111726;
      --card-border: #1e293b;
      --text: #f1f5f9;
      --text-dim: #94a3b8;
      --primary: #ef4444;
      --primary-hover: #dc2626;
      --accent-green: #10b981;
      --accent-green-bg: rgba(16, 185, 129, 0.12);
      --accent-blue: #38bdf8;
      --accent-blue-bg: rgba(56, 189, 248, 0.12);
      --accent-amber: #f59e0b;
      --accent-amber-bg: rgba(245, 158, 11, 0.12);
      --accent-purple: #a855f7;
      --accent-purple-bg: rgba(168, 85, 247, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 0 0 60px 0;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

    /* Header */
    header {
      background: linear-gradient(180deg, #1c131a 0%, #090d16 100%);
      border-bottom: 1px solid var(--card-border);
      padding: 40px 0 30px 0;
      text-align: center;
    }
    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      margin-bottom: 16px;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 12px;
      background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: var(--text-dim);
      font-size: 1.05rem;
      max-width: 780px;
      margin: 0 auto 24px auto;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin: 24px 0 32px 0;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .stat-val {
      font-size: 1.6rem;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #38bdf8;
    }
    .stat-val.red { color: #f87171; }
    .stat-val.green { color: #34d399; }
    .stat-val.amber { color: #fbbf24; }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }

    /* Navigation & Tabs */
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
      font-weight: 600;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.05);
    }
    .tab-btn.active {
      color: #fff;
      background: rgba(239, 68, 68, 0.18);
      border: 1px solid rgba(239, 68, 68, 0.35);
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
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      color: var(--text);
      font-size: 1rem;
      padding: 14px 18px;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
    .search-btn {
      background: #ef4444;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      padding: 0 24px;
      cursor: pointer;
      transition: background-color 0.15s;
    }
    .search-btn:hover { background: #dc2626; }

    /* Filter Chips */
    .chips-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 14px;
      align-items: center;
    }
    .chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-dim);
      font-size: 0.8rem;
      padding: 4px 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover, .chip.active {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      border-color: rgba(239, 68, 68, 0.4);
    }

    /* Cards Grid */
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .case-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .case-card:hover {
      border-color: #ef4444;
      transform: translateY(-2px);
    }
    .case-header-tags {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
      gap: 6px;
    }
    .agency-tag {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      background: var(--accent-blue-bg);
      color: var(--accent-blue);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .violation-tag {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .repeat-tag {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 9999px;
      background: #ef4444;
      color: #fff;
      text-transform: uppercase;
    }
    .employer-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
    }
    .trade-name {
      font-size: 0.85rem;
      color: #38bdf8;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .narrative-box {
      background: rgba(0, 0, 0, 0.25);
      border-left: 3px solid #ef4444;
      padding: 10px 12px;
      border-radius: 0 8px 8px 0;
      font-size: 0.85rem;
      color: #cbd5e1;
      margin-bottom: 14px;
    }
    .financial-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 14px;
    }
    .fin-item-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 1rem;
      font-weight: 800;
    }
    .fin-item-val.green { color: #34d399; }
    .fin-item-val.red { color: #f87171; }
    .fin-item-lbl {
      font-size: 0.7rem;
      color: var(--text-dim);
      text-transform: uppercase;
    }
    .card-footer {
      border-top: 1px solid var(--card-border);
      padding-top: 12px;
      font-size: 0.75rem;
      color: var(--text-dim);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .link-btn {
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .link-btn:hover { text-decoration: underline; }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      background: var(--card-bg);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--card-border);
    }
    .data-table th {
      background: #172033;
      padding: 12px 16px;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-dim);
      border-bottom: 1px solid var(--card-border);
    }
    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--card-border);
      font-size: 0.85rem;
    }
    .data-table tr:hover { background: rgba(255, 255, 255, 0.02); }

    /* Form Styles */
    .form-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 30px;
      max-width: 800px;
      margin: 0 auto;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 6px;
      color: #e2e8f0;
    }
    .form-input, .form-textarea, .form-select {
      width: 100%;
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: var(--text);
      font-size: 0.95rem;
      padding: 12px 14px;
      outline: none;
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #cbd5e1;
    }

    .notice-box {
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 8px;
      padding: 14px;
      font-size: 0.85rem;
      color: #93c5fd;
      margin-bottom: 24px;
    }
    .submit-btn {
      background: #ef4444;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      padding: 14px 28px;
      font-size: 1rem;
      cursor: pointer;
      width: 100%;
      transition: background-color 0.15s;
    }
    .submit-btn:hover { background: #dc2626; }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-dim);
    }
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
      <div class="badge-tag">🚨 MINNESOTA LABOR STANDARDS & WORKER PROTECTION</div>
      <h1>Twin Cities Wage Theft & Labor Standards Registry</h1>
      <p class="subtitle">
        Public database of civil judgments, administrative citations, and consent decrees 
        targeting residential property managers, rental slumlords, turnover cleaning services, and multi-family subcontractors.
      </p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val green" id="statRecovered">$1,073,420</div>
          <div class="stat-label">Back Wages Recovered</div>
        </div>
        <div class="stat-card">
          <div class="stat-val red" id="statPenalties">$220,300</div>
          <div class="stat-label">Civil Penalties Assessed</div>
        </div>
        <div class="stat-card">
          <div class="stat-val amber" id="statWorkers">386</div>
          <div class="stat-label">Workers & Caretakers Affected</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" id="statCases">14</div>
          <div class="stat-label">Confirmed Violations</div>
        </div>
      </div>
    </div>
  </header>

  <main class="container" style="margin-top: 24px;">
    <!-- Navigation Tabs -->
    <div class="tabs-bar">
      <button class="tab-btn active" onclick="switchTab('cases')">⚖️ Enforcement Cases</button>
      <button class="tab-btn" onclick="switchTab('offenders')">🏆 Top Corporate Violators</button>
      <button class="tab-btn" onclick="switchTab('report')">📢 Report Wage Theft (Confidential)</button>
      <button class="tab-btn" onclick="switchTab('api')">⚡ REST API & CSV</button>
      <a href="https://mpls-rental-sync-worker.a-8c6.workers.dev" target="_blank" class="tab-btn" style="margin-left: auto; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
        🏢 Landlord De-anonymizer ↗
      </a>
      <a href="/export.csv" class="tab-btn" style="color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
        📥 Export CSV
      </a>
    </div>

    <!-- TAB 1: CASES -->
    <div id="casesTab" class="tab-pane active">
      <div class="search-section">
        <div class="search-row">
          <input type="text" id="searchInput" class="search-input" placeholder="Search by employer name, trade name, case ID, or violation description..." value="">
          <button class="search-btn" onclick="executeSearch()">Search</button>
        </div>
        <div class="chips-row">
          <span style="font-size: 0.8rem; color: var(--text-dim); margin-right: 4px;">Quick Filters:</span>
          <button class="chip" onclick="quickFilter('')">All Cases</button>
          <button class="chip" onclick="quickFilter('Dominium')">Dominium</button>
          <button class="chip" onclick="quickFilter('Fitterer')">Fitterer / IPG Living</button>
          <button class="chip" onclick="quickFilter('Caretaker')">Caretaker Rent Deductions</button>
          <button class="chip" onclick="quickFilter('Misclassification')">1099 Misclassification</button>
          <button class="chip" onclick="quickFilter('Overtime')">Unpaid Overtime</button>
          <button class="chip" onclick="quickFilter('Repeat')">Repeat Violators</button>
        </div>
      </div>

      <div id="searchResultsCount" style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 12px;"></div>
      <div id="casesGrid" class="results-grid"></div>
    </div>

    <!-- TAB 2: TOP OFFENDERS -->
    <div id="offendersTab" class="tab-pane">
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 1.4rem; font-weight: 700;">Top Wage Theft Corporate Offenders</h2>
        <p style="color: var(--text-dim); font-size: 0.9rem;">Ranked by total back wages recovered plus civil enforcement penalties.</p>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Employer / Legal Name</th>
            <th>Trade Name / Industry</th>
            <th>Location</th>
            <th style="text-align: right;">Back Wages</th>
            <th style="text-align: right;">Penalties</th>
            <th style="text-align: right;">Total Judgment</th>
            <th style="text-align: right;">Workers</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="offendersTableBody"></tbody>
      </table>
    </div>

    <!-- TAB 3: REPORT WAGE THEFT -->
    <div id="reportTab" class="tab-pane">
      <div class="form-card">
        <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;">File a Confidential Wage Theft Report</h2>
        <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 20px;">
          Are you a building caretaker, turnover cleaner, maintenance technician, or residential construction laborer who was denied pay, forced to work off-the-clock, or had illegal rent deducted? Submit your incident here for organizer review.
        </p>

        <div class="notice-box">
          🛡️ <strong>Worker Privacy Guarantee:</strong> Submissions are stored directly in encrypted database storage. We never sell or share worker contact details with employers or immigration authorities.
        </div>

        <form id="wageTheftForm" onsubmit="submitReport(event)">
          <div class="form-group">
            <label class="form-label">Employer or Property Management Company *</label>
            <input type="text" id="reportEmployer" class="form-input" required placeholder="e.g. Dominium, IPG Living, or sub-contractor name">
          </div>

          <div class="form-group">
            <label class="form-label">Worksite Address or Apartment Complex Name</label>
            <input type="text" id="reportAddress" class="form-input" placeholder="e.g. 2312 Blaisdell Ave, Minneapolis, MN">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" id="reportCity" class="form-input" value="Minneapolis">
            </div>
            <div class="form-group">
              <label class="form-label">Your Job Role / Title</label>
              <input type="text" id="reportJobTitle" class="form-input" placeholder="e.g. Resident Caretaker, Turnover Cleaner">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Type of Labor Violations (Select all that apply) *</label>
            <div class="checkbox-grid">
              <label class="checkbox-item"><input type="checkbox" name="violations" value="UNPAID_OVERTIME"> Unpaid Overtime (over 40 hrs)</label>
              <label class="checkbox-item"><input type="checkbox" name="violations" value="OFF_THE_CLOCK"> Off-the-clock On-Call / Emergency</label>
              <label class="checkbox-item"><input type="checkbox" name="violations" value="RENT_DEDUCTION"> Illegal Rent Deduction for Unit</label>
              <label class="checkbox-item"><input type="checkbox" name="violations" value="SUB_MINIMUM_WAGE"> Paid Below Minimum Wage</label>
              <label class="checkbox-item"><input type="checkbox" name="violations" value="MISCLASSIFICATION"> Misclassified as 1099 Contractor</label>
              <label class="checkbox-item"><input type="checkbox" name="violations" value="SICK_TIME_DENIED"> Denied Earned Sick & Safe Time</label>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Estimated Unpaid Wages ($)</label>
              <input type="number" id="reportAmount" class="form-input" placeholder="e.g. 2500" step="0.01">
            </div>
            <div class="form-group">
              <label class="form-label">Weeks Worked for Employer</label>
              <input type="number" id="reportWeeks" class="form-input" placeholder="e.g. 24">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">What Happened? (Detailed Narrative) *</label>
            <textarea id="reportNarrative" class="form-textarea" rows="4" required placeholder="Describe how your hours were cut, deductions taken, or on-call duties mandated without pay..."></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label class="form-label">Your Email (Optional)</label>
              <input type="email" id="reportEmail" class="form-input" placeholder="organizer will reply here">
            </div>
            <div class="form-group">
              <label class="form-label">Your Phone Number (Optional)</label>
              <input type="tel" id="reportPhone" class="form-input" placeholder="Optional callback number">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Union Affiliation (If applicable)</label>
            <select id="reportUnion" class="form-select">
              <option value="NON_UNION">Non-union / Independent Worker</option>
              <option value="CTUL">CTUL (Centro de Trabajadores Unidos en la Lucha)</option>
              <option value="SEIU_26">SEIU Local 26</option>
              <option value="NORTH_CENTRAL_CARPENTERS">North Central States Regional Council of Carpenters</option>
              <option value="OTHER">Other Labor Organization</option>
            </select>
          </div>

          <button type="submit" class="submit-btn" id="submitBtn">Submit Confidential Incident Report</button>
          <div id="submitResult" style="margin-top: 16px; font-weight: 600;"></div>
        </form>
      </div>
    </div>

    <!-- TAB 4: API & EXPORT -->
    <div id="apiTab" class="tab-pane">
      <div class="search-section">
        <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px;">Developer & Organizer REST API</h2>
        <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 20px;">
          All labor standards and wage theft records are publicly queryable via REST JSON endpoints.
        </p>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: #090d16; padding: 14px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-family: 'JetBrains Mono', monospace; color: #34d399; font-weight: 700;">GET /cases?q={search}&agency={agency}&repeat={true}</div>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-top: 4px;">Search enforcement cases with keyword and filters.</div>
          </div>

          <div style="background: #090d16; padding: 14px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-family: 'JetBrains Mono', monospace; color: #34d399; font-weight: 700;">GET /offenders/top</div>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-top: 4px;">Ranked list of top corporate offenders by total recovery amount.</div>
          </div>

          <div style="background: #090d16; padding: 14px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-family: 'JetBrains Mono', monospace; color: #34d399; font-weight: 700;">GET /export.csv</div>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-top: 4px;">Complete CSV dataset stream for researchers and newsrooms.</div>
          </div>

          <div style="background: #090d16; padding: 14px; border-radius: 8px; border: 1px solid var(--card-border);">
            <div style="font-family: 'JetBrains Mono', monospace; color: #34d399; font-weight: 700;">POST /report</div>
            <div style="color: var(--text-dim); font-size: 0.85rem; margin-top: 4px;">JSON webhook to intake confidential wage theft reports.</div>
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

      if (tabId === 'offenders') loadTopOffenders();
    }

    function quickFilter(q) {
      document.getElementById('searchInput').value = q;
      executeSearch();
    }

    async function executeSearch() {
      const q = document.getElementById('searchInput').value.trim();
      const grid = document.getElementById('casesGrid');
      const countEl = document.getElementById('searchResultsCount');

      grid.innerHTML = '<div class="loading"><div class="spinner"></div>Searching labor standards enforcement records...</div>';

      try {
        const resp = await fetch('/cases?q=' + encodeURIComponent(q));
        const data = await resp.json();
        const cases = data.cases || [];

        countEl.innerHTML = \`Found <strong>\${cases.length}</strong> wage theft enforcement actions\`;

        if (cases.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim);">No cases found matching query.</div>';
          return;
        }

        grid.innerHTML = cases.map(c => {
          const totalRecovered = (parseFloat(c.back_wages_recovered || 0) + parseFloat(c.civil_penalties_assessed || 0)).toLocaleString(undefined, {minimumFractionDigits: 2});
          const backWages = parseFloat(c.back_wages_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
          const penalties = parseFloat(c.civil_penalties_assessed || 0).toLocaleString(undefined, {minimumFractionDigits: 2});

          return \`
            <div class="case-card">
              <div>
                <div class="case-header-tags">
                  <span class="agency-tag">\${c.source_agency}</span>
                  <span class="violation-tag">\${c.violation_type}</span>
                  \${c.repeat_violator ? '<span class="repeat-tag">REPEAT VIOLATOR</span>' : ''}
                </div>

                <div class="employer-name">\${c.respondent_legal_name}</div>
                <div class="trade-name">d/b/a \${c.trade_name || 'N/A'} • \${c.city || 'Twin Cities'}, \${c.state || 'MN'}</div>

                <div class="narrative-box">
                  \${c.description || 'Confirmed wage theft citation under state/federal statutes.'}
                </div>

                <div class="financial-grid">
                  <div>
                    <div class="fin-item-val green">$\${backWages}</div>
                    <div class="fin-item-lbl">Back Wages Recovered</div>
                  </div>
                  <div>
                    <div class="fin-item-val red">$\${penalties}</div>
                    <div class="fin-item-lbl">Civil Penalties</div>
                  </div>
                  <div>
                    <div class="fin-item-val" style="color:#fbbf24;">\${c.workers_affected || 0} Workers</div>
                    <div class="fin-item-lbl">Affected Workforce</div>
                  </div>
                  <div>
                    <div class="fin-item-val" style="color:#38bdf8;">\${c.status}</div>
                    <div class="fin-item-lbl">Status</div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <span>Case: \${c.case_id}</span>
                <a href="https://mpls-rental-sync-worker.a-8c6.workers.dev/search?q=\${encodeURIComponent(c.trade_name || c.respondent_legal_name)}" target="_blank" class="link-btn">
                  Inspect Landlord Links 🔍
                </a>
              </div>
            </div>
          \`;
        }).join('');

      } catch (err) {
        grid.innerHTML = \`<div style="color: #ef4444; padding: 20px;">Failed to load cases: \${err.message}</div>\`;
      }
    }

    async function loadTopOffenders() {
      const tbody = document.getElementById('offendersTableBody');
      tbody.innerHTML = '<tr><td colspan="8" class="loading"><div class="spinner"></div>Loading top violators...</td></tr>';

      try {
        const resp = await fetch('/offenders/top');
        const data = await resp.json();
        const offenders = data.top_offenders || [];

        tbody.innerHTML = offenders.map(o => \`
          <tr>
            <td><strong>\${o.respondent_legal_name}</strong></td>
            <td>\${o.trade_name || 'N/A'}<br><span style="font-size:0.75rem; color:var(--text-dim);">\${o.industry_description || 'Property Services'}</span></td>
            <td>\${o.city}, \${o.state}</td>
            <td style="text-align: right; font-weight: 700; color: #34d399;">$\${parseFloat(o.total_back_wages || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td style="text-align: right; font-weight: 700; color: #f87171;">$\${parseFloat(o.total_penalties || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td style="text-align: right; font-weight: 800; color: #fbbf24;">$\${parseFloat(o.total_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td style="text-align: right; font-weight: 600;">\${o.total_workers_affected}</td>
            <td>\${o.is_repeat_violator ? '<span class="repeat-tag">REPEAT</span>' : '<span style="color:var(--text-dim); font-size:0.8rem;">CONFIRMED</span>'}</td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = \`<tr><td colspan="8" style="color: red;">Error: \${e.message}</td></tr>\`;
      }
    }

    async function submitReport(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const res = document.getElementById('submitResult');

      const checkboxes = Array.from(document.querySelectorAll('input[name="violations"]:checked')).map(cb => cb.value);
      if (checkboxes.length === 0) {
        res.innerHTML = '<span style="color: #f87171;">Please select at least one violation type.</span>';
        return;
      }

      btn.disabled = true;
      btn.innerText = 'Submitting report...';
      res.innerHTML = '';

      const payload = {
        employer_name: document.getElementById('reportEmployer').value.trim(),
        worksite_address: document.getElementById('reportAddress').value.trim(),
        city: document.getElementById('reportCity').value.trim(),
        job_title: document.getElementById('reportJobTitle').value.trim(),
        violation_types: checkboxes.join(','),
        estimated_unpaid_amount: parseFloat(document.getElementById('reportAmount').value || '0'),
        weeks_worked: parseInt(document.getElementById('reportWeeks').value || '0', 10),
        narrative: document.getElementById('reportNarrative').value.trim(),
        contact_email: document.getElementById('reportEmail').value.trim(),
        contact_phone: document.getElementById('reportPhone').value.trim(),
        union_affiliation: document.getElementById('reportUnion').value
      };

      try {
        const resp = await fetch('/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await resp.json();
        if (resp.ok) {
          res.innerHTML = \`<span style="color: #34d399;">✅ Incident report successfully received! Tracking ID: #\${data.report_id}. An organizer will review this file confidentially.</span>\`;
          document.getElementById('wageTheftForm').reset();
        } else {
          res.innerHTML = \`<span style="color: #f87171;">Submission error: \${data.error || 'Server rejected request'}</span>\`;
        }
      } catch (err) {
        res.innerHTML = \`<span style="color: #f87171;">Network error: \${err.message}</span>\`;
      } finally {
        btn.disabled = false;
        btn.innerText = 'Submit Confidential Incident Report';
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
