export interface ClosedContractTreeValidation {
  ok: boolean
  error?: string
}

export interface ClosedContractTreeLimits {
  maximumNodes: number
  maximumDepth: number
  maximumStringLength: number
  maximumObjectKeys: number
  maximumArrayLength: number
}

export const DEFAULT_CLOSED_CONTRACT_TREE_LIMITS:
Readonly<ClosedContractTreeLimits> = Object.freeze({
  maximumNodes: 50_000,
  maximumDepth: 48,
  maximumStringLength: 16_384,
  maximumObjectKeys: 2_048,
  maximumArrayLength: 8_192,
})

/**
 * Validates the complete JavaScript value before any domain field is read.
 * Canonical public contracts must not accept inherited fields, accessors,
 * symbols, sparse arrays, cycles, non-finite numbers, or unbounded trees.
 */
export function validateClosedContractTree(
  value: unknown,
  limits: ClosedContractTreeLimits = DEFAULT_CLOSED_CONTRACT_TREE_LIMITS,
): ClosedContractTreeValidation {
  const ancestors = new WeakSet<object>()
  const stack: Array<{
    candidate: unknown
    depth: number
    path: string
    leaving?: object
  }> = [{ candidate: value, depth: 0, path: '$' }]
  let nodes = 0

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) break
    if (current.leaving) {
      ancestors.delete(current.leaving)
      continue
    }
    nodes += 1
    if (nodes > limits.maximumNodes) {
      return { ok: false, error: 'Contract tree exceeds its node limit.' }
    }
    if (current.depth > limits.maximumDepth) {
      return { ok: false, error: `${current.path} exceeds its depth limit.` }
    }
    const candidate = current.candidate
    if (candidate === null || typeof candidate === 'boolean') continue
    if (typeof candidate === 'string') {
      if (candidate.length > limits.maximumStringLength) {
        return {
          ok: false,
          error: `${current.path} exceeds its string-length limit.`,
        }
      }
      continue
    }
    if (typeof candidate === 'number') {
      if (!Number.isFinite(candidate)) {
        return {
          ok: false,
          error: `${current.path} contains a non-finite number.`,
        }
      }
      continue
    }
    if (
      typeof candidate === 'undefined'
      || typeof candidate === 'bigint'
      || typeof candidate === 'symbol'
      || typeof candidate === 'function'
    ) {
      return {
        ok: false,
        error: `${current.path} contains a non-serializable value.`,
      }
    }
    if (!candidate || typeof candidate !== 'object') {
      return {
        ok: false,
        error: `${current.path} contains an unsupported value.`,
      }
    }
    if (ancestors.has(candidate)) {
      return {
        ok: false,
        error: `${current.path} contains a cyclic reference.`,
      }
    }
    const isArray = Array.isArray(candidate)
    const prototype = Object.getPrototypeOf(candidate)
    if (
      (isArray && prototype !== Array.prototype)
      || (!isArray && prototype !== Object.prototype && prototype !== null)
    ) {
      return {
        ok: false,
        error: `${current.path} is not a plain serialized value.`,
      }
    }
    const ownKeys = Reflect.ownKeys(candidate)
    if (ownKeys.some((key) => typeof key !== 'string')) {
      return {
        ok: false,
        error: `${current.path} contains a symbol-keyed field.`,
      }
    }
    if (isArray) {
      if (candidate.length > limits.maximumArrayLength) {
        return {
          ok: false,
          error: `${current.path} exceeds its array-length limit.`,
        }
      }
      const allowedKeys = new Set([
        'length',
        ...Array.from({ length: candidate.length }, (_, index) => String(index)),
      ])
      if (
        Array.from({ length: candidate.length }, (_, index) => index)
          .some((index) =>
            !Object.prototype.hasOwnProperty.call(candidate, index))
        || ownKeys.some((key) =>
          typeof key !== 'string' || !allowedKeys.has(key))
      ) {
        return {
          ok: false,
          error: `${current.path} is sparse or has a non-index field.`,
        }
      }
    } else if (ownKeys.length > limits.maximumObjectKeys) {
      return {
        ok: false,
        error: `${current.path} exceeds its object-key limit.`,
      }
    }

    ancestors.add(candidate)
    stack.push({
      candidate: null,
      depth: current.depth,
      path: current.path,
      leaving: candidate,
    })
    for (let index = ownKeys.length - 1; index >= 0; index -= 1) {
      const key = ownKeys[index]
      if (typeof key !== 'string' || key === 'length') continue
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key)
      if (
        !descriptor
        || !Object.prototype.hasOwnProperty.call(descriptor, 'value')
        || descriptor.get
        || descriptor.set
        || !descriptor.enumerable
      ) {
        return {
          ok: false,
          error: `${current.path}.${key} is not an enumerable own data field.`,
        }
      }
      stack.push({
        candidate: descriptor.value,
        depth: current.depth + 1,
        path: `${current.path}.${key}`,
      })
    }
  }
  return { ok: true }
}

export function assertClosedContractTree(
  value: unknown,
  label: string,
): void {
  const result = validateClosedContractTree(value)
  if (!result.ok) {
    throw new Error(`${label} is not closed serialized data: ${result.error}`)
  }
}

export function isClosedContractRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function compareUtf16Lexical(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}
