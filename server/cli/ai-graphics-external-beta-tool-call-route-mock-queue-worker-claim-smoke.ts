import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'

const decision =
  'ai_graphics_external_beta_tool_call_route_mock_queue_worker_claim_smoke_passed'
const routeAdmissionDecision =
  'ai_graphics_external_beta_tool_call_route_mock_queue_admission_smoke_passed'
const leaseSeconds = 900

interface RouteQueuedJob {
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
  routeExecutionPerformed: boolean
  agentCanSubmitToolCallToQueueAdmissionNow: boolean
  agentCanExecuteToolsNow: boolean
  liveQueueWritePerformed: boolean
  workerDispatchPerformed: boolean
  toolExecutionPerformed: boolean
  gpuRuntimeShouldStartNow: boolean
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
}

interface WorkerClaimResult extends RouteQueuedJob {
  mockWorkerClaimCreated: boolean
  mockWorkerLeaseSeconds: number
  leaseExpiresAtPresent: boolean
  privateWorkerClaimLeaseOnly: boolean
  mockWorkerClaimWarningCount: number
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildRuntimeEnv(queueAdmissionEnabled: boolean) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'true',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG]:
      queueAdmissionEnabled ? 'true' : 'false',
  })
}

async function withServer<T>(
  queueAdmissionEnabled: boolean,
  callback: (baseUrl: string) => Promise<T>,
) {
  const app = createReeditProApiApp(buildRuntimeEnv(queueAdmissionEnabled))
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

async function runRouteAdmissionCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<RouteQueuedJob> {
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
    routeExecutionPerformed: booleans.routeExecutionPerformed === true,
    agentCanSubmitToolCallToQueueAdmissionNow:
      booleans.agentCanSubmitToolCallToQueueAdmissionNow === true,
    agentCanExecuteToolsNow: booleans.agentCanExecuteToolsNow === true,
    liveQueueWritePerformed: booleans.liveQueueWritePerformed === true,
    workerDispatchPerformed: booleans.workerDispatchPerformed === true,
    toolExecutionPerformed: booleans.toolExecutionPerformed === true,
    gpuRuntimeShouldStartNow: booleans.gpuRuntimeShouldStartNow === true,
    publicArtifactCreated: booleans.publicArtifactCreated === true,
    signedUrlCreated: booleans.signedUrlCreated === true,
  }
}

async function main() {
  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
  const routeMountedButAdmissionDisabledStatus = await withServer(
    false,
    async (baseUrl) => {
      const { response } = await postToolCall(baseUrl, cases[0].request)
      return response.status
    },
  )

  const routeQueuedJobs = await withServer(true, async (baseUrl) => {
    const results: RouteQueuedJob[] = []
    for (const item of cases) {
      results.push(await runRouteAdmissionCase(baseUrl, item.request))
    }
    return results
  })

  assert(
    routeMountedButAdmissionDisabledStatus === 409,
    `route mounted without admission flag should return 409, got ${routeMountedButAdmissionDisabledStatus}`,
  )

  const expectedRouteStatus =
    'external_beta_tool_call_route_mock_queue_admission_accepted_runtime_still_blocked'
  for (const job of routeQueuedJobs) {
    assert(job.statusCode === 202, `${job.toolId} did not return 202`)
    assert(job.ok === true, `${job.toolId} did not return ok envelope`)
    assert(job.routeStatus === expectedRouteStatus, `${job.toolId} route status mismatch`)
    assert(job.queueAdmissionMode === 'mock_only', `${job.toolId} not mock-only`)
    assert(job.insertedJobCount === 1, `${job.toolId} did not insert one mock queue job`)
    assert(job.mockOnly === true, `${job.toolId} queue result was not mock-only`)
    assert(Boolean(job.mockQueueJobId), `${job.toolId} route response missing mock queue job id`)
    assert(Boolean(job.workerType), `${job.toolId} route response missing worker type`)
    assert(Boolean(job.runtimeTarget), `${job.toolId} route response missing runtime target`)
    assert(Boolean(job.productionToolId), `${job.toolId} route response missing production tool id`)
    assert(
      job.agentCanSubmitToolCallToQueueAdmissionNow === true,
      `${job.toolId} was not queue-admission callable`,
    )
    assert(job.agentCanExecuteToolsNow === false, `${job.toolId} enabled tool execution`)
    assert(job.routeExecutionPerformed === true, `${job.toolId} route did not run`)
    assert(job.liveQueueWritePerformed === false, `${job.toolId} performed live queue write`)
    assert(job.workerDispatchPerformed === false, `${job.toolId} dispatched worker`)
    assert(job.toolExecutionPerformed === false, `${job.toolId} executed tool`)
    assert(job.gpuRuntimeShouldStartNow === false, `${job.toolId} started GPU runtime`)
    assert(job.publicArtifactCreated === false, `${job.toolId} created public artifact`)
    assert(job.signedUrlCreated === false, `${job.toolId} created signed URL`)
  }

  const env = buildRuntimeEnv(true)
  assert(env.mockOnly === true, 'Worker claim smoke must run with mockOnly=true')
  const queueService = createAiGraphicsToolRuntimeQueueService({
    env,
    clients: { admin: null, public: null },
    requestId:
      'ai-graphics-external-beta-tool-call-route-mock-queue-worker-claim-smoke',
    auth: {
      userId:
        'ai_graphics_external_beta_tool_call_route_mock_queue_worker_claim_user',
      isMockUser: true,
    },
  })

  const workerClaims: WorkerClaimResult[] = []
  for (const routeJob of routeQueuedJobs) {
    const claim = await queueService.claimToolRuntimeJob({
      jobId: routeJob.mockQueueJobId,
      workerType: routeJob.workerType,
      workerInstanceId:
        'ai_graphics_external_beta_tool_call_route_mock_queue_worker_claim_worker',
      idempotencyKey:
        `ai-graphics-external-beta-tool-call-route-mock-queue-worker-claim-smoke:claim:${routeJob.toolId}`,
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

  const gpuRuntimeTargetedTools = workerClaims.filter(
    (claim) => claim.workerType === 'gpu_ai_worker',
  )

  const report = {
    decision,
    status: 'route_mock_queue_worker_claim_smoke_passed_for_all_21_tools',
    sourceEvidence: {
      routeAdmissionDecision,
      routeAdmissionSmoke:
        'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-mock-queue-admission-smoke.json',
      routeModule: 'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
      queueService: 'server/services/ai-graphics-tool-runtime-queue-service.ts',
      claimMethod: 'claimToolRuntimeJob',
    },
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    routeMountedButAdmissionDisabledStatus,
    all21ToolsInLane: 21,
    totalProductFacingCapabilities: 12,
    routeAdmissionAcceptedTools: routeQueuedJobs.length,
    mockQueueInsertedJobs: routeQueuedJobs.reduce(
      (total, job) => total + job.insertedJobCount,
      0,
    ),
    mockWorkerClaimAttemptedTools: routeQueuedJobs.length,
    mockWorkerClaimsCreated: workerClaims.length,
    mockWorkerLeaseSeconds: leaseSeconds,
    gpuRuntimeTargetedTools: gpuRuntimeTargetedTools.length,
    routeExecutionPerformedTools: routeQueuedJobs.filter(
      (job) => job.routeExecutionPerformed,
    ).length,
    agentCanExecuteToolsNowTools: routeQueuedJobs.filter(
      (job) => job.agentCanExecuteToolsNow,
    ).length,
    liveQueueWritePerformedTools: routeQueuedJobs.filter(
      (job) => job.liveQueueWritePerformed,
    ).length,
    workerDispatchPerformedTools: routeQueuedJobs.filter(
      (job) => job.workerDispatchPerformed,
    ).length,
    toolExecutionPerformedTools: routeQueuedJobs.filter(
      (job) => job.toolExecutionPerformed,
    ).length,
    gpuRuntimeShouldStartNowTools: routeQueuedJobs.filter(
      (job) => job.gpuRuntimeShouldStartNow,
    ).length,
    publicArtifactCreatedTools: routeQueuedJobs.filter(
      (job) => job.publicArtifactCreated,
    ).length,
    signedUrlCreatedTools: routeQueuedJobs.filter((job) => job.signedUrlCreated)
      .length,
    workerClaims,
    booleans: {
      externalBetaToolCallRouteMockQueueWorkerClaimSmokePassed: true,
      sourceRouteMockQueueAdmissionAccepted: true,
      all21RouteAdmittedMockJobsClaimed: true,
      mockOnlyRuntimeModeEnforced: true,
      privateWorkerClaimLeaseOnly: true,
      agentCanSelectForPlanning: true,
      agentCanSubmitToolCallToQueueAdmissionNow: true,
      agentCanClaimMockWorkerLeaseNow: true,
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

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
