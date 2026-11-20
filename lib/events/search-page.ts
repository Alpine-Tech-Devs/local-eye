import { z } from "zod";

import { EventSchema } from "./schema";

export const EVENT_SEARCH_PAGE_SIZE = 5;

export const EventSearchPageSchema = z.object({
  results: z.array(
    z.object({
      event: EventSchema,
      distanceMiles: z.number().nonnegative(),
      score: z.number(),
      matchingChildAges: z.array(z.number().int().min(0).max(18)),
    }),
  ),
  totalResults: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
