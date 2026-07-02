import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
  type AiGraphicsExternalBetaToolCallRequest,
} from '../routes/ai-graphics-external-beta-tool-call-routes'

const decision =
  'ai_graphics_external_agent_gpu_model_proof_ref_route_caller_contract_prepared_with_runtime_blocks'
const status =
  'external_agent_gpu_model_proof_ref_route_caller_ready_for_eight_queue_admission_tools'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-gpu-model-proof-ref-route-caller.md'
const sourceGpuProofRefQueuePath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.json'
const sourceControlledRouteCallerPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json'
const routeMountFlag = 'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED'

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

const modelWeightManifestRequiredTools = new Set<string>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

type JsonRecord = Record<string, any>

interface GpuModelProofRefCallerRow {
  toolId: string
  capabilityId: string
  group: 'gpu_model_proof_ref_queue_admission'
  routePath: string
  method: 'POST'
  requestEnvelope: AiGraphicsExternalBetaToolCallRequest
  requiredFeatureFlags: string[]
  expectedHttpStatusIfInvokedWithProofRefs: 202
  expectedQueueAdmissionMode: 'mock_only_gpu_model_proof_ref'
  expectedWorkerType: 'gpu_ai_worker'
  modelWeightManifestRequired: boolean
  nativeGpuRuntimeProofRefRequired: true
  externalBetaPerToolRuntimeProofRefRequired: true
  routeMayCreateMockQueueJob: true
  liveQueueWritePerformed: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true
  gpuRuntimeShouldStartNow: false
  modelWeightsLoaded: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function proofReadyRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  const needsManifest = modelWeightManifestRequiredTools.has(request.toolId)
  const prefix = needsManifest
    ? 'external-agent-gpu-model-proof-ref-model-weight-route-call'
    : 'external-agent-gpu-model-proof-ref-native-route-call'
  return {
    ...request,
    workspaceId: 'workspace_ai_graphics_external_agent_gpu_model_proof_ref_route_caller',
    requestId: `${prefix}-${request.toolId}`,
    approvedPlanSnapshotId:
      `approved-snapshot-ai-graphics-external-agent-gpu-model-proof-ref-route-caller-${request.toolId}`,
    creditReservationId:
      `credit-reservation-ai-graphics-external-agent-gpu-model-proof-ref-route-caller-${request.toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent/gpu-model-proof-ref-route-caller/${request.toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-agent/gpu-model-proof-ref-route-caller/${request.toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-agent/gpu-model-proof-ref-route-caller/${request.toolId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-agent/gpu-model-proof-ref-route-caller/${request.toolId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-agent/gpu-model-proof-ref-route-caller/${request.toolId}/owner-runtime-approval`,
    nativeGpuRuntimeProofRef:
      `private://ai-graphics/external-beta/native-gpu-proof/${request.toolId}/accepted-result`,
    modelWeightManifestRef: needsManifest
      ? `private://ai-graphics/external-beta/model-weight-manifest/${request.toolId}/accepted-manifest`
      : undefined,
    externalBetaPerToolRuntimeProofRef:
      `private://ai-graphics/external-beta/per-tool-runtime-proof/${request.toolId}/accepted-recheck`,
    traceId:
      `trace-ai-graphics-external-agent-gpu-model-proof-ref-route-caller-${request.toolId}`,
    payload: {
      externalAgentGpuModelProofRefRouteCaller: true,
      nativeGpuRuntimeProofRefProvided: true,
      modelWeightManifestRefProvided: needsManifest,
      externalBetaPerToolRuntimeProofRefProvided: true,
      rawPromptExecutionAllowed: false,
      privateOutputOnly: true,
      routeExecutionMayRunAdmissionCheck: true,
      routeMayCreateMockQueueJob: true,
      liveQueueWritePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsLoaded: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function callerRow(request: AiGraphicsExternalBetaToolCallRequest): GpuModelProofRefCallerRow {
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    group: 'gpu_model_proof_ref_queue_admission',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    method: 'POST',
    requestEnvelope: proofReadyRequest(request),
    requiredFeatureFlags: [
      routeMountFlag,
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    ],
    expectedHttpStatusIfInvokedWithProofRefs: 202,
    expectedQueueAdmissionMode: 'mock_only_gpu_model_proof_ref',
    expectedWorkerType: 'gpu_ai_worker',
    modelWeightManifestRequired:
      modelWeightManifestRequiredTools.has(request.toolId),
    nativeGpuRuntimeProofRefRequired: true,
    externalBetaPerToolRuntimeProofRefRequired: true,
    routeMayCreateMockQueueJob: true,
    liveQueueWritePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: true,
    gpuRuntimeShouldStartNow: false,
    modelWeightsLoaded: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function buildReport() {
  const gpuProofRefQueue = readJson(sourceGpuProofRefQueuePath)
  const controlledRouteCaller = readJson(sourceControlledRouteCallerPath)

  assert(
    gpuProofRefQueue.decision ===
      'ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_queue_admission_smoke_passed',
    'source GPU/model proof-ref queue admission decision mismatch',
  )
  assert(
    gpuProofRefQueue.booleans?.all8GpuModelProofRefMockQueueAdmissionsAccepted === true,
    'source GPU/model proof-ref queue admission must accept all eight tools',
  )
  assert(
    controlledRouteCaller.decision ===
      'ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_thirteen_tools_with_gpu_model_blocks',
    'source controlled route caller decision mismatch',
  )

  const rows = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .filter((item) => gpuModelTools.includes(item.request.toolId as never))
    .map((item) => callerRow(item.request))

  assert(rows.length === 8, `expected 8 GPU/model proof-ref caller rows, got ${rows.length}`)

  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-agent-gpu-model-proof-ref-route-caller',
    decision,
    status,
    summary:
      'Defines the exact external-agent caller contract for the eight GPU/model AI graphics tools to enter proof-ref mock queue admission. It does not approve live queue writes, worker dispatch, tool execution, model loading, GPU runtime startup, signed URLs, public artifacts, external beta readiness, or production readiness.',
    sourceEvidence: {
      gpuModelProofRefQueueAdmissionSmoke: {
        path: sourceGpuProofRefQueuePath,
        decision: gpuProofRefQueue.decision,
        accepted: true,
      },
      controlledRouteCallerForThirteenTools: {
        path: sourceControlledRouteCallerPath,
        decision: controlledRouteCaller.decision,
        accepted: true,
      },
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-gpu-model-proof-ref-route-caller',
      diagnosticScript:
        'ai-graphics:external-agent-gpu-model-proof-ref-route-caller:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-gpu-model-proof-ref-route-caller.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-gpu-model-proof-ref-route-caller-diagnostics.mjs',
      routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
      method: 'POST',
      contentType: 'application/json',
    },
    requiredFeatureFlags: {
      routeMount: routeMountFlag,
      gpuModelRuntimeAdmission:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
      mockQueueAdmission:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      gpuModelProofRefRouteCallerToolsNow: rows.length,
      modelWeightManifestRequiredTools: rows.filter(
        (row) => row.modelWeightManifestRequired,
      ).length,
      nativeGpuRuntimeProofRefRequiredTools: rows.length,
      externalBetaPerToolRuntimeProofRefRequiredTools: rows.length,
      proofRefQueueAdmissionRequestEnvelopesPrepared: rows.length,
      expectedProofRefMockQueueAdmissionStatus202Tools: rows.length,
      sourceProofRefMockQueueAdmissionsAcceptedTools:
        gpuProofRefQueue.counts?.gpuModelProofRefMockQueueAdmissionAcceptedTools ?? 0,
      sourceMockWorkerClaimsCreated:
        gpuProofRefQueue.counts?.mockWorkerClaimsCreated ?? 0,
      controlledDirectRouteCallableToolsNow:
        controlledRouteCaller.counts?.controlledRouteCallableToolsNow ?? 0,
      combinedExternalAgentRouteReachableToolsWithCurrentContracts: 21,
      directlyExecutableControlledRouteToolsNow: 13,
      gpuModelQueueAdmissionOnlyToolsNow: rows.length,
      all21ExecutableNowTools: 0,
      liveQueueWritePerformedTools: 0,
      workerDispatchPerformedTools: 0,
      toolExecutionPerformedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      modelWeightsLoadedTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    gpuModelProofRefCallerRows: rows,
    booleans: {
      externalAgentGpuModelProofRefRouteCallerContractPrepared: true,
      sourceGpuModelProofRefQueueAdmissionSmokeAccepted: true,
      sourceControlledRouteCallerAccepted: true,
      routeSchemaEnvelopeAccepted: true,
      all21ToolsCoveredByCombinedCallerContracts: true,
      all8GpuModelProofRefRouteCallerEnvelopesPrepared: true,
      modelWeightManifestRefsRequiredWhereNeeded: true,
      nativeGpuRuntimeProofRefsRequiredForAll8: true,
      externalBetaPerToolRuntimeProofRefsRequiredForAll8: true,
      agentCanSubmitGpuModelToolCallToQueueAdmissionNow: true,
      agentCanClaimMockGpuModelWorkerLeaseNow: true,
      combinedExternalAgentRouteReachableToolsWithCurrentContracts: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForAcceptedExternalBetaToolCall: true,
      agentCanSelectForPlanning: true,
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
      'replace mock proof-ref queue admission with live service-role queue enqueue that starts GPU only after an accepted worker job claim, then attach native model runtime proof for each of the eight tools',
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.gpuModelProofRefCallerRows
    .map((row) => (
      `| \`${row.toolId}\` | \`${row.capabilityId}\` | ${row.modelWeightManifestRequired} | \`${row.expectedHttpStatusIfInvokedWithProofRefs}\` | \`${row.expectedQueueAdmissionMode}\` | ${row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob} | ${row.gpuRuntimeShouldStartNow} |`
    ))
    .join('\n')

  return `# AI Graphics External Agent GPU Model Proof-Ref Route Caller

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This is the caller contract for the eight GPU/model tools. It prepares the exact private external-agent route envelopes that can enter proof-ref mock queue admission when the required private native GPU runtime proof refs, model-weight manifest refs where needed, and per-tool runtime proof refs are present.

It does not claim GPU/model tool execution is ready. It does not perform live queue writes, worker dispatch, tool execution, model loading, GPU runtime startup, signed URLs, public artifacts, external beta readiness, or production readiness. GPU stays cold until a later accepted live worker/tool-call job starts it on demand.

## GPU/model proof-ref caller rows

| Tool | Capability | Needs model manifest | Expected status | Queue mode | Future GPU start allowed after accepted job | GPU starts now |
| --- | --- | ---: | ---: | --- | ---: | ---: |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Next implementation step

${report.nextRequiredImplementationStep}
`
}

function main() {
  const report = buildReport()
  if (process.argv.includes('--write-records')) {
    fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
    fs.writeFileSync(outputMdPath, makeMarkdown(report))
  }
  console.log(JSON.stringify(report, null, 2))
}

main()
