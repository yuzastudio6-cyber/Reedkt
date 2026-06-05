import type { ApprovedPlanValidationCommandPlan } from './approved-plan-validation-types'

export function buildApprovedPlanValidationCommandPlan(): ApprovedPlanValidationCommandPlan {
  return {
    defaultMode: 'static_report_only',
    executionMode: 'guarded_private_artifact_and_single_supabase_milestone_sync',
    allowedCommands: [
      'npm run activation:approved-plan-snapshot-validation:report',
      'npm run activation:approved-plan-snapshot-validation:iam-plan',
      'npm run smoke:activation-approved-plan-snapshot-validation',
      'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_APPROVED_PLAN_SNAPSHOT_VALIDATION=true REEDITPRO_CONFIRM_SUPABASE_MILESTONE_SYNC=true npm run activation:approved-plan-snapshot-validation -- --execute',
    ],
    blockedAlways: [
      'tool, worker, model, provider, browser, map, media, or search execution',
      'Docker build/push and Cloud Run deploy',
      'Supabase migrations, schema/RLS changes, historical backfill, or product-row writes',
      'production, external beta, paid production, broad-media, public artifact, signed URL source-of-truth, or raw prompt unlocks',
    ],
    noToolRuntimeExecution: true,
    noWorkerExecution: true,
    noProviderCalls: true,
    noMigrations: true,
  }
}
