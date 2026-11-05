import type { Event } from "@/lib/events/types";

import type { Database } from "./database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export function mapRowToEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    venueName: row.venue_name,
    address: row.address,
    city: row.city,
    state: row.state,
    latitude: row.latitude,
    longitude: row.longitude,
    startDateTime: row.start_datetime,
    endDateTime: row.end_datetime,
    minAge: row.min_age,
    maxAge: row.max_age,
    priceMin: row.price_min,
    priceMax: row.price_max,
    isFree: row.is_free,
    indoorOutdoor: row.indoor_outdoor,
    category: row.category,
    registrationRequired: row.registration_required,
    registrationUrl: row.registration_url,
    imageUrl: row.image_url,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
