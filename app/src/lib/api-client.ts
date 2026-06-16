import { ApiError } from "@/lib/api-error";
import { CSRF_HEADER_NAME, readCsrfTokenFromDocument } from "@/lib/csrf-token";

const API_URL = import.meta.env.VITE_API_URL ?? "";
export const SESSION_EXPIRED_EVENT = "cataloghq:session-expired";

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

async function parseApiError(response: Response): Promise<ApiError> {
  const text = await response.text();
  if (!text) {
    return new ApiError(`Request failed (${response.status})`, response.status);
  }

  try {
    const payload = JSON.parse(text) as {
      message?: string | string[];
      code?: string;
    };
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : (payload.message ?? text);

    return new ApiError(message, response.status, payload.code);
  } catch {
    return new ApiError(text, response.status);
  }
}

function buildRequestHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);

  if (
    !headers.has("Content-Type") &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  const csrfToken = readCsrfTokenFromDocument();
  if (
    csrfToken &&
    options.method &&
    !["GET", "HEAD", "OPTIONS"].includes(options.method.toUpperCase())
  ) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  return headers;
}

async function fetchApi(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildRequestHeaders(options),
    credentials: "include",
  });
}

let refreshInFlight: Promise<boolean> | null = null;

export function onSessionExpired(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

function notifySessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

async function refreshAccessSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetchApi("/auth/refresh", { method: "POST" });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function shouldAttemptRefresh(path: string): boolean {
  return (
    path !== "/auth/refresh" &&
    !path.startsWith("/auth/signin") &&
    !path.startsWith("/auth/signup")
  );
}

async function requestWithSessionRetry(
  path: string,
  options: RequestInit,
): Promise<Response> {
  let response: Response;

  try {
    response = await fetchApi(path, options);
  } catch (error) {
    throw toNetworkError(error);
  }

  if (response.status === 401 && shouldAttemptRefresh(path)) {
    const refreshed = await refreshAccessSession();
    if (refreshed) {
      try {
        response = await fetchApi(path, options);
      } catch (error) {
        throw toNetworkError(error);
      }
    } else {
      notifySessionExpired();
    }
  }

  if (response.status === 401 && shouldAttemptRefresh(path)) {
    notifySessionExpired();
  }

  return response;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  assertApiUrlConfigured();

  const response = await requestWithSessionRetry(path, options);

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  body: FormData,
): Promise<T> {
  assertApiUrlConfigured();

  const response = await requestWithSessionRetry(path, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return response.json() as Promise<T>;
}
