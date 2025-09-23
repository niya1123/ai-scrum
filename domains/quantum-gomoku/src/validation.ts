// UUID v1–v5 (RFC 4122) validator
// Matches versions 1-5 and variants 8,9,a,b
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

export function isValidUUID(id: string): boolean {
  if (typeof id !== 'string') return false
  return UUID_REGEX.test(id)
}

