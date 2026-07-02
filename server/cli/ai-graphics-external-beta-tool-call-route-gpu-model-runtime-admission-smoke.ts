import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'

const decision =
  'ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_smoke_passed'
const status =
  'canonical_tool_call_route_gpu_model_runtime_admission_fail_closed_for_eight_tools'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-runtime-admission-smoke.md'

const gpuModelTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
]

const nativeGpuProofOnlyTools = [
  'torch_torchvision',
  'transformers',
  'kornia',
]

interface GpuModelRuntimeAdmissionBlockedResult {
  toolId: string
  capabilityId: string
  statusCode: number
  blocked: boolean
  code: string | null
  routeStatus: string | null
  admissionDecision: string | null
  runtimeTarget: string | null
  workerType: string | null
  modelWeightManifestRequired: boolean
  gpuModelExternalBetaReadinessBlocker: string | null
  gpuModelAdmissionEvidenceState: string | null
  nextExternalAgentAction: string | null
  modelWeightPrivateEvidenceRequired: boolean
  modelWeightPrivateEvidenceAccepted: boolean
  modelWeightManifestRefAccepted: boolean
  nativeGpuRuntimeProofRequired: boolean
  nativeGpuRuntimeProofAccepted: boolean
  nativeGpuRuntimeProofRefAccepted: boolean
  externalBetaPerToolRuntimeProofRecheckRequired: boolean
  externalBetaPerToolRuntimeProofRecheckAccepted: boolean
  runtimeJobAdmissionReadyWithProvidedEvidence: boolean
  workerEnqueueStillBlockedByCurrentLane: boolean
  gpuModelUnblockPlan: Record<string, any> | null
  missingRuntimeJobGates: string[]
  missingRuntimeProofGates: string[]
  missingPrivateModelWeightEvidence: string[]
  gpuRuntimeStartupAuthorization: string | null
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: boolean
  routeExecutionPerformed: boolean
  workerDispatchPerformed: boolean
  toolExecutionPerformed: boolean
  modelWeightsLoaded: boolean
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildRuntimeEnv(gpuModelAdmissionEnabled: boolean) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'true',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_ENABLED:
      'false',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_ENABLED:
      'false',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG]:
      gpuModelAdmissionEnabled ? 'true' : 'false',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
  })
}

async function withServer<T>(
  gpuModelAdmissionEnabled: boolean,
  callback: (baseUrl: string) => Promise<T>,
) {
  const app = createReeditProApiApp(buildRuntimeEnv(gpuModelAdmissionEnabled))
  const server = app.listen(0, '127.0.0.1') as Server
  await once(server, 'listening')
  const address = server.address() as AddressInfo
  try {
    return await callback(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  }
}

async function postToolCall(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
) {
  const response = await fetch(
    `${baseUrl}${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-request-id': request.traceId,
      },
      body: JSON.stringify(request),
    },
  )
  const text = await response.text()
  let body: Record<string, any> | null = null
  try {
    body = JSON.parse(text) as Record<string, any>
  } catch {
    body = null
  }
  return { response, body }
}

function normalizeRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    ...request,
    requestId: request.requestId.replace('blocked-details-', 'gpu-model-admission-'),
    traceId: request.traceId.replace('blocked-details', 'gpu-model-admission'),
    payload: {
      gpuModelRuntimeAdmissionSmoke: true,
      routeExecutionPerformed: true,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

function normalizeProofReadyNativeGpuOnlyRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  const normalized = normalizeRequest(request)
  return {
    ...normalized,
    requestId: normalized.requestId.replace(
      'gpu-model-admission-',
      'gpu-model-admission-proof-ready-',
    ),
    traceId: normalized.traceId.replace(
      'gpu-model-admission',
      'gpu-model-admission-proof-ready',
    ),
    nativeGpuRuntimeProofRef:
      `private://ai-graphics/external-beta/native-gpu-proof/${request.toolId}/accepted-result`,
    payload: {
      ...(normalized.payload ?? {}),
      gpuModelRuntimeAdmissionProofRefsProvided: true,
      nativeGpuRuntimeProofRefProvided: true,
      modelWeightManifestRefProvided: false,
      workerEnqueueStillBlockedByCurrentLane: true,
    },
  }
}

function normalizeProofReadyModelWeightRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  const normalized = normalizeRequest(request)
  return {
    ...normalized,
    requestId: normalized.requestId.replace(
      'gpu-model-admission-',
      'gpu-model-admission-model-weight-proof-ready-',
    ),
    traceId: normalized.traceId.replace(
      'gpu-model-admission',
      'gpu-model-admission-model-weight-proof-ready',
    ),
    nativeGpuRuntimeProofRef:
      `private://ai-graphics/external-beta/native-gpu-proof/${request.toolId}/accepted-result`,
    modelWeightManifestRef:
      `private://ai-graphics/external-beta/model-weight-manifest/${request.toolId}/accepted-manifest`,
    payload: {
      ...(normalized.payload ?? {}),
      gpuModelRuntimeAdmissionProofRefsProvided: true,
      nativeGpuRuntimeProofRefProvided: true,
      modelWeightManifestRefProvided: true,
      workerEnqueueStillBlockedByCurrentLane: true,
    },
  }
}

function asArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

async function runBlockedCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<GpuModelRuntimeAdmissionBlockedResult> {
  const { response, body } = await postToolCall(baseUrl, request)
  const details = body?.details ?? body?.error?.details ?? {}
  const booleans = details.booleans ?? {}
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    statusCode: response.status,
    blocked: response.status === 409,
    code: typeof body?.code === 'string' ? body.code : null,
    routeStatus: typeof details.routeStatus === 'string' ? details.routeStatus : null,
    admissionDecision:
      typeof details.admissionDecision === 'string' ? details.admissionDecision : null,
    runtimeTarget:
      typeof details.runtimeTarget === 'string' ? details.runtimeTarget : null,
    workerType: typeof details.workerType === 'string' ? details.workerType : null,
    modelWeightManifestRequired: details.modelWeightManifestRequired === true,
    gpuModelExternalBetaReadinessBlocker:
      typeof details.gpuModelExternalBetaReadinessBlocker === 'string'
        ? details.gpuModelExternalBetaReadinessBlocker
        : null,
    gpuModelAdmissionEvidenceState:
      typeof details.gpuModelAdmissionEvidenceState === 'string'
        ? details.gpuModelAdmissionEvidenceState
        : null,
    nextExternalAgentAction:
      typeof details.nextExternalAgentAction === 'string'
        ? details.nextExternalAgentAction
        : null,
    modelWeightPrivateEvidenceRequired:
      details.modelWeightPrivateEvidenceRequired === true,
    modelWeightPrivateEvidenceAccepted:
      details.modelWeightPrivateEvidenceAccepted === true,
    modelWeightManifestRefAccepted:
      details.modelWeightManifestRefAccepted === true,
    nativeGpuRuntimeProofRequired:
      details.nativeGpuRuntimeProofRequired === true,
    nativeGpuRuntimeProofAccepted:
      details.nativeGpuRuntimeProofAccepted === true,
    nativeGpuRuntimeProofRefAccepted:
      details.nativeGpuRuntimeProofRefAccepted === true,
    externalBetaPerToolRuntimeProofRecheckRequired:
      details.externalBetaPerToolRuntimeProofRecheckRequired === true,
    externalBetaPerToolRuntimeProofRecheckAccepted:
      details.externalBetaPerToolRuntimeProofRecheckAccepted === true,
    runtimeJobAdmissionReadyWithProvidedEvidence:
      details.runtimeJobAdmissionReadyWithProvidedEvidence === true,
    workerEnqueueStillBlockedByCurrentLane:
      details.workerEnqueueStillBlockedByCurrentLane === true,
    gpuModelUnblockPlan:
      details.gpuModelUnblockPlan && typeof details.gpuModelUnblockPlan === 'object'
        ? details.gpuModelUnblockPlan
        : null,
    missingRuntimeJobGates: asArray(details.missingRuntimeJobGates),
    missingRuntimeProofGates: asArray(details.missingRuntimeProofGates),
    missingPrivateModelWeightEvidence:
      asArray(details.missingPrivateModelWeightEvidence),
    gpuRuntimeStartupAuthorization:
      typeof details.gpuRuntimeStartupAuthorization === 'string'
        ? details.gpuRuntimeStartupAuthorization
        : null,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      details.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    gpuRuntimeShouldStartNow: details.gpuRuntimeShouldStartNow === true,
    routeExecutionPerformed: booleans.routeExecutionPerformed === true,
    workerDispatchPerformed: booleans.workerDispatchPerformed === true,
    toolExecutionPerformed: booleans.toolExecutionPerformed === true,
    modelWeightsLoaded: booleans.modelWeightsLoaded === true,
    publicArtifactCreated: booleans.publicArtifactCreated === true,
    signedUrlCreated: booleans.signedUrlCreated === true,
  }
}

function buildReport(
  routeMountedButAdmissionDisabledStatus: number,
  blockedResults: GpuModelRuntimeAdmissionBlockedResult[],
  proofReadyNativeOnlyResults: GpuModelRuntimeAdmissionBlockedResult[],
  proofReadyModelWeightResults: GpuModelRuntimeAdmissionBlockedResult[],
) {
  const allProofReadyResults = [
    ...proofReadyNativeOnlyResults,
    ...proofReadyModelWeightResults,
  ]
  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-tool-call-route-gpu-model-runtime-admission-smoke',
    decision,
    status,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
    routeMountedButAdmissionDisabledStatus,
    blockedResults,
    proofReadyNativeOnlyResults,
    proofReadyModelWeightResults,
    counts: {
      totalAiGraphicsTools: 21,
      controlledCanonicalRouteExecutedTools: 13,
      gpuModelRuntimeAdmissionEvaluatedTools: blockedResults.length,
      gpuModelRuntimeAdmissionBlockedTools:
        blockedResults.filter((item) => item.blocked).length,
      gpuModelUnblockPlanExposedTools:
        blockedResults.filter((item) => item.gpuModelUnblockPlan !== null).length,
      modelWeightManifestRequiredTools:
        blockedResults.filter((item) => item.modelWeightManifestRequired).length,
      privateEvidenceAndNativeGpuProofRequiredTools:
        blockedResults.filter((item) => (
          item.gpuModelExternalBetaReadinessBlocker ===
          'blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof'
        )).length,
      nativeGpuProofOnlyRequiredTools:
        blockedResults.filter((item) => (
          item.gpuModelExternalBetaReadinessBlocker ===
          'blocked_pending_native_gpu_runtime_proof'
        )).length,
      nativeGpuRuntimeProofRequiredTools:
        blockedResults.filter((item) => (
          item.missingRuntimeProofGates.some((gate) => /native NVIDIA GPU runtime proof/.test(gate))
        )).length,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
        blockedResults.filter((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob
        )).length,
      nativeGpuProofOnlyAdmissionReadyWithProvidedRefsTools:
        proofReadyNativeOnlyResults.filter((item) => (
          item.runtimeJobAdmissionReadyWithProvidedEvidence &&
          item.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue'
        )).length,
      modelWeightAdmissionReadyWithProvidedRefsTools:
        proofReadyModelWeightResults.filter((item) => (
          item.runtimeJobAdmissionReadyWithProvidedEvidence &&
          item.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue'
        )).length,
      allGpuModelAdmissionReadyWithProvidedRefsTools:
        allProofReadyResults.filter((item) => (
          item.runtimeJobAdmissionReadyWithProvidedEvidence &&
          item.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue'
        )).length,
      proofReadyGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
        proofReadyNativeOnlyResults.filter((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob
        )).length,
      proofReadyModelWeightGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
        proofReadyModelWeightResults.filter((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob
        )).length,
      allProofReadyGpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
        allProofReadyResults.filter((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob
        )).length,
      proofReadyWorkerEnqueueStillBlockedTools:
        proofReadyNativeOnlyResults.filter((item) => (
          item.workerEnqueueStillBlockedByCurrentLane
        )).length,
      proofReadyModelWeightWorkerEnqueueStillBlockedTools:
        proofReadyModelWeightResults.filter((item) => (
          item.workerEnqueueStillBlockedByCurrentLane
        )).length,
      allProofReadyWorkerEnqueueStillBlockedTools:
        allProofReadyResults.filter((item) => (
          item.workerEnqueueStillBlockedByCurrentLane
        )).length,
      proofReadyGpuRuntimeShouldStartNowTools:
        proofReadyNativeOnlyResults.filter((item) => item.gpuRuntimeShouldStartNow)
          .length,
      proofReadyModelWeightGpuRuntimeShouldStartNowTools:
        proofReadyModelWeightResults.filter((item) => item.gpuRuntimeShouldStartNow)
          .length,
      allProofReadyGpuRuntimeShouldStartNowTools:
        allProofReadyResults.filter((item) => item.gpuRuntimeShouldStartNow).length,
      gpuRuntimeShouldStartNowTools:
        blockedResults.filter((item) => item.gpuRuntimeShouldStartNow).length,
      workerDispatchPerformedTools:
        blockedResults.filter((item) => item.workerDispatchPerformed).length,
      toolExecutionPerformedTools:
        blockedResults.filter((item) => item.toolExecutionPerformed).length,
      modelWeightsLoadedTools:
        blockedResults.filter((item) => item.modelWeightsLoaded).length,
      publicArtifactCreatedTools:
        blockedResults.filter((item) => item.publicArtifactCreated).length,
      signedUrlCreatedTools:
        blockedResults.filter((item) => item.signedUrlCreated).length,
    },
    booleans: {
      canonicalToolCallRouteGpuModelRuntimeAdmissionSmokePassed: true,
      canonicalToolCallRouteGpuModelRuntimeAdmissionEvaluated: true,
      eightGpuModelToolsEvaluatedByCanonicalRouteNow: blockedResults.length === 8,
      eightGpuModelToolsRemainFailClosed: blockedResults.every((item) => item.blocked),
      allGpuModelToolsExposeActionableUnblockPlan:
        blockedResults.every((item) => item.gpuModelUnblockPlan !== null),
      fiveModelWeightToolsExposePrivateEvidenceAndNativeGpuBlocker:
        blockedResults.filter((item) => (
          item.gpuModelExternalBetaReadinessBlocker ===
          'blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof'
        )).length === 5,
      threeFoundationGpuToolsExposeNativeGpuOnlyBlocker:
        blockedResults.filter((item) => (
          item.gpuModelExternalBetaReadinessBlocker ===
          'blocked_pending_native_gpu_runtime_proof'
        )).length === 3,
      nativeGpuProofOnlyToolsAcceptPrivateProofRefsForAdmission:
        proofReadyNativeOnlyResults.length === 3 &&
        proofReadyNativeOnlyResults.every((item) => (
          nativeGpuProofOnlyTools.includes(item.toolId) &&
          item.blocked === true &&
          item.statusCode === 409 &&
          item.runtimeJobAdmissionReadyWithProvidedEvidence === true &&
          item.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue' &&
          item.nativeGpuRuntimeProofRefAccepted === true &&
          item.modelWeightManifestRefAccepted === false
        )),
      modelWeightToolsAcceptPrivateManifestAndGpuProofRefsForAdmission:
        proofReadyModelWeightResults.length === 5 &&
        proofReadyModelWeightResults.every((item) => (
          modelWeightManifestRequiredTools.includes(item.toolId) &&
          item.blocked === true &&
          item.statusCode === 409 &&
          item.runtimeJobAdmissionReadyWithProvidedEvidence === true &&
          item.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue' &&
          item.nativeGpuRuntimeProofRefAccepted === true &&
          item.nativeGpuRuntimeProofAccepted === true &&
          item.modelWeightManifestRequired === true &&
          item.modelWeightManifestRefAccepted === true &&
          item.modelWeightPrivateEvidenceAccepted === true
        )),
      allGpuModelToolsAcceptRequiredPrivateProofRefsForAdmission:
        allProofReadyResults.length === 8 &&
        allProofReadyResults.every((item) => (
          gpuModelTools.includes(item.toolId) &&
          item.blocked === true &&
          item.statusCode === 409 &&
          item.runtimeJobAdmissionReadyWithProvidedEvidence === true &&
          item.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue' &&
          item.nativeGpuRuntimeProofRefAccepted === true &&
          item.nativeGpuRuntimeProofAccepted === true
        )),
      proofReadyGpuToolsStillFailClosedBeforeWorkerEnqueue:
        proofReadyNativeOnlyResults.length === 3 &&
        proofReadyNativeOnlyResults.every((item) => (
          item.blocked === true &&
          item.workerEnqueueStillBlockedByCurrentLane === true &&
          item.workerDispatchPerformed === false &&
          item.toolExecutionPerformed === false
        )),
      proofReadyModelWeightToolsStillFailClosedBeforeWorkerEnqueue:
        proofReadyModelWeightResults.length === 5 &&
        proofReadyModelWeightResults.every((item) => (
          item.blocked === true &&
          item.workerEnqueueStillBlockedByCurrentLane === true &&
          item.workerDispatchPerformed === false &&
          item.toolExecutionPerformed === false
        )),
      allProofReadyGpuModelToolsStillFailClosedBeforeWorkerEnqueue:
        allProofReadyResults.length === 8 &&
        allProofReadyResults.every((item) => (
          item.blocked === true &&
          item.workerEnqueueStillBlockedByCurrentLane === true &&
          item.workerDispatchPerformed === false &&
          item.toolExecutionPerformed === false
        )),
      proofReadyGpuToolsDoNotStartGpuRuntime:
        proofReadyNativeOnlyResults.length === 3 &&
        proofReadyNativeOnlyResults.every((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
          item.gpuRuntimeShouldStartNow === false &&
          item.modelWeightsLoaded === false
        )),
      proofReadyModelWeightToolsDoNotLoadWeightsOrStartGpu:
        proofReadyModelWeightResults.length === 5 &&
        proofReadyModelWeightResults.every((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
          item.gpuRuntimeShouldStartNow === false &&
          item.modelWeightsLoaded === false
        )),
      allProofReadyGpuModelToolsDoNotStartGpuRuntimeOrLoadWeights:
        allProofReadyResults.length === 8 &&
        allProofReadyResults.every((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
          item.gpuRuntimeShouldStartNow === false &&
          item.modelWeightsLoaded === false
        )),
      noGpuModelToolReportsAcceptedEvidenceNow:
        blockedResults.every((item) => (
          item.modelWeightPrivateEvidenceAccepted === false &&
          item.nativeGpuRuntimeProofAccepted === false &&
          item.externalBetaPerToolRuntimeProofRecheckAccepted === false
        )),
      allGpuModelToolsReportNativeGpuProofMissing:
        blockedResults.every((item) => (
          item.missingRuntimeProofGates.some((gate) => /native NVIDIA GPU runtime proof/.test(gate))
        )),
      allModelWeightToolsReportManifestMissing:
        blockedResults
          .filter((item) => modelWeightManifestRequiredTools.includes(item.toolId))
          .every((item) => (
            item.missingRuntimeProofGates.some((gate) => /model-weight manifest/.test(gate)) &&
            item.missingPrivateModelWeightEvidence.length > 0
          )),
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow: true,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
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
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.blockedResults
    .map((item) => (
      `| \`${item.toolId}\` | \`${item.capabilityId}\` | \`${item.statusCode}\` | \`${item.runtimeTarget}\` | \`${item.gpuModelExternalBetaReadinessBlocker}\` | \`${item.nextExternalAgentAction}\` | \`${item.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')
  const proofReadyRows = report.proofReadyNativeOnlyResults
    .map((item) => (
      `| \`${item.toolId}\` | \`${item.statusCode}\` | \`${item.admissionDecision}\` | \`${item.gpuModelAdmissionEvidenceState}\` | \`${item.workerEnqueueStillBlockedByCurrentLane}\` | \`${item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob}\` | \`${item.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')
  const modelWeightProofReadyRows = report.proofReadyModelWeightResults
    .map((item) => (
      `| \`${item.toolId}\` | \`${item.statusCode}\` | \`${item.admissionDecision}\` | \`${item.gpuModelAdmissionEvidenceState}\` | \`${item.modelWeightManifestRefAccepted}\` | \`${item.nativeGpuRuntimeProofRefAccepted}\` | \`${item.workerEnqueueStillBlockedByCurrentLane}\` | \`${item.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Beta Canonical Tool-Call GPU Model Runtime Admission Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke proves the canonical external-beta tool-call route now handles the eight GPU/model tools explicitly. Each request remains fail-closed because reviewed private model-weight evidence and native NVIDIA L4 runtime proof are not accepted yet. GPU runtime remains off and can start only after a future accepted live worker enqueue for a real approved job.

## GPU/Model Admission Results

| Tool | Capability | HTTP status | Runtime target | Readiness blocker | Next external-agent action | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- |
${rows}

## Native-GPU Proof Ref Admission Results

These rows prove the canonical route now preserves accepted private native GPU proof refs for the three native-GPU-only tools. The route can mark those requests as ready for future worker enqueue, but the current lane still returns \`409\`, does not enqueue a live worker, does not dispatch, and does not start GPU runtime.

| Tool | HTTP status | Admission decision | Evidence state | Worker enqueue still blocked | GPU start allowed after accepted job | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- |
${proofReadyRows}

## Model-Weight Proof Ref Admission Results

These rows prove the canonical route now preserves both accepted private model-weight manifest refs and accepted private native GPU proof refs for the five model-weight tools. The route can mark those requests as ready for future worker enqueue, but the current lane still returns \`409\`, does not enqueue a live worker, does not dispatch, does not load model weights, and does not start GPU runtime.

| Tool | HTTP status | Admission decision | Evidence state | Model manifest ref accepted | Native GPU proof ref accepted | Worker enqueue still blocked | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- |
${modelWeightProofReadyRows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Boundary

No model weights are downloaded or loaded, no inference is performed, no Worker dispatch happens, no provider/model runtime runs, no Supabase/GCS mutation happens, and no signed URL or public artifact is created. CPU/static and browser-runtime controlled route execution remain the only canonical-route executable tool groups at 13 of 21 tools.
`
}

async function main() {
  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .filter((item) => gpuModelTools.includes(item.request.toolId))
    .map((item) => normalizeRequest(item.request))
  const proofReadyNativeOnlyCases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .filter((item) => nativeGpuProofOnlyTools.includes(item.request.toolId))
    .map((item) => normalizeProofReadyNativeGpuOnlyRequest(item.request))
  const proofReadyModelWeightCases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .filter((item) => modelWeightManifestRequiredTools.includes(item.request.toolId))
    .map((item) => normalizeProofReadyModelWeightRequest(item.request))

  assert(cases.length === 8, `Expected eight GPU/model cases, got ${cases.length}`)
  assert(
    proofReadyNativeOnlyCases.length === 3,
    `Expected three native-GPU proof-ready cases, got ${proofReadyNativeOnlyCases.length}`,
  )
  assert(
    proofReadyModelWeightCases.length === 5,
    `Expected five model-weight proof-ready cases, got ${proofReadyModelWeightCases.length}`,
  )

  const disabledStatus = await withServer(false, async (baseUrl) => {
    const { response } = await postToolCall(baseUrl, cases[0])
    return response.status
  })

  const blockedResults = await withServer(true, async (baseUrl) => {
    const results: GpuModelRuntimeAdmissionBlockedResult[] = []
    for (const request of cases) {
      results.push(await runBlockedCase(baseUrl, request))
    }
    return results
  })
  const proofReadyNativeOnlyResults = await withServer(true, async (baseUrl) => {
    const results: GpuModelRuntimeAdmissionBlockedResult[] = []
    for (const request of proofReadyNativeOnlyCases) {
      results.push(await runBlockedCase(baseUrl, request))
    }
    return results
  })
  const proofReadyModelWeightResults = await withServer(true, async (baseUrl) => {
    const results: GpuModelRuntimeAdmissionBlockedResult[] = []
    for (const request of proofReadyModelWeightCases) {
      results.push(await runBlockedCase(baseUrl, request))
    }
    return results
  })

  assert(disabledStatus === 409, `disabled GPU/model admission route should return 409, got ${disabledStatus}`)
  for (const result of blockedResults) {
    assert(result.statusCode === 409, `${result.toolId} should return 409`)
    assert(result.blocked === true, `${result.toolId} should remain blocked`)
    assert(
      result.routeStatus ===
        'gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence',
      `${result.toolId} route status mismatch`,
    )
    assert(
      result.missingRuntimeProofGates.some((gate) => /native NVIDIA GPU runtime proof/.test(gate)),
      `${result.toolId} missing native GPU proof blocker`,
    )
    if (modelWeightManifestRequiredTools.includes(result.toolId)) {
      assert(
        result.gpuModelExternalBetaReadinessBlocker ===
          'blocked_pending_private_model_weight_evidence_and_native_gpu_runtime_proof',
        `${result.toolId} should require private model evidence and native GPU proof`,
      )
      assert(
        result.nextExternalAgentAction ===
          'provide_reviewed_private_model_weight_evidence_then_native_gpu_runtime_result',
        `${result.toolId} next action mismatch`,
      )
      assert(
        result.modelWeightPrivateEvidenceRequired === true,
        `${result.toolId} should require private model evidence`,
      )
      assert(
        result.missingRuntimeProofGates.some((gate) => /model-weight manifest/.test(gate)),
        `${result.toolId} missing model-weight manifest blocker`,
      )
    } else {
      assert(
        result.gpuModelExternalBetaReadinessBlocker ===
          'blocked_pending_native_gpu_runtime_proof',
        `${result.toolId} should require native GPU proof only`,
      )
      assert(
        result.nextExternalAgentAction === 'provide_native_gpu_runtime_result',
        `${result.toolId} next action mismatch`,
      )
      assert(
        result.modelWeightPrivateEvidenceRequired === false,
        `${result.toolId} should not require private model evidence`,
      )
    }
    assert(result.gpuModelUnblockPlan !== null, `${result.toolId} missing unblock plan`)
    assert(
      result.nativeGpuRuntimeProofRequired === true,
      `${result.toolId} should require native GPU proof`,
    )
    assert(
      result.modelWeightPrivateEvidenceAccepted === false,
      `${result.toolId} unexpectedly accepted private model evidence`,
    )
    assert(
      result.modelWeightManifestRefAccepted === false,
      `${result.toolId} unexpectedly accepted model-weight manifest ref`,
    )
    assert(
      result.nativeGpuRuntimeProofAccepted === false,
      `${result.toolId} unexpectedly accepted native GPU proof`,
    )
    assert(
      result.nativeGpuRuntimeProofRefAccepted === false,
      `${result.toolId} unexpectedly accepted native GPU proof ref`,
    )
    assert(
      result.externalBetaPerToolRuntimeProofRecheckRequired === true,
      `${result.toolId} should require external-beta per-tool proof recheck`,
    )
    assert(
      result.externalBetaPerToolRuntimeProofRecheckAccepted === false,
      `${result.toolId} unexpectedly accepted per-tool proof recheck`,
    )
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched worker`)
    assert(result.toolExecutionPerformed === false, `${result.toolId} executed tool`)
    assert(result.modelWeightsLoaded === false, `${result.toolId} loaded model weights`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
  }

  for (const result of proofReadyNativeOnlyResults) {
    assert(result.statusCode === 409, `${result.toolId} proof-ready response should return 409`)
    assert(result.blocked === true, `${result.toolId} proof-ready response should remain blocked`)
    assert(
      result.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue',
      `${result.toolId} proof-ready admission decision mismatch`,
    )
    assert(
      result.runtimeJobAdmissionReadyWithProvidedEvidence === true,
      `${result.toolId} should accept provided proof refs for admission`,
    )
    assert(
      result.gpuModelAdmissionEvidenceState ===
        'proof_refs_accepted_pending_live_worker_enqueue',
      `${result.toolId} proof-ready evidence state mismatch`,
    )
    assert(
      result.nextExternalAgentAction ===
        'wait_for_live_worker_enqueue_authorization_or_submit_to_approved_worker_lane',
      `${result.toolId} proof-ready next action mismatch`,
    )
    assert(
      result.nativeGpuRuntimeProofRefAccepted === true,
      `${result.toolId} should accept the native GPU proof ref`,
    )
    assert(
      result.nativeGpuRuntimeProofAccepted === true,
      `${result.toolId} should report native GPU proof accepted`,
    )
    assert(
      result.modelWeightManifestRequired === false,
      `${result.toolId} should not require model-weight manifest ref`,
    )
    assert(
      result.modelWeightManifestRefAccepted === false,
      `${result.toolId} unexpectedly accepted a model-weight manifest ref`,
    )
    assert(
      result.missingRuntimeProofGates.length === 0,
      `${result.toolId} should not report missing runtime proof gates`,
    )
    assert(
      result.workerEnqueueStillBlockedByCurrentLane === true,
      `${result.toolId} should keep worker enqueue blocked in this lane`,
    )
    assert(
      result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
      `${result.toolId} should mark GPU start allowed only after an accepted job`,
    )
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched worker`)
    assert(result.toolExecutionPerformed === false, `${result.toolId} executed tool`)
    assert(result.modelWeightsLoaded === false, `${result.toolId} loaded model weights`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
  }

  for (const result of proofReadyModelWeightResults) {
    assert(result.statusCode === 409, `${result.toolId} proof-ready response should return 409`)
    assert(result.blocked === true, `${result.toolId} proof-ready response should remain blocked`)
    assert(
      result.admissionDecision === 'runtime_job_admission_ready_for_worker_enqueue',
      `${result.toolId} proof-ready admission decision mismatch`,
    )
    assert(
      result.runtimeJobAdmissionReadyWithProvidedEvidence === true,
      `${result.toolId} should accept provided private proof refs for admission`,
    )
    assert(
      result.gpuModelAdmissionEvidenceState ===
        'proof_refs_accepted_pending_live_worker_enqueue',
      `${result.toolId} proof-ready evidence state mismatch`,
    )
    assert(
      result.nextExternalAgentAction ===
        'wait_for_live_worker_enqueue_authorization_or_submit_to_approved_worker_lane',
      `${result.toolId} proof-ready next action mismatch`,
    )
    assert(
      result.nativeGpuRuntimeProofRefAccepted === true,
      `${result.toolId} should accept the native GPU proof ref`,
    )
    assert(
      result.nativeGpuRuntimeProofAccepted === true,
      `${result.toolId} should report native GPU proof accepted`,
    )
    assert(
      result.modelWeightManifestRequired === true,
      `${result.toolId} should require model-weight manifest ref`,
    )
    assert(
      result.modelWeightManifestRefAccepted === true,
      `${result.toolId} should accept the model-weight manifest ref`,
    )
    assert(
      result.modelWeightPrivateEvidenceAccepted === true,
      `${result.toolId} should report private model evidence accepted`,
    )
    assert(
      result.missingRuntimeProofGates.length === 0,
      `${result.toolId} should not report missing runtime proof gates`,
    )
    assert(
      result.workerEnqueueStillBlockedByCurrentLane === true,
      `${result.toolId} should keep worker enqueue blocked in this lane`,
    )
    assert(
      result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
      `${result.toolId} should mark GPU start allowed only after an accepted job`,
    )
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched worker`)
    assert(result.toolExecutionPerformed === false, `${result.toolId} executed tool`)
    assert(result.modelWeightsLoaded === false, `${result.toolId} loaded model weights`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
  }

  const report = buildReport(
    disabledStatus,
    blockedResults,
    proofReadyNativeOnlyResults,
    proofReadyModelWeightResults,
  )
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
