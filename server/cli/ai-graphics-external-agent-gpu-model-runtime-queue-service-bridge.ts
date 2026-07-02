import fs from 'node:fs'
import { loadRuntimeEnv } from '../config/env'
import {
  createAiGraphicsToolRuntimeQueueService,
  type AiGraphicsToolRuntimeQueueJobInput,
} from '../services/ai-graphics-tool-runtime-queue-service'
import type { ServiceContext } from '../types'
import {
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

const decision =
  'ai_graphics_external_agent_gpu_model_runtime_queue_service_bridge_prepared_with_runtime_blocks'
const status =
  'external_agent_gpu_model_runtime_queue_service_bridge_ready_for_eight_tools'
const sourceGpuModelProofRefRouteCallerPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json'
const sourceRuntimeQueueServiceBridgePath =
  'docs/tool-intelligence/ai-graphics/external-beta-runtime-queue-service-bridge.json'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-runtime-queue-service-bridge.md'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

type JsonRecord = Record<string, any>

interface GpuModelProofRefCallerRow {
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  requestEnvelope: {
    workspaceId: string
    requestId: string
    toolId: AiGraphicsCanonicalToolId
    capabilityId: string
    approvedPlanSnapshotId: string
    creditReservationId: string
    privateArtifactManifestRef: string
    toolRouteApprovalRef: string
    workerApprovalRef: string
    runtimeEnqueueApprovalRef: string
    ownerRuntimeApprovalRef: string
    nativeGpuRuntimeProofRef: string
    externalBetaPerToolRuntimeProofRef: string
    modelWeightManifestRef?: string
    traceId: string
    payload?: JsonRecord
  }
  expectedWorkerType: 'gpu_ai_worker'
  modelWeightManifestRequired: boolean
  nativeGpuRuntimeProofRefRequired: true
  externalBetaPerToolRuntimeProofRefRequired: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true
  gpuRuntimeShouldStartNow: false
  toolExecutionPerformed: false
}

interface QueueBridgeRow {
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  productionToolId: string
  workerType: string
  runtimeTarget: string
  installSurface: string
  installStatus: string
  proofStatus: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  nativeGpuRuntimeProofRef: string
  modelWeightManifestRef?: string
  externalBetaPerToolRuntimeProofRef: string
  runtimeQueueJobInput: AiGraphicsToolRuntimeQueueJobInput
  mockRuntimeQueueBatchId: string
  mockRuntimeQueueJobId: string
  mockRuntimeQueueServiceUsed: true
  mockWorkerClaimId: string
  mockWorkerLeaseCreated: true
  liveQueueWritePerformed: false
  workerDispatchPerformed: false
  workerExecutionPerformed: false
  toolExecutionPerformed: false
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true
  gpuRuntimeShouldStartNow: false
  modelWeightsDownloaded: false
  modelWeightsLoaded: false
  modelInferencePerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function createMockRuntimeQueueServiceContext(): ServiceContext {
  return {
    env: loadRuntimeEnv({
      NODE_ENV: 'test',
      E2E_RUNTIME_MODE: 'mock',
      API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
      STORAGE_MODE: 'local',
      WORKER_RUNTIME_MODE: 'mock',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    }),
    clients: { admin: null, public: null },
    requestId: 'ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge',
    auth: {
      userId: 'ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge',
      isMockUser: true,
    },
  }
}

function sourceRows(source: JsonRecord): GpuModelProofRefCallerRow[] {
  const rows = source.gpuModelProofRefCallerRows ?? []
  assert(Array.isArray(rows), 'source GPU/model proof-ref caller rows are missing')
  assert(rows.length === 8, `expected 8 source GPU/model caller rows, got ${rows.length}`)

  return rows.map((row) => {
    assert(
      (gpuModelTools as readonly string[]).includes(row.toolId),
      `unexpected source GPU/model tool: ${row.toolId}`,
    )
    return row as GpuModelProofRefCallerRow
  })
}

function assertPrivateRef(value: unknown, label: string): asserts value is string {
  assert(typeof value === 'string' && value.startsWith('private://'), `${label} must be a private ref`)
  assert(!/signed.?url|public:\/\/|https?:\/\/|gcs:\/\//i.test(value), `${label} must not be public/signed/GCS`)
}

function validateSourceEvidence(
  gpuModelProofRefCaller: JsonRecord,
  runtimeQueueServiceBridge: JsonRecord,
): void {
  assert(
    gpuModelProofRefCaller.decision ===
      'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks',
    'source GPU/model proof-ref route caller decision mismatch',
  )
  assert(
    gpuModelProofRefCaller.counts?.gpuModelProofRefRouteCallerToolsNow === 8,
    'source GPU/model proof-ref route caller must cover eight tools',
  )
  assert(
    gpuModelProofRefCaller.counts?.gpuRuntimeShouldStartNowTools === 0,
    'source GPU/model proof-ref route caller must not start GPU now',
  )
  assert(
    runtimeQueueServiceBridge.decision ===
      'ai_graphics_external_beta_runtime_queue_service_bridge_prepared_with_runtime_blocks',
    'source runtime queue service bridge decision mismatch',
  )
  assert(
    runtimeQueueServiceBridge.counts?.runtimeQueueServicePayloadsReadyWithProvidedEvidence === 21,
    'source runtime queue service bridge must cover all 21 queue payloads',
  )
}

function runtimeQueueJobInput(row: GpuModelProofRefCallerRow): AiGraphicsToolRuntimeQueueJobInput {
  const readiness = getAiGraphicsToolCallReadiness(row.toolId)
  assert(readiness, `missing tool-call readiness for ${row.toolId}`)
  assert(readiness.productionToolId, `missing productionToolId for ${row.toolId}`)
  assert(readiness.productionWorkerType === 'gpu_ai_worker', `expected gpu_ai_worker for ${row.toolId}`)
  assert(readiness.gpuRequiredForRuntime === true, `expected GPU-required runtime for ${row.toolId}`)
  assert(row.requestEnvelope.toolId === row.toolId, `request tool mismatch for ${row.toolId}`)
  assert(row.requestEnvelope.capabilityId === row.capabilityId, `request capability mismatch for ${row.toolId}`)

  for (const key of [
    'privateArtifactManifestRef',
    'toolRouteApprovalRef',
    'workerApprovalRef',
    'runtimeEnqueueApprovalRef',
    'ownerRuntimeApprovalRef',
    'nativeGpuRuntimeProofRef',
    'externalBetaPerToolRuntimeProofRef',
  ] as const) {
    assertPrivateRef(row.requestEnvelope[key], `${row.toolId}.${key}`)
  }
  if (row.modelWeightManifestRequired) {
    assertPrivateRef(row.requestEnvelope.modelWeightManifestRef, `${row.toolId}.modelWeightManifestRef`)
  } else {
    assert(row.requestEnvelope.modelWeightManifestRef === undefined, `${row.toolId} should not include a model manifest ref`)
  }

  return {
    toolId: row.toolId,
    productionToolId: readiness.productionToolId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    capabilityIds: [row.capabilityId],
    privateArtifactManifestRef: row.requestEnvelope.privateArtifactManifestRef,
    idempotencyKey:
      `external-agent-gpu-model-runtime-queue-service-bridge-${row.toolId}`,
    priority: 'high',
    maxAttempts: 1,
    inputPayload: {
      sourceRouteRequestId: row.requestEnvelope.requestId,
      sourceTraceId: row.requestEnvelope.traceId,
      sourceToolRouteApprovalRef: row.requestEnvelope.toolRouteApprovalRef,
      sourceWorkerApprovalRef: row.requestEnvelope.workerApprovalRef,
      sourceRuntimeEnqueueApprovalRef:
        row.requestEnvelope.runtimeEnqueueApprovalRef,
      sourceOwnerRuntimeApprovalRef: row.requestEnvelope.ownerRuntimeApprovalRef,
      nativeGpuRuntimeProofRef: row.requestEnvelope.nativeGpuRuntimeProofRef,
      modelWeightManifestRef: row.requestEnvelope.modelWeightManifestRef,
      externalBetaPerToolRuntimeProofRef:
        row.requestEnvelope.externalBetaPerToolRuntimeProofRef,
      externalAgentGpuModelRuntimeQueueServiceBridge: true,
      gpuRuntimeOnDemandOnly: true,
      gpuRuntimeShouldStartNow: false,
      liveQueueWritePerformed: false,
      workerDispatchPerformed: false,
      workerExecutionPerformed: false,
      toolExecutionPerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

async function bridgeRow(
  service: ReturnType<typeof createAiGraphicsToolRuntimeQueueService>,
  row: GpuModelProofRefCallerRow,
): Promise<QueueBridgeRow> {
  const readiness = getAiGraphicsToolCallReadiness(row.toolId)
  assert(readiness?.productionToolId, `missing production readiness for ${row.toolId}`)

  const jobInput = runtimeQueueJobInput(row)
  const enqueueResult = await service.enqueueToolRuntimeJobs({
    workspaceId: row.requestEnvelope.workspaceId,
    projectId:
      `project-ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge-${row.toolId}`,
    approvedPlanSnapshotId: row.requestEnvelope.approvedPlanSnapshotId,
    creditReservationId: row.requestEnvelope.creditReservationId,
    jobs: [jobInput],
    idempotencyKey:
      `batch-external-agent-gpu-model-runtime-queue-service-bridge-${row.toolId}`,
    batchName:
      `AI graphics external agent GPU/model queue bridge ${row.toolId}`,
    createdByAgent:
      'ai_graphics_external_agent_gpu_model_runtime_queue_service_bridge',
  })

  const mockJobId = String(enqueueResult.queueResult.jobIds?.[0] ?? '')
  assert(mockJobId, `mock queue job id missing for ${row.toolId}`)
  assert(enqueueResult.queueResult.mockOnly === true, `queue result must be mock-only for ${row.toolId}`)

  const claimResult = await service.claimToolRuntimeJob({
    jobId: mockJobId,
    workerType: readiness.productionWorkerType,
    workerInstanceId:
      `mock-worker-ai-graphics-external-agent-gpu-model-${row.toolId}`,
    idempotencyKey:
      `claim-external-agent-gpu-model-runtime-queue-service-bridge-${row.toolId}`,
    leaseSeconds: 300,
  })
  assert(claimResult.claimResult.mockOnly === true, `worker claim must be mock-only for ${row.toolId}`)

  return {
    toolId: row.toolId,
    capabilityId: row.capabilityId,
    productionToolId: readiness.productionToolId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    installSurface: readiness.installSurface,
    installStatus: readiness.installStatus,
    proofStatus: readiness.proofStatus,
    approvedPlanSnapshotId: row.requestEnvelope.approvedPlanSnapshotId,
    creditReservationId: row.requestEnvelope.creditReservationId,
    privateArtifactManifestRef: row.requestEnvelope.privateArtifactManifestRef,
    nativeGpuRuntimeProofRef: row.requestEnvelope.nativeGpuRuntimeProofRef,
    modelWeightManifestRef: row.requestEnvelope.modelWeightManifestRef,
    externalBetaPerToolRuntimeProofRef:
      row.requestEnvelope.externalBetaPerToolRuntimeProofRef,
    runtimeQueueJobInput: jobInput,
    mockRuntimeQueueBatchId: String(enqueueResult.queueResult.jobBatchId),
    mockRuntimeQueueJobId: mockJobId,
    mockRuntimeQueueServiceUsed: true,
    mockWorkerClaimId: String(claimResult.claimResult.workerClaimId),
    mockWorkerLeaseCreated: true,
    liveQueueWritePerformed: false,
    workerDispatchPerformed: false,
    workerExecutionPerformed: false,
    toolExecutionPerformed: false,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true,
    gpuRuntimeShouldStartNow: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

async function buildReport() {
  const gpuModelProofRefCaller = readJson(sourceGpuModelProofRefRouteCallerPath)
  const runtimeQueueServiceBridge = readJson(sourceRuntimeQueueServiceBridgePath)
  validateSourceEvidence(gpuModelProofRefCaller, runtimeQueueServiceBridge)

  const service = createAiGraphicsToolRuntimeQueueService(
    createMockRuntimeQueueServiceContext(),
  )
  const rows = []
  for (const row of sourceRows(gpuModelProofRefCaller)) {
    rows.push(await bridgeRow(service, row))
  }

  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-agent-gpu-model-runtime-queue-service-bridge',
    decision,
    status,
    summary:
      'Binds the eight external-agent GPU/model proof-ref route caller envelopes to the existing AI graphics runtime queue service in mock-only mode, creating one mock queue job and one mock worker lease per tool. This proves queue-service shape and canonical worker/runtime targeting without live queue writes, worker dispatch, tool execution, model loading, GPU startup, signed URLs, public artifacts, external beta readiness, or production readiness.',
    sourceEvidence: {
      gpuModelProofRefRouteCaller: {
        path: sourceGpuModelProofRefRouteCallerPath,
        decision: gpuModelProofRefCaller.decision,
        accepted: true,
      },
      runtimeQueueServiceBridge: {
        path: sourceRuntimeQueueServiceBridgePath,
        decision: runtimeQueueServiceBridge.decision,
        accepted: true,
      },
    },
    interfaces: {
      packageScript:
        'ai-graphics:external-agent-gpu-model-runtime-queue-service-bridge',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-runtime-queue-service-bridge:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-runtime-queue-service-bridge-diagnostics.mjs',
      existingRuntimeQueueService:
        'server/services/ai-graphics-tool-runtime-queue-service.ts',
      sourceCallerPacket: sourceGpuModelProofRefRouteCallerPath,
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      gpuModelRuntimeQueueServiceBridgeToolsNow: rows.length,
      sourceGpuModelProofRefRouteCallerTools: 8,
      sourceRuntimeQueueServicePayloadsReadyWithProvidedEvidence: 21,
      mockRuntimeQueueServiceBatchesCreated: rows.length,
      mockRuntimeQueueServiceJobsCreated: rows.length,
      mockWorkerClaimsCreated: rows.length,
      toolsValidatedThroughCanonicalReadiness: rows.length,
      gpuModelRuntimeTargetedTools: rows.filter((row) => (
        row.workerType === 'gpu_ai_worker' &&
        row.runtimeTarget.startsWith('native_linux_amd64_nvidia_l4')
      )).length,
      liveQueueWritePerformedTools: 0,
      workerDispatchPerformedTools: 0,
      workerExecutionPerformedTools: 0,
      toolExecutionPerformedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      modelWeightsDownloadedTools: 0,
      modelWeightsLoadedTools: 0,
      modelInferencePerformedTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    queueBridgeRows: rows,
    booleans: {
      externalAgentGpuModelRuntimeQueueServiceBridgePrepared: true,
      sourceGpuModelProofRefRouteCallerAccepted: true,
      sourceRuntimeQueueServiceBridgeAccepted: true,
      all8GpuModelProofRefRouteCallerRowsQueuedThroughRuntimeService: true,
      all8MockRuntimeQueueJobsCreated: true,
      all8MockWorkerClaimsCreated: true,
      all8ToolsValidatedThroughCanonicalReadiness: true,
      usesExistingAiGraphicsRuntimeQueueService: true,
      usesExistingRuntimeQueueServiceValidation: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForAcceptedExternalBetaToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanSubmitGpuModelToolCallToRuntimeQueueAdmissionNow: true,
      agentCanClaimMockGpuModelWorkerLeaseNow: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      routeExecutionPerformedInThisLane: false,
      backendQueueSubmissionApprovedNow: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformed: false,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
    nextRequiredImplementationStep:
      'turn the eight mock runtime queue jobs into an explicitly authorized non-production service-role queue write, then attach real worker claim and native model-runtime proof while preserving GPU startup only after an accepted job claim',
  }
}

function makeMarkdown(report: Awaited<ReturnType<typeof buildReport>>): string {
  const rows = report.queueBridgeRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.capabilityId}\` | \`${row.productionToolId}\` | \`${row.workerType}\` | \`${row.runtimeTarget}\` | ${row.mockRuntimeQueueServiceUsed} | ${row.mockWorkerLeaseCreated} | ${row.gpuRuntimeShouldStartNow} | ${row.toolExecutionPerformed} |`
    ))
    .join('\n')

  return `# AI Graphics External Agent GPU Model Runtime Queue Service Bridge

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This bridge binds the eight external-agent GPU/model proof-ref request envelopes to the existing AI graphics runtime queue service. It creates mock-only runtime queue jobs and mock worker leases for the eight GPU/model tools, using the canonical production tool id, worker type, runtime target, private artifact manifest, approved snapshot, credit reservation, and private proof refs from the source caller packet.

It does not perform live queue writes, route execution, worker dispatch, tool execution, model loading, GPU runtime startup, signed URLs, public artifacts, external beta readiness, or production readiness. GPU remains cold until a later accepted live worker job claim starts it on demand.

## Queue bridge rows

| Tool | Capability | Production tool | Worker | Runtime target | Mock queue service | Mock worker lease | GPU starts now | Tool execution |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next implementation step

${report.nextRequiredImplementationStep}
`
}

async function main() {
  const report = await buildReport()
  if (process.argv.includes('--write-records')) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
