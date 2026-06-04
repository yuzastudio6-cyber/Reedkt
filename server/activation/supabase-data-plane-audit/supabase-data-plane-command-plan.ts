import { supabaseDataPlaneArtifactPrefix, supabaseDataPlaneAuditConfig } from './supabase-data-plane-audit-policy'
import type { SupabaseDataPlaneCommandPlan, SupabaseDataPlaneIamPlan } from './supabase-data-plane-audit-types'

export function buildSupabaseDataPlaneCommandPlan(): SupabaseDataPlaneCommandPlan {
  return {
    planId: 'phase51a-supabase-data-plane-command-plan',
    defaultMode: 'static_report_only',
    commands: [
      {
        commandId: 'static_report',
        description: 'Build the static Supabase data-plane audit report without remote credentials or DB calls.',
        command: 'npm run activation:supabase-data-plane-audit:report',
        mutating: false,
        allowedInPhase51A: true,
      },
      {
        commandId: 'confirmed_readonly_execution',
        description: 'Run the guarded read-only audit and upload private JSON artifacts if GCP/GCS access is available.',
        command: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_SUPABASE_READONLY_AUDIT=true npm run activation:supabase-data-plane-audit -- --execute',
        mutating: false,
        allowedInPhase51A: true,
      },
      {
        commandId: 'forbidden_migration',
        description: 'Supabase migrations are explicitly outside Phase 51A.',
        command: 'supabase db push',
        mutating: true,
        allowedInPhase51A: false,
      },
    ],
    blockedAlways: [
      'supabase start/status/db reset/db push/migration execution',
      'SQL insert/update/delete/alter/drop/grant/revoke',
      'remote schema mutation',
      'row writes',
      'service-role value printing',
      'signed URL creation',
      'provider calls',
      'media processing',
      'Docker or Cloud Run deployment',
      'production/external beta/broad media unlock',
      'project-level or public Secret Manager grants',
    ],
  }
}

export function buildSupabaseDataPlaneIamPlan(runId = 'phase51a-planned'): SupabaseDataPlaneIamPlan {
  const prefix = supabaseDataPlaneArtifactPrefix(runId)
  return {
    phase: '51A',
    mode: 'report_only',
    defaultMutationAllowed: false,
    generatedAssetsPrefix: `gs://${supabaseDataPlaneAuditConfig.generatedAssetsBucket}/${prefix}/`,
    qaPrefix: `gs://${supabaseDataPlaneAuditConfig.qaBucket}/${prefix}/`,
    conditionalBindingsIfUploadBlocked: [
      {
        role: 'roles/storage.objectCreator',
        bucket: supabaseDataPlaneAuditConfig.generatedAssetsBucket,
        prefixCondition: `${prefix}/`,
        principal: 'current_authenticated_executor',
      },
      {
        role: 'roles/storage.objectCreator',
        bucket: supabaseDataPlaneAuditConfig.qaBucket,
        prefixCondition: `${prefix}/`,
        principal: 'current_authenticated_executor',
      },
    ],
    forbiddenBindings: [
      'roles/storage.admin',
      'roles/storage.objectAdmin',
      'roles/owner',
      'roles/editor',
      'allUsers',
      'allAuthenticatedUsers',
      'project-level secretmanager.secretAccessor',
      'Secret Manager grants outside SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY approved staging service accounts',
    ],
  }
}
