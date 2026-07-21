import type { PreferenceApplicationInvalidationReason } from '../../src/types/edit-reference-integration'
import { ApiError } from '../errors/api-error'

export interface PreferenceApplicationPlanInvalidationRecord {
  workspaceId: string
  projectId: string
  editSessionId: string
  preferenceApplicationId: string
  applicationContentDigest: string
  contextHash: string
  reason: PreferenceApplicationInvalidationReason
  invalidatedAt: string
  downstreamContextInvalidated: true
  approvalResetRequired: true
  approvedSnapshotPreserved: true
  executionAuthorizationRevoked: true
}

export interface PreferenceApplicationPlanInvalidationIdentity {
  workspaceId: string
  projectId: string
  editSessionId: string
  preferenceApplicationId: string
  applicationContentDigest: string
  contextHash: string
}

const invalidationsByApplication = new Map<string, PreferenceApplicationPlanInvalidationRecord>()

export function recordPreferenceApplicationPlanInvalidation(
  input: PreferenceApplicationPlanInvalidationIdentity & {
    reason: PreferenceApplicationInvalidationReason
    invalidatedAt: string
  },
): PreferenceApplicationPlanInvalidationRecord {
  const key = applicationIdentityKey(input)
  const existing = invalidationsByApplication.get(key)
  if (existing) {
    if (
      existing.applicationContentDigest !== input.applicationContentDigest
      || existing.contextHash !== input.contextHash
      || existing.reason !== input.reason
    ) {
      throw new ApiError(
        'VERSION_CONFLICT',
        'The Preference Application execution authority was already invalidated with different immutable lifecycle evidence.',
        409,
      )
    }
    return structuredClone(existing)
  }

  const record: PreferenceApplicationPlanInvalidationRecord = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    preferenceApplicationId: input.preferenceApplicationId,
    applicationContentDigest: input.applicationContentDigest,
    contextHash: input.contextHash,
    reason: input.reason,
    invalidatedAt: input.invalidatedAt,
    downstreamContextInvalidated: true,
    approvalResetRequired: true,
    approvedSnapshotPreserved: true,
    executionAuthorizationRevoked: true,
  }
  invalidationsByApplication.set(key, record)
  return structuredClone(record)
}

export function getPreferenceApplicationPlanInvalidation(
  input: PreferenceApplicationPlanInvalidationIdentity,
): PreferenceApplicationPlanInvalidationRecord | undefined {
  const existing = invalidationsByApplication.get(applicationIdentityKey(input))
  if (!existing) return undefined
  if (
    existing.applicationContentDigest !== input.applicationContentDigest
    || existing.contextHash !== input.contextHash
  ) return undefined
  return structuredClone(existing)
}

function applicationIdentityKey(input: Pick<
  PreferenceApplicationPlanInvalidationIdentity,
  'workspaceId' | 'projectId' | 'editSessionId' | 'preferenceApplicationId'
>): string {
  return JSON.stringify([
    input.workspaceId,
    input.projectId,
    input.editSessionId,
    input.preferenceApplicationId,
  ])
}
