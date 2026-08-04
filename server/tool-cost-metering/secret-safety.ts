import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'

export interface ToolCostSecretSafetyResult {
  ok: boolean
  secretLikePaths: string[]
}

const TOOL_COST_SECRET_KEY_PATTERNS = [
  /raw[_-]?prompt/i,
  /user[_-]?prompt/i,
  /system[_-]?prompt/i,
  /provider[_-]?prompt/i,
  /prompt[_-]?text/i,
  /prompt[_-]?payload/i,
]

export function validateToolCostNoSecretLikeFields(value: unknown): ToolCostSecretSafetyResult {
  const secretLikePaths = [
    ...findApprovedSnapshotSecretLikePaths(value),
    ...findToolCostSpecificSecretLikePaths(value),
  ]
  return {
    ok: secretLikePaths.length === 0,
    secretLikePaths: Array.from(new Set(secretLikePaths)),
  }
}

function findToolCostSpecificSecretLikePaths(value: unknown, prefix = '$'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findToolCostSpecificSecretLikePaths(item, `${prefix}[${index}]`))
  }

  if (!isPlainObject(value)) {
    return []
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const path = `${prefix}.${key}`
    const current = looksLikeToolCostSecretKey(key) ? [path] : []
    return [...current, ...findToolCostSpecificSecretLikePaths(nested, path)]
  })
}

function looksLikeToolCostSecretKey(key: string): boolean {
  return TOOL_COST_SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
