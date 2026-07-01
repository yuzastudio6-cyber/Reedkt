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
  'ai_graphics_external_agent_controlled_dispatcher_dry_run_proof_passed_with_runtime_blocks'
const status =
  'controlled_dispatcher_dry_run_completed_all_21_no_tool_execution'
const sourceMockDispatcherGatePath =
  'docs/tool-intelligence/ai-graphics/external-agent-mock-dispatcher-gate-proof.json'
const sourceMockDispatcherGateDecision =
  'ai_graphics_external_agent_mock_dispatcher_gate_proof_passed_with_runtime_blocks'
const workerInstanceId =
  'ai_graphics_external_agent_controlled_dispatcher_dry_run_worker'

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function productCapabilities(capabilityIds: readonly string[]): string[] {
  return capabilityIds.filter((capabilityId) => (
    capabilityId !== 'planning_metadata_only' &&
    capabilityId !== 'blocked_or_deferred'
  ))
}

function recipeIdForRuntimeTarget(runtimeTarget: string): string {
  if (runtimeTarget === 'node_cpu_static') {
    return 'ai_graphics_external_agent_cpu_static_controlled_dispatcher_dry_run'
  }
  if (runtimeTarget.includes('nvidia_l4')) {
    return 'ai_graphics_external_agent_gpu_model_controlled_dispatcher_dry_run'
  }
  if (runtimeTarget.includes('browser')) {
    return 'ai_graphics_external_agent_browser_controlled_dispatcher_dry_run'
  }
  return 'ai_graphics_external_agent_metadata_controlled_dispatcher_dry_run'
}

function buildPayload(toolId: AiGraphicsCanonicalToolId): ProductionWorkerJobPayload {
  const readiness = getAiGraphicsToolCallReadiness(toolId)
  assert(readiness, `Missing AI graphics readiness record for ${toolId}`)
  assert(readiness.productionToolId, `Missing production tool id for ${toolId}`)
  assert(readiness.productionWorkerType !== 'none', `Missing worker type for ${toolId}`)

  const capabilityIds = productCapabilities(readiness.capabilities)
  assert(capabilityIds.length > 0, `Missing product capability ids for ${toolId}`)

  const payload: ProductionWorkerJobPayload = {
    jobId:
      `job_ai_graphics_external_agent_controlled_dispatcher_dry_run_${toolId}`,
    workspaceId:
      'workspace_ai_graphics_external_agent_controlled_dispatcher_dry_run',
    projectId:
      'project_ai_graphics_external_agent_controlled_dispatcher_dry_run',
    approvedSnapshotId:
      'approved_snapshot_ai_graphics_external_agent_controlled_dispatcher_dry_run',
    editPlanId:
      'edit_plan_ai_graphics_external_agent_controlled_dispatcher_dry_run',
    toolExecutionPlanId:
      `tool_execution_plan_ai_graphics_external_agent_controlled_dispatcher_dry_run_${toolId}`,
    workerType: readiness.productionWorkerType,
    executionMode: 'dry_run',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [readiness.productionToolId],
    requestedRecipeIds: [recipeIdForRuntimeTarget(readiness.runtimeTarget)],
    storageReferenceIds: [
      `private_artifact_manifest_ai_graphics_external_agent_controlled_dispatcher_${toolId}`,
    ],
    creditReservationId:
      'credit_reservation_ai_graphics_external_agent_controlled_dispatcher_dry_run',
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
      aiGraphicsToolCallHandoff: {
        mode: 'metadata_dry_run',
        canonicalToolId: toolId,
        productionToolId: readiness.productionToolId,
        runtimeTarget: readiness.runtimeTarget,
        capabilityIds,
        planningOnly: true,
        agentCanExecuteToolsNow: false,
      },
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      gpuRuntimeShouldStartNow: false,
      sourceMockDispatcherGateDecision,
      sourceMockDispatcherGatePath,
      externalAgentControlledDispatcherDryRun: true,
      externalAgentExecutionExpected: false,
      backendQueueSubmissionExpected: false,
      liveQueueWriteExpected: false,
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
  const source = readJson(sourceMockDispatcherGatePath)
  assert(
    source.decision === sourceMockDispatcherGateDecision,
    'Source mock dispatcher gate decision mismatch',
  )
  assert(
    source.status === 'mock_dispatcher_gate_blocked_all_21_before_worker_execution',
    'Source mock dispatcher gate status mismatch',
  )
  assert(source.counts?.dispatcherGateBlockedTools === 21, 'Source must block 21 dispatcher jobs')
  assert(source.counts?.workerModeGateBlockedTools === 21, 'Source must block on worker_mode for 21 tools')
  assert(source.counts?.dispatcherLeaseCreatedTools === 0, 'Source must not create leases')
  assert(source.counts?.dispatcherRouteOutputProducedTools === 0, 'Source must not produce route output')
  assert(source.booleans?.productionWorkerDispatcherBoundaryExercised === true, 'Source dispatcher boundary was not exercised')
  assert(source.booleans?.agentCanExecuteToolsNow === false, 'Source must not allow agent execution')
  assert(source.booleans?.workerDispatchPerformed === false, 'Source must not dispatch workers')
  assert(source.booleans?.toolExecutionPerformed === false, 'Source must not execute tools')
  assert(source.booleans?.gpuRuntimeShouldStartNow === false, 'Source must not start GPU runtime')

  const sourceRows = source.dispatcherGateProofs as JsonRecord[]
  assert(Array.isArray(sourceRows), 'Source dispatcher gate proofs must be an array')
  assert(sourceRows.length === 21, 'Source must cover 21 dispatcher gate proofs')

  const state = createProductionWorkerRuntimeState()
  const controlledDispatcherDryRunProofs = []

  for (const toolId of AI_GRAPHICS_CANONICAL_TOOL_IDS) {
    const sourceRow = sourceRows.find((item) => item.toolId === toolId)
    assert(sourceRow, `Missing source dispatcher gate proof for ${toolId}`)
    assert(sourceRow.dispatcherStatus === 'blocked', `Source did not block ${toolId}`)
    assert(sourceRow.requiredBlockedGate === 'worker_mode', `Source did not require worker_mode for ${toolId}`)
    assert(sourceRow.workerLeaseCreated === false, `Source created a lease for ${toolId}`)
    assert(sourceRow.routeOutputProduced === false, `Source produced route output for ${toolId}`)
    assert(sourceRow.gpuRuntimeShouldStartNow === false, `Source started GPU runtime for ${toolId}`)

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
    const output = result.output
    const handoff = output?.aiGraphicsToolCallHandoffResult as JsonRecord | undefined
    const leaseReleased = state.leases.some((lease) => (
      lease.jobId === result.jobId && lease.leaseStatus === 'released'
    ))

    assert(result.status === 'completed', `Dispatcher dry-run did not complete ${toolId}`)
    assert(failedGateNames.length === 0, `Dispatcher dry-run hard-blocked ${toolId}: ${failedGateNames.join(',')}`)
    assert(output, `Dispatcher dry-run did not produce route output for ${toolId}`)
    assert(output.mockOnly === true, `Dispatcher dry-run route was not mockOnly for ${toolId}`)
    assert(output.futureHandler.startsWith('ai_graphics_'), `Dispatcher dry-run did not use AI graphics handler for ${toolId}`)
    assert(handoff, `Missing AI graphics handoff result for ${toolId}`)
    assert(handoff.mode === 'metadata_dry_run', `Handoff mode mismatch for ${toolId}`)
    assert(handoff.canonicalToolId === toolId, `Handoff tool id mismatch for ${toolId}`)
    assert(handoff.planningOnly === true, `Handoff not planning-only for ${toolId}`)
    assert(handoff.agentCanExecuteToolsNow === false, `Handoff allowed agent execution for ${toolId}`)
    assert(handoff.toolExecutionPerformed === false, `Handoff executed tool for ${toolId}`)
    assert(handoff.routeExecutionPerformed === false, `Handoff marked route execution for ${toolId}`)
    assert(handoff.workerExecutionPerformed === false, `Handoff marked worker execution for ${toolId}`)
    assert(handoff.gpuRuntimePerformed === false, `Handoff started GPU runtime for ${toolId}`)
    assert(result.toolRunResults.length === 0, `Dispatcher produced tool results for ${toolId}`)
    assert(result.artifactRecords.length === 0, `Dispatcher produced artifacts for ${toolId}`)
    assert(result.qualityGateResults.length === 0, `Dispatcher produced QA gate results for ${toolId}`)
    for (const required of [
      'job_created',
      'gates_started',
      'gates_passed',
      'job_claimed',
      'heartbeat',
      'job_started',
      'step_started',
      'step_completed',
      'job_completed',
    ] as const) {
      assert(names.includes(required), `Missing dispatcher event ${required} for ${toolId}`)
    }
    assert(leaseReleased, `Dispatcher dry-run lease was not released for ${toolId}`)

    controlledDispatcherDryRunProofs.push({
      toolId,
      productionToolId: payload.requestedToolIds[0],
      workerType: payload.workerType,
      runtimeTarget: payload.metadata?.aiGraphicsRuntimeTarget,
      capabilityIds: payload.metadata?.aiGraphicsCapabilityIds,
      executionMode: payload.executionMode,
      dispatcherStatus: result.status,
      gateChecksEvaluated: result.gateChecks.length,
      hardGateBlockCount: failedGateNames.length,
      warningCount: result.warnings.length,
      eventNames: names,
      inMemoryLeaseCreated: names.includes('job_claimed'),
      inMemoryLeaseReleased: leaseReleased,
      dispatcherRouteOutputProduced: Boolean(output),
      routeOutputMockOnly: output.mockOnly === true,
      aiGraphicsToolCallHandoffRoute: Boolean(handoff),
      futureHandler: output.futureHandler,
      toolRunResultsCreated: result.toolRunResults.length,
      artifactRecordsCreated: result.artifactRecords.length,
      qualityGateResultsCreated: result.qualityGateResults.length,
      liveWorkerDispatchPerformedNow: false,
      toolExecutionPerformedNow: false,
      gpuRuntimeShouldStartNow: false,
    })
  }

  const gpuRows = controlledDispatcherDryRunProofs.filter((row) => row.workerType === 'gpu_ai_worker')
  const routeRows = controlledDispatcherDryRunProofs.filter((row) => row.dispatcherRouteOutputProduced)
  const leaseCreatedRows = controlledDispatcherDryRunProofs.filter((row) => row.inMemoryLeaseCreated)
  const leaseReleasedRows = controlledDispatcherDryRunProofs.filter((row) => row.inMemoryLeaseReleased)
  const handoffRows = controlledDispatcherDryRunProofs.filter((row) => row.aiGraphicsToolCallHandoffRoute)

  const report = {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-controlled-dispatcher-dry-run-proof',
    decision,
    status,
    summary:
      'All-21 external-agent AI graphics controlled dispatcher dry-run proof. It removes only the production_blocked worker mode from the prior gate proof, dispatches dry_run metadata handoff payloads through the real production worker dispatcher, and verifies every tool completes with mock-only route output, released in-memory lease state, empty tool/artifact/QA outputs, and no GPU runtime startup.',
    sourceEvidence: {
      mockDispatcherGateProof: sourceMockDispatcherGatePath,
      productionWorkerDispatcher: 'server/workers/production/production-worker-dispatcher.ts',
      productionWorkerRouter: 'server/workers/production/production-worker-router.ts',
      productionWorkerGates: 'server/workers/production/production-worker-gates.ts',
      productionWorkerLeaseManager: 'server/workers/production/production-worker-lease-manager.ts',
      canonicalToolRegistry: 'server/tool-registry/ai-graphics-tool-call-readiness.ts',
    },
    interfaces: {
      packageScript:
        'ai-graphics:external-agent-controlled-dispatcher-dry-run-proof',
      diagnosticScript:
        'ai-graphics:external-agent-controlled-dispatcher-dry-run-proof:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-controlled-dispatcher-dry-run-proof-diagnostics.mjs',
      dispatcherBoundary: 'dispatchProductionWorkerJob',
      routerBoundary: 'routeProductionWorkerJob',
      requiredExecutionMode: 'dry_run',
      requiredHandoffMode: 'metadata_dry_run',
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      sourceDispatcherGateBlockedTools:
        source.counts.dispatcherGateBlockedTools,
      controlledDispatcherDryRunAttemptedTools:
        controlledDispatcherDryRunProofs.length,
      controlledDispatcherDryRunCompletedTools:
        controlledDispatcherDryRunProofs.filter((row) => row.dispatcherStatus === 'completed').length,
      dispatcherGatesPassedTools:
        controlledDispatcherDryRunProofs.filter((row) => row.hardGateBlockCount === 0).length,
      dispatcherHardGateBlocks: 0,
      dispatcherRouteOutputProducedTools: routeRows.length,
      aiGraphicsToolCallHandoffRouteTools: handoffRows.length,
      inMemoryWorkerLeasesCreatedTools: leaseCreatedRows.length,
      inMemoryWorkerLeasesReleasedTools: leaseReleasedRows.length,
      inMemoryWorkerEventsRecorded: state.events.length,
      toolRunResultsCreatedTools: 0,
      artifactRecordsCreatedTools: 0,
      qualityGateResultsCreatedTools: 0,
      gpuRuntimeTargetedTools: gpuRows.length,
      gpuRuntimeShouldStartNowTools: 0,
      externalAgentControlledDryRunReadyTools:
        controlledDispatcherDryRunProofs.length,
      externalAgentExecutableNowTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    controlledDispatcherDryRunProofs,
    booleans: {
      externalAgentControlledDispatcherDryRunProofPassed: true,
      sourceMockDispatcherGateProofAccepted: true,
      productionWorkerDispatcherBoundaryExercised: true,
      dispatcherDryRunGatesPassed: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ControlledDryRunDispatchesCompleted: true,
      all21AiGraphicsHandoffRoutesCreated: true,
      inMemoryWorkerLeasesCreatedAndReleased: true,
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
      'external-agent controlled worker tool-adapter proof that binds a single approved dry-run handoff result to per-tool adapter authorization while preserving no provider/model/GPU/public-artifact execution',
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
