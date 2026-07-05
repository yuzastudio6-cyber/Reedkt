import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'

const decision =
  'ai_graphics_external_beta_tool_call_route_gpu_model_proof_ref_queue_admission_smoke_passed'
const status =
  'gpu_model_proof_ref_route_mock_queue_admission_and_claim_passed_for_eight_tools'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke.md'
const leaseSeconds = 900

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

interface GpuModelQueuedJob {
  toolId: string
  capabilityId: string
  productionToolId: string
  workerType: string
  runtimeTarget: string
  statusCode: number
  ok: boolean
  routeStatus: string | null
  queueAdmissionMode: string | null
  mockQueueJobId: string
  insertedJobCount: number
  mockOnly: boolean
  nativeGpuRuntimeProofRefAccepted: boolean
  modelWeightManifestRequired: boolean
  modelWeightManifestRefAccepted: boolean
  externalBetaPerToolRuntimeProofRecheckAccepted: boolean
  externalBetaPerToolRuntimeProofRefAccepted: boolean
  runtimeJobAdmissionReadyWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  agentCanSubmitGpuModelToolCallToQueueAdmissionNow: boolean
  agentCanExecuteGpuModelToolsNow: boolean
  agentCanExecuteAll21ToolsNow: boolean
  routeExecutionPerformed: boolean
  liveQueueWritePerformed: boolean
  workerDispatchPerformed: boolean
  toolExecutionPerformed: boolean
  gpuRuntimeShouldStartNow: boolean
  modelWeightsLoaded: boolean
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
}

interface GpuModelClaimedJob extends GpuModelQueuedJob {
  mockWorkerClaimCreated: boolean
  mockWorkerLeaseSeconds: number
  leaseExpiresAtPresent: boolean
  privateWorkerClaimLeaseOnly: boolean
  mockWorkerClaimWarningCount: number
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildRuntimeEnv(mockQueueAdmissionEnabled: boolean) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG]:
      mockQueueAdmissionEnabled ? 'true' : 'false',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_ENABLED:
      'false',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_ENABLED:
      'false',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG]:
      'true',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
  })
}

async function withServer<T>(
  mockQueueAdmissionEnabled: boolean,
  callback: (baseUrl: string) => Promise<T>,
) {
  const app = createReeditProApiApp(buildRuntimeEnv(mockQueueAdmissionEnabled))
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

function proofReadyRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  const proofPrefix = modelWeightManifestRequiredTools.has(request.toolId)
    ? 'gpu-model-proof-ref-model-weight-queue'
    : 'gpu-model-proof-ref-native-queue'
  return {
    ...request,
    requestId: request.requestId.replace('blocked-details-', `${proofPrefix}-`),
    traceId: request.traceId.replace('blocked-details', proofPrefix),
    nativeGpuRuntimeProofRef:
      `private://ai-graphics/external-beta/native-gpu-proof/${request.toolId}/accepted-result`,
    modelWeightManifestRef: modelWeightManifestRequiredTools.has(request.toolId)
      ? `private://ai-graphics/external-beta/model-weight-manifest/${request.toolId}/accepted-manifest`
      : undefined,
    externalBetaPerToolRuntimeProofRef:
      `private://ai-graphics/external-beta/per-tool-runtime-proof/${request.toolId}/accepted-recheck`,
    payload: {
      gpuModelProofRefQueueAdmissionSmoke: true,
      nativeGpuRuntimeProofRefProvided: true,
      modelWeightManifestRefProvided:
        modelWeightManifestRequiredTools.has(request.toolId),
      externalBetaPerToolRuntimeProofRefProvided: true,
      routeExecutionPerformed: true,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
    },
  }
}

async function runRouteAdmissionCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<GpuModelQueuedJob> {
  const { response, body } = await postToolCall(baseUrl, request)
  const data = body?.data ?? {}
  const booleans = data.booleans ?? {}
  const queueResult = data.queueResult ?? {}
  const jobIds = Array.isArray(queueResult.jobIds) ? queueResult.jobIds : []
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    productionToolId:
      typeof data.productionToolId === 'string' ? data.productionToolId : '',
    workerType: typeof data.workerType === 'string' ? data.workerType : '',
    runtimeTarget: typeof data.runtimeTarget === 'string' ? data.runtimeTarget : '',
    statusCode: response.status,
    ok: body?.ok === true,
    routeStatus: typeof data.routeStatus === 'string' ? data.routeStatus : null,
    queueAdmissionMode:
      typeof data.queueAdmissionMode === 'string' ? data.queueAdmissionMode : null,
    mockQueueJobId: typeof jobIds[0] === 'string' ? jobIds[0] : '',
    insertedJobCount:
      typeof queueResult.insertedJobCount === 'number'
        ? queueResult.insertedJobCount
        : 0,
    mockOnly: queueResult.mockOnly === true,
    nativeGpuRuntimeProofRefAccepted:
      data.nativeGpuRuntimeProofRefAccepted === true,
    modelWeightManifestRequired: data.modelWeightManifestRequired === true,
    modelWeightManifestRefAccepted:
      data.modelWeightManifestRefAccepted === true,
    externalBetaPerToolRuntimeProofRecheckAccepted:
      data.externalBetaPerToolRuntimeProofRecheckAccepted === true,
    externalBetaPerToolRuntimeProofRefAccepted:
      data.externalBetaPerToolRuntimeProofRefAccepted === true,
    runtimeJobAdmissionReadyWithProvidedEvidence:
      data.runtimeJobAdmissionReadyWithProvidedEvidence === true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      data.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    agentCanSubmitGpuModelToolCallToQueueAdmissionNow:
      booleans.agentCanSubmitGpuModelToolCallToQueueAdmissionNow === true,
    agentCanExecuteGpuModelToolsNow:
      booleans.agentCanExecuteGpuModelToolsNow === true,
    agentCanExecuteAll21ToolsNow:
      booleans.agentCanExecuteAll21ToolsNow === true,
    routeExecutionPerformed: booleans.routeExecutionPerformed === true,
    liveQueueWritePerformed: booleans.liveQueueWritePerformed === true,
    workerDispatchPerformed: booleans.workerDispatchPerformed === true,
    toolExecutionPerformed: booleans.toolExecutionPerformed === true,
    gpuRuntimeShouldStartNow: booleans.gpuRuntimeShouldStartNow === true,
    modelWeightsLoaded: booleans.modelWeightsLoaded === true,
    publicArtifactCreated: booleans.publicArtifactCreated === true,
    signedUrlCreated: booleans.signedUrlCreated === true,
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.workerClaims
    .map((item) => (
      `| \`${item.toolId}\` | \`${item.capabilityId}\` | \`${item.statusCode}\` | \`${item.queueAdmissionMode}\` | \`${item.mockWorkerClaimCreated}\` | \`${item.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Beta GPU Model Proof-Ref Queue Admission Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke proves the canonical external-beta tool-call route can accept the eight GPU/model tools into mock queue admission when required private proof refs are present. It also claims each mock job through the existing runtime queue service. It does not execute workers, tools, GPU runtime, model loading, live Supabase writes, signed URLs, or public artifacts.

## GPU/model queue admission and claim

| Tool | Capability | HTTP status | Queue mode | Mock claim created | GPU starts now |
| --- | --- | --- | --- | --- | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}
`
}

function buildReport(
  queueDisabledProofReadyStatus: number,
  routeQueuedJobs: GpuModelQueuedJob[],
  workerClaims: GpuModelClaimedJob[],
) {
  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke',
    decision,
    status,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
    queueAdmissionFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    queueDisabledProofReadyStatus,
    gpuModelTools,
    routeQueuedJobs,
    workerClaims,
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelToolsCovered: routeQueuedJobs.length,
      gpuModelProofRefMockQueueAdmissionAcceptedTools:
        routeQueuedJobs.filter((item) => item.statusCode === 202 && item.ok).length,
      gpuModelRuntimeAdmissionReadyWithProvidedEvidenceTools:
        routeQueuedJobs.filter(
          (item) => item.runtimeJobAdmissionReadyWithProvidedEvidence,
        ).length,
      nativeGpuRuntimeProofRefAcceptedTools:
        routeQueuedJobs.filter((item) => item.nativeGpuRuntimeProofRefAccepted)
          .length,
      modelWeightManifestRefAcceptedTools:
        routeQueuedJobs.filter((item) => item.modelWeightManifestRefAccepted)
          .length,
      modelWeightManifestRequiredTools:
        routeQueuedJobs.filter((item) => item.modelWeightManifestRequired).length,
      mockQueueInsertedJobs:
        routeQueuedJobs.reduce((sum, item) => sum + item.insertedJobCount, 0),
      mockWorkerClaimsCreated: workerClaims.length,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
        routeQueuedJobs.filter(
          (item) => item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
        ).length,
      liveQueueWritePerformedTools:
        routeQueuedJobs.filter((item) => item.liveQueueWritePerformed).length,
      workerDispatchPerformedTools:
        routeQueuedJobs.filter((item) => item.workerDispatchPerformed).length,
      toolExecutionPerformedTools:
        routeQueuedJobs.filter((item) => item.toolExecutionPerformed).length,
      gpuRuntimeShouldStartNowTools:
        routeQueuedJobs.filter((item) => item.gpuRuntimeShouldStartNow).length,
      modelWeightsLoadedTools:
        routeQueuedJobs.filter((item) => item.modelWeightsLoaded).length,
      publicArtifactCreatedTools:
        routeQueuedJobs.filter((item) => item.publicArtifactCreated).length,
      signedUrlCreatedTools:
        routeQueuedJobs.filter((item) => item.signedUrlCreated).length,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteGpuModelProofRefQueueAdmissionSmokePassed: true,
      all8GpuModelToolsCovered: routeQueuedJobs.length === 8,
      all8GpuModelProofRefMockQueueAdmissionsAccepted:
        routeQueuedJobs.length === 8 &&
        routeQueuedJobs.every((item) => item.statusCode === 202 && item.ok),
      all8GpuModelMockJobsClaimed: workerClaims.length === 8,
      mockOnlyRuntimeModeEnforced: true,
      privateWorkerClaimLeaseOnly: true,
      routeQueueAdmissionRequiresProofRefs: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanSubmitGpuModelToolCallToQueueAdmissionNow: true,
      agentCanClaimMockGpuModelWorkerLeaseNow: true,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionPerformed: true,
      mockWorkerClaimPerformed: true,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      liveWorkerClaimPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
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
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
  }
}

async function main() {
  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
    .filter((item) => gpuModelTools.includes(item.request.toolId as never))
    .map((item) => ({ request: proofReadyRequest(item.request) }))

  assert(cases.length === 8, `Expected eight GPU/model cases, got ${cases.length}`)

  const queueDisabledProofReadyStatus = await withServer(false, async (baseUrl) => {
    const { response } = await postToolCall(baseUrl, cases[0].request)
    return response.status
  })
  assert(
    queueDisabledProofReadyStatus === 409,
    `proof-ready GPU/model route with queue disabled should return 409, got ${queueDisabledProofReadyStatus}`,
  )

  const routeQueuedJobs = await withServer(true, async (baseUrl) => {
    const results: GpuModelQueuedJob[] = []
    for (const item of cases) {
      results.push(await runRouteAdmissionCase(baseUrl, item.request))
    }
    return results
  })

  const expectedRouteStatus =
    'external_beta_tool_call_route_gpu_model_proof_ref_mock_queue_admission_accepted_runtime_still_blocked'
  for (const job of routeQueuedJobs) {
    assert(job.statusCode === 202, `${job.toolId} did not return 202`)
    assert(job.ok === true, `${job.toolId} did not return ok envelope`)
    assert(job.routeStatus === expectedRouteStatus, `${job.toolId} route status mismatch`)
    assert(
      job.queueAdmissionMode === 'mock_only_gpu_model_proof_ref',
      `${job.toolId} queue mode mismatch`,
    )
    assert(job.insertedJobCount === 1, `${job.toolId} did not insert one mock queue job`)
    assert(job.mockOnly === true, `${job.toolId} queue result was not mock-only`)
    assert(Boolean(job.mockQueueJobId), `${job.toolId} route response missing mock queue job id`)
    assert(job.workerType === 'gpu_ai_worker', `${job.toolId} worker type mismatch`)
    assert(
      /native_linux_amd64_nvidia_l4/.test(job.runtimeTarget),
      `${job.toolId} runtime target was not native GPU`,
    )
    assert(job.nativeGpuRuntimeProofRefAccepted === true, `${job.toolId} native proof was not accepted`)
    assert(
      job.externalBetaPerToolRuntimeProofRecheckAccepted === true,
      `${job.toolId} per-tool runtime proof recheck was not accepted`,
    )
    assert(
      job.externalBetaPerToolRuntimeProofRefAccepted === true,
      `${job.toolId} per-tool runtime proof ref was not accepted`,
    )
    if (modelWeightManifestRequiredTools.has(job.toolId)) {
      assert(job.modelWeightManifestRefAccepted === true, `${job.toolId} model manifest was not accepted`)
    } else {
      assert(job.modelWeightManifestRefAccepted === false, `${job.toolId} unexpectedly accepted model manifest`)
    }
    assert(
      job.runtimeJobAdmissionReadyWithProvidedEvidence === true,
      `${job.toolId} runtime admission was not ready with refs`,
    )
    assert(
      job.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
      `${job.toolId} did not report future on-demand GPU start eligibility`,
    )
    assert(
      job.agentCanSubmitGpuModelToolCallToQueueAdmissionNow === true,
      `${job.toolId} was not route queue-admission callable`,
    )
    assert(job.agentCanExecuteGpuModelToolsNow === false, `${job.toolId} enabled GPU tool execution`)
    assert(job.agentCanExecuteAll21ToolsNow === false, `${job.toolId} enabled all-tool execution`)
    assert(job.routeExecutionPerformed === true, `${job.toolId} route did not run`)
    assert(job.liveQueueWritePerformed === false, `${job.toolId} performed live queue write`)
    assert(job.workerDispatchPerformed === false, `${job.toolId} dispatched worker`)
    assert(job.toolExecutionPerformed === false, `${job.toolId} executed tool`)
    assert(job.gpuRuntimeShouldStartNow === false, `${job.toolId} started GPU runtime`)
    assert(job.modelWeightsLoaded === false, `${job.toolId} loaded model weights`)
    assert(job.publicArtifactCreated === false, `${job.toolId} created public artifact`)
    assert(job.signedUrlCreated === false, `${job.toolId} created signed URL`)
  }

  const env = buildRuntimeEnv(true)
  assert(env.mockOnly === true, 'GPU/model worker claim smoke must run with mockOnly=true')
  const queueService = createAiGraphicsToolRuntimeQueueService({
    env,
    clients: { admin: null, public: null },
    requestId:
      'ai-graphics-external-beta-tool-call-route-gpu-model-proof-ref-queue-admission-smoke',
    auth: {
      userId:
        'ai_graphics_external_beta_gpu_model_proof_ref_queue_admission_smoke_user',
      isMockUser: true,
    },
  })

  const workerClaims: GpuModelClaimedJob[] = []
  for (const routeJob of routeQueuedJobs) {
    const claim = await queueService.claimToolRuntimeJob({
      jobId: routeJob.mockQueueJobId,
      workerType: routeJob.workerType,
      workerInstanceId:
        'ai_graphics_external_beta_gpu_model_proof_ref_queue_admission_worker',
      idempotencyKey:
        `ai-graphics-external-beta-gpu-model-proof-ref-queue-admission-smoke:claim:${routeJob.toolId}`,
      leaseSeconds,
    })
    const claimResult = claim.claimResult as Record<string, any>
    assert(claimResult.mockOnly === true, `${routeJob.toolId} claim was not mock-only`)
    assert(
      claimResult.jobId === routeJob.mockQueueJobId,
      `${routeJob.toolId} claim did not use the route-created mock queue job id`,
    )
    assert(
      claimResult.toolExecutionPerformed === false,
      `${routeJob.toolId} claim executed the tool`,
    )
    assert(Boolean(claimResult.workerClaimId), `${routeJob.toolId} missing worker claim id`)
    assert(Boolean(claimResult.leaseExpiresAt), `${routeJob.toolId} missing lease expiry`)
    workerClaims.push({
      ...routeJob,
      mockWorkerClaimCreated: true,
      mockWorkerLeaseSeconds: leaseSeconds,
      leaseExpiresAtPresent: true,
      privateWorkerClaimLeaseOnly: true,
      mockWorkerClaimWarningCount: claim.warnings.length,
    })
  }

  const report = buildReport(queueDisabledProofReadyStatus, routeQueuedJobs, workerClaims)
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
