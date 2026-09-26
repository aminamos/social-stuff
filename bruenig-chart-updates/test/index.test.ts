import { describe, expect, it, vi, afterEach } from "vitest";
import worker, { detectVintage, compareVintage } from "../src/index";
import { chartFigure } from "../src/ui";

type Row = Record<string, unknown>;

/* Minimal in-memory D1: SELECT filters on `WHERE col = ?` binds (and a
 * series_id IN list), INSERT/UPDATE apply writes. Ordering is ignored —
 * the worker sorts points/series again at render time where it matters. */
function fakeD1(seed: { charts?: Row[]; series?: Row[]; points?: Row[]; releases?: Row[]; change_log?: Row[] }) {
  const tables: Record<string, Row[]> = {
    charts: seed.charts ?? [],
    series: seed.series ?? [],
    points: seed.points ?? [],
    releases: seed.releases ?? [],
    change_log: seed.change_log ?? [],
  };
  const autoId = { n: 0 };
  function select(table: string, sql: string, binds: unknown[]): Row[] {
    let rows = tables[table].map((r) => ({ ...r }));
    const where = /WHERE\s+(.+?)(?:\s+ORDER|\s*$)/is.exec(sql);
    if (where) {
      const inMatch = /(\w+)\s+IN\s*\(([^)]*)\)/i.exec(where[1]);
      if (inMatch) {
        const col = inMatch[1];
        const vals = binds.slice(0, inMatch[2].split(",").length);
        rows = rows.filter((r) => vals.includes(r[col]));
      } else {
        const cols = [...where[1].matchAll(/(\w+)\s*=\s*\?/g)].map((m) => m[1]);
        rows = rows.filter((r) => cols.every((c, i) => r[c] === binds[i]));
      }
    }
    return rows;
  }

  function applyWrite(sql: string, binds: unknown[]) {
    const ins = /INSERT\s+INTO\s+(\w+)\s*\(([^)]*)\)\s*VALUES\s*\(([^)]*)\)/is.exec(sql);
    if (ins) {
      const table = ins[1];
      const cols = ins[2].split(",").map((c) => c.trim());
      const row: Row = {};
      let bi = 0;
      for (const c of cols) row[c] = binds[bi++];
      if (table === "change_log" && row.id === undefined) row.id = ++autoId.n;
      if (table === "change_log" && row.detected_at === undefined) row.detected_at = "2026-10-02 08:00:00";
      tables[table].push(row);
      return;
    }
    const upd = /UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(\w+)\s*=\s*\?/is.exec(sql);
    if (upd) {
      const rows = tables[upd[1]].filter((r) => r[upd[3]] === binds[binds.length - 1]);
      let bi = 0;
      for (const part of upd[2].split(",")) {
        const eq = part.indexOf("=");
        const col = part.slice(0, eq).trim();
        const expr = part.slice(eq + 1).trim();
        const val = expr === "?" ? binds[bi++] : /^-?\d+(\.\d+)?$/.test(expr) ? Number(expr) : "now";
        for (const r of rows) r[col] = val;
      }
      return;
    }
    throw new Error(`fakeD1: unhandled SQL: ${sql}`);
  }

  const db = {
    prepare(sql: string) {
      let binds: unknown[] = [];
      const stmt = {
        bind(...b: unknown[]) {
          binds = b;
          return stmt;
        },
        async all<T = Row>(): Promise<{ results: T[] }> {
          const table = /FROM\s+(\w+)/i.exec(sql)![1];
          return { results: select(table, sql, binds) as T[] };
        },
        async first<T = Row>(): Promise<T | null> {
          const table = /FROM\s+(\w+)/i.exec(sql)![1];
          return (select(table, sql, binds)[0] as T) ?? null;
        },
        async run(): Promise<{ success: true }> {
          if (/^\s*(INSERT|UPDATE|DELETE)/i.test(sql)) applyWrite(sql, binds);
          return { success: true };
        },
      };
      return stmt;
    },
  };
  return { db: db as unknown as D1Database, tables };
}

function fakeR2(objects: Record<string, string> = {}) {
  return {
    async get(key: string) {
      if (!(key in objects)) return null;
      return { body: objects[key], httpEtag: `"etag-${key}"` };
    },
  } as unknown as R2Bucket;
}

const PROVENANCE = JSON.stringify({
  bruenig_post_url: "https://www.peoplespolicyproject.org/2023/09/18/who-are-the-poor-in-2021-and-2022/",
  bruenig_post_title: "Who Are the Poor in 2021 and 2022?",
  source_name: "CPS ASEC public-use files",
  source_url: "https://www2.census.gov/programs-surveys/cps/datasets/",
  recipe_md: "Market income = pre-tax cash income.\nDisposable = +transfers -taxes -MOOP.",
});

function seededEnv(
  r2Objects: Record<string, string> = {},
  opts: { provenance?: Record<string, unknown>; charts?: Row[]; series?: Row[]; points?: Row[] } = {}
) {
  const { db, tables } = fakeD1({
    charts: [
      {
        slug: "market-vs-disposable-poverty",
        family: "poverty",
        title: "Market vs disposable poverty, all persons",
        subtitle: "SPM-style rates",
        provenance: JSON.stringify({ ...JSON.parse(PROVENANCE), ...(opts.provenance ?? {}) }),
        updated_at: "2026-09-20 00:00:00",
      },
      ...(opts.charts ?? []),
    ],
    series: [
      { id: "market-vs-disposable-poverty:market", chart_slug: "market-vs-disposable-poverty", label: "Market-income poverty", unit: "percent" },
      { id: "market-vs-disposable-poverty:disposable", chart_slug: "market-vs-disposable-poverty", label: "Disposable poverty", unit: "percent" },
      ...(opts.series ?? []),
    ],
    points: [
      { series_id: "market-vs-disposable-poverty:market", x: "2023", y: 24.1 },
      { series_id: "market-vs-disposable-poverty:market", x: "2024", y: 23.8 },
      { series_id: "market-vs-disposable-poverty:market", x: "2025", y: 24.4 },
      { series_id: "market-vs-disposable-poverty:disposable", x: "2023", y: 11.7 },
      { series_id: "market-vs-disposable-poverty:disposable", x: "2024", y: 12.9 },
      { series_id: "market-vs-disposable-poverty:disposable", x: "2025", y: 12.4 },
      ...(opts.points ?? []),
    ],
    releases: [
      {
        dataset: "cps-asec",
        label: "CPS ASEC public-use files",
        source_index_url: "https://www2.census.gov/programs-surveys/cps/datasets/",
        latest_vintage: "2026",
        checked_at: "2026-09-02 08:00:00",
        stale: 0,
      },
    ],
    change_log: [],
  });
  return { env: { DB: db, R2_DATA: fakeR2(r2Objects) }, tables };
}

describe("GET /chart/<slug>", () => {
  it("renders both series' points as grouped bars with legend and provenance", async () => {
    const { env } = seededEnv();
    const res = await worker.fetch(new Request("https://x.test/chart/market-vs-disposable-poverty"), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("<svg");
    // yearly x → grouped bars: 6 points across 2 series carry their values in <title>
    expect((html.match(/<rect /g) ?? []).length).toBe(6);
    expect(html).not.toContain("<polyline");
    expect(html).toContain("24.4");
    expect(html).toContain("Market-income poverty");
    expect(html).toContain("Disposable poverty");
    // provenance block: original post link, source dataset link, recipe
    expect(html).toContain("who-are-the-poor-in-2021-and-2022");
    expect(html).toContain("CPS ASEC public-use files");
    expect(html).toContain("Market income = pre-tax cash income");
    expect(html).toContain("2026-09-20");
  });

  it("shows the archived original above the updated chart and marks post-window years", async () => {
    const { env } = seededEnv(
      {},
      {
        provenance: {
          original_charts: [
            {
              title: "SPM Income 2021–2022",
              source_url: "https://www.peoplespolicyproject.org/2023/09/18/who-are-the-poor-in-2021-and-2022/",
              r2_key: "originals/market-vs-disposable-poverty/spm-2021-2022.svg",
            },
          ],
          original_window: { first_x: "2021", last_x: "2024" },
        },
      }
    );
    const res = await worker.fetch(new Request("https://x.test/chart/market-vs-disposable-poverty"), env);
    const html = await res.text();
    // Original section: archived SVG served from /docs/originals/, linked + dated
    expect(html).toContain('src="/docs/originals/market-vs-disposable-poverty/spm-2021-2022.svg"');
    expect(html).toContain("as published 2023-09-18");
    expect(html.indexOf("<h2>Original</h2>")).toBeGreaterThan(-1);
    expect(html.indexOf("<h2>Original</h2>")).toBeLessThan(html.indexOf("<h2>Updated</h2>"));
    // Window: 2023–2024 bars in Bruenig's black/red, 2025 bars in the update
    // accent, plus a dashed divider + legend note
    expect(html).toContain('fill="#000000"');
    expect(html).toContain('fill="#980000"');
    expect(html).toContain('fill="#1d4ed8"');
    expect(html).toContain("stroke-dasharray");
    expect(html).toContain("data added after the original article");
  });

  it("renders 'update pending' when a chart has an archived original but no series data", async () => {
    const { env } = seededEnv(
      {},
      {
        charts: [
          {
            slug: "norway-wealth-tax",
            family: "wealth",
            title: "Norway wealth tax",
            subtitle: null,
            provenance: JSON.stringify({
              bruenig_post_url: "https://peoplespolicyproject.org/2023/10/23/wealth-distribution-in-2022/",
              bruenig_post_title: "Wealth Distribution in 2022",
              original_charts: [{ title: "Norway", r2_key: "originals/norway-wealth-tax/norway.svg" }],
            }),
            updated_at: "2026-09-26 00:00:00",
          },
        ],
      }
    );
    const res = await worker.fetch(new Request("https://x.test/chart/norway-wealth-tax"), env);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('src="/docs/originals/norway-wealth-tax/norway.svg"');
    expect(html).toContain("Update pending");
    expect(html).not.toContain('figure class="chart"');
  });

  it("404s for an unknown slug", async () => {
    const { env } = seededEnv();
    const res = await worker.fetch(new Request("https://x.test/chart/no-such-chart"), env);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/chart/<slug>", () => {
  it("returns the chart's shaped series and points", async () => {
    const { env } = seededEnv();
    const res = await worker.fetch(new Request("https://x.test/api/chart/market-vs-disposable-poverty"), env);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      slug: string;
      family: string;
      provenance: { source_name: string };
      series: { label: string; unit: string; points: { x: string; y: number }[] }[];
    };
    expect(body.slug).toBe("market-vs-disposable-poverty");
    expect(body.family).toBe("poverty");
    expect(body.provenance.source_name).toBe("CPS ASEC public-use files");
    expect(body.series).toHaveLength(2);
    const market = body.series.find((s) => s.label === "Market-income poverty")!;
    expect(market.unit).toBe("percent");
    expect(market.points).toContainEqual({ x: "2025", y: 24.4 });
  });

  it("404s unknown slugs in the API too", async () => {
    const { env } = seededEnv();
    const res = await worker.fetch(new Request("https://x.test/api/chart/missing"), env);
    expect(res.status).toBe(404);
  });
});

describe("GET /docs/<key>", () => {
  it("rejects path traversal, including percent-encoded dot-dot", async () => {
    const { env } = seededEnv({ "asec/2025/readme.txt": "hi" });
    for (const p of ["/docs/%2e%2e/secret.txt", "/docs/%2e%2e%2fsecret.txt", "/docs/asec/%2e%2e/%2e%2e/x"]) {
      const res = await worker.fetch(new Request(`https://x.test${p}`), env);
      expect(res.status, p).toBe(404);
    }
  });

  it("rejects keys outside the dataset prefixes", async () => {
    const { env } = seededEnv();
    const res = await worker.fetch(new Request("https://x.test/docs/secrets/config.txt"), env);
    expect(res.status).toBe(404);
  });

  it("serves archived original SVGs under the originals/ prefix", async () => {
    const { env } = seededEnv({ "originals/wealth-shares/deciles-2022.svg": "<svg></svg>" });
    const res = await worker.fetch(new Request("https://x.test/docs/originals/wealth-shares/deciles-2022.svg"), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/svg+xml");
    expect(await res.text()).toBe("<svg></svg>");
  });

  it("serves an archived file under a dataset prefix", async () => {
    const { env } = seededEnv({ "asec/2025/asecpub25csv.zip": "PK-bytes" });
    const res = await worker.fetch(new Request("https://x.test/docs/asec/2025/asecpub25csv.zip"), env);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    expect(await res.text()).toBe("PK-bytes");
  });
});

describe("vintage detection", () => {
  it("picks the max year from capture-group-1 matches", () => {
    const body = '<a href="datasets/2024/march/">x</a><a href="datasets/2026/march/">y</a><a href="datasets/2025/march/">z</a>';
    expect(detectVintage(body, "datasets/(\\d{4})/march/")).toBe("2026");
  });
  it("compares vintages numerically", () => {
    expect(compareVintage("2026", "2025")).toBeGreaterThan(0);
    expect(compareVintage("2025", "2026")).toBeLessThan(0);
    expect(compareVintage("1.4", "1.10")).toBeLessThan(0); // component-wise: 4 < 10, not float 1.4 > 1.1
  });
});
describe("chartFigure", () => {
  it("lays 'YYYY:Qn' quarters out on a continuous time axis (line, not bars)", () => {
    const html = chartFigure([
      {
        id: "wealth:top1",
        label: "Top 1%",
        unit: "percent",
        points: [
          { x: "1989:Q3", y: 29.9 },
          { x: "1998:Q1", y: 33.7 },
          { x: "2026:Q2", y: 30.8 },
        ],
      },
    ]);
    expect(html).toContain("<polyline");
    expect(html).not.toContain("<rect");
    // quarters map to fractional positions: 1989:Q3→1989.5, 1998:Q1→1998.0,
    // 2026:Q2→2026.25 — gaps proportional to elapsed time, not index spacing
    const circles = [...html.matchAll(/cx="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(circles).toHaveLength(3);
    // 1989.5→1998.0 = 8.5 of 36.75 span ≈ 23%; 1998.0→2026.25 = 28.25 ≈ 77%
    const span = circles[2] - circles[0];
    expect((circles[1] - circles[0]) / span).toBeCloseTo(8.5 / 36.75, 1);
    expect(html).toContain("1989");
    expect(html).toContain("2026");
  });

  it("renders country-code x like 'USA:2023' as grouped bars", () => {
    const html = chartFigure([
      {
        id: "intl:market",
        label: "Market",
        unit: "percent",
        points: [
          { x: "USA:2023", y: 28 },
          { x: "GBR:2023", y: 25 },
        ],
      },
      {
        id: "intl:disp",
        label: "Disposable",
        unit: "percent",
        points: [
          { x: "USA:2023", y: 17 },
          { x: "GBR:2023", y: 14 },
        ],
      },
    ]);
    expect(html).toContain("<rect");
    expect(html).not.toContain("<polyline");
    expect(html).toContain("USA:2023");
    expect(html).toContain("GBR:2023");
  });
  it("marks quarters after the original window with a divider and accented points", () => {
    const html = chartFigure(
      [
        {
          id: "wealth:top1",
          label: "Top 1%",
          unit: "percent",
          points: [
            { x: "1989:Q3", y: 29.9 },
            { x: "1998:Q1", y: 33.7 },
            { x: "2026:Q2", y: 30.8 },
          ],
        },
      ],
      { first_x: "2022:Q3", last_x: "2022:Q3" }
    );
    expect(html).toContain("<polyline");
    expect(html).toContain("stroke-dasharray"); // the 'updated' divider
    expect(html).toContain("data added after the original article");
    // only the 2026:Q2 point is newer than last_x → one accented marker
    expect((html.match(/stroke="#1d4ed8"/g) ?? []).length).toBeGreaterThanOrEqual(2); // divider line + circle stroke
  });

  it("renders categorical decile x in order D2 before D10", () => {
    const html = chartFigure([
      {
        id: "wealth:deciles",
        label: "Share",
        unit: "percent",
        points: [
          { x: "D10", y: 70 },
          { x: "D2", y: 4 },
          { x: "D1", y: 2 },
        ],
      },
    ]);
    const d1 = html.indexOf(">D1<");
    const d2 = html.indexOf(">D2<");
    const d10 = html.indexOf(">D10<");
    expect(d1).toBeGreaterThan(-1);
    expect(d1).toBeLessThan(d2);
    expect(d2).toBeLessThan(d10);
  });
});

describe("scheduled vintage check", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("flags a newer index vintage as stale and logs the change", async () => {
    const { env, tables } = seededEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('<a href="2026/">old</a><a href="2027/">new</a>', { status: 200 }))
    );
    await worker.scheduled({} as ScheduledEvent, env, {} as ExecutionContext);
    const rel = tables.releases.find((r) => r.dataset === "cps-asec")!;
    expect(rel.latest_vintage).toBe("2027");
    expect(rel.stale).toBe(1);
    expect(tables.change_log).toHaveLength(1);
    expect(tables.change_log[0]).toMatchObject({ dataset: "cps-asec", old_vintage: "2026", new_vintage: "2027" });
  });

  it("does not flag stale when the newest vintage is unchanged", async () => {
    const { env, tables } = seededEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('<a href="2025/">a</a><a href="2026/">b</a>', { status: 200 }))
    );
    await worker.scheduled({} as ScheduledEvent, env, {} as ExecutionContext);
    const rel = tables.releases.find((r) => r.dataset === "cps-asec")!;
    expect(rel.latest_vintage).toBe("2026");
    expect(rel.stale).toBe(0);
    expect(rel.checked_at).toBe("now");
    expect(tables.change_log).toHaveLength(0);
  });

  it("sends Accept: text/csv to the OECD SDMX index and parses CSV vintages", async () => {
    const { db, tables } = fakeD1({
      releases: [
        {
          dataset: "oecd-idd",
          label: "OECD IDD",
          source_index_url: "https://sdmx.oecd.org/public/rest/v1/data/OECD.WISE.INE,DSD_WISE_IDD@DF_IDD/USA.A.PR_INC_DISP._Z.PT_POP._T.METH2012.D_CUR.PL_50",
          latest_vintage: "2023",
          checked_at: null,
          stale: 0,
        },
      ],
    });
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response("USA,A,PR_INC_DISP,2022,1\nUSA,A,PR_INC_DISP,2023,1\n", { status: 200 })
    );
    vi.stubGlobal("fetch", fetchSpy);
    await worker.scheduled({} as ScheduledEvent, { DB: db, R2_DATA: fakeR2() }, {} as ExecutionContext);
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Accept).toBe("text/csv");
    // regex ',(\\d{4}),\\d' capture = year; 2023 == stored 2023 → no stale flag
    expect(tables.releases[0].checked_at).toBe("now");
    expect(tables.releases[0].stale).toBe(0);
  });
});
