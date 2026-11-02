import { timingSafeEqual } from "crypto";
export function validAdminKey(value: unknown) {
  const expected = process.env.OUTBREAK_ADMIN_KEY;
  if (typeof value !== "string" || !expected) return false;
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
