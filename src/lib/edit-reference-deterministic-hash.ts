function normalizeForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeForStableJson)
  if (!value || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) return null
    return value
  }

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((normalized, key) => {
      const item = (value as Record<string, unknown>)[key]
      if (item !== undefined && typeof item !== 'function') {
        normalized[key] = normalizeForStableJson(item)
      }
      return normalized
    }, {})
}

export function stableEditReferenceJson(value: unknown): string {
  return JSON.stringify(normalizeForStableJson(value))
}

/**
 * Browser-safe deterministic content fingerprint for non-security UI packages.
 * Canonical persisted Edit Reference records continue to use server-side SHA-256.
 */
export function createEditReferenceDeterministicHash(value: unknown): string {
  const input = stableEditReferenceJson(value)
  let first = 0x811c9dc5
  let second = 0x9e3779b9

  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index)
    first = Math.imul(first ^ code, 0x01000193)
    second = Math.imul(second ^ code, 0x85ebca6b)
    second ^= second >>> 13
  }

  return [first, second]
    .map((part) => (part >>> 0).toString(16).padStart(8, '0'))
    .join('')
}
