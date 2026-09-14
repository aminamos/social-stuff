import { describe, expect, it } from "vitest";
import { ADAPTERS, feedIds, getAdapter } from "../src/adapters";

describe("adapter registry", () => {
  it("has unique feed ids and resolves each one", () => {
    const ids = feedIds();
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(getAdapter(id)?.feed.id).toBe(id);
    }
    expect(getAdapter("no-such-feed")).toBe(undefined);
  });

  it("every adapter declares a stable sort key so pagination can't skip rows", () => {
    for (const a of ADAPTERS) {
      expect(a.source.orderBy, `${a.feed.id} needs orderBy`).toBeTruthy();
      expect(a.source.pageSize).toBeGreaterThan(0);
      expect(a.source.endpoint.startsWith("https://")).toBe(true);
    }
  });

  it("every adapter maps a parcel key (direct column or derived)", () => {
    for (const a of ADAPTERS) {
      const hasApn = Boolean(a.fieldMap.apn) || typeof a.computeApn === "function";
      expect(hasApn, `${a.feed.id} needs apn or computeApn`).toBe(true);
    }
  });
});
