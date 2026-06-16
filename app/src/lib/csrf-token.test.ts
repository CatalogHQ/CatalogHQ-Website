import { describe, expect, it, beforeEach } from "vitest";
import {
  applyCsrfTokenFromResponse,
  clearCsrfToken,
  readCsrfToken,
  setCsrfToken,
} from "@/lib/csrf-token";

describe("csrf-token", () => {
  beforeEach(() => {
    clearCsrfToken();
  });

  it("stores and reads in-memory token", () => {
    setCsrfToken("abc123");
    expect(readCsrfToken()).toBe("abc123");
  });

  it("applies token from auth response payload", () => {
    applyCsrfTokenFromResponse({ user: {}, csrfToken: "from-api" });
    expect(readCsrfToken()).toBe("from-api");
  });

  it("clears in-memory token", () => {
    setCsrfToken("abc123");
    clearCsrfToken();
    expect(readCsrfToken()).toBeNull();
  });
});
