export type SupabaseTrackBBackfillStatus =
  | 'passed'
  | 'blocked'
  | 'planned'
  | 'skipped'

export type SupabaseTrackBBackfillBlocker =
  | 'track_b_supabase_export_missing'
  | 'track_b_supabase_export_schema_missing'
  | 'track_b_supabase_export_validation_failed'
  | 'supabase_milestone_registry_schema_missing'
  | 'supabase_milestone_registry_rls_missing_or_unsafe'
  | 'staging_supabase_credentials_unavailable'
  | 'missing_required_confirmation'
  | 'forbidden_confirmation_set'
  | 'staging_write_failed'
  | 'staging_verification_failed'

export interface TrackBSupabaseMilestoneBackfillRecord {
  phaseId: string
  track: 'track_b'
  family: string
  toolIds: string[]
  milestoneName: string
  status: string
  readinessStatus: string
  betaStatus: string
  branch: string
  prNumber?: number
  prUrl?: string
  commitSha?: string
  artifactPrefix?: string
  artifactObjectCount?: number
  allowedScope: string[]
  blockedScopes: string[]
  nextPhase: string
  createdFromReportPath: string
  exportVersion: string
}

export interface TrackBSupabaseMilestoneExport {
  exportVersion: string
  generatedByPhase: string
  generatedByRunId?: string
  status: string
  supabaseWritePerformed: false
  remoteSqlRun: false
  migrationDeployment: false
  productionAffected?: false
  forbiddenPayloadClasses: string[]
  records: TrackBSupabaseMilestoneBackfillRecord[]
}

export interface SupabaseTrackBBackfillReports {
  plan: Record<string, unknown>
  exportValidationReport: Record<string, unknown>
  stagingSupabaseBackfillPreflightReport: Record<string, unknown>
  registrySchemaCheck: Record<string, unknown>
  registryRlsCheck: Record<string, unknown>
  diffReport: Record<string, unknown>
  writeReport: Record<string, unknown>
  verificationReport: Record<string, unknown>
  auditReport: Record<string, unknown>
  rollbackPlan: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
