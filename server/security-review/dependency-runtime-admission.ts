import { ApiError } from '../errors/api-error'

export type DependencyRestrictedCapability = 'gcs_storage' | 'google_cloud_auth'

export interface DependencyRuntimeAdmission {
  readonly allowed: false
  readonly capability: DependencyRestrictedCapability
  readonly reviewId: 'edit-reference-gate-h-dependency-review-v3'
  readonly status: 'blocked_pending_upstream_remediation_or_authorized_security_disposition'
  readonly findingPackages: readonly string[]
  readonly retryable: false
  readonly remoteMutationAttempted: false
  readonly message: string
}

export const DEPENDENCY_RUNTIME_REVIEW = Object.freeze({
  schemaVersion: 'dependency-runtime-admission-v1',
  reviewId: 'edit-reference-gate-h-dependency-review-v3',
  reviewedAt: '2026-07-18',
  advisory: 'GHSA-w5hq-g745-h8pq',
  currentStoragePackage: '@google-cloud/storage@7.19.0',
  latestReviewedStoragePackage: '@google-cloud/storage@7.21.0',
  latestReviewedStoragePackageRemediatesChain: false,
  riskAcceptanceGranted: false,
  findingPackages: Object.freeze([
    '@google-cloud/storage',
    'gaxios',
    'retry-request',
    'teeny-request',
    'uuid',
  ]),
  restrictedCapabilities: Object.freeze([
    'gcs_storage',
    'google_cloud_auth',
  ] satisfies DependencyRestrictedCapability[]),
  releaseBoundary: Object.freeze({
    gcsProductionActivationAllowed: false,
    defaultGoogleAuthExecutionAllowed: false,
    remoteProviderActivationAllowed: false,
    externalBetaAllowed: false,
    productionAllowed: false,
  }),
})

export function resolveDependencyRuntimeAdmission(
  capability: DependencyRestrictedCapability,
): DependencyRuntimeAdmission {
  return {
    allowed: false,
    capability,
    reviewId: DEPENDENCY_RUNTIME_REVIEW.reviewId,
    status: 'blocked_pending_upstream_remediation_or_authorized_security_disposition',
    findingPackages: [...DEPENDENCY_RUNTIME_REVIEW.findingPackages],
    retryable: false,
    remoteMutationAttempted: false,
    message: capability === 'gcs_storage'
      ? 'Remote object storage is unavailable pending dependency security review.'
      : 'The default Google-authenticated runtime is unavailable pending dependency security review.',
  }
}

export function assertDependencyRuntimeAdmission(
  capability: DependencyRestrictedCapability,
): void {
  const admission = resolveDependencyRuntimeAdmission(capability)
  throw new ApiError(
    'DEPENDENCY_SECURITY_REVIEW_REQUIRED',
    admission.message,
    503,
    {
      capability: admission.capability,
      reviewId: admission.reviewId,
      status: admission.status,
      retryable: admission.retryable,
      remoteMutationAttempted: admission.remoteMutationAttempted,
    },
  )
}

export function createDependencyRuntimeAdmissionSummary(): Record<string, unknown> {
  return {
    schemaVersion: DEPENDENCY_RUNTIME_REVIEW.schemaVersion,
    reviewId: DEPENDENCY_RUNTIME_REVIEW.reviewId,
    reviewedAt: DEPENDENCY_RUNTIME_REVIEW.reviewedAt,
    unresolvedFindingCount: DEPENDENCY_RUNTIME_REVIEW.findingPackages.length,
    restrictedCapabilities: [...DEPENDENCY_RUNTIME_REVIEW.restrictedCapabilities],
    riskAcceptanceGranted: DEPENDENCY_RUNTIME_REVIEW.riskAcceptanceGranted,
    releaseBoundary: { ...DEPENDENCY_RUNTIME_REVIEW.releaseBoundary },
  }
}
