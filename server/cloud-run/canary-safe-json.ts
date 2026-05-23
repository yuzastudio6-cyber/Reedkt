export interface CanarySafeJsonOptions {
  maxDepth: number
  maxKeysPerObject: number
  maxArrayLength: number
  maxStringLength: number
  maxStackLines: number
  maxStackLineLength: number
}

export interface CanaryErrorSummary {
  name: string
  code?: string
  message: string
  stack?: string
}

const DEFAULT_CANARY_SAFE_JSON_OPTIONS: CanarySafeJsonOptions = {
  maxDepth: 4,
  maxKeysPerObject: 50,
  maxArrayLength: 20,
  maxStringLength: 2_000,
  maxStackLines: 8,
  maxStackLineLength: 300,
}

const REDACTED = '[redacted]'
const REDACT_KEY_PATTERN = /token|authorization|bearer|secret|key|password|credential|cookie|signed|service_role/i

interface SanitizeState {
  options: CanarySafeJsonOptions
  seen: WeakSet<object>
}

export function sanitizeCanaryValue(
  value: unknown,
  options: Partial<CanarySafeJsonOptions> = {},
): unknown {
  const state: SanitizeState = {
    options: { ...DEFAULT_CANARY_SAFE_JSON_OPTIONS, ...options },
    seen: new WeakSet<object>(),
  }
  return sanitizeValue(value, state, 0, '')
}

export function summarizeCanaryError(error: unknown): CanaryErrorSummary {
  if (error instanceof Error) {
    const record = error as Error & Record<string, unknown>
    const code = codeFromUnknown(record.code)
    return {
      name: truncateString(error.name || 'Error', DEFAULT_CANARY_SAFE_JSON_OPTIONS.maxStringLength),
      ...(code ? { code } : {}),
      message: truncateString(error.message || 'Unknown staging render canary failure.', DEFAULT_CANARY_SAFE_JSON_OPTIONS.maxStringLength),
      ...(typeof error.stack === 'string' ? { stack: stackSnippet(error.stack, DEFAULT_CANARY_SAFE_JSON_OPTIONS) } : {}),
    }
  }

  return {
    name: 'NonError',
    message: truncateString(stringFromUnknown(error), DEFAULT_CANARY_SAFE_JSON_OPTIONS.maxStringLength),
  }
}

export function stringifyCanaryJson(value: unknown, space?: number): string {
  try {
    return JSON.stringify(sanitizeCanaryValue(value), null, space)
  } catch (error) {
    const summary = summarizeCanaryError(error)
    return JSON.stringify({
      ok: false,
      status: 'failed',
      error: {
        code: 'canary_safe_json_failed',
        message: summary.message,
      },
    })
  }
}

export function canaryErrorMessage(error: unknown): string {
  return summarizeCanaryError(error).message
}

function sanitizeValue(value: unknown, state: SanitizeState, depth: number, key: string): unknown {
  if (key && REDACT_KEY_PATTERN.test(key)) return REDACTED
  if (value === null || value === undefined) return value

  const valueType = typeof value
  if (valueType === 'string') return truncateString(value as string, state.options.maxStringLength)
  if (valueType === 'number' || valueType === 'boolean') return value
  if (valueType === 'bigint') return `[bigint:${truncateString(String(value), state.options.maxStringLength)}]`
  if (valueType === 'symbol') return `[symbol:${truncateString(String(value), state.options.maxStringLength)}]`
  if (valueType === 'function') return functionSummary(value as (...args: never[]) => unknown)

  if (typeof value !== 'object') return `[${valueType}]`

  if (state.seen.has(value)) return '[Circular]'
  if (value instanceof Error) {
    state.seen.add(value)
    const summary = summarizeErrorForState(value, state)
    state.seen.delete(value)
    return summary
  }
  if (Buffer.isBuffer(value)) return binarySummary('Buffer', value.byteLength)
  if (ArrayBuffer.isView(value)) return binarySummary(constructorName(value), value.byteLength)
  if (value instanceof ArrayBuffer) return binarySummary('ArrayBuffer', value.byteLength)
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '[Date:invalid]' : value.toISOString()

  if (depth >= state.options.maxDepth) return `[MaxDepth:${constructorName(value)}]`
  state.seen.add(value)

  if (Array.isArray(value)) {
    const items = value
      .slice(0, state.options.maxArrayLength)
      .map((item) => sanitizeValue(item, state, depth + 1, ''))
    if (value.length > state.options.maxArrayLength) {
      items.push(`[Truncated ${value.length - state.options.maxArrayLength} array items]`)
    }
    state.seen.delete(value)
    return items
  }

  if (isStreamLike(value)) {
    state.seen.delete(value)
    return { type: 'Stream', constructor: constructorName(value) }
  }

  if (!isPlainObject(value)) {
    const summary = {
      type: constructorName(value),
      ownKeys: Object.keys(value).slice(0, state.options.maxKeysPerObject),
    }
    state.seen.delete(value)
    return summary
  }

  const output: Record<string, unknown> = {}
  const entries = Object.entries(value as Record<string, unknown>)
  for (const [entryKey, entryValue] of entries.slice(0, state.options.maxKeysPerObject)) {
    output[entryKey] = sanitizeValue(entryValue, state, depth + 1, entryKey)
  }
  if (entries.length > state.options.maxKeysPerObject) {
    output.__truncatedKeys = entries.length - state.options.maxKeysPerObject
  }

  state.seen.delete(value)
  return output
}

function summarizeErrorForState(error: Error, state: SanitizeState): CanaryErrorSummary & Record<string, unknown> {
  const record = error as Error & Record<string, unknown>
  const summary: CanaryErrorSummary & Record<string, unknown> = {
    name: truncateString(error.name || 'Error', state.options.maxStringLength),
    message: truncateString(error.message || 'Unknown staging render canary failure.', state.options.maxStringLength),
  }
  const code = codeFromUnknown(record.code)
  if (code) summary.code = code
  if (typeof error.stack === 'string') summary.stack = stackSnippet(error.stack, state.options)

  const entries = Object.entries(record).filter(([entryKey]) => !['name', 'message', 'stack', 'code'].includes(entryKey))
  const errorValueState: SanitizeState = {
    ...state,
    options: {
      ...state.options,
      maxDepth: Math.min(state.options.maxDepth, 2),
      maxKeysPerObject: Math.min(state.options.maxKeysPerObject, 20),
      maxArrayLength: Math.min(state.options.maxArrayLength, 5),
      maxStringLength: Math.min(state.options.maxStringLength, 500),
    },
  }
  for (const [entryKey, entryValue] of entries.slice(0, Math.max(0, errorValueState.options.maxKeysPerObject - Object.keys(summary).length))) {
    summary[entryKey] = sanitizeValue(entryValue, errorValueState, 1, entryKey)
  }
  if (entries.length > errorValueState.options.maxKeysPerObject) {
    summary.__truncatedKeys = entries.length - errorValueState.options.maxKeysPerObject
  }

  return summary
}

function truncateString(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 32))}...[truncated ${value.length - maxLength} chars]`
}

function stackSnippet(stack: string, options: CanarySafeJsonOptions): string {
  return stack
    .split(/\r?\n/)
    .slice(0, options.maxStackLines)
    .map((line) => truncateString(line, options.maxStackLineLength))
    .join('\n')
}

function functionSummary(value: (...args: never[]) => unknown): string {
  const name = value.name ? `:${value.name}` : ''
  return `[function${name}]`
}

function binarySummary(type: string, byteLength: number): Record<string, unknown> {
  return { type, byteLength }
}

function codeFromUnknown(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return truncateString(value.trim(), DEFAULT_CANARY_SAFE_JSON_OPTIONS.maxStringLength)
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function constructorName(value: object): string {
  const name = value.constructor?.name
  return typeof name === 'string' && name.trim() ? name : 'Object'
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isStreamLike(value: object): boolean {
  const record = value as Record<string, unknown>
  return typeof record.pipe === 'function'
    || typeof record.read === 'function'
    || typeof record.write === 'function'
    || (typeof record.on === 'function' && typeof record.emit === 'function')
}

function stringFromUnknown(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value)
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  return stringifyCanaryJson(value)
}
