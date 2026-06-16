import { apiUpload } from "@/lib/api-client";
import { isApiMode } from "@/lib/use-api";

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
  const formData = new FormData();
  formData.append("file", file);

  const payload = await apiUpload<{ url: string }>(
    "/uploads/product-image",
    formData,
  );
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
