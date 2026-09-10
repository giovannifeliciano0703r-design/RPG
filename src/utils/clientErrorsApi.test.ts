import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/client-errors";

function request(body: string) {
  return new Request("https://example.test/api/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

afterEach(() => vi.restoreAllMocks());

describe("client error ingestion", () => {
  it.each(["null", "[]", "true", "42", '"text"', "{"])("rejects invalid payload %s without logging", async (body) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await handler.fetch(request(body))).status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });

  it("limits UTF-8 bytes rather than JavaScript character count", async () => {
    const body = JSON.stringify({ errorId: "é".repeat(2200) });
    expect(body.length).toBeLessThan(4096);
    expect((await handler.fetch(request(body))).status).toBe(413);
  });

  it("accepts valid records but never logs arbitrary extra fields", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await handler.fetch(request(JSON.stringify({
      event: "client.unhandled_error", errorId: "test-1", errorName: "TypeError",
      password: "must-not-be-logged", message: "private character content",
    })));
    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).not.toContain("must-not-be-logged");
    expect(log.mock.calls[0][0]).not.toContain("private character content");
  });
});
