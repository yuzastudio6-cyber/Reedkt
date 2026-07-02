import type {
  SupabaseColumnPlan,
  SupabaseColumnType,
  SupabaseIndexPlan,
  SupabaseRlsPolicyPlan,
  SupabaseSchemaGroup,
  SupabaseSchemaPlan,
  SupabaseStorageBucketPlan,
  SupabaseTablePlan,
  SupabaseTableReadinessStatus,
} from '../types/supabase-schema-plan'

type TableSeed = {
  name: string
  group: SupabaseSchemaGroup
  purpose: string
  columns: Array<string | SupabaseColumnPlan>
  jsonbFields?: string[]
  statusValues?: string[]
  relationships?: string[]
  indexes?: SupabaseIndexPlan[]
  rlsPolicies?: SupabaseRlsPolicyPlan[]
  readinessStatus?: SupabaseTableReadinessStatus
  migrationNotes?: string[]
}

const defaultMigrationNotes = [
  'Planning bridge only; do not create this table until a reviewed migration milestone.',
  'Keep full approved plan detail in JSONB first, then normalize deeper once worker access patterns stabilize.',
]

const statusValues = {
  approval: ['pending', 'approved', 'revoked', 'superseded'],
  asset: ['uploaded', 'processing', 'ready', 'failed', 'archived'],
  estimate: ['draft', 'presented', 'approved', 'superseded', 'expired'],
  export: ['planned', 'queued', 'rendering', 'ready', 'failed', 'cancelled'],
  job: ['planned', 'queued', 'running', 'blocked', 'completed', 'failed', 'cancelled'],
  plan: ['draft', 'presented', 'approved', 'superseded', 'archived'],
  project: ['draft', 'planning', 'approved', 'processing', 'review', 'exported', 'archived'],
  request: ['planned', 'queued', 'blocked', 'generating', 'completed', 'failed', 'cancelled'],
  session: ['active', 'awaiting_user', 'approved', 'archived'],
}

function column(name: string, type: SupabaseColumnType, options: Partial<SupabaseColumnPlan> = {}): SupabaseColumnPlan {
  return {
    name,
    type,
    nullable: options.nullable ?? false,
    ...options,
  }
}

function standardColumn(name: string): SupabaseColumnPlan {
  if (name === 'id') return column('id', 'uuid', { defaultValue: 'gen_random_uuid()', unique: true })
  if (name.endsWith('_id')) return column(name, 'foreign_key', { indexed: true })
  if (name.endsWith('_json')) return column(name, 'jsonb', { nullable: true })
  if (name.endsWith('_at') || name === 'created_at' || name === 'updated_at') return column(name, 'timestamp', { defaultValue: name === 'created_at' ? 'now()' : undefined })
  if (name.startsWith('is_') || name === 'immutable' || name === 'source_order_confirmed') return column(name, 'boolean')
  if (name.endsWith('_seconds') || name.endsWith('_credits')) return column(name, 'numeric', { nullable: true })
  if (name.endsWith('_bytes') || name === 'width' || name === 'height' || name === 'version' || name === 'uploaded_order' || name === 'source_order' || name === 'confirmed_order' || name === 'step_order' || name === 'estimate_version') return column(name, 'integer', { nullable: name !== 'version' && name !== 'step_order' })
  if (name === 'status' || name === 'role' || name === 'asset_type' || name === 'approval_type' || name === 'job_type' || name === 'step_type' || name === 'worker_group' || name === 'provider_model' || name === 'export_format' || name === 'editing_category' || name === 'edit_level' || name === 'target_platform' || name === 'aspect_ratio' || name === 'frame_template_type' || name === 'plan_type' || name === 'source_role' || name === 'risk_level' || name === 'category') return column(name, 'enum')
  return column(name, 'text', { nullable: name !== 'title' && name !== 'name' && name !== 'content' })
}

function columns(names: Array<string | SupabaseColumnPlan>) {
  return names.map((item) => typeof item === 'string' ? standardColumn(item) : item)
}

function index(name: string, columnsForIndex: string[], reason: string, unique = false): SupabaseIndexPlan {
  return { name, columns: columnsForIndex, reason, unique }
}

function rls(
  name: string,
  operation: SupabaseRlsPolicyPlan['operation'],
  actor: SupabaseRlsPolicyPlan['actor'],
  ruleSummary: string,
  notes: string[] = [],
): SupabaseRlsPolicyPlan {
  return { name, operation, actor, ruleSummary, notes }
}

function inferredRelationship(columnName: string) {
  const relationships: Record<string, string> = {
    actor_user_id: 'actor_user_id references auth.users.id',
    approved_by: 'approved_by references auth.users.id',
    approved_plan_snapshot_id: 'approved_plan_snapshot_id references approved_plan_snapshots.id',
    approved_snapshot_id: 'approved_snapshot_id references approved_plan_snapshots.id',
    credit_estimate_id: 'credit_estimate_id references credit_estimates.id',
    current_edit_session_id: 'current_edit_session_id references edit_sessions.id',
    current_intent_snapshot_id: 'current_intent_snapshot_id references edit_intent_snapshots.id',
    current_plan_version_id: 'current_plan_version_id references edit_plan_versions.id',
    edit_plan_version_id: 'edit_plan_version_id references edit_plan_versions.id',
    edit_session_id: 'edit_session_id references edit_sessions.id',
    editing_job_id: 'editing_job_id references editing_jobs.id',
    generation_request_id: 'generation_request_id references generation_requests.id',
    intent_snapshot_id: 'intent_snapshot_id references edit_intent_snapshots.id',
    media_asset_id: 'media_asset_id references media_assets.id',
    owner_id: 'owner_id references auth.users.id',
    project_id: 'project_id references projects.id',
    superseded_by_plan_version_id: 'superseded_by_plan_version_id references edit_plan_versions.id',
    uploaded_clip_id: 'uploaded_clip_id references uploaded_clips.id',
    user_id: 'user_id references auth.users.id',
    workspace_id: 'workspace_id references workspaces.id',
  }

  return relationships[columnName]
}

function workspacePolicies(tableName: string): SupabaseRlsPolicyPlan[] {
  return [
    rls(`${tableName}_workspace_member_select`, 'select', 'workspace_member', 'Members can read rows for projects/workspaces they belong to.'),
    rls(`${tableName}_owner_insert`, 'insert', 'owner', 'Owners can create rows inside their workspace/project scope.'),
    rls(`${tableName}_service_role_write`, 'update', 'service_role', 'Service role may update rows for approved backend workflows only.'),
  ]
}

function table(seed: TableSeed): SupabaseTablePlan {
  const tableColumns = columns(seed.columns)
  const jsonbFields = seed.jsonbFields ?? tableColumns.filter((item) => item.type === 'jsonb').map((item) => item.name)
  const baseIndexes = [
    ...tableColumns
      .filter((item) => item.indexed || item.name === 'project_id' || item.name === 'workspace_id' || item.name === 'edit_session_id')
      .map((item) => index(`idx_${seed.name}_${item.name}`, [item.name], `Query ${seed.name} by ${item.name}.`)),
  ]

  return {
    name: seed.name,
    group: seed.group,
    purpose: seed.purpose,
    readinessStatus: seed.readinessStatus ?? 'needs_review',
    columns: tableColumns,
    indexes: seed.indexes ?? baseIndexes,
    rlsPolicies: seed.rlsPolicies ?? workspacePolicies(seed.name),
    statusValues: seed.statusValues,
    jsonbFields,
    relationships: seed.relationships ?? tableColumns
      .map((item) => item.references ? `${item.name} references ${item.references}` : inferredRelationship(item.name))
      .filter(Boolean) as string[],
    migrationNotes: seed.migrationNotes ?? defaultMigrationNotes,
  }
}

export const supabaseMvpTablePlans: SupabaseTablePlan[] = [
  table({
    name: 'profiles',
    group: 'identity_workspace',
    purpose: 'Stores user-facing profile metadata separate from auth.',
    readinessStatus: 'planned',
    columns: ['id', 'user_id', 'display_name', 'avatar_url', 'created_at', 'updated_at'],
    indexes: [index('idx_profiles_user_id', ['user_id'], 'Resolve profile by auth user.', true)],
    rlsPolicies: [
      rls('profiles_self_select', 'select', 'owner', 'Users can read their own profile.'),
      rls('profiles_self_update', 'update', 'owner', 'Users can update safe profile fields only.'),
    ],
  }),
  table({
    name: 'workspaces',
    group: 'identity_workspace',
    purpose: 'Groups projects and members under an owner and plan type.',
    readinessStatus: 'planned',
    columns: ['id', 'owner_id', 'name', 'plan_type', 'created_at', 'updated_at'],
    indexes: [index('idx_workspaces_owner_id', ['owner_id'], 'List workspaces owned by a user.')],
    statusValues: ['personal', 'business'],
  }),
  table({
    name: 'workspace_members',
    group: 'identity_workspace',
    purpose: 'Maps users to workspace access roles.',
    readinessStatus: 'planned',
    columns: ['id', 'workspace_id', 'user_id', 'role', 'created_at'],
    indexes: [
      index('idx_workspace_members_workspace', ['workspace_id'], 'List workspace members.'),
      index('idx_workspace_members_user_workspace', ['user_id', 'workspace_id'], 'Authorize workspace access.', true),
    ],
    statusValues: ['owner', 'admin', 'editor', 'viewer'],
  }),
  table({
    name: 'projects',
    group: 'project_session_chat',
    purpose: 'Top-level edit project owned by a workspace.',
    columns: ['id', 'workspace_id', 'owner_id', 'title', 'editing_category', 'status', 'current_edit_session_id', 'created_at', 'updated_at'],
    statusValues: statusValues.project,
  }),
  table({
    name: 'edit_sessions',
    group: 'project_session_chat',
    purpose: 'Tracks a chat-native planning session for a project.',
    columns: ['id', 'project_id', 'status', 'current_plan_version_id', 'current_intent_snapshot_id', 'source_order_confirmed', 'created_at', 'updated_at'],
    statusValues: statusValues.session,
  }),
  table({
    name: 'chat_messages',
    group: 'project_session_chat',
    purpose: 'Stores user and AI chat messages that shaped planning.',
    columns: ['id', 'edit_session_id', 'role', 'content', 'attachments_json', 'related_clip_ids_json', 'created_at'],
    jsonbFields: ['attachments_json', 'related_clip_ids_json'],
    indexes: [index('idx_chat_messages_session_created', ['edit_session_id', 'created_at'], 'Replay chat in order.')],
    statusValues: ['user', 'assistant', 'system'],
  }),
  table({
    name: 'media_assets',
    group: 'media_source',
    purpose: 'Tracks uploaded, generated, processed, preview, and export media references.',
    columns: ['id', 'project_id', 'asset_type', 'storage_bucket', 'storage_path', 'file_name', 'mime_type', 'duration_seconds', 'width', 'height', 'size_bytes', 'status', 'metadata_json', 'created_at'],
    jsonbFields: ['metadata_json'],
    statusValues: statusValues.asset,
  }),
  table({
    name: 'uploaded_clips',
    group: 'media_source',
    purpose: 'Maps source clips to media assets and source-order metadata.',
    columns: ['id', 'project_id', 'media_asset_id', 'uploaded_order', 'source_role', 'user_notes', 'is_important', 'is_optional', 'status', 'created_at'],
    statusValues: ['active', 'optional', 'excluded', 'archived'],
  }),
  table({
    name: 'source_sequence_items',
    group: 'media_source',
    purpose: 'Stores confirmed source/story order separate from final edit order.',
    columns: ['id', 'project_id', 'edit_session_id', 'uploaded_clip_id', 'source_order', 'confirmed_order', 'user_confirmed', 'notes', 'created_at', 'updated_at'],
    indexes: [index('idx_source_sequence_session_order', ['edit_session_id', 'source_order'], 'Load source order for planning.')],
  }),
  table({
    name: 'edit_intent_snapshots',
    group: 'intent_settings',
    purpose: 'Versions compiled intent and professional settings derived from chat.',
    columns: ['id', 'project_id', 'edit_session_id', 'version', 'status', 'editing_category', 'edit_level', 'target_platform', 'aspect_ratio', 'frame_template_type', 'goal_summary', 'compiled_intent_json', 'professional_editing_directive_json', 'created_from_message_ids_json', 'created_at'],
    jsonbFields: ['compiled_intent_json', 'professional_editing_directive_json', 'created_from_message_ids_json'],
    statusValues: ['draft', 'presented', 'approved', 'superseded'],
  }),
  table({
    name: 'edit_plan_versions',
    group: 'plan_version',
    purpose: 'Versions full edit plans and stores the complete mock plan as JSONB.',
    columns: ['id', 'project_id', 'edit_session_id', 'intent_snapshot_id', 'version', 'status', 'goal_summary', 'plan_summary_json', 'full_plan_json', 'credit_estimate_id', 'approval_required', 'approved_at', 'approved_by', 'superseded_by_plan_version_id', 'created_at', 'updated_at'],
    jsonbFields: ['plan_summary_json', 'full_plan_json'],
    statusValues: statusValues.plan,
  }),
  table({
    name: 'credit_estimates',
    group: 'credit_approval',
    purpose: 'Stores user-facing credit estimates before approval.',
    columns: ['id', 'project_id', 'edit_plan_version_id', 'estimate_version', 'edit_level', 'editing_category', 'total_credits', 'fallback_allowance_credits', 'risk_level', 'estimate_json', 'status', 'created_at'],
    jsonbFields: ['estimate_json'],
    statusValues: statusValues.estimate,
  }),
  table({
    name: 'credit_estimate_items',
    group: 'credit_approval',
    purpose: 'Stores itemized credit estimate lines for auditability.',
    columns: ['id', 'credit_estimate_id', 'label', 'credits', 'reason', 'category', 'metadata_json'],
    jsonbFields: ['metadata_json'],
  }),
  table({
    name: 'approval_records',
    group: 'credit_approval',
    purpose: 'Records user approval of exact plan and credit estimate versions.',
    columns: ['id', 'project_id', 'edit_session_id', 'edit_plan_version_id', 'credit_estimate_id', 'approval_type', 'approved_by', 'approved_at', 'approved_snapshot_id', 'approved_snapshot_summary_json', 'audit_metadata_json'],
    jsonbFields: ['approved_snapshot_summary_json', 'audit_metadata_json'],
    statusValues: statusValues.approval,
  }),
  table({
    name: 'approved_plan_snapshots',
    group: 'credit_approval',
    purpose: 'Immutable execution contract loaded by future workers instead of raw chat.',
    columns: ['id', 'project_id', 'edit_session_id', 'edit_plan_version_id', 'credit_estimate_id', 'approved_by', 'approved_at', 'snapshot_version', 'snapshot_json', column('immutable', 'boolean', { defaultValue: 'true' }), 'status', 'created_at'],
    jsonbFields: ['snapshot_json'],
    statusValues: ['active', 'superseded', 'revoked'],
    migrationNotes: [
      'Make approved snapshots immutable at the application and RLS layers.',
      'Workers must load snapshot_json and never reconstruct execution from raw chat.',
      'Do not overwrite old approved versions; revisions create new plan versions and snapshots.',
    ],
  }),
  table({
    name: 'generation_requests',
    group: 'generation_assets',
    purpose: 'Plans future provider/model/asset generation after approval and credit reservation.',
    columns: ['id', 'project_id', 'edit_plan_version_id', 'approved_plan_snapshot_id', 'visual_asset_plan_item_id', 'provider_model', 'provider_route_json', 'prompt_plan_json', 'status', 'credit_reservation_id', 'created_at', 'updated_at'],
    jsonbFields: ['provider_route_json', 'prompt_plan_json'],
    statusValues: statusValues.request,
  }),
  table({
    name: 'generated_assets',
    group: 'generation_assets',
    purpose: 'Stores generated asset records and storage references.',
    columns: ['id', 'project_id', 'generation_request_id', 'asset_type', 'storage_bucket', 'storage_path', 'width', 'height', 'duration_seconds', 'background_color', 'metadata_json', 'status', 'created_at'],
    jsonbFields: ['metadata_json'],
    statusValues: statusValues.asset,
  }),
  table({
    name: 'editing_jobs',
    group: 'jobs_workers',
    purpose: 'Tracks future backend worker jobs anchored to approved snapshots.',
    columns: ['id', 'project_id', 'edit_plan_version_id', 'approved_plan_snapshot_id', 'job_type', 'status', 'worker_runtime_plan_json', 'created_at', 'started_at', 'completed_at'],
    jsonbFields: ['worker_runtime_plan_json'],
    statusValues: statusValues.job,
  }),
  table({
    name: 'job_steps',
    group: 'jobs_workers',
    purpose: 'Stores worker step input/output/error envelopes for future jobs.',
    columns: ['id', 'editing_job_id', 'step_order', 'step_type', 'worker_group', 'status', 'input_json', 'output_json', 'error_json', 'started_at', 'completed_at'],
    jsonbFields: ['input_json', 'output_json', 'error_json'],
    indexes: [index('idx_job_steps_job_order', ['editing_job_id', 'step_order'], 'Replay job steps in execution order.')],
    statusValues: ['planned', 'queued', 'running', 'completed', 'failed', 'skipped'],
  }),
  table({
    name: 'qa_reports',
    group: 'qa_revision_export',
    purpose: 'Stores QA summaries and structured check output for plans/jobs/assets.',
    columns: ['id', 'project_id', 'edit_plan_version_id', 'editing_job_id', 'approved_plan_snapshot_id', 'status', 'summary', 'report_json', 'created_at'],
    jsonbFields: ['report_json'],
    statusValues: ['planned', 'passed', 'warning', 'failed', 'blocked'],
  }),
  table({
    name: 'final_exports',
    group: 'qa_revision_export',
    purpose: 'Tracks future export records and storage references.',
    columns: ['id', 'project_id', 'edit_plan_version_id', 'approved_plan_snapshot_id', 'renderer_composition_plan_id', 'export_format', 'aspect_ratio', 'storage_bucket', 'storage_path', 'status', 'created_at'],
    statusValues: statusValues.export,
  }),
  table({
    name: 'audit_events',
    group: 'audit_compliance',
    purpose: 'Append-only audit event stream for approvals, jobs, credits, and policy events.',
    columns: ['id', 'workspace_id', 'project_id', 'actor_user_id', 'event_type', 'event_json', 'created_at'],
    jsonbFields: ['event_json'],
    rlsPolicies: [
      rls('audit_events_member_select', 'select', 'workspace_member', 'Members can read audit events for their workspace/project.'),
      rls('audit_events_service_insert', 'insert', 'service_role', 'Only service-role backend code can append audit events.', ['Append-only; no user updates or deletes.']),
    ],
    migrationNotes: ['Audit events should be append-only.', 'Do not allow user-side mutation of audit event rows.'],
  }),
]

export const supabaseStorageBucketPlans: SupabaseStorageBucketPlan[] = [
  {
    name: 'source-media',
    purpose: 'Original uploaded source video/audio/images.',
    isPublic: false,
    userReadable: true,
    workerWritable: true,
    signedUrlRecommended: true,
    retentionNotes: ['Private by default.', 'Retention should follow workspace/project privacy policy.'],
    rlsNotes: ['Access scoped to project membership.', 'No public source media bucket.'],
  },
  {
    name: 'generated-assets',
    purpose: 'Generated images, clips, music, cards, and intermediate creative assets.',
    isPublic: false,
    userReadable: true,
    workerWritable: true,
    signedUrlRecommended: true,
    retentionNotes: ['Keep project-scoped generated assets until user deletion or retention policy.'],
    rlsNotes: ['Workers write with service role; users read through signed URLs.'],
  },
  {
    name: 'processed-media',
    purpose: 'Worker-prepared media such as normalized audio, processed clips, and prepared image assets.',
    isPublic: false,
    userReadable: true,
    workerWritable: true,
    signedUrlRecommended: true,
    retentionNotes: ['Can be regenerated in some cases; retention policy needs product review.'],
    rlsNotes: ['Private project-scoped access only.'],
  },
  {
    name: 'previews',
    purpose: 'Preview renders and reviewable mock/future outputs.',
    isPublic: false,
    userReadable: true,
    workerWritable: true,
    signedUrlRecommended: true,
    retentionNotes: ['Shorter retention can be considered after export is ready.'],
    rlsNotes: ['Signed URLs recommended even for previews.'],
  },
  {
    name: 'exports',
    purpose: 'Final exported videos and downloadable deliverables.',
    isPublic: false,
    userReadable: true,
    workerWritable: true,
    signedUrlRecommended: true,
    retentionNotes: ['User-facing retention and deletion policy required before production.'],
    rlsNotes: ['Private by default; public sharing is a future explicit feature.'],
  },
  {
    name: 'thumbnails',
    purpose: 'Project, clip, preview, and export thumbnails.',
    isPublic: false,
    userReadable: true,
    workerWritable: true,
    signedUrlRecommended: true,
    retentionNotes: ['Can be regenerated but may contain private frames.'],
    rlsNotes: ['Keep private because thumbnails may reveal source media.'],
  },
  {
    name: 'qa-artifacts',
    purpose: 'QA frames, reports, screenshots, waveform summaries, and diagnostic artifacts.',
    isPublic: false,
    userReadable: false,
    workerWritable: true,
    signedUrlRecommended: true,
    retentionNotes: ['Retention should be conservative and privacy-reviewed.'],
    rlsNotes: ['Service role writes; user visibility should be mediated through QA report summaries.'],
  },
  {
    name: 'worker-temp',
    purpose: 'Temporary worker scratch artifacts.',
    isPublic: false,
    userReadable: false,
    workerWritable: true,
    signedUrlRecommended: false,
    retentionNotes: ['Short TTL required before production.', 'Never use for durable outputs.'],
    rlsNotes: ['Service-role worker access only.'],
  },
]

export function getTablePlan(tableName: string) {
  return supabaseMvpTablePlans.find((tablePlan) => tablePlan.name === tableName)
}

export function getTablesByGroup(group: SupabaseSchemaGroup) {
  return supabaseMvpTablePlans.filter((tablePlan) => tablePlan.group === group)
}

export function getSchemaPlanSummary() {
  const tableCount = supabaseMvpTablePlans.length
  const bucketCount = supabaseStorageBucketPlans.length
  const jsonbTableCount = supabaseMvpTablePlans.filter((tablePlan) => tablePlan.jsonbFields.length > 0).length

  return `${tableCount} MVP tables, ${bucketCount} private storage buckets, and ${jsonbTableCount} tables with JSONB snapshot fields are planned for future Supabase migrations.`
}

export function createSupabaseSchemaPlan(): SupabaseSchemaPlan {
  return {
    id: 'supabase-schema-planning-bridge-v1',
    summary: getSchemaPlanSummary(),
    tables: supabaseMvpTablePlans,
    storageBuckets: supabaseStorageBucketPlans,
    migrationReadinessStatus: 'needs_review',
    requiredReviews: [
      'Supabase project/environment strategy for reeditpro.',
      'RLS policy review for workspace/project membership.',
      'Approved snapshot JSONB shape review.',
      'Credit ledger and reservation architecture review.',
      'Worker job architecture and service-role boundary review.',
      'Storage privacy, signed URL, retention, and deletion policy review.',
    ],
    nonGoals: [
      'No real Supabase migrations are created.',
      'No Supabase client or remote connection is added.',
      'No database tables, storage buckets, jobs, or backend routes are created.',
      'No SQL is run.',
      'No credit ledger, billing, provider call, render, export, or worker execution is implemented.',
    ],
    nextMigrationMilestones: [
      '001_core_workspace_projects.sql',
      '002_media_and_source_sequence.sql',
      '003_intent_and_plan_versions.sql',
      '004_credits_approval_snapshots.sql',
      '005_generation_assets_jobs.sql',
      '006_qa_exports_audit.sql',
    ],
  }
}
