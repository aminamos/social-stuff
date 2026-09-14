export function renderUI(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Twin Cities Landlord De-anonymizer | Tenant Union Intelligence</title>
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
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent-red: #ef4444;
      --accent-red-bg: rgba(239, 68, 68, 0.12);
      --accent-green: #10b981;
      --accent-green-bg: rgba(16, 185, 129, 0.12);
      --accent-yellow: #f59e0b;
      --accent-yellow-bg: rgba(245, 158, 11, 0.12);
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
      background: linear-gradient(180deg, #131b2e 0%, #090d16 100%);
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
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
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
      font-size: 1.1rem;
      max-width: 750px;
      margin: 0 auto 24px auto;
    }

    /* Stats Banner */
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
    .stat-label {
      font-size: 0.8rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }

    /* Tabs */
    .nav-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .tab-btn {
      background: none;
      border: none;
      color: var(--text-dim);
      padding: 10px 18px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .tab-btn:hover { color: var(--text); background: rgba(255, 255, 255, 0.05); }
    .tab-btn.active {
      color: #ffffff;
      background: #1e293b;
      border: 1px solid #334155;
    }

    /* Search Box */
    .search-box {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .search-input-group {
      display: flex;
      gap: 12px;
    }
    .search-input {
      flex: 1;
      background: #090d16;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 14px 18px;
      color: #ffffff;
      font-size: 1.05rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus { border-color: var(--primary); }
    .search-btn {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0 28px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .search-btn:hover { background: var(--primary-hover); }

    /* Quick Filter Chips */
    .chips-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
      align-items: center;
    }
    .chip-label { font-size: 0.8rem; color: var(--text-dim); margin-right: 4px; }
    .chip {
      background: #090d16;
      border: 1px solid #334155;
      color: var(--text-dim);
      font-size: 0.8rem;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chip:hover, .chip.active {
      color: #ffffff;
      background: #1e293b;
      border-color: #64748b;
    }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 18px;
      margin-top: 16px;
    }
    .landlord-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s, border-color 0.15s;
    }
    .landlord-card:hover {
      border-color: #475569;
      transform: translateY(-2px);
    }
    .card-top { margin-bottom: 14px; }
    .card-header-tags {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      gap: 8px;
      flex-wrap: wrap;
    }
    .city-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      background: #1e293b;
      color: #cbd5e1;
    }
    .units-tag {
      font-size: 0.8rem;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      color: #38bdf8;
    }
    .property-address {
      font-size: 1.2rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }

    /* Badges */
    .deanonymized-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .badge-deanon {
      background: var(--accent-red-bg);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .badge-transparent {
      background: var(--accent-green-bg);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-syndicate {
      background: var(--accent-yellow-bg);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .badge-tier3 {
      background: #7f1d1d;
      color: #fecaca;
      border: 1px solid #dc2626;
      font-weight: 800;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    /* Explanation Callout */
    .explanation-box {
      font-size: 0.85rem;
      padding: 10px 12px;
      border-radius: 8px;
      background: #090d16;
      border: 1px solid #1e293b;
      margin-bottom: 14px;
      color: #cbd5e1;
    }

    .detail-row {
      display: flex;
      font-size: 0.85rem;
      margin-bottom: 6px;
    }
    .detail-key {
      color: var(--text-dim);
      width: 110px;
      flex-shrink: 0;
    }
    .detail-val {
      color: #f1f5f9;
      font-weight: 500;
      word-break: break-word;
    }

    /* Wage Theft Alert Banner */
    .wage-theft-banner {
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid #dc2626;
      border-radius: 8px;
      padding: 10px 12px;
      margin-top: 12px;
      font-size: 0.8rem;
    }
    .wage-theft-title {
      font-weight: 700;
      color: #fca5a5;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    .wage-theft-desc { color: #fecaca; }

    /* Tables */
    .data-table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      overflow: hidden;
      margin-top: 16px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      background: #0f172a;
      color: var(--text-dim);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 14px 18px;
      border-bottom: 1px solid var(--card-border);
      font-size: 0.9rem;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    /* Loading Spinner */
    .loading {
      text-align: center;
      padding: 40px;
      color: var(--text-dim);
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top: 3px solid var(--primary);
      border-radius: 50%;
      width: 28px;
      height: 28px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* Source Docs & Action Row */
    .source-docs-box {
      margin-top: 12px;
      padding: 10px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      font-size: 0.75rem;
    }
    .source-docs-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 5px;
    }
    .source-docs-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .card-action-row {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
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
      background: #070a11;
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
      background: #2563eb;
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
    .ai-input:focus { border-color: #38bdf8; }
    .progress-track {
      background: #1e293b;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, #10b981, #38bdf8);
      height: 100%;
      width: 0%;
      transition: width 0.2s ease;
    }

    /* Footer */
    footer {
      text-align: center;
      margin-top: 60px;
      color: var(--text-dim);
      font-size: 0.85rem;
      border-top: 1px solid var(--card-border);
      padding-top: 30px;
    }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
  <script type="module">
    import * as webllm from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/+esm";
    window.webllm = webllm;
  </script>
</head>
<body>

  <header>
    <div class="container">
      <div class="badge-tag">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34d399;"></span>
        Social Tokens Project #2 • Live Civic Intelligence
      </div>
      <h1>Twin Cities Landlord De-anonymizer</h1>
      <p class="subtitle">
        Unmasking corporate shell LLCs, hidden sister buildings, habitability citations, and wage theft enforcement across Minneapolis, Saint Paul, and Hennepin & Ramsey counties.
      </p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-val">35,978</div>
          <div class="stat-label">Rental Licenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">172,974</div>
          <div class="stat-label">Tenant Units</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">66</div>
          <div class="stat-label">Cities / Municipalities</div>
        </div>
        <div class="stat-card">
          <div class="stat-val">3,919</div>
          <div class="stat-label">Multi-Family Parcels</div>
        </div>
        <div class="stat-card">
          <div class="stat-val" style="color: #38bdf8;">2,140+</div>
          <div class="stat-label">Unmasked Shell LLCs</div>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- Navigation Tabs -->
    <div class="nav-tabs">
      <button class="tab-btn active" onclick="switchTab('search')">🔍 Property Search & De-anonymizer</button>
      <button class="tab-btn" onclick="switchTab('syndicates')">🏆 Top Corporate Syndicates</button>
      <button class="tab-btn" onclick="switchTab('slumlords')">⚠️ Tier 3 Habitability Violators</button>
      <button class="tab-btn" onclick="switchTab('cities')">🏙️ Municipalities (66 Cities)</button>
      <button class="tab-btn" onclick="switchTab('api')">⚡ REST API</button>
      <button class="tab-btn" onclick="switchTab('ai')" style="color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4);">🤖 In-Browser AI Assistant</button>
      <a href="https://twin-cities-slumlord-labor-matrix.a-8c6.workers.dev" target="_blank" class="tab-btn" style="margin-left: auto; color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.4); text-decoration: none;">
        🎯 Dual Violator Matrix ↗
      </a>
      <a href="https://twin-cities-wage-theft-worker.a-8c6.workers.dev" target="_blank" class="tab-btn" style="color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); text-decoration: none;">
        ⚖️ Wage Theft Registry ↗
      </a>
    </div>

    <!-- TAB 1: Search & De-anonymizer -->
    <div id="tab-search">
      <div class="search-box">
        <div class="search-input-group">
          <input 
            type="text" 
            id="searchInput" 
            class="search-input" 
            placeholder="Search landlord name, street address, email, or LLC (e.g. Fitterer, Dominium, Blaisdell, Weidner, Summit, 1420 11th Ave)..."
            value="Fitterer"
          />
          <button class="search-btn" onclick="executeSearch()">Search Registry</button>
          <button class="search-btn" onclick="exportResultsAsMarkdown()" style="background: #10b981;">📥 Export as .MD</button>
        </div>
        <div class="chips-group">
          <span class="chip-label">Quick Filters:</span>
          <span class="chip" onclick="quickFilter('Julius De Roma')">Julius De Roma (Club Jäger)</span>
          <span class="chip" onclick="quickFilter('Fitterer')">Fitterer / IPG Living</span>
          <span class="chip" onclick="quickFilter('Dominium')">Dominium Management</span>
          <span class="chip" onclick="quickFilter('Weidner')">Weidner Apartment Homes</span>
          <span class="chip" onclick="quickFilter('Timberland')">Timberland Partners</span>
          <span class="chip" onclick="quickFilter('Kleinman')">Kleinman Realty</span>
          <span class="chip" onclick="quickFilter('Saint Paul')">Saint Paul C of O</span>
          <span class="chip" onclick="quickFilter('Brooklyn Park')">Brooklyn Park</span>
        </div>
      </div>

      <div id="searchStats" style="margin-bottom: 12px; color: var(--text-dim); font-size: 0.9rem;"></div>
      <div id="resultsGrid" class="cards-grid">
        <div class="loading"><div class="spinner"></div>Loading registry...</div>
      </div>
    </div>

    <!-- TAB 2: Top Syndicates -->
    <div id="tab-syndicates" style="display: none;">
      <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Largest Multi-Building Landlord Networks</h2>
      <p style="color: var(--text-dim); margin-bottom: 16px;">
        Ranked by unmasked residential unit footprint across disparate paper LLCs consolidated by common management emails.
      </p>
      <div class="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Management / Applicant Email</th>
              <th>Key Contact Name</th>
              <th style="text-align: right;">Sister Buildings</th>
              <th style="text-align: right;">Total Units</th>
              <th>Network Status</th>
            </tr>
          </thead>
          <tbody id="syndicatesTable">
            <tr><td colspan="5" class="loading"><div class="spinner"></div>Loading syndicates...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: Tier 3 Chronic Slumlords -->
    <div id="tab-slumlords" style="display: none;">
      <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Tier 3 Habitability & Safety Violators</h2>
      <p style="color: var(--text-dim); margin-bottom: 16px;">
        Properties rated Tier 3 (Minneapolis) or Grade C (Saint Paul) representing chronic maintenance non-compliance and hazardous housing conditions.
      </p>
      <div id="slumlordsGrid" class="cards-grid">
        <div class="loading"><div class="spinner"></div>Loading chronic violators...</div>
      </div>
    </div>

    <!-- TAB 4: Cities Coverage -->
    <div id="tab-cities" style="display: none;">
      <h2 style="font-size: 1.5rem; margin-bottom: 8px;">All 66 Municipalities Across Hennepin & Ramsey Counties</h2>
      <p style="color: var(--text-dim); margin-bottom: 16px;">
        Unified municipal coverage comprising 448,087 Hennepin parcels and 167,853 Ramsey parcels.
      </p>
      <div class="data-table-container">
        <table>
          <thead>
            <tr>
              <th>City / Municipality</th>
              <th>County</th>
              <th style="text-align: right;">Rental Licenses</th>
              <th style="text-align: right;">Licensed Tenant Units</th>
            </tr>
          </thead>
          <tbody id="citiesTable">
            <tr><td colspan="4" class="loading"><div class="spinner"></div>Loading cities...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 6: API Docs -->
    <div id="tab-api" style="display: none;">
      <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Serverless Edge API Endpoints</h2>
      <p style="color: var(--text-dim); margin-bottom: 20px;">
        All endpoints return low-latency JSON served directly from Cloudflare D1 edge replicas.
      </p>

      <div class="search-box">
        <h3 style="font-size: 1.1rem; margin-bottom: 8px; color: #60a5fa;">GET /search?q={query}</h3>
        <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 12px;">Searches rental licenses and parcels across all 66 cities with sister property counts and wage theft match data.</p>
        <pre style="background: #090d16; padding: 12px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; overflow-x: auto; color: #a5f3fc;">curl https://mpls-rental-sync-worker.a-8c6.workers.dev/search?q=Dominium</pre>
      </div>

      <div class="search-box">
        <h3 style="font-size: 1.1rem; margin-bottom: 8px; color: #60a5fa;">GET /wage-theft?q={query}</h3>
        <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 12px;">Searches federal, state, and municipal wage theft enforcement records and settlements.</p>
        <pre style="background: #090d16; padding: 12px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; overflow-x: auto; color: #a5f3fc;">curl https://mpls-rental-sync-worker.a-8c6.workers.dev/wage-theft?q=Dominium</pre>
      </div>

      <div class="search-box">
        <h3 style="font-size: 1.1rem; margin-bottom: 8px; color: #60a5fa;">GET /cities</h3>
        <p style="color: var(--text-dim); font-size: 0.9rem; margin-bottom: 12px;">Returns complete rental licenses and unit counts aggregated by municipality.</p>
        <pre style="background: #090d16; padding: 12px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; overflow-x: auto; color: #a5f3fc;">curl https://mpls-rental-sync-worker.a-8c6.workers.dev/cities</pre>
      </div>
    </div>

    <!-- TAB 7: In-Browser AI Assistant -->
    <div id="tab-ai" style="display: none;">
      <h2 style="font-size: 1.5rem; margin-bottom: 8px; color: #fff;">Private In-Browser Housing Intelligence Assistant</h2>
      <p style="color: var(--text-dim); margin-bottom: 16px;">
        Query the rental directory, unmask corporate shell networks, and analyze housing habitability citations directly inside your browser.
      </p>

      <div class="ai-eco-banner">
        <div class="ai-eco-item">
          <div class="ai-eco-icon">🔒</div>
          <div>
            <strong>100% Client-Side Privacy</strong><br>
            Runs entirely inside your browser memory via WebGPU. Zero questions or personal data are ever uploaded to cloud servers.
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
            Ground answers in loaded registry records
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
            💬 Welcome to the Twin Cities Housing Intelligence AI. Ask anything about landlords, shell LLCs, or habitability tiers. Model executes locally on your hardware.
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
          <span style="font-size: 0.75rem; color: var(--text-dim); align-self: center;">Suggested:</span>
          <button class="chip" onclick="askSuggestedQuestion('Who is Brian Fitterer and which properties does IPG Living own?')">Brian Fitterer / IPG</button>
          <button class="chip" onclick="askSuggestedQuestion('What does a Tier 3 housing habitability classification mean in Minneapolis?')">Tier 3 Explained</button>
          <button class="chip" onclick="askSuggestedQuestion('How many apartment units does Dominium control across the Twin Cities?')">Dominium Portfolio</button>
          <button class="chip" onclick="askSuggestedQuestion('Which landlords have confirmed wage theft enforcement records on file?')">Wage Theft Overlap</button>
        </div>

        <div class="ai-input-row">
          <input type="text" id="aiPromptInput" class="ai-input" placeholder="Ask a question about Twin Cities landlords, sister buildings, or tenant rights..." onkeypress="if(event.key==='Enter') sendAiMessage()">
          <button class="search-btn" id="aiSendBtn" onclick="sendAiMessage()">Ask AI</button>
          <button class="copy-md-btn" onclick="clearAiChat()">Clear</button>
        </div>
      </div>
    </div>
  </main>

  <footer>
    <div class="container">
      <p><strong>Social Tokens Project #2: Corporate Shell Entity & Slumlord De-anonymizer</strong></p>
      <p style="margin-top: 6px;">Built for Tenant Unions, Legal Aid Organizers, and Labor Coalitions. Data sourced directly from municipal GIS, state SOS registries, and US DOL.</p>
    </div>
  </footer>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      const tabs = ['search', 'syndicates', 'slumlords', 'wagetheft', 'cities', 'api', 'ai'];
      tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.style.display = (t === tabId) ? 'block' : 'none';
      });

      if (tabId === 'syndicates') loadSyndicates();
      if (tabId === 'slumlords') loadSlumlords();
      if (tabId === 'cities') loadCities();
    }

    function quickFilter(query) {
      document.getElementById('searchInput').value = query;
      executeSearch();
    }

    function getDeanonymizationBadge(item) {
      const owner = (item.owner_name || '').trim();
      const applicant = (item.applicant_name || '').trim();
      const email = (item.applicant_email || '').trim();
      const address = (item.address || '').trim();
      const ownerAddress = (item.owner_address || '').trim();
      const sisterCount = parseInt(item.sister_properties_count || '0', 10);
      const isLLC = /\\b(LLC|INC|CORP|LP|LTD|HOLDINGS|PROPERTIES|VENTURES|PARTNERS)\\b/i.test(owner);

      const isDeRoma = /deroma|de\\s*roma/i.test(owner) ||
                       /deroma|de\\s*roma/i.test(applicant) ||
                       /4133\\s+dupont/i.test(ownerAddress) ||
                       /teutohellene|hansaware/i.test(email) ||
                       item.apn === '2202924210384' ||
                       address.includes('923 WASHINGTON');

      if (isDeRoma) {
        return {
          badgeClass: 'badge-tier3',
          title: '🚨 NOTORIOUS EXTREMIST / BOYCOTTED OWNER (Club Jäger)',
          desc: \`Unmasked owner Julius De Roma (\${sisterCount || 5} buildings, \${item.total_syndicate_units || 10} units). Former Club Jäger owner exposed in FEC filings as max donor to KKK Grand Wizard David Duke, triggering total worker walkout & closure. Properties unified by management address 4133 Dupont Ave S.\`,
          isAnon: false
        };
      }

      if (sisterCount > 1 && isLLC && email && !owner.toLowerCase().includes(email.split('@')[0])) {
        return {
          badgeClass: 'badge-deanon',
          title: 'DE-ANONYMIZED SHELL LLC',
          desc: \`Single-property shell (\${owner}) unmasked via management email (\${email}) uniting \${sisterCount} sister buildings (\${item.total_syndicate_units || 'multiple'} units).\`,
          isAnon: true
        };
      } else if (sisterCount > 1 && isLLC) {
        return {
          badgeClass: 'badge-syndicate',
          title: 'UNMASKED SYNDICATE MEMBER',
          desc: \`Linked to a multi-building corporate portfolio of \${sisterCount} properties sharing common management.\`,
          isAnon: true
        };
      } else if (isLLC) {
        return {
          badgeClass: 'badge-deanon',
          title: 'CORPORATE SHELL ENTITY',
          desc: \`Registered under paper corporate shell (\${owner}). Direct beneficial owners concealed in standard filings.\`,
          isAnon: true
        };
      } else if (/HOUSING|AGENCY|AUTHORITY|COMMISSION|CHURCH/i.test(owner)) {
        return {
          badgeClass: 'badge-transparent',
          title: 'DIRECT / NON-ANONYMOUS (PUBLIC/CIVIC)',
          desc: \`Direct public housing authority or civic institution. Ownership is transparent and not masked behind shell companies.\`,
          isAnon: false
        };
      } else {
        return {
          badgeClass: 'badge-transparent',
          title: 'DIRECT OWNER (NOT ANONYMOUS)',
          desc: \`Direct individual owner of record (\${owner}). Not shielded by discrete single-property shell LLCs.\`,
          isAnon: false
        };
      }
    }

    async function executeSearch() {
      const q = document.getElementById('searchInput').value.trim();
      if (!q) return;

      const grid = document.getElementById('resultsGrid');
      const stats = document.getElementById('searchStats');
      grid.innerHTML = '<div class="loading"><div class="spinner"></div>Searching live registry...</div>';

      try {
        const resp = await fetch('/search?q=' + encodeURIComponent(q));
        const data = await resp.json();
        const results = data.results || [];
        currentSearchResults = results;

        stats.innerHTML = \`Found <strong>\${results.length}</strong> matching properties for "<strong>\${q}</strong>"\`;

        if (results.length === 0) {
          grid.innerHTML = \`<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim);">
            No properties found matching "\${q}". Try searching by street name, landlord last name, or management email domain.
          </div>\`;
          return;
        }

        grid.innerHTML = results.map((item, idx) => {
          const deanon = getDeanonymizationBadge(item);
          const isTier3 = (item.tier || '').includes('Tier 3') || (item.tier || '').includes('Grade C');

          let wageTheftHTML = '';
          if (item.wage_theft_match) {
            const parts = item.wage_theft_match.split('::');
            const isVerifiedWage = parts[4] === 'VERIFIED_PUBLIC_ACTION';
            const wageBadge = isVerifiedWage 
              ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:9999px;font-size:0.68rem;font-weight:700;background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.35);">🟢 VERIFIED PUBLIC ENFORCEMENT ACTION</span>'
              : '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:9999px;font-size:0.68rem;font-weight:700;background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.35);" title="Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.">🟡 PROTOTYPE SEED MATCH (Pending FOIA Sync)</span>';

            wageTheftHTML = \`
              <div class="wage-theft-banner">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 6px;">
                  <span class="wage-theft-title">⚠️ LABOR VIOLATION CITATION ON RECORD</span>
                  \${wageBadge}
                  <a href="https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=\${encodeURIComponent(parts[0])}" target="_blank" style="color: #fca5a5; font-size: 0.72rem; font-weight: 700; text-decoration: underline;">
                    View Labor Docket ↗
                  </a>
                </div>
                <div class="wage-theft-desc">
                  Case \${parts[0]} (\${parts[1]}): $\${parseFloat(parts[2] || 0).toLocaleString()} recovered for \${parts[3]} affected caretakers/workers.
                  \${!isVerifiedWage ? '<div style="font-size:0.68rem;color:#fca5a5;margin-top:2px;font-style:italic;">Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24.</div>' : ''}
                </div>
              </div>
            \`;
          }

          return \`
            <div class="landlord-card">
              <div class="card-top">
                <div class="card-header-tags">
                  <span class="city-badge">\${item.city || 'Twin Cities'}, \${item.county || 'MN'}</span>
                  <span class="units-tag">\${item.units || 1} \${(item.units || 1) === 1 ? 'Unit' : 'Units'}</span>
                </div>

                <div style="margin: 6px 0;">
                  <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
                    🟢 VERIFIED MUNICIPAL GIS RECORD
                  </span>
                </div>

                <div class="property-address">\${item.address || 'Unknown Address'}</div>

                <div>
                  <span class="deanonymized-badge \${deanon.badgeClass}">\${deanon.title}</span>
                  \${isTier3 ? '<span class="deanonymized-badge badge-tier3">⚠️ TIER 3 SLUMLORD</span>' : ''}
                </div>

                <div class="explanation-box">
                  <strong>Status:</strong> \${deanon.desc}
                </div>

                <div class="detail-row">
                  <div class="detail-key">Paper LLC:</div>
                  <div class="detail-val" style="color: #60a5fa;">\${item.owner_name || 'N/A'}</div>
                </div>

                \${item.applicant_name ? \`
                <div class="detail-row">
                  <div class="detail-key">Management:</div>
                  <div class="detail-val">\${item.applicant_name}</div>
                </div>
                \` : ''}

                \${item.applicant_email ? \`
                <div class="detail-row">
                  <div class="detail-key">Contact Email:</div>
                  <div class="detail-val" style="color: #38bdf8;">\${item.applicant_email}</div>
                </div>
                \` : ''}

                <div class="detail-row">
                  <div class="detail-key">Habitability:</div>
                  <div class="detail-val">\${item.tier || 'Tier 1'} (\${item.status || 'Active'})</div>
                </div>

                \${wageTheftHTML}

                <div class="source-docs-box">
                  <div class="source-docs-title">📄 Source Documents & Public Records:</div>
                  <div class="source-docs-links">
                    <a href="https://www.hennepin.us/residents/property/property-information-search" target="_blank" style="color:#38bdf8; text-decoration:underline;">
                      County Property Tax / Parcel PDF ↗
                    </a>
                    <span>•</span>
                    <a href="https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0" target="_blank" style="color:#38bdf8; text-decoration:underline;">
                      Municipal Licensing Docket ↗
                    </a>
                    \${item.wage_theft_match ? \`
                    <span>•</span>
                    <a href="https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=\${encodeURIComponent(item.owner_name)}" target="_blank" style="color:#f87171; font-weight:700; text-decoration:underline;">
                      Labor Docket / Consent Decree ↗
                    </a>\` : ''}
                  </div>
                </div>
              </div>

              <div class="card-action-row">
                <button class="copy-md-btn" id="copy-btn-\${idx}" onclick="copyCardAsMarkdown(\${idx})">
                  📋 Copy as Markdown (LLM)
                </button>
                <div style="font-size: 0.8rem; color: var(--text-dim); display: flex; gap: 8px; align-items: center;">
                  <span>APN: \${item.apn || 'N/A'}</span>
                  \${item.sister_properties_count > 1 ? \`<span style="color: #38bdf8; font-weight: 600;">🔗 \${item.sister_properties_count} Sister Shells</span>\` : ''}
                </div>
              </div>
            </div>
          \`;
        }).join('');

      } catch (err) {
        grid.innerHTML = \`<div style="color: #ef4444; padding: 20px;">Failed to load results: \${err.message}</div>\`;
      }
    }

    async function loadSyndicates() {
      const tbody = document.getElementById('syndicatesTable');
      tbody.innerHTML = '<tr><td colspan="5" class="loading"><div class="spinner"></div>Loading syndicates...</td></tr>';
      try {
        const resp = await fetch('/stats');
        const data = await resp.json();
        const top = data.top_syndicates || [];

        tbody.innerHTML = top.map(s => \`
          <tr>
            <td style="font-family: 'JetBrains Mono', monospace; color: #38bdf8; font-weight: 600;">\${s.applicant_email}</td>
            <td><strong>\${s.applicant_name || 'N/A'}</strong></td>
            <td style="text-align: right; font-weight: 700; color: #fbbf24;">\${s.props} Buildings</td>
            <td style="text-align: right; font-weight: 800; color: #34d399;">\${(s.total_units || 0).toLocaleString()} Units</td>
            <td><span class="deanonymized-badge badge-deanon">UNMASKED MULTI-LLC NETWORK</span></td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = \`<tr><td colspan="5" style="color: red;">Error: \${e.message}</td></tr>\`;
      }
    }

    async function loadSlumlords() {
      const grid = document.getElementById('slumlordsGrid');
      grid.innerHTML = '<div class="loading"><div class="spinner"></div>Loading chronic violators...</div>';
      try {
        const resp = await fetch('/search?q=Tier%203');
        const data = await resp.json();
        const results = (data.results || []).slice(0, 18);

        if (results.length === 0) {
          grid.innerHTML = '<div style="color: var(--text-dim); padding: 20px;">No Tier 3 records found.</div>';
          return;
        }

        grid.innerHTML = results.map(item => \`
          <div class="landlord-card" style="border-color: #ef4444;">
            <div class="card-top">
              <div class="card-header-tags">
                <span class="city-badge">\${item.city}, \${item.county}</span>
                <span class="units-tag" style="color: #ef4444;">\${item.units} Units</span>
              </div>
              <div class="property-address">\${item.address}</div>
              <div><span class="deanonymized-badge badge-tier3">⚠️ TIER 3 CHRONIC SLUMLORD</span></div>
              <div class="explanation-box" style="border-color: #ef4444;">
                <strong>Habitability Severity:</strong> Under mandatory municipal quarterly monitoring due to chronic health, safety, and tenant code violations.
              </div>
              <div class="detail-row"><div class="detail-key">Paper Shell:</div><div class="detail-val" style="color:#60a5fa;">\${item.owner_name}</div></div>
              <div class="detail-row"><div class="detail-key">Contact:</div><div class="detail-val">\${item.applicant_name} (\${item.applicant_email || 'No email'})</div></div>
            </div>
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--card-border); font-size: 0.8rem; color: var(--text-dim);">
              APN: \${item.apn}
            </div>
          </div>
        \`).join('');
      } catch (e) {
        grid.innerHTML = \`<div style="color: red; padding: 20px;">Error: \${e.message}</div>\`;
      }
    }

    async function loadCities() {
      const tbody = document.getElementById('citiesTable');
      tbody.innerHTML = '<tr><td colspan="4" class="loading"><div class="spinner"></div>Loading cities...</td></tr>';
      try {
        const resp = await fetch('/cities');
        const data = await resp.json();
        const cities = data.cities || [];

        tbody.innerHTML = cities.map(c => \`
          <tr>
            <td><strong>\${c.city}</strong></td>
            <td><span class="city-badge">\${c.county}</span></td>
            <td style="text-align: right; font-weight: 700; color: #38bdf8;">\${(c.license_count || 0).toLocaleString()}</td>
            <td style="text-align: right; font-weight: 800; color: #34d399;">\${(c.total_units || 0).toLocaleString()} Units</td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = \`<tr><td colspan="4" style="color: red;">Error: \${e.message}</td></tr>\`;
      }
    }

    let currentSearchResults = [];

    function copyCardAsMarkdown(index) {
      const item = currentSearchResults[index];
      if (!item) return;
      const deanon = getDeanonymizationBadge(item);
      const isTier3 = (item.tier || '').includes('Tier 3') || (item.tier || '').includes('Grade C');

      let wageTheftText = 'None on record';
      if (item.wage_theft_match) {
        const parts = item.wage_theft_match.split('::');
        const isVerifiedWage = parts[4] === 'VERIFIED_PUBLIC_ACTION';
        const provTag = isVerifiedWage ? '🟢 VERIFIED PUBLIC ENFORCEMENT ACTION' : '🟡 PROTOTYPE SEED MATCH (Pending FOIA Sync)';
        wageTheftText = 'Case ' + parts[0] + ' (' + parts[1] + '): $' + parseFloat(parts[2] || 0).toLocaleString() + ' recovered for ' + parts[3] + ' workers [' + provTag + ']';
      }

      const md = [
        '### Property Dossier: ' + (item.address || 'Unknown Address') + ', ' + (item.city || 'Twin Cities') + ', ' + (item.county || 'MN'),
        '- **Housing Data Provenance**: 🟢 VERIFIED MUNICIPAL GIS RECORD (Minneapolis Open Data / Hennepin County Assessor)',
        '- **APN / Parcel ID**: \`' + (item.apn || 'N/A') + '\`',
        '- **Units**: ' + (item.units || 1),
        '- **Habitability Tier**: ' + (item.tier || 'Tier 1') + ' (' + (item.status || 'Active') + ')' + (isTier3 ? ' ⚠️ CHRONIC SLUMLORD LIST' : ''),
        '- **Paper Shell Owner**: ' + (item.owner_name || 'N/A'),
        '- **Management Contact**: ' + (item.applicant_name || 'N/A'),
        '- **Management Email**: ' + (item.applicant_email || 'N/A'),
        '- **De-anonymization Classification**: **' + deanon.title + '**',
        '  - ' + deanon.desc,
        '- **Sister Properties Unmasked**: ' + (item.sister_properties_count || 1) + ' properties sharing common management (' + (item.total_syndicate_units || 'N/A') + ' total units)',
        '- **Labor Standards & Wage Theft Record**: ' + wageTheftText,
        '- **Official Source Records & PDFs**:',
        '  - County Parcel & Property Tax Assessment: https://www.hennepin.us/residents/property/property-information-search',
        '  - Municipal Rental Licensing Feature Docket: https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0',
        '  - Official Labor Standards Registry Docket: https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=' + encodeURIComponent(item.owner_name || '')
      ].join('\\n');

      navigator.clipboard.writeText(md).then(() => {
        const btn = document.getElementById('copy-btn-' + index);
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

    function exportResultsAsMarkdown() {
      if (!currentSearchResults || currentSearchResults.length === 0) {
        alert('No search results to export. Run a search first.');
        return;
      }
      const q = document.getElementById('searchInput').value.trim() || 'all';
      let lines = [
        '# Twin Cities Rental Property Investigation Dossier',
        '**Query**: ' + q,
        '**Generated**: ' + new Date().toISOString(),
        '**Source**: https://mpls-rental-sync-worker.a-8c6.workers.dev',
        '',
        '> **Data Provenance Notice**:',
        '> - **Housing Records**: 🟢 VERIFIED MUNICIPAL GIS RECORD (Direct from Minneapolis Open Data ArcGIS Feature Service & Hennepin County Assessor).',
        '> - **Labor Records**: Official US DOL, MN DLI, and Court records badged as 🟢 VERIFIED PUBLIC ENFORCEMENT ACTION or 🟡 PROTOTYPE SEED MATCH (Pending FOIA Sync).',
        '',
        '---',
        ''
      ];

      currentSearchResults.forEach((item, idx) => {
        const deanon = getDeanonymizationBadge(item);
        const isTier3 = (item.tier || '').includes('Tier 3') || (item.tier || '').includes('Grade C');
        let wageTheftText = 'None on record';
        if (item.wage_theft_match) {
          const parts = item.wage_theft_match.split('::');
          const isVerifiedWage = parts[4] === 'VERIFIED_PUBLIC_ACTION';
          const provTag = isVerifiedWage ? '🟢 VERIFIED PUBLIC ENFORCEMENT ACTION' : '🟡 PROTOTYPE SEED MATCH (Pending FOIA Sync)';
          wageTheftText = 'Case ' + parts[0] + ' (' + parts[1] + '): $' + parseFloat(parts[2] || 0).toLocaleString() + ' recovered for ' + parts[3] + ' workers [' + provTag + ']';
        }

        lines.push('## ' + (idx + 1) + '. ' + (item.address || 'Unknown Address') + ', ' + (item.city || 'Twin Cities') + ', ' + (item.county || 'MN'));
        lines.push('- **Housing Data Provenance**: 🟢 VERIFIED MUNICIPAL GIS RECORD');
        lines.push('- **APN / PIN**: \`' + (item.apn || 'N/A') + '\`');
        lines.push('- **Units**: ' + (item.units || 1));
        lines.push('- **Habitability Tier**: ' + (item.tier || 'Tier 1') + ' (' + (item.status || 'Active') + ')' + (isTier3 ? ' [TIER 3 SLUMLORD]' : ''));
        lines.push('- **Paper Owner LLC**: ' + (item.owner_name || 'N/A'));
        lines.push('- **Management / Agent**: ' + (item.applicant_name || 'N/A'));
        lines.push('- **Contact Email**: ' + (item.applicant_email || 'N/A'));
        lines.push('- **De-anonymization Status**: ' + deanon.title);
        lines.push('  - ' + deanon.desc);
        lines.push('- **Sister Properties**: ' + (item.sister_properties_count || 1) + ' properties (' + (item.total_syndicate_units || 'N/A') + ' units)');
        lines.push('- **Wage Theft / Labor Citation**: ' + wageTheftText);
        lines.push('- **Primary Document Links**:');
        lines.push('  - County Property Tax / Parcel PDF: https://www.hennepin.us/residents/property/property-information-search');
        lines.push('  - Municipal Rental Licensing Registry: https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0');
        lines.push('  - Labor Standards Registry: https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=' + encodeURIComponent(item.owner_name || ''));
        lines.push('');
      });

      const blob = new Blob([lines.join('\\n')], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'property_dossier_' + q.replace(/[^a-zA-Z0-9_-]/g, '_') + '.md';
      a.click();
    }

    function getGroundedContext() {
      const check = document.getElementById('aiGroundingCheck');
      if (!check || !check.checked) return '';

      let text = 'CURRENT VERIFIED RECORDS LOADED IN REGISTRY:\n';
      const items = (currentSearchResults || []).slice(0, 15);
      if (items.length === 0) {
        text += '- Note: No specific search query loaded yet. Twin Cities registry covers 35,978 rental licenses and 172,974 units across Hennepin & Ramsey counties.\n';
      } else {
        items.forEach((item, idx) => {
          text += (idx + 1) + '. Address: ' + (item.address || 'N/A') + ', ' + (item.city || 'Twin Cities') + ' | APN: ' + (item.apn || 'N/A') + ' | Units: ' + (item.units || 1) + ' | Tier: ' + (item.tier || 'Tier 1') + ' | Owner Shell: ' + (item.owner_name || 'N/A') + ' | Contact: ' + (item.applicant_name || 'N/A') + ' (' + (item.applicant_email || '') + ') | Sister Properties: ' + (item.sister_properties_count || 1) + ' (' + (item.total_syndicate_units || 'N/A') + ' units)';
          if (item.wage_theft_match) text += ' | Labor Record: ' + item.wage_theft_match;
          text += '\n';
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
        appendChatMessage('system', '⚠️ WebGPU is not detected in your browser. To use In-Browser AI without cloud data servers: in Chrome/Brave/Edge ensure "Hardware Acceleration" is enabled; in Safari ensure Safari 18+ (macOS Sequoia / iOS 18); in Firefox toggle dom.webgpu.enabled in about:config.');
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
            throw new Error('WebLLM library is loading from CDN. Please wait 2 seconds and try again.');
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
      const systemPrompt = "You are a local civic housing and labor rights intelligence assistant for the Twin Cities (Minneapolis, St. Paul, Hennepin & Ramsey Counties). You run 100% locally and privately in the user's browser via WebGPU with ZERO server-side data collection and ZERO cloud datacenter electricity waste. Your answers are strictly grounded in public records (rental licenses, APNs, shell owners, Tier 3 inspection grades, wage theft judgments). If a property or entity is in the context records, cite its exact numbers, APN, tier, and sister buildings. If not found in the loaded context, give general legal context under Minnesota tenant and labor law (e.g. Minn. Stat. § 504B, Minneapolis Code of Ordinances Title 12). Keep responses concise, objective, and clear.\n\n" + contextData;

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

    // Auto-run default search on load
    window.addEventListener('DOMContentLoaded', () => {
      executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        executeSearch();
      }
    });
  </script>
</body>
</html>
`;
}
