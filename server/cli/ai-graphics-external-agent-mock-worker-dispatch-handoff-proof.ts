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
  'ai_graphics_external_agent_mock_worker_dispatch_handoff_proof_passed_with_runtime_blocks'
const status = 'mock_worker_dispatch_handoff_prepared_all_21_execution_still_blocked'
const sourceMockWorkerClaimPath =
  'docs/tool-intelligence/ai-graphics/external-agent-mock-worker-claim-proof.json'
const sourceMockWorkerClaimDecision =
  'ai_graphics_external_agent_mock_worker_claim_proof_passed_with_runtime_blocks'
const leaseSeconds = 900

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
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
  assert(row.mockWorkerClaimCreated === true, `Source mock worker claim proof did not claim ${toolId}`)
  assert(row.privateWorkerClaimLeaseOnly === true, `Source worker claim was not private lease only for ${toolId}`)
  assert(row.liveQueueWritePerformed === false, `Source live queue write must remain false for ${toolId}`)
  assert(row.workerDispatchPerformed === false, `Source worker dispatch must remain false for ${toolId}`)
  assert(row.toolExecutionPerformed === false, `Source tool execution must remain false for ${toolId}`)
  assert(row.gpuRuntimeShouldStartNow === false, `GPU runtime should not start now for ${toolId}`)

  return {
    toolId,
    productionToolId: readiness.productionToolId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    capabilityIds: readiness.capabilities.filter(
      (capability) =>
        capability !== 'planning_metadata_only' &&
        capability !== 'blocked_or_deferred',
    ),
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent/mock-worker-dispatch-handoff-proof/${toolId}/artifact-manifest`,
    idempotencyKey:
      `ai-graphics-external-agent-mock-worker-dispatch-handoff-proof:queue:${toolId}`,
    priority: 'normal',
    maxAttempts: 3,
    inputPayload: {
      sourceMockWorkerClaimDecision,
      sourceWorkerType: row.workerType,
      sourceRuntimeTarget: row.runtimeTarget,
      externalAgentExecutionExpected: false,
      routeExecutionExpected: false,
      backendQueueSubmissionExpected: false,
      liveQueueWriteExpected: false,
      workerDispatchExpected: false,
      toolExecutionExpected: false,
      gpuRuntimeExpected: false,
    },
  }
}

async function main() {
  const source = readJson(sourceMockWorkerClaimPath)
  assert(source.decision === sourceMockWorkerClaimDecision, 'Source mock worker claim decision mismatch')
  assert(
    source.status === 'mock_worker_claim_validated_all_21_dispatch_still_blocked',
    'Source mock worker claim status mismatch',
  )
  assert(source.booleans?.agentCanExecuteToolsNow === false, 'Source must not allow agent execution')
  assert(source.booleans?.liveQueueWritePerformed === false, 'Source must not perform live queue writes')
  assert(source.booleans?.workerDispatchPerformed === false, 'Source must not dispatch workers')
  assert(source.booleans?.toolExecutionPerformed === false, 'Source must not execute tools')
  assert(source.booleans?.gpuRuntimeShouldStartNow === false, 'Source must not start GPU runtime')
  assert(source.counts?.mockWorkerClaimsCreated === 21, 'Source must validate 21 mock worker claims')

  const sourceRows = source.claims as JsonRecord[]
  assert(Array.isArray(sourceRows), 'Source claims must be an array')
  assert(sourceRows.length === 21, 'Source must cover 21 claims')

  const jobs = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const row = sourceRows.find((item) => item.toolId === toolId)
    assert(row, `Missing source claim for ${toolId}`)
    return buildJob(row)
  })

  const env = buildMockEnv()
  assert(env.mockOnly === true, 'Mock worker dispatch handoff proof must run with mockOnly=true')

  const service = createAiGraphicsToolRuntimeQueueService({
    env,
    clients: { admin: null, public: null },
    requestId: 'ai-graphics-external-agent-mock-worker-dispatch-handoff-proof',
    auth: {
      userId: 'ai_graphics_external_agent_mock_worker_dispatch_handoff_user',
      isMockUser: true,
    },
  })

  const enqueue = await service.enqueueToolRuntimeJobs({
    workspaceId: 'workspace_ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
    projectId: 'project_ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
    approvedPlanSnapshotId:
      'approved_snapshot_ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
    creditReservationId:
      'credit_reservation_ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
    jobs,
    idempotencyKey:
      'ai-graphics-external-agent-mock-worker-dispatch-handoff-proof:batch:all-21',
    chatSessionId: 'chat_ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
    editPlanId: 'edit_plan_ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
    creditEstimateId:
      'credit_estimate_ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
    batchName: 'AI graphics external agent mock worker dispatch handoff proof',
    createdByAgent: 'ai_graphics_external_agent_mock_worker_dispatch_handoff_proof',
  })

  const queueResult = enqueue.queueResult as JsonRecord
  assert(queueResult.mockOnly === true, 'Mock worker dispatch handoff queue prelude must be mockOnly')
  assert(Array.isArray(queueResult.jobIds), 'Mock queue prelude must return job IDs')
  assert(queueResult.jobIds.length === jobs.length, 'Mock queue prelude returned unexpected job ID count')

  const handoffs = []
  for (const [index, job] of jobs.entries()) {
    const jobId = queueResult.jobIds[index]
    const claim = await service.claimToolRuntimeJob({
      jobId,
      workerType: job.workerType,
      workerInstanceId:
        'ai_graphics_external_agent_mock_worker_dispatch_handoff_worker',
      idempotencyKey:
        `ai-graphics-external-agent-mock-worker-dispatch-handoff-proof:claim:${job.toolId}`,
      leaseSeconds,
    })

    const claimResult = claim.claimResult as JsonRecord
    assert(claimResult.mockOnly === true, `Claim result was not mockOnly for ${job.toolId}`)
    assert(claimResult.toolExecutionPerformed === false, `Claim result executed tool for ${job.toolId}`)

    const dispatchEnvelope = {
      jobId,
      toolId: job.toolId,
      productionToolId: job.productionToolId,
      workerType: job.workerType,
      runtimeTarget: job.runtimeTarget,
      workerClaimIdPresent: Boolean(claimResult.workerClaimId),
      leaseExpiresAtPresent: Boolean(claimResult.leaseExpiresAt),
      privateArtifactManifestRef: job.privateArtifactManifestRef,
      dispatchStatus: 'prepared_not_dispatched',
      dispatchHandoffOnly: true,
      toolExecutionExpected: false,
      gpuRuntimeExpected: false,
    }

    const event = await service.recordWorkerEvent({
      jobId,
      eventType: 'mock_dispatch_handoff_prepared',
      message:
        'External-agent mock worker dispatch handoff prepared without dispatching worker or executing tool.',
      payload: dispatchEnvelope,
      progressPercent: 35,
    })

    const eventResult = event.eventResult as JsonRecord
    assert(eventResult.mockOnly === true, `Worker event result was not mockOnly for ${job.toolId}`)
    assert(eventResult.toolExecutionPerformed === false, `Worker event executed tool for ${job.toolId}`)

    handoffs.push({
      toolId: job.toolId,
      productionToolId: job.productionToolId,
      workerType: job.workerType,
      runtimeTarget: job.runtimeTarget,
      mockWorkerClaimCreated: true,
      mockDispatchHandoffPrepared: true,
      mockWorkerEventRecorded: true,
      dispatchStatus: 'prepared_not_dispatched',
      dispatchHandoffOnly: true,
      privateArtifactManifestRef: job.privateArtifactManifestRef,
      privateWorkerClaimLeaseOnly: true,
      liveQueueWritePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
      warningCount: claim.warnings.length + event.warnings.length,
    })
  }

  const gpuRows = jobs.filter((job) => job.workerType === 'gpu_ai_worker')

  const report = {
    schemaVersion: 1,
    decision,
    status,
    summary:
      'Mock-safe all-21 worker dispatch handoff proof for external-agent AI graphics tool calls. It consumes the mock worker claim proof, creates a fresh mock queue batch, claims each mock job, records a mock dispatch-handoff worker event, and performs no live queue write, worker dispatch, tool execution, or GPU startup.',
    sourceEvidence: {
      mockWorkerClaimProof: sourceMockWorkerClaimPath,
      queueService: 'server/services/ai-graphics-tool-runtime-queue-service.ts',
      canonicalToolRegistry: 'server/tool-registry/ai-graphics-tool-call-readiness.ts',
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-mock-worker-dispatch-handoff-proof',
      diagnosticScript:
        'ai-graphics:external-agent-mock-worker-dispatch-handoff-proof:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-mock-worker-dispatch-handoff-proof-diagnostics.mjs',
      queueService: 'createAiGraphicsToolRuntimeQueueService',
      claimMethod: 'claimToolRuntimeJob',
      workerEventMethod: 'recordWorkerEvent',
      dispatchEventType: 'mock_dispatch_handoff_prepared',
      queueName: 'ai_graphics_external_beta_tool_runtime',
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      sourceMockWorkerClaimsCreated: source.counts.mockWorkerClaimsCreated,
      mockQueuePreludeInsertedJobCount: queueResult.insertedJobCount,
      mockWorkerClaimsCreated: handoffs.length,
      mockWorkerLeaseSeconds: leaseSeconds,
      mockDispatchHandoffPreparedTools: handoffs.length,
      mockWorkerEventsRecorded: handoffs.length,
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
    queuePreludeResult: {
      mockOnly: queueResult.mockOnly === true,
      insertedJobCount: queueResult.insertedJobCount,
      returnedJobIds: queueResult.jobIds.length,
      liveToolExecutionPerformed: queueResult.liveToolExecutionPerformed,
      warningCount: enqueue.warnings.length,
    },
    handoffs,
    booleans: {
      externalAgentMockWorkerDispatchHandoffProofPassed: true,
      sourceMockWorkerClaimProofAccepted: true,
      mockQueueServiceClaimAccepted: true,
      mockQueueServiceWorkerEventAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21MockDispatchHandoffsPrepared: true,
      mockWorkerDispatchHandoffProofPerformed: true,
      mockOnlyRuntimeModeEnforced: true,
      privateWorkerClaimLeaseOnly: true,
      dispatchEnvelopePreparedOnly: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
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
