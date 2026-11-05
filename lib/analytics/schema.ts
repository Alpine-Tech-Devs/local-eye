import { z } from "zod";

const eventId = z.uuid();

const searchPayload = z.object({
  filters: z.object({
    childAge: z.number().int().min(0).max(18).optional(),
    date: z.discriminatedUnion("preset", [
      z.object({ preset: z.enum(["today", "tomorrow", "weekend"]) }),
      z.object({ preset: z.literal("custom"), date: z.iso.date() }),
    ]),
    timeOfDay: z.enum(["morning", "afternoon", "evening", "anytime"]),
    maxDistanceMiles: z.number().positive().max(500),
    budget: z.enum(["free", "under10", "under20", "any"]),
    environment: z.enum(["indoor", "outdoor", "either"]),
    origin: z
      .string()
      .min(1)
      .max(32)
      .refine((origin) => !origin.includes(","), {
        message: "Use a town slug instead of exact coordinates.",
      }),
  }),
});

const eventPayload = z.object({
  eventId,
});

export const AnalyticsRequestSchema = z.discriminatedUnion("eventType", [
  z.object({
    anonId: eventId,
    eventType: z.literal("session_start"),
    payload: z.object({}),
  }),
  z.object({
    anonId: eventId,
    eventType: z.literal("search"),
    payload: searchPayload,
  }),
  z.object({
    anonId: eventId,
    eventType: z.literal("result_click"),
    payload: eventPayload.extend({
      position: z.number().int().min(1).max(3),
    }),
  }),
  ...(["source_click", "registration_click", "save", "unsave"] as const).map(
    (eventType) =>
      z.object({
        anonId: eventId,
        eventType: z.literal(eventType),
        payload: eventPayload,
      }),
  ),
]);

export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;
export type AnalyticsEventType = AnalyticsRequest["eventType"];
