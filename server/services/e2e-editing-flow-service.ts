import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { resolveLocalStorageObjectPath } from '../media/local-media-paths'
import { resolveBucketName } from '../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../storage/storage-paths'
import { checkSupabaseLiveEnv } from '../supabase/live-env-readiness'
import { getLiveWriteGuardStatus } from '../supabase/live-write-guard'
import { runRlsAuthAudit } from '../supabase/rls-auth-audit'
import type { ServiceContext } from '../types'
import { runWorkerClaimRunner } from '../workers/worker-claim-runner'
import { createApprovedSnapshotService } from './approved-snapshot-service'
import { createChatService } from './chat-service'
import { createCreditGateService } from './credit-gate-service'
import { runSupabaseRpcReadinessSmoke } from './e2e-service-role-runtime-service'
import { createProjectService } from './project-service'
import { createRenderService } from './render-service'
import { checkBasicRenderSmokeTools } from './render-smoke-service'
import { runPersistedBasicRenderSmoke, runSupabaseTableReadinessSmoke } from './supabase-e2e-smoke-service'
import { createUploadService } from './upload-service'
import { createMockId, nowIso } from './service-helpers'
import type {
  E2EFlowStepResult,
  E2EFullEditingFlowRequest,
  E2EFullEditingFlowResult,
  E2EReadinessSummary,
  JSONObject,
} from '../../src/types'

export async function runLocalFullEditingFlow(
  context: ServiceContext,
  input: E2EFullEditingFlowRequest = {},
): Promise<E2EFullEditingFlowResult> {
  const startedAt = nowIso()
  const steps: E2EFlowStepResult[] = []
  const warnings: string[] = []
  const workspaceId = input.workspaceId ?? `workspace-e2e-local-${randomUUID()}`
  const idempotencyKey = input.idempotencyKey ?? `rp-e2e-local-full-${randomUUID()}`

  if (context.env.storageMode !== 'local') {
    return failedFlow('local_storage_required', 'Local full E2E flow requires STORAGE_MODE=local.', steps, startedAt, warnings)
  }

  const tools = await checkBasicRenderSmokeTools(context)
  steps.push(step('tool_readiness', tools.ready ? 'passed' : 'failed', {
    ffmpegFfprobeReady: tools.ready,
    warnings: tools.warnings,
  }))
  if (!tools.ready) {
    return failedFlow('render_tool_unavailable', 'Local full E2E flow requires available FFmpeg and FFprobe.', steps, startedAt, [
      ...warnings,
      ...tools.warnings,
    ])
  }

  try {
    const projectResult = await createProjectService(context).createProject({
      workspaceId,
      name: input.projectName ?? 'RP-E2E local full flow project',
      description: 'No-AI local full editing flow smoke project.',
    })
    const project = projectResult.project as Record<string, unknown>
    const projectId = stringValue(project.id) ?? createMockId('project')
    warnings.push(...projectResult.warnings)
    steps.push(step('create_project', 'passed', { projectId }))

    const chatResult = await createChatService(context).createChatSession({
      workspaceId,
      projectId,
      title: 'RP-E2E local full flow chat',
    })
    const chatSession = chatResult.chatSession as Record<string, unknown>
    const chatSessionId = stringValue(chatSession.id) ?? createMockId('chat_session')
    warnings.push(...chatResult.warnings)
    steps.push(step('create_chat_session', 'passed', { chatSessionId }))

    const source = await createLocalSourceFixture(context, workspaceId, projectId)
    steps.push(step('create_source_fixture', 'passed', {
      sizeBytes: source.sizeBytes,
      checksumCreated: Boolean(source.checksumSha256),
    }))

    const uploadService = createUploadService(context)
    const uploadIntentResult = await uploadService.createUploadIntent({
      workspaceId,
      projectId,
      chatSessionId,
      uploadPurpose: 'source_media',
      originalFileName: 'rp-e2e-local-source.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: source.sizeBytes,
      checksumSha256: source.checksumSha256,
    })
    warnings.push(...uploadIntentResult.warnings)
    steps.push(step('create_upload_intent', 'passed', {
      uploadIntentId: uploadIntentResult.uploadIntent.id,
      canonicalObjectPath: uploadIntentResult.uploadIntent.targetPath,
    }))

    const bytes = await readFile(source.outputPath)
    const localUpload = await uploadService.uploadLocalObject(uploadIntentResult.uploadIntent.id, bytes, 'video/mp4')
    warnings.push(...localUpload.warnings)
    steps.push(step('local_upload', 'passed', {
      sizeBytes: localUpload.localObjectUpload.sizeBytes,
      checksumCreated: Boolean(localUpload.localObjectUpload.checksumSha256),
    }))

    const finalizeResult = await uploadService.finalizeUploadIntent({
      workspaceId,
      uploadIntentId: uploadIntentResult.uploadIntent.id,
      sizeBytes: localUpload.localObjectUpload.sizeBytes,
      checksumSha256: localUpload.localObjectUpload.checksumSha256,
    })
    warnings.push(...finalizeResult.warnings)
    steps.push(step('finalize_upload', 'passed', {
      mediaAssetId: finalizeResult.mediaAsset.id,
      storageObjectRecordId: finalizeResult.storageObjectRecord.id,
      canonicalOnly: true,
    }))

    const attachmentResult = await createChatService(context).attachFinalizedClips({
      workspaceId,
      projectId,
      chatSessionId,
      mediaAssetIds: [finalizeResult.mediaAsset.id],
    })
    warnings.push(...attachmentResult.warnings)
    steps.push(step('attach_source_sequence', 'passed', {
      sourceOrderPreserved: true,
      attachmentBatchId: (attachmentResult.attachmentBatch as Record<string, unknown>).id,
    }))

    const editPlanId = createMockId('edit_plan')
    const creditEstimateId = createMockId('credit_estimate')
    const creditApprovalResult = await createCreditGateService(context).approveCreditEstimate({
      workspaceId,
      creditEstimateId,
    })
    const creditApprovalId = stringValue((creditApprovalResult.creditApproval as Record<string, unknown>).id) ?? createMockId('credit_approval')
    warnings.push(...creditApprovalResult.warnings)
    steps.push(step('approve_credit_estimate', 'passed', { creditEstimateId, creditApprovalId }))

    const creditReservationResult = await createCreditGateService(context).reserveCredits({
      workspaceId,
      projectId,
      editPlanId,
      creditEstimateId,
    })
    const creditReservationId = stringValue((creditReservationResult.creditReservation as Record<string, unknown>).id) ?? createMockId('credit_reservation')
    warnings.push(...creditReservationResult.warnings)
    steps.push(step('reserve_credits', 'passed', { creditReservationId, idempotencyKey }))

    const approvedSnapshotResult = await createApprovedSnapshotService(context).createApprovedSnapshot({
      workspaceId,
      projectId,
      chatSessionId,
      editPlanId,
      creditEstimateId,
      creditApprovalId,
      creditReservationId,
      snapshotVersion: 1,
      snapshotJson: {
        rpE2e: true,
        executionMode: 'no_ai_local_full_flow',
        sourceStorageObjectId: finalizeResult.storageObjectRecord.id,
        mediaAssetId: finalizeResult.mediaAsset.id,
        providerCallsEnabled: false,
        remotionEnabled: false,
      },
      planHash: `plan-${idempotencyKey}`,
      creditHash: `credit-${idempotencyKey}`,
      sourceSequenceHash: `source-${idempotencyKey}`,
      timingHash: `timing-${idempotencyKey}`,
    })
    const approvedSnapshotId = stringValue((approvedSnapshotResult.approvedPlanSnapshot as Record<string, unknown>).id) ?? createMockId('approved_snapshot')
    warnings.push(...approvedSnapshotResult.warnings)
    steps.push(step('create_approved_snapshot', 'passed', {
      approvedPlanSnapshotId: approvedSnapshotId,
      workersUseApprovedSnapshot: true,
    }))

    const renderJobResult = await createRenderService(context).createRenderJob({
      workspaceId,
      projectId,
      approvedPlanSnapshotId: approvedSnapshotId,
      creditReservationId,
      renderType: 'preview',
      renderQualityLevel: 'draft',
    })
    const renderJobId = stringValue((renderJobResult.renderJob as Record<string, unknown>).id) ?? createMockId('render_job')
    warnings.push(...renderJobResult.warnings)
    steps.push(step('create_render_job', 'passed', { renderJobId }))

    const workerResult = await runWorkerClaimRunner(context, {
      jobId: renderJobId,
      workspaceId,
      projectId,
      jobType: 'render_preview',
      workerType: 'basic_render_smoke_worker',
      workerInstanceId: context.env.workerInstanceId,
      idempotencyKey,
      approvedPlanSnapshotId: approvedSnapshotId,
      creditReservationId,
      storageObjectRecordId: finalizeResult.storageObjectRecord.id,
      mediaAssetId: finalizeResult.mediaAsset.id,
      payloadJson: {
        renderJobId,
        approvedPlanSnapshotId: approvedSnapshotId,
        sourceStorageObjectId: finalizeResult.storageObjectRecord.id,
        storageObjectRecordId: finalizeResult.storageObjectRecord.id,
        sourceStorageObject: {
          id: finalizeResult.storageObjectRecord.id,
          mediaAssetId: finalizeResult.mediaAsset.id,
          bucketName: finalizeResult.storageObjectRecord.bucketName,
          objectPath: finalizeResult.storageObjectRecord.objectPath,
          mimeType: finalizeResult.storageObjectRecord.mimeType,
          sizeBytes: finalizeResult.storageObjectRecord.sizeBytes,
          checksumSha256: finalizeResult.storageObjectRecord.checksumSha256,
        },
      },
    })
    warnings.push(...workerResult.warnings)
    steps.push(step('run_basic_render_worker', workerResult.status === 'completed' ? 'passed' : 'failed', {
      workerStatus: workerResult.status,
      gateChecks: workerResult.gateChecks.map((gate) => ({ gate: gate.gate, passed: gate.passed })),
    }))

    const renderSmoke = workerResult.output && typeof workerResult.output === 'object' && 'status' in workerResult.output
      ? workerResult.output as unknown as Record<string, unknown>
      : undefined
    if (workerResult.status !== 'completed' || renderSmoke?.status !== 'preview_ready') {
      return failedFlow('render_failed', 'Local full E2E worker did not produce preview_ready.', steps, startedAt, warnings, {
        workerError: workerResult.error,
      })
    }

    steps.push(step('record_preview_ready', 'passed', {
      previewStorageObjectId: stringValue(renderSmoke.previewStorageObjectId),
      qaReportId: stringValue(renderSmoke.qaReportId),
      noSignedUrlCanonicalOutput: JSON.stringify(renderSmoke).toLowerCase().includes('signed_url') === false,
    }))

    return {
      ok: true,
      status: 'preview_ready',
      mode: 'local',
      workspaceId,
      projectId,
      chatSessionId,
      uploadIntentId: uploadIntentResult.uploadIntent.id,
      mediaAssetId: finalizeResult.mediaAsset.id,
      sourceStorageObjectId: finalizeResult.storageObjectRecord.id,
      approvedPlanSnapshotId: approvedSnapshotId,
      creditReservationId,
      renderJobId,
      renderId: stringValue(renderSmoke.renderId),
      previewStorageObjectId: stringValue(renderSmoke.previewStorageObjectId),
      qaReportId: stringValue(renderSmoke.qaReportId),
      outputObjectPath: stringValue(renderSmoke.outputObjectPath),
      checksumSha256: stringValue(renderSmoke.checksumSha256),
      workerResult: toJsonObject(workerResult),
      renderSmoke: toJsonObject(renderSmoke),
      steps,
      warnings,
      providerCallsAttempted: false,
      remotionUsed: false,
      signedUrlStoredAsCanonical: false,
      startedAt,
      completedAt: nowIso(),
    }
  } catch (error) {
    return failedFlow('local_full_flow_failed', error instanceof Error ? error.message : 'Local full E2E flow failed.', steps, startedAt, warnings)
  }
}

export async function runSupabaseFullEditingFlow(context: ServiceContext): Promise<E2EFullEditingFlowResult> {
  const startedAt = nowIso()
  const steps: E2EFlowStepResult[] = []
  if (context.env.supabaseE2eSmokeMode !== 'live') {
    return skippedFlow('supabase_full_flow_disabled', 'Set SUPABASE_E2E_SMOKE_MODE=live and SUPABASE_E2E_ALLOW_WRITES=true to run Supabase full E2E flow.', steps, startedAt)
  }
  if (!context.env.supabaseE2eAllowWrites) {
    return skippedFlow('supabase_writes_disabled', 'SUPABASE_E2E_ALLOW_WRITES=true is required before Supabase full E2E flow can mutate records.', steps, startedAt)
  }

  const tableReadiness = await runSupabaseTableReadinessSmoke(context)
  steps.push(step('supabase_table_readiness', tableReadiness.ok && tableReadiness.status === 'passed' ? 'passed' : 'failed', {
    status: tableReadiness.status,
    missingTables: tableReadiness.tableReadiness?.missingTables ?? [],
  }))
  if (!tableReadiness.ok || tableReadiness.status !== 'passed') {
    return failedFlow('supabase_tables_missing', 'Supabase full E2E flow requires all runtime tables.', steps, startedAt, tableReadiness.warnings, {}, 'supabase')
  }

  const rpcReadiness = await runSupabaseRpcReadinessSmoke(context)
  steps.push(step('supabase_rpc_readiness', rpcReadiness.ok && rpcReadiness.status === 'passed' ? 'passed' : 'failed', {
    status: rpcReadiness.status,
    missingRpcs: rpcReadiness.rpcReadiness?.missingRpcs ?? [],
  }))
  if (!rpcReadiness.ok || rpcReadiness.status !== 'passed') {
    return failedFlow('supabase_rpcs_missing', 'Supabase full E2E flow requires Prompt 8/9 service-role RPCs.', steps, startedAt, rpcReadiness.warnings, {}, 'supabase')
  }

  const result = await runPersistedBasicRenderSmoke(context)
  steps.push(step('supabase_rpc_persisted_render', result.ok && result.status === 'passed' ? 'passed' : 'failed', {
    status: result.status,
    records: result.records,
  }))

  if (!result.ok || result.status !== 'passed') {
    return failedFlow(
      result.error?.code ?? 'supabase_full_flow_failed',
      result.error?.message ?? 'Supabase full E2E flow did not reach preview_ready.',
      steps,
      startedAt,
      result.warnings,
      result.error?.details ?? {},
      'supabase',
    )
  }

  return {
    ok: true,
    status: 'preview_ready',
    mode: 'supabase',
    workspaceId: result.records?.workspaceId,
    projectId: result.records?.projectId,
    chatSessionId: result.records?.chatSessionId,
    uploadIntentId: result.records?.uploadIntentId,
    mediaAssetId: result.records?.mediaAssetId,
    sourceStorageObjectId: result.records?.sourceStorageObjectId,
    approvedPlanSnapshotId: result.records?.approvedPlanSnapshotId,
    creditReservationId: result.records?.creditReservationId,
    renderJobId: result.records?.renderJobId,
    renderId: result.records?.renderId,
    previewStorageObjectId: result.records?.previewStorageObjectId,
    qaReportId: result.records?.qaReportId,
    renderSmoke: toJsonObject(result.renderSmoke),
    steps,
    warnings: result.warnings,
    providerCallsAttempted: false,
    remotionUsed: false,
    signedUrlStoredAsCanonical: false,
    startedAt,
    completedAt: nowIso(),
  }
}

export async function getE2EReadinessSummary(context: ServiceContext): Promise<E2EReadinessSummary> {
  const tools = await checkBasicRenderSmokeTools(context)
  const tableReadiness = await runSupabaseTableReadinessSmoke(context)
  const rpcReadiness = await runSupabaseRpcReadinessSmoke(context)
  const blockers: string[] = []
  if (!tools.ready) blockers.push('FFmpeg/FFprobe are required for local full E2E preview rendering.')
  if (context.env.supabaseE2eSmokeMode !== 'live') {
    blockers.push('Live Supabase full flow is disabled until SUPABASE_E2E_SMOKE_MODE=live is set.')
  } else {
    if (!tableReadiness.ok || tableReadiness.status !== 'passed') blockers.push('Supabase runtime table readiness is not passing.')
    if (!rpcReadiness.ok || rpcReadiness.status !== 'passed') blockers.push('Supabase service-role RPC readiness is not passing.')
    if (!context.env.supabaseE2eAllowWrites) blockers.push('SUPABASE_E2E_ALLOW_WRITES=true is required for live full flow writes.')
  }

  return {
    ok: tools.ready && (context.env.supabaseE2eSmokeMode !== 'live' || (tableReadiness.ok && rpcReadiness.ok && context.env.supabaseE2eAllowWrites)),
    localFullFlowReady: tools.ready && context.env.storageMode === 'local',
    supabaseFullFlowReady: context.env.supabaseE2eSmokeMode === 'live' && context.env.supabaseE2eAllowWrites && tableReadiness.ok && rpcReadiness.ok,
    providerRealCallsDisabled: true,
    remotionDisabled: true,
    storageMode: context.env.storageMode,
    toolReadiness: {
      ffmpegFfprobeReady: tools.ready,
      warnings: tools.warnings,
    },
    supabase: {
      smokeMode: context.env.supabaseE2eSmokeMode,
      writesAllowed: context.env.supabaseE2eAllowWrites,
      tableStatus: tableReadiness.status,
      rpcStatus: rpcReadiness.status,
    },
    blockers,
    warnings: [
      ...tools.warnings,
      ...tableReadiness.warnings,
      ...rpcReadiness.warnings,
    ],
  }
}

export async function getLiveSupabaseDryRun(context: ServiceContext): Promise<Record<string, unknown>> {
  const liveEnv = checkSupabaseLiveEnv(context.env, process.env)
  const tableReadiness = await runSupabaseTableReadinessSmoke(context)
  const rpcReadiness = await runSupabaseRpcReadinessSmoke(context)
  const rlsAuthAudit = await runRlsAuthAudit(context)
  const tools = await checkBasicRenderSmokeTools(context)
  const writeGuard = getLiveWriteGuardStatus(context.env)
  const blockers = [
    ...liveEnv.blockers,
    ...writeGuard.blockers,
    ...(tableReadiness.ok && tableReadiness.status === 'passed' ? [] : ['Supabase table readiness has not passed.']),
    ...(rpcReadiness.ok && rpcReadiness.status === 'passed' ? [] : ['Supabase service-role RPC readiness has not passed.']),
    ...(rlsAuthAudit.ok && rlsAuthAudit.status !== 'failed' ? [] : ['RLS/auth audit has blockers.']),
    ...(tools.ready ? [] : ['FFmpeg/FFprobe are not ready.']),
  ]

  return {
    ok: blockers.length === 0,
    checkedAt: nowIso(),
    liveEnv,
    tableReadiness,
    rpcReadiness,
    rlsAuthAudit,
    writeGuard,
    toolReadiness: {
      ffmpegFfprobeReady: tools.ready,
      warnings: tools.warnings,
    },
    providerRealCallsDisabled: true,
    remotionDisabled: true,
    livePersistedRenderCanRun: blockers.length === 0,
    blockers,
    warnings: [
      ...liveEnv.warnings,
      ...tableReadiness.warnings,
      ...rpcReadiness.warnings,
      ...rlsAuthAudit.warnings,
      ...writeGuard.warnings,
      ...tools.warnings,
    ],
  }
}

async function createLocalSourceFixture(context: ServiceContext, workspaceId: string, projectId: string): Promise<{
  outputPath: string
  sizeBytes: number
  checksumSha256: string
}> {
  const bucketName = resolveBucketName(context.env, 'worker_temp')
  const objectPath = buildCanonicalObjectPath({
    workspaceId,
    projectId,
    purpose: 'worker_temp',
    ownerId: randomUUID(),
    fileName: 'rp-e2e-local-source.mp4',
  })
  const outputPath = resolveLocalStorageObjectPath(context.env.localStorageRoot, bucketName, objectPath)
  const fixture = await createSyntheticMp4Fixture({
    outputPath,
    localStorageRoot: context.env.localStorageRoot,
    ffmpegBin: context.env.ffmpegBin,
    timeoutMs: context.env.toolCheckTimeoutMs,
  })
  if (!fixture.available || !fixture.outputPath || !fixture.sizeBytes || !fixture.checksumSha256) {
    throw new Error(`FFmpeg fixture generation failed: ${fixture.warnings.join('; ')}`)
  }

  return {
    outputPath: fixture.outputPath,
    sizeBytes: fixture.sizeBytes,
    checksumSha256: fixture.checksumSha256,
  }
}

function step(name: string, status: E2EFlowStepResult['status'], details: Record<string, unknown> = {}): E2EFlowStepResult {
  return {
    name,
    status,
    details: toJsonObject(details),
    completedAt: nowIso(),
  }
}

function failedFlow(
  code: string,
  message: string,
  steps: E2EFlowStepResult[],
  startedAt: string,
  warnings: string[] = [],
  details: Record<string, unknown> = {},
  mode: 'local' | 'supabase' = 'local',
): E2EFullEditingFlowResult {
  return {
    ok: false,
    status: 'failed',
    mode,
    steps,
    warnings,
    providerCallsAttempted: false,
    remotionUsed: false,
    signedUrlStoredAsCanonical: false,
    startedAt,
    completedAt: nowIso(),
    error: { code, message, details: toJsonObject(details) },
  }
}

function skippedFlow(code: string, message: string, steps: E2EFlowStepResult[], startedAt: string): E2EFullEditingFlowResult {
  return {
    ok: true,
    status: 'skipped',
    mode: 'supabase',
    steps,
    warnings: [],
    providerCallsAttempted: false,
    remotionUsed: false,
    signedUrlStoredAsCanonical: false,
    startedAt,
    completedAt: nowIso(),
    error: { code, message },
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function toJsonObject(value: unknown): JSONObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return JSON.parse(JSON.stringify(value)) as JSONObject
}
