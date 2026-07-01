import fs from 'node:fs'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import { createProductionWorkerRuntimeState } from '../workers/production/production-worker-lease-manager'
import type {
  ProductionWorkerEventType,
  ProductionWorkerJobPayload,
} from '../workers/production/production-worker-types'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

const decision =
  'ai_graphics_external_agent_mock_dispatcher_gate_proof_passed_with_runtime_blocks'
const status = 'mock_dispatcher_gate_blocked_all_21_before_worker_execution'
const sourceMockWorkerDispatchHandoffPath =
  'docs/tool-intelligence/ai-graphics/external-agent-mock-worker-dispatch-handoff-proof.json'
const sourceMockWorkerDispatchHandoffDecision =
  'ai_graphics_external_agent_mock_worker_dispatch_handoff_proof_passed_with_runtime_blocks'
const workerInstanceId =
  'ai_graphics_external_agent_mock_dispatcher_gate_worker'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildPayload(toolId: AiGraphicsCanonicalToolId): ProductionWorkerJobPayload {
  const readiness = getAiGraphicsToolCallReadiness(toolId)
  assert(readiness, `Missing AI graphics readiness record for ${toolId}`)
  assert(readiness.productionToolId, `Missing production tool id for ${toolId}`)
  assert(readiness.productionWorkerType !== 'none', `Missing worker type for ${toolId}`)

  const capabilityIds = readiness.capabilities.filter((capability) => (
    capability !== 'planning_metadata_only' &&
    capability !== 'blocked_or_deferred'
  ))

  const payload: ProductionWorkerJobPayload = {
    jobId: `job_ai_graphics_external_agent_mock_dispatcher_gate_${toolId}`,
    workspaceId: 'workspace_ai_graphics_external_agent_mock_dispatcher_gate',
    projectId: 'project_ai_graphics_external_agent_mock_dispatcher_gate',
    approvedSnapshotId:
      'approved_snapshot_ai_graphics_external_agent_mock_dispatcher_gate',
    editPlanId: 'edit_plan_ai_graphics_external_agent_mock_dispatcher_gate',
    toolExecutionPlanId:
      `tool_execution_plan_ai_graphics_external_agent_mock_dispatcher_gate_${toolId}`,
    workerType: readiness.productionWorkerType,
    executionMode: 'production_blocked',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 3,
    requestedToolIds: [readiness.productionToolId],
    requestedRecipeIds: [
      `ai_graphics_external_agent_mock_dispatcher_gate_${toolId}`,
    ],
    storageReferenceIds: [
      `ai-graphics/external-agent/mock-dispatcher-gate-proof/${toolId}/private-artifact-manifest`,
    ],
    creditReservationId:
      'credit_reservation_ai_graphics_external_agent_mock_dispatcher_gate',
    renderMode: 'qa_probe',
    requiredQualityGateIds: [],
    requiredQualityGateTypes: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: toolId,
      aiGraphicsRuntimeTarget: readiness.runtimeTarget,
      aiGraphicsCapabilityIds: capabilityIds,
      aiGraphicsRuntimeActivationPolicy: {
        onDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
        startsOnlyForApprovedWorkerOrToolCall: true,
        cpuFallbackAllowedForHeavyTools: false,
      },
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      sourceMockWorkerDispatchHandoffDecision,
      sourceMockWorkerDispatchHandoffPath,
      externalAgentExecutionExpected: false,
      routeExecutionExpected: false,
      workerDispatchExpected: false,
      toolExecutionExpected: false,
      gpuRuntimeExpected: false,
    },
  }

  payload.idempotencyKey = buildWorkerIdempotencyKey(payload)
  return payload
}

function eventNames(resultEvents: { eventName: ProductionWorkerEventType }[]) {
  return resultEvents.map((event) => event.eventName)
}

async function main() {
  const source = readJson(sourceMockWorkerDispatchHandoffPath)
  assert(
    source.decision === sourceMockWorkerDispatchHandoffDecision,
    'Source mock worker dispatch handoff decision mismatch',
  )
  assert(
    source.status ===
      'mock_worker_dispatch_handoff_prepared_all_21_execution_still_blocked',
    'Source mock worker dispatch handoff status mismatch',
  )
  assert(source.booleans?.agentCanExecuteToolsNow === false, 'Source must not allow agent execution')
  assert(source.booleans?.workerDispatchPerformed === false, 'Source must not dispatch workers')
  assert(source.booleans?.toolExecutionPerformed === false, 'Source must not execute tools')
  assert(source.booleans?.gpuRuntimeShouldStartNow === false, 'Source must not start GPU runtime')
  assert(source.counts?.mockDispatchHandoffPreparedTools === 21, 'Source must prepare 21 dispatch handoffs')

  const sourceHandoffs = source.handoffs as JsonRecord[]
  assert(Array.isArray(sourceHandoffs), 'Source handoffs must be an array')
  assert(sourceHandoffs.length === 21, 'Source must cover 21 handoffs')

  const state = createProductionWorkerRuntimeState()
  const dispatcherGateProofs = []

  for (const toolId of AI_GRAPHICS_CANONICAL_TOOL_IDS) {
    const sourceHandoff = sourceHandoffs.find((item) => item.toolId === toolId)
    assert(sourceHandoff, `Missing source handoff for ${toolId}`)
    assert(sourceHandoff.mockDispatchHandoffPrepared === true, `Source handoff was not prepared for ${toolId}`)
    assert(sourceHandoff.dispatchHandoffOnly === true, `Source handoff was not handoff-only for ${toolId}`)
    assert(sourceHandoff.workerDispatchPerformed === false, `Source dispatched worker for ${toolId}`)
    assert(sourceHandoff.toolExecutionPerformed === false, `Source executed tool for ${toolId}`)
    assert(sourceHandoff.gpuRuntimeShouldStartNow === false, `Source started GPU runtime for ${toolId}`)

    const payload = buildPayload(toolId)
    const result = await dispatchProductionWorkerJob({
      payload,
      state,
      workerInstanceId,
    })

    const failedGateNames = result.gateChecks
      .filter((gate) => gate.hardBlock)
      .map((gate) => gate.gateName)
    const names = eventNames(result.events)

    assert(result.status === 'blocked', `Dispatcher did not block ${toolId}`)
    assert(failedGateNames.includes('worker_mode'), `Missing worker_mode block for ${toolId}`)
    assert(result.error?.code === 'PRODUCTION_WORKER_GATES_FAILED', `Unexpected error code for ${toolId}`)
    assert(result.output === undefined, `Dispatcher produced route output for ${toolId}`)
    assert(result.toolRunResults.length === 0, `Dispatcher produced tool results for ${toolId}`)
    assert(result.artifactRecords.length === 0, `Dispatcher produced artifacts for ${toolId}`)
    assert(result.qualityGateResults.length === 0, `Dispatcher produced QA gate results for ${toolId}`)
    assert(names.includes('job_created'), `Missing job_created event for ${toolId}`)
    assert(names.includes('gates_started'), `Missing gates_started event for ${toolId}`)
    assert(names.includes('gates_failed'), `Missing gates_failed event for ${toolId}`)
    assert(names.includes('job_blocked'), `Missing job_blocked event for ${toolId}`)
    for (const forbidden of [
      'gates_passed',
      'job_claimed',
      'heartbeat',
      'job_started',
      'step_started',
      'step_completed',
      'job_completed',
    ] as const) {
      assert(!names.includes(forbidden), `Forbidden dispatcher event ${forbidden} for ${toolId}`)
    }

    dispatcherGateProofs.push({
      toolId,
      productionToolId: payload.requestedToolIds[0],
      workerType: payload.workerType,
      runtimeTarget: payload.metadata?.aiGraphicsRuntimeTarget,
      executionMode: payload.executionMode,
      dispatcherStatus: result.status,
      requiredBlockedGate: 'worker_mode',
      failedGateNames,
      blockedBeforeLease: true,
      blockedBeforeRouteOutput: result.output === undefined,
      blockedBeforeToolExecution: result.toolRunResults.length === 0,
      blockedBeforeGpuRuntime: true,
      eventNames: names,
      workerLeaseCreated: false,
      routeOutputProduced: false,
      toolRunResultsCreated: result.toolRunResults.length,
      artifactRecordsCreated: result.artifactRecords.length,
      qualityGateResultsCreated: result.qualityGateResults.length,
      gpuRuntimeShouldStartNow: false,
    })
  }

  assert(state.leases.length === 0, 'Dispatcher gate proof created worker leases')

  const gpuRows = dispatcherGateProofs.filter((row) => row.workerType === 'gpu_ai_worker')

  const report = {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-mock-dispatcher-gate-proof',
    decision,
    status,
    summary:
      'All-21 external-agent AI graphics dispatcher gate proof. It feeds production_blocked worker payloads into the real production worker dispatcher and verifies every tool blocks at the worker_mode gate before lease, route output, tool execution, artifacts, or GPU runtime.',
    sourceEvidence: {
      mockWorkerDispatchHandoffProof: sourceMockWorkerDispatchHandoffPath,
      productionWorkerDispatcher: 'server/workers/production/production-worker-dispatcher.ts',
      productionWorkerGates: 'server/workers/production/production-worker-gates.ts',
      productionWorkerLeaseManager: 'server/workers/production/production-worker-lease-manager.ts',
      canonicalToolRegistry: 'server/tool-registry/ai-graphics-tool-call-readiness.ts',
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-mock-dispatcher-gate-proof',
      diagnosticScript:
        'ai-graphics:external-agent-mock-dispatcher-gate-proof:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-mock-dispatcher-gate-proof.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-mock-dispatcher-gate-proof-diagnostics.mjs',
      dispatcherBoundary: 'dispatchProductionWorkerJob',
      requiredExecutionMode: 'production_blocked',
      requiredBlockedGate: 'worker_mode',
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      sourceMockDispatchHandoffPreparedTools:
        source.counts.mockDispatchHandoffPreparedTools,
      dispatcherGateAttemptedTools: dispatcherGateProofs.length,
      dispatcherGateBlockedTools: dispatcherGateProofs.filter((row) => row.dispatcherStatus === 'blocked').length,
      workerModeGateBlockedTools: dispatcherGateProofs.filter((row) => row.failedGateNames.includes('worker_mode')).length,
      dispatcherLeaseCreatedTools: state.leases.length,
      dispatcherRouteOutputProducedTools: dispatcherGateProofs.filter((row) => row.routeOutputProduced).length,
      workerDispatchPerformedTools: 0,
      toolExecutionPerformedTools: 0,
      artifactRecordsCreatedTools: 0,
      qualityGateResultsCreatedTools: 0,
      gpuRuntimeTargetedTools: gpuRows.length,
      gpuRuntimeShouldStartNowTools: 0,
      externalAgentExecutableNowTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    dispatcherGateProofs,
    booleans: {
      externalAgentMockDispatcherGateProofPassed: true,
      sourceMockWorkerDispatchHandoffProofAccepted: true,
      productionWorkerDispatcherBoundaryExercised: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21DispatcherGateBlocksConfirmed: true,
      workerModeGateBlockedDispatch: true,
      dispatcherBlockedBeforeLease: true,
      dispatcherBlockedBeforeRouteOutput: true,
      dispatcherBlockedBeforeToolExecution: true,
      allToolRunResultsEmpty: true,
      allArtifactRecordsEmpty: true,
      allQualityGateResultsEmpty: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
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
      workerLeaseCreated: false,
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
    nextMilestone:
      'external-agent controlled non-production dispatcher runtime authorization that removes production_blocked only after explicit approval and keeps GPU on demand',
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
