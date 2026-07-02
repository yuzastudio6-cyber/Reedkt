import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
} from '../routes/ai-graphics-external-beta-tool-call-routes'

const decision =
  'ai_graphics_external_beta_tool_call_route_readiness_probe_smoke_passed'
const status =
  'canonical_tool_call_route_readiness_probe_reports_13_executable_and_8_blocked'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-readiness-probe-smoke.md'

const cpuStaticTools = [
  'd3',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
]

const browserRuntimeTools = [
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]

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

interface RouteReadinessTool {
  toolId: string
  capabilityId: string
  canonicalRouteMode: string
  externalAgentCanExecuteThisToolNow: boolean
  routeCanEvaluateFailClosedGpuModelAdmissionNow: boolean
  modelWeightManifestRequired: boolean
  gpuRuntimeShouldStartNow: boolean
  httpOutcomeIfCalledNow: {
    statusCode: number
    status: string
    routeExecutionPerformed: boolean
  }
  blockersBeforeExecution: string[]
  booleans: Record<string, boolean>
}

interface RouteReadinessReport {
  routeDecision: string
  routeStatus: string
  routePath: string
  readinessRoutePath: string
  toolReadiness: RouteReadinessTool[]
  counts: Record<string, number>
  booleans: Record<string, boolean>
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildRuntimeEnv() {
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
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG]:
      'true',
    [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG]:
      'true',
    AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED: 'false',
    AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED:
      'false',
  })
}

async function withServer<T>(callback: (baseUrl: string) => Promise<T>) {
  const app = createReeditProApiApp(buildRuntimeEnv())
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

async function getReadiness(baseUrl: string): Promise<RouteReadinessReport> {
  const response = await fetch(
    `${baseUrl}${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH}`,
    {
      method: 'GET',
      headers: {
        'x-request-id': 'ai-graphics-external-beta-tool-call-route-readiness-probe',
      },
    },
  )
  const body = await response.json() as { ok?: boolean; data?: RouteReadinessReport }
  assert(response.status === 200, `readiness probe returned ${response.status}`)
  assert(body.ok === true, 'readiness probe did not return ok=true')
  assert(body.data, 'readiness probe response data is missing')
  return body.data
}

function summarizeTool(tool: RouteReadinessTool) {
  return {
    toolId: tool.toolId,
    capabilityId: tool.capabilityId,
    canonicalRouteMode: tool.canonicalRouteMode,
    externalAgentCanExecuteThisToolNow:
      tool.externalAgentCanExecuteThisToolNow,
    routeCanEvaluateFailClosedGpuModelAdmissionNow:
      tool.routeCanEvaluateFailClosedGpuModelAdmissionNow,
    modelWeightManifestRequired: tool.modelWeightManifestRequired,
    httpStatusIfCalledNow: tool.httpOutcomeIfCalledNow.statusCode,
    httpRouteStatusIfCalledNow: tool.httpOutcomeIfCalledNow.status,
    gpuRuntimeShouldStartNow: tool.gpuRuntimeShouldStartNow,
    blockerCount: tool.blockersBeforeExecution.length,
  }
}

function validateReadiness(report: RouteReadinessReport) {
  assert(
    report.routeDecision ===
      'ai_graphics_external_beta_tool_call_route_readiness_probe_passed',
    'route readiness decision mismatch',
  )
  assert(report.routePath === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH, 'route path mismatch')
  assert(
    report.readinessRoutePath === AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_READINESS_ROUTE_PATH,
    'readiness route path mismatch',
  )
  assert(report.toolReadiness.length === 21, `expected 21 tools, got ${report.toolReadiness.length}`)

  for (const toolId of [...cpuStaticTools, ...browserRuntimeTools, ...gpuModelTools]) {
    assert(
      report.toolReadiness.some((tool) => tool.toolId === toolId),
      `missing tool readiness row for ${toolId}`,
    )
  }

  for (const toolId of cpuStaticTools) {
    const tool = report.toolReadiness.find((row) => row.toolId === toolId)
    assert(tool, `missing CPU/static tool ${toolId}`)
    assert(
      tool.canonicalRouteMode === 'cpu_static_controlled_execution',
      `${toolId} route mode mismatch`,
    )
    assert(
      tool.externalAgentCanExecuteThisToolNow === true,
      `${toolId} should be route-executable now`,
    )
    assert(tool.httpOutcomeIfCalledNow.statusCode === 200, `${toolId} should map to HTTP 200`)
  }

  for (const toolId of browserRuntimeTools) {
    const tool = report.toolReadiness.find((row) => row.toolId === toolId)
    assert(tool, `missing browser/runtime tool ${toolId}`)
    assert(
      tool.canonicalRouteMode === 'browser_runtime_controlled_execution',
      `${toolId} route mode mismatch`,
    )
    assert(
      tool.externalAgentCanExecuteThisToolNow === true,
      `${toolId} should be route-executable now`,
    )
    assert(tool.httpOutcomeIfCalledNow.statusCode === 200, `${toolId} should map to HTTP 200`)
  }

  for (const toolId of gpuModelTools) {
    const tool = report.toolReadiness.find((row) => row.toolId === toolId)
    assert(tool, `missing GPU/model tool ${toolId}`)
    assert(
      tool.canonicalRouteMode === 'gpu_model_runtime_admission_blocked',
      `${toolId} route mode mismatch`,
    )
    assert(
      tool.externalAgentCanExecuteThisToolNow === false,
      `${toolId} should not be executable now`,
    )
    assert(
      tool.routeCanEvaluateFailClosedGpuModelAdmissionNow === true,
      `${toolId} should evaluate fail-closed admission now`,
    )
    assert(tool.httpOutcomeIfCalledNow.statusCode === 409, `${toolId} should map to HTTP 409`)
    assert(tool.gpuRuntimeShouldStartNow === false, `${toolId} should not start GPU runtime`)
    assert(
      tool.blockersBeforeExecution.some((blocker) => /NVIDIA L4 runtime proof/.test(blocker)),
      `${toolId} missing native GPU proof blocker`,
    )
    if (modelWeightManifestRequiredTools.includes(toolId)) {
      assert(
        tool.modelWeightManifestRequired === true,
        `${toolId} should require model-weight manifest`,
      )
      assert(
        tool.blockersBeforeExecution.some((blocker) => /model-weight manifest/.test(blocker)),
        `${toolId} missing model-weight manifest blocker`,
      )
    }
  }

  const expectedCounts: Record<string, number> = {
    totalAiGraphicsTools: 21,
    productFacingCapabilities: 12,
    externalAgentRouteExecutableNowTools: 13,
    cpuStaticControlledExecutableNowTools: 6,
    browserRuntimeControlledExecutableNowTools: 7,
    gpuModelRuntimeAdmissionBlockedTools: 8,
    gpuModelRuntimeAdmissionEvaluatedFailClosedTools: 8,
    modelWeightManifestRequiredTools: 5,
    gpuRuntimeShouldStartNowTools: 0,
    workerDispatchApprovedNowTools: 0,
    workerDispatchPerformedTools: 0,
    providerRuntimePerformedTools: 0,
    publicArtifactCreatedTools: 0,
    signedUrlCreatedTools: 0,
  }
  for (const [key, value] of Object.entries(expectedCounts)) {
    assert(report.counts[key] === value, `count ${key} mismatch: ${report.counts[key]}`)
  }

  for (const key of [
    'externalBetaToolCallRouteReadinessProbeSafe',
    'routeMountedByAppNow',
    'mockOnlyRuntimeModeEnforced',
    'agentCanSelectForPlanning',
    'externalAgentCanExecuteSomeToolsNow',
    'agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow',
  ]) {
    assert(report.booleans[key] === true, `${key} should be true`)
  }
  for (const key of [
    'agentCanExecuteAll21ToolsNow',
    'agentCanExecuteGpuModelToolsNow',
    'routeExecutionPerformedByReadinessProbe',
    'workerExecutionApprovedNow',
    'workerDispatchApprovedNow',
    'workerDispatchPerformed',
    'toolExecutionApprovedNow',
    'toolExecutionPerformedByReadinessProbe',
    'providerRuntimePerformed',
    'browserWebglCanvasRuntimePerformedByReadinessProbe',
    'gpuRuntimePerformed',
    'gpuRuntimeShouldStartNow',
    'modelWeightsDownloaded',
    'modelWeightsLoaded',
    'modelInferencePerformed',
    'mediaProcessingPerformed',
    'supabaseMutationPerformed',
    'gcsUploadPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
    'runtimeReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
    'dependencyInstallPerformed',
    'packageLockMutationPerformed',
  ]) {
    assert(report.booleans[key] === false, `${key} should be false`)
  }
}

function buildReport(routeReadiness: RouteReadinessReport) {
  const toolSummary = routeReadiness.toolReadiness.map(summarizeTool)
  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-beta-tool-call-route-readiness-probe-smoke',
    decision,
    status,
    routeDecision: routeReadiness.routeDecision,
    routeStatus: routeReadiness.routeStatus,
    routePath: routeReadiness.routePath,
    readinessRoutePath: routeReadiness.readinessRoutePath,
    toolSummary,
    counts: routeReadiness.counts,
    booleans: routeReadiness.booleans,
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.toolSummary
    .map((tool) => (
      `| \`${tool.toolId}\` | \`${tool.canonicalRouteMode}\` | \`${tool.externalAgentCanExecuteThisToolNow}\` | \`${tool.httpStatusIfCalledNow}\` | \`${tool.httpRouteStatusIfCalledNow}\` | \`${tool.gpuRuntimeShouldStartNow}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Beta Tool-Call Route Readiness Probe Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke proves the canonical external-beta tool-call route exposes a safe readiness probe before an agent tries to call a tool. The probe covers all 21 AI graphics tools: 13 are callable through controlled local/mock canonical routes, and the eight GPU/model tools are known by the route but fail closed until native GPU/model-weight proof is accepted.

## Per-Tool Route Readiness

| Tool | Route mode | Agent can execute this tool now | HTTP status if called now | Route status if called now | GPU starts now |
| --- | --- | --- | --- | --- | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Boundary

The readiness probe does not execute tools, dispatch Workers, call providers/models, start browser/WebGL/canvas or GPU runtime, download or load model weights, mutate Supabase/GCS, create signed URLs, or create public artifacts. GPU/model tools remain on-demand only and blocked until future accepted native runtime evidence exists.
`
}

async function main() {
  const routeReadiness = await withServer(getReadiness)
  validateReadiness(routeReadiness)
  const report = buildReport(routeReadiness)
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
