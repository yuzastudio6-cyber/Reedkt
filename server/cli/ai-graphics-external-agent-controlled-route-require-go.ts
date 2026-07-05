import fs from 'node:fs'
import path from 'node:path'

const decision =
  'ai_graphics_external_agent_controlled_route_require_go_approved_with_gpu_model_blocks'
const status =
  'external_agent_controlled_route_execution_approved_for_thirteen_tools_gpu_model_blocked'

const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.md'
const sourceGatePath =
  'docs/tool-intelligence/ai-graphics/external-agent-execution-gate.json'
const sourceWorkerRouteSmokePath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json'

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

const capabilityByTool: Record<string, string> = {
  torch_torchvision: 'model_runtime_foundation',
  transformers: 'model_runtime_foundation',
  sam2: 'subject_segmentation',
  birefnet: 'background_removal',
  real_esrgan: 'upscaling',
  kornia: 'tensor_image_ops',
  rembg: 'background_removal',
  transparent_background: 'background_removal',
  d3: 'chart_overlay',
  echarts: 'chart_overlay',
  vega_lite: 'data_visualization',
  vega: 'data_visualization',
  satori: 'svg_graphics',
  svgdotjs_svg_js: 'svg_graphics',
  viz_js: 'diagram_graphics',
  lottie_web: 'animation_overlay',
  animejs: 'animation_overlay',
  three_js: 'webgl_3d_scene',
  pixi_js: 'canvas_scene',
  konva: 'canvas_scene',
  babylonjs: 'webgl_3d_scene',
}

type JsonRecord = Record<string, any>

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function buildToolRows() {
  return [
    ...cpuStaticTools.map((toolId) => ({
      toolId,
      capabilityId: capabilityByTool[toolId],
      group: 'cpu_static_controlled_route',
      controlledRouteExecutableNow: true,
      agentCanExecuteThisControlledToolNow: true,
      gpuRuntimeShouldStartNow: false,
      remainingBlocker: null,
    })),
    ...browserRuntimeTools.map((toolId) => ({
      toolId,
      capabilityId: capabilityByTool[toolId],
      group: 'browser_runtime_controlled_route',
      controlledRouteExecutableNow: true,
      agentCanExecuteThisControlledToolNow: true,
      gpuRuntimeShouldStartNow: false,
      remainingBlocker: null,
    })),
    ...gpuModelTools.map((toolId) => ({
      toolId,
      capabilityId: capabilityByTool[toolId],
      group: 'gpu_model_runtime',
      controlledRouteExecutableNow: false,
      agentCanExecuteThisControlledToolNow: false,
      gpuRuntimeShouldStartNow: false,
      remainingBlocker:
        'gpu_model_tools_require accepted native GPU/model runtime proof and per-tool external-beta runtime proof before agent execution',
    })),
  ]
}

function buildReport() {
  const sourceGate = readJson(sourceGatePath)
  const sourceSmoke = readJson(sourceWorkerRouteSmokePath)
  const smokeCounts = sourceSmoke.counts ?? {}
  const smokeBooleans = sourceSmoke.booleans ?? {}
  const gateBooleans = sourceGate.booleans ?? {}

  assert(
    sourceGate.decision ===
      'ai_graphics_external_agent_execution_gate_prepared_fail_closed_with_warnings',
    'source external-agent execution gate decision mismatch',
  )
  assert(
    sourceSmoke.decision ===
      'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks',
    'source controlled worker route smoke decision mismatch',
  )
  assert(
    sourceGate.totalAiGraphicsTools === 21 && smokeCounts.totalAiGraphicsTools === 21,
    'source tool coverage mismatch',
  )
  assert(
    sourceGate.externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence ===
      13 &&
      smokeCounts.externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence ===
        13,
    'controlled route executable count mismatch',
  )
  assert(
    sourceGate.gpuRuntimeTargetedTools === 8 &&
      smokeCounts.gpuModelBlockedToolsWithProvidedEvidence === 8,
    'GPU/model blocked count mismatch',
  )
  assert(
    gateBooleans.agentCanExecuteToolsNow === false &&
      smokeBooleans.agentCanExecuteAll21ToolsNow === false &&
      smokeBooleans.agentCanExecuteGpuModelToolsNow === false,
    'source broad execution boundary mismatch',
  )

  const toolRows = buildToolRows()
  return {
    schemaVersion: 1,
    decision,
    status,
    summary:
      'Approves the existing controlled external-agent route path for the 13 proven CPU/static and browser/runtime tools only. The eight GPU/model tools remain fail-closed and GPU stays on-demand/idle until an accepted tool call has the required runtime proof references.',
    sourceEvidence: {
      externalAgentExecutionGate: {
        path: sourceGatePath,
        decision: sourceGate.decision,
        status: sourceGate.status,
        accepted: true,
      },
      controlledWorkerRouteExecutionSmoke: {
        path: sourceWorkerRouteSmokePath,
        decision: sourceSmoke.decision,
        status: sourceSmoke.status,
        accepted: true,
      },
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      controlledExternalAgentRouteExecutableToolsNow: 13,
      cpuStaticControlledRouteExecutableToolsNow: 6,
      browserRuntimeControlledRouteExecutableToolsNow: 7,
      gpuModelBlockedToolsNow: 8,
      agentCanExecuteAll21ToolsNowTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      productionReadyNowTools: 0,
    },
    toolRows,
    booleans: {
      externalAgentControlledRouteRequireGoApproved: true,
      sourceExternalAgentExecutionGateAccepted: true,
      sourceExternalAgentControlledWorkerRouteExecutionSmokeAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      controlled13ToolsAgentExecutableNow: true,
      cpuStatic6ToolsAgentExecutableNow: true,
      browserRuntime7ToolsAgentExecutableNow: true,
      agentCanExecuteControlledRouteToolsNow: true,
      agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow: true,
      routeExecutionApprovedForControlled13ToolsNow: true,
      gpuModel8ToolsRemainBlocked: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForAcceptedExternalBetaToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
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
    nextRecommendedWork: [
      'Wire the external agent caller to the controlled route with explicit feature flags for the 13 approved tools.',
      'Collect accepted native GPU/model runtime proof for the eight GPU/model tools before enabling their route execution.',
      'Keep GPU runtime idle until an accepted GPU/model tool call is admitted.',
    ],
  }
}

function renderMarkdown(report: ReturnType<typeof buildReport>): string {
  const controlledRows = report.toolRows
    .filter((row) => row.controlledRouteExecutableNow)
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.group}\` | \`${row.capabilityId}\` | \`${row.agentCanExecuteThisControlledToolNow}\` |`,
    )
    .join('\n')
  const blockedRows = report.toolRows
    .filter((row) => !row.controlledRouteExecutableNow)
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.capabilityId}\` | \`${row.remainingBlocker}\` |`,
    )
    .join('\n')
  const countLines = Object.entries(report.counts)
    .map(([key, value]) => `- \`${key}\`: ${value}`)
    .join('\n')
  const booleanLines = Object.entries(report.booleans)
    .map(([key, value]) => `- \`${key}\`: ${value}`)
    .join('\n')
  return `# AI Graphics External Agent Controlled Route Require-Go

Decision: \`${report.decision}\`

Status: \`${report.status}\`

${report.summary}

## Source Evidence

- External-agent execution gate: \`${report.sourceEvidence.externalAgentExecutionGate.decision}\`
- Controlled worker route execution smoke: \`${report.sourceEvidence.controlledWorkerRouteExecutionSmoke.decision}\`

## Controlled Agent-Executable Tools

| Tool | Group | Capability | Agent can execute this controlled route now |
| --- | --- | --- | --- |
${controlledRows}

## GPU/Model Tools Still Blocked

| Tool | Capability | Remaining blocker |
| --- | --- | --- |
${blockedRows}

## Counts

${countLines}

## Booleans

${booleanLines}

## Boundary

This require-go packet approves only the controlled external-agent route for the 13 proven CPU/static and browser/runtime tools. It does not unlock all-21 execution, GPU/model execution, provider/model calls, live worker dispatch, Supabase/GCS mutation, signed URLs, public artifacts, internal beta, external beta, production, or package-lock mutation.
`
}

const report = buildReport()
fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true })
fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(outputMdPath, renderMarkdown(report))

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  status: report.status,
  controlledExternalAgentRouteExecutableToolsNow:
    report.counts.controlledExternalAgentRouteExecutableToolsNow,
  gpuModelBlockedToolsNow: report.counts.gpuModelBlockedToolsNow,
  agentCanExecuteToolsNow: report.booleans.agentCanExecuteToolsNow,
  gpuRuntimeShouldStartNow: report.booleans.gpuRuntimeShouldStartNow,
}, null, 2))
