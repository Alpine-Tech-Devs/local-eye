import { describe, expect, it } from "vitest";

import { matchesTimeOfDay, resolveDateRange } from "./time";

describe("matchesTimeOfDay", () => {
  it("uses the Seacoast local time for each time window", () => {
    expect(matchesTimeOfDay(new Date("2026-10-27T15:59:00Z"), "morning")).toBe(true);
    expect(matchesTimeOfDay(new Date("2026-10-27T16:00:00Z"), "afternoon")).toBe(true);
    expect(matchesTimeOfDay(new Date("2026-10-27T20:59:00Z"), "afternoon")).toBe(true);
    expect(matchesTimeOfDay(new Date("2026-10-27T21:00:00Z"), "evening")).toBe(true);
  });

  it("matches all times for anytime", () => {
    expect(matchesTimeOfDay(new Date("2026-10-27T00:00:00Z"), "anytime")).toBe(true);
  });
});

describe("resolveDateRange", () => {
  it("resolves today and tomorrow as New York calendar days", () => {
    const now = new Date("2026-10-27T03:30:00Z");
    const today = resolveDateRange({ preset: "today" }, now);
    const tomorrow = resolveDateRange({ preset: "tomorrow" }, now);

    expect(today.start.toISOString()).toBe("2026-10-26T04:00:00.000Z");
    expect(today.end.toISOString()).toBe("2026-10-27T04:00:00.000Z");
    expect(tomorrow.start.toISOString()).toBe("2026-10-27T04:00:00.000Z");
  });

  it("resolves the current Saturday and Sunday as one weekend range", () => {
    const range = resolveDateRange(
      { preset: "weekend" },
      new Date("2026-10-31T16:00:00Z"),
    );

    expect(range.start.toISOString()).toBe("2026-10-31T04:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("uses the next weekend when called on a weekday", () => {
    const range = resolveDateRange(
      { preset: "weekend" },
      new Date("2026-10-27T12:00:00Z"),
    );

    expect(range.start.toISOString()).toBe("2026-10-31T04:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("resolves a custom date at local midnight", () => {
    const range = resolveDateRange(
      { preset: "custom", date: "2026-10-27" },
      new Date("2026-01-01T00:00:00Z"),
    );

    expect(range.start.toISOString()).toBe("2026-10-27T04:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-28T04:00:00.000Z");
  });
});
