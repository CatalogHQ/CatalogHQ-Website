import { describe, expect, it } from "vitest";
import { sanitizeApiErrorMessage } from "@/lib/sanitize-api-error";

describe("sanitizeApiErrorMessage", () => {
  it("returns a generic message for 5xx responses", () => {
    expect(sanitizeApiErrorMessage("Database exploded", 500)).toBe(
      "Something went wrong (500). Please try again.",
    );
  });

  it("strips HTML error bodies", () => {
    expect(sanitizeApiErrorMessage("<html>bad gateway</html>", 502)).toBe(
      "Something went wrong (502). Please try again.",
    );
  });

  it("passes through safe 4xx JSON messages", () => {
    expect(sanitizeApiErrorMessage("Invalid email or password", 401)).toBe(
      "Invalid email or password",
    );
  });
});
