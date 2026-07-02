import fs from 'node:fs'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
  type AiGraphicsExternalBetaToolCallRequest,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'

const decision =
  'ai_graphics_external_agent_controlled_route_caller_contract_prepared_for_thirteen_tools_with_gpu_model_blocks'
const status =
  'external_agent_controlled_route_caller_ready_for_thirteen_tools_gpu_model_blocked'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-caller.md'
const sourceRequireGoPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-route-require-go.json'
const sourceWorkerRouteSmokePath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json'
const routeMountFlag = 'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED'

type JsonRecord = Record<string, any>

type ControlledGroup = 'cpu_static_controlled_route' | 'browser_runtime_controlled_route'

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
  gpuRuntimeShouldStartNow: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

interface BlockedGpuModelCallerRow {
  toolId: string
  capabilityId: string
  group: 'gpu_model_runtime_blocked'
  routePath: string
  method: 'POST'
  requestEnvelope: AiGraphicsExternalBetaToolCallRequest
  expectedHttpStatusIfInvoked: 409
  blockedFromControlledRouteCallerNow: true
  requiredProofBeforeCallerMayInvoke: string[]
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
    },
  }
}

function controlledRow(
  request: AiGraphicsExternalBetaToolCallRequest,
  group: ControlledGroup,
): ControlledCallerRow {
  const executionFlag =
    group === 'cpu_static_controlled_route'
      ? AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG
      : AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG

  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    group,
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    method: 'POST',
    requestEnvelope: scopedRequest(
      request,
      group === 'cpu_static_controlled_route'
        ? 'external-agent-controlled-cpu-static-route-call'
        : 'external-agent-controlled-browser-runtime-route-call',
    ),
    requiredFeatureFlags: [
      routeMountFlag,
      executionFlag,
    ],
    expectedHttpStatusIfInvoked: 200,
    expectedPrivateOutputOnly: true,
    canonicalRouteWillRunControlledAdapter: true,
    gpuRuntimeShouldStartNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function blockedGpuRow(
  request: AiGraphicsExternalBetaToolCallRequest,
): BlockedGpuModelCallerRow {
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    group: 'gpu_model_runtime_blocked',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    method: 'POST',
    requestEnvelope: scopedRequest(
      request,
      'external-agent-controlled-gpu-model-route-call-blocked',
    ),
    expectedHttpStatusIfInvoked: 409,
    blockedFromControlledRouteCallerNow: true,
    requiredProofBeforeCallerMayInvoke: [
      'reviewed native linux/amd64 NVIDIA L4 runtime proof',
      'reviewed private model-weight manifest when model weights are required',
      'external-beta per-tool runtime proof recheck with accepted private evidence',
      'approved worker enqueue lane that starts GPU only for the accepted job',
    ],
    gpuRuntimeShouldStartNow: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

function buildReport() {
  const requireGo = readJson(sourceRequireGoPath)
  const workerRouteSmoke = readJson(sourceWorkerRouteSmokePath)

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

  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
  const cpuStaticTools = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const browserRuntimeTools = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const cpuStaticRows = cases
    .filter((item) => cpuStaticTools.has(item.request.toolId))
    .map((item) => controlledRow(item.request, 'cpu_static_controlled_route'))
  const browserRuntimeRows = cases
    .filter((item) => browserRuntimeTools.has(item.request.toolId))
    .map((item) => controlledRow(item.request, 'browser_runtime_controlled_route'))
  const blockedGpuModelRows = cases
    .filter(
      (item) =>
        !cpuStaticTools.has(item.request.toolId) &&
        !browserRuntimeTools.has(item.request.toolId),
    )
    .map((item) => blockedGpuRow(item.request))

  assert(cpuStaticRows.length === 6, `expected 6 CPU/static rows, got ${cpuStaticRows.length}`)
  assert(browserRuntimeRows.length === 7, `expected 7 browser/runtime rows, got ${browserRuntimeRows.length}`)
  assert(blockedGpuModelRows.length === 8, `expected 8 GPU/model rows, got ${blockedGpuModelRows.length}`)

  const controlledCallerRows = [...cpuStaticRows, ...browserRuntimeRows]

  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-agent-controlled-route-caller',
    decision,
    status,
    summary:
      'Defines the exact external-agent caller contract for the 13 scoped controlled AI graphics tools. The caller may submit these private route envelopes to the mounted canonical tool-call route when the scoped flags are enabled; the eight GPU/model tools remain excluded until native GPU/model proof is accepted.',
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
      },
    },
    interfaces: {
      packageScript: 'ai-graphics:external-agent-controlled-route-caller',
      diagnosticScript:
        'ai-graphics:external-agent-controlled-route-caller:diagnostics',
      cli: 'server/cli/ai-graphics-external-agent-controlled-route-caller.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-controlled-route-caller-diagnostics.mjs',
      routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
      method: 'POST',
      contentType: 'application/json',
    },
    requiredFeatureFlags: {
      routeMount: routeMountFlag,
      cpuStaticControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
      browserRuntimeControlledExecution:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
      mockQueueAdmissionNotRequiredForDirectControlledRoute:
        AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      controlledRouteCallableToolsNow: controlledCallerRows.length,
      cpuStaticControlledRouteCallableToolsNow: cpuStaticRows.length,
      browserRuntimeControlledRouteCallableToolsNow: browserRuntimeRows.length,
      gpuModelToolsBlockedFromControlledRouteCallerNow:
        blockedGpuModelRows.length,
      requestEnvelopesPrepared: controlledCallerRows.length,
      privateOutputOnlyEnvelopes: controlledCallerRows.filter(
        (row) => row.expectedPrivateOutputOnly,
      ).length,
      all21ExecutableNowTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      routeExecutionPerformedInThisLaneTools: 0,
      productionReadyNowTools: 0,
    },
    controlledCallerRows,
    blockedGpuModelRows,
    booleans: {
      externalAgentControlledRouteCallerContractPrepared: true,
      sourceControlledRouteRequireGoAccepted: true,
      sourceControlledWorkerRouteExecutionSmokeAccepted: true,
      routeSchemaEnvelopeAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all13ControlledRouteCallerEnvelopesPrepared: true,
      cpuStatic6ControlledRouteCallerEnvelopesPrepared: true,
      browserRuntime7ControlledRouteCallerEnvelopesPrepared: true,
      controlledRouteCallerCanInvokeCanonicalRouteFor13ToolsNow: true,
      agentCanExecuteControlledRouteToolsNow: true,
      agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow: true,
      routeExecutionApprovedForControlled13ToolsNow: true,
      privateOutputOnly: true,
      eightGpuModelToolsRemainBlockedFromControlledRouteCaller: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForAcceptedExternalBetaToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
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
      controlled13Tools:
        `POST ${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH} with the matching requestEnvelope when the route mount and scoped controlled execution flags are enabled.`,
      gpuModel8Tools:
        'Do not call through the controlled route caller yet; collect accepted native GPU/model proof and per-tool runtime proof first.',
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
  const blockedRows = report.blockedGpuModelRows
    .map(
      (row) =>
        `| \`${row.toolId}\` | \`${row.capabilityId}\` | \`${row.expectedHttpStatusIfInvoked}\` | \`${row.requiredProofBeforeCallerMayInvoke.join('; ')}\` |`,
    )
    .join('\n')

  return `# AI Graphics External Agent Controlled Route Caller

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This contract gives the external agent one scoped caller shape for the 13 controlled AI graphics tools that are executable through the canonical private route now. It does not claim all 21 tools are executable. The eight GPU/model tools remain blocked and GPU stays cold until accepted native GPU/model proof exists for a future on-demand job.

## Controlled Caller Tools

| Tool | Group | Capability | Route | Expected status |
| --- | --- | --- | --- | --- |
${controlledRows}

## GPU/Model Tools Still Blocked

| Tool | Capability | Expected status | Required proof before caller use |
| --- | --- | --- | --- |
${blockedRows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Agent Call Rule

The agent may invoke \`${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH}\` only for the 13 controlled CPU/static and browser/runtime tools using the generated private request envelopes. The request must keep output private, must not request signed URLs, must not create public artifacts, and must not start GPU runtime. GPU/model tools stay blocked from this caller until their proof chain is accepted.
`
}

const report = buildReport()
if (process.argv.includes('--write-records')) {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}

console.log(JSON.stringify(report, null, 2))
