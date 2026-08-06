const REDACTED_VALUE = '[REDACTED]'
const TRUNCATED_VALUE = '[TRUNCATED]'
const MAX_DEPTH_VALUE = '[MAX_DEPTH]'
const CIRCULAR_VALUE = '[CIRCULAR]'

const SECRET_KEY_PATTERN = /(?:^|[_\-.])(authorization|cookie|credential|password|passwd|private[_-]?key|secret|service[_-]?role|session|signed[_-]?url|token)(?:$|[_\-.])/i
const COMPACT_SECRET_KEY_PATTERN = /(?:accesskeyid|apikey|authorization|cookie|credential|password|passwd|privatekey|secret|servicerole|session(?:id)?|signature|signedurl|token)$/i
const SECRET_QUERY_PATTERN = /(?:^|[_\-.])(api[_-]?key|authorization|auth|credential|password|secret|signature|signed|token)(?:$|[_\-.])/i

export interface JsonSanitizationOptions {
  maxDepth?: number
  maxEntries?: number
  maxArrayLength?: number
  maxStringLength?: number
  maxTotalCharacters?: number
}

interface SanitizeState {
  readonly options: Required<JsonSanitizationOptions>
  readonly seen: WeakSet<object>
  remainingCharacters: number
}

const DEFAULT_OPTIONS: Required<JsonSanitizationOptions> = {
  maxDepth: 6,
  maxEntries: 100,
  maxArrayLength: 50,
  maxStringLength: 2_048,
  maxTotalCharacters: 32_768,
}

export function sanitizeJsonValue(value: unknown, options: JsonSanitizationOptions = {}): unknown {
  const resolvedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }
  const state: SanitizeState = {
    options: resolvedOptions,
    seen: new WeakSet<object>(),
    remainingCharacters: resolvedOptions.maxTotalCharacters,
  }

  const sanitized = sanitizeValue(value, 0, state)
  return enforceSerializedLimit(sanitized, resolvedOptions.maxTotalCharacters)
}

export function sanitizeJsonRecord(
  value: unknown,
  options: JsonSanitizationOptions = {},
): Record<string, unknown> {
  const sanitized = sanitizeJsonValue(value, options)
  return isRecord(sanitized) ? sanitized : {}
}

export function sanitizeText(value: string, maxLength = DEFAULT_OPTIONS.maxStringLength): string {
  const withoutAuthorization = value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED_VALUE}`)
    .replace(/\bBasic\s+[A-Za-z0-9+/=-]+/gi, `Basic ${REDACTED_VALUE}`)
    .replace(
      /([?&](?:api[_-]?key|authorization|auth|credential|password|secret|signature|signed|token)=)[^&#\s]*/gi,
      `$1${REDACTED_VALUE}`,
    )
    .replace(
      /\b(api[_-]?key|authorization|credential|password|passwd|private[_-]?key|secret|service[_-]?role|session[_-]?id|signature|signed[_-]?url|token)\s*[:=]\s*[^,;\s]+/gi,
      `$1=${REDACTED_VALUE}`,
    )
    .replace(/\/(?:Users|Volumes|home|var|tmp|private|opt|etc)\/[^\s'"`]+/g, '[FILESYSTEM_PATH]')
    .replace(/\b[A-Za-z]:\\[^\r\n'"`]+/g, '[FILESYSTEM_PATH]')

  const sanitizedUrl = redactUrlCredentials(withoutAuthorization)
  return truncate(sanitizedUrl, maxLength)
}

export function isSecretLikeKey(key: string): boolean {
  const normalized = key.trim()
  const compact = normalized.replace(/[^a-z0-9]/gi, '')
  return SECRET_KEY_PATTERN.test(normalized) || COMPACT_SECRET_KEY_PATTERN.test(compact)
}

function sanitizeValue(value: unknown, depth: number, state: SanitizeState): unknown {
  if (state.remainingCharacters <= 0) return TRUNCATED_VALUE
  if (value === null || typeof value === 'boolean') return value

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : String(value)
  }

  if (typeof value === 'bigint') {
    return consume(String(value), state)
  }

  if (typeof value === 'string') {
    return consume(sanitizeText(value, state.options.maxStringLength), state)
  }

  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') {
    return undefined
  }

  if (depth >= state.options.maxDepth) return MAX_DEPTH_VALUE
  if (state.seen.has(value)) return CIRCULAR_VALUE
  state.seen.add(value)

  if (Array.isArray(value)) {
    const sanitizedItems: unknown[] = []
    for (const item of value.slice(0, state.options.maxArrayLength)) {
      const sanitized = sanitizeValue(item, depth + 1, state)
      if (sanitized !== undefined) sanitizedItems.push(sanitized)
    }
    if (value.length > state.options.maxArrayLength) sanitizedItems.push(TRUNCATED_VALUE)
    return sanitizedItems
  }

  const source = value as Record<string, unknown>
  const sanitizedRecord: Record<string, unknown> = {}
  const entries = Object.entries(source)
  for (const [key, item] of entries.slice(0, state.options.maxEntries)) {
    const safeKey = consume(truncate(key, 128), state)
    if (state.remainingCharacters <= 0) {
      sanitizedRecord[TRUNCATED_VALUE] = true
      break
    }

    if (isSecretLikeKey(key)) {
      sanitizedRecord[safeKey] = REDACTED_VALUE
      continue
    }

    const sanitized = sanitizeValue(item, depth + 1, state)
    if (sanitized !== undefined) sanitizedRecord[safeKey] = sanitized
  }
  if (entries.length > state.options.maxEntries) sanitizedRecord[TRUNCATED_VALUE] = true
  return sanitizedRecord
}

function redactUrlCredentials(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value

  try {
    const url = new URL(value)
    if (url.username) url.username = REDACTED_VALUE
    if (url.password) url.password = REDACTED_VALUE
    for (const key of url.searchParams.keys()) {
      if (SECRET_QUERY_PATTERN.test(key) || isSecretLikeKey(key)) {
        url.searchParams.set(key, REDACTED_VALUE)
      }
    }
    return url.toString()
  } catch {
    return value
  }
}

function consume(value: string, state: SanitizeState): string {
  if (state.remainingCharacters <= 0) return TRUNCATED_VALUE
  const consumed = value.slice(0, state.remainingCharacters)
  state.remainingCharacters -= consumed.length
  return consumed.length < value.length ? `${consumed}${TRUNCATED_VALUE}` : consumed
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - TRUNCATED_VALUE.length))}${TRUNCATED_VALUE}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function enforceSerializedLimit(value: unknown, maxTotalCharacters: number): unknown {
  try {
    const serialized = JSON.stringify(value)
    if (serialized === undefined || serialized.length <= maxTotalCharacters) return value
  } catch {
    return { [TRUNCATED_VALUE]: true }
  }

  return typeof value === 'object' && value !== null
    ? { [TRUNCATED_VALUE]: true }
    : TRUNCATED_VALUE
}
