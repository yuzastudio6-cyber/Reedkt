import type { ProductionHardeningCategory } from './production-hardening-types'

export const productionHardeningCategories: ProductionHardeningCategory[] = [
  'readiness_validation',
  'worker_security',
  'tool_security',
  'model_weight_policy',
  'cost_controls',
  'concurrency_limits',
  'observability',
  'logging_sanitization',
  'privacy_retention',
  'artifact_storage',
  'export_delivery',
  'audit_logs',
  'incident_response',
  'beta_readiness',
]

export const requiredManualApprovals = [
  'deployment_approval',
  'model_weight_license_approval',
  'tool_readiness_approval',
  'security_approval',
  'cost_budget_approval',
  'legal_license_approval',
] as const

export const productionHardeningPolicy = {
  productionReadyAllowedByDefault: false,
  limitedBetaAllowedByDefault: false,
  workersExecuteApprovedSnapshotsOnly: true,
  frontendHeavyToolsBlocked: true,
  privateMediaRequired: true,
  sanitizedLogsRequired: true,
  finalExportsPrivateUntilDeliveryPolicy: true,
  manualApprovalsRequired: requiredManualApprovals,
} as const
