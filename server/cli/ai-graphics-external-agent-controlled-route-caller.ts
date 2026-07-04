import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG,
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
  type AiGraphicsExternalBetaToolCallRequest,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-gpu-model-controlled-adapter'

const decision =
  'ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_all21_with_gpu_model_on_demand'
const status =
  'external_agent_controlled_route_caller_ready_for_all21_controlled_route_calls'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.md'
const sourceRequireGoPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json'
const sourceWorkerRouteSmokePath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json'
const sourceAll21RouteSmokePath =
  'docs/tool-intelligence/ai-graphics/external-agent-all21-controlled-route-execution-smoke.json'
const routeMountFlag = AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG

type JsonRecord = Record<string, any>

type ControlledGroup =
  | 'cpu_static_controlled_route'
  | 'browser_runtime_controlled_route'
  | 'gpu_model_controlled_route_on_demand'

interface ControlledCallerRow {
  toolId: string
  capabilityId: string
  group: ControlledGroup
  routePath: string
  method: 'POST'
  requestEnvelope: AiGraphicsExternalBetaToolCallRequest
  requiredFeatureFlags: string[]
  expectedHttpStatusIfInvoked: 200
  expectedPrivateOutputOnly: true
  canonicalRouteWillRunControlledAdapter: true
  localPackageExecutionExpectedInDefaultSmoke: boolean
  localGpuModelRuntimeExecutionExpectedInDefaultSmoke: false
  gpuRuntimeShouldStartNow: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function scopedRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
  prefix: string,
  group: ControlledGroup,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    ...request,
    requestId: `${prefix}-${request.toolId}`,
    approvedPlanSnapshotId:
      `approved-snapshot-ai-graphics-external-agent-controlled-route-caller-${request.toolId}`,
    creditReservationId:
      `credit-reservation-ai-graphics-external-agent-controlled-route-caller-${request.toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent/controlled-route-caller/${request.toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-agent/controlled-route-caller/${request.toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-agent/controlled-route-caller/${request.toolId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-agent/controlled-route-caller/${request.toolId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-agent/controlled-route-caller/${request.toolId}/owner-runtime-approval`,
    traceId: `trace-ai-graphics-external-agent-controlled-route-caller-${request.toolId}`,
    payload: {
      externalAgentControlledRouteCaller: true,
      rawPromptExecutionAllowed: false,
      privateOutputOnly: true,
      ...(group === 'gpu_model_controlled_route_on_demand'
        ? {
            gpuModelRuntimeOnDemandOnly: true,
            enableGpuModelControlledExecution: false,
          }
        : {}),
    },
  }
}

function controlledRow(
  request: AiGraphicsExternalBetaToolCallRequest,
  group: ControlledGroup,
): ControlledCallerRow {
  const executionFlags =
    group === 'cpu_static_controlled_route'
      ? [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG]
      : group === 'browser_runtime_controlled_route'
      ? [AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG]
      : [
          AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
          AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
        ]

  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    group,
    routePath: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
    method: 'POST',
    requestEnvelope: scopedRequest(
      request,
      group === 'cpu_static_controlled_route'
        ? 'external-agent-controlled-cpu-static-route-call'
        : group === 'browser_runtime_controlled_route'
        ? 'external-agent-controlled-browser-runtime-route-call'
        : 'external-agent-controlled-gpu-model-route-call-on-demand',
      group,
    ),
    requiredFeatureFlags: [
      routeMountFlag,
      ...executionFlags,
    ],
    expectedHttpStatusIfInvoked: 200,
    expectedPrivateOutputOnly: true,
    canonicalRouteWillRunControlledAdapter: true,
    localPackageExecutionExpectedInDefaultSmoke:
      group !== 'gpu_model_controlled_route_on_demand',
    localGpuModelRuntimeExecutionExpectedInDefaultSmoke: false,
    gpuRuntimeShouldStartNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function buildReport() {
  const requireGo = readJson(sourceRequireGoPath)
  const workerRouteSmoke = readJson(sourceWorkerRouteSmokePath)
  const all21RouteSmoke = readJson(sourceAll21RouteSmokePath)

  assert(
    requireGo.decision ===
      'ai_graphics_external_agent_controlled_route_require_go_approved_with_gpu_model_blocks',
    'source require-go decision mismatch',
  )
  assert(
    requireGo.booleans?.agentCanExecuteControlledRouteToolsNow === true,
    'source require-go must approve scoped controlled route execution',
  )
  assert(
    workerRouteSmoke.decision ===
      'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks',
    'source worker route smoke decision mismatch',
  )
  assert(
    workerRouteSmoke.counts
      ?.externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence === 13,
    'source worker route smoke must prove 13 controlled worker route tools',
  )
  assert(
    all21RouteSmoke.decision ===
      'ai_graphics_external_agent_all21_controlled_route_execution_smoke_passed',
    'source all-21 controlled route smoke decision mismatch',
  )
  assert(
    all21RouteSmoke.counts?.controlledRouteHttp200Tools === 21 &&
      all21RouteSmoke.counts?.controlledRouteAdapterInvokedTools === 21 &&
      all21RouteSmoke.counts?.controlledRouteAdapterExecutedTools === 13 &&
      all21RouteSmoke.counts?.gpuModelControlledRouteInvokedTools === 8 &&
      all21RouteSmoke.counts?.localGpuModelRuntimeExecutionPerformedTools === 0,
    'source all-21 controlled route smoke counts mismatch',
  )
  assert(
    all21RouteSmoke.booleans?.agentCanCallAll21ControlledRoutesNow === true &&
      all21RouteSmoke.booleans?.agentCanExecuteAll21ToolsNow === false &&
      all21RouteSmoke.booleans?.agentCanExecuteGpuModelToolsNow === false &&
      all21RouteSmoke.booleans?.gpuRuntimeShouldStartNow === false,
    'source all-21 controlled route smoke booleans mismatch',
  )

  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
  const cpuStaticTools = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const browserRuntimeTools = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const gpuModelTools = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_GPU_MODEL_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const cpuStaticRows = cases
    .filter((item) => cpuStaticTools.has(item.request.toolId))
    .map((item) => controlledRow(item.request, 'cpu_static_controlled_route'))
  const browserRuntimeRows = cases
    .filter((item) => browserRuntimeTools.has(item.request.toolId))
    .map((item) => controlledRow(item.request, 'browser_runtime_controlled_route'))
  const gpuModelRows = cases
    .filter((item) => gpuModelTools.has(item.request.toolId))
    .map((item) => controlledRow(item.request, 'gpu_model_controlled_route_on_demand'))

  assert(cpuStaticRows.length === 6, `expected 6 CPU/static rows, got ${cpuStaticRows.length}`)
  assert(browserRuntimeRows.length === 7, `expected 7 browser/runtime rows, got ${browserRuntimeRows.length}`)
  assert(gpuModelRows.length === 8, `expected 8 GPU/model rows, got ${gpuModelRows.length}`)

  const controlledCallerRows = [...cpuStaticRows, ...browserRuntimeRows, ...gpuModelRows]

  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-agent-controlled-route-caller',
    decision,
    status,
    summary:
      'Defines the exact external-agent caller contract for all 21 scoped controlled AI graphics tools. The caller may submit these private route envelopes to the mounted canonical tool-call route when the scoped flags are enabled. CPU/static and browser-runtime tools execute their controlled local packages; GPU/model tools invoke the on-demand adapter and keep local GPU/model runtime cold unless an explicit approved local-dev runtime request supplies real inputs.',
    sourceEvidence: {
      controlledRouteRequireGo: {
        path: sourceRequireGoPath,
        decision: requireGo.decision,
        accepted: true,
      },
      controlledWorkerRouteExecutionSmoke: {
        path: sourceWorkerRouteSmokePath,
        decision: workerRouteSmoke.decision,
        accepted: true,
        scope: 'historical 13-tool local package execution proof',
      },
      all21ControlledRouteExecutionSmoke: {
        path: sourceAll21RouteSmokePath,
        decision: all21RouteSmoke.decision,
        accepted: true,
        scope: 'authoritative all-21 controlled route caller proof',
      },
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-controlled-route-caller',
      diagnosticScript:
        'ai-graphics:external-agent-controlled-route-caller:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-controlled-route-caller.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-controlled-route-caller-diagnostics.mjs',
      routePath: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
      method: 'POST',
      contentType: 'application/json',
    },
    requiredFeatureFlags: {
      routeMount: routeMountFlag,
      cpuStaticControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
      browserRuntimeControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
      gpuModelRuntimeAdmission:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
      gpuModelControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_CONTROLLED_EXECUTION_FLAG,
      mockQueueAdmissionNotRequiredForDirectControlledRoute:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      controlledRouteCallableToolsNow: controlledCallerRows.length,
      cpuStaticControlledRouteCallableToolsNow: cpuStaticRows.length,
      browserRuntimeControlledRouteCallableToolsNow: browserRuntimeRows.length,
      gpuModelControlledRouteCallableToolsNow: gpuModelRows.length,
      gpuModelToolsBlockedFromControlledRouteCallerNow: 0,
      requestEnvelopesPrepared: controlledCallerRows.length,
      privateOutputOnlyEnvelopes: controlledCallerRows.filter(
        (row) => row.expectedPrivateOutputOnly,
      ).length,
      all21ControlledRouteCallableNowTools: controlledCallerRows.length,
      controlledRouteRuntimeExecutableNowTools:
        cpuStaticRows.length + browserRuntimeRows.length,
      all21ControlledRouteExecutableNowTools:
        cpuStaticRows.length + browserRuntimeRows.length,
      all21ExecutableNowTools:
        cpuStaticRows.length + browserRuntimeRows.length,
      controlledRouteLocalPackageExecutionExpectedTools:
        cpuStaticRows.length + browserRuntimeRows.length,
      localGpuModelRuntimeExecutionExpectedInDefaultCallerTools: 0,
      gpuModelToolsBlockedFromRuntimeExecutionNow: gpuModelRows.length,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      routeExecutionPerformedInThisLaneTools: 0,
      productionReadyNowTools: 0,
    },
    controlledCallerRows,
    booleans: {
      externalAgentControlledRouteCallerContractPrepared: true,
      sourceControlledRouteRequireGoAccepted: true,
      sourceControlledWorkerRouteExecutionSmokeAccepted: true,
      sourceAll21ControlledRouteExecutionSmokeAccepted: true,
      routeSchemaEnvelopeAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all13ControlledRouteCallerEnvelopesPrepared: true,
      all21ControlledRouteCallerEnvelopesPrepared: true,
      cpuStatic6ControlledRouteCallerEnvelopesPrepared: true,
      browserRuntime7ControlledRouteCallerEnvelopesPrepared: true,
      gpuModel8ControlledRouteCallerEnvelopesPrepared: true,
      controlledRouteCallerCanInvokeCanonicalRouteFor13ToolsNow: true,
      controlledRouteCallerCanInvokeCanonicalRouteFor21ToolsNow: true,
      agentCanExecuteControlledRouteToolsNow: true,
      agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow: true,
      agentCanExecuteControlledCpuStaticBrowserRuntimeAndGpuModelRouteToolsNow: false,
      routeExecutionApprovedForControlled13ToolsNow: true,
      routeExecutionApprovedForControlled21ToolsNow: true,
      privateOutputOnly: true,
      eightGpuModelToolsRemainBlockedFromControlledRouteCaller: false,
      eightGpuModelToolsRemainBlockedFromRuntimeExecutionNow: true,
      eightGpuModelToolsInvokeControlledOnDemandAdapter: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForAcceptedExternalBetaToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteToolsNow: true,
      routeExecutionApprovedNow: true,
      routeExecutionPerformedInThisLane: false,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
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
    nextExternalAgentAction: {
      controlled21Tools:
        `POST ${AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH} with the matching requestEnvelope when the route mount and scoped controlled execution flags are enabled.`,
      gpuModel8Tools:
        'Call through the controlled route for on-demand adapter admission. Local GPU/model runtime stays cold unless the request explicitly supplies approved local-dev runtime inputs and private proof refs.',
    },
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const controlledRows = report.controlledCallerRows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.group}\` | \`${row.capabilityId}\` | \`${row.method} ${row.routePath}\` | \`${row.expectedHttpStatusIfInvoked}\` |`,
    )
    .join('\n')

  return `# AI Graphics External Agent Controlled Route Caller

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This contract gives the external agent one scoped caller shape for all 21 controlled AI graphics tools that are callable through the canonical private route now. CPU/static and browser-runtime tools execute controlled local packages. GPU/model tools are callable through the controlled route and invoke the on-demand adapter, but they are not runtime-executable until a scoped request supplies explicit approved local-dev runtime inputs and private proof refs. GPU stays cold by default.

## Controlled Caller Tools

| Tool | Group | Capability | Route | Expected status |
| --- | --- | --- | --- | --- |
${controlledRows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Agent Call Rule

The agent may invoke \`${AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH}\` for all 21 controlled AI graphics tools using the generated private request envelopes. The request must keep output private, must not request signed URLs, must not create public artifacts, and must not start idle GPU runtime. GPU/model calls are on-demand: the adapter is invoked by the route, while local GPU/model runtime starts only for an explicit approved local-dev runtime request with real private inputs.
`
}

const report = buildReport()
if (process.argv.includes('--write-records')) {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}

console.log(JSON.stringify(report, null, 2))
