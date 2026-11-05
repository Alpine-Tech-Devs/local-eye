import { describe, expect, it } from "vitest";

import { getTrustedEventImageUrl } from "./trusted-image-url";

describe("getTrustedEventImageUrl", () => {
  it("allows HTTPS image URLs from the supported library calendar hosts", () => {
    expect(
      getTrustedEventImageUrl(
        "https://ricepl.librarycalendar.com/images/event.jpg",
      ),
    ).toBe("https://ricepl.librarycalendar.com/images/event.jpg");
  });

  it("rejects non-HTTPS and unconfigured hosts", () => {
    expect(
      getTrustedEventImageUrl("http://ricepl.librarycalendar.com/image.jpg"),
    ).toBeNull();
    expect(getTrustedEventImageUrl("https://example.com/image.jpg")).toBeNull();
    expect(getTrustedEventImageUrl("not a url")).toBeNull();
    expect(getTrustedEventImageUrl(null)).toBeNull();
  });
});
