import { APPROVED_SNAPSHOT_REQUIRED_PAYLOAD_FIELDS } from '../../src/backend/cloud/approved-plan-snapshot-contracts'
import { isPlainObject, looksLikeSecretValue } from '../../src/backend/cloud/cloud-runtime-contracts'

const APPROVED_SNAPSHOT_SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /access[_-]?key/i,
  /provider[_-]?key/i,
  /secret/i,
  /service[_-]?role/i,
  /private[_-]?key/i,
  /password/i,
  /credential/i,
  /authorization/i,
  /bearer/i,
  /token/i,
  /cookie/i,
  /signed[_-]?url/i,
  /webhook[_-]?secret/i,
]

export interface ApprovedSnapshotValidationResult {
  ok: boolean
  missingSections: string[]
  secretLikePaths: string[]
}

export function validateApprovedSnapshotJson(snapshotJson: Record<string, unknown>): ApprovedSnapshotValidationResult {
  const missingSections = APPROVED_SNAPSHOT_REQUIRED_PAYLOAD_FIELDS
    .filter((fieldName) => snapshotJson[fieldName] === undefined || snapshotJson[fieldName] === null)
    .map(String)
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(snapshotJson)

  return {
    ok: missingSections.length === 0 && secretLikePaths.length === 0,
    missingSections,
    secretLikePaths,
  }
}

export function findApprovedSnapshotSecretLikePaths(value: unknown, prefix = '$'): string[] {
  if (typeof value === 'string') {
    return looksLikeSecretValue(value) ? [prefix] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findApprovedSnapshotSecretLikePaths(item, `${prefix}[${index}]`))
  }

  if (!isPlainObject(value)) {
    return []
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const path = `${prefix}.${key}`
    const current = looksLikeApprovedSnapshotSecretKey(key) ? [path] : []
    return [...current, ...findApprovedSnapshotSecretLikePaths(nested, path)]
  })
}

export function cloneApprovedSnapshotJson(snapshotJson: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(snapshotJson)) as Record<string, unknown>
}

function looksLikeApprovedSnapshotSecretKey(key: string): boolean {
  return APPROVED_SNAPSHOT_SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key))
}
