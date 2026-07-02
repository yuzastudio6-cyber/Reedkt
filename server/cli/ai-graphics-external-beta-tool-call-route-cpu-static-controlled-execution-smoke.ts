import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'

const decision =
  'ai_graphics_external_beta_tool_call_route_cpu_static_controlled_execution_smoke_passed'
const status =
  'canonical_tool_call_route_cpu_static_controlled_execution_passed_for_six_tools'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-cpu-static-controlled-execution-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-cpu-static-controlled-execution-smoke.md'

interface CanonicalRouteCpuStaticResult {
  toolId: string
  capabilityId: string
  statusCode: number
  ok: boolean
  routeStatus: string | null
  externalAgentCanExecuteCpuStaticControlledToolsNow: boolean
  controlledCpuStaticCanonicalRouteExecutionPerformed: boolean
  controlledAdapterExecutedNow: boolean
  localCpuStaticPackageExecutionPerformed: boolean
  outputKind: string | null
  outputSha256: string | null
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
  gpuRuntimeShouldStartNow: boolean
  workerDispatchPerformed: boolean
}

interface CanonicalRouteBlockedResult {
  toolId: string
  capabilityId: string
  statusCode: number
  blocked: boolean
  code: string | null
  gpuRuntimeShouldStartNow: boolean
  agentCanExecuteToolsNow: boolean
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildRuntimeEnv(cpuStaticExecutionEnabled: boolean) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED: 'true',
    AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED: 'false',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG]:
      cpuStaticExecutionEnabled ? 'true' : 'false',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
  })
}

async function withServer<T>(
  cpuStaticExecutionEnabled: boolean,
  callback: (baseUrl: string) => Promise<T>,
) {
  const app = createReeditProApiApp(buildRuntimeEnv(cpuStaticExecutionEnabled))
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

async function runCpuStaticCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<CanonicalRouteCpuStaticResult> {
  const { response, body } = await postToolCall(baseUrl, request)
  const data = body?.data ?? {}
  const booleans = data.booleans ?? {}
  const adapterResult = data.adapterResult ?? {}
  const output = adapterResult.output ?? {}
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    statusCode: response.status,
    ok: body?.ok === true,
    routeStatus: typeof data.routeStatus === 'string' ? data.routeStatus : null,
    externalAgentCanExecuteCpuStaticControlledToolsNow:
      data.externalAgentCanExecuteCpuStaticControlledToolsNow === true,
    controlledCpuStaticCanonicalRouteExecutionPerformed:
      data.controlledCpuStaticCanonicalRouteExecutionPerformed === true,
    controlledAdapterExecutedNow: adapterResult.controlledAdapterExecutedNow === true,
    localCpuStaticPackageExecutionPerformed:
      booleans.localCpuStaticPackageExecutionPerformed === true ||
      adapterResult.localCpuStaticPackageExecutionPerformed === true,
    outputKind: typeof output.outputKind === 'string' ? output.outputKind : null,
    outputSha256:
      typeof output.privateArtifactSha256 === 'string'
        ? output.privateArtifactSha256
        : null,
    publicArtifactCreated: data.outputAccess?.publicArtifactCreated === true,
    signedUrlCreated: data.outputAccess?.signedUrlCreated === true,
    gpuRuntimeShouldStartNow: data.gpuRuntimeShouldStartNow === true,
    workerDispatchPerformed: booleans.workerDispatchPerformed === true,
  }
}

function withoutBlockedDetailsPayload(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    ...request,
    requestId: request.requestId.replace('blocked-details-', 'canonical-cpu-static-execution-'),
    traceId: request.traceId.replace('blocked-details', 'canonical-cpu-static-execution'),
    payload: undefined,
  }
}

async function runBlockedCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<CanonicalRouteBlockedResult> {
  const { response, body } = await postToolCall(baseUrl, request)
  const details = body?.details ?? body?.error?.details ?? {}
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    statusCode: response.status,
    blocked: response.status === 409,
    code: typeof body?.code === 'string' ? body.code : null,
    gpuRuntimeShouldStartNow: details.gpuRuntimeShouldStartNow === true,
    agentCanExecuteToolsNow: details.directAgentToolExecutionApprovedNow === true,
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const cpuRows = report.cpuStaticResults
    .map((item) => (
      `| \`${item.toolId}\` | \`${item.capabilityId}\` | \`${item.statusCode}\` | \`${item.controlledAdapterExecutedNow}\` | \`${item.outputKind}\` | \`${item.outputSha256}\` |`
    ))
    .join('\n')
  return `# AI Graphics External Beta Canonical Tool-Call CPU Static Controlled Execution Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke proves the canonical external-beta tool-call route can execute the six proven CPU/static tools when \`${report.routeFlag}\` is explicitly enabled. It keeps the other fifteen AI graphics tools blocked on this canonical route unless their own runtime proof gates are enabled later.

## CPU/Static Executed Tools

| Tool | Capability | HTTP status | Adapter executed | Output kind | Private output SHA-256 |
| --- | --- | --- | --- | --- | --- |
${cpuRows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Boundary

No Worker dispatch, provider/model runtime, browser/WebGL/canvas runtime, GPU/model runtime, Supabase/GCS mutation, signed URL, public artifact, external beta unlock, or production unlock is performed by this smoke. The adapter returns private artifact metadata and SHA-256 hashes only.
`
}

function buildReport(
  disabledStatus: number,
  cpuStaticResults: CanonicalRouteCpuStaticResult[],
  blockedResults: CanonicalRouteBlockedResult[],
) {
  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-tool-call-route-cpu-static-controlled-execution-smoke',
    decision,
    status,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
    disabledCanonicalRouteStatus: disabledStatus,
    cpuStaticResults,
    blockedResults,
    counts: {
      totalAiGraphicsTools: 21,
      cpuStaticControlledCanonicalRouteExecutedTools: cpuStaticResults.length,
      localCpuStaticPackageExecutionPerformedTools: cpuStaticResults.filter(
        (item) => item.localCpuStaticPackageExecutionPerformed,
      ).length,
      controlledAdapterExecutedTools: cpuStaticResults.filter(
        (item) => item.controlledAdapterExecutedNow,
      ).length,
      nonCpuStaticBlockedTools: blockedResults.length,
      all21ExecutableNowTools: 0,
      workerDispatchPerformedTools: cpuStaticResults.filter(
        (item) => item.workerDispatchPerformed,
      ).length,
      gpuRuntimeShouldStartNowTools: cpuStaticResults.filter(
        (item) => item.gpuRuntimeShouldStartNow,
      ).length,
      publicArtifactCreatedTools: cpuStaticResults.filter(
        (item) => item.publicArtifactCreated,
      ).length,
      signedUrlCreatedTools: cpuStaticResults.filter((item) => item.signedUrlCreated)
        .length,
    },
    booleans: {
      canonicalToolCallRouteCpuStaticControlledExecutionSmokePassed: true,
      canonicalToolCallRouteMountedWithCpuStaticExecutionFlag: true,
      sixCpuStaticToolsExecutableViaCanonicalRouteNow: cpuStaticResults.length === 6,
      sixCpuStaticToolsExecutedViaCanonicalRouteNow: cpuStaticResults.every(
        (item) => item.controlledAdapterExecutedNow,
      ),
      localCpuStaticPackageExecutionPerformed: true,
      privateOutputMetadataReturned: cpuStaticResults.every((item) => item.outputSha256),
      nonCpuStaticToolsRemainBlocked: blockedResults.length === 15,
      agentCanExecuteCpuStaticControlledToolsNow: true,
      agentCanExecuteAll21ToolsNow: false,
      workerExecutionApprovedNow: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
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

async function main() {
  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
  const cpuStaticToolIds = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const cpuStaticCases = cases
    .filter((item) => cpuStaticToolIds.has(item.request.toolId))
    .map((item) => ({ request: withoutBlockedDetailsPayload(item.request) }))
  const blockedCases = cases.filter((item) => !cpuStaticToolIds.has(item.request.toolId))
  assert(cpuStaticCases.length === 6, `Expected six CPU/static cases, got ${cpuStaticCases.length}`)
  assert(blockedCases.length === 15, `Expected fifteen blocked cases, got ${blockedCases.length}`)

  const disabledStatus = await withServer(false, async (baseUrl) => {
    const { response } = await postToolCall(baseUrl, cpuStaticCases[0].request)
    return response.status
  })

  const { cpuStaticResults, blockedResults } = await withServer(true, async (baseUrl) => {
    const executed: CanonicalRouteCpuStaticResult[] = []
    const blocked: CanonicalRouteBlockedResult[] = []
    for (const item of cpuStaticCases) {
      executed.push(await runCpuStaticCase(baseUrl, item.request))
    }
    for (const item of blockedCases) {
      blocked.push(await runBlockedCase(baseUrl, item.request))
    }
    return { cpuStaticResults: executed, blockedResults: blocked }
  })

  assert(disabledStatus === 409, `disabled canonical route should return 409, got ${disabledStatus}`)
  for (const result of cpuStaticResults) {
    assert(result.statusCode === 200, `${result.toolId} did not return 200`)
    assert(result.ok === true, `${result.toolId} did not return ok envelope`)
    assert(
      result.routeStatus ===
        'external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready',
      `${result.toolId} route status mismatch`,
    )
    assert(
      result.externalAgentCanExecuteCpuStaticControlledToolsNow === true,
      `${result.toolId} not marked CPU/static executable`,
    )
    assert(
      result.controlledCpuStaticCanonicalRouteExecutionPerformed === true,
      `${result.toolId} canonical route execution was not performed`,
    )
    assert(result.controlledAdapterExecutedNow === true, `${result.toolId} adapter did not execute`)
    assert(
      result.localCpuStaticPackageExecutionPerformed === true,
      `${result.toolId} local package execution was not recorded`,
    )
    assert(Boolean(result.outputKind), `${result.toolId} missing output kind`)
    assert(Boolean(result.outputSha256), `${result.toolId} missing output hash`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched worker`)
  }
  for (const result of blockedResults) {
    assert(result.blocked === true, `${result.toolId} should remain blocked`)
    assert(result.statusCode === 409, `${result.toolId} should return 409`)
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.agentCanExecuteToolsNow === false, `${result.toolId} enabled all-tool execution`)
  }

  const report = buildReport(disabledStatus, cpuStaticResults, blockedResults)
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
