import type {
  DataSensitivityLevel,
  RlsAccessDecision,
  RlsHardeningCheck,
  RlsHardeningPlan,
  RlsReviewStatus,
  RlsTableAccessPlan,
} from '../types/supabase-rls-hardening'

type AccessPlanInput = Omit<RlsTableAccessPlan, 'reviewStatus'>

const defaultAccess = {
  appendOnly: false,
  immutableAfterApproval: false,
  sensitivity: 'private' as DataSensitivityLevel,
  serviceInsert: 'service_only' as RlsAccessDecision,
  serviceUpdate: 'service_only' as RlsAccessDecision,
  userDelete: 'deny' as RlsAccessDecision,
  userInsert: 'service_only' as RlsAccessDecision,
  userSelect: 'workspace_member' as RlsAccessDecision,
  userUpdate: 'deny' as RlsAccessDecision,
}

function accessPlan(input: Partial<AccessPlanInput> & Pick<RlsTableAccessPlan, 'tableName' | 'notes'>): RlsTableAccessPlan {
  return {
    ...defaultAccess,
    ...input,
    reviewStatus: 'hardened_draft',
  }
}

export const rlsTableAccessPlans: RlsTableAccessPlan[] = [
  accessPlan({
    tableName: 'profiles',
    sensitivity: 'internal',
    userInsert: 'future_review',
    userUpdate: 'owner_only',
    notes: ['Profile access should be tied to authenticated user identity and workspace membership where applicable.'],
  }),
  accessPlan({
    tableName: 'workspaces',
    sensitivity: 'internal',
    userInsert: 'owner_only',
    userUpdate: 'owner_only',
    userDelete: 'owner_only',
    notes: ['Workspace owner/admin policy is required before real migration.'],
  }),
  accessPlan({
    tableName: 'workspace_members',
    sensitivity: 'internal',
    userInsert: 'owner_only',
    userUpdate: 'owner_only',
    userDelete: 'owner_only',
    notes: ['Membership role changes require owner/admin review and audit.'],
  }),
  accessPlan({
    tableName: 'projects',
    userInsert: 'workspace_member',
    userUpdate: 'workspace_member',
    userDelete: 'owner_only',
    notes: ['Project access is scoped through workspace membership; editor/admin role split remains future review.'],
  }),
  accessPlan({
    tableName: 'edit_sessions',
    userInsert: 'workspace_member',
    userUpdate: 'workspace_member',
    notes: ['Edit sessions are project-scoped chat-native planning containers.'],
  }),
  accessPlan({
    tableName: 'chat_messages',
    sensitivity: 'sensitive',
    userInsert: 'workspace_member',
    notes: ['Workspace members may add chat context, but workers execute approved snapshots rather than raw chat.'],
  }),
  accessPlan({
    tableName: 'user_confirmations',
    userInsert: 'workspace_member',
    notes: ['Confirmation history should stay append-style and auditable.'],
  }),
  accessPlan({
    tableName: 'media_assets',
    sensitivity: 'sensitive',
    userInsert: 'future_review',
    userUpdate: 'service_only',
    userDelete: 'future_review',
    notes: ['Source media and browser capture artifacts are private; direct table insert should be app/backend controlled.'],
  }),
  accessPlan({
    tableName: 'uploaded_clips',
    sensitivity: 'sensitive',
    userInsert: 'future_review',
    userUpdate: 'workspace_member',
    userDelete: 'future_review',
    notes: ['Upload flow may create rows later, but direct table writes need backend validation.'],
  }),
  accessPlan({
    tableName: 'source_sequence_items',
    sensitivity: 'sensitive',
    userInsert: 'workspace_member',
    userUpdate: 'workspace_member',
    notes: ['Source sequence confirmation is user-editable before approval and preserved for audit.'],
  }),
  accessPlan({
    tableName: 'clip_analysis_snapshots',
    sensitivity: 'sensitive',
    notes: ['Future analysis workers write these snapshots; users should not mutate analysis records.'],
  }),
  accessPlan({ tableName: 'edit_intent_snapshots', notes: ['Intent snapshots are versioned and service-created from chat context.'] }),
  accessPlan({ tableName: 'edit_settings_snapshots', notes: ['Settings snapshots preserve user-confirmed setup state.'] }),
  accessPlan({
    tableName: 'edit_plan_versions',
    userUpdate: 'service_only',
    notes: ['Approved plan versions must not be overwritten; revisions create new versions.'],
  }),
  accessPlan({ tableName: 'plan_component_snapshots', notes: ['Component snapshots are generated from plan versions and should not be user-mutated.'] }),
  accessPlan({ tableName: 'edit_plan_segments', notes: ['Segment plans are generated from approved planning state.'] }),
  accessPlan({ tableName: 'edit_operations', notes: ['Worker-ready operations are service-generated and should be immutable after approval.'] }),
  accessPlan({
    tableName: 'credit_estimates',
    sensitivity: 'private',
    userUpdate: 'service_only',
    notes: ['Credit estimates are user-visible but backend/service controlled. Future ledger records are service-only and append-only.'],
  }),
  accessPlan({
    tableName: 'credit_estimate_items',
    sensitivity: 'private',
    userUpdate: 'service_only',
    notes: ['Estimate line items explain approval cost; users should not directly mutate them.'],
  }),
  accessPlan({
    tableName: 'approval_records',
    appendOnly: true,
    immutableAfterApproval: true,
    notes: ['Approval records point to exact plan, credit estimate, and approved snapshot versions.'],
  }),
  accessPlan({
    tableName: 'approved_plan_snapshots',
    appendOnly: true,
    immutableAfterApproval: true,
    serviceUpdate: 'deny',
    userInsert: 'deny',
    notes: ['Approved snapshots are the worker execution contract; normal users cannot insert, update, or delete them.'],
  }),
  accessPlan({
    tableName: 'generation_requests',
    userInsert: 'deny',
    notes: ['Generation requests require approved_plan_snapshot_id and backend/service creation.'],
  }),
  accessPlan({
    tableName: 'generation_events',
    appendOnly: true,
    userInsert: 'deny',
    notes: ['Generation events are service-written audit lifecycle records.'],
  }),
  accessPlan({
    tableName: 'generated_assets',
    sensitivity: 'sensitive',
    userInsert: 'deny',
    userDelete: 'future_review',
    notes: ['Generated assets are private/project-scoped and worker-created.'],
  }),
  accessPlan({
    tableName: 'generated_asset_versions',
    sensitivity: 'sensitive',
    userInsert: 'deny',
    userDelete: 'future_review',
    notes: ['Generated asset versions are worker-created and private/project-scoped.'],
  }),
  accessPlan({
    tableName: 'editing_jobs',
    userInsert: 'deny',
    notes: ['Editing jobs are service-created and tied to approved snapshots.'],
  }),
  accessPlan({
    tableName: 'job_steps',
    userInsert: 'deny',
    userUpdate: 'deny',
    notes: ['Normal users cannot insert/update job steps; worker inputs and outputs are service-controlled.'],
  }),
  accessPlan({
    tableName: 'worker_events',
    appendOnly: true,
    userInsert: 'deny',
    notes: ['Worker events are append-only service-written lifecycle and audit records.'],
  }),
  accessPlan({
    tableName: 'qa_reports',
    sensitivity: 'sensitive',
    userInsert: 'deny',
    notes: ['QA reports are service-created and may include sensitive source or artifact details.'],
  }),
  accessPlan({
    tableName: 'qa_check_results',
    sensitivity: 'sensitive',
    userInsert: 'deny',
    notes: ['QA check rows are service-created and private/project-scoped.'],
  }),
  accessPlan({
    tableName: 'revision_requests',
    sensitivity: 'private',
    userInsert: 'workspace_member',
    notes: ['Users can request revisions, but revisions create new plan versions.'],
  }),
  accessPlan({
    tableName: 'final_exports',
    sensitivity: 'sensitive',
    userInsert: 'deny',
    userDelete: 'future_review',
    notes: ['Exports are service-created, private by default, and tied to approved snapshots.'],
  }),
  accessPlan({
    tableName: 'audit_events',
    appendOnly: true,
    serviceUpdate: 'deny',
    userInsert: 'deny',
    userUpdate: 'deny',
    userDelete: 'deny',
    notes: ['Audit events are append-only; users cannot update or delete historical audit records.'],
  }),
  accessPlan({
    tableName: 'production_readiness_snapshots',
    sensitivity: 'private',
    notes: ['Production readiness snapshots are planning guidance and not legal advice.'],
  }),
  accessPlan({
    tableName: 'license_review_snapshots',
    sensitivity: 'private',
    userUpdate: 'service_only',
    notes: ['License review snapshots store review metadata only and do not make legal conclusions.'],
  }),
]

function tablePlan(tableName: string) {
  return rlsTableAccessPlans.find((plan) => plan.tableName === tableName)
}

function check(params: RlsHardeningCheck): RlsHardeningCheck {
  return params
}

function createChecks(): RlsHardeningCheck[] {
  const approvedSnapshots = tablePlan('approved_plan_snapshots')
  const auditEvents = tablePlan('audit_events')
  const jobSteps = tablePlan('job_steps')
  const workerTables = ['generation_requests', 'generation_events', 'generated_assets', 'generated_asset_versions', 'editing_jobs', 'job_steps', 'worker_events', 'qa_reports', 'final_exports']
  const workerWritesServiceOnly = workerTables.every((tableName) => {
    const plan = tablePlan(tableName)
    return plan?.userInsert === 'deny' && plan.serviceInsert === 'service_only' && (plan.serviceUpdate === 'service_only' || plan.serviceUpdate === 'deny')
  })

  return [
    check({
      id: 'rls-approved-snapshots-immutable',
      tableName: 'approved_plan_snapshots',
      label: 'Approved snapshots immutable',
      passed: Boolean(approvedSnapshots?.immutableAfterApproval && approvedSnapshots.userUpdate === 'deny' && approvedSnapshots.userDelete === 'deny'),
      severity: 'blocking',
      message: 'approved_plan_snapshots must be immutable and user update/delete denied.',
      recommendation: 'Keep user update/delete denied and add reviewed trigger/RLS protection before real migration.',
    }),
    check({
      id: 'rls-audit-append-only',
      tableName: 'audit_events',
      label: 'Audit events append-only',
      passed: Boolean(auditEvents?.appendOnly && auditEvents.userUpdate === 'deny' && auditEvents.userDelete === 'deny'),
      severity: 'blocking',
      message: 'audit_events should be append-only and not user-mutable.',
      recommendation: 'Do not create user update/delete policies for audit_events.',
    }),
    check({
      id: 'rls-worker-tables-service-only',
      label: 'Worker tables service-only writes',
      passed: workerWritesServiceOnly,
      severity: 'blocking',
      message: 'Worker/generation/job/QA/export tables should use backend/service-role writes.',
      recommendation: 'Keep direct user writes denied for worker-owned lifecycle rows.',
    }),
    check({
      id: 'rls-storage-private-default-noted',
      label: 'Storage private default noted',
      passed: true,
      severity: 'warning',
      message: 'Storage privacy is captured in RP-DATA-03 docs and storage draft templates, but not tested in Supabase.',
      recommendation: 'Test private bucket policies and signed URL behavior in a future Supabase milestone.',
    }),
    check({
      id: 'rls-source-media-private',
      tableName: 'media_assets',
      label: 'Source media private',
      passed: tablePlan('media_assets')?.sensitivity === 'sensitive',
      severity: 'blocking',
      message: 'Source media and browser capture artifacts must be treated as sensitive/private.',
      recommendation: 'Keep source-media private and require app/backend-mediated access.',
    }),
    check({
      id: 'rls-job-steps-no-user-mutation',
      tableName: 'job_steps',
      label: 'Job steps deny user writes',
      passed: Boolean(jobSteps?.userInsert === 'deny' && jobSteps.userUpdate === 'deny'),
      severity: 'blocking',
      message: 'Normal users must not directly insert or update job_steps.',
      recommendation: 'Use backend/service-role worker writes for job_steps.',
    }),
    check({
      id: 'rls-no-user-snapshot-mutation',
      tableName: 'approved_plan_snapshots',
      label: 'No user snapshot mutation',
      passed: Boolean(approvedSnapshots?.userInsert === 'deny' && approvedSnapshots.userUpdate === 'deny' && approvedSnapshots.userDelete === 'deny'),
      severity: 'blocking',
      message: 'Normal users must not mutate approved snapshots.',
      recommendation: 'Keep approved snapshot insert/update/delete restricted to backend policy and immutable trigger review.',
    }),
    check({
      id: 'rls-needs-real-testing',
      label: 'RLS still needs real testing',
      passed: true,
      severity: 'warning',
      message: 'This is a hardened draft, not tested Supabase RLS.',
      recommendation: 'Do not mark ready_for_testing until a future local/staging Supabase validation milestone.',
    }),
  ]
}

function overallStatus(checks: RlsHardeningCheck[]): RlsReviewStatus {
  if (checks.some((item) => !item.passed && item.severity === 'blocking')) {
    return 'blocked'
  }

  return 'hardened_draft'
}

export function createRlsHardeningPlan(): RlsHardeningPlan {
  const checks = createChecks()
  const status = overallStatus(checks)

  return {
    id: 'rp-data-03-rls-hardening-plan',
    summary: 'Draft RLS hardening maps each planned table to workspace/project access, service-role worker write boundaries, immutable snapshots, append-only audit behavior, and private sensitive artifacts.',
    tableAccessPlans: rlsTableAccessPlans,
    checks,
    overallStatus: status,
    blockingIssues: checks.filter((item) => !item.passed && item.severity === 'blocking').map((item) => item.message),
    needsReviewItems: [
      'RLS helpers and policies must be tested in Supabase before production.',
      'Owner/admin/editor/viewer role behavior needs product review.',
      'Storage object policies and signed URL behavior need future testing.',
      'Future credit ledger/reservation tables must be service-controlled and append-only.',
    ],
    notes: [
      'Workers execute approved snapshots, not raw chat.',
      'Service-role writes must be backend-only and audited in future.',
      'Source media, generated assets, browser captures, QA artifacts, and exports remain private by default.',
      'This plan intentionally remains hardened_draft, not ready_for_testing.',
    ],
  }
}

export function getRlsTableAccessPlan(tableName: string) {
  return tablePlan(tableName)
}

