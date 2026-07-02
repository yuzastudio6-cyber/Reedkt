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
) {
  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-tool-call-route-gpu-model-runtime-admission-smoke',
    decision,
    status,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
    routeMountedButAdmissionDisabledStatus,
    blockedResults,
    counts: {
      totalAiGraphicsTools: 21,
      controlledCanonicalRouteExecutedTools: 13,
      gpuModelRuntimeAdmissionEvaluatedTools: blockedResults.length,
      gpuModelRuntimeAdmissionBlockedTools:
        blockedResults.filter((item) => item.blocked).length,
      modelWeightManifestRequiredTools:
        blockedResults.filter((item) => item.modelWeightManifestRequired).length,
      nativeGpuRuntimeProofRequiredTools:
        blockedResults.filter((item) => (
          item.missingRuntimeProofGates.some((gate) => /native NVIDIA GPU runtime proof/.test(gate))
        )).length,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
        blockedResults.filter((item) => (
          item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob
        )).length,
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
      `| \`${item.toolId}\` | \`${item.capabilityId}\` | \`${item.statusCode}\` | \`${item.runtimeTarget}\` | \`${item.modelWeightManifestRequired}\` | \`${item.admissionDecision}\` | \`${item.gpuRuntimeStartupAuthorization}\` | \`${item.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Beta Canonical Tool-Call GPU Model Runtime Admission Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke proves the canonical external-beta tool-call route now handles the eight GPU/model tools explicitly. Each request remains fail-closed because reviewed private model-weight evidence and native NVIDIA L4 runtime proof are not accepted yet. GPU runtime remains off and can start only after a future accepted live worker enqueue for a real approved job.

## GPU/Model Admission Results

| Tool | Capability | HTTP status | Runtime target | Model manifest required | Admission decision | GPU startup authorization | GPU starts now |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

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

  assert(cases.length === 8, `Expected eight GPU/model cases, got ${cases.length}`)

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
        result.missingRuntimeProofGates.some((gate) => /model-weight manifest/.test(gate)),
        `${result.toolId} missing model-weight manifest blocker`,
      )
    }
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched worker`)
    assert(result.toolExecutionPerformed === false, `${result.toolId} executed tool`)
    assert(result.modelWeightsLoaded === false, `${result.toolId} loaded model weights`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
  }

  const report = buildReport(disabledStatus, blockedResults)
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
