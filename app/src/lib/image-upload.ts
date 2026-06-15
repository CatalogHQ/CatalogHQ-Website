import { readJson } from "@/lib/local-storage";
import { isApiMode } from "@/lib/use-api";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { AuthSession } from "@/types/domain";

const API_URL = import.meta.env.VITE_API_URL ?? "";
const MAX_FILE_SIZE = 500 * 1024;
const MAX_IMAGES = 2;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const PRODUCT_IMAGE_LIMITS = {
  maxFileSize: MAX_FILE_SIZE,
  maxImages: MAX_IMAGES,
  acceptedTypes: ACCEPTED_TYPES,
  acceptAttribute: "image/jpeg,image/png,image/webp",
} as const;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export async function filesToDataUrls(
  files: FileList | File[],
  currentCount = 0,
): Promise<string[]> {
  const fileArray = Array.from(files);
  const remaining = MAX_IMAGES - currentCount;

  if (remaining <= 0) {
    throw new Error(`You can upload up to ${MAX_IMAGES} images per product.`);
  }

  if (fileArray.length > remaining) {
    throw new Error(`You can only add ${remaining} more image(s).`);
  }

  const dataUrls: string[] = [];

  for (const file of fileArray) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error(`${file.name} must be a JPG, PNG, or WebP image.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name} is too large. Maximum size is 500KB.`);
    }

    dataUrls.push(await readFileAsDataUrl(file));
  }

  return dataUrls;
}

async function uploadFileToApi(file: File): Promise<string> {
  const session = readJson<AuthSession | null>(STORAGE_KEYS.session, null);
  const formData = new FormData();
  formData.append("file", file);

  const headers = new Headers();
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_URL}/uploads/product-image`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Upload failed (${response.status})`;

    try {
      const payload = JSON.parse(text) as { message?: string | string[] };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep plain-text fallback.
    }

    throw new Error(message);
  }

  const payload = (await response.json()) as { url: string };
  return payload.url;
}

export async function uploadProductImages(
  files: FileList | File[],
  currentCount = 0,
): Promise<string[]> {
  const fileArray = Array.from(files);
  const remaining = MAX_IMAGES - currentCount;

  if (remaining <= 0) {
    throw new Error(`You can upload up to ${MAX_IMAGES} images per product.`);
  }

  if (fileArray.length > remaining) {
    throw new Error(`You can only add ${remaining} more image(s).`);
  }

  const urls: string[] = [];

  for (const file of fileArray) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      throw new Error(`${file.name} must be a JPG, PNG, or WebP image.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name} is too large. Maximum size is 500KB.`);
    }

    if (isApiMode()) {
      urls.push(await uploadFileToApi(file));
    } else {
      urls.push(...(await filesToDataUrls([file], currentCount + urls.length)));
    }
  }

  return urls;
}
