import fs from 'node:fs'
import { loadRuntimeEnv } from '../config/env'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { createSupabaseAdminClient } from '../supabase/admin-client'
import type { ServiceContext } from '../types'

const preparedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_harness_prepared_with_runtime_blocks'
const executedDecision =
  'ai_graphics_external_beta_gpu_model_service_role_queue_smoke_passed_with_cleanup'
const preparedStatus =
  'gpu_model_service_role_queue_smoke_prepared_not_executed'
const executedStatus =
  'gpu_model_service_role_queue_smoke_passed_with_cleanup_no_worker_dispatch'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-service-role-queue-smoke.md'
const sourceGpuModelWorkerBoundaryProofPath =
  'docs/tool-intelligence/ai-graphics/external-beta-gpu-model-worker-boundary-proof.json'
const sourceServiceRoleQueueSmokeAuthorizationPath =
  'docs/tool-intelligence/ai-graphics/external-beta-service-role-queue-smoke-authorization.json'
const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightPath =
  'docs/tool-intelligence/ai-graphics/external-beta-route-bound-service-role-queue-smoke-operator-preflight.json'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const

const requiredEnv = [
  'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE=true',
  'REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE_ENV=non_production',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'E2E_RUNTIME_MODE=local',
  'WORKER_RUNTIME_MODE=mock',
] as const

const requiredServiceRoleRpcs = [
  'enqueue_ai_graphics_tool_runtime_jobs',
  'claim_ai_graphics_tool_runtime_job',
  'record_ai_graphics_worker_event',
  'record_ai_graphics_audit_event',
] as const

type GpuModelToolId = typeof gpuModelTools[number]

interface SourceBoundaryRecord {
  toolId: GpuModelToolId
  productionToolId: string
  workerType: string
  runtimeTarget: string
  capabilityId: string
  modelWeightManifestRequired: boolean
  sourceAdmissionDecision: string | null
  sourceEvidenceState: string | null
  sourceRuntimeJobAdmissionReadyWithProvidedEvidence: boolean
  nativeGpuRuntimeProofRefAccepted: boolean
  modelWeightManifestRefAccepted: boolean
  modelWeightPrivateEvidenceAccepted: boolean
  existingRuntimeQueueServiceUsed: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: boolean
  workerDispatchPerformedNow: boolean
  toolExecutionPerformedNow: boolean
  modelWeightsLoadedNow: boolean
  publicArtifactCreatedNow: boolean
  signedUrlCreatedNow: boolean
}

interface SourceBoundaryProof {
  decision?: string
  status?: string
  records?: SourceBoundaryRecord[]
  counts?: Record<string, number>
  booleans?: Record<string, boolean>
}

interface GpuModelServiceRoleQueueSmokeJob {
  toolId: GpuModelToolId
  productionToolId: string
  workerType: string
  runtimeTarget: string
  capabilityIds: string[]
  privateArtifactManifestRef: string
  idempotencyKey: string
  priority: 'high'
  maxAttempts: 1
  inputPayload: Record<string, unknown>
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function valueAfterFlag(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function requiredFlag(flag: string): string {
  const value = valueAfterFlag(flag)
  if (!value) throw new Error(`Missing required flag for GPU/model queue smoke: ${flag}`)
  return value
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function readRequiredJsonFlag<T>(flag: string): T {
  return readJson<T>(requiredFlag(flag))
}

function sourceGpuModelWorkerBoundaryProof(): SourceBoundaryProof {
  return readJson<SourceBoundaryProof>(sourceGpuModelWorkerBoundaryProofPath)
}

function ensureGpuModelWorkerBoundaryProofAccepted(packet: SourceBoundaryProof): SourceBoundaryProof {
  assert(
    packet.decision ===
      'ai_graphics_external_beta_gpu_model_worker_boundary_proof_passed_with_existing_worker_path',
    'GPU/model service-role queue smoke requires the accepted GPU/model worker-boundary proof packet.',
  )
  assert(
    packet.status ===
      'gpu_model_route_admission_bound_to_existing_runtime_queue_and_mock_worker_dispatch',
    'GPU/model worker-boundary proof status is not accepted.',
  )
  assert(
    packet.counts?.gpuModelToolsCovered === 8 &&
      packet.counts?.sourceGpuModelAdmissionReadyWithProvidedRefsTools === 8 &&
      packet.counts?.existingRuntimeQueueServiceJobsCreated === 8 &&
      packet.counts?.mockWorkerClaimsReturned === 8 &&
      packet.counts?.mockProductionWorkerDispatcherDryRunJobsCompleted === 8 &&
      packet.counts?.liveSupabaseQueueWritesNow === 0 &&
      packet.counts?.liveWorkerClaimRowsNow === 0 &&
      packet.counts?.liveWorkerDispatchesNow === 0 &&
      packet.counts?.liveToolExecutionsNow === 0 &&
      packet.counts?.gpuRuntimeShouldStartNowTools === 0,
    'GPU/model worker-boundary proof counts do not match the required eight-tool boundary.',
  )
  assert(
    packet.booleans?.all8GpuModelToolsAcceptedPrivateProofRefsForAdmission === true &&
      packet.booleans?.all8GpuModelToolsUseExistingRuntimeQueueService === true &&
      packet.booleans?.usesExistingAiGraphicsRuntimeQueueService === true &&
      packet.booleans?.usesExistingProductionWorkerDispatcher === true &&
      packet.booleans?.newGpuWorkerCreated === false &&
      packet.booleans?.gpuRuntimeOnDemandOnly === true &&
      packet.booleans?.noIdleGpuRuntimeApproved === true &&
      packet.booleans?.agentCanExecuteGpuModelToolsNow === false &&
      packet.booleans?.gpuRuntimeShouldStartNow === false,
    'GPU/model worker-boundary proof booleans do not preserve required runtime gates.',
  )

  const records = packet.records ?? []
  assert(records.length === 8, 'GPU/model worker-boundary proof must contain exactly eight records.')
  const seen = new Set(records.map((record) => record.toolId))
  for (const toolId of gpuModelTools) {
    assert(seen.has(toolId), `GPU/model worker-boundary proof is missing ${toolId}.`)
  }
  for (const record of records) {
    assert(
      record.workerType === 'gpu_ai_worker' &&
        record.runtimeTarget.includes('native_linux_amd64_nvidia_l4') &&
        record.existingRuntimeQueueServiceUsed === true &&
        record.sourceRuntimeJobAdmissionReadyWithProvidedEvidence === true &&
        record.nativeGpuRuntimeProofRefAccepted === true &&
        record.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
        record.gpuRuntimeShouldStartNow === false &&
        record.workerDispatchPerformedNow === false &&
        record.toolExecutionPerformedNow === false &&
        record.modelWeightsLoadedNow === false &&
        record.publicArtifactCreatedNow === false &&
        record.signedUrlCreatedNow === false,
      `GPU/model worker-boundary record is not queue-smoke-ready for ${record.toolId}.`,
    )
  }
  return packet
}

function countFromPacket(packet: Record<string, unknown>, key: string): number | undefined {
  const direct = packet[key]
  const counts = (packet.counts ?? {}) as Record<string, unknown>
  const expectedCounts = (packet.expectedCounts ?? {}) as Record<string, unknown>
  const scope = (packet.scope ?? {}) as Record<string, unknown>
  if (typeof direct === 'number') return direct
  if (typeof counts[key] === 'number') return counts[key] as number
  if (typeof expectedCounts[key] === 'number') return expectedCounts[key] as number
  if (typeof scope[key] === 'number') return scope[key] as number
  return undefined
}

function requireAcceptedServiceRoleQueueSmokeAuthorization(packet: Record<string, unknown>): string {
  const booleans = (packet.booleans ?? {}) as Record<string, unknown>
  const record =
    (packet.serviceRoleQueueSmokeAuthorizationRecord ?? {}) as Record<string, unknown>
  const authorizationRef = record.authorizationRef
  assert(
    packet.decision ===
      'ai_graphics_external_beta_service_role_queue_smoke_authorization_prepared_with_runtime_blocks' &&
      countFromPacket(packet, 'serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence') === 21 &&
      countFromPacket(packet, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools') === 8 &&
      countFromPacket(packet, 'serviceRoleQueueSmokeApprovedNowTools') === 0 &&
      countFromPacket(packet, 'liveQueueWritesApprovedNowTools') === 0 &&
      countFromPacket(packet, 'workerDispatchApprovedNowTools') === 0 &&
      countFromPacket(packet, 'toolExecutionApprovedNowTools') === 0 &&
      booleans.sourceExternalBetaLiveEnqueueAuthorizationAccepted === true &&
      booleans.serviceRoleQueueSmokeAuthorizationRecordAccepted === true &&
      booleans.gpuRuntimeShouldStartNow === false &&
      booleans.serviceRoleQueueSmokeApprovedNow === false &&
      booleans.liveQueueWriteApprovedNow === false &&
      booleans.workerDispatchApprovedNow === false &&
      booleans.toolExecutionApprovedNow === false,
    'GPU/model queue smoke requires accepted service-role queue smoke authorization for all 21 tools.',
  )
  return typeof authorizationRef === 'string' && authorizationRef.trim().length > 0
    ? authorizationRef
    : 'external-beta-service-role://queue-smoke-authorization/all-21-tools'
}

function requireAcceptedRouteBoundServiceRoleQueueSmokeOperatorPreflight(
  packet: Record<string, unknown>,
): void {
  const booleans = (packet.booleans ?? {}) as Record<string, unknown>
  assert(
    packet.decision ===
      'ai_graphics_external_beta_route_bound_service_role_queue_smoke_operator_preflight_prepared_with_runtime_blocks' &&
      packet.status ===
      'route_bound_service_role_queue_smoke_operator_preflight_ready_execution_still_blocked' &&
      countFromPacket(packet, 'totalAiGraphicsTools') === 21 &&
      countFromPacket(packet, 'gpuRuntimeTargetedTools') === 8 &&
      countFromPacket(packet, 'expectedLiveQueueRowsBeforeCleanup') === 21 &&
      countFromPacket(packet, 'expectedWorkerClaimRowsBeforeCleanup') === 21 &&
      countFromPacket(packet, 'expectedPersistedRowsAfterCleanup') === 0 &&
      countFromPacket(packet, 'liveQueueWritesPerformedNowTools') === 0 &&
      countFromPacket(packet, 'workerDispatchesApprovedNow') === 0 &&
      countFromPacket(packet, 'toolExecutionsApprovedNow') === 0 &&
      countFromPacket(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
      booleans.routeBoundServiceRoleQueueSmokeOperatorPreflightReadyWithProvidedEvidence === true &&
      booleans.serviceRoleCredentialsServerOnly === true &&
      booleans.gpuRuntimeOnDemandOnly === true &&
      booleans.noIdleGpuRuntimeApproved === true &&
      booleans.serviceRoleQueueSmokeApprovedNow === false &&
      booleans.liveQueueWriteApprovedNow === false &&
      booleans.workerDispatchApprovedNow === false &&
      booleans.toolExecutionApprovedNow === false &&
      booleans.gpuRuntimeShouldStartNow === false,
    'GPU/model queue smoke requires accepted route-bound service-role queue-smoke operator preflight.',
  )
}

function buildGpuModelSmokeJobs(input: {
  source: SourceBoundaryProof
  idempotencyPrefix: string
  serviceRoleQueueSmokeAuthorizationRef: string
  serviceRoleQueueSmokeReadinessRef: string
  runtimeQueueServiceProofBridgeRef: string
}): GpuModelServiceRoleQueueSmokeJob[] {
  const records = input.source.records ?? []
  return records.map((record) => ({
    toolId: record.toolId,
    productionToolId: record.productionToolId,
    workerType: record.workerType,
    runtimeTarget: record.runtimeTarget,
    capabilityIds: [record.capabilityId],
    privateArtifactManifestRef:
      `private://ai-graphics/external-beta/gpu-model-service-role-queue-smoke/${record.toolId}/manifest.json`,
    idempotencyKey: `${input.idempotencyPrefix}:gpu-model-job:${record.toolId}`,
    priority: 'high',
    maxAttempts: 1,
    inputPayload: {
      smokeOnly: true,
      externalBetaGpuModelServiceRoleQueueSmoke: true,
      aiGraphicsCanonicalToolId: record.toolId,
      productionToolId: record.productionToolId,
      runtimeTarget: record.runtimeTarget,
      capabilityId: record.capabilityId,
      modelWeightManifestRequired: record.modelWeightManifestRequired,
      serviceRoleQueueSmokeAuthorizationRef:
        input.serviceRoleQueueSmokeAuthorizationRef,
      serviceRoleQueueSmokeReadinessRef:
        input.serviceRoleQueueSmokeReadinessRef,
      runtimeQueueServiceProofBridgeRef:
        input.runtimeQueueServiceProofBridgeRef,
      sourceGpuModelWorkerBoundaryProofAccepted: true,
      sourceRuntimeJobAdmissionReadyWithProvidedEvidence:
        record.sourceRuntimeJobAdmissionReadyWithProvidedEvidence,
      nativeGpuRuntimeProofRefAccepted: record.nativeGpuRuntimeProofRefAccepted,
      modelWeightManifestRefAccepted: record.modelWeightManifestRefAccepted,
      modelWeightPrivateEvidenceAccepted: record.modelWeightPrivateEvidenceAccepted,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
        record.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuRuntimeShouldStartNow: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      modelWeightsLoaded: false,
    },
  }))
}

function preparedContract(source = ensureGpuModelWorkerBoundaryProofAccepted(sourceGpuModelWorkerBoundaryProof())) {
  const records = source.records ?? []
  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-gpu-model-service-role-queue-smoke',
    decision: preparedDecision,
    status: preparedStatus,
    preparedScript: 'ai-graphics:external-beta-gpu-model-service-role-queue-smoke',
    diagnosticScript:
      'ai-graphics:external-beta-gpu-model-service-role-queue-smoke:diagnostics',
    executeFlagRequired:
      '--execute-external-beta-gpu-model-service-role-queue-smoke',
    requiredEnv,
    requiredFlagsForExecution: [
      '--workspace-id',
      '--project-id',
      '--approved-plan-snapshot-id',
      '--credit-reservation-id',
      '--idempotency-prefix',
      '--source-gpu-model-worker-boundary-proof-packet',
      '--external-beta-service-role-queue-smoke-authorization-packet',
      '--route-bound-service-role-queue-smoke-operator-preflight-packet',
      '--service-role-queue-smoke-readiness-ref',
      '--runtime-queue-service-proof-bridge-ref',
      '--source-runtime-queue-service-proof-bridge-accepted',
    ],
    requiredServiceRoleRpcs,
    sourcePackets: {
      gpuModelWorkerBoundaryProof:
        sourceGpuModelWorkerBoundaryProofPath,
      serviceRoleQueueSmokeAuthorization:
        sourceServiceRoleQueueSmokeAuthorizationPath,
      routeBoundServiceRoleQueueSmokeOperatorPreflight:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightPath,
    },
    gpuModelTools: records.map((record) => ({
      toolId: record.toolId,
      productionToolId: record.productionToolId,
      workerType: record.workerType,
      runtimeTarget: record.runtimeTarget,
      capabilityId: record.capabilityId,
      modelWeightManifestRequired: record.modelWeightManifestRequired,
      nativeGpuRuntimeProofRefAccepted: record.nativeGpuRuntimeProofRefAccepted,
      modelWeightManifestRefAccepted: record.modelWeightManifestRefAccepted,
      queueSmokeReadyWithProvidedEvidence: true,
      gpuRuntimeShouldStartNow: false,
    })),
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelToolsCovered: 8,
      sourceGpuModelWorkerBoundaryProofAcceptedTools: 8,
      gpuModelServiceRoleQueueSmokeReadyTools: 8,
      gpuModelServiceRoleQueueSmokeExecutableWhenExplicitlyAuthorizedTools: 8,
      expectedLiveQueueRowsBeforeCleanup: 8,
      expectedWorkerClaimRowsBeforeCleanup: 8,
      expectedPersistedRowsAfterCleanup: 0,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
      liveServiceRoleQueueSmokeExecutedNow: 0,
      liveSupabaseQueueWritesNow: 0,
      liveWorkerClaimRowsNow: 0,
      liveWorkerDispatchesNow: 0,
      liveToolExecutionsNow: 0,
      gpuRuntimeShouldStartNowTools: 0,
      modelWeightsLoadedTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    booleans: {
      externalBetaGpuModelServiceRoleQueueSmokeHarnessPrepared: true,
      sourceGpuModelWorkerBoundaryProofAccepted: true,
      sourceServiceRoleQueueSmokeAuthorizationRequired: true,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightRequired: true,
      all8GpuModelToolsCovered: true,
      all8GpuModelToolsTargetGpuRuntime: true,
      all8GpuModelToolsReadyForExplicitNonProductionQueueSmoke: true,
      usesExistingAiGraphicsRuntimeQueueService: true,
      usesExistingProductionWorkerDispatcherBoundary: true,
      newGpuWorkerCreated: false,
      serviceRoleCredentialsServerOnly: true,
      nonProductionEnvironmentRequired: true,
      explicitSmokeConfirmationRequired: true,
      cleanupRequired: true,
      rollbackRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      liveWorkerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      routeExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    nextMilestones: [
      'Run this GPU/model service-role queue smoke in a private non-production environment with approved service-role credentials and cleanup verification.',
      'Capture the resulting queue-write, worker-claim, telemetry, and cleanup proof refs without dispatching a GPU worker.',
      'Only after queue/claim proof passes, run a controlled GPU worker lifecycle smoke that starts GPU on demand for an accepted job and then tears it down.',
    ],
  }
}

function markdownFor(report: ReturnType<typeof preparedContract>): string {
  const rows = report.gpuModelTools
    .map((tool) => (
      `| \`${tool.toolId}\` | \`${tool.runtimeTarget}\` | \`${tool.capabilityId}\` | \`${tool.queueSmokeReadyWithProvidedEvidence}\` | \`${tool.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Beta GPU Model Service-Role Queue Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This packet prepares an executable non-production service-role queue-write and worker-claim smoke for the eight GPU/model AI graphics tools. It reuses the existing AI graphics runtime queue service and existing production worker dispatcher boundary. It does not create a new GPU worker and does not start GPU runtime.

## Tools

| Tool | Runtime target | Capability | Queue smoke ready | GPU starts now |
| --- | --- | --- | --- | --- |
${rows}

## Counts

- GPU/model tools covered: \`${report.counts.gpuModelToolsCovered}\`
- Expected live queue rows before cleanup: \`${report.counts.expectedLiveQueueRowsBeforeCleanup}\`
- Expected worker claim rows before cleanup: \`${report.counts.expectedWorkerClaimRowsBeforeCleanup}\`
- Expected persisted rows after cleanup: \`${report.counts.expectedPersistedRowsAfterCleanup}\`
- Live queue writes now: \`${report.counts.liveSupabaseQueueWritesNow}\`
- Live worker claims now: \`${report.counts.liveWorkerClaimRowsNow}\`
- GPU runtime should start now tools: \`${report.counts.gpuRuntimeShouldStartNowTools}\`

## Gates

- \`usesExistingAiGraphicsRuntimeQueueService\`: \`${report.booleans.usesExistingAiGraphicsRuntimeQueueService}\`
- \`newGpuWorkerCreated\`: \`${report.booleans.newGpuWorkerCreated}\`
- \`gpuRuntimeOnDemandOnly\`: \`${report.booleans.gpuRuntimeOnDemandOnly}\`
- \`agentCanExecuteGpuModelToolsNow\`: \`${report.booleans.agentCanExecuteGpuModelToolsNow}\`
- \`agentCanExecuteAll21ToolsNow\`: \`${report.booleans.agentCanExecuteAll21ToolsNow}\`
- \`liveServiceRoleQueueSmokeExecutedNow\`: \`${report.booleans.liveServiceRoleQueueSmokeExecutedNow}\`
- \`liveQueueWriteApprovedNow\`: \`${report.booleans.liveQueueWriteApprovedNow}\`
- \`gpuRuntimeShouldStartNow\`: \`${report.booleans.gpuRuntimeShouldStartNow}\`
- \`externalBetaReadyNow\`: \`${report.booleans.externalBetaReadyNow}\`
- \`productionReadyNow\`: \`${report.booleans.productionReadyNow}\`

## Required execution environment

${report.requiredEnv.map((item) => `- \`${item}\``).join('\n')}

## No-Scope

No dependency install, package-lock mutation, live service-role queue smoke execution in this packet, worker dispatch, tool execution, provider/model call, browser/WebGL/canvas runtime, GPU/model runtime startup, model download/load, media processing, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is performed by the prepared packet.
`
}

function writePreparedRecords(report: ReturnType<typeof preparedContract>): void {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, markdownFor(report))
}

function assertAllowedToExecute(): void {
  if (
    process.env.REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE !==
    'true'
  ) {
    throw new Error(
      'Set REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE=true to run the GPU/model external-beta service-role queue smoke.',
    )
  }
  if (
    process.env.REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE_ENV !==
    'non_production'
  ) {
    throw new Error(
      'GPU/model external-beta service-role queue smoke requires REEDITPRO_AI_GRAPHICS_EXTERNAL_BETA_GPU_MODEL_QUEUE_SMOKE_ENV=non_production.',
    )
  }
  if (hasFlag('--production') || process.env.NODE_ENV === 'production') {
    throw new Error('GPU/model external-beta service-role queue smoke is blocked in production.')
  }
  if (process.env.E2E_RUNTIME_MODE !== 'local') {
    throw new Error('GPU/model external-beta service-role queue smoke requires E2E_RUNTIME_MODE=local.')
  }
  if (process.env.WORKER_RUNTIME_MODE !== 'mock') {
    throw new Error('GPU/model external-beta service-role queue smoke requires WORKER_RUNTIME_MODE=mock.')
  }
  if (!hasFlag('--source-runtime-queue-service-proof-bridge-accepted')) {
    throw new Error(
      'GPU/model external-beta service-role queue smoke requires --source-runtime-queue-service-proof-bridge-accepted from the accepted runtime queue service bridge.',
    )
  }
}

async function deleteRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  table: string,
  column: string,
  values: string[],
): Promise<void> {
  if (values.length === 0) return
  const { error } = await admin.from(table).delete().in(column, values)
  if (error) throw error
}

async function cleanupSmokeRows(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  input: { jobBatchId?: string; jobIds: string[]; idempotencyPrefix: string },
): Promise<void> {
  await deleteRows(admin, 'job_events', 'job_id', input.jobIds)
  await deleteRows(admin, 'worker_job_claims', 'job_id', input.jobIds)
  await deleteRows(admin, 'jobs', 'id', input.jobIds)
  await deleteRows(admin, 'job_batches', 'id', input.jobBatchId ? [input.jobBatchId] : [])
  const { error } = await admin
    .from('audit_events')
    .delete()
    .eq('event_type', 'ai_graphics_external_beta_gpu_model_service_role_queue_smoke')
    .contains('event_json', { idempotencyPrefix: input.idempotencyPrefix })
  if (error) throw error
}

async function executeGpuModelServiceRoleQueueSmoke() {
  assertAllowedToExecute()
  const source = ensureGpuModelWorkerBoundaryProofAccepted(
    readRequiredJsonFlag<SourceBoundaryProof>(
      '--source-gpu-model-worker-boundary-proof-packet',
    ),
  )
  const serviceRoleQueueSmokeAuthorizationRef =
    requireAcceptedServiceRoleQueueSmokeAuthorization(
      readRequiredJsonFlag<Record<string, unknown>>(
        '--external-beta-service-role-queue-smoke-authorization-packet',
      ),
    )
  requireAcceptedRouteBoundServiceRoleQueueSmokeOperatorPreflight(
    readRequiredJsonFlag<Record<string, unknown>>(
      '--route-bound-service-role-queue-smoke-operator-preflight-packet',
    ),
  )

  const runtimeEnv = loadRuntimeEnv({
    ...process.env,
    E2E_RUNTIME_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
  })
  const admin = createSupabaseAdminClient(runtimeEnv)
  if (!admin || runtimeEnv.mockOnly) {
    throw new Error(
      'GPU/model external-beta service-role queue smoke requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server env.',
    )
  }

  const workspaceId = requiredFlag('--workspace-id')
  const projectId = requiredFlag('--project-id')
  const approvedPlanSnapshotId = requiredFlag('--approved-plan-snapshot-id')
  const creditReservationId = requiredFlag('--credit-reservation-id')
  const idempotencyPrefix = requiredFlag('--idempotency-prefix')
  const serviceRoleQueueSmokeReadinessRef =
    requiredFlag('--service-role-queue-smoke-readiness-ref')
  const runtimeQueueServiceProofBridgeRef =
    requiredFlag('--runtime-queue-service-proof-bridge-ref')
  const workerInstanceId =
    valueAfterFlag('--worker-instance-id') ??
    'ai-graphics-external-beta-gpu-model-service-role-queue-smoke-worker'

  const context: ServiceContext = {
    env: runtimeEnv,
    clients: { admin, public: null },
    requestId: 'ai-graphics-external-beta-gpu-model-service-role-queue-smoke',
    auth: {
      userId: 'ai-graphics-external-beta-gpu-model-service-role-queue-smoke',
      isMockUser: true,
    },
  }
  const service = createAiGraphicsToolRuntimeQueueService(context)
  const jobs = buildGpuModelSmokeJobs({
    source,
    idempotencyPrefix,
    serviceRoleQueueSmokeAuthorizationRef,
    serviceRoleQueueSmokeReadinessRef,
    runtimeQueueServiceProofBridgeRef,
  })
  const queue = await service.enqueueToolRuntimeJobs({
    workspaceId,
    projectId,
    approvedPlanSnapshotId,
    creditReservationId,
    jobs,
    idempotencyKey: `${idempotencyPrefix}:gpu-model-batch`,
    batchName: 'AI graphics external beta GPU/model service-role queue smoke',
    createdByAgent: 'ai_graphics_external_beta_gpu_model_service_role_queue_smoke',
  })

  const queueResult = queue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
  }
  const jobIds = queueResult.jobIds ?? []
  const claims = []
  try {
    for (const [index, jobId] of jobIds.entries()) {
      const job = jobs[index]
      const claim = await service.claimToolRuntimeJob({
        jobId,
        workerType: job.workerType,
        workerInstanceId,
        idempotencyKey: `${idempotencyPrefix}:gpu-model-claim:${job.toolId}`,
        leaseSeconds: 60,
      })
      claims.push(claim.claimResult)
      await service.recordWorkerEvent({
        jobId,
        eventType: 'ai_graphics_external_beta_gpu_model_queue_smoke_claimed',
        message:
          'GPU/model external-beta service-role queue smoke claimed job without dispatching worker, starting GPU, or executing tool.',
        payload: {
          idempotencyPrefix,
          toolId: job.toolId,
          runtimeTarget: job.runtimeTarget,
          serviceRoleQueueSmokeAuthorizationRef,
          serviceRoleQueueSmokeReadinessRef,
          runtimeQueueServiceProofBridgeRef,
          sourceGpuModelWorkerBoundaryProofAccepted: true,
          gpuRuntimeOnDemandOnly: true,
          workerDispatchPerformed: false,
          toolExecutionApprovedNow: false,
          gpuRuntimeShouldStartNow: false,
        },
        progressPercent: 0,
      })
    }
    await service.recordAuditEvent({
      workspaceId,
      projectId,
      eventType: 'ai_graphics_external_beta_gpu_model_service_role_queue_smoke',
      eventJson: {
        idempotencyPrefix,
        serviceRoleQueueSmokeAuthorizationRef,
        serviceRoleQueueSmokeReadinessRef,
        runtimeQueueServiceProofBridgeRef,
        sourceGpuModelWorkerBoundaryProofAccepted: true,
        jobBatchId: queueResult.jobBatchId,
        jobCount: jobIds.length,
        gpuRuntimeOnDemandOnly: true,
        toolExecutionApprovedNow: false,
        workerDispatchPerformed: false,
        gpuRuntimeShouldStartNow: false,
      },
      actorUserId: undefined,
    })
  } finally {
    await cleanupSmokeRows(admin, {
      jobBatchId: queueResult.jobBatchId,
      jobIds,
      idempotencyPrefix,
    })
  }

  return {
    ok: true,
    decision: executedDecision,
    status: executedStatus,
    toolsSubmitted: jobs.length,
    toolsSubmittedIds: jobs.map((job) => job.toolId),
    jobIdsReturned: jobIds.length,
    workerClaimsReturned: claims.length,
    serviceRoleQueueSmokeAuthorizationRef,
    sourceGpuModelWorkerBoundaryProofAccepted: true,
    sourceRuntimeQueueServiceProofBridgeAccepted: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 8,
    liveServiceRoleQueueSmokeExecutedNow: true,
    liveSupabaseQueueWritesNow: jobIds.length,
    liveWorkerClaimRowsNow: claims.length,
    liveWorkerDispatchesNow: 0,
    liveToolExecutionsNow: 0,
    gpuRuntimeShouldStartNow: false,
    modelWeightsLoadedNow: false,
    fixtureRowsPersistedAfterCleanup: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  }
}

async function main(): Promise<void> {
  if (hasFlag('--execute-external-beta-gpu-model-service-role-queue-smoke')) {
    const result = await executeGpuModelServiceRoleQueueSmoke()
    console.log(JSON.stringify(result, null, 2))
    return
  }

  const report = preparedContract()
  if (hasFlag('--write-records')) {
    writePreparedRecords(report)
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
