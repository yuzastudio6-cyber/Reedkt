import type { MigrationDraftFilePlan, MigrationDraftPlan } from '../types/supabase-migration-drafts'

const baseChecklist = [
  'Confirm table fields and defaults match the schema bridge.',
  'Review foreign keys and cascade behavior.',
  'Review indexes for expected project/session queries.',
  'Confirm JSONB fields preserve full planning snapshots where needed.',
  'Confirm RLS and service-role assumptions before real migration.',
]

export const migrationDraftFiles: MigrationDraftFilePlan[] = [
  {
    id: '001_core_workspace_projects',
    fileName: '001_core_workspace_projects.draft.sql',
    path: 'database/migration-drafts/001_core_workspace_projects.draft.sql',
    purpose: 'Draft profiles, workspaces, workspace members, projects, edit sessions, chat messages, and user confirmations.',
    tablesCovered: ['profiles', 'workspaces', 'workspace_members', 'projects', 'edit_sessions', 'chat_messages', 'user_confirmations'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: [...baseChecklist, 'Confirm workspace membership and current session reference strategy.'],
  },
  {
    id: '002_media_and_source_sequence',
    fileName: '002_media_and_source_sequence.draft.sql',
    path: 'database/migration-drafts/002_media_and_source_sequence.draft.sql',
    purpose: 'Draft source media, uploaded clips, source sequence items, and future clip analysis snapshots.',
    tablesCovered: ['media_assets', 'uploaded_clips', 'source_sequence_items', 'clip_analysis_snapshots'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: [...baseChecklist, 'Confirm private source media assumptions and source-order confirmation fields.'],
  },
  {
    id: '003_intent_and_plan_versions',
    fileName: '003_intent_and_plan_versions.draft.sql',
    path: 'database/migration-drafts/003_intent_and_plan_versions.draft.sql',
    purpose: 'Draft compiled intent, settings snapshots, edit plan versions, component snapshots, segments, and edit operations.',
    tablesCovered: ['edit_intent_snapshots', 'edit_settings_snapshots', 'edit_plan_versions', 'plan_component_snapshots', 'edit_plan_segments', 'edit_operations'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: [...baseChecklist, 'Confirm full_plan_json and revision/versioning behavior before approval.'],
  },
  {
    id: '004_credits_approval_snapshots',
    fileName: '004_credits_approval_snapshots.draft.sql',
    path: 'database/migration-drafts/004_credits_approval_snapshots.draft.sql',
    purpose: 'Draft credit estimates, credit estimate items, approval records, and immutable approved plan snapshots.',
    tablesCovered: ['credit_estimates', 'credit_estimate_items', 'approval_records', 'approved_plan_snapshots'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: [
      ...baseChecklist,
      'Review approved snapshot immutability trigger template.',
      'Confirm approval records point to exact plan, estimate, and snapshot versions.',
      'Confirm future credit ledger/reservation compatibility.',
    ],
  },
  {
    id: '005_generation_assets_jobs',
    fileName: '005_generation_assets_jobs.draft.sql',
    path: 'database/migration-drafts/005_generation_assets_jobs.draft.sql',
    purpose: 'Draft generation requests, generated assets, editing jobs, job steps, and worker events.',
    tablesCovered: ['generation_requests', 'generation_events', 'generated_assets', 'generated_asset_versions', 'editing_jobs', 'job_steps', 'worker_events'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: [...baseChecklist, 'Confirm generation requests and editing jobs require approved_plan_snapshot_id.'],
  },
  {
    id: '006_qa_exports_audit',
    fileName: '006_qa_exports_audit.draft.sql',
    path: 'database/migration-drafts/006_qa_exports_audit.draft.sql',
    purpose: 'Draft QA reports, QA check results, revision requests, final exports, audit events, and review snapshots.',
    tablesCovered: ['qa_reports', 'qa_check_results', 'revision_requests', 'final_exports', 'audit_events', 'production_readiness_snapshots', 'license_review_snapshots'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: [...baseChecklist, 'Confirm audit events remain append-only and production readiness remains not legal advice.'],
  },
  {
    id: '007_rls_policy_drafts',
    fileName: '007_rls_policy_drafts.draft.sql',
    path: 'database/migration-drafts/007_rls_policy_drafts.draft.sql',
    purpose: 'Draft RLS policy templates for workspace membership, service-role worker writes, immutable snapshots, and append-only audit events.',
    tablesCovered: ['rls_policy_templates', 'approved_plan_snapshots', 'audit_events', 'worker_tables'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: ['Test every policy in Supabase before production.', 'Confirm owner/admin/editor/viewer roles.', 'Confirm service-role worker writes and user read scopes.'],
  },
  {
    id: '008_storage_bucket_policy_drafts',
    fileName: '008_storage_bucket_policy_drafts.draft.sql',
    path: 'database/migration-drafts/008_storage_bucket_policy_drafts.draft.sql',
    purpose: 'Draft private storage bucket and policy templates for source media, generated assets, exports, QA artifacts, and worker temp files.',
    tablesCovered: ['source-media', 'generated-assets', 'processed-media', 'previews', 'exports', 'thumbnails', 'qa-artifacts', 'worker-temp'],
    status: 'needs_review',
    mustNotRun: true,
    reviewChecklist: ['Keep buckets private by default.', 'Review signed URL behavior.', 'Confirm worker-temp retention and source-media privacy.'],
  },
]

export function createMigrationDraftPlan(): MigrationDraftPlan {
  return {
    id: 'rp-data-02-migration-draft-plan',
    summary: 'Review-only SQL drafts map the Supabase schema bridge into draft table, RLS, and storage policy files outside the active Supabase migration path.',
    files: migrationDraftFiles,
    warnings: [
      'Draft SQL only.',
      'Do not run.',
      'Do not apply to Supabase.',
      'No real migrations created.',
      'No SQL has been run.',
      'RLS must be tested before production.',
      'Approved snapshot immutability must be reviewed.',
      'Credit ledger/reservation tables are not finalized in this draft.',
    ],
    nextSteps: [
      'RP-DATA-03 should review, harden, and test the drafts before any real migration is created.',
      'Copy reviewed SQL into the real Supabase migration path only after explicit approval.',
      'Validate RLS, storage privacy, approved snapshot immutability, and worker service-role behavior in a safe environment.',
    ],
  }
}

export function getMigrationDraftById(id: string) {
  return migrationDraftFiles.find((file) => file.id === id)
}

