import { describe, expect, it } from "vitest";
import { optimizeProductImageUrl } from "./image-url";

describe("optimizeProductImageUrl", () => {
  it("adds WebP transform to Cloudinary URLs", () => {
    const input =
      "https://res.cloudinary.com/demo/image/upload/v123/cataloghq/products/photo.jpg";
    expect(optimizeProductImageUrl(input)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto:good/v123/cataloghq/products/photo.jpg",
    );
  });

  it("leaves URLs that already request WebP unchanged", () => {
    const input =
      "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto:good/v1/photo.jpg";
    expect(optimizeProductImageUrl(input)).toBe(input);
  });

  it("returns data URLs unchanged", () => {
    const dataUrl = "data:image/png;base64,abc";
    expect(optimizeProductImageUrl(dataUrl)).toBe(dataUrl);
  });

  it("returns non-Cloudinary URLs unchanged", () => {
    const input = "https://cdn.example.com/photo.jpg";
    expect(optimizeProductImageUrl(input)).toBe(input);
  });
});
