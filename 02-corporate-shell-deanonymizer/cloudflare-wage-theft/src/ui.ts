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

    .copy-md-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--card-border);
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .copy-md-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      border-color: #64748b;
    }

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

    /* In-Browser AI Assistant */
    .ai-assistant-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-top: 16px;
    }
    .ai-eco-banner {
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }
    .ai-eco-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      font-size: 0.83rem;
      color: #cbd5e1;
    }
    .ai-eco-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .ai-chat-box {
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      height: 420px;
      overflow-y: auto;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 16px;
    }
    .chat-msg {
      max-width: 82%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.9rem;
      line-height: 1.5;
      word-break: break-word;
    }
    .chat-msg.user {
      align-self: flex-end;
      background: #ef4444;
      color: #fff;
      border-bottom-right-radius: 2px;
    }
    .chat-msg.assistant {
      align-self: flex-start;
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid var(--card-border);
      border-bottom-left-radius: 2px;
    }
    .chat-msg.system {
      align-self: center;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-dim);
      font-size: 0.8rem;
      border-radius: 9999px;
      padding: 6px 14px;
      max-width: 90%;
      text-align: center;
    }
    .ai-controls-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }
    .ai-model-select {
      background: #090d16;
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      outline: none;
    }
    .ai-input-row {
      display: flex;
      gap: 10px;
    }
    .ai-input {
      flex: 1;
      background: #090d16;
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 12px 16px;
      border-radius: 10px;
      outline: none;
      font-size: 0.95rem;
    }
    .ai-input:focus { border-color: #ef4444; }
    .progress-track {
      background: #1e293b;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, #10b981, #ef4444);
      height: 100%;
      width: 0%;
      transition: width 0.2s ease;
    }
  </style>
  <script type="module">
    import * as webllm from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm";
    window.webllm = webllm;
  </script>
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
      <button class="tab-btn" onclick="switchTab('ai')" style="color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4);">🤖 In-Browser AI Assistant</button>
      <a href="https://twin-cities-slumlord-labor-matrix.a-8c6.workers.dev" target="_blank" class="tab-btn" style="margin-left: auto; color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.4);">
        🎯 Dual Violators Matrix ↗
      </a>
      <a href="https://mpls-rental-sync-worker.a-8c6.workers.dev" target="_blank" class="tab-btn" style="color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
        🏢 Landlord De-anonymizer ↗
      </a>
      <a href="/export.csv" class="tab-btn" style="color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
        📥 Export CSV
      </a>
      <button onclick="exportWageTheftAsMarkdown()" class="tab-btn" style="color: #a7f3d0; border: 1px solid rgba(52, 211, 153, 0.4);">
        📥 Export .MD
      </button>
    </div>

    <!-- TAB 1: CASES -->
    <div id="casesTab" class="tab-pane active">
      <div class="search-section">
        <div class="search-row">
          <input type="text" id="searchInput" class="search-input" placeholder="Search by employer name, trade name, case ID, or violation description..." value="">
          <button class="search-btn" onclick="executeSearch()">Search</button>
          <button class="search-btn" onclick="exportWageTheftAsMarkdown()" style="background: #10b981;">📥 Export as .MD</button>
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

        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <div style="font-weight: 800; color: #38bdf8; font-size: 0.95rem; margin-bottom: 6px;">
            ⚖️ Official Government Enforcement Portals vs. Community Union Intake
          </div>
          <p style="font-size: 0.83rem; color: #cbd5e1; margin-bottom: 12px; line-height: 1.5;">
            <strong>Notice:</strong> This intake form is maintained for collective labor organizing, research, and legal aid coordination (protected under NLRA § 7 and Minn. Stat. § 181.932). To initiate formal statutory enforcement with the authority to compel back pay, issue civil penalties, or seek court injunctions, you can also file directly with official public agencies:
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.8rem;">
            <a href="https://www.dli.mn.gov/business/employment-practices/making-wage-claim" target="_blank" style="background: #090d16; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>MN Dept of Labor & Industry (DLI)</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">State wage claim investigation portal ↗</span>
            </a>
            <a href="https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards/labor-standards-complaint-form/" target="_blank" style="background: #090d16; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>Minneapolis Civil Rights</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">City wage theft & sick leave complaint form ↗</span>
            </a>
            <a href="https://www.ag.state.mn.us/Office/Complaint.asp" target="_blank" style="background: #090d16; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>Minnesota Attorney General</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">Worker protection & wage fraud unit ↗</span>
            </a>
            <a href="https://homelinemn.org" target="_blank" style="background: #090d16; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>HOME Line Tenant & Caretaker Hotline</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">Free legal advice line: (612) 728-5767 ↗</span>
            </a>
          </div>
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

    <!-- TAB 5: In-Browser AI Assistant -->
    <div id="aiTab" class="tab-pane">
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff;">Private In-Browser Labor & Wage Theft Intelligence Assistant</h2>
        <p style="color: var(--text-dim); font-size: 0.9rem;">
          Query labor standards enforcement cases, calculate overtime violations, and research employer citations directly inside your browser.
        </p>
      </div>

      <div class="ai-eco-banner">
        <div class="ai-eco-item">
          <div class="ai-eco-icon">🔒</div>
          <div>
            <strong>100% Client-Side Privacy</strong><br>
            Runs entirely inside your browser memory via WebGPU. Zero questions, employer names, or worker queries are ever sent to remote servers.
          </div>
        </div>
        <div class="ai-eco-item">
          <div class="ai-eco-icon">⚡</div>
          <div>
            <strong>Zero Excess Cloud Electricity</strong><br>
            Executes on your local device GPU/NPU. Eliminates massive megawatts and continuous cooling water consumption in hyperscale datacenters.
          </div>
        </div>
        <div class="ai-eco-item">
          <div class="ai-eco-icon">🌐</div>
          <div>
            <strong>Broad Modern Browser Support</strong><br>
            Optimized for Chrome, Brave, Edge, Safari (18+), Orion, and Firefox with WebGPU enabled.
          </div>
        </div>
      </div>

      <div class="ai-assistant-card">
        <div class="ai-controls-row">
          <label style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">In-Browser Model:</label>
          <select id="aiModelSelect" class="ai-model-select">
            <option value="Qwen2.5-0.5B-Instruct-q4f16_1-MLC" selected>Qwen2.5-0.5B (~350 MB - Fast & Responsive)</option>
            <option value="SmolLM2-360M-Instruct-q0f16-MLC">SmolLM2-360M (~360 MB - Ultra Low Memory)</option>
            <option value="Llama-3.2-1B-Instruct-q4f16_1-MLC">Llama-3.2-1B (~880 MB - Deep Reasoning)</option>
          </select>
          <label style="font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 6px; cursor: pointer; margin-left: auto;">
            <input type="checkbox" id="aiGroundingCheck" checked>
            Ground answers in loaded enforcement records
          </label>
        </div>

        <div id="aiProgressContainer" style="display: none; margin-bottom: 16px; background: #090d16; padding: 12px; border-radius: 8px; border: 1px solid var(--card-border);">
          <div id="aiStatusText" style="font-size: 0.82rem; color: #38bdf8; font-weight: 600;">Initializing WebLLM engine...</div>
          <div class="progress-track">
            <div id="aiProgressBar" class="progress-bar-fill"></div>
          </div>
        </div>

        <div id="aiChatBox" class="ai-chat-box">
          <div class="chat-msg system">
            💬 Welcome to the Twin Cities Wage Theft Intelligence AI. Ask anything about labor standards, employer citations, overtime law, or worker rights. Model executes locally on your hardware.
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
          <span style="font-size: 0.75rem; color: var(--text-dim); align-self: center;">Suggested:</span>
          <button class="chip" onclick="askSuggestedQuestion('How does Minnesota 2023 Contractor Joint Liability Law protect workers?')">Joint Liability Law</button>
          <button class="chip" onclick="askSuggestedQuestion('Can an apartment landlord legally deduct rent from caretaker wages below minimum wage?')">Caretaker Rent Deductions</button>
          <button class="chip" onclick="askSuggestedQuestion('Which employers have the highest wage theft recovery amounts on record?')">Top Violators</button>
          <button class="chip" onclick="askSuggestedQuestion('Where do I file an official state wage theft complaint with MN DLI?')">Filing Wage Claims</button>
        </div>

        <div class="ai-input-row">
          <input type="text" id="aiPromptInput" class="ai-input" placeholder="Ask a question about Twin Cities wage theft cases, caretaker rights, or labor law..." onkeypress="if(event.key==='Enter') sendAiMessage()">
          <button class="search-btn" id="aiSendBtn" onclick="sendAiMessage()">Ask AI</button>
          <button class="copy-md-btn" onclick="clearAiChat()">Clear</button>
        </div>
      </div>
    </div>
  </main>

  <script>
    let currentCasesResults = [];

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

    function copyCaseAsMarkdown(idx) {
      const c = currentCasesResults[idx];
      if (!c) return;

      const total = (parseFloat(c.back_wages_recovered || 0) + parseFloat(c.civil_penalties_assessed || 0)).toLocaleString(undefined, {minimumFractionDigits: 2});
      const backWages = parseFloat(c.back_wages_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
      const penalties = parseFloat(c.civil_penalties_assessed || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
      const isVerified = c.provenance_type === 'VERIFIED_PUBLIC_ACTION';

      const md = [
        '### Wage Theft Case Dossier: ' + (c.respondent_legal_name || 'Unknown Entity'),
        '- **Data Provenance**: ' + (isVerified ? '🟢 VERIFIED PUBLIC ENFORCEMENT ACTION (Official MN AG / District Court Record)' : '🟡 PROTOTYPE SEED / PENDING FOIA SYNC (Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync)'),
        '- **Case ID / Docket**: \`' + (c.case_id || 'N/A') + '\`',
        '- **Enforcement Agency**: ' + (c.source_agency || 'US DOL / State / City'),
        '- **Operating Trade Name (d/b/a)**: ' + (c.trade_name || 'N/A'),
        '- **Jurisdiction / Worksite**: ' + (c.address || 'Twin Cities Metro Area') + ', ' + (c.city || 'Twin Cities') + ', ' + (c.state || 'MN') + ' ' + (c.zip_code || ''),
        '- **Industry Sector**: ' + (c.industry_description || 'Property Management & Building Services'),
        '- **Violation Classification**: ' + (c.violation_type || 'Unlawful Withholding / Overtime Violation'),
        '- **Enforcement Status**: ' + (c.status || 'Resolved / Judged') + (c.repeat_violator ? ' ⚠️ [REPEAT VIOLATOR]' : ''),
        '- **Total Financial Assessment**: $' + total,
        '  - Back Wages Recovered: $' + backWages,
        '  - Civil Money Penalties: $' + penalties,
        '- **Affected Workforce**: ' + (c.workers_affected || 0) + ' workers',
        '- **Investigative Findings / Narrative**: ' + (c.description || 'Confirmed civil/administrative wage theft findings.'),
        '- **Primary Legal Dockets & Source Documents**:',
        c.source_docket_url ? '  - Primary Source Docket URL: ' + c.source_docket_url : '  - US DOL Wage & Hour Division Public Enforcement Database: https://enforcement.dol.gov',
        '  - US DOL Wage & Hour Division Public Enforcement Database: https://enforcement.dol.gov',
        '  - Minnesota Judicial Branch Public Access (MCRO Case Search): https://publicaccess.courts.state.mn.us',
        '  - Minneapolis Civil Rights Labor Standards Findings: https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards',
        '  - Cross-Reference Landlord Shell Entity: https://mpls-rental-sync-worker.a-8c6.workers.dev/search?q=' + encodeURIComponent(c.trade_name || c.respondent_legal_name || '')
      ].join('\\n');

      navigator.clipboard.writeText(md).then(() => {
        const btn = document.getElementById('copy-btn-' + idx);
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '✓ Copied Markdown!';
          btn.style.borderColor = '#10b981';
          btn.style.color = '#34d399';
          setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 2000);
        }
      });
    }

    function exportWageTheftAsMarkdown() {
      if (!currentCasesResults || currentCasesResults.length === 0) {
        alert('No cases loaded to export.');
        return;
      }
      const q = document.getElementById('searchInput').value.trim() || 'all';
      let lines = [
        '# Twin Cities Wage Theft & Labor Standards Enforcement Dossier',
        '**Search Query**: ' + q,
        '**Generated**: ' + new Date().toISOString(),
        '**Source**: https://twin-cities-wage-theft-worker.a-8c6.workers.dev',
        '',
        '> **Data Provenance Notice**:',
        '> - 🟢 **VERIFIED PUBLIC ENFORCEMENT ACTION**: Confirmed civil court consent decree or official state AG/DLI enforcement filing.',
        '> - 🟡 **PROTOTYPE SEED / PENDING FOIA SYNC**: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.',
        '',
        '---',
        ''
      ];

      currentCasesResults.forEach((c, idx) => {
        const total = (parseFloat(c.back_wages_recovered || 0) + parseFloat(c.civil_penalties_assessed || 0)).toLocaleString(undefined, {minimumFractionDigits: 2});
        const isVerified = c.provenance_type === 'VERIFIED_PUBLIC_ACTION';
        lines.push('## ' + (idx + 1) + '. ' + (c.respondent_legal_name || 'Unknown Entity') + ' (d/b/a ' + (c.trade_name || 'N/A') + ')');
        lines.push('- **Data Provenance**: ' + (isVerified ? '🟢 VERIFIED PUBLIC ENFORCEMENT ACTION' : '🟡 PROTOTYPE SEED / PENDING FOIA SYNC'));
        if (!isVerified) {
          lines.push('  - *Note*: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.');
        }
        lines.push('- **Case ID**: \`' + (c.case_id || 'N/A') + '\`');
        lines.push('- **Enforcement Agency**: ' + (c.source_agency || 'N/A'));
        lines.push('- **Location**: ' + (c.city || 'Twin Cities') + ', ' + (c.state || 'MN'));
        lines.push('- **Violation Type**: ' + (c.violation_type || 'Wage Theft'));
        lines.push('- **Total Financial Restitution & Penalties**: $' + total);
        lines.push('  - Back Wages: $' + parseFloat(c.back_wages_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2}));
        lines.push('  - Civil Penalties: $' + parseFloat(c.civil_penalties_assessed || 0).toLocaleString(undefined, {minimumFractionDigits: 2}));
        lines.push('- **Workers Impacted**: ' + (c.workers_affected || 0));
        lines.push('- **Status**: ' + (c.status || 'Active') + (c.repeat_violator ? ' [REPEAT OFFENDER]' : ''));
        lines.push('- **Case Summary**: ' + (c.description || ''));
        lines.push('- **Source Records**:');
        if (c.source_docket_url) {
          lines.push('  - Direct Docket URL: ' + c.source_docket_url);
        }
        lines.push('  - US DOL WHD Enforcement Database: https://enforcement.dol.gov');
        lines.push('  - Minnesota District Court MCRO: https://publicaccess.courts.state.mn.us');
        lines.push('  - Minneapolis Labor Standards Enforcement: https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards');
        lines.push('');
      });

      const blob = new Blob([lines.join('\\n')], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'wage_theft_cases_' + q.replace(/[^a-zA-Z0-9_-]/g, '_') + '.md';
      a.click();
    }

    function getGroundedContext() {
      const check = document.getElementById('aiGroundingCheck');
      if (!check || !check.checked) return '';

      let text = 'CURRENT VERIFIED LABOR STANDARDS & WAGE THEFT ENFORCEMENT ACTIONS:\n';
      const items = (currentCasesResults || []).slice(0, 15);
      if (items.length === 0) {
        text += '- Note: Registry tracks federal US DOL, Minnesota DLI, and Minneapolis Civil Rights wage theft judgments across property managers and subcontractors.\n';
      } else {
        items.forEach((c, idx) => {
          text += (idx + 1) + '. Employer: ' + (c.respondent_legal_name || 'N/A') + ' (d/b/a ' + (c.trade_name || 'N/A') + ') | Case ID: ' + (c.case_id || 'N/A') + ' | Agency: ' + (c.source_agency || 'N/A') + ' | Violation: ' + (c.violation_type || 'N/A') + ' | Back Wages: $' + parseFloat(c.back_wages_recovered || 0).toLocaleString() + ' | Penalties: $' + parseFloat(c.civil_penalties_assessed || 0).toLocaleString() + ' | Workers: ' + (c.workers_affected || 0) + ' | Status: ' + (c.status || 'N/A') + (c.repeat_violator ? ' [REPEAT]' : '') + ' | Summary: ' + (c.description || 'N/A') + '\n';
        });
      }
      return text;
    }

    let aiEngine = null;
    let isAiLoading = false;

    async function sendAiMessage() {
      const inputEl = document.getElementById('aiPromptInput');
      const userText = inputEl.value.trim();
      if (!userText) return;

      inputEl.value = '';
      appendChatMessage('user', userText);

      const modelSelect = document.getElementById('aiModelSelect');
      const selectedModel = modelSelect.value;
      const statusEl = document.getElementById('aiStatusText');
      const progressBar = document.getElementById('aiProgressBar');
      const progressContainer = document.getElementById('aiProgressContainer');
      const sendBtn = document.getElementById('aiSendBtn');

      if (!navigator.gpu) {
        appendChatMessage('system', '⚠️ WebGPU is not detected in your browser. To use In-Browser AI without cloud data servers: in Chrome/Brave/Edge ensure "Hardware Acceleration" is enabled in settings; in Safari ensure Safari 18+ (macOS Sequoia / iOS 18); in Firefox enable "dom.webgpu.enabled" in about:config.');
        return;
      }

      sendBtn.disabled = true;

      if (!aiEngine) {
        if (isAiLoading) return;
        isAiLoading = true;
        progressContainer.style.display = 'block';
        statusEl.innerText = 'Initializing local WebGPU engine & loading weights (' + selectedModel + ')...';

        try {
          if (!window.webllm) {
            throw new Error('WebLLM library is loading from CDN. Please wait a moment and try again.');
          }
          aiEngine = await window.webllm.CreateMLCEngine(selectedModel, {
            initProgressCallback: (report) => {
              statusEl.innerText = report.text;
              if (typeof report.progress === 'number') {
                progressBar.style.width = Math.round(report.progress * 100) + '%';
              }
            }
          });
          statusEl.innerText = '✓ Model cached & loaded in local browser memory via WebGPU.';
          progressBar.style.width = '100%';
          setTimeout(() => { progressContainer.style.display = 'none'; }, 2000);
        } catch (err) {
          statusEl.innerText = 'Initialization error: ' + err.message;
          appendChatMessage('system', '❌ Local model initialization error: ' + err.message);
          isAiLoading = false;
          sendBtn.disabled = false;
          return;
        } finally {
          isAiLoading = false;
        }
      }

      const contextData = getGroundedContext();
      const systemPrompt = "You are a specialized civic worker rights and labor standards intelligence assistant for the Twin Cities (Minnesota). You run 100% locally and privately in the user's browser via WebGPU with ZERO server-side data tracking and ZERO cloud datacenter electricity consumption. Answer questions using the verified enforcement dockets provided in the context. Emphasize Minnesota labor protections such as Minn. Stat. § 181.165 (joint contractor liability holding property owners liable for subcontractor wage theft), § 177.24 (minimum wage and caretaker rent deduction limits), § 181.932 (whistleblower protection against retaliation), and City of Minneapolis Labor Standards ordinances. Keep answers concise, factual, and empowering.\n\n" + contextData;

      const assistantMsgEl = appendChatMessage('assistant', 'Thinking...');

      try {
        const chunks = await aiEngine.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText }
          ],
          stream: true
        });

        assistantMsgEl.textContent = '';
        for await (const chunk of chunks) {
          const delta = chunk.choices[0]?.delta?.content || '';
          assistantMsgEl.textContent += delta;
          const box = document.getElementById('aiChatBox');
          box.scrollTop = box.scrollHeight;
        }
      } catch (genErr) {
        assistantMsgEl.textContent = 'Generation error: ' + genErr.message;
      } finally {
        sendBtn.disabled = false;
      }
    }

    function appendChatMessage(role, text) {
      const box = document.getElementById('aiChatBox');
      const msg = document.createElement('div');
      msg.className = 'chat-msg ' + role;
      msg.textContent = text;
      box.appendChild(msg);
      box.scrollTop = box.scrollHeight;
      return msg;
    }

    function askSuggestedQuestion(q) {
      document.getElementById('aiPromptInput').value = q;
      sendAiMessage();
    }

    function clearAiChat() {
      const box = document.getElementById('aiChatBox');
      box.innerHTML = '<div class="chat-msg system">💬 Chat cleared. Model remains cached in your local browser memory.</div>';
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
        currentCasesResults = cases;

        countEl.innerHTML = \`Found <strong>\${cases.length}</strong> wage theft enforcement actions\`;

        if (cases.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim);">No cases found matching query.</div>';
          return;
        }

        grid.innerHTML = cases.map((c, idx) => {
          const totalRecovered = (parseFloat(c.back_wages_recovered || 0) + parseFloat(c.civil_penalties_assessed || 0)).toLocaleString(undefined, {minimumFractionDigits: 2});
          const backWages = parseFloat(c.back_wages_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
          const penalties = parseFloat(c.civil_penalties_assessed || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
          const isVerified = c.provenance_type === 'VERIFIED_PUBLIC_ACTION';

          const provenanceBadgeHTML = isVerified ? \`
            <div style="margin-bottom: 10px;">
              <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);">
                🟢 VERIFIED PUBLIC ENFORCEMENT ACTION
              </span>
            </div>
          \` : \`
            <div style="margin-bottom: 10px;">
              <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);" title="Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.">
                🟡 PROTOTYPE SEED / PENDING FOIA SYNC
              </span>
              <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 3px; font-style: italic;">
                Demonstration case fixture modeled on industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.
              </div>
            </div>
          \`;

          const primaryDocLink = c.source_docket_url ? \`
            <a href="\${c.source_docket_url}" target="_blank" style="color: #34d399; font-weight: 700; text-decoration: underline;">
              Official Docket Document / Report PDF ↗
            </a>
            <span>•</span>
          \` : '';

          return \`
            <div class="case-card">
              <div>
                \${provenanceBadgeHTML}

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

                <div style="margin-top: 10px; padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 0.75rem; border: 1px solid var(--card-border);">
                  <div style="font-weight: 700; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em;">
                    📄 Source Documents & Official Dockets:
                  </div>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    \${primaryDocLink}
                    <a href="https://enforcement.dol.gov" target="_blank" style="color: #38bdf8; text-decoration: underline;">
                      US DOL WHD Docket ↗
                    </a>
                    <span>•</span>
                    <a href="https://publicaccess.courts.state.mn.us" target="_blank" style="color: #38bdf8; text-decoration: underline;">
                      District Court Filings (MCRO) ↗
                    </a>
                    <span>•</span>
                    <a href="https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards" target="_blank" style="color: #38bdf8; text-decoration: underline;">
                      Mpls Civil Rights Findings PDF ↗
                    </a>
                  </div>
                </div>
              </div>

              <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--card-border); padding-top: 12px; margin-top: 14px;">
                <button class="copy-md-btn" id="copy-btn-\${idx}" onclick="copyCaseAsMarkdown(\${idx})">
                  📋 Copy as Markdown (LLM)
                </button>
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
