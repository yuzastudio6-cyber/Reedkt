export type SupabaseTrackBCleanStagingBackfillStatus =
  | 'passed'
  | 'blocked'
  | 'planned'
  | 'skipped'

export type SupabaseTrackBCleanStagingBackfillBlocker =
  | 'track_b_supabase_export_missing'
  | 'track_b_supabase_export_schema_missing'
  | 'track_b_supabase_export_validation_failed'
  | 'clean_staging_target_reference_missing'
  | 'clean_staging_schema_rls_not_verified'
  | 'clean_staging_plugin_write_not_available'
  | 'clean_staging_diff_conflict'
  | 'missing_required_confirmation'
  | 'forbidden_confirmation_set'
  | 'clean_staging_write_failed'
  | 'clean_staging_verification_failed'

export interface SupabaseTrackBCleanStagingBackfillReports {
  sourceOfTruthOwnershipAudit: Record<string, unknown>
  plan: Record<string, unknown>
  exportValidationReport: Record<string, unknown>
  targetPreflightReport: Record<string, unknown>
  mappingReport: Record<string, unknown>
  diffReport: Record<string, unknown>
  writeReport: Record<string, unknown>
  verificationReport: Record<string, unknown>
  auditReport: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}

export interface SupabaseTrackBCleanStagingPluginResultInput {
  diffResult?: Record<string, unknown>
  writeResult?: Record<string, unknown>
  verificationResult?: Record<string, unknown>
}
