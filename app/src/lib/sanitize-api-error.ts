/** Sanitize API error text before showing in UI toasts. */
export function sanitizeApiErrorMessage(message: string, status: number): string {
  const trimmed = message.trim().slice(0, 300);

  if (status >= 500) {
    return `Something went wrong (${status}). Please try again.`;
  }

  if (trimmed.startsWith("<") || trimmed.startsWith("<!")) {
    return `Request failed (${status})`;
  }

  return trimmed;
}
