import { afterEach, describe, expect, it, vi } from "vitest";
import { minneapolis } from "../src/adapters/arcgis/minneapolis";
import { fetchPage as arcgisFetchPage } from "../src/platforms/arcgis";
import { HttpError, isTransient, withRetry } from "../src/platforms/http";
import { fetchPage as socrataFetchPage } from "../src/platforms/socrata";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "Content-Type": "application/json" },
  });
}

describe("HttpError / isTransient", () => {
  it("treats 429 and 5xx as transient, 400s as fatal", () => {
    expect(isTransient(new HttpError(429, "slow down"))).toBe(true);
    expect(isTransient(new HttpError(503, "flake"))).toBe(true);
    expect(isTransient(new HttpError(404, "gone"))).toBe(false);
    expect(isTransient(new Error("boom"))).toBe(false);
  });
});

describe("withRetry", () => {
  it("returns on first success without retrying", async () => {
    const fn = vi.fn(async () => "ok");
    await expect(withRetry(fn, 4, 1)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new HttpError(503, "flake"))
      .mockResolvedValueOnce("recovered");
    await expect(withRetry(fn, 4, 1)).resolves.toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry fatal errors", async () => {
    const fn = vi.fn(async () => {
      throw new HttpError(400, "bad request");
    });
    await expect(withRetry(fn, 4, 1)).rejects.toThrow("bad request");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("throws the last error after exhausting attempts", async () => {
    const fn = vi.fn(async () => {
      throw new HttpError(503, "still down");
    });
    await expect(withRetry(fn, 3, 1)).rejects.toThrow("still down");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("ArcGIS fetchPage", () => {
  it("unwraps feature attributes and pages with a stable sort", async () => {
    let seenUrl = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        seenUrl = url;
        return jsonResponse({ features: [{ attributes: { apn: "1" } }, {}] });
      }),
    );
    const page = await arcgisFetchPage(minneapolis, 0);
    expect(page.rows).toEqual([{ apn: "1" }, {}]);
    // Fewer rows than pageSize and no transfer-limit flag: done.
    expect(page.hasMore).toBe(false);
    expect(seenUrl).toContain("orderByFields=apn");
    expect(seenUrl).toContain("resultOffset=0");
    expect(seenUrl).toContain("returnGeometry=false");
  });

  it("keeps paging when the transfer limit is exceeded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ features: [], exceededTransferLimit: true })));
    const page = await arcgisFetchPage(minneapolis, 2000);
    expect(page.hasMore).toBe(true);
  });

  it("applies query defaults when the adapter declares none", async () => {
    let seenUrl = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        seenUrl = url;
        return jsonResponse({ features: [] });
      }),
    );
    const bare = {
      ...minneapolis,
      source: { platform: "arcgis", endpoint: minneapolis.source.endpoint, dataset: "x", pageSize: 50 },
    } as typeof minneapolis;
    await arcgisFetchPage(bare, 0);
    expect(seenUrl).toContain(`where=${encodeURIComponent("1=1")}`);
    expect(seenUrl).toContain("outFields=*");
    expect(seenUrl).not.toContain("orderByFields");
  });

  it("throws HttpError on HTTP failure and Error on payload errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 500)));
    await expect(arcgisFetchPage(minneapolis, 0)).rejects.toBeInstanceOf(HttpError);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: { code: 400, message: "bad" } })),
    );
    await expect(arcgisFetchPage(minneapolis, 0)).rejects.toThrow("ArcGIS error");
  });
});

describe("platform fetchPage dispatcher", () => {
  it("routes arcgis and socrata to their clients", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ features: [] })));
    const { fetchPage } = await import("../src/platforms/index");
    await expect(fetchPage("arcgis", minneapolis, 0)).resolves.toEqual({ rows: [], hasMore: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse([])));
    const { nyc } = await import("../src/adapters/socrata/nyc");
    await expect(fetchPage("socrata", nyc, 0)).resolves.toEqual({ rows: [], hasMore: false });
  });

  it("rejects unimplemented and unknown platforms", async () => {
    const { fetchPage } = await import("../src/platforms/index");
    const { nyc } = await import("../src/adapters/socrata/nyc");
    await expect(fetchPage("ckan", nyc, 0)).rejects.toThrow("not implemented");
    await expect(fetchPage("bogus" as never, nyc, 0)).rejects.toThrow("Unknown platform");
  });
});

describe("Socrata fetchPage", () => {
  it("returns rows and sends the app token when configured", async () => {
    let seenHeaders: Record<string, string> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        seenHeaders = (init.headers ?? {}) as Record<string, string>;
        return jsonResponse([{ violationid: "1" }]);
      }),
    );
    const { nyc } = await import("../src/adapters/socrata/nyc");
    const page = await socrataFetchPage(nyc, 0, "token-abc");
    expect(page.rows).toEqual([{ violationid: "1" }]);
    expect(seenHeaders["X-App-Token"]).toBe("token-abc");
  });

  it("rejects non-array payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ not: "an array" })));
    const { nyc } = await import("../src/adapters/socrata/nyc");
    await expect(socrataFetchPage(nyc, 0)).rejects.toThrow("non-array");
  });

  it("throws HttpError on HTTP failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 429)));
    const { nyc } = await import("../src/adapters/socrata/nyc");
    await expect(socrataFetchPage(nyc, 0)).rejects.toBeInstanceOf(HttpError);
  });
});
