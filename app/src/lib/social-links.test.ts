import { describe, expect, it } from "vitest";
import { normalizeSocialHandle } from "@/lib/social-links";

describe("normalizeSocialHandle", () => {
  it("normalizes valid handles", () => {
    expect(normalizeSocialHandle("@MyShop.NG")).toBe("myshop.ng");
  });

  it("rejects invalid characters", () => {
    expect(normalizeSocialHandle("shop<script>")).toBeUndefined();
    expect(normalizeSocialHandle("bad handle")).toBeUndefined();
  });

  it("returns undefined for empty values", () => {
    expect(normalizeSocialHandle("   ")).toBeUndefined();
  });
});
