import { renderUI } from "./ui";

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  AUTH_SECRET?: string;
}

const MINNEAPOLIS_API_URL =
  "https://services.arcgis.com/afSMGVsC7QlRK1kZ/arcgis/rest/services/Active_Rental_Licenses/FeatureServer/0/query";

const STPAUL_COFO_API_URL =
  "https://services1.arcgis.com/9meaaHE3uiba0zr8/arcgis/rest/services/Certificate_of_Occupancy_-_Residential/FeatureServer/0/query";

const CHUNK_SIZE = 2000;
const DELAY_MS = 350;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(syncRegistry(env));
    ctx.waitUntil(syncStPaulRegistry(env));
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Interactive Web UI for Organizers, Tenants & Public
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderUI(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Trigger Minneapolis Sync
    if (url.pathname === "/sync") {
      const auth = request.headers.get("Authorization");
      if (env.AUTH_SECRET && auth !== `Bearer ${env.AUTH_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      ctx.waitUntil(syncRegistry(env));
      return new Response(JSON.stringify({ status: "Minneapolis sync initiated in background" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Trigger St Paul Sync
    if (url.pathname === "/sync/stpaul") {
      const auth = request.headers.get("Authorization");
      if (env.AUTH_SECRET && auth !== `Bearer ${env.AUTH_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      ctx.waitUntil(syncStPaulRegistry(env));
      return new Response(JSON.stringify({ status: "Saint Paul C of O sync initiated in background" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // List all municipalities and unit/license totals
    if (url.pathname === "/cities") {
      const citiesRes = await env.DB.prepare(`
        SELECT city, county, COUNT(*) as license_count, SUM(units) as total_units
        FROM rental_licenses
        GROUP BY city, county
        ORDER BY license_count DESC
      `).all();

      return new Response(JSON.stringify({ cities: citiesRes.results }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Search across all cities with de-anonymization metrics and wage theft crossover
    if (url.pathname === "/search") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) {
        return new Response(JSON.stringify({ error: "Missing query param ?q=" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const pattern = `%${q}%`;
      try {
        const searchRes = await env.DB.prepare(`
          SELECT 
            r.apn, r.address, r.city, r.county, r.owner_name, r.applicant_name, r.applicant_email, 
            r.units, r.tier, r.status,
            (SELECT COUNT(*) FROM rental_licenses r2 WHERE r2.applicant_email = r.applicant_email AND r.applicant_email != '') as sister_properties_count,
            (SELECT SUM(units) FROM rental_licenses r3 WHERE r3.applicant_email = r.applicant_email AND r.applicant_email != '') as total_syndicate_units,
            (SELECT case_id || '::' || violation_type || '::' || back_wages_recovered || '::' || workers_affected 
             FROM wage_theft_records w 
             WHERE (w.trade_name != '' AND (
                 instr(lower(r.owner_name), lower(w.trade_name)) > 0 
                 OR instr(lower(r.applicant_name), lower(w.trade_name)) > 0 
                 OR instr(lower(r.applicant_email), lower(w.trade_name)) > 0
             ))
             OR (w.respondent_legal_name != '' AND (
                 instr(lower(r.owner_name), lower(w.respondent_legal_name)) > 0 
                 OR instr(lower(r.applicant_name), lower(w.respondent_legal_name)) > 0
             ))
             OR (lower(w.trade_name) LIKE '%fitterer%' AND (
                 instr(lower(r.owner_name), 'fitterer') > 0 
                 OR instr(lower(r.applicant_name), 'fitterer') > 0 
                 OR instr(lower(r.applicant_email), 'ipgliving') > 0
             ))
             LIMIT 1) as wage_theft_match
          FROM rental_licenses r
          WHERE r.owner_name LIKE ?1
             OR r.applicant_name LIKE ?1
             OR r.applicant_email LIKE ?1
             OR r.address LIKE ?1
             OR r.apn LIKE ?1
          ORDER BY r.units DESC
          LIMIT 50
        `).bind(pattern).all();

        return new Response(JSON.stringify({ query: q, results: searchRes.results }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Search wage theft and labor enforcement records
    if (url.pathname === "/wage-theft") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) {
        return new Response(JSON.stringify({ error: "Missing query param ?q=" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const pattern = `%${q}%`;
      const wageRes = await env.DB.prepare(`
        SELECT * FROM wage_theft_records
        WHERE respondent_legal_name LIKE ?1
           OR trade_name LIKE ?1
           OR case_id LIKE ?1
           OR description LIKE ?1
           OR address LIKE ?1
        ORDER BY (back_wages_recovered + settlement_amount) DESC
        LIMIT 50
      `).bind(pattern).all();

      return new Response(JSON.stringify({ query: q, results: wageRes.results }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Top wage theft offenders
    if (url.pathname === "/wage-theft/top") {
      const topRes = await env.DB.prepare(`
        SELECT 
          respondent_legal_name,
          trade_name,
          city,
          COUNT(*) as case_count,
          SUM(back_wages_recovered) as total_back_wages,
          SUM(civil_penalties_assessed) as total_penalties,
          SUM(COALESCE(NULLIF(settlement_amount, 0), back_wages_recovered + civil_penalties_assessed)) as total_recovered,
          SUM(workers_affected) as total_workers_affected,
          MAX(repeat_violator) as is_repeat_violator
        FROM wage_theft_records
        GROUP BY respondent_legal_name
        ORDER BY total_recovered DESC
        LIMIT 20
      `).all();

      return new Response(JSON.stringify({ top_wage_theft_offenders: topRes.results }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/stats") {
      const countRes = await env.DB.prepare("SELECT COUNT(*) as total FROM rental_licenses").first();
      const topSyndicates = await env.DB.prepare(`
        SELECT applicant_email, applicant_name, COUNT(*) as props, SUM(units) as total_units
        FROM rental_licenses
        WHERE applicant_email != ''
        GROUP BY applicant_email
        HAVING props > 1
        ORDER BY total_units DESC
        LIMIT 10
      `).all();

      return new Response(JSON.stringify({ stats: countRes, top_syndicates: topSyndicates.results }, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      "Twin Cities Metro Housing & Labor Standards Registry Worker. Endpoints: /sync, /sync/stpaul, /cities, /search?q=..., /wage-theft?q=..., /wage-theft/top, /stats",
      { status: 200 }
    );

  },
};

async function syncRegistry(env: Env): Promise<void> {
  let offset = 0;
  let allRecords: any[] = [];
  const syncedAt = new Date().toISOString();

  while (true) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields:
        "apn,address,ownerName,ownerAddress1,ownerCity,ownerState,ownerZip,ownerPhone,ownerEmail,applicantName,applicantPhone,applicantEmail,licensedUnits,tier,status",
      returnGeometry: "false",
      resultOffset: offset.toString(),
      resultRecordCount: CHUNK_SIZE.toString(),
      f: "json",
    });

    const response = await fetch(`${MINNEAPOLIS_API_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "TenantUnionResearchBot/1.0 (+https://github.com/aminamos/social-tokens-projects)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`ArcGIS fetch failed at offset ${offset}: ${response.statusText}`);
      break;
    }

    const data: any = await response.json();
    const features = data.features || [];
    if (features.length === 0) break;

    // Collect records
    const batchStatements: D1PreparedStatement[] = [];
    for (const f of features) {
      const a = f.attributes || {};
      const apn = (a.apn || "").trim();
      if (!apn) continue;

      allRecords.push(a);

      batchStatements.push(
        env.DB.prepare(`
          INSERT INTO rental_licenses (
            apn, address, city, county, owner_name, owner_address, owner_city, owner_state, owner_zip,
            owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
            units, tier, status, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(apn) DO UPDATE SET
            address=excluded.address,
            city=excluded.city,
            county=excluded.county,
            owner_name=excluded.owner_name,
            owner_address=excluded.owner_address,
            applicant_name=excluded.applicant_name,
            applicant_email=excluded.applicant_email,
            applicant_phone=excluded.applicant_phone,
            units=excluded.units,
            tier=excluded.tier,
            status=excluded.status,
            synced_at=excluded.synced_at
        `).bind(
          apn,
          (a.address || "").trim(),
          "Minneapolis",
          "Hennepin",
          (a.ownerName || "").trim(),
          (a.ownerAddress1 || "").trim(),
          (a.ownerCity || "").trim(),
          (a.ownerState || "").trim(),
          (a.ownerZip || "").trim(),
          (a.ownerPhone || "").trim(),
          (a.ownerEmail || "").trim(),
          (a.applicantName || "").trim(),
          (a.applicantPhone || "").trim(),
          (a.applicantEmail || "").trim(),
          parseInt(a.licensedUnits || "1", 10),
          (a.tier || "Tier 1").trim(),
          (a.status || "Active").trim(),
          syncedAt
        )
      );

      if (batchStatements.length >= 100) {
        await env.DB.batch(batchStatements.splice(0, 100));
      }
    }

    if (batchStatements.length > 0) {
      await env.DB.batch(batchStatements);
    }

    if (features.length < CHUNK_SIZE) break;
    offset += CHUNK_SIZE;
    await sleep(DELAY_MS);
  }

  if (allRecords.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const key = `snapshots/minneapolis_rental_licenses_${today}.json`;
    const jsonStr = JSON.stringify(allRecords);

    await env.R2_BUCKET.put(key, jsonStr, {
      httpMetadata: { contentType: "application/json" },
      customMetadata: { recordCount: allRecords.length.toString(), syncedAt },
    });
    console.log(`Saved ${allRecords.length} records snapshot to R2: ${key}`);
  }
}

async function syncStPaulRegistry(env: Env): Promise<void> {
  let offset = 0;
  let allRecords: any[] = [];
  const syncedAt = new Date().toISOString();

  while (true) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "OBJECTID,PROPNAME,UNITS,PRIMOCCTYPE,ADDRESS,SUB_TYPE,STATUS,PIN,GRADE,RENEWAL_DUE",
      returnGeometry: "false",
      resultOffset: offset.toString(),
      resultRecordCount: CHUNK_SIZE.toString(),
      f: "json",
    });

    const response = await fetch(`${STPAUL_COFO_API_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "TenantUnionResearchBot/1.0 (+https://github.com/aminamos/social-tokens-projects)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Saint Paul fetch failed at offset ${offset}: ${response.statusText}`);
      break;
    }

    const data: any = await response.json();
    const features = data.features || [];
    if (features.length === 0) break;

    const batchStatements: D1PreparedStatement[] = [];
    for (const f of features) {
      const a = f.attributes || {};
      const pin = (a.PIN || a.OBJECTID || "").toString().trim();
      if (!pin) continue;

      allRecords.push(a);

      batchStatements.push(
        env.DB.prepare(`
          INSERT INTO rental_licenses (
            apn, address, city, county, owner_name, owner_address, owner_city, owner_state, owner_zip,
            owner_phone, owner_email, applicant_name, applicant_phone, applicant_email,
            units, tier, status, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(apn) DO UPDATE SET
            address=excluded.address,
            city=excluded.city,
            county=excluded.county,
            owner_name=excluded.owner_name,
            units=excluded.units,
            tier=excluded.tier,
            status=excluded.status,
            synced_at=excluded.synced_at
        `).bind(
          `STP-${pin}`,
          (a.ADDRESS || "").trim(),
          "Saint Paul",
          "Ramsey",
          (a.PROPNAME || "Unknown St. Paul Landlord").trim(),
          "",
          "Saint Paul",
          "MN",
          "",
          "",
          "",
          (a.PRIMOCCTYPE || "").trim(),
          "",
          "",
          parseInt(a.UNITS || "1", 10),
          a.GRADE ? `Grade ${a.GRADE}` : "Grade A",
          (a.STATUS || "Active").trim(),
          syncedAt
        )
      );

      if (batchStatements.length >= 100) {
        await env.DB.batch(batchStatements.splice(0, 100));
      }
    }

    if (batchStatements.length > 0) {
      await env.DB.batch(batchStatements);
    }

    if (features.length < CHUNK_SIZE) break;
    offset += CHUNK_SIZE;
    await sleep(DELAY_MS);
  }

  if (allRecords.length > 0) {
    const today = new Date().toISOString().split("T")[0];
    const key = `snapshots/stpaul_rental_cofo_${today}.json`;
    const jsonStr = JSON.stringify(allRecords);

    await env.R2_BUCKET.put(key, jsonStr, {
      httpMetadata: { contentType: "application/json" },
      customMetadata: { recordCount: allRecords.length.toString(), syncedAt },
    });
    console.log(`Saved ${allRecords.length} St. Paul records snapshot to R2: ${key}`);
  }
}
