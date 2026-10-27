import type { GeoPoint } from "../events/types";

export interface Town extends GeoPoint {
  slug: string;
  name: string;
  state: "ME" | "NH";
}

export const TOWNS = [
  { slug: "portsmouth", name: "Portsmouth", state: "NH", lat: 43.0718, lng: -70.7626 },
  { slug: "dover", name: "Dover", state: "NH", lat: 43.1979, lng: -70.8737 },
  { slug: "kittery", name: "Kittery", state: "ME", lat: 43.0881, lng: -70.7362 },
  { slug: "york", name: "York", state: "ME", lat: 43.1368, lng: -70.6456 },
  { slug: "eliot", name: "Eliot", state: "ME", lat: 43.1537, lng: -70.8014 },
  {
    slug: "south-berwick",
    name: "South Berwick",
    state: "ME",
    lat: 43.2342,
    lng: -70.8095,
  },
  { slug: "durham", name: "Durham", state: "NH", lat: 43.1339, lng: -70.9264 },
  { slug: "exeter", name: "Exeter", state: "NH", lat: 42.9814, lng: -70.9478 },
  { slug: "hampton", name: "Hampton", state: "NH", lat: 42.9376, lng: -70.8389 },
  { slug: "rye", name: "Rye", state: "NH", lat: 43.0134, lng: -70.7709 },
  {
    slug: "greenland",
    name: "Greenland",
    state: "NH",
    lat: 43.0362,
    lng: -70.832,
  },
  {
    slug: "stratham",
    name: "Stratham",
    state: "NH",
    lat: 43.0537,
    lng: -70.9098,
  },
  { slug: "new-castle", name: "New Castle", state: "NH", lat: 43.0718, lng: -70.7162 },
  { slug: "newmarket", name: "Newmarket", state: "NH", lat: 43.0829, lng: -70.9356 },
] as const satisfies readonly Town[];

export type TownSlug = (typeof TOWNS)[number]["slug"];

export function getTownBySlug(slug: string): (typeof TOWNS)[number] | undefined {
  return TOWNS.find((town) => town.slug === slug);
}
