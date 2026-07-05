import fs from 'node:fs'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import { createProductionWorkerRuntimeState } from '../workers/production/production-worker-lease-manager'
import type {
  ProductionWorkerEventType,
  ProductionWorkerJobPayload,
} from '../workers/production/production-worker-types'
import {
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION,
  AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  type AiGraphicsExternalAgentGpuModelControlledAdapterResult,
} from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_proof_passed_with_runtime_blocks'
const status =
  'gpu_model_controlled_worker_dispatch_invokes_adapter_for_eight_tools_runtime_skipped'
const sourceProofRefCallerPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json'
const sourceProofRefCallerDecision =
  'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-controlled-worker-dispatch-proof.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-controlled-worker-dispatch-proof.md'
const workerInstanceId =
  'ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_worker'

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

function primaryCapability(toolId: AiGraphicsCanonicalToolId, capabilityIds: readonly string[]): string {
  const capabilities = productCapabilities(capabilityIds)
  const preferredByTool: Partial<Record<AiGraphicsCanonicalToolId, string>> = {
    torch_torchvision: 'model_runtime_foundation',
    transformers: 'model_runtime_foundation',
    sam2: 'subject_segmentation',
    birefnet: 'background_removal',
    real_esrgan: 'upscaling',
    kornia: 'tensor_image_ops',
    rembg: 'background_removal',
    transparent_background: 'background_removal',
  }
  const preferred = preferredByTool[toolId]
  if (preferred && capabilities.includes(preferred)) return preferred
  assert(capabilities.length > 0, `Missing product capability for ${toolId}`)
  return capabilities[0]
}

function modelWeightManifestRequired(toolId: AiGraphicsCanonicalToolId): boolean {
  return [
    'sam2',
    'birefnet',
    'real_esrgan',
    'rembg',
    'transparent_background',
  ].includes(toolId)
}

function eventNames(resultEvents: { eventName: ProductionWorkerEventType }[]) {
  return resultEvents.map((event) => event.eventName)
}

function buildPayload(toolId: AiGraphicsCanonicalToolId): ProductionWorkerJobPayload {
  const readiness = getAiGraphicsToolCallReadiness(toolId)
  assert(readiness, `Missing AI graphics readiness record for ${toolId}`)
  assert(readiness.productionToolId, `Missing production tool id for ${toolId}`)
  assert(readiness.productionWorkerType === 'gpu_ai_worker', `${toolId} must target gpu_ai_worker`)

  const capabilityIds = productCapabilities(readiness.capabilities)
  const capabilityId = primaryCapability(toolId, readiness.capabilities)
  const needsModelManifest = modelWeightManifestRequired(toolId)
  const privateBase =
    `private://ai-graphics/external-agent/gpu-model-controlled-worker-dispatch/${toolId}`

  const payload: ProductionWorkerJobPayload = {
    jobId:
      `job_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
    workspaceId:
      'workspace_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch',
    projectId:
      'project_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch',
    approvedSnapshotId:
      `approved_snapshot_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
    editPlanId:
      'edit_plan_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch',
    toolExecutionPlanId:
      `tool_execution_plan_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
    workerType: readiness.productionWorkerType,
    executionMode: 'dry_run',
    idempotencyKey: 'pending',
    attempt: 1,
    maxAttempts: 1,
    requestedToolIds: [readiness.productionToolId],
    requestedRecipeIds: [
      'ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_proof',
    ],
    storageReferenceIds: [
      `private_artifact_manifest_ai_graphics_gpu_model_controlled_worker_dispatch_${toolId}`,
    ],
    creditReservationId:
      `credit_reservation_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
    renderMode: 'qa_probe',
    requiredQualityGateIds: [],
    requiredQualityGateTypes: [],
    createdAt: '2026-07-03T00:00:00.000Z',
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
      aiGraphicsGpuModelControlledAdapter: {
        workspaceId:
          'workspace_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch',
        requestId:
          `request_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
        toolId,
        capabilityId,
        approvedPlanSnapshotId:
          `approved_snapshot_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
        creditReservationId:
          `credit_reservation_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
        privateArtifactManifestRef: `${privateBase}/artifact-manifest`,
        toolRouteApprovalRef: `${privateBase}/tool-route-approval`,
        workerApprovalRef: `${privateBase}/worker-approval`,
        runtimeEnqueueApprovalRef: `${privateBase}/runtime-enqueue-approval`,
        ownerRuntimeApprovalRef: `${privateBase}/owner-runtime-approval`,
        nativeGpuRuntimeProofRef: `${privateBase}/native-gpu-runtime-proof`,
        modelWeightManifestRef: needsModelManifest
          ? `${privateBase}/model-weight-manifest`
          : undefined,
        externalBetaPerToolRuntimeProofRef:
          `${privateBase}/external-beta-per-tool-runtime-proof`,
        traceId:
          `trace_ai_graphics_external_agent_gpu_model_controlled_worker_dispatch_${toolId}`,
        payload: {
          mode: 'dry_run',
          enableGpuModelControlledExecution: false,
          externalAgentGpuModelControlledWorkerDispatchProof: true,
          privateOutputOnly: true,
          gpuRuntimeOnDemandOnly: true,
          noIdleGpuRuntimeApproved: true,
          toolExecutionPerformed: false,
          gpuRuntimeShouldStartNow: false,
          modelWeightsLoaded: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
      },
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
      gpuRuntimeShouldStartNow: false,
      sourceProofRefCallerDecision,
      sourceProofRefCallerPath,
      externalAgentGpuModelControlledWorkerDispatchProof: true,
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

async function buildReport() {
  const source = readJson(sourceProofRefCallerPath)
  assert(
    source.decision === sourceProofRefCallerDecision,
    'Source GPU/model proof-ref route caller decision mismatch',
  )
  assert(
    source.booleans?.all8GpuModelProofRefRouteCallerEnvelopesPrepared === true,
    'Source GPU/model proof-ref route caller must prepare all eight envelopes',
  )

  const state = createProductionWorkerRuntimeState()
  const rows = []

  for (const toolId of AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS) {
    const payload = buildPayload(toolId)
    const result = await dispatchProductionWorkerJob({
      payload,
      state,
      workerInstanceId,
    })
    const names = eventNames(result.events)
    const failedGateNames = result.gateChecks
      .filter((gate) => gate.hardBlock)
      .map((gate) => gate.gateName)
    const output = result.output
    const adapterResult =
      output?.aiGraphicsGpuModelControlledAdapterResult as
        | AiGraphicsExternalAgentGpuModelControlledAdapterResult
        | undefined
    const leaseReleased = state.leases.some((lease) => (
      lease.jobId === result.jobId && lease.leaseStatus === 'released'
    ))

    assert(result.status === 'completed', `Worker dispatch did not complete ${toolId}`)
    assert(failedGateNames.length === 0, `Worker dispatch hard-blocked ${toolId}: ${failedGateNames.join(',')}`)
    assert(output, `Worker dispatch did not produce route output for ${toolId}`)
    assert(output.futureHandler === 'gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter', `GPU/model adapter route was not selected for ${toolId}`)
    assert(output.mockOnly === true, `GPU/model worker output was not mock-only for ${toolId}`)
    assert(adapterResult, `Missing GPU/model adapter result for ${toolId}`)
    assert(adapterResult.decision === AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_DECISION, `Adapter decision mismatch for ${toolId}`)
    assert(adapterResult.status === 'controlled_gpu_model_adapter_invoked_runtime_skipped', `Adapter should skip runtime by default for ${toolId}`)
    assert(adapterResult.controlledAdapterInvokedNow === true, `Adapter was not invoked for ${toolId}`)
    assert(adapterResult.localGpuModelRuntimeExecutionPerformed === false, `Local GPU/model runtime ran unexpectedly for ${toolId}`)
    assert(adapterResult.toolExecutionApprovedNow === false, `Tool execution was approved unexpectedly for ${toolId}`)
    assert(adapterResult.gpuRuntimeApprovedForScopedControlledToolCall === false, `GPU runtime was approved unexpectedly for ${toolId}`)
    assert(adapterResult.gpuRuntimeShouldStartNow === false, `GPU runtime should not start for ${toolId}`)
    assert(adapterResult.publicArtifactCreated === false, `Public artifact created unexpectedly for ${toolId}`)
    assert(adapterResult.signedUrlCreated === false, `Signed URL created unexpectedly for ${toolId}`)
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
    assert(leaseReleased, `Worker dispatch lease was not released for ${toolId}`)

    rows.push({
      toolId,
      productionToolId: payload.requestedToolIds[0],
      workerType: payload.workerType,
      runtimeTarget: payload.metadata?.aiGraphicsRuntimeTarget,
      capabilityIds: payload.metadata?.aiGraphicsCapabilityIds,
      executionMode: payload.executionMode,
      dispatcherStatus: result.status,
      hardGateBlockCount: failedGateNames.length,
      eventNames: names,
      inMemoryLeaseCreated: names.includes('job_claimed'),
      inMemoryLeaseReleased: leaseReleased,
      dispatcherRouteOutputProduced: Boolean(output),
      futureHandler: output.futureHandler,
      adapterDecision: adapterResult.decision,
      adapterStatus: adapterResult.status,
      controlledAdapterInvokedNow: adapterResult.controlledAdapterInvokedNow,
      localGpuModelRuntimeExecutionPerformed:
        adapterResult.localGpuModelRuntimeExecutionPerformed,
      toolExecutionApprovedNow: adapterResult.toolExecutionApprovedNow,
      gpuRuntimeApprovedForScopedControlledToolCall:
        adapterResult.gpuRuntimeApprovedForScopedControlledToolCall,
      gpuRuntimeShouldStartNow: adapterResult.gpuRuntimeShouldStartNow,
      toolRunResultsCreated: result.toolRunResults.length,
      artifactRecordsCreated: result.artifactRecords.length,
      qualityGateResultsCreated: result.qualityGateResults.length,
      publicArtifactCreated: adapterResult.publicArtifactCreated,
      signedUrlCreated: adapterResult.signedUrlCreated,
    })
  }

  return {
    schemaVersion:
      '2026-07-03.ai-graphics.external-agent-gpu-model-controlled-worker-dispatch-proof',
    decision,
    status,
    summary:
      'Dispatches the eight GPU/model AI graphics tools through the production worker dispatcher into the gpu_ai_worker controlled adapter route. The proof exercises gates, in-memory leases, router selection, and adapter invocation. It keeps runtime in dry-run mode, so GPU/model execution, model loading, public artifacts, signed URLs, external beta readiness, and production readiness remain false.',
    sourceEvidence: {
      gpuModelProofRefRouteCaller: {
        path: sourceProofRefCallerPath,
        decision: source.decision,
        accepted: true,
      },
      productionWorkerDispatcher:
        'server/workers/production/production-worker-dispatcher.ts',
      productionWorkerRouter:
        'server/workers/production/production-worker-router.ts',
      gpuModelControlledAdapter:
        'server/tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter.ts',
    },
    interfaces: {
      packageScript:
        'ai-graphics:external-agent-gpu-model-controlled-worker-dispatch-proof',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-controlled-worker-dispatch-proof:diagnostics',
      cli:
        'server/cli/ai-graphics-external-agent-gpu-model-controlled-worker-dispatch-proof.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-controlled-worker-dispatch-proof-diagnostics.mjs',
      dispatcherBoundary: 'dispatchProductionWorkerJob',
      routerBoundary: 'routeProductionWorkerJob',
      futureHandler:
        'gpu_ai_worker_ai_graphics_gpu_model_controlled_adapter',
      requiredExecutionMode: 'dry_run',
    },
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelToolsCovered: rows.length,
      gpuModelControlledWorkerDispatchAttemptedTools: rows.length,
      gpuModelControlledWorkerDispatchCompletedTools:
        rows.filter((row) => row.dispatcherStatus === 'completed').length,
      dispatcherHardGateBlocks: rows.reduce(
        (total, row) => total + row.hardGateBlockCount,
        0,
      ),
      adapterRouteOutputProducedTools:
        rows.filter((row) => row.dispatcherRouteOutputProduced).length,
      controlledAdapterInvokedTools:
        rows.filter((row) => row.controlledAdapterInvokedNow).length,
      adapterRuntimeSkippedTools:
        rows.filter((row) => row.adapterStatus === 'controlled_gpu_model_adapter_invoked_runtime_skipped').length,
      inMemoryWorkerLeasesCreatedTools:
        rows.filter((row) => row.inMemoryLeaseCreated).length,
      inMemoryWorkerLeasesReleasedTools:
        rows.filter((row) => row.inMemoryLeaseReleased).length,
      toolRunResultsCreatedTools: 0,
      artifactRecordsCreatedTools: 0,
      qualityGateResultsCreatedTools: 0,
      localGpuModelRuntimeExecutionPerformedTools: 0,
      toolExecutionApprovedNowTools: 0,
      gpuRuntimeApprovedForScopedControlledToolCallTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    gpuModelControlledWorkerDispatchProofs: rows,
    booleans: {
      externalAgentGpuModelControlledWorkerDispatchProofPassed: true,
      sourceGpuModelProofRefRouteCallerAccepted: true,
      productionWorkerDispatcherBoundaryExercised: true,
      gpuModelControlledAdapterRouteSelectedForAll8: true,
      controlledAdapterInvokedForAll8: true,
      adapterRuntimeSkippedByDefaultForAll8: true,
      all8GpuModelToolsCovered: true,
      inMemoryWorkerLeasesCreatedAndReleased: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
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
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    nextMilestone:
      'bind accepted native GPU/model proof refs to non-production worker enqueue and then run local-dev GPU/model adapter execution only on an approved GPU host with private model manifests',
  }
}

function makeMarkdown(report: Awaited<ReturnType<typeof buildReport>>): string {
  const rows = report.gpuModelControlledWorkerDispatchProofs
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.futureHandler}\` | \`${row.adapterStatus}\` | ${row.controlledAdapterInvokedNow} | ${row.localGpuModelRuntimeExecutionPerformed} | ${row.toolExecutionApprovedNow} | ${row.gpuRuntimeShouldStartNow} |`
    ))
    .join('\n')

  return `# AI Graphics External Agent GPU Model Controlled Worker Dispatch Proof

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This proof dispatches all eight GPU/model AI graphics tools through the production worker dispatcher into the guarded GPU/model controlled adapter route. It proves the worker/router/adapter handoff is wired. It does not start GPU runtime, load model weights, execute model inference, write public artifacts, create signed URLs, unlock external beta, or unlock production.

## Worker dispatch rows

| Tool | Handler | Adapter status | Adapter invoked | Local GPU/model runtime executed | Tool execution approved | GPU starts now |
| --- | --- | --- | ---: | ---: | ---: | ---: |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next milestone

${report.nextMilestone}
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
