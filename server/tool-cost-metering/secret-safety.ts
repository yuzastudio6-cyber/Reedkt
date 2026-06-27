import { findApprovedSnapshotSecretLikePaths } from '../services/approved-snapshot-validation'

export interface ToolCostSecretSafetyResult {
  ok: boolean
  secretLikePaths: string[]
}

export function validateToolCostNoSecretLikeFields(value: unknown): ToolCostSecretSafetyResult {
  const secretLikePaths = findApprovedSnapshotSecretLikePaths(value)
  return {
    ok: secretLikePaths.length === 0,
    secretLikePaths,
  }
}
