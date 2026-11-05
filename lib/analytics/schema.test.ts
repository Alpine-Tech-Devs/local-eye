import { describe, expect, it } from "vitest";

import { AnalyticsRequestSchema } from "./schema";

const ANON_ID = "00000000-0000-4000-8000-000000000001";
const EVENT_ID = "00000000-0000-4000-8000-000000000002";

describe("AnalyticsRequestSchema", () => {
  it("accepts anonymous session starts", () => {
    expect(
      AnalyticsRequestSchema.safeParse({
        anonId: ANON_ID,
        eventType: "session_start",
        payload: {},
      }).success,
    ).toBe(true);
  });

  it("accepts searches with a coarse town origin", () => {
    expect(
      AnalyticsRequestSchema.safeParse({
        anonId: ANON_ID,
        eventType: "search",
        payload: {
          filters: {
            childAge: 3,
            date: { preset: "weekend" },
            timeOfDay: "morning",
            maxDistanceMiles: 25,
            budget: "under20",
            environment: "indoor",
            origin: "south-berwick",
          },
        },
      }).success,
    ).toBe(true);
  });

  it("rejects precise coordinates in search analytics", () => {
    const result = AnalyticsRequestSchema.safeParse({
      anonId: ANON_ID,
      eventType: "search",
      payload: {
        filters: {
          date: { preset: "today" },
          timeOfDay: "anytime",
          maxDistanceMiles: 25,
          budget: "any",
          environment: "either",
          origin: "43.0718,-70.7626",
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("validates ranked event clicks and unsave actions", () => {
    const resultClick = AnalyticsRequestSchema.safeParse({
      anonId: ANON_ID,
      eventType: "result_click",
      payload: { eventId: EVENT_ID, position: 3 },
    });
    const unsave = AnalyticsRequestSchema.safeParse({
      anonId: ANON_ID,
      eventType: "unsave",
      payload: { eventId: EVENT_ID },
    });

    expect(resultClick.success).toBe(true);
    expect(unsave.success).toBe(true);
  });

  it("rejects out-of-range result positions and unknown event types", () => {
    const invalidPosition = AnalyticsRequestSchema.safeParse({
      anonId: ANON_ID,
      eventType: "result_click",
      payload: { eventId: EVENT_ID, position: 4 },
    });
    const invalidType = AnalyticsRequestSchema.safeParse({
      anonId: ANON_ID,
      eventType: "delete_everything",
      payload: {},
    });

    expect(invalidPosition.success).toBe(false);
    expect(invalidType.success).toBe(false);
  });
});
