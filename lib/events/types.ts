export const EVENT_CATEGORIES = [
  "Storytime",
  "Museum",
  "Playground",
  "Festival",
  "Farm",
  "Nature",
  "Arts & Crafts",
  "Music",
  "Sports",
  "Open Gym",
  "Educational",
  "Seasonal",
  "Community Event",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type IndoorOutdoor = "indoor" | "outdoor" | "either";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  venueName: string;
  address: string | null;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  startDateTime: string;
  endDateTime: string | null;
  minAge: number | null;
  maxAge: number | null;
  priceMin: number | null;
  priceMax: number | null;
  isFree: boolean;
  indoorOutdoor: IndoorOutdoor;
  category: EventCategory;
  registrationRequired: boolean;
  registrationUrl: string | null;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}
