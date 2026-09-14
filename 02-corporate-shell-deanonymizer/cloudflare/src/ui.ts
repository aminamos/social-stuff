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
          <div class="stat-val">$800K+</div>
          <div class="stat-label">Wage Theft Recovered</div>
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
      <button class="tab-btn" onclick="switchTab('wagetheft')">⚖️ Wage Theft Tracker</button>
      <button class="tab-btn" onclick="switchTab('cities')">🏙️ Municipalities (66 Cities)</button>
      <button class="tab-btn" onclick="switchTab('api')">⚡ REST API</button>
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
        </div>
        <div class="chips-group">
          <span class="chip-label">Quick Filters:</span>
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

    <!-- TAB 4: Wage Theft Tracker -->
    <div id="tab-wagetheft" style="display: none;">
      <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Wage Theft & Labor Exploitation Database</h2>
      <p style="color: var(--text-dim); margin-bottom: 16px;">
        Federal (US DOL WHD), state (MN DLI), and municipal citations and settlements against residential landlords, property management firms, and cleaning contractors.
      </p>
      <div class="data-table-container">
        <table>
          <thead>
            <tr>
              <th>Employer / Legal Name</th>
              <th>Trade Name / City</th>
              <th>Agency / Violation</th>
              <th style="text-align: right;">Stolen Wages Recovered</th>
              <th style="text-align: right;">Fines & Penalties</th>
              <th style="text-align: right;">Workers</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="wageTheftTable">
            <tr><td colspan="7" class="loading"><div class="spinner"></div>Loading wage theft enforcement records...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 5: Cities Coverage -->
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

      const tabs = ['search', 'syndicates', 'slumlords', 'wagetheft', 'cities', 'api'];
      tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.style.display = (t === tabId) ? 'block' : 'none';
      });

      if (tabId === 'syndicates') loadSyndicates();
      if (tabId === 'slumlords') loadSlumlords();
      if (tabId === 'wagetheft') loadWageTheft();
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
      const sisterCount = parseInt(item.sister_properties_count || '0', 10);
      const isLLC = /\\b(LLC|INC|CORP|LP|LTD|HOLDINGS|PROPERTIES|VENTURES|PARTNERS)\\b/i.test(owner);

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

        stats.innerHTML = \`Found <strong>\${results.length}</strong> matching properties for "<strong>\${q}</strong>"\`;

        if (results.length === 0) {
          grid.innerHTML = \`<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim);">
            No properties found matching "\${q}". Try searching by street name, landlord last name, or management email domain.
          </div>\`;
          return;
        }

        grid.innerHTML = results.map(item => {
          const deanon = getDeanonymizationBadge(item);
          const isTier3 = (item.tier || '').includes('Tier 3') || (item.tier || '').includes('Grade C');

          let wageTheftHTML = '';
          if (item.wage_theft_match) {
            const parts = item.wage_theft_match.split('::');
            wageTheftHTML = \`
              <div class="wage-theft-banner">
                <div class="wage-theft-title">⚠️ WAGE THEFT ENFORCEMENT ON RECORD</div>
                <div class="wage-theft-desc">
                  Case \${parts[0]}: \${parts[1]} violation. $\${parseFloat(parts[2] || 0).toLocaleString()} recovered for \${parts[3]} workers.
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
              </div>

              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--card-border); font-size: 0.8rem; color: var(--text-dim); display: flex; justify-content: space-between;">
                <span>APN: \${item.apn || 'N/A'}</span>
                \${item.sister_properties_count > 1 ? \`<span style="color: #38bdf8; font-weight: 600;">🔗 \${item.sister_properties_count} Sister Properties</span>\` : ''}
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

    async function loadWageTheft() {
      const tbody = document.getElementById('wageTheftTable');
      tbody.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div>Loading wage theft enforcement records...</td></tr>';
      try {
        const resp = await fetch('/wage-theft/top');
        const data = await resp.json();
        const offenders = data.top_wage_theft_offenders || [];

        tbody.innerHTML = offenders.map(o => \`
          <tr>
            <td><strong>\${o.respondent_legal_name}</strong></td>
            <td>\${o.trade_name || 'N/A'}<br><span style="font-size:0.75rem; color:var(--text-dim);">\${o.city}</span></td>
            <td><span class="city-badge">Enforcement Action</span></td>
            <td style="text-align: right; font-weight: 700; color: #34d399;">$\${parseFloat(o.total_back_wages || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td style="text-align: right; font-weight: 700; color: #f87171;">$\${parseFloat(o.total_penalties || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td style="text-align: right; font-weight: 600;">\${o.total_workers_affected}</td>
            <td>\${o.is_repeat_violator ? '<span class="deanonymized-badge badge-tier3">REPEAT OFFENDER</span>' : '<span class="deanonymized-badge badge-transparent">SETTLED</span>'}</td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = \`<tr><td colspan="7" style="color: red;">Error: \${e.message}</td></tr>\`;
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
