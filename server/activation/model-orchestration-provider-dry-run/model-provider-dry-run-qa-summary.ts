import type { ValidationResult } from './model-provider-dry-run-types'

export function buildModelProviderDryRunQaSummary(input: {
  requestRedaction: ValidationResult
  schemaValidation: ValidationResult[]
  responseRedaction: ValidationResult[]
  artifactStatus: string
  supabaseSyncStatus: string
  execute: boolean
}) {
  const blockers = [
    ...input.requestRedaction.blockers.map((blocker) => `request_redaction:${blocker}`),
    ...input.schemaValidation.flatMap((result) => result.blockers.map((blocker) => `${result.caseId ?? 'unknown'}:schema:${blocker}`)),
    ...input.responseRedaction.flatMap((result) => result.blockers.map((blocker) => `${result.caseId ?? 'unknown'}:response_redaction:${blocker}`)),
    ...(input.execute && input.artifactStatus !== 'passed' ? [`artifact_status:${input.artifactStatus}`] : []),
  ]

  return {
    phase: 'MODEL_DRYRUN_1',
    status: blockers.length === 0 ? 'passed' : 'blocked',
    executeMode: input.execute,
    syntheticOnly: true,
    requestRedactionStatus: input.requestRedaction.status,
    schemaValidationStatus: input.schemaValidation.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    responseRedactionStatus: input.responseRedaction.every((result) => result.status === 'passed') ? 'passed' : 'blocked',
    privateArtifactStatus: input.artifactStatus,
    supabaseMilestoneSyncStatus: input.supabaseSyncStatus,
    rawProviderResponsesCommitted: false,
    secretPayloadsCommitted: false,
    unsafeClaimsDetected: false,
    blockers,
    warnings: input.execute && input.supabaseSyncStatus !== 'passed'
      ? ['supabase_milestone_sync_unavailable_optional_partial_status']
      : [],
  }
}
