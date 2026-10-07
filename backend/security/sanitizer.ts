/**
 * Input Sanitization & XSS / Injection Prevention Utility
 * Protects APIs and backend engines from malicious payloads.
 */

export function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"`;()]/g, '') // Strip XSS attack vectors
    .trim()
    .slice(0, maxLength);
}

export function sanitizeNumeric(val: any, fallback: number, min: number = 0, max: number = 10000000): number {
  const num = Number(val);
  if (isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

export function sanitizeDate(input: string, fallback: string = new Date().toISOString().split('T')[0]): string {
  if (typeof input !== 'string') return fallback;
  const match = input.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? input : fallback;
}
