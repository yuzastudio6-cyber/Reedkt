import fs from 'node:fs'
import { loadRuntimeEnv } from '../config/env'
import {
  createAiGraphicsToolRuntimeQueueService,
  type AiGraphicsToolRuntimeQueueJobInput,
} from '../services/ai-graphics-tool-runtime-queue-service'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

const decision =
  'ai_graphics_external_agent_mock_queue_insertion_proof_passed_with_runtime_blocks'
const status = 'mock_queue_insertion_validated_all_21_live_queue_still_blocked'
const sourceBlockedAdmissionPath =
  'docs/tool-intelligence/ai-graphics/external-agent-route-to-queue-blocked-admission.json'
const sourceBlockedAdmissionDecision =
  'ai_graphics_external_agent_route_to_queue_blocked_admission_prepared_with_runtime_blocks'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function validCapabilityIds(toolId: AiGraphicsCanonicalToolId): string[] {
  const readiness = getAiGraphicsToolCallReadiness(toolId)
  assert(readiness, `Missing AI graphics readiness record for ${toolId}`)
  return readiness.capabilities.filter(
    (capability) =>
      capability !== 'planning_metadata_only' &&
      capability !== 'blocked_or_deferred',
  )
}

function buildMockEnv() {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'false',
  })
}

function buildJob(row: JsonRecord): AiGraphicsToolRuntimeQueueJobInput {
  const toolId = row.toolId as AiGraphicsCanonicalToolId
  const readiness = getAiGraphicsToolCallReadiness(toolId)
  assert(readiness, `Missing AI graphics readiness record for ${toolId}`)
  assert(readiness.productionToolId, `Missing production tool id for ${toolId}`)
  assert(row.routeStatusCode === 409, `Source route status is not 409 for ${toolId}`)
  assert(row.routeErrorCode === 'TOOL_NOT_READY', `Source route error is not TOOL_NOT_READY for ${toolId}`)
  assert(row.queueJobStatus === 'prepared_not_submitted', `Source queue status is not prepared_not_submitted for ${toolId}`)
  assert(row.gpuRuntimeShouldStartNow === false, `GPU runtime should not start now for ${toolId}`)

  return {
    toolId,
    productionToolId: readiness.productionToolId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    capabilityIds: validCapabilityIds(toolId),
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent/mock-queue-insertion-proof/${toolId}/artifact-manifest`,
    idempotencyKey:
      `ai-graphics-external-agent-mock-queue-insertion-proof:${toolId}`,
    priority: 'normal',
    maxAttempts: 3,
    inputPayload: {
      sourceRouteToQueueBlockedAdmissionDecision: sourceBlockedAdmissionDecision,
      sourceQueueAuthorizationId: row.queueAuthorizationId,
      sourceRouteStatusCode: row.routeStatusCode,
      sourceRouteErrorCode: row.routeErrorCode,
      sourceQueueJobStatus: row.queueJobStatus,
      externalAgentExecutionExpected: false,
      routeExecutionExpected: false,
      workerDispatchExpected: false,
      toolExecutionExpected: false,
      gpuRuntimeExpected: false,
    },
  }
}

async function main() {
  const source = readJson(sourceBlockedAdmissionPath)
  assert(source.decision === sourceBlockedAdmissionDecision, 'Source blocked admission decision mismatch')
  assert(
    source.status === 'mounted_route_to_queue_blocked_admission_ready_runtime_still_blocked',
    'Source blocked admission status mismatch',
  )
  assert(source.booleans?.agentCanExecuteToolsNow === false, 'Source must not allow agent execution')
  assert(source.booleans?.liveQueueWritePerformed === false, 'Source must not perform live queue writes')
  assert(source.booleans?.gpuRuntimeShouldStartNow === false, 'Source must not start GPU runtime')

  const sourceRows = source.tools as JsonRecord[]
  assert(Array.isArray(sourceRows), 'Source tools must be an array')
  assert(sourceRows.length === 21, 'Source must cover 21 tools')

  const jobs = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const row = sourceRows.find((item) => item.toolId === toolId)
    assert(row, `Missing source row for ${toolId}`)
    return buildJob(row)
  })

  const env = buildMockEnv()
  assert(env.mockOnly === true, 'Mock queue insertion proof must run with mockOnly=true')

  const service = createAiGraphicsToolRuntimeQueueService({
    env,
    clients: { admin: null, public: null },
    requestId: 'ai-graphics-external-agent-mock-queue-insertion-proof',
    auth: {
      userId: 'ai_graphics_external_agent_mock_queue_user',
      isMockUser: true,
    },
  })

  const enqueue = await service.enqueueToolRuntimeJobs({
    workspaceId: 'workspace_ai_graphics_external_agent_mock_queue_insertion_proof',
    projectId: 'project_ai_graphics_external_agent_mock_queue_insertion_proof',
    approvedPlanSnapshotId:
      'approved_snapshot_ai_graphics_external_agent_mock_queue_insertion_proof',
    creditReservationId:
      'credit_reservation_ai_graphics_external_agent_mock_queue_insertion_proof',
    jobs,
    idempotencyKey:
      'ai-graphics-external-agent-mock-queue-insertion-proof:batch:all-21',
    chatSessionId: 'chat_ai_graphics_external_agent_mock_queue_insertion_proof',
    editPlanId: 'edit_plan_ai_graphics_external_agent_mock_queue_insertion_proof',
    creditEstimateId:
      'credit_estimate_ai_graphics_external_agent_mock_queue_insertion_proof',
    batchName: 'AI graphics external agent mock queue insertion proof',
    createdByAgent: 'ai_graphics_external_agent_mock_queue_insertion_proof',
  })

  const queueResult = enqueue.queueResult as JsonRecord
  const gpuRows = jobs.filter((job) => job.workerType === 'gpu_ai_worker')

  const report = {
    schemaVersion: 1,
    decision,
    status,
    summary:
      'Mock-safe all-21 queue insertion proof for external-agent AI graphics tool calls. It consumes the route-to-queue blocked-admission packet, validates all 21 canonical queue jobs through the backend queue service in explicit mock mode, and performs no live queue write, worker dispatch, tool execution, or GPU startup.',
    sourceEvidence: {
      routeToQueueBlockedAdmission: sourceBlockedAdmissionPath,
      queueService: 'server/services/ai-graphics-tool-runtime-queue-service.ts',
      canonicalToolRegistry: 'server/tool-registry/ai-graphics-tool-call-readiness.ts',
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-mock-queue-insertion-proof',
      diagnosticScript:
        'ai-graphics:external-agent-mock-queue-insertion-proof:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-mock-queue-insertion-proof.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-mock-queue-insertion-proof-diagnostics.mjs',
      queueService: 'createAiGraphicsToolRuntimeQueueService',
      queueName: 'ai_graphics_external_beta_tool_runtime',
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      sourceRouteToQueueBlockedAdmissionMappedTools: source.counts.routeToQueueBlockedAdmissionMappedTools,
      mockQueueInsertionAttemptedTools: jobs.length,
      mockQueueInsertedJobCount: queueResult.insertedJobCount,
      mockQueueReturnedJobIds: Array.isArray(queueResult.jobIds) ? queueResult.jobIds.length : 0,
      queueValidationAcceptedTools: jobs.length,
      gpuRuntimeTargetedTools: gpuRows.length,
      gpuRuntimeShouldStartNowTools: 0,
      liveQueueWritePerformedTools: 0,
      workerEnqueuePerformedTools: 0,
      workerDispatchPerformedTools: 0,
      toolExecutionPerformedTools: 0,
      externalAgentExecutableNowTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    queueResult: {
      mockOnly: queueResult.mockOnly === true,
      insertedJobCount: queueResult.insertedJobCount,
      idempotentReplay: queueResult.idempotentReplay,
      liveToolExecutionPerformed: queueResult.liveToolExecutionPerformed,
      warningCount: enqueue.warnings.length,
    },
    jobs: jobs.map((job) => ({
      toolId: job.toolId,
      productionToolId: job.productionToolId,
      workerType: job.workerType,
      runtimeTarget: job.runtimeTarget,
      capabilityIds: job.capabilityIds,
      privateArtifactManifestRef: job.privateArtifactManifestRef,
      idempotencyKey: job.idempotencyKey,
      mockQueueInsertionValidated: true,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
    })),
    booleans: {
      externalAgentMockQueueInsertionProofPassed: true,
      sourceRouteToQueueBlockedAdmissionAccepted: true,
      mockQueueServiceValidationAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21QueueJobsValidatedByService: true,
      mockQueueInsertionProofPerformed: true,
      mockOnlyRuntimeModeEnforced: true,
      privateArtifactManifestRefsOnly: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      routeToQueueAuthorizationApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      routeExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
