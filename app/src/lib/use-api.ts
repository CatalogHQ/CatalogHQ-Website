export function isApiMode(): boolean {
  return import.meta.env.VITE_USE_API === "true";
}
