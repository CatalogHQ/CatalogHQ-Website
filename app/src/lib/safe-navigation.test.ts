import { describe, expect, it } from "vitest";
import {
  isAllowedPaymentRedirectUrl,
  safeReturnTo,
} from "@/lib/safe-navigation";

describe("safeReturnTo", () => {
  it("allows same-origin relative paths", () => {
    expect(safeReturnTo("/dashboard/orders")).toBe("/dashboard/orders");
  });

  it("rejects protocol-relative and external paths", () => {
    expect(safeReturnTo("//evil.example/phish")).toBeNull();
    expect(safeReturnTo("https://evil.example/phish")).toBeNull();
  });

  it("rejects backslash and null-byte paths", () => {
    expect(safeReturnTo("/dashboard\\evil")).toBeNull();
    expect(safeReturnTo("/dashboard%00evil")).toBeNull();
  });

  it("rejects paths with @ or protocol characters", () => {
    expect(safeReturnTo("/@evil.example")).toBeNull();
    expect(safeReturnTo("/dashboard:evil")).toBeNull();
  });

  it("rejects encoded traversal sequences", () => {
    expect(safeReturnTo("/%2f%2fevil.example")).toBeNull();
    expect(safeReturnTo("/dashboard%5c..")).toBeNull();
  });
});

describe("isAllowedPaymentRedirectUrl", () => {
  it("allows Flutterwave and Paystack checkout hosts", () => {
    expect(
      isAllowedPaymentRedirectUrl("https://checkout.flutterwave.com/v3/hosted/pay"),
    ).toBe(true);
    expect(
      isAllowedPaymentRedirectUrl("https://checkout.paystack.com/abc123"),
    ).toBe(true);
  });

  it("rejects unknown payment hosts", () => {
    expect(isAllowedPaymentRedirectUrl("https://evil.example/pay")).toBe(false);
  });
});
