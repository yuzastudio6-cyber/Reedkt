const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export interface BoundedJsonOptions {
  maximumBytes: number
  maximumDepth?: number
  maximumNodes?: number
  maximumStringLength?: number
}

export function parseBoundedUntrustedJson(
  bytes: Buffer,
  options: BoundedJsonOptions,
): unknown {
  if (!Number.isSafeInteger(options.maximumBytes) || options.maximumBytes <= 0) {
    throw new Error('A positive safe JSON byte ceiling is required.')
  }
  if (bytes.byteLength > options.maximumBytes) {
    throw new Error('JSON response exceeded its approved byte ceiling.')
  }
  const text = bytes.toString('utf8')
  if (Buffer.byteLength(text, 'utf8') !== bytes.byteLength || text.includes('\u0000')) {
    throw new Error('JSON response is not canonical UTF-8 text.')
  }
  assertNoDuplicateOrPrototypeKeys(text, options.maximumDepth ?? 24)
  const value = JSON.parse(text) as unknown
  assertBoundedJsonTree(value, {
    maximumDepth: options.maximumDepth ?? 24,
    maximumNodes: options.maximumNodes ?? 50_000,
    maximumStringLength: options.maximumStringLength ?? 16_384,
  })
  return value
}

function assertNoDuplicateOrPrototypeKeys(text: string, maximumDepth: number): void {
  const stack: { type: 'object' | 'array'; keys?: Set<string> }[] = []
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      const start = index
      index += 1
      let escaped = false
      for (; index < text.length; index += 1) {
        const current = text[index]
        if (escaped) {
          escaped = false
          continue
        }
        if (current === '\\') {
          escaped = true
          continue
        }
        if (current === '"') break
      }
      if (index >= text.length) throw new Error('JSON contains an unterminated string.')
      let lookahead = index + 1
      while (/\s/.test(text[lookahead] ?? '')) lookahead += 1
      const parent = stack.at(-1)
      if (parent?.type === 'object' && text[lookahead] === ':') {
        const key = JSON.parse(text.slice(start, index + 1)) as string
        if (FORBIDDEN_KEYS.has(key)) throw new Error(`JSON contains forbidden object key: ${key}.`)
        if (parent.keys?.has(key)) throw new Error(`JSON contains duplicate object key: ${key}.`)
        parent.keys?.add(key)
      }
      continue
    }
    if (character === '{') stack.push({ type: 'object', keys: new Set<string>() })
    else if (character === '[') stack.push({ type: 'array' })
    else if (character === '}' || character === ']') stack.pop()
    if (stack.length > maximumDepth) throw new Error('JSON exceeds the approved nesting depth.')
  }
}

function assertBoundedJsonTree(
  value: unknown,
  options: { maximumDepth: number; maximumNodes: number; maximumStringLength: number },
): void {
  let nodes = 0
  const visit = (candidate: unknown, depth: number): void => {
    nodes += 1
    if (nodes > options.maximumNodes) throw new Error('JSON exceeds the approved node count.')
    if (depth > options.maximumDepth) throw new Error('JSON exceeds the approved nesting depth.')
    if (typeof candidate === 'string') {
      if (candidate.length > options.maximumStringLength) {
        throw new Error('JSON contains a string that exceeds the approved length.')
      }
      return
    }
    if (candidate === null || typeof candidate === 'boolean') return
    if (typeof candidate === 'number') {
      if (!Number.isFinite(candidate) || !Number.isSafeInteger(candidate) && Math.abs(candidate) > Number.MAX_SAFE_INTEGER) {
        throw new Error('JSON contains an unsafe numeric value.')
      }
      return
    }
    if (Array.isArray(candidate)) {
      if (candidate.length > options.maximumNodes) throw new Error('JSON array exceeds the approved length.')
      for (const child of candidate) visit(child, depth + 1)
      return
    }
    if (typeof candidate !== 'object') throw new Error('JSON contains an unsupported value.')
    const prototype = Object.getPrototypeOf(candidate)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error('JSON object has an unsafe prototype.')
    }
    for (const [key, child] of Object.entries(candidate)) {
      if (FORBIDDEN_KEYS.has(key)) throw new Error(`JSON contains forbidden object key: ${key}.`)
      if (key.length > 240) throw new Error('JSON contains an object key that exceeds the approved length.')
      visit(child, depth + 1)
    }
  }
  visit(value, 0)
}
