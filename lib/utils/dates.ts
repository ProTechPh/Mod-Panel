type IsoString<T> = T extends Date ? string : T;

/**
 * Serialize a Date to an ISO string for API responses.
 *
 * Non-Date values (null/undefined) pass through unchanged, preserving the
 * caller's null-vs-undefined distinction. The return type mirrors the input:
 * `Date` → `string`, `Date | null` → `string | null`, and so on. All
 * API-facing services use this so clients always receive ISO strings instead
 * of raw Date objects.
 */
export function toIsoString<T extends Date | null | undefined>(d: T): IsoString<T> {
  return (d instanceof Date ? d.toISOString() : d) as IsoString<T>;
}
