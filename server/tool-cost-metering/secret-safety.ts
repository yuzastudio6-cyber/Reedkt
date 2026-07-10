const SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /service[_-]?role/i,
  /credential/i,
  /(^|[_-])token($|[_-])/i,
  /authorization/i,
  /signed[_-]?url/i,
  /raw[_-]?prompt/i,
]

const SECRET_VALUE_PATTERNS = [
  /x-goog-signature=/i,
  /x-amz-signature=/i,
  /^bearer\s+/i,
  /^sk-[a-z0-9_-]+/i,
  /service_role_key/i,
]

export function assertNoSecretLikeCostPayload(value: unknown, rootPath = 'payload'): void {
  const matches = collectSecretLikePaths(value, rootPath)
  if (matches.length > 0) {
    throw new Error(`Tool cost payload contains secret-like fields: ${matches.join(', ')}`)
  }
}

export function collectSecretLikePaths(value: unknown, rootPath = 'payload'): string[] {
  const matches: string[] = []
  visitSecretPaths(value, rootPath, matches)
  return matches
}

function visitSecretPaths(value: unknown, path: string, matches: string[]): void {
  if (typeof value === 'string') {
    if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) matches.push(path)
    return
  }

  if (!value || typeof value !== 'object') return

  if (Array.isArray(value)) {
    value.forEach((item, index) => visitSecretPaths(item, `${path}[${index}]`, matches))
    return
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const nestedPath = `${path}.${key}`
    if (SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      matches.push(nestedPath)
      continue
    }
    visitSecretPaths(nestedValue, nestedPath, matches)
  }
}
