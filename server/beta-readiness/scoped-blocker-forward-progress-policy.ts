export const SCOPED_BLOCKER_FORWARD_PROGRESS_POLICY = {
  intentionalBlanketBlocksAllowed: false,
  blockerScope: 'named_unsafe_action_only',
  safeForwardProgressRequired: true,
  nextSafeActionRequiredForBlockers: true,
} as const

export const ALLOWED_BLOCKED_ACTION_SCOPES = [
  'external_beta_tool_execution',
  'paid_production_tool_execution',
  'external_beta_launch',
  'real_user_media_beta',
  'paid_production_launch',
  'production_deployment',
  'production_runtime_execution',
  'provider_call_execution',
  'worker_dispatch',
  'supabase_write',
  'gcs_write',
  'public_artifact_delivery',
  'signed_url_delivery',
] as const

export const ALLOWED_FORWARD_PROGRESS_SCOPES = [
  'source_review',
  'local_dependency_install_proof',
  'bounded_command_import_container_proof',
  'safe_blocker_reduction_preview',
  'diagnostics_and_qa_packets',
  'deployment_preflight_and_platform_evidence_collection',
  'deployed_evidence_preflight',
  'owner_approval_packet_collection',
  'owner_approval_collection',
  'security_privacy_review',
  'rollback_monitoring_support_planning',
] as const

export type ScopedBlockerForwardProgressPolicy = typeof SCOPED_BLOCKER_FORWARD_PROGRESS_POLICY
export type BlockedActionScope = typeof ALLOWED_BLOCKED_ACTION_SCOPES[number]
export type AllowedForwardProgressScope = typeof ALLOWED_FORWARD_PROGRESS_SCOPES[number]

export interface ScopedBlockerPolicyCarrier {
  blockerForwardProgressPolicy: {
    intentionalBlanketBlocksAllowed: boolean
    blockerScope: string
    safeForwardProgressRequired: boolean
    nextSafeActionRequiredForBlockers: boolean
  }
  safeBlockerReductionAllowed: boolean
  blockedActionScope: string[]
  allowedForwardProgressScopes?: string[]
}

export interface ScopedBlockerLedgerRowCarrier {
  key: string
  blockerMode: string
  blocksSafeForwardProgress: boolean
  blockedActionScope: string[]
  missingEvidence: string
  safeForwardProgressScope: string
  nextSafeAction: string
}

export function defaultAllowedForwardProgressScopes(): AllowedForwardProgressScope[] {
  return [
    'source_review',
    'local_dependency_install_proof',
    'bounded_command_import_container_proof',
    'safe_blocker_reduction_preview',
    'diagnostics_and_qa_packets',
    'deployment_preflight_and_platform_evidence_collection',
    'owner_approval_packet_collection',
    'rollback_monitoring_support_planning',
  ]
}

export function validateScopedBlockerPolicyCarrier(
  carrier: ScopedBlockerPolicyCarrier,
  label = 'scoped blocker policy carrier',
): string[] {
  const issues: string[] = []
  const policy = carrier.blockerForwardProgressPolicy

  if (policy.intentionalBlanketBlocksAllowed !== false) {
    issues.push(`${label}: intentional blanket blockers must be false.`)
  }
  if (policy.blockerScope !== 'named_unsafe_action_only') {
    issues.push(`${label}: blocker scope must be named_unsafe_action_only.`)
  }
  if (policy.safeForwardProgressRequired !== true) {
    issues.push(`${label}: safe forward progress must be required.`)
  }
  if (policy.nextSafeActionRequiredForBlockers !== true) {
    issues.push(`${label}: next safe action must be required for blockers.`)
  }
  if (carrier.safeBlockerReductionAllowed !== true) {
    issues.push(`${label}: safe blocker reduction must remain allowed.`)
  }

  issues.push(...unknownValues(
    `${label}: blocked action scope`,
    carrier.blockedActionScope,
    ALLOWED_BLOCKED_ACTION_SCOPES,
  ))

  if (carrier.blockedActionScope.length > 0 && (carrier.allowedForwardProgressScopes?.length ?? 0) === 0) {
    issues.push(`${label}: blocked reports must expose at least one allowed forward-progress scope.`)
  }

  if (carrier.allowedForwardProgressScopes) {
    issues.push(...unknownValues(
      `${label}: allowed forward-progress scope`,
      carrier.allowedForwardProgressScopes,
      ALLOWED_FORWARD_PROGRESS_SCOPES,
    ))
  }

  return issues
}

export function assertScopedBlockerPolicyCarrier(
  carrier: ScopedBlockerPolicyCarrier,
  label?: string,
): void {
  const issues = validateScopedBlockerPolicyCarrier(carrier, label)
  if (issues.length > 0) {
    throw new Error(issues.join('\n'))
  }
}

export function validateScopedBlockerLedgerRows(
  rows: ScopedBlockerLedgerRowCarrier[],
  label = 'scoped blocker ledger rows',
): string[] {
  const issues: string[] = []

  for (const row of rows) {
    if (!row.key.trim()) issues.push(`${label}: row key is required.`)
    if (row.blockerMode !== 'scoped_unsafe_action_only') {
      issues.push(`${label}:${row.key}: blocker mode must be scoped_unsafe_action_only.`)
    }
    if (row.blocksSafeForwardProgress !== false) {
      issues.push(`${label}:${row.key}: blockers must not stop safe forward progress.`)
    }
    if (!row.missingEvidence.trim()) issues.push(`${label}:${row.key}: missing evidence text is required.`)
    if (!row.safeForwardProgressScope.trim()) issues.push(`${label}:${row.key}: safe forward-progress scope is required.`)
    if (!row.nextSafeAction.trim()) issues.push(`${label}:${row.key}: next safe action is required.`)
    issues.push(...unknownValues(
      `${label}:${row.key}: blocked action scope`,
      row.blockedActionScope,
      ALLOWED_BLOCKED_ACTION_SCOPES,
    ))
    issues.push(...unknownValues(
      `${label}:${row.key}: safe forward-progress scope`,
      [row.safeForwardProgressScope],
      ALLOWED_FORWARD_PROGRESS_SCOPES,
    ))
  }

  return issues
}

export function assertScopedBlockerLedgerRows(
  rows: ScopedBlockerLedgerRowCarrier[],
  label?: string,
): void {
  const issues = validateScopedBlockerLedgerRows(rows, label)
  if (issues.length > 0) {
    throw new Error(issues.join('\n'))
  }
}

function unknownValues(
  label: string,
  values: string[],
  allowedValues: readonly string[],
): string[] {
  const allowed = new Set(allowedValues)
  return values
    .filter((value) => !allowed.has(value))
    .map((value) => `${label} has unknown value: ${value}`)
}
