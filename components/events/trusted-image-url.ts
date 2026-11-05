export function getTrustedEventImageUrl(
  imageUrl: string | null,
): string | null {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const hostIsAllowed =
      url.hostname === "librarycalendar.com" ||
      url.hostname.endsWith(".librarycalendar.com");
    return url.protocol === "https:" && hostIsAllowed ? url.toString() : null;
  } catch {
    return null;
  }
}
