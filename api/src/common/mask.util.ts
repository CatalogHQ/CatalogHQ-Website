export function maskNin(nin: string): string {
  if (nin.length <= 8) return nin;
  return `${nin.slice(0, 4)}${'*'.repeat(nin.length - 8)}${nin.slice(-4)}`;
}
