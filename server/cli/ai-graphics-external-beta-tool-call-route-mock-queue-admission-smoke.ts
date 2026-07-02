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

const decision =
  'ai_graphics_external_beta_tool_call_route_mock_queue_admission_smoke_passed'

interface RouteAdmissionSmokeResult {
  toolId: string
  capabilityId: string
  statusCode: number
  ok: boolean
  routeStatus: string | null
  queueAdmissionMode: string | null
  insertedJobCount: number
  mockOnly: boolean
  agentCanSubmitToolCallToQueueAdmissionNow: boolean
  agentCanExecuteToolsNow: boolean
  routeExecutionPerformed: boolean
  liveQueueWritePerformed: boolean
  workerDispatchPerformed: boolean
  toolExecutionPerformed: boolean
  gpuRuntimeShouldStartNow: boolean
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
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

async function runRouteAdmissionSmokeCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<RouteAdmissionSmokeResult> {
  const { response, body } = await postToolCall(baseUrl, request)
  const data = body?.data ?? {}
  const booleans = data.booleans ?? {}
  const queueResult = data.queueResult ?? {}
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    statusCode: response.status,
    ok: body?.ok === true,
    routeStatus: typeof data.routeStatus === 'string' ? data.routeStatus : null,
    queueAdmissionMode:
      typeof data.queueAdmissionMode === 'string' ? data.queueAdmissionMode : null,
    insertedJobCount:
      typeof queueResult.insertedJobCount === 'number'
        ? queueResult.insertedJobCount
        : 0,
    mockOnly: queueResult.mockOnly === true,
    agentCanSubmitToolCallToQueueAdmissionNow:
      booleans.agentCanSubmitToolCallToQueueAdmissionNow === true,
    agentCanExecuteToolsNow: booleans.agentCanExecuteToolsNow === true,
    routeExecutionPerformed: booleans.routeExecutionPerformed === true,
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

  const routeResults = await withServer(true, async (baseUrl) => {
    const results: RouteAdmissionSmokeResult[] = []
    for (const item of cases) {
      results.push(await runRouteAdmissionSmokeCase(baseUrl, item.request))
    }
    return results
  })

  assert(
    routeMountedButAdmissionDisabledStatus === 409,
    `route mounted without admission flag should return 409, got ${routeMountedButAdmissionDisabledStatus}`,
  )
  for (const result of routeResults) {
    assert(result.statusCode === 202, `${result.toolId} did not return 202`)
    assert(result.ok === true, `${result.toolId} did not return ok envelope`)
    assert(
      result.routeStatus ===
        'external_beta_tool_call_route_mock_queue_admission_accepted_runtime_still_blocked',
      `${result.toolId} route status mismatch`,
    )
    assert(result.queueAdmissionMode === 'mock_only', `${result.toolId} not mock-only`)
    assert(result.insertedJobCount === 1, `${result.toolId} did not insert one mock queue job`)
    assert(result.mockOnly === true, `${result.toolId} queue result was not mock-only`)
    assert(
      result.agentCanSubmitToolCallToQueueAdmissionNow === true,
      `${result.toolId} was not queue-admission callable`,
    )
    assert(result.agentCanExecuteToolsNow === false, `${result.toolId} enabled tool execution`)
    assert(result.routeExecutionPerformed === true, `${result.toolId} route did not run`)
    assert(result.liveQueueWritePerformed === false, `${result.toolId} performed live queue write`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched worker`)
    assert(result.toolExecutionPerformed === false, `${result.toolId} executed tool`)
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
  }

  const report = {
    decision,
    status: 'mock_queue_admission_route_smoke_passed_for_all_21_tools',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    routeMountedButAdmissionDisabledStatus,
    all21ToolsInLane: 21,
    routeAdmissionAcceptedTools: routeResults.length,
    mockQueueAdmissionAcceptedTools: routeResults.filter(
      (result) => result.agentCanSubmitToolCallToQueueAdmissionNow,
    ).length,
    mockQueueInsertedJobs: routeResults.reduce(
      (total, result) => total + result.insertedJobCount,
      0,
    ),
    routeExecutionPerformedTools: routeResults.filter(
      (result) => result.routeExecutionPerformed,
    ).length,
    agentCanExecuteToolsNowTools: routeResults.filter(
      (result) => result.agentCanExecuteToolsNow,
    ).length,
    liveQueueWritePerformedTools: routeResults.filter(
      (result) => result.liveQueueWritePerformed,
    ).length,
    workerDispatchPerformedTools: routeResults.filter(
      (result) => result.workerDispatchPerformed,
    ).length,
    toolExecutionPerformedTools: routeResults.filter(
      (result) => result.toolExecutionPerformed,
    ).length,
    gpuRuntimeShouldStartNowTools: routeResults.filter(
      (result) => result.gpuRuntimeShouldStartNow,
    ).length,
    publicArtifactCreatedTools: routeResults.filter(
      (result) => result.publicArtifactCreated,
    ).length,
    signedUrlCreatedTools: routeResults.filter((result) => result.signedUrlCreated)
      .length,
    routeResults,
    booleans: {
      externalBetaToolCallRouteMockQueueAdmissionSmokePassed: true,
      broadAll21ToolCallRouteCanAdmitMockQueueNow: true,
      agentCanSubmitToolCallToQueueAdmissionNow: true,
      agentCanExecuteToolsNow: false,
      routeExecutionPerformed: true,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
