import { ApiError } from "@/lib/api-error";
import { readJson } from "@/lib/local-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { AuthSession } from "@/types/domain";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function assertApiUrlConfigured(): void {
  if (!API_URL && import.meta.env.VITE_USE_API === "true") {
    throw new Error(
      "API URL is not configured. Set VITE_API_URL=https://api.cataloghq.store on your host and redeploy.",
    );
  }
}

function toNetworkError(error: unknown): Error {
  if (error instanceof TypeError) {
    return new Error(
      "Could not reach the server. Check your connection, or ask the site owner to verify API and CORS settings.",
    );
  }

  return error instanceof Error
    ? error
    : new Error("Something went wrong. Please try again.");
}

function getSession(): AuthSession | null {
  return readJson<AuthSession | null>(STORAGE_KEYS.session, null);
}

async function parseApiError(response: Response): Promise<ApiError> {
  const text = await response.text();
  if (!text) {
    return new ApiError(
      `Request failed (${response.status})`,
      response.status,
    );
  }

  try {
    const payload = JSON.parse(text) as {
      message?: string | string[];
      code?: string;
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message ?? text;

    return new ApiError(message, response.status, payload.code);
  } catch {
    return new ApiError(text, response.status);
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  assertApiUrlConfigured();

  const session = getSession();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    throw toNetworkError(error);
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
