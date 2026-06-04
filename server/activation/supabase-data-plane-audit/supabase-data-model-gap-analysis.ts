import type {
  SupabaseActivityAudit,
  SupabaseDataModelGap,
  SupabaseDataModelGapAnalysis,
  SupabaseMigrationAudit,
  SupabaseRlsPolicyAudit,
  SupabaseRuntimeIntegrationAudit,
} from './supabase-data-plane-audit-types'

export function buildSupabaseDataModelGapAnalysis(input: {
  migrationAudit: SupabaseMigrationAudit
  rlsPolicyAudit: SupabaseRlsPolicyAudit
  runtimeIntegrationAudit: SupabaseRuntimeIntegrationAudit
  remoteActivityAudit: SupabaseActivityAudit
}): SupabaseDataModelGapAnalysis {
  const gaps: SupabaseDataModelGap[] = []
  const created = new Set(input.migrationAudit.createdTables.map((table) => table.tableName))
  const referenced = new Set(input.runtimeIntegrationAudit.tableReferences.map((entry) => entry.tableName))

  if (!['user_profiles', 'workspaces', 'projects', 'chat_sessions', 'chat_messages'].every((table) => created.has(table))) {
    gaps.push(gap('p0-user-project-schema', 'P0', 'user_project_persistence', 'Core user/workspace/project/chat schema coverage is incomplete in parsed migrations.', ['Required core tables missing from parsed migration set.'], 'Reconcile core identity/project/chat migrations before internal beta.'))
  }
  if (!created.has('approved_plan_snapshots')) {
    gaps.push(gap('p0-approved-snapshot-schema', 'P0', 'approved_plan_snapshots', 'Approved plan snapshot persistence is not proven by parsed migrations.', ['approved_plan_snapshots table was not parsed.'], 'Harden approved snapshot schema and immutable service-role write path.'))
  }
  if (!created.has('jobs') || !created.has('worker_job_claims')) {
    gaps.push(gap('p0-worker-runtime-schema', 'P0', 'jobs_workers', 'Job and worker claim persistence is incomplete.', ['jobs and worker_job_claims must both exist for controlled internal runtime evidence.'], 'Plan worker claim/execution contract hardening against applied schema.'))
  }
  if (!created.has('storage_object_records') || !created.has('upload_intents')) {
    gaps.push(gap('p0-artifact-storage-schema', 'P0', 'artifacts_storage', 'Canonical storage object/upload intent records are not fully proven.', ['storage_object_records and upload_intents are required for source-of-truth artifact tracking.'], 'Validate artifact record migrations and backend storage write paths.'))
  }
  if (!created.has('signed_url_events')) {
    gaps.push(gap('p0-signed-url-audit', 'P0', 'signed_url_audit', 'Signed URL audit records are missing from parsed migrations.', ['signed_url_events was not parsed.'], 'Add or verify signed URL event audit table while preserving no signed URL source-of-truth policy.'))
  }
  if (!created.has('tool_runtime_checks') || !created.has('provider_request_attempts')) {
    gaps.push(gap('p1-provider-tool-runtime', 'P1', 'providers_tools', 'Tool/provider runtime audit tables are incomplete.', ['tool_runtime_checks and provider_request_attempts must support future execution evidence.'], 'Plan provider/tool runtime audit hardening before unrestricted execution.'))
  }
  if (input.rlsPolicyAudit.missingRlsTables.length > 0) {
    gaps.push(gap('p0-rls-coverage', 'P0', 'rls_security', 'One or more parsed tables lacks explicit RLS enablement.', [`Missing RLS tables: ${input.rlsPolicyAudit.missingRlsTables.slice(0, 12).join(', ')}`], 'Review RLS coverage and add local/remote smoke validation.'))
  }
  if (input.runtimeIntegrationAudit.runtimeEnvSummary.mockOnlyLikely) {
    gaps.push(gap('p0-runtime-mock-only', 'P0', 'runtime_integration', 'Current runtime configuration is likely mock-only without service-role Supabase env.', ['loadRuntimeEnv marks mockOnly when Supabase admin env is unavailable.'], 'Configure backend-only Supabase env and verify read/write paths in a later approved phase.'))
  }
  if (input.remoteActivityAudit.status !== 'completed') {
    gaps.push(gap('p0-remote-activity-unverified', 'P0', 'activity_visibility', 'Remote Supabase activity is not verified by Phase 51A.', input.remoteActivityAudit.blockers, 'Rerun with backend read-only audit credentials or provide sanitized count evidence.'))
  } else if (input.remoteActivityAudit.tablesChecked.every((entry) => (entry.count ?? 0) === 0)) {
    gaps.push(gap('p1-remote-activity-empty', 'P1', 'activity_visibility', 'Remote target tables counted successfully but appear empty.', ['All counted target tables returned zero rows.'], 'Confirm whether staging app traffic is intentionally mock-only or not writing to Supabase.'))
  }
  for (const tableName of ['jobs', 'job_events']) {
    if (!referenced.has(tableName)) {
      gaps.push(gap(`p2-runtime-reference-${tableName}`, 'P2', 'runtime_integration', `Runtime code does not currently reference ${tableName} through a Supabase table call.`, [`Parsed .from('${tableName}') references were absent.`], 'Confirm whether backend routes or workers are still mock-only for this table.'))
    }
  }

  const p0Count = gaps.filter((entry) => entry.severity === 'P0').length
  return {
    gaps,
    p0Count,
    canRunLocalSql: false,
    canProceedToPrompt20B: p0Count === 0 && input.remoteActivityAudit.status === 'completed',
    blockers: gaps.filter((entry) => entry.severity === 'P0').map((entry) => `${entry.gapId}: ${entry.summary}`),
    warnings: gaps.filter((entry) => entry.severity !== 'P0').map((entry) => `${entry.gapId}: ${entry.summary}`),
  }
}

function gap(
  gapId: string,
  severity: SupabaseDataModelGap['severity'],
  category: SupabaseDataModelGap['category'],
  summary: string,
  evidence: string[],
  recommendedPhase51BAction: string,
): SupabaseDataModelGap {
  return { gapId, severity, category, summary, evidence, recommendedPhase51BAction }
}
