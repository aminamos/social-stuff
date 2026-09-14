# Council Data Project (CDP) City Expansion Blueprint

A strategic and technical expansion roadmap for **[aminamos/cdp](https://github.com/aminamos/cdp)**. 

By replacing the legacy GCP/Firestore architecture with a unified **Neon PostgreSQL 17 (`pgvector`) + local Whisper (`large-v3-turbo`) + Node.js API** stack, onboarding new municipal jurisdictions is now lightweight, scalable, and independent of per-city cloud billing bottlenecks.

---

## 🗺️ City Feasibility & API Audit Matrix

We tested the live legislative systems and video sources across candidate cities:

| City / Agency | Legislative Backend | Web API Status | Video / Audio Source | Expansion Difficulty | Local Civic Tech Synergy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Minneapolis, MN** | Granicus / Legistar | 🟢 **Open (No auth)**<br>`webapi.legistar.com/v1/minneapolismn` (16 active bodies) | YouTube (`@CityofMinneapolis`) + Granicus MP4s | **Low** (Plug-and-play) | Fulfills dormant [OpenTwinCities#2](https://github.com/OpenTwinCities/project-ideas/issues/2) City Council Action Tracker. |
| **Saint Paul, MN** | Granicus / Legistar | 🟢 **Open (No auth)**<br>`webapi.legistar.com/v1/stpaul` (18 active bodies) | Saint Paul Cable 19 / Granicus MP4s | **Low** | Complements Minneapolis for a Twin Cities Metro legislative search hub. |
| **Oakland, CA** | Granicus / Legistar | 🟢 **Open (No auth)**<br>`webapi.legistar.com/v1/oakland` (150 active bodies) | KTOP Channel 10 + Granicus streaming | **Low** (Repo already scaffolded in `oakland/`) | Revives [OpenOakland's Councilmatic](https://github.com/openoakland/councilmatic) effort with AI transcription. |
| **San Francisco, CA** | Granicus / Legistar | 🟢 **Open (No auth)**<br>`webapi.legistar.com/v1/sfgov` (151 active bodies) | SFGovTV (`@SFGovTV` YouTube) | **Low** | Direct integration partner with Code for San Francisco (`sfbrigade`). |
| **Chicago, IL** | Granicus / Legistar | 🟡 **InSite HTML**<br>`chicago.legistar.com/Calendar.aspx` (Web API 500s; use InSite HTML parser) | Chicago City Clerk YouTube + Socrata Open Data | **Medium** | Directly solves [chihacknight/govbot#30](https://github.com/chihacknight/govbot/issues/30) (Chicago Councilmatic catalog). |
| **New York City, NY** | Granicus / Legistar | 🟡 **Token / InSite**<br>`legistar.council.nyc.gov` (Web API requires token; InSite HTML is open) | NYC Council Webcast / YouTube | **Medium** | Intersects with BetaNYC's municipal laws & budget tools (`BetaNYC/nyc-charter-laws-rules`). |

---

## 🚀 Why the Neon + Whisper Revival Changes the Economics of Expansion

In the original CDP architecture:
* Every new city required a **separate GCP project**, Firebase setup, Firestore database, GCS bucket, and custom domain routing.
* Transcription required spinning up **expensive CML GPU runners** on cloud virtual machines for every automated event gather.
* When cloud credits lapsed or API keys aged out, instances threw `permission-denied` (the exact issue affecting Seattle's legacy site).

In the **Neon Postgres + Local / Serverless Whisper Revival**:
1. **Multi-Tenant Single Database**: The `neon/migrations/001_initial_schema.sql` schema handles multiple cities via the `body` and `jurisdiction` tables in one centralized Postgres instance with row-level segregation.
2. **Instant Full-Text & Vector Search**: Postgres `pg_trgm` and `pgvector` handle both lexical searching and semantic embeddings without needing Elasticsearch or separate indexers.
3. **Local / Cheap Batch Transcription**: Fast `faster-whisper` (`large-v3-turbo` with `int8` quantization) can transcribe a 2-hour council session on a single consumer GPU or CPU instance in minutes for pennies.
4. **Unified API**: The lightweight Node.js API (`neon/api/server.mjs`) serves all municipal endpoints from a single lightweight container or Cloudflare Worker.

---

## 📋 Step-by-Step City Onboarding Recipe

To add a new city (e.g. **Minneapolis** or **Chicago**) into the revived CDP pipeline:

### Step 1: Probe the Legislative API
Query the target city's Legistar Web API or InSite calendar:
```bash
# Check available committees and legislative bodies
curl -s "https://webapi.legistar.com/v1/minneapolismn/bodies" | jq '.[].BodyName'
```

### Step 2: Seed the Jurisdiction in Neon
Add a record to the `jurisdiction` and `body` tables in Neon:
```sql
INSERT INTO jurisdiction (name, state, timezone) 
VALUES ('Minneapolis', 'MN', 'America/Chicago');

INSERT INTO body (jurisdiction_id, external_source_id, name)
VALUES 
  ((SELECT id FROM jurisdiction WHERE name = 'Minneapolis'), '1', 'City Council'),
  ((SELECT id FROM jurisdiction WHERE name = 'Minneapolis'), '2', 'Policy & Government Oversight Committee');
```

### Step 3: Configure Media Extraction
Identify the video hosting pattern:
* **YouTube**: If the city streams to YouTube (e.g., Minneapolis or Chicago Clerk), use `yt-dlp` to extract the audio stream (`m4a` / `opus`) directly without downloading high-res video.
* **Granicus**: If the city uses direct Granicus MP4 links, stream directly to ffmpeg.

### Step 4: Run Ingestion & Transcription
Run the ingestion script targeting the city's date range:
```bash
python neon/scripts/ingest_city_events.py \
  --city minneapolismn \
  --start-date 2026-09-01 \
  --end-date 2026-09-15
```
Run `transcribe_session.py`:
```bash
python neon/scripts/transcribe_session.py \
  --session-id <SESSION_UUID> \
  --model large-v3-turbo \
  --device cpu \
  --compute-type int8
```

### Step 5: Verify Search Documents
Confirm that agendas, minutes, and timestamped transcripts populate `search_document`:
```sql
SELECT title, snippet(body, 1, '<b>', '</b>', '...', 10) 
FROM search_document 
WHERE search_vector @@ plainto_tsquery('english', 'zoning');
```

---

## 🤝 Community Outreach & Collaboration Opportunities

When you launch these cities, reach out directly to the active groups we identified:

1. **Minneapolis & St. Paul**: Share with **Hennepin County Digital Services** and local urbanism/transit advocates. Minneapolis is currently navigating major housing and police reform ordinances that residents frequently want transcribed.
2. **Chicago**: Share directly with the **Chi Hack Night `govbot` working group** (`chihacknight/govbot`). They have open issue [#30](https://github.com/chihacknight/govbot/issues/30) looking for Chicago Councilmatic data right now.
3. **Oakland**: Connect with **OpenOakland** to revive the `openoakland/councilmatic` dashboard with CDP's automated transcripts.
4. **San Francisco**: Introduce to **Code for San Francisco (`sfbrigade`)**, who already run active data science civic hack projects.
