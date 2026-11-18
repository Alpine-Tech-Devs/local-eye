import { describe, expect, it } from "vitest";

import {
  APP_FEEDBACK_HREF,
  CONTACT_EMAIL,
  EVENT_SUGGESTION_HREF,
} from "./ContactActions";

describe("contact links", () => {
  it("uses the event suggestion address and subject", () => {
    expect(CONTACT_EMAIL).toBe("contactus@alpinetechdevs.com");
    expect(EVENT_SUGGESTION_HREF).toBe(
      "mailto:contactus@alpinetechdevs.com?subject=Event%20suggestion",
    );
  });

  it("uses the app feedback address and subject", () => {
    expect(APP_FEEDBACK_HREF).toBe(
      "mailto:contactus@alpinetechdevs.com?subject=App%20feedback",
    );
  });
});
