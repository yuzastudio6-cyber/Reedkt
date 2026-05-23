import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { resolveBucketName } from '../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../storage/storage-paths'
import {
  createSmokeMetadata,
  createSmokeRunId,
  getLiveWriteGuardStatus,
  rejectNonSmokeCleanup,
} from '../supabase/live-write-guard'
import { checkSupabaseTableReadiness, getRequiredSupabaseRuntimeTables, type TableReadinessResult } from '../supabase/table-readiness'
import type { ServiceContext } from '../types'
import { checkBasicRenderSmokeTools } from './render-smoke-service'
import {
  findExactSupabaseSmokeRecordLeftovers,
  type SupabaseSmokeLeftoverRecord,
} from './supabase-smoke-leftover-service'
import {
  createRpcSmokeIdempotencyKey,
  runPersistedRenderPipelineViaRpcs,
  type PersistedRenderExternalArtifactFactory,
} from './e2e-service-role-runtime-service'
import type { PersistedRenderExecutionMode } from '../../src/types'

type SmokeStatus = 'passed' | 'failed' | 'skipped'
type SmokeFailureCode =
  | 'disabled'
  | 'missing_env'
  | 'writes_disabled'
  | 'missing_tables'
  | 'missing_dependency'
  | 'constraint_blocked'
  | 'tool_unavailable'
  | 'storage_mode_blocked'
  | 'render_failed'
  | 'rpc_missing'
  | 'LOCAL_STORAGE_ONLY_PATH_USED_IN_GCS_CANARY'
  | 'GCS_STORAGE_REQUIRED'
  | 'GCS_SOURCE_OBJECT_MISSING'
  | 'GCS_PREVIEW_OBJECT_MISSING'
  | 'STORAGE_MODE_MISMATCH'

interface CleanupRecord {
  table: string
  id: string
  owned: boolean
  smokeRunId?: string
}

interface ColumnInfo {
  name: string
  dataType?: string
}

interface SchemaInfo {
  columnsByTable: Record<string, ColumnInfo[]>
  availableTables: string[]
  warnings: string[]
}

interface InsertRowOptions {
  missingDependencyOn23503?: string
  smokeRunId?: string
}

export interface PersistedRenderSourceFixtureFactoryResult {
  sizeBytes: number
  checksumSha256: string
  durationSeconds: number
  width: number
  height: number
  fps: number
}

export type PersistedRenderSourceFixtureFactory = (input: {
  smokeRunId: string
  workspaceId: string
  projectId: string
  bucketName: string
  objectPath: string
  fileName: string
}) => Promise<PersistedRenderSourceFixtureFactoryResult>

interface PersistedRenderSmokeOptions {
  renderExecutionMode?: PersistedRenderExecutionMode
  createExternalRenderArtifacts?: PersistedRenderExternalArtifactFactory
  sourceFixtureFactory?: PersistedRenderSourceFixtureFactory
  sourceObjectOwner?: 'upload_intent' | 'smoke_run'
  sourceFileName?: string
  precreateRenderIdForOutputPath?: boolean
}

interface SmokeRecordIds {
  smokeRunId?: string
  workspaceId?: string
  projectId?: string
  userId?: string
  chatSessionId?: string
  chatMessageId?: string
  uploadIntentId?: string
  mediaAssetId?: string
  sourceStorageObjectId?: string
  sourceBucketName?: string
  sourceObjectPath?: string
  sourceSizeBytes?: number
  sourceChecksumSha256?: string
  editSessionId?: string
  editPlanVersionId?: string
  editPlanId?: string
  creditWalletId?: string
  creditLedgerEntryId?: string
  creditEstimateId?: string
  creditApprovalId?: string
  creditReservationId?: string
  approvedPlanSnapshotId?: string
  jobBatchId?: string
  jobId?: string
  renderJobId?: string
  workerJobClaimId?: string
  jobEventIds?: string[]
  renderId?: string
  previewStorageObjectId?: string
  qaReportId?: string
}

export interface SupabaseE2ESmokeResult {
  ok: boolean
  status: SmokeStatus
  smokeMode: string
  liveSupabaseConfigured: boolean
  writesAllowed: boolean
  cleanupEnabled: boolean
  tableReadiness?: TableReadinessResult
  records?: SmokeRecordIds
  cleanup?: {
    attempted: boolean
    deleted: Array<{ table: string; id: string }>
    errors: string[]
  }
  renderSmoke?: unknown
  readback?: {
    ok: boolean
    checked: Array<{ table: string; id: string; status?: string }>
    blockers: string[]
  }
  leftoverRecords?: SupabaseSmokeLeftoverRecord[]
  leftoverQueryErrors?: string[]
  warnings: string[]
  error?: {
    code: SmokeFailureCode
    message: string
    details?: Record<string, unknown>
  }
}

class SupabaseSmokeError extends Error {
  readonly code: SmokeFailureCode
  readonly details?: Record<string, unknown>

  constructor(code: SmokeFailureCode, message: string, details?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.details = details
  }
}

const OPTIONAL_SCHEMA_TABLES = [
  'user_profiles',
  'profiles',
  'edit_sessions',
  'edit_plan_versions',
]

const KNOWN_COLUMN_HINTS: Record<string, string[]> = {
  user_profiles: ['id', 'display_name', 'email', 'metadata'],
  profiles: ['id', 'user_id', 'display_name', 'metadata_json'],
  workspaces: ['id', 'owner_user_id', 'owner_id', 'name', 'slug', 'workspace_type', 'plan_type', 'metadata', 'metadata_json'],
  workspace_members: ['id', 'workspace_id', 'user_id', 'role'],
  projects: ['id', 'workspace_id', 'created_by', 'owner_id', 'title', 'description', 'status', 'target_platform', 'aspect_ratio', 'metadata', 'metadata_json'],
  chat_sessions: ['id', 'workspace_id', 'project_id', 'started_by', 'status', 'title', 'metadata'],
  chat_messages: ['id', 'chat_session_id', 'project_id', 'workspace_id', 'role', 'actor_user_id', 'content', 'content_json', 'sequence_number', 'metadata'],
  upload_intents: ['id', 'workspace_id', 'project_id', 'chat_session_id', 'requested_by_user_id', 'upload_purpose', 'target_bucket', 'target_path', 'original_file_name', 'mime_type', 'expected_size_bytes', 'checksum_sha256', 'status', 'expires_at'],
  media_assets: ['id', 'workspace_id', 'project_id', 'created_by', 'asset_type', 'processing_status', 'file_name', 'display_name', 'mime_type', 'storage_provider', 'storage_bucket', 'storage_path', 'file_size_bytes', 'checksum', 'metadata'],
  storage_object_records: ['id', 'workspace_id', 'project_id', 'media_asset_id', 'render_id', 'qa_report_id', 'upload_intent_id', 'bucket_name', 'object_path', 'object_purpose', 'mime_type', 'size_bytes', 'checksum_sha256', 'region', 'status'],
  edit_sessions: ['id', 'project_id', 'status', 'source_order_confirmed', 'metadata_json'],
  edit_plan_versions: ['id', 'project_id', 'edit_session_id', 'version', 'status', 'goal_summary', 'full_plan_json', 'credit_estimate_id', 'approved_at', 'approved_by'],
  edit_plans: ['id', 'workspace_id', 'project_id', 'chat_session_id', 'created_by_user_id', 'plan_version', 'status', 'edit_complexity', 'goal_summary', 'target_platform', 'aspect_ratio', 'credit_estimate_id', 'approved_at', 'approved_by', 'plan_payload'],
  credit_wallets: ['id', 'workspace_id', 'user_id', 'wallet_type', 'name', 'currency_code', 'cached_available_credits', 'cached_reserved_credits', 'metadata'],
  credit_estimates: ['id', 'workspace_id', 'project_id', 'chat_session_id', 'edit_plan_id', 'status', 'total_estimated_credits', 'estimate_reason', 'estimate_payload', 'approved_at'],
  credit_estimate_line_items: ['id', 'credit_estimate_id', 'workspace_id', 'project_id', 'edit_plan_id', 'line_item_type', 'usage_category', 'label', 'estimated_credits', 'line_payload'],
  credit_approvals: ['id', 'workspace_id', 'project_id', 'chat_session_id', 'credit_estimate_id', 'edit_plan_id', 'status', 'approved_by', 'approved_at', 'approval_note', 'approval_payload'],
  credit_reservations: ['id', 'credit_wallet_id', 'workspace_id', 'project_id', 'chat_session_id', 'credit_estimate_id', 'credit_approval_id', 'edit_plan_id', 'status', 'reserved_credits', 'idempotency_key', 'reserved_at', 'expires_at', 'metadata'],
  approved_plan_snapshots: ['id', 'workspace_id', 'project_id', 'chat_session_id', 'edit_plan_id', 'edit_session_id', 'edit_plan_version_id', 'credit_estimate_id', 'credit_approval_id', 'credit_reservation_id', 'approved_by_user_id', 'approved_by', 'approved_at', 'execution_ready_at', 'snapshot_version', 'snapshot_status', 'status', 'snapshot_json', 'snapshot_payload', 'snapshot_hash', 'plan_hash', 'credit_hash', 'source_sequence_hash', 'timing_hash', 'immutable', 'idempotency_key', 'metadata'],
  job_batches: ['id', 'workspace_id', 'project_id', 'chat_session_id', 'edit_plan_id', 'credit_estimate_id', 'credit_reservation_id', 'status', 'batch_name', 'batch_purpose', 'created_by_user_id', 'idempotency_key', 'input_payload', 'metadata'],
  jobs: ['id', 'job_batch_id', 'workspace_id', 'project_id', 'chat_session_id', 'edit_plan_id', 'credit_estimate_id', 'credit_reservation_id', 'job_type', 'status', 'worker_target', 'runtime_type', 'job_name', 'idempotency_key', 'input_payload', 'metadata'],
  render_jobs: ['id', 'workspace_id', 'project_id', 'chat_session_id', 'edit_plan_id', 'job_id', 'job_batch_id', 'credit_estimate_id', 'credit_reservation_id', 'status', 'render_type', 'quality_level', 'output_format', 'render_name', 'timeline_spec', 'render_settings', 'width', 'height', 'frame_rate', 'idempotency_key', 'worker_runtime'],
  renders: ['id', 'workspace_id', 'project_id', 'render_job_id', 'job_id', 'status', 'render_type', 'quality_level', 'output_format', 'display_name', 'storage_provider', 'storage_bucket', 'storage_path', 'file_size_bytes', 'duration_seconds', 'render_payload'],
  qa_reports: ['id', 'workspace_id', 'project_id', 'render_job_id', 'render_id', 'job_id', 'status', 'overall_score', 'summary', 'requires_retry', 'checked_by', 'qa_payload', 'completed_at'],
}

export async function runSupabaseTableReadinessSmoke(context: ServiceContext): Promise<SupabaseE2ESmokeResult> {
  const availability = getLiveSupabaseAvailability(context)
  if (!availability.canConnect) {
    return skippedResult(context, availability.reason, availability.warnings)
  }

  const tableReadiness = await checkSupabaseTableReadiness(availability.client)
  return {
    ok: tableReadiness.ok,
    status: tableReadiness.ok ? 'passed' : 'failed',
    smokeMode: context.env.supabaseE2eSmokeMode,
    liveSupabaseConfigured: true,
    writesAllowed: context.env.supabaseE2eAllowWrites,
    cleanupEnabled: context.env.supabaseE2eCleanup,
    tableReadiness,
    warnings: tableReadiness.warnings,
    error: tableReadiness.ok ? undefined : {
      code: 'missing_tables',
      message: 'Supabase is reachable, but required RP-E2E runtime tables are missing.',
      details: { missingTables: tableReadiness.missingTables },
    },
  }
}

export async function runSupabaseWriteReadSmoke(context: ServiceContext): Promise<SupabaseE2ESmokeResult> {
  const writeCheck = await prepareLiveWriteSmoke(context)
  if ('result' in writeCheck) return writeCheck.result

  const { client, tableReadiness, schema } = writeCheck
  const cleanupRecords: CleanupRecord[] = []

  try {
    const records = await createSupabaseSmokeRecordChain(context, client, schema, cleanupRecords, {
      createFixture: false,
      includeRenderMetadata: true,
    })
    const cleanup = await maybeCleanupSupabaseSmokeRecords(context, client, cleanupRecords)
    return {
      ok: true,
      status: 'passed',
      smokeMode: context.env.supabaseE2eSmokeMode,
      liveSupabaseConfigured: true,
      writesAllowed: true,
      cleanupEnabled: context.env.supabaseE2eCleanup,
      tableReadiness,
      records,
      cleanup,
      warnings: schema.warnings,
    }
  } catch (error) {
    const cleanup = await maybeCleanupSupabaseSmokeRecords(context, client, cleanupRecords)
    return failedFromError(context, error, tableReadiness, cleanup, schema.warnings)
  }
}

export async function runPersistedBasicRenderSmoke(
  context: ServiceContext,
  options: PersistedRenderSmokeOptions = {},
): Promise<SupabaseE2ESmokeResult> {
  const renderExecutionMode = options.renderExecutionMode ?? 'local_ffmpeg'
  const writeCheck = await prepareLiveWriteSmoke(context)
  if ('result' in writeCheck) return writeCheck.result
  if (renderExecutionMode === 'staging_real_video_upload_preview_canary') {
    return failureResult(context, 'LOCAL_STORAGE_ONLY_PATH_USED_IN_GCS_CANARY', 'The real-video upload-to-preview canary must use runPersistedGcsRealVideoUploadPreviewSmoke; the legacy persisted render smoke path is local-only for this mode.', {
      tableReadiness: writeCheck.tableReadiness,
      details: { requiredStorageMode: 'gcs', actualStorageMode: context.env.storageMode },
    })
  }
  if (renderExecutionMode !== 'staging_cloud_run_remotion_canary' && context.env.storageMode !== 'local') {
    return failureResult(context, 'STORAGE_MODE_MISMATCH', 'Persisted render smoke requires STORAGE_MODE=local.', {
      tableReadiness: writeCheck.tableReadiness,
      details: { requiredStorageMode: 'local', actualStorageMode: context.env.storageMode },
    })
  }
  if (renderExecutionMode === 'staging_cloud_run_remotion_canary' && context.env.storageMode !== 'gcs') {
    return failureResult(context, 'GCS_STORAGE_REQUIRED', 'Staging Cloud Run Remotion canary requires STORAGE_MODE=gcs.', {
      tableReadiness: writeCheck.tableReadiness,
      details: { requiredStorageMode: 'gcs', actualStorageMode: context.env.storageMode },
    })
  }

  const toolWarnings: string[] = []
  if (renderExecutionMode === 'local_ffmpeg') {
    const tools = await checkBasicRenderSmokeTools(context)
    toolWarnings.push(...tools.warnings)
    if (!tools.ready) {
      return failureResult(context, 'tool_unavailable', 'Persisted render smoke requires available FFmpeg and FFprobe.', {
        tableReadiness: writeCheck.tableReadiness,
        warnings: tools.warnings,
      })
    }
  }

  return runPersistedRenderSmokePrepared(context, writeCheck, options, renderExecutionMode, toolWarnings)
}

export async function runPersistedGcsRealVideoUploadPreviewSmoke(
  context: ServiceContext,
  options: Omit<PersistedRenderSmokeOptions, 'renderExecutionMode'> = {},
): Promise<SupabaseE2ESmokeResult> {
  const writeCheck = await prepareLiveWriteSmoke(context)
  if ('result' in writeCheck) return writeCheck.result
  if (context.env.storageMode !== 'gcs') {
    return failureResult(context, 'GCS_STORAGE_REQUIRED', 'Staging real-video upload-to-preview canary requires STORAGE_MODE=gcs.', {
      tableReadiness: writeCheck.tableReadiness,
      details: { requiredStorageMode: 'gcs', actualStorageMode: context.env.storageMode },
    })
  }
  if (!options.sourceFixtureFactory) {
    return failureResult(context, 'GCS_SOURCE_OBJECT_MISSING', 'Staging real-video upload-to-preview canary requires a GCS source fixture factory.', {
      tableReadiness: writeCheck.tableReadiness,
    })
  }
  if (!options.createExternalRenderArtifacts) {
    return failureResult(context, 'GCS_PREVIEW_OBJECT_MISSING', 'Staging real-video upload-to-preview canary requires a Cloud Run preview artifact executor.', {
      tableReadiness: writeCheck.tableReadiness,
    })
  }

  return runPersistedRenderSmokePrepared(context, writeCheck, {
    ...options,
    renderExecutionMode: 'staging_real_video_upload_preview_canary',
  }, 'staging_real_video_upload_preview_canary', [])
}

async function runPersistedRenderSmokePrepared(
  context: ServiceContext,
  writeCheck: { client: SupabaseClient; tableReadiness: TableReadinessResult; schema: SchemaInfo },
  options: PersistedRenderSmokeOptions,
  renderExecutionMode: PersistedRenderExecutionMode,
  toolWarnings: string[],
): Promise<SupabaseE2ESmokeResult> {
  const { client, tableReadiness, schema } = writeCheck
  const cleanupRecords: CleanupRecord[] = []
  try {
    const records = await createSupabaseSmokeRecordChain(context, client, schema, cleanupRecords, {
      createFixture: renderExecutionMode === 'local_ffmpeg',
      includeRenderMetadata: false,
      runtimeMode: 'rpc_prerequisites',
      sourceFixtureFactory: options.sourceFixtureFactory,
      sourceObjectOwner: options.sourceObjectOwner,
      sourceFileName: options.sourceFileName,
    })
    if (!records.workspaceId || !records.projectId || !records.editPlanId || !records.creditWalletId || !records.creditEstimateId || !records.creditApprovalId || !records.userId || !records.sourceStorageObjectId || !records.sourceBucketName || !records.sourceObjectPath) {
      throw new SupabaseSmokeError('missing_dependency', 'Persisted render smoke prerequisite record chain is incomplete.', { records })
    }

    const pipeline = await runPersistedRenderPipelineViaRpcs(context, {
      workspaceId: records.workspaceId,
      projectId: records.projectId,
      chatSessionId: records.chatSessionId,
      editPlanId: records.editPlanId,
      creditWalletId: records.creditWalletId,
      creditEstimateId: records.creditEstimateId,
      creditApprovalId: records.creditApprovalId,
      approvedByUserId: records.userId,
      sourceStorageObjectId: records.sourceStorageObjectId,
      sourceMediaAssetId: records.mediaAssetId,
      sourceBucketName: records.sourceBucketName,
      sourceObjectPath: records.sourceObjectPath,
      sourceSizeBytes: records.sourceSizeBytes,
      sourceChecksumSha256: records.sourceChecksumSha256,
      idempotencyKey: createRpcSmokeIdempotencyKey(records.smokeRunId),
      smokeRunId: records.smokeRunId,
      renderExecutionMode,
      createExternalRenderArtifacts: options.createExternalRenderArtifacts,
      precreateRenderIdForOutputPath: options.precreateRenderIdForOutputPath,
    })

    records.creditReservationId = pipeline.creditReservationId
    records.creditLedgerEntryId = pipeline.creditLedgerEntryId
    records.approvedPlanSnapshotId = pipeline.approvedPlanSnapshotId
    records.jobBatchId = pipeline.jobBatchId
    records.jobId = pipeline.jobId
    records.renderJobId = pipeline.renderJobId
    records.workerJobClaimId = pipeline.workerJobClaimId
    records.jobEventIds = pipeline.jobEventIds
    records.renderId = pipeline.renderId
    records.previewStorageObjectId = pipeline.previewStorageObjectId
    records.qaReportId = pipeline.qaReportId

    if (!pipeline.ok || pipeline.status !== 'preview_ready') {
      const code: SmokeFailureCode = pipeline.error?.code === 'E2E_RPC_MISSING' ? 'rpc_missing' : 'render_failed'
      throw new SupabaseSmokeError(code, pipeline.error?.message ?? 'RPC persisted render smoke did not reach preview_ready.', {
        pipeline,
      })
    }

    registerRpcPersistedRenderCleanup(cleanupRecords, records)

    const readback = await validatePersistedRenderSmokeReadback(client, records, pipeline.renderExecutionMode ?? renderExecutionMode)
    const cleanup = await maybeCleanupSupabaseSmokeRecords(context, client, cleanupRecords)
    const leftovers = await findExactSupabaseSmokeRecordLeftovers(client, cleanupRecords)
    return {
      ok: true,
      status: 'passed',
      smokeMode: context.env.supabaseE2eSmokeMode,
      liveSupabaseConfigured: true,
      writesAllowed: true,
      cleanupEnabled: context.env.supabaseE2eCleanup,
      tableReadiness,
      records,
      renderSmoke: pipeline,
      readback,
      cleanup,
      leftoverRecords: leftovers.leftovers,
      leftoverQueryErrors: leftovers.queryErrors,
      warnings: [...schema.warnings, ...leftovers.queryErrors],
    }
  } catch (error) {
    const cleanup = await maybeCleanupSupabaseSmokeRecords(context, client, cleanupRecords)
    return failedFromError(context, error, tableReadiness, cleanup, [...schema.warnings, ...toolWarnings])
  }
}

export async function cleanupSupabaseSmokeRecords(
  context: ServiceContext,
  records: CleanupRecord[],
): Promise<SupabaseE2ESmokeResult['cleanup']> {
  if (!context.clients.admin) {
    return { attempted: false, deleted: [], errors: ['Supabase admin client is unavailable.'] }
  }

  return maybeCleanupSupabaseSmokeRecords(context, context.clients.admin, records)
}

async function validatePersistedRenderSmokeReadback(
  client: SupabaseClient,
  records: SmokeRecordIds,
  renderExecutionMode: PersistedRenderExecutionMode,
): Promise<NonNullable<SupabaseE2ESmokeResult['readback']>> {
  const checked: Array<{ table: string; id: string; status?: string }> = []
  const blockers: string[] = []

  const creditReservation = await requireSmokeReadback(client, 'credit_reservations', records.creditReservationId, blockers, checked)
  const snapshot = await requireSmokeReadback(client, 'approved_plan_snapshots', records.approvedPlanSnapshotId, blockers, checked)
  const jobBatch = await requireSmokeReadback(client, 'job_batches', records.jobBatchId, blockers, checked)
  const job = await requireSmokeReadback(client, 'jobs', records.jobId, blockers, checked)
  const renderJob = await requireSmokeReadback(client, 'render_jobs', records.renderJobId, blockers, checked)
  const workerClaim = await requireSmokeReadback(client, 'worker_job_claims', records.workerJobClaimId, blockers, checked)
  const previewStorage = await requireSmokeReadback(client, 'storage_object_records', records.previewStorageObjectId, blockers, checked)
  const render = await requireSmokeReadback(client, 'renders', records.renderId, blockers, checked)
  const qaReport = await requireSmokeReadback(client, 'qa_reports', records.qaReportId, blockers, checked)

  requireStatus(creditReservation, 'credit_reservations', ['reserved', 'active'], blockers)
  requireStatus(snapshot, 'approved_plan_snapshots', ['approved'], blockers)
  requireStatus(jobBatch, 'job_batches', ['queued', 'running', 'completed'], blockers)
  requireStatus(job, 'jobs', ['completed'], blockers)
  requireStatus(renderJob, 'render_jobs', ['completed'], blockers)
  requireStatus(workerClaim, 'worker_job_claims', ['completed', 'released'], blockers, 'claim_status')
  requireStatus(previewStorage, 'storage_object_records', ['ready'], blockers)
  requireStatus(render, 'renders', ['ready'], blockers)
  requireStatus(qaReport, 'qa_reports', ['passed', 'warning'], blockers)

  requireFieldEquals(snapshot, 'approved_plan_snapshots.credit_reservation_id', 'credit_reservation_id', records.creditReservationId, blockers)
  requireFieldEquals(jobBatch, 'job_batches.credit_reservation_id', 'credit_reservation_id', records.creditReservationId, blockers)
  requireFieldEquals(job, 'jobs.job_batch_id', 'job_batch_id', records.jobBatchId, blockers)
  requireFieldEquals(renderJob, 'render_jobs.job_id', 'job_id', records.jobId, blockers)
  requireFieldEquals(renderJob, 'render_jobs.job_batch_id', 'job_batch_id', records.jobBatchId, blockers)
  requireFieldEquals(render, 'renders.render_job_id', 'render_job_id', records.renderJobId, blockers)
  requireFieldEquals(render, 'renders.job_id', 'job_id', records.jobId, blockers)
  requireFieldEquals(qaReport, 'qa_reports.render_id', 'render_id', records.renderId, blockers)
  requireFieldEquals(qaReport, 'qa_reports.job_id', 'job_id', records.jobId, blockers)

  for (const hashField of ['snapshot_hash', 'plan_hash', 'credit_hash', 'source_sequence_hash', 'timing_hash']) {
    const value = snapshot?.[hashField]
    if (typeof value !== 'string' || value.length === 0) {
      blockers.push(`approved_plan_snapshots.${hashField} was missing.`)
    }
  }

  const snapshotJson = readRecordObject(snapshot?.snapshot_json ?? snapshot?.snapshot_payload)
  const renderPayload = readRecordObject(render?.render_payload)
  const renderMetadata = readRecordObject(renderPayload?.metadata)
  const infrastructureCanary = renderExecutionMode === 'staging_cloud_run_remotion_canary'
  if (snapshotJson?.providerCallsEnabled !== false || renderMetadata?.providerCallsEnabled !== false) {
    blockers.push('Persisted render smoke did not preserve providerCallsEnabled=false.')
  }
  if (snapshotJson?.remotionEnabled !== infrastructureCanary || renderMetadata?.remotionEnabled !== infrastructureCanary) {
    blockers.push(`Persisted render smoke did not preserve remotionEnabled=${infrastructureCanary}.`)
  }
  if (snapshotJson?.stripeCallsEnabled !== false || renderMetadata?.stripeCallsEnabled !== false) {
    blockers.push('Persisted render smoke did not preserve stripeCallsEnabled=false.')
  }
  if (snapshotJson?.cloudRunCallsEnabled !== infrastructureCanary || renderMetadata?.cloudRunCallsEnabled !== infrastructureCanary) {
    blockers.push(`Persisted render smoke did not preserve cloudRunCallsEnabled=${infrastructureCanary}.`)
  }
  if (snapshotJson?.renderExecutionMode !== renderExecutionMode) {
    blockers.push(`Approved snapshot renderExecutionMode was not ${renderExecutionMode}.`)
  }

  return { ok: blockers.length === 0, checked, blockers }
}

async function requireSmokeReadback(
  client: SupabaseClient,
  table: string,
  id: string | undefined,
  blockers: string[],
  checked: Array<{ table: string; id: string; status?: string }>,
): Promise<Record<string, unknown> | undefined> {
  if (!id) {
    blockers.push(`${table} id was missing from persisted render smoke result.`)
    return undefined
  }

  const { data, error } = await client.from(table).select('*').eq('id', id).maybeSingle()
  if (error) {
    blockers.push(`${table}/${id} readback failed: ${error.message}`)
    return undefined
  }
  if (!data) {
    blockers.push(`${table}/${id} was not readable after persisted render smoke.`)
    return undefined
  }

  const record = data as Record<string, unknown>
  checked.push({
    table,
    id,
    status: typeof record.status === 'string'
      ? record.status
      : typeof record.claim_status === 'string'
        ? record.claim_status
        : undefined,
  })
  return record
}

function requireStatus(
  record: Record<string, unknown> | undefined,
  label: string,
  allowed: string[],
  blockers: string[],
  field = 'status',
): void {
  if (!record) return
  const status = String(record[field] ?? '')
  if (!allowed.includes(status)) {
    blockers.push(`${label}.${field} was ${status || 'missing'}, expected ${allowed.join('/')}.`)
  }
}

function requireFieldEquals(
  record: Record<string, unknown> | undefined,
  label: string,
  field: string,
  expected: string | undefined,
  blockers: string[],
): void {
  if (!record || !expected) return
  if (String(record[field] ?? '') !== expected) {
    blockers.push(`${label} did not match expected ${expected}.`)
  }
}

function readRecordObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

async function prepareLiveWriteSmoke(context: ServiceContext): Promise<{
  client: SupabaseClient
  tableReadiness: TableReadinessResult
  schema: SchemaInfo
} | { result: SupabaseE2ESmokeResult }> {
  if (context.env.supabaseE2eSmokeMode !== 'live') {
    return { result: skippedResult(context, 'Set SUPABASE_E2E_SMOKE_MODE=live and SUPABASE_E2E_ALLOW_WRITES=true to run persisted smoke.') }
  }
  if (!context.clients.admin || !context.env.hasSupabaseAdmin) {
    return { result: failureResult(context, 'missing_env', 'Live Supabase backend admin configuration is required for smoke writes.') }
  }
  if (!context.env.supabaseE2eAllowWrites) {
    return { result: failureResult(context, 'writes_disabled', 'SUPABASE_E2E_ALLOW_WRITES=true is required before live write smoke can mutate Supabase.') }
  }
  const guardStatus = getLiveWriteGuardStatus(context.env)
  if (!guardStatus.ok) {
    return {
      result: failureResult(context, 'writes_disabled', 'Live write guard blocked Supabase smoke writes.', {
        warnings: guardStatus.warnings,
        details: { blockers: guardStatus.blockers },
      }),
    }
  }

  const tableReadiness = await checkSupabaseTableReadiness(context.clients.admin)
  if (!tableReadiness.ok) {
    return {
      result: failureResult(context, 'missing_tables', 'Supabase runtime tables are missing; write smoke was not attempted.', {
        tableReadiness,
      }),
    }
  }

  const schema = await loadSchemaInfo(context.clients.admin, [
    ...getRequiredSupabaseRuntimeTables(),
    ...OPTIONAL_SCHEMA_TABLES,
  ])
  return { client: context.clients.admin, tableReadiness, schema }
}

async function createSupabaseSmokeRecordChain(
  context: ServiceContext,
  client: SupabaseClient,
  schema: SchemaInfo,
  cleanupRecords: CleanupRecord[],
  options: {
    createFixture: boolean
    includeRenderMetadata: boolean
    runtimeMode?: 'adaptive' | 'rpc_prerequisites'
    sourceFixtureFactory?: PersistedRenderSourceFixtureFactory
    sourceObjectOwner?: 'upload_intent' | 'smoke_run'
    sourceFileName?: string
  },
): Promise<SmokeRecordIds> {
  const runId = randomUUID()
  const smokeTag = createSmokeRunId()
  const userId = context.env.supabaseE2eUserId
  if (!userId) {
    throw new SupabaseSmokeError('missing_dependency', 'SUPABASE_E2E_USER_ID must reference an existing safe Supabase auth user for live write smoke.')
  }

  await ensureSmokeUserProfiles(client, schema, userId, smokeTag, cleanupRecords)
  const workspaceId = await resolveOrCreateWorkspace(context, client, schema, userId, smokeTag, cleanupRecords)
  await createWorkspaceMember(client, schema, { workspaceId, userId, smokeTag }, cleanupRecords)
  const projectId = await resolveOrCreateProject(context, client, schema, { workspaceId, userId, smokeTag }, cleanupRecords)
  const chatSessionId = await insertRow(client, schema, cleanupRecords, 'chat_sessions', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    started_by: userId,
    status: 'open',
    title: 'RP-E2E smoke chat session',
    metadata: smokeMetadata(smokeTag),
  })
  const chatMessageId = await insertRow(client, schema, cleanupRecords, 'chat_messages', {
    id: randomUUID(),
    chat_session_id: chatSessionId,
    project_id: projectId,
    workspace_id: workspaceId,
    role: 'user',
    actor_user_id: userId,
    content: 'RP-E2E smoke message; workers execute approved snapshots, not raw chat.',
    content_json: smokeMetadata(smokeTag),
    sequence_number: 1,
    metadata: smokeMetadata(smokeTag),
  })

  const bucketName = resolveBucketName(context.env, 'source_media')
  const uploadIntentId = randomUUID()
  const sourceFileName = options.sourceFileName ?? 'supabase-persisted-render-source.mp4'
  const objectPath = buildCanonicalObjectPath({
    workspaceId,
    projectId,
    purpose: 'source_media',
    ownerId: options.sourceObjectOwner === 'smoke_run' ? smokeTag : uploadIntentId,
    fileName: sourceFileName,
  })
  let sizeBytes = 128
  let checksumSha256 = `smoke-${runId}`

  if (options.sourceFixtureFactory) {
    const fixture = await options.sourceFixtureFactory({
      smokeRunId: smokeTag,
      workspaceId,
      projectId,
      bucketName,
      objectPath,
      fileName: sourceFileName,
    })
    sizeBytes = fixture.sizeBytes
    checksumSha256 = fixture.checksumSha256
  } else if (options.createFixture) {
    const outputPath = resolveLocalStorageObjectPath(context.env.localStorageRoot, bucketName, objectPath)
    const fixture = await createSyntheticMp4Fixture({
      outputPath,
      localStorageRoot: context.env.localStorageRoot,
      ffmpegBin: context.env.ffmpegBin,
      timeoutMs: context.env.toolCheckTimeoutMs,
    })
    if (!fixture.available || !fixture.sizeBytes || !fixture.checksumSha256) {
      throw new SupabaseSmokeError('tool_unavailable', 'FFmpeg could not create the persisted render smoke fixture.', {
        warnings: fixture.warnings,
      })
    }
    sizeBytes = fixture.sizeBytes
    checksumSha256 = fixture.checksumSha256
  }

  await insertRow(client, schema, cleanupRecords, 'upload_intents', {
    id: uploadIntentId,
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    requested_by_user_id: userId,
    upload_purpose: 'source_media',
    target_bucket: bucketName,
    target_path: objectPath,
    original_file_name: sourceFileName,
    mime_type: 'video/mp4',
    expected_size_bytes: sizeBytes,
    checksum_sha256: checksumSha256,
    status: 'finalized',
    expires_at: futureIso(15),
  }, { smokeRunId: smokeTag })
  const mediaAssetId = await insertRow(client, schema, cleanupRecords, 'media_assets', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    created_by: userId,
    asset_type: 'source_video',
    processing_status: 'uploaded',
    file_name: sourceFileName,
    display_name: 'RP-E2E smoke source',
    mime_type: 'video/mp4',
    storage_provider: options.sourceFixtureFactory ? 'gcs_private_storage' : 'local_private_storage',
    storage_bucket: bucketName,
    storage_path: objectPath,
    file_size_bytes: sizeBytes,
    checksum: checksumSha256,
    metadata: smokeMetadata(smokeTag),
  })
  const sourceStorageObjectId = await insertRow(client, schema, cleanupRecords, 'storage_object_records', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    media_asset_id: mediaAssetId,
    upload_intent_id: uploadIntentId,
    bucket_name: bucketName,
    object_path: objectPath,
    object_purpose: 'source_media',
    mime_type: 'video/mp4',
    size_bytes: sizeBytes,
    checksum_sha256: checksumSha256,
    region: storageRegion(context),
    status: 'ready',
  }, { smokeRunId: smokeTag })

  const editSessionId = hasTable(schema, 'edit_sessions')
    ? await optionalInsertRow(client, schema, cleanupRecords, 'edit_sessions', {
      id: randomUUID(),
      project_id: projectId,
      status: 'setup',
      source_order_confirmed: true,
      metadata_json: smokeMetadata(smokeTag),
    })
    : undefined
  const editPlanVersionId = editSessionId && hasTable(schema, 'edit_plan_versions')
    ? await optionalInsertRow(client, schema, cleanupRecords, 'edit_plan_versions', {
      id: randomUUID(),
      project_id: projectId,
      edit_session_id: editSessionId,
      version: 1,
      status: 'approved',
      goal_summary: 'RP-E2E smoke approved plan version',
      full_plan_json: smokeSnapshotJson(sourceStorageObjectId),
      approved_at: new Date().toISOString(),
      approved_by: userId,
    })
    : undefined
  const editPlanId = await insertRow(client, schema, cleanupRecords, 'edit_plans', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    created_by_user_id: userId,
    plan_version: 1,
    status: 'approved',
    edit_complexity: 'basic_edit',
    goal_summary: 'RP-E2E smoke approved edit plan',
    target_platform: 'custom',
    aspect_ratio: '16_9',
    approved_at: new Date().toISOString(),
    approved_by: userId,
    plan_payload: smokeSnapshotJson(sourceStorageObjectId),
  }, { smokeRunId: smokeTag })
  const creditWalletId = await insertRow(client, schema, cleanupRecords, 'credit_wallets', {
    id: randomUUID(),
    workspace_id: workspaceId,
    user_id: userId,
    wallet_type: 'workspace',
    name: 'RP-E2E smoke credits',
    currency_code: 'CREDITS',
    cached_available_credits: 10,
    cached_reserved_credits: 0,
    metadata: smokeMetadata(smokeTag),
  })
  const creditEstimateId = await insertRow(client, schema, cleanupRecords, 'credit_estimates', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    edit_plan_id: editPlanId,
    status: 'approved',
    total_estimated_credits: 1,
    estimate_reason: 'RP-E2E smoke credit estimate',
    estimate_payload: smokeMetadata(smokeTag),
    approved_at: new Date().toISOString(),
  })
  await updateRow(client, schema, 'edit_plans', editPlanId, { credit_estimate_id: creditEstimateId })
  await insertRow(client, schema, cleanupRecords, 'credit_estimate_line_items', {
    id: randomUUID(),
    credit_estimate_id: creditEstimateId,
    workspace_id: workspaceId,
    project_id: projectId,
    edit_plan_id: editPlanId,
    line_item_type: 'render_preview',
    usage_category: 'basic_edit',
    label: 'RP-E2E smoke preview render',
    estimated_credits: 1,
    line_payload: smokeMetadata(smokeTag),
  })
  const creditApprovalId = await insertRow(client, schema, cleanupRecords, 'credit_approvals', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    credit_estimate_id: creditEstimateId,
    edit_plan_id: editPlanId,
    status: 'approved',
    approved_by: userId,
    approved_at: new Date().toISOString(),
    approval_note: 'RP-E2E smoke credit approval',
    approval_payload: smokeMetadata(smokeTag),
  })

  if (options.runtimeMode === 'rpc_prerequisites') {
    return {
      smokeRunId: smokeTag,
      workspaceId,
      projectId,
      userId,
      chatSessionId,
      chatMessageId,
      uploadIntentId,
      mediaAssetId,
      sourceStorageObjectId,
      sourceBucketName: bucketName,
      sourceObjectPath: objectPath,
      sourceSizeBytes: sizeBytes,
      sourceChecksumSha256: checksumSha256,
      editSessionId,
      editPlanVersionId,
      editPlanId,
      creditWalletId,
      creditEstimateId,
      creditApprovalId,
    }
  }

  const creditReservationId = await insertRow(client, schema, cleanupRecords, 'credit_reservations', {
    id: randomUUID(),
    credit_wallet_id: creditWalletId,
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    credit_estimate_id: creditEstimateId,
    credit_approval_id: creditApprovalId,
    edit_plan_id: editPlanId,
    status: 'reserved',
    reserved_credits: 1,
    idempotency_key: smokeTag,
    reserved_at: new Date().toISOString(),
    expires_at: futureIso(60),
    metadata: smokeMetadata(smokeTag),
  })
  const approvedPlanSnapshotId = await insertRow(client, schema, cleanupRecords, 'approved_plan_snapshots', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    edit_plan_id: editPlanId,
    edit_session_id: editSessionId,
    edit_plan_version_id: editPlanVersionId,
    credit_estimate_id: creditEstimateId,
    credit_approval_id: creditApprovalId,
    credit_reservation_id: creditReservationId,
    approved_by_user_id: userId,
    approved_by: userId,
    approved_at: new Date().toISOString(),
    snapshot_version: 1,
    snapshot_status: 'approved',
    status: 'approved',
    snapshot_json: smokeSnapshotJson(sourceStorageObjectId),
    snapshot_payload: smokeSnapshotJson(sourceStorageObjectId),
    snapshot_hash: `snapshot-${runId}`,
    plan_hash: `plan-${runId}`,
    credit_hash: `credit-${runId}`,
    source_sequence_hash: `source-${runId}`,
    timing_hash: `timing-${runId}`,
    immutable: true,
  }, { smokeRunId: smokeTag })
  const jobBatchId = await insertRow(client, schema, cleanupRecords, 'job_batches', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    edit_plan_id: editPlanId,
    credit_estimate_id: creditEstimateId,
    credit_reservation_id: creditReservationId,
    status: 'queued',
    batch_name: 'RP-E2E persisted render smoke',
    batch_purpose: 'no-ai persisted smoke',
    created_by_user_id: userId,
    idempotency_key: smokeTag,
    input_payload: smokeMetadata(smokeTag),
    metadata: smokeMetadata(smokeTag),
  })
  const jobId = await insertRow(client, schema, cleanupRecords, 'jobs', {
    id: randomUUID(),
    job_batch_id: jobBatchId,
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    edit_plan_id: editPlanId,
    credit_estimate_id: creditEstimateId,
    credit_reservation_id: creditReservationId,
    job_type: 'render_preview',
    status: 'queued',
    worker_target: 'render_worker',
    runtime_type: 'backend_api',
    job_name: 'RP-E2E persisted render smoke job',
    idempotency_key: smokeTag,
    input_payload: {
      ...smokeMetadata(smokeTag),
      approvedPlanSnapshotId,
      sourceStorageObjectId,
      storageObjectRecordId: sourceStorageObjectId,
      sourceStorageObject: {
        id: sourceStorageObjectId,
        mediaAssetId,
        bucketName,
        objectPath,
        mimeType: 'video/mp4',
        sizeBytes,
        checksumSha256,
      },
    },
    metadata: smokeMetadata(smokeTag),
  })
  const renderJobId = await insertRow(client, schema, cleanupRecords, 'render_jobs', {
    id: randomUUID(),
    workspace_id: workspaceId,
    project_id: projectId,
    chat_session_id: chatSessionId,
    edit_plan_id: editPlanId,
    job_id: jobId,
    job_batch_id: jobBatchId,
    credit_estimate_id: creditEstimateId,
    credit_reservation_id: creditReservationId,
    status: 'queued',
    render_type: 'preview',
    quality_level: 'draft',
    output_format: 'mp4',
    render_name: 'RP-E2E persisted render smoke',
    timeline_spec: smokeSnapshotJson(sourceStorageObjectId),
    render_settings: smokeMetadata(smokeTag),
    width: 320,
    height: 180,
    frame_rate: 30,
    idempotency_key: smokeTag,
    worker_runtime: 'local',
  }, { smokeRunId: smokeTag })
  await updateRow(client, schema, 'jobs', jobId, {
    input_payload: {
      ...smokeMetadata(smokeTag),
      renderJobId,
      approvedPlanSnapshotId,
      sourceStorageObjectId,
      storageObjectRecordId: sourceStorageObjectId,
      sourceStorageObject: {
        id: sourceStorageObjectId,
        mediaAssetId,
        bucketName,
        objectPath,
        mimeType: 'video/mp4',
        sizeBytes,
        checksumSha256,
      },
    },
  })

  const records: SmokeRecordIds = {
    smokeRunId: smokeTag,
    workspaceId,
    projectId,
    userId,
    chatSessionId,
    chatMessageId,
    uploadIntentId,
    mediaAssetId,
    sourceStorageObjectId,
    sourceBucketName: bucketName,
    sourceObjectPath: objectPath,
    sourceSizeBytes: sizeBytes,
    sourceChecksumSha256: checksumSha256,
    editSessionId,
    editPlanVersionId,
    editPlanId,
    creditWalletId,
    creditEstimateId,
    creditApprovalId,
    creditReservationId,
    approvedPlanSnapshotId,
    jobBatchId,
    jobId,
    renderJobId,
  }

  if (options.includeRenderMetadata) {
    records.renderId = await insertRow(client, schema, cleanupRecords, 'renders', {
      id: randomUUID(),
      workspace_id: workspaceId,
      project_id: projectId,
      render_job_id: renderJobId,
      job_id: jobId,
      status: 'ready',
      render_type: 'preview',
      quality_level: 'draft',
      output_format: 'mp4',
      display_name: 'RP-E2E smoke render metadata',
      storage_provider: 'local_private_storage',
      storage_bucket: bucketName,
      storage_path: objectPath,
      file_size_bytes: sizeBytes,
      duration_seconds: 2,
      render_payload: smokeMetadata(smokeTag),
    })
    records.qaReportId = await insertRow(client, schema, cleanupRecords, 'qa_reports', {
      id: randomUUID(),
      workspace_id: workspaceId,
      project_id: projectId,
      render_job_id: renderJobId,
      render_id: records.renderId,
      job_id: jobId,
      status: 'passed',
      overall_score: 100,
      summary: 'RP-E2E write/read smoke QA metadata.',
      requires_retry: false,
      checked_by: 'rp-e2e-smoke',
      qa_payload: smokeMetadata(smokeTag),
      completed_at: new Date().toISOString(),
    })
  }

  return records
}

async function loadSchemaInfo(client: SupabaseClient, tableNames: string[]): Promise<SchemaInfo> {
  const warnings: string[] = []
  const columnsByTable: Record<string, ColumnInfo[]> = {}
  const availableTables = new Set<string>()
  let usedInformationSchema = false
  try {
    const { data, error } = await client
      .schema('information_schema')
      .from('columns')
      .select('table_name,column_name,data_type')
      .eq('table_schema', 'public')
      .in('table_name', tableNames)

    if (error) {
      warnings.push(`information_schema column introspection unavailable; using repo schema hints (${error.message}).`)
    } else {
      usedInformationSchema = true
      for (const row of data ?? []) {
        const table = String((row as { table_name?: unknown }).table_name ?? '')
        const column = String((row as { column_name?: unknown }).column_name ?? '')
        if (!table || !column) continue
        availableTables.add(table)
        columnsByTable[table] ??= []
        columnsByTable[table].push({
          name: column,
          dataType: String((row as { data_type?: unknown }).data_type ?? ''),
        })
      }
    }
  } catch (error) {
    warnings.push(`information_schema column introspection threw; using repo schema hints (${error instanceof Error ? error.message : 'unknown error'}).`)
  }

  for (const tableName of tableNames) {
    if (columnsByTable[tableName]) continue
    if (!KNOWN_COLUMN_HINTS[tableName]) continue
    if (!usedInformationSchema) {
      const { error } = await client.from(tableName).select('id', { head: true, count: 'exact' }).limit(1)
      if (error) continue
      availableTables.add(tableName)
    }
    if (availableTables.has(tableName)) {
      columnsByTable[tableName] = KNOWN_COLUMN_HINTS[tableName].map((name) => ({ name }))
    }
  }

  return { columnsByTable, availableTables: Array.from(availableTables), warnings }
}

async function ensureSmokeUserProfiles(
  client: SupabaseClient,
  schema: SchemaInfo,
  userId: string,
  smokeTag: string,
  cleanupRecords: CleanupRecord[],
): Promise<void> {
  if (hasTable(schema, 'user_profiles')) {
    const existing = await maybeGetById(client, 'user_profiles', userId)
    if (!existing) {
      await insertRow(client, schema, cleanupRecords, 'user_profiles', {
        id: userId,
        display_name: 'RP-E2E smoke user',
        email: `${smokeTag}@example.invalid`,
        metadata: smokeMetadata(smokeTag),
      }, { missingDependencyOn23503: 'SUPABASE_E2E_USER_ID must reference an existing Supabase auth.users row before user_profiles can be created.' })
    }
  }

  if (hasTable(schema, 'profiles')) {
    const { data, error } = await client.from('profiles').select('*').eq('user_id', userId).maybeSingle()
    if (isMissingOptionalTableError(error)) return
    if (error) {
      throw new SupabaseSmokeError('constraint_blocked', `Could not read profiles: ${error.message}`, {
        table: 'profiles',
        code: error.code,
        hint: error.hint,
      })
    }
    if (!data) {
      try {
        await insertRow(client, schema, cleanupRecords, 'profiles', {
          id: randomUUID(),
          user_id: userId,
          display_name: 'RP-E2E smoke user',
          metadata_json: smokeMetadata(smokeTag),
        }, { missingDependencyOn23503: 'SUPABASE_E2E_USER_ID must reference an existing Supabase auth.users row before profiles can be created.' })
      } catch (error) {
        if (error instanceof SupabaseSmokeError && error.details?.code === 'PGRST205') return
        throw error
      }
    }
  }
}

function isMissingOptionalTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === 'PGRST205' || /could not find the table/i.test(error.message ?? '')
}

async function resolveOrCreateWorkspace(
  context: ServiceContext,
  client: SupabaseClient,
  schema: SchemaInfo,
  userId: string,
  smokeTag: string,
  cleanupRecords: CleanupRecord[],
): Promise<string> {
  if (context.env.supabaseE2eWorkspaceId) {
    await requireExistingRecord(client, 'workspaces', context.env.supabaseE2eWorkspaceId, 'SUPABASE_E2E_WORKSPACE_ID was provided but no workspace row was found.')
    return context.env.supabaseE2eWorkspaceId
  }

  return insertRow(client, schema, cleanupRecords, 'workspaces', {
    id: randomUUID(),
    owner_user_id: userId,
    owner_id: userId,
    name: 'RP-E2E smoke workspace',
    slug: `rp-e2e-smoke-${Date.now()}`,
    workspace_type: 'personal',
    plan_type: 'free',
    metadata: smokeMetadata(smokeTag),
    metadata_json: smokeMetadata(smokeTag),
  })
}

async function createWorkspaceMember(
  client: SupabaseClient,
  schema: SchemaInfo,
  input: { workspaceId: string; userId: string; smokeTag: string },
  cleanupRecords: CleanupRecord[],
): Promise<void> {
  const { data } = await client
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', input.workspaceId)
    .eq('user_id', input.userId)
    .maybeSingle()
  if (data) return

  await insertRow(client, schema, cleanupRecords, 'workspace_members', {
    id: randomUUID(),
    workspace_id: input.workspaceId,
    user_id: input.userId,
    role: 'owner',
  }, { smokeRunId: input.smokeTag })
}

async function resolveOrCreateProject(
  context: ServiceContext,
  client: SupabaseClient,
  schema: SchemaInfo,
  input: { workspaceId: string; userId: string; smokeTag: string },
  cleanupRecords: CleanupRecord[],
): Promise<string> {
  if (context.env.supabaseE2eProjectId) {
    await requireExistingRecord(client, 'projects', context.env.supabaseE2eProjectId, 'SUPABASE_E2E_PROJECT_ID was provided but no project row was found.')
    return context.env.supabaseE2eProjectId
  }

  return insertRow(client, schema, cleanupRecords, 'projects', {
    id: randomUUID(),
    workspace_id: input.workspaceId,
    created_by: input.userId,
    owner_id: input.userId,
    title: 'RP-E2E smoke project',
    description: 'Temporary no-AI Supabase smoke project.',
    status: 'draft',
    target_platform: 'custom',
    aspect_ratio: '16_9',
    metadata: smokeMetadata(input.smokeTag),
    metadata_json: smokeMetadata(input.smokeTag),
  })
}

async function insertRow(
  client: SupabaseClient,
  schema: SchemaInfo,
  cleanupRecords: CleanupRecord[],
  table: string,
  row: Record<string, unknown>,
  options: InsertRowOptions = {},
): Promise<string> {
  const body = filterRowForTable(schema, table, row)
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await client.from(table).insert(body).select('*').single()
    if (!error) {
      const id = String((data as Record<string, unknown>).id ?? body.id ?? '')
      if (id) cleanupRecords.push({ table, id, owned: true, smokeRunId: options.smokeRunId ?? smokeRunIdFromRow(row) })
      return id
    }

    const missingColumn = missingColumnFromPostgrestError(error)
    if (missingColumn && missingColumn in body) {
      delete body[missingColumn]
      pruneSchemaColumn(schema, table, missingColumn)
      continue
    }

    const code = error.code === '23503' && options.missingDependencyOn23503 ? 'missing_dependency' : 'constraint_blocked'
    throw new SupabaseSmokeError(code, `Could not insert ${table}: ${error.message}`, {
      table,
      code: error.code,
      hint: error.hint,
    })
  }

  throw new SupabaseSmokeError('constraint_blocked', `Could not insert ${table}: too many schema compatibility retries.`, {
    table,
  })
}

async function optionalInsertRow(
  client: SupabaseClient,
  schema: SchemaInfo,
  cleanupRecords: CleanupRecord[],
  table: string,
  row: Record<string, unknown>,
  options: InsertRowOptions = {},
): Promise<string | undefined> {
  try {
    return await insertRow(client, schema, cleanupRecords, table, row, options)
  } catch (error) {
    if (error instanceof SupabaseSmokeError && error.details?.code === 'PGRST205') return undefined
    throw error
  }
}

async function updateRow(
  client: SupabaseClient,
  schema: SchemaInfo,
  table: string,
  id: string,
  row: Record<string, unknown>,
): Promise<void> {
  const body = filterRowForTable(schema, table, row)
  if (Object.keys(body).length === 0) return
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { error } = await client.from(table).update(body).eq('id', id)
    if (!error) return

    const missingColumn = missingColumnFromPostgrestError(error)
    if (missingColumn && missingColumn in body) {
      delete body[missingColumn]
      pruneSchemaColumn(schema, table, missingColumn)
      if (Object.keys(body).length === 0) return
      continue
    }

    throw new SupabaseSmokeError('constraint_blocked', `Could not update ${table}: ${error.message}`, {
      table,
      code: error.code,
      hint: error.hint,
    })
  }

  throw new SupabaseSmokeError('constraint_blocked', `Could not update ${table}: too many schema compatibility retries.`, {
    table,
  })
}

function missingColumnFromPostgrestError(error: { code?: string; message?: string }): string | null {
  if (error.code !== 'PGRST204') return null
  const match = /'([^']+)'\s+column/i.exec(error.message ?? '')
  return match?.[1] ?? null
}

function pruneSchemaColumn(schema: SchemaInfo, table: string, columnName: string): void {
  schema.columnsByTable[table] = (schema.columnsByTable[table] ?? []).filter((column) => column.name !== columnName)
}

async function maybeGetById(client: SupabaseClient, table: string, id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await client.from(table).select('*').eq('id', id).maybeSingle()
  if (error) return null
  return data as Record<string, unknown> | null
}

async function requireExistingRecord(client: SupabaseClient, table: string, id: string, message: string): Promise<void> {
  const data = await maybeGetById(client, table, id)
  if (!data) throw new SupabaseSmokeError('missing_dependency', message, { table, id })
}

async function maybeCleanupSupabaseSmokeRecords(
  context: ServiceContext,
  client: SupabaseClient,
  cleanupRecords: CleanupRecord[],
): Promise<NonNullable<SupabaseE2ESmokeResult['cleanup']>> {
  if (!context.env.supabaseE2eCleanup) {
    return { attempted: false, deleted: [], errors: ['SUPABASE_E2E_CLEANUP=false; smoke records were left for manual inspection.'] }
  }

  const deleted: Array<{ table: string; id: string }> = []
  const errors: string[] = []
  for (const record of [...cleanupRecords].reverse()) {
    if (!record.owned) continue
    if (!record.smokeRunId) {
      const existing = await maybeGetById(client, record.table, record.id)
      if (existing) {
        errors.push(`${record.table}/${record.id}: cleanup refused because the record was not tagged with a smokeRunId`)
      }
      continue
    }
    try {
      rejectNonSmokeCleanup({ metadata_json: smokeMetadata(record.smokeRunId), smokeRunId: record.smokeRunId }, record.smokeRunId)
    } catch (error) {
      errors.push(`${record.table}/${record.id}: ${error instanceof Error ? error.message : 'cleanup guard failed'}`)
      continue
    }
    const { error } = await client.from(record.table).delete().eq('id', record.id)
    if (error) {
      const { data: existingAfterDelete, error: readbackError } = await client
        .from(record.table)
        .select('id')
        .eq('id', record.id)
        .maybeSingle()
      if (!readbackError && !existingAfterDelete) {
        deleted.push({ table: record.table, id: record.id })
      } else if (readbackError) {
        errors.push(`${record.table}/${record.id}: ${error.message}; cleanup state could not be verified after delete error: ${readbackError.message}`)
      } else {
        errors.push(`${record.table}/${record.id}: ${error.message}`)
      }
    } else {
      deleted.push({ table: record.table, id: record.id })
    }
  }

  return { attempted: true, deleted, errors }
}

function getLiveSupabaseAvailability(context: ServiceContext): { canConnect: true; client: SupabaseClient } | { canConnect: false; reason: string; warnings: string[] } {
  if (context.env.supabaseE2eSmokeMode !== 'live') {
    return {
      canConnect: false,
      reason: 'Set SUPABASE_E2E_SMOKE_MODE=live to run live Supabase table readiness checks.',
      warnings: ['Supabase E2E smoke mode is disabled; no live connection was attempted.'],
    }
  }
  if (!context.clients.admin || !context.env.hasSupabaseAdmin) {
    return {
      canConnect: false,
      reason: 'Live Supabase backend admin configuration is required for table readiness checks.',
      warnings: ['Live Supabase env is incomplete; no live connection was attempted.'],
    }
  }

  return { canConnect: true, client: context.clients.admin }
}

function skippedResult(context: ServiceContext, reason: string, warnings: string[] = []): SupabaseE2ESmokeResult {
  return {
    ok: true,
    status: 'skipped',
    smokeMode: context.env.supabaseE2eSmokeMode,
    liveSupabaseConfigured: context.env.hasSupabaseAdmin,
    writesAllowed: context.env.supabaseE2eAllowWrites,
    cleanupEnabled: context.env.supabaseE2eCleanup,
    warnings,
    error: { code: 'disabled', message: reason },
  }
}

function registerRpcPersistedRenderCleanup(cleanupRecords: CleanupRecord[], records: SmokeRecordIds): void {
  const smokeRunId = records.smokeRunId
  if (records.creditReservationId) {
    cleanupRecords.push({ table: 'credit_reservations', id: records.creditReservationId, owned: true, smokeRunId })
  }
  if (records.creditLedgerEntryId) {
    cleanupRecords.push({ table: 'credit_ledger_entries', id: records.creditLedgerEntryId, owned: true, smokeRunId })
  }
  if (records.approvedPlanSnapshotId) {
    cleanupRecords.push({ table: 'approved_plan_snapshots', id: records.approvedPlanSnapshotId, owned: true, smokeRunId })
  }
  if (records.jobBatchId) {
    cleanupRecords.push({ table: 'job_batches', id: records.jobBatchId, owned: true, smokeRunId })
  }
  if (records.jobId) {
    cleanupRecords.push({ table: 'jobs', id: records.jobId, owned: true, smokeRunId })
  }
  if (records.workerJobClaimId) {
    cleanupRecords.push({ table: 'worker_job_claims', id: records.workerJobClaimId, owned: true, smokeRunId })
  }
  for (const jobEventId of records.jobEventIds ?? []) {
    cleanupRecords.push({ table: 'job_events', id: jobEventId, owned: true, smokeRunId })
  }
  if (records.renderJobId) {
    cleanupRecords.push({ table: 'render_jobs', id: records.renderJobId, owned: true, smokeRunId })
  }
  if (records.previewStorageObjectId) {
    cleanupRecords.push({ table: 'storage_object_records', id: records.previewStorageObjectId, owned: true, smokeRunId })
  }
  if (records.renderId) {
    cleanupRecords.push({ table: 'renders', id: records.renderId, owned: true, smokeRunId })
  }
  if (records.qaReportId) {
    cleanupRecords.push({ table: 'qa_reports', id: records.qaReportId, owned: true, smokeRunId })
  }
}

function failureResult(
  context: ServiceContext,
  code: SmokeFailureCode,
  message: string,
  input: { tableReadiness?: TableReadinessResult; cleanup?: SupabaseE2ESmokeResult['cleanup']; warnings?: string[]; details?: Record<string, unknown> } = {},
): SupabaseE2ESmokeResult {
  return {
    ok: false,
    status: 'failed',
    smokeMode: context.env.supabaseE2eSmokeMode,
    liveSupabaseConfigured: context.env.hasSupabaseAdmin,
    writesAllowed: context.env.supabaseE2eAllowWrites,
    cleanupEnabled: context.env.supabaseE2eCleanup,
    tableReadiness: input.tableReadiness,
    cleanup: input.cleanup,
    warnings: input.warnings ?? [],
    error: { code, message, details: input.details },
  }
}

function failedFromError(
  context: ServiceContext,
  error: unknown,
  tableReadiness: TableReadinessResult,
  cleanup: SupabaseE2ESmokeResult['cleanup'],
  warnings: string[],
): SupabaseE2ESmokeResult {
  if (error instanceof SupabaseSmokeError) {
    return failureResult(context, error.code, error.message, {
      tableReadiness,
      cleanup,
      warnings,
      details: error.details,
    })
  }

  return failureResult(context, 'constraint_blocked', error instanceof Error ? error.message : 'Supabase smoke failed.', {
    tableReadiness,
    cleanup,
    warnings,
  })
}

function filterRowForTable(schema: SchemaInfo, table: string, row: Record<string, unknown>): Record<string, unknown> {
  const columns = new Set((schema.columnsByTable[table] ?? KNOWN_COLUMN_HINTS[table]?.map((name) => ({ name })) ?? []).map((column) => column.name))
  return Object.fromEntries(
    Object.entries(row).filter(([key, value]) => columns.has(key) && value !== undefined),
  )
}

function hasTable(schema: SchemaInfo, table: string): boolean {
  return schema.availableTables.includes(table)
}

function smokeMetadata(smokeTag: string): Record<string, unknown> {
  return createSmokeMetadata(smokeTag, {
    rpE2eSmoke: true,
    smokeTag,
    milestone: 'RP-E2E-READY-01 Prompt 7',
  })
}

function smokeSnapshotJson(sourceStorageObjectId: string): Record<string, unknown> {
  return {
    rpE2eSmoke: true,
    executionMode: 'no_ai_basic_render_smoke',
    sourceStorageObjectId,
    approvedPlan: true,
    approvedCreditEstimate: true,
    reservedCredits: true,
    providerCallsEnabled: false,
    remotionEnabled: false,
  }
}

function futureIso(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString()
}

function storageRegion(context: ServiceContext): string | undefined {
  return ['us-east1', 'europe-west1'].includes(context.env.supabaseE2eRegion)
    ? context.env.supabaseE2eRegion
    : undefined
}

function smokeRunIdFromRow(row: Record<string, unknown>): string | undefined {
  const candidate = row.metadata_json
    ?? row.metadata
    ?? row.content_json
    ?? row.input_payload
    ?? row.render_payload
    ?? row.qa_payload
    ?? row.line_payload
    ?? row.estimate_payload
    ?? row.approval_payload
    ?? row.plan_payload
    ?? row.snapshot_json
    ?? row.snapshot_payload
    ?? row.timeline_spec
    ?? row.render_settings
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    const value = (candidate as Record<string, unknown>).smokeRunId
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}
