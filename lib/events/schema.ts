import { z } from "zod";

import { EVENT_CATEGORIES, type Event } from "./types";

const nullableNonNegativeNumber = z.number().nonnegative().nullable();
const nullableUrl = z.url().nullable();
const isoDateTime = z.iso.datetime({ offset: true });

export const EventSchema: z.ZodType<Event> = z
  .object({
    id: z.uuid(),
    title: z.string().trim().min(1),
    description: z.string().nullable(),
    venueName: z.string().trim().min(1),
    address: z.string().nullable(),
    city: z.string().trim().min(1),
    state: z.string().regex(/^[A-Z]{2}$/),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    startDateTime: isoDateTime,
    endDateTime: isoDateTime.nullable(),
    minAge: nullableNonNegativeNumber,
    maxAge: nullableNonNegativeNumber,
    priceMin: nullableNonNegativeNumber,
    priceMax: nullableNonNegativeNumber,
    isFree: z.boolean(),
    indoorOutdoor: z.enum(["indoor", "outdoor", "either"]),
    category: z.enum(EVENT_CATEGORIES),
    registrationRequired: z.boolean(),
    registrationUrl: nullableUrl,
    imageUrl: nullableUrl,
    sourceName: z.string().trim().min(1),
    sourceUrl: z.url(),
    lastVerifiedAt: isoDateTime.nullable(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .refine(
    (event) =>
      event.endDateTime === null ||
      Date.parse(event.endDateTime) >= Date.parse(event.startDateTime),
    { path: ["endDateTime"], message: "Must not be before startDateTime" },
  )
  .refine(
    (event) =>
      event.minAge === null ||
      event.maxAge === null ||
      event.maxAge >= event.minAge,
    { path: ["maxAge"], message: "Must not be less than minAge" },
  );
