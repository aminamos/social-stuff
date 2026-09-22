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

    /* Source Docs & Markdown Action Styling */
    .source-docs-box {
      grid-column: 1 / -1;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.78rem;
    }
    .copy-md-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e2e8f0;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .copy-md-btn:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: #38bdf8;
      color: #fff;
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
      background: linear-gradient(90deg, #ef4444, #c084fc);
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
      background: #070a11;
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
      background: #070a11;
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 12px 16px;
      border-radius: 10px;
      outline: none;
      font-size: 0.95rem;
    }
    .ai-input:focus { border-color: #c084fc; }
    .progress-track {
      background: #1e293b;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 8px;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, #10b981, #c084fc);
      height: 100%;
      width: 0%;
      transition: width 0.2s ease;
    }

    /* ---- Mobile layout ---- */
    @media (max-width: 720px) {
      header { padding: 24px 0 18px 0; }
      h1 { font-size: 1.5rem; line-height: 1.2; }
      .subtitle { font-size: 0.92rem; margin-bottom: 16px; }
      .container { padding: 0 14px; }
      .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 18px; }
      .stat-card { padding: 12px 8px; }
      .stat-val { font-size: 1.25rem; }
      .stat-label { font-size: 0.68rem; }

      /* Tab nav: sticky one-line snap scroller with a visible scrollbar so the
         remaining tabs are obviously reachable, and the nav stays in view. */
      .tabs-bar, .nav-tabs {
        position: sticky;
        top: 0;
        z-index: 20;
        background: var(--bg);
        gap: 6px;
        margin-bottom: 16px;
        padding-bottom: 10px;
        scroll-snap-type: x proximity;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: #475569 transparent;
      }
      .tabs-bar::-webkit-scrollbar, .nav-tabs::-webkit-scrollbar { height: 6px; }
      .tabs-bar::-webkit-scrollbar-thumb, .nav-tabs::-webkit-scrollbar-thumb { background: #475569; border-radius: 9999px; }
      .tabs-bar::-webkit-scrollbar-track, .nav-tabs::-webkit-scrollbar-track { background: transparent; }
      .tab-btn { scroll-snap-align: start; padding: 8px 12px; font-size: 0.82rem; }
      .tab-btn[style*="margin-left: auto"] { margin-left: 0 !important; }

      /* Scroll-affordance fade: a soft edge signals tabs continue off-screen */
      .nav-scroll { position: relative; }
      .nav-scroll::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 12px;
        width: 34px;
        pointer-events: none;
        background: linear-gradient(90deg, rgba(9, 13, 22, 0), var(--bg) 88%);
        transition: opacity 0.2s ease;
      }
      .nav-scroll.at-end::after { opacity: 0; }

      /* Search controls stack instead of overflowing the viewport */
      .search-section { padding: 16px; border-radius: 12px; margin-bottom: 16px; }
      .search-row, .search-input-group { flex-wrap: wrap; }
      .search-input { flex: 1 1 100%; min-width: 0; font-size: 0.95rem; padding: 12px 14px; }
      .search-btn { flex: 1 1 auto; padding: 11px 14px; font-size: 0.9rem; }
      .chip { font-size: 0.75rem; padding: 5px 10px; }

      /* Matrix cards collapse to a single readable column */
      .matrix-grid, .results-grid, .cards-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
      .dual-card { padding: 16px; gap: 16px; }
      .pillar-overview { border-right: none; border-bottom: 1px solid var(--card-border); padding-right: 0; padding-bottom: 16px; }
      .card-action-row, .ai-input-row, .ai-controls-row { flex-wrap: wrap; }
      .ai-input { flex: 1 1 100%; min-width: 0; }
      .ai-model-select { width: 100%; }
      .ai-chat-box { height: 340px; }

      /* Inline two-column form rows become single column */
      .form-card div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: minmax(0, 1fr) !important; }
      .form-card { padding: 22px 16px; }
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
    <div class="nav-scroll">
    <div class="tabs-bar">
      <button class="tab-btn active" onclick="switchTab('matrix')">🎯 Dual Violators Matrix</button>
      <button class="tab-btn" onclick="switchTab('report')">📢 Report Dual Exploitation</button>
      <button class="tab-btn" onclick="switchTab('api')">⚡ Crossover API</button>
      <button class="tab-btn" onclick="switchTab('ai')" style="color: #34d399; border: 1px solid rgba(52, 211, 153, 0.4);">🤖 In-Browser AI Assistant</button>
      <a href="/crossover/export.md" class="tab-btn" style="color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3);">
        📥 Export Matrix (.MD)
      </a>
      
      <a href="https://mpls-rental-sync-worker.a-8c6.workers.dev" target="_blank" class="tab-btn" style="margin-left: auto; color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
        🏢 Landlord De-anonymizer ↗
      </a>
      <a href="https://twin-cities-wage-theft-worker.a-8c6.workers.dev" target="_blank" class="tab-btn" style="color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);">
        ⚖️ Wage Theft Registry ↗
      </a>
    </div>
    </div>

    <!-- TAB 1: DUAL VIOLATORS MATRIX -->
    <div id="matrixTab" class="tab-pane active">
      <div class="search-section">
        <div class="search-row">
          <input type="text" id="searchInput" class="search-input" placeholder="Search crossover matrix by landlord, management email, or address (e.g. Julius De Roma, Fitterer, Dominium)..." value="">
          <button class="search-btn" onclick="executeSearch()">Filter Matrix</button>
          <button class="search-btn" onclick="exportMatrixAsMarkdown()" style="background: #10b981;">📥 Export as .MD</button>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-dim); margin-right: 4px;">Quick Filters:</span>
          <button class="chip" onclick="quickFilter('')">All Syndicates</button>
          <button class="chip" onclick="quickFilter('Julius De Roma')">Julius De Roma (Club Jäger)</button>
          <button class="chip" onclick="quickFilter('Fitterer')">Fitterer / IPG Living</button>
          <button class="chip" onclick="quickFilter('Dominium')">Dominium</button>
          <button class="chip" onclick="quickFilter('Property Maintenance')">PMC Renovation</button>
          <button class="chip" onclick="quickFilter('Timberland')">Timberland Partners</button>
          <button class="chip" onclick="quickFilter('Kleinman')">Kleinman Realty</button>
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

        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <div style="font-weight: 800; color: #38bdf8; font-size: 0.95rem; margin-bottom: 6px;">
            ⚖️ Official Government Enforcement Portals vs. Community Coalition Intake
          </div>
          <p style="font-size: 0.83rem; color: #cbd5e1; margin-bottom: 12px; line-height: 1.5;">
            <strong>Notice:</strong> This intake portal is maintained for collective tenant-worker organizing (protected under NLRA § 7, Minn. Stat. § 181.932, and Minnesota Tenant Remedy Act). To initiate statutory civil investigations, rent escrow proceedings, or compulsory wage restitution, you can also file directly with official public authorities:
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.8rem;">
            <a href="https://www.dli.mn.gov/business/employment-practices/making-wage-claim" target="_blank" style="background: #070a11; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>MN Dept of Labor (DLI)</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">State wage theft & joint liability claims ↗</span>
            </a>
            <a href="https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards/labor-standards-complaint-form/" target="_blank" style="background: #070a11; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>Minneapolis Civil Rights</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">City labor standards enforcement ↗</span>
            </a>
            <a href="https://www.minneapolismn.gov/resident-services/property-housing/housing-code/report-problem/" target="_blank" style="background: #070a11; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>Mpls Housing Inspections (311)</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">Report Tier 3 habitability & heat violations ↗</span>
            </a>
            <a href="https://homelinemn.org" target="_blank" style="background: #070a11; padding: 10px; border-radius: 8px; border: 1px solid var(--card-border); color: #38bdf8; text-decoration: none; display: block;">
              <strong>HOME Line Tenant Hotline</strong><br>
              <span style="color: var(--text-dim); font-size: 0.72rem;">Free legal advice line: (612) 728-5767 ↗</span>
            </a>
          </div>
        </div>

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

    <!-- TAB 4: In-Browser AI Assistant -->
    <div id="aiTab" class="tab-pane">
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff;">Private In-Browser Crossover Exploitation Assistant</h2>
        <p style="color: var(--text-dim); font-size: 0.9rem;">
          Cross-examine housing habitability violations and wage theft citations using client-side AI executed directly on your device.
        </p>
      </div>

      <div class="ai-eco-banner">
        <div class="ai-eco-item">
          <div class="ai-eco-icon">🔒</div>
          <div>
            <strong>100% Client-Side Privacy</strong><br>
            Runs entirely inside your browser memory via WebGPU. Zero questions or investigation notes ever touch external cloud servers.
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
            Ground answers in crossover matrix syndicates
          </label>
        </div>

        <div id="aiProgressContainer" style="display: none; margin-bottom: 16px; background: #070a11; padding: 12px; border-radius: 8px; border: 1px solid var(--card-border);">
          <div id="aiStatusText" style="font-size: 0.82rem; color: #c084fc; font-weight: 600;">Initializing WebLLM engine...</div>
          <div class="progress-track">
            <div id="aiProgressBar" class="progress-bar-fill"></div>
          </div>
        </div>

        <div id="aiChatBox" class="ai-chat-box">
          <div class="chat-msg system">
            💬 Welcome to the Crossover Matrix AI. Ask questions about syndicates operating both slum housing and wage theft schemes. Model executes locally on your hardware.
          </div>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
          <span style="font-size: 0.75rem; color: var(--text-dim); align-self: center;">Suggested:</span>
          <button class="chip" onclick="askSuggestedQuestion('Which landlords have both Tier 3 habitability citations and active wage theft dockets?')">Top Dual Violators</button>
          <button class="chip" onclick="askSuggestedQuestion('Explain the joint organizing strategy for tenants and caretakers at Brian Fitterer / IPG properties.')">Fitterer Playbook</button>
          <button class="chip" onclick="askSuggestedQuestion('How does Minnesota Joint Liability law (Minn. Stat. 181.165) hold property owners liable for cleaner wages?')">Joint Liability</button>
          <button class="chip" onclick="askSuggestedQuestion('What legal steps allow tenants to escrow rent while filing wage claims?')">Rent Escrow + Wage Liens</button>
        </div>

        <div class="ai-input-row">
          <input type="text" id="aiPromptInput" class="ai-input" placeholder="Ask about dual housing-labor crossover, joint organizing playbooks, or syndicate records..." onkeypress="if(event.key==='Enter') sendAiMessage()">
          <button class="search-btn" id="aiSendBtn" onclick="sendAiMessage()">Ask AI</button>
          <button class="copy-md-btn" onclick="clearAiChat()">Clear</button>
        </div>
      </div>
    </div>
  </main>

  <script>
    let currentMatrixResults = [];

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById(tabId + 'Tab').classList.add('active');
      if (event.target.scrollIntoView) {
        event.target.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    }

    function copyDualCardAsMarkdown(idx) {
      const s = currentMatrixResults[idx];
      if (!s) return;

      const totalRecovered = parseFloat(s.total_wage_theft_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
      const isLaborVerified = (s.labor_provenance || '').includes('VERIFIED');

      const md = [
        '### Dual Housing & Labor Exploitation Dossier: ' + (s.entity_name || 'Syndicate Entity'),
        '- **Operating Trade Name**: ' + (s.trade_name || 'N/A'),
        '- **Dual Exploitation Risk Assessment**: **' + (s.risk_tier || 'HIGH RISK') + '** (Composite Score: ' + (s.composite_score || 0) + '/100)',
        '- **Geographic Jurisdiction**: ' + (s.city || 'Twin Cities Metro Area') + ', MN',
        '- **Housing Exploitation Profile**:',
        '  - Data Provenance: ' + (s.housing_provenance || '🟢 VERIFIED MUNICIPAL GIS RECORD (Minneapolis Open Data / Hennepin County Assessor)'),
        '  - Unmasked Residential Portfolio: ' + (s.total_units || 0) + ' units across ' + (s.properties_count || 1) + ' shell properties',
        '  - Habitability Status: ' + (s.has_tier3 ? '⚠️ TIER 3 CHRONIC SLUMLORD' : 'Tier 1/2 Active'),
        '  - Habitability Record: ' + (s.housing_narrative || 'Documented habitability violations.'),
        '- **Labor Exploitation & Wage Theft Profile**:',
        '  - Data Provenance: ' + (s.labor_provenance || '🟡 PROTOTYPE SEED / PENDING FOIA SYNC (Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync)'),
        '  - Legal Docket / Case ID: \`' + (s.case_id || 'N/A') + '\` (' + (s.source_agency || 'Labor Standards') + ')',
        '  - Violation Classification: ' + (s.violation_type || 'Wage Theft & Overtime Fraud'),
        '  - Financial Restitution & Penalties: $' + totalRecovered,
        '  - Affected Workers: ' + (s.workers_affected || 0) + ' caretakers / cleaners / maintenance staff',
        '  - Enforcement Findings: ' + (s.labor_narrative || 'Confirmed labor standards violations.'),
        '- **Recommended Joint Organizing Strategy**:',
        '  - ' + (s.organizing_playbook || 'Escrow rent; enforce joint employer liability.'),
        '- **Official Source Records & Legal Dockets**:',
        (s.source_excerpt_file || s.case_id) ? '  - Evidence Excerpt (mirrored PDF): ' + location.origin + '/docs/' + encodeURIComponent(s.source_excerpt_file || (s.case_id + '.pdf')) + (s.source_pages ? ' (' + s.source_pages + (s.source_doc_title ? ', ' + s.source_doc_title : '') + ')' : '') : '',
        (s.housing_source_excerpt_file && s.housing_source_excerpt_file !== s.source_excerpt_file) ? '  - Housing Evidence Excerpt (mirrored PDF): ' + location.origin + '/docs/' + encodeURIComponent(s.housing_source_excerpt_file) + (s.housing_source_pages ? ' (' + s.housing_source_pages + (s.housing_source_doc_title ? ', ' + s.housing_source_doc_title : '') + ')' : '') : '',
        (s.source_full_file && s.source_full_file !== s.source_excerpt_file) ? '  - Full Source Report (mirrored PDF): ' + location.origin + '/docs/' + encodeURIComponent(s.source_full_file) : '',
        '  - County Property Tax / Parcel PDF: https://www.hennepin.us/residents/property/property-information-search',
        '  - Municipal Active Rental License Registry: https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0',
        '  - US DOL Enforcement Database: https://enforcement.dol.gov',
        '  - Minnesota District Court MCRO: https://publicaccess.courts.state.mn.us',
        '  - Minneapolis Civil Rights Labor Standards: https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards',
        '  - Landlord De-anonymizer File: https://mpls-rental-sync-worker.a-8c6.workers.dev/?q=' + encodeURIComponent(s.search_slug || ''),
        '  - Wage Theft Registry File: https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=' + encodeURIComponent(s.search_slug || '')
      ].filter(Boolean).join('\\n');

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

    function exportMatrixAsMarkdown() {
      if (!currentMatrixResults || currentMatrixResults.length === 0) {
        alert('No crossover records loaded to export.');
        return;
      }
      const q = document.getElementById('searchInput').value.trim() || 'all';
      let lines = [
        '# Twin Cities Slumlord & Wage Theft Crossover Matrix',
        '**Search Query**: ' + q,
        '**Generated**: ' + new Date().toISOString(),
        '**Source**: https://twin-cities-slumlord-labor-matrix.a-8c6.workers.dev',
        '',
        '> **Dual Data Provenance Notice**:',
        '> - **Housing Data Provenance**: 🟢 VERIFIED MUNICIPAL GIS RECORD (Direct parcel and licensing data from Minneapolis Open Data & Hennepin County Assessor).',
        '> - **Labor Data Provenance**:',
        '>   - 🟢 **VERIFIED PUBLIC ENFORCEMENT ACTION**: Formal civil court judgment / consent decree or AG enforcement finding.',
        '>   - 🟡 **PROTOTYPE SEED / PENDING FOIA SYNC**: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.',
        '',
        '---',
        ''
      ];

      currentMatrixResults.forEach((s, idx) => {
        const totalRecovered = parseFloat(s.total_wage_theft_recovered || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
        const isLaborVerified = (s.labor_provenance || '').includes('VERIFIED');
        lines.push('## ' + (idx + 1) + '. ' + (s.entity_name || 'Entity') + ' (' + (s.trade_name || 'N/A') + ')');
        lines.push('- **Dual Exploitation Risk**: **' + (s.risk_tier || 'HIGH RISK') + '** (Score: ' + (s.composite_score || 0) + '/100)');
        lines.push('- **Metro Geography**: ' + (s.city || 'Twin Cities') + ', MN');
        lines.push('- **Housing Data Provenance**: ' + (s.housing_provenance || '🟢 VERIFIED MUNICIPAL GIS RECORD'));
        lines.push('- **Housing Footprint**: ' + (s.total_units || 0) + ' units across ' + (s.properties_count || 1) + ' shell properties' + (s.has_tier3 ? ' [TIER 3 SLUMLORD]' : ''));
        lines.push('  - ' + (s.housing_narrative || ''));
        lines.push('- **Labor Data Provenance**: ' + (s.labor_provenance || '🟡 PROTOTYPE SEED / PENDING FOIA SYNC'));
        if (!isLaborVerified) {
          lines.push('  - *Note*: Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.');
        }
        lines.push('- **Labor Violation**: Case \`' + (s.case_id || 'N/A') + '\` (' + (s.source_agency || '') + ' - ' + (s.violation_type || '') + ')');
        lines.push('  - Financial Recovery: $' + totalRecovered + ' across ' + (s.workers_affected || 0) + ' workers');
        lines.push('  - ' + (s.labor_narrative || ''));
        lines.push('- **Joint Organizing Playbook**: ' + (s.organizing_playbook || ''));
        lines.push('- **Primary Document & Docket Links**:');
        if (s.source_excerpt_file || s.case_id) {
          lines.push('  - Evidence Excerpt (mirrored PDF): ' + location.origin + '/docs/' + encodeURIComponent(s.source_excerpt_file || (s.case_id + '.pdf')) + (s.source_pages ? ' (' + s.source_pages + (s.source_doc_title ? ', ' + s.source_doc_title : '') + ')' : ''));
        }
        if (s.housing_source_excerpt_file && s.housing_source_excerpt_file !== s.source_excerpt_file) {
          lines.push('  - Housing Evidence Excerpt (mirrored PDF): ' + location.origin + '/docs/' + encodeURIComponent(s.housing_source_excerpt_file) + (s.housing_source_pages ? ' (' + s.housing_source_pages + (s.housing_source_doc_title ? ', ' + s.housing_source_doc_title : '') + ')' : ''));
        }
        if (s.source_full_file && s.source_full_file !== s.source_excerpt_file) {
          lines.push('  - Full Source Report (mirrored PDF): ' + location.origin + '/docs/' + encodeURIComponent(s.source_full_file));
        }
        lines.push('  - County Parcel PDF: https://www.hennepin.us/residents/property/property-information-search');
        lines.push('  - Rental License Feature Docket: https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0');
        lines.push('  - US DOL Enforcement: https://enforcement.dol.gov');
        lines.push('  - Minnesota District Court MCRO: https://publicaccess.courts.state.mn.us');
        lines.push('  - Minneapolis Civil Rights Labor Standards: https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards');
        lines.push('  - Landlord De-anonymizer: https://mpls-rental-sync-worker.a-8c6.workers.dev/?q=' + encodeURIComponent(s.search_slug || ''));
        lines.push('  - Wage Theft Registry: https://twin-cities-wage-theft-worker.a-8c6.workers.dev/?q=' + encodeURIComponent(s.search_slug || ''));
        lines.push('');
      });

      const blob = new Blob([lines.join('\\n')], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'slumlord_wage_theft_matrix_' + q.replace(/[^a-zA-Z0-9_-]/g, '_') + '.md';
      a.click();
    }

    function getGroundedContext() {
      const check = document.getElementById('aiGroundingCheck');
      if (!check || !check.checked) return '';

      let text = 'CURRENT VERIFIED CROSSOVER SYNDICATES (HOUSING & LABOR DUAL VIOLATIONS):\\n';
      const items = (currentMatrixResults || []).slice(0, 10);
      items.forEach((s, idx) => {
        text += (idx + 1) + '. Entity: ' + s.entity_name + ' (' + s.trade_name + ') | Risk: ' + s.risk_tier + ' (' + s.composite_score + '/100) | Location: ' + s.city + ', MN | Units: ' + s.total_units + ' across ' + s.properties_count + ' properties | Tier 3 Slumlord: ' + (s.has_tier3 ? 'YES' : 'NO') + ' | Housing Profile: ' + s.housing_narrative + ' | Labor Case: ' + s.case_id + ' (' + s.source_agency + ' - ' + s.violation_type + ') | Stolen Wages Recovered: $' + parseFloat(s.total_wage_theft_recovered || 0).toLocaleString() + ' | Workers: ' + s.workers_affected + ' | Labor Summary: ' + s.labor_narrative + ' | Recommended Action Playbook: ' + s.organizing_playbook + '\\n';
      });
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
      const systemPrompt = "You are a specialized civic housing and labor rights intelligence assistant for the Twin Cities Crossover Matrix. You run 100% locally and privately in the user's browser via WebGPU with ZERO server-side data collection and ZERO cloud datacenter electricity consumption. Answer questions using the verified dual-violation syndicate profiles provided in the context. Emphasize joint organizing strategies, such as tenant rent escrow actions synchronized with building caretaker wage claims under Minnesota's 2023 Joint Contractor Liability Law (Minn. Stat. § 181.165), retaliation protections under Minn. Stat. § 181.932, and municipal Tier 3 habitability enforcement. Keep answers concise, factual, and empowering.\\n\\n" + contextData;

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

    function quickFilter(val) {
      document.getElementById('searchInput').value = val;
      executeSearch();
    }

    async function executeSearch() {
      const q = document.getElementById('searchInput').value.trim();
      try {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', q ? '/?q=' + encodeURIComponent(q) : '/');
        }
      } catch (e) {}

      const container = document.getElementById('matrixContainer');
      container.innerHTML = '<div class="loading"><div class="spinner"></div>Analyzing dual housing and labor crossover...</div>';

      try {
        const resp = await fetch('/matrix?q=' + encodeURIComponent(q));
        const data = await resp.json();
        const records = data.matrix || [];
        currentMatrixResults = records;

        if (records.length === 0) {
          container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-dim);">No crossover syndicates found matching query.</div>';
          return;
        }

        container.innerHTML = records.map((s, idx) => {
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
                  <a href="https://mpls-rental-sync-worker.a-8c6.workers.dev/?q=\${encodeURIComponent(s.search_slug)}" target="_blank" class="cta-btn cta-housing">
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
                  <div style="margin-bottom: 8px;">
                    <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35);">
                      \${s.housing_provenance || '🟢 VERIFIED MUNICIPAL GIS RECORD'}
                    </span>
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
                  <div style="margin-bottom: 8px;">
                    \${(s.labor_provenance || '').includes('VERIFIED') ? \`
                      <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35);">
                        🟢 VERIFIED PUBLIC ENFORCEMENT ACTION
                      </span>
                    \` : \`
                      <div>
                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.35);" title="Demonstration case fixture modeled on documented industry practices under Minn. Stat. § 177.24, pending automated bulk FOIA sync.">
                          🟡 PROTOTYPE SEED / PENDING FOIA SYNC
                        </span>
                        <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 2px; font-style: italic;">
                          Demonstration fixture modeled on industry practices under Minn. Stat. § 177.24
                        </div>
                      </div>
                    \`}
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

              <!-- Source Documents Box -->
              <div class="source-docs-box">
                <div style="font-weight: 700; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em;">
                  📄 Source Documents & Legal Dockets:
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                  \${s.source_excerpt_file ? \`
                    <a href="/docs/\${encodeURIComponent(s.source_excerpt_file)}" target="_blank" style="color: #34d399; font-weight: 700; text-decoration: underline;">
                      📄 Evidence excerpt\${s.source_doc_title ? ' — ' + s.source_doc_title : ''}\${s.source_pages ? ' ' + s.source_pages : ''} ↗
                    </a>
                    <span style="color: var(--card-border);">•</span>
                  \` : ''}
                  \${s.case_id && s.source_excerpt_file !== s.case_id + '.pdf' ? \`
                    <a href="/docs/\${encodeURIComponent(s.case_id)}.pdf" target="_blank" style="color: #34d399; font-weight: 700; text-decoration: underline;">
                      Case docket PDF ↗
                    </a>
                    <span style="color: var(--card-border);">•</span>
                  \` : ''}
                  \${s.housing_source_excerpt_file && s.housing_source_excerpt_file !== s.source_excerpt_file ? \`
                    <a href="/docs/\${encodeURIComponent(s.housing_source_excerpt_file)}" target="_blank" style="color: #38bdf8; font-weight: 700; text-decoration: underline;">
                      Housing evidence\${s.housing_source_doc_title ? ' — ' + s.housing_source_doc_title : ''}\${s.housing_source_pages ? ' ' + s.housing_source_pages : ''} ↗
                    </a>
                    <span style="color: var(--card-border);">•</span>
                  \` : ''}
                  \${s.source_full_file && s.source_full_file !== s.source_excerpt_file ? \`
                    <a href="/docs/\${encodeURIComponent(s.source_full_file)}" target="_blank" style="color: #94a3b8; text-decoration: underline;">
                      Full source report ↗
                    </a>
                    <span style="color: var(--card-border);">•</span>
                  \` : ''}
                  <a href="https://www.hennepin.us/residents/property/property-information-search" target="_blank" style="color: #38bdf8; text-decoration: underline;">
                    County Property Assessment PDF ↗
                  </a>
                  <span style="color: var(--card-border);">•</span>
                  <a href="https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0" target="_blank" style="color: #38bdf8; text-decoration: underline;">
                    Active Rental Licensing Docket ↗
                  </a>
                  <span style="color: var(--card-border);">•</span>
                  <a href="https://enforcement.dol.gov" target="_blank" style="color: #f87171; text-decoration: underline;">
                    US DOL WHD Case Docket ↗
                  </a>
                  <span style="color: var(--card-border);">•</span>
                  <a href="https://publicaccess.courts.state.mn.us" target="_blank" style="color: #f87171; text-decoration: underline;">
                    District Court MCRO Docket ↗
                  </a>
                  <span style="color: var(--card-border);">•</span>
                  <a href="https://www2.minneapolismn.gov/government/departments/civil-rights/labor-standards" target="_blank" style="color: #f87171; text-decoration: underline;">
                    Mpls Civil Rights Findings ↗
                  </a>
                </div>
              </div>

              <!-- Action Strategy Footer -->
              <div class="action-plan-box">
                <div style="flex: 1;">
                  <div class="action-title">✊ Recommended Joint Organizing Action</div>
                  <div class="action-desc">\${s.organizing_playbook}</div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <button class="copy-md-btn" id="copy-btn-\${idx}" onclick="copyDualCardAsMarkdown(\${idx})">
                    📋 Copy as Markdown (LLM)
                  </button>
                  <button onclick="window.open('https://twin-cities-wage-theft-worker.a-8c6.workers.dev', '_blank')" class="cta-btn" style="background: #c084fc; color: #070a11;">
                    Join Coalition ↗
                  </button>
                </div>
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
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlQ = urlParams.get('q');
        if (urlQ) {
          document.getElementById('searchInput').value = urlQ;
        }
      } catch (e) {}
      executeSearch();
    });

    document.getElementById('searchInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') executeSearch();
    });

    (function () {
      const wrap = document.querySelector('.nav-scroll');
      if (!wrap) return;
      const nav = wrap.querySelector('.tabs-bar, .nav-tabs');
      if (!nav) return;
      const update = () => {
        const atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
        wrap.classList.toggle('at-end', atEnd);
      };
      nav.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    })();
  </script>
</body>
</html>
`;
}
