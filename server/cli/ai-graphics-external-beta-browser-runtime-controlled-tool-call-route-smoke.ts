import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequest,
  listAiGraphicsExternalBetaBrowserRuntimeControlledToolCallReadinessCases,
} from '../routes/ai-graphics-external-beta-browser-runtime-controlled-tool-call-routes'

const decision =
  'ai_graphics_external_beta_browser_runtime_controlled_tool_call_route_smoke_passed'

interface RouteSmokeResult {
  toolId: string
  capabilityId: string
  statusCode: number
  ok: boolean
  routeStatus: string | null
  externalAgentCanExecuteBrowserRuntimeControlledToolsNow: boolean
  controlledBrowserRuntimeRouteExecutionPerformed: boolean
  adapterExecutedNow: boolean
  localBrowserRuntimePackageExecutionPerformed: boolean
  scopedBrowserRuntimePerformedNow: boolean
  outputKind: string | null
  outputSha256: string | null
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
  gpuRuntimeShouldStartNow: boolean
  providerRuntimeApprovedNow: boolean
}

function buildRuntimeEnv(routeEnabled: boolean) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED: 'false',
    [AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_FLAG]:
      routeEnabled ? 'true' : 'false',
  })
}

async function withServer<T>(routeEnabled: boolean, callback: (baseUrl: string) => Promise<T>) {
  const app = createReeditProApiApp(buildRuntimeEnv(routeEnabled))
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
  request: AiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequest,
) {
  const response = await fetch(
    `${baseUrl}${AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_PATH}`,
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

async function runRouteSmokeCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequest,
): Promise<RouteSmokeResult> {
  const { response, body } = await postToolCall(baseUrl, request)
  const data = body?.data ?? {}
  const adapterResult = data.adapterResult ?? {}
  const output = adapterResult.output ?? {}
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    statusCode: response.status,
    ok: body?.ok === true,
    routeStatus: typeof data.routeStatus === 'string' ? data.routeStatus : null,
    externalAgentCanExecuteBrowserRuntimeControlledToolsNow:
      data.externalAgentCanExecuteBrowserRuntimeControlledToolsNow === true,
    controlledBrowserRuntimeRouteExecutionPerformed:
      data.controlledBrowserRuntimeRouteExecutionPerformed === true,
    adapterExecutedNow: adapterResult.controlledAdapterExecutedNow === true,
    localBrowserRuntimePackageExecutionPerformed:
      adapterResult.localBrowserRuntimePackageExecutionPerformed === true,
    scopedBrowserRuntimePerformedNow: data.scopedBrowserRuntimePerformedNow === true,
    outputKind: typeof output.outputKind === 'string' ? output.outputKind : null,
    outputSha256:
      typeof output.privateArtifactSha256 === 'string' ? output.privateArtifactSha256 : null,
    publicArtifactCreated: data.outputAccess?.publicArtifactCreated === true,
    signedUrlCreated: data.outputAccess?.signedUrlCreated === true,
    gpuRuntimeShouldStartNow: data.gpuRuntimeShouldStartNow === true,
    providerRuntimeApprovedNow: data.providerRuntimeApprovedNow === true,
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function main() {
  const cases = listAiGraphicsExternalBetaBrowserRuntimeControlledToolCallReadinessCases()
  const disabledStatus = await withServer(false, async (baseUrl) => {
    const { response } = await postToolCall(baseUrl, cases[0].request)
    return response.status
  })

  const routeResults = await withServer(true, async (baseUrl) => {
    const results: RouteSmokeResult[] = []
    for (const item of cases) {
      results.push(await runRouteSmokeCase(baseUrl, item.request))
    }
    return results
  })

  assert(disabledStatus === 404, `disabled route should return 404, got ${disabledStatus}`)
  for (const result of routeResults) {
    assert(result.statusCode === 200, `${result.toolId} did not return 200`)
    assert(result.ok === true, `${result.toolId} did not return ok envelope`)
    assert(
      result.externalAgentCanExecuteBrowserRuntimeControlledToolsNow === true,
      `${result.toolId} was not marked scoped browser-callable`,
    )
    assert(
      result.controlledBrowserRuntimeRouteExecutionPerformed === true,
      `${result.toolId} route execution was not performed`,
    )
    assert(result.adapterExecutedNow === true, `${result.toolId} adapter did not execute`)
    assert(
      result.localBrowserRuntimePackageExecutionPerformed === true,
      `${result.toolId} browser runtime did not execute`,
    )
    assert(result.scopedBrowserRuntimePerformedNow === true, `${result.toolId} missing scoped runtime marker`)
    assert(Boolean(result.outputKind), `${result.toolId} missing output kind`)
    assert(Boolean(result.outputSha256), `${result.toolId} missing output hash`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.providerRuntimeApprovedNow === false, `${result.toolId} approved provider runtime`)
  }

  const report = {
    decision,
    status: 'controlled_browser_runtime_route_smoke_passed_for_seven_tools',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_FLAG,
    disabledRouteStatus: disabledStatus,
    controlledBrowserRuntimeRouteExecutedTools: routeResults.length,
    controlledBrowserRuntimeRouteCallableNowTools: routeResults.filter(
      (result) => result.externalAgentCanExecuteBrowserRuntimeControlledToolsNow,
    ).length,
    controlledBrowserRuntimeAdapterExecutedTools: routeResults.filter((result) => result.adapterExecutedNow).length,
    localBrowserRuntimePackageExecutionPerformedTools: routeResults.filter(
      (result) => result.localBrowserRuntimePackageExecutionPerformed,
    ).length,
    scopedControlledToolsCallableNow: 13,
    all21ToolsInLane: 21,
    remainingToolsStillBlockedForRuntime: 8,
    gpuRuntimeShouldStartNowTools: routeResults.filter((result) => result.gpuRuntimeShouldStartNow)
      .length,
    providerRuntimeApprovedNowTools: routeResults.filter((result) => result.providerRuntimeApprovedNow)
      .length,
    publicArtifactCreatedTools: routeResults.filter((result) => result.publicArtifactCreated)
      .length,
    signedUrlCreatedTools: routeResults.filter((result) => result.signedUrlCreated).length,
    routeResults,
    booleans: {
      externalBetaBrowserRuntimeControlledToolCallRouteSmokePassed: true,
      externalAgentCanExecuteBrowserRuntimeControlledToolsNow: true,
      scopedBrowserRuntimePerformedNow: true,
      scopedControlledToolsCallableNow: 13,
      agentCanExecuteAll21ToolsNow: false,
      gpuRuntimeShouldStartNow: false,
      providerRuntimeApprovedNow: false,
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
