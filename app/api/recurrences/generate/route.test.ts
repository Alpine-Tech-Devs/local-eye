import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ rpc: rpcMock }),
}));

import { GET } from "./route";

describe("GET /api/recurrences/generate", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    rpcMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects requests without the configured bearer secret", async () => {
    const response = await GET(
      new Request("http://localhost/api/recurrences/generate"),
    );

    expect(response.status).toBe(401);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns an explicit configuration error if the secret is missing", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const response = await GET(
      new Request("http://localhost/api/recurrences/generate"),
    );

    expect(response.status).toBe(503);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("runs the generator for authenticated cron requests", async () => {
    rpcMock.mockResolvedValue({ data: 4, error: null });

    const response = await GET(
      new Request("http://localhost/api/recurrences/generate", {
        headers: { authorization: "Bearer test-cron-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ generatedOccurrences: 4 });
    expect(rpcMock).toHaveBeenCalledWith(
      "generate_recurring_event_occurrences",
      { p_days_ahead: 365 },
    );
  });

  it("reports database generation failures", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: new Error("database unavailable"),
    });
    const logError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(
      new Request("http://localhost/api/recurrences/generate", {
        headers: { authorization: "Bearer test-cron-secret" },
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Could not generate recurring event occurrences.",
    });
    expect(logError).toHaveBeenCalledOnce();
    logError.mockRestore();
  });
});
