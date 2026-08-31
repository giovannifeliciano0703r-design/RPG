import { describe, expect, it } from "vitest";
import { validateImageUpload } from "./supabaseMedia";

describe("validateImageUpload", () => {
  it("accepts supported images within the size limit", () => {
    expect(validateImageUpload({ type: "image/webp", size: 1024 })).toBeNull();
  });

  it("rejects executable or oversized files", () => {
    expect(validateImageUpload({ type: "application/javascript", size: 1024 })).toMatch(/Formato/);
    expect(validateImageUpload({ type: "image/png", size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
  });
});
