export const BOUNDED_ADAPTER_PACKAGE_READINESS_STATUSES = [
  'passed',
  'missing',
  'blocked',
  'not_installed',
  'needs_license_review',
  'not_checked',
] as const

export type BoundedAdapterPackageReadinessStatus = typeof BOUNDED_ADAPTER_PACKAGE_READINESS_STATUSES[number]

export const BOUNDED_ADAPTER_PACKAGE_READINESS_EVIDENCE_SOURCES = [
  'backend_tool_readiness_worker',
  'backend_container_readiness_report',
  'owner_approved_source_truth',
] as const

export type BoundedAdapterPackageReadinessEvidenceSource = typeof BOUNDED_ADAPTER_PACKAGE_READINESS_EVIDENCE_SOURCES[number]

export const BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_STATUSES = [
  'approved',
  'blocked',
  'needs_review',
] as const

export type BoundedAdapterModelWeightApprovalStatus = typeof BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_STATUSES[number]

export const BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_SOURCES = [
  'owner_approved_model_manifest',
  'backend_model_weight_manifest',
] as const

export type BoundedAdapterModelWeightApprovalSource = typeof BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_SOURCES[number]

export function isBoundedAdapterPackageReadinessEvidenceSource(
  value: unknown,
): value is BoundedAdapterPackageReadinessEvidenceSource {
  return typeof value === 'string' && BOUNDED_ADAPTER_PACKAGE_READINESS_EVIDENCE_SOURCES.includes(
    value as BoundedAdapterPackageReadinessEvidenceSource,
  )
}

export function isBoundedAdapterModelWeightApprovalSource(
  value: unknown,
): value is BoundedAdapterModelWeightApprovalSource {
  return typeof value === 'string' && BOUNDED_ADAPTER_MODEL_WEIGHT_APPROVAL_SOURCES.includes(
    value as BoundedAdapterModelWeightApprovalSource,
  )
}
