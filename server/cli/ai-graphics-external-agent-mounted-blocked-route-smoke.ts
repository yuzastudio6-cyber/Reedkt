import { once } from 'node:events'
import fs from 'node:fs'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG,
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { buildAiGraphicsToolCallHandoffContract } from '../tool-registry/ai-graphics-tool-call-handoff'

const decision =
  'ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks'
const status = 'mounted_route_returns_structured_tool_not_ready_for_all_21'
const routeMountFlag = AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_MOUNT_FLAG
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-mounted-blocked-route-smoke.md'

const falseExecutionKeys = [
  'directAgentToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'queueWriteApprovedNow',
  'workerEnqueueApprovedNow',
  'workerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'gpuRuntimeShouldStartNow',
  'externalBetaReadyNow',
  'productionReadyNow',
] as const

type SmokeKind = 'tool' | 'capability'

interface SmokeCase {
  kind: SmokeKind
  id: string
  request: AiGraphicsExternalBetaToolCallRequest
}

interface SmokeResult {
  kind: SmokeKind
  id: string
  toolId: string
  capabilityId: string
  statusCode: number
  errorCode: string | undefined
  requestAcceptedForPlanningMetadata: boolean
  selectedRequestedTool: boolean
  normalizedToolCallResultReturned: boolean
  normalizedToolCallCallable: boolean
  normalizedToolCallExecutable: boolean
  normalizedToolCallBlockedWithReason: boolean
  normalizedToolCallFailedWithDiagnostics: boolean
  normalizedToolCallExecutionState: string | null
  normalizedToolCallGpuRuntimeShouldStartNow: boolean
  normalizedToolCallPublicArtifactCreated: boolean
  normalizedToolCallSignedUrlCreated: boolean
  missingProofCount: number
  missingExecutionGateCount: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  directAgentToolExecutionApprovedNow: boolean
  routeExecutionApprovedNow: boolean
  gpuRuntimeShouldStartNow: boolean
  queueWriteApprovedNow: boolean
  workerEnqueueApprovedNow: boolean
  workerDispatchApprovedNow: boolean
  toolExecutionApprovedNow: boolean
  externalBetaReadyNow: boolean
  productionReadyNow: boolean
}

function buildRuntimeEnv(routeMounted: boolean) {
  return loadRuntimeEnv({
    NODE_ENV: 'test',
    API_PORT: '8787',
    E2E_RUNTIME_MODE: 'mock',
    API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
    STORAGE_MODE: 'local',
    WORKER_RUNTIME_MODE: 'mock',
    [routeMountFlag]: routeMounted ? 'true' : 'false',
  })
}

async function withServer<T>(routeMounted: boolean, callback: (baseUrl: string) => Promise<T>) {
  const app = createReeditProApiApp(buildRuntimeEnv(routeMounted))
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

async function postToolCall(baseUrl: string, request: AiGraphicsExternalBetaToolCallRequest) {
  const response = await fetch(`${baseUrl}${AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-request-id': request.traceId,
    },
    body: JSON.stringify(request),
  })
  const text = await response.text()
  let body: Record<string, unknown> | undefined
  try {
    body = JSON.parse(text) as Record<string, unknown>
  } catch {
    body = undefined
  }
  return { response, body }
}

function buildRequest(toolId: string, capabilityId: string, kind: SmokeKind): AiGraphicsExternalBetaToolCallRequest {
  const prefix = `external-agent-mounted-blocked-route-smoke-${kind}`
  return {
    workspaceId: 'workspace_ai_graphics_external_agent_mounted_blocked_route_smoke',
    requestId: `${prefix}-${toolId}-${capabilityId}`,
    toolId: toolId as AiGraphicsExternalBetaToolCallRequest['toolId'],
    capabilityId: capabilityId as AiGraphicsExternalBetaToolCallRequest['capabilityId'],
    approvedPlanSnapshotId: `approved-snapshot-${kind}-${toolId}-${capabilityId}`,
    creditReservationId: `credit-reservation-${kind}-${toolId}-${capabilityId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent-mounted-blocked-route-smoke/${kind}/${toolId}/${capabilityId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-agent-mounted-blocked-route-smoke/${kind}/${toolId}/${capabilityId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-agent-mounted-blocked-route-smoke/${kind}/${toolId}/${capabilityId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-agent-mounted-blocked-route-smoke/${kind}/${toolId}/${capabilityId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-agent-mounted-blocked-route-smoke/${kind}/${toolId}/${capabilityId}/owner-runtime-approval`,
    traceId: `trace-ai-graphics-${prefix}-${toolId}-${capabilityId}`,
    payload: {
      mountedBlockedRouteSmokeOnly: true,
      externalAgentExecutionGateRequired: true,
      toolExecutionExpected: false,
      workerDispatchExpected: false,
      queueWriteExpected: false,
      gpuRuntimeExpected: false,
    },
  }
}

function buildSmokeCases(): SmokeCase[] {
  const toolCases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases().map((item) => ({
    kind: 'tool' as const,
    id: `tool:${item.request.toolId}`,
    request: {
      ...item.request,
      workspaceId: 'workspace_ai_graphics_external_agent_mounted_blocked_route_smoke',
      requestId: `external-agent-mounted-blocked-route-smoke-tool-${item.request.toolId}`,
      traceId: `trace-ai-graphics-mounted-blocked-route-smoke-tool-${item.request.toolId}`,
      payload: {
        mountedBlockedRouteSmokeOnly: true,
        externalAgentExecutionGateRequired: true,
        toolExecutionExpected: false,
        workerDispatchExpected: false,
        queueWriteExpected: false,
        gpuRuntimeExpected: false,
      },
    },
  }))

  const handoff = buildAiGraphicsToolCallHandoffContract()
  const capabilityCases = handoff.capabilities.map((capability) => {
    const selectedTool = capability.selectedPlanningTools[0]
    if (!selectedTool) {
      throw new Error(`No selected planning tool for capability ${capability.capabilityId}`)
    }
    return {
      kind: 'capability' as const,
      id: `capability:${capability.capabilityId}`,
      request: buildRequest(selectedTool.toolId, capability.capabilityId, 'capability'),
    }
  })

  return [...toolCases, ...capabilityCases]
}

function getEnvelopeDetails(body: Record<string, unknown> | undefined): Record<string, unknown> {
  const errorEnvelope = body?.error
  if (!errorEnvelope || typeof errorEnvelope !== 'object') {
    return {}
  }
  const details = (errorEnvelope as Record<string, unknown>).details
  return details && typeof details === 'object' ? details as Record<string, unknown> : {}
}

function getErrorCode(body: Record<string, unknown> | undefined): string | undefined {
  const errorEnvelope = body?.error
  return errorEnvelope && typeof errorEnvelope === 'object'
    ? String((errorEnvelope as Record<string, unknown>).code)
    : undefined
}

async function runMountedSmokeCase(baseUrl: string, smokeCase: SmokeCase): Promise<SmokeResult> {
  const { response, body } = await postToolCall(baseUrl, smokeCase.request)
  const details = getEnvelopeDetails(body)
  const selectedPlanningTools = Array.isArray(details.selectedPlanningTools)
    ? details.selectedPlanningTools as Array<Record<string, unknown>>
    : []
  const missingProofBeforeExecution = Array.isArray(details.missingProofBeforeExecution)
    ? details.missingProofBeforeExecution
    : []
  const missingExecutionGates = Array.isArray(details.missingExecutionGates)
    ? details.missingExecutionGates
    : []
  const normalizedToolCallResult =
    details.externalAgentToolCallResult &&
    typeof details.externalAgentToolCallResult === 'object'
      ? details.externalAgentToolCallResult as Record<string, unknown>
      : {}
  const normalizedOutputAccess =
    normalizedToolCallResult.outputAccess &&
    typeof normalizedToolCallResult.outputAccess === 'object'
      ? normalizedToolCallResult.outputAccess as Record<string, unknown>
      : {}

  return {
    kind: smokeCase.kind,
    id: smokeCase.id,
    toolId: smokeCase.request.toolId,
    capabilityId: smokeCase.request.capabilityId,
    statusCode: response.status,
    errorCode: getErrorCode(body),
    requestAcceptedForPlanningMetadata:
      details.requestAcceptedForPlanningMetadata === true,
    selectedRequestedTool:
      selectedPlanningTools.some((tool) => tool.toolId === smokeCase.request.toolId),
    normalizedToolCallResultReturned:
      Object.keys(normalizedToolCallResult).length > 0,
    normalizedToolCallCallable: normalizedToolCallResult.callable === true,
    normalizedToolCallExecutable: normalizedToolCallResult.executable === true,
    normalizedToolCallBlockedWithReason:
      normalizedToolCallResult.blockedWithReason === true,
    normalizedToolCallFailedWithDiagnostics:
      normalizedToolCallResult.failedWithDiagnostics === true,
    normalizedToolCallExecutionState:
      typeof normalizedToolCallResult.executionState === 'string'
        ? normalizedToolCallResult.executionState
        : null,
    normalizedToolCallGpuRuntimeShouldStartNow:
      normalizedToolCallResult.gpuRuntimeShouldStartNow === true,
    normalizedToolCallPublicArtifactCreated:
      normalizedOutputAccess.publicArtifactCreated === true,
    normalizedToolCallSignedUrlCreated:
      normalizedOutputAccess.signedUrlCreated === true,
    missingProofCount: missingProofBeforeExecution.length,
    missingExecutionGateCount: missingExecutionGates.length,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      details.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    directAgentToolExecutionApprovedNow:
      details.directAgentToolExecutionApprovedNow === true,
    routeExecutionApprovedNow: details.routeExecutionApprovedNow === true,
    gpuRuntimeShouldStartNow: details.gpuRuntimeShouldStartNow === true,
    queueWriteApprovedNow: details.queueWriteApprovedNow === true,
    workerEnqueueApprovedNow: details.workerEnqueueApprovedNow === true,
    workerDispatchApprovedNow: details.workerDispatchApprovedNow === true,
    toolExecutionApprovedNow: details.toolExecutionApprovedNow === true,
    externalBetaReadyNow: details.externalBetaReadyNow === true,
    productionReadyNow: details.productionReadyNow === true,
  }
}

function assertMountedSmokeResult(result: SmokeResult) {
  if (result.statusCode !== 409) {
    throw new Error(`Expected 409 for ${result.id}; received ${result.statusCode}`)
  }
  if (result.errorCode !== 'TOOL_NOT_READY') {
    throw new Error(`Expected TOOL_NOT_READY for ${result.id}; received ${result.errorCode}`)
  }
  if (!result.requestAcceptedForPlanningMetadata) {
    throw new Error(`Expected planning metadata acceptance for ${result.id}`)
  }
  if (!result.selectedRequestedTool) {
    throw new Error(`Expected selected planning tools to include requested tool for ${result.id}`)
  }
  if (!result.normalizedToolCallResultReturned) {
    throw new Error(`Expected normalized tool-call result for ${result.id}`)
  }
  if (!result.normalizedToolCallCallable) {
    throw new Error(`Expected normalized callable=true for ${result.id}`)
  }
  if (result.normalizedToolCallExecutable) {
    throw new Error(`Expected normalized executable=false for ${result.id}`)
  }
  if (!result.normalizedToolCallBlockedWithReason) {
    throw new Error(`Expected normalized blockedWithReason=true for ${result.id}`)
  }
  if (result.normalizedToolCallFailedWithDiagnostics) {
    throw new Error(`Expected normalized failedWithDiagnostics=false for ${result.id}`)
  }
  if (result.normalizedToolCallExecutionState !== 'blocked_with_reason') {
    throw new Error(`Expected normalized blocked state for ${result.id}`)
  }
  if (result.normalizedToolCallGpuRuntimeShouldStartNow) {
    throw new Error(`Expected normalized GPU runtime to stay cold for ${result.id}`)
  }
  if (result.normalizedToolCallPublicArtifactCreated) {
    throw new Error(`Expected no normalized public artifact for ${result.id}`)
  }
  if (result.normalizedToolCallSignedUrlCreated) {
    throw new Error(`Expected no normalized signed URL for ${result.id}`)
  }
  if (result.missingProofCount < 1) {
    throw new Error(`Expected missing proof details for ${result.id}`)
  }
  if (result.missingExecutionGateCount < 3) {
    throw new Error(`Expected missing execution gates for ${result.id}`)
  }
  for (const key of falseExecutionKeys) {
    if (result[key] !== false) {
      throw new Error(`Expected ${key}=false for ${result.id}`)
    }
  }
}

const smokeCases = buildSmokeCases()
const handoff = buildAiGraphicsToolCallHandoffContract()
const allToolIds = handoff.tools.map((tool) => tool.toolId)
const allCapabilityIds = handoff.capabilities.map((capability) => capability.capabilityId)
const gpuToolIds = handoff.tools
  .filter((tool) => tool.gpuRequiredForRuntime)
  .map((tool) => tool.toolId)

const mountedResults = await withServer(true, async (baseUrl) => {
  const results: SmokeResult[] = []
  for (const smokeCase of smokeCases) {
    const result = await runMountedSmokeCase(baseUrl, smokeCase)
    assertMountedSmokeResult(result)
    results.push(result)
  }
  return results
})

const disabledStatus = await withServer(false, async (baseUrl) => {
  const firstToolCase = smokeCases.find((item) => item.kind === 'tool')
  if (!firstToolCase) throw new Error('No tool smoke case available')
  const { response } = await postToolCall(baseUrl, firstToolCase.request)
  return response.status
})

if (disabledStatus !== 404) {
  throw new Error(`Expected disabled route status 404; received ${disabledStatus}`)
}

const toolResults = mountedResults.filter((result) => result.kind === 'tool')
const capabilityResults = mountedResults.filter((result) => result.kind === 'capability')
const gpuToolSmokeResults = toolResults.filter((result) =>
  gpuToolIds.includes(result.toolId as (typeof gpuToolIds)[number]),
)

const report = {
  schemaVersion: 1,
  decision,
  status,
  summary:
    'Local mounted-route smoke for the AI graphics external-agent tool-call route. With the feature flag enabled, every tool and every product-facing capability returns a structured 409 TOOL_NOT_READY response. With the flag disabled, the route remains absent. No queue write, worker enqueue, worker dispatch, tool execution, provider/model call, browser/WebGL/canvas runtime, GPU runtime, signed URL, public artifact, external beta unlock, or production unlock occurs.',
  interfaces: {
    packageScript: 'ai-graphics:external-agent-mounted-blocked-route-smoke',
    diagnosticScript: 'ai-graphics:external-agent-mounted-blocked-route-smoke:diagnostics',
    cli: 'server/cli/ai-graphics-external-agent-mounted-blocked-route-smoke.ts',
    diagnostic: 'scripts/validation/ai-graphics-external-agent-mounted-blocked-route-smoke-diagnostics.mjs',
    routePath: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH,
    routeMountFlag,
  },
  counts: {
    totalAiGraphicsTools: allToolIds.length,
    totalProductFacingCapabilities: allCapabilityIds.length,
    toolSmokeCases: toolResults.length,
    capabilitySmokeCases: capabilityResults.length,
    mountedBlockedRouteSmokeCases: mountedResults.length,
    flagEnabledToolNotReadyResponses: mountedResults.filter((result) =>
      result.statusCode === 409 && result.errorCode === 'TOOL_NOT_READY',
    ).length,
    flagDisabledRouteStatus: disabledStatus,
    gpuRuntimeTargetedTools: gpuToolIds.length,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: gpuToolSmokeResults.filter(
      (result) => result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    ).length,
    gpuRuntimeShouldStartNowTools: toolResults.filter((result) =>
      result.gpuRuntimeShouldStartNow,
    ).length,
    normalizedToolCallResultResponses: mountedResults.filter((result) =>
      result.normalizedToolCallResultReturned,
    ).length,
    normalizedToolCallCallableResponses: mountedResults.filter((result) =>
      result.normalizedToolCallCallable,
    ).length,
    normalizedToolCallExecutableResponses: mountedResults.filter((result) =>
      result.normalizedToolCallExecutable,
    ).length,
    normalizedToolCallBlockedWithReasonResponses: mountedResults.filter((result) =>
      result.normalizedToolCallBlockedWithReason,
    ).length,
    normalizedToolCallFailedWithDiagnosticsResponses: mountedResults.filter((result) =>
      result.normalizedToolCallFailedWithDiagnostics,
    ).length,
    queueWriteApprovedNowTools: toolResults.filter((result) =>
      result.queueWriteApprovedNow,
    ).length,
    workerEnqueueApprovedNowTools: toolResults.filter((result) =>
      result.workerEnqueueApprovedNow,
    ).length,
    workerDispatchApprovedNowTools: toolResults.filter((result) =>
      result.workerDispatchApprovedNow,
    ).length,
    toolExecutionApprovedNowTools: toolResults.filter((result) =>
      result.toolExecutionApprovedNow,
    ).length,
    externalAgentExecutableNowTools: 0,
    externalBetaReadyNowTools: toolResults.filter((result) =>
      result.externalBetaReadyNow,
    ).length,
    productionReadyNowTools: toolResults.filter((result) =>
      result.productionReadyNow,
    ).length,
  },
  tools: toolResults.map((result) => ({
    toolId: result.toolId,
    capabilityId: result.capabilityId,
    statusCode: result.statusCode,
    errorCode: result.errorCode,
    requestAcceptedForPlanningMetadata: result.requestAcceptedForPlanningMetadata,
    selectedRequestedTool: result.selectedRequestedTool,
    normalizedToolCallResultReturned:
      result.normalizedToolCallResultReturned,
    normalizedToolCallCallable: result.normalizedToolCallCallable,
    normalizedToolCallExecutable: result.normalizedToolCallExecutable,
    normalizedToolCallBlockedWithReason:
      result.normalizedToolCallBlockedWithReason,
    normalizedToolCallFailedWithDiagnostics:
      result.normalizedToolCallFailedWithDiagnostics,
    normalizedToolCallExecutionState: result.normalizedToolCallExecutionState,
    normalizedToolCallGpuRuntimeShouldStartNow:
      result.normalizedToolCallGpuRuntimeShouldStartNow,
    normalizedToolCallPublicArtifactCreated:
      result.normalizedToolCallPublicArtifactCreated,
    normalizedToolCallSignedUrlCreated:
      result.normalizedToolCallSignedUrlCreated,
    gpuRuntimeTargetedTool: gpuToolIds.includes(result.toolId as (typeof gpuToolIds)[number]),
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    directAgentToolExecutionApprovedNow: result.directAgentToolExecutionApprovedNow,
    routeExecutionApprovedNow: result.routeExecutionApprovedNow,
    gpuRuntimeShouldStartNow: result.gpuRuntimeShouldStartNow,
    queueWriteApprovedNow: result.queueWriteApprovedNow,
    workerEnqueueApprovedNow: result.workerEnqueueApprovedNow,
    workerDispatchApprovedNow: result.workerDispatchApprovedNow,
    toolExecutionApprovedNow: result.toolExecutionApprovedNow,
    externalBetaReadyNow: result.externalBetaReadyNow,
    productionReadyNow: result.productionReadyNow,
  })),
  capabilities: capabilityResults.map((result) => ({
    capabilityId: result.capabilityId,
    representativeToolId: result.toolId,
    statusCode: result.statusCode,
    errorCode: result.errorCode,
    requestAcceptedForPlanningMetadata: result.requestAcceptedForPlanningMetadata,
    selectedRequestedTool: result.selectedRequestedTool,
    normalizedToolCallResultReturned:
      result.normalizedToolCallResultReturned,
    normalizedToolCallCallable: result.normalizedToolCallCallable,
    normalizedToolCallExecutable: result.normalizedToolCallExecutable,
    normalizedToolCallBlockedWithReason:
      result.normalizedToolCallBlockedWithReason,
    normalizedToolCallFailedWithDiagnostics:
      result.normalizedToolCallFailedWithDiagnostics,
    normalizedToolCallExecutionState: result.normalizedToolCallExecutionState,
    normalizedToolCallGpuRuntimeShouldStartNow:
      result.normalizedToolCallGpuRuntimeShouldStartNow,
    normalizedToolCallPublicArtifactCreated:
      result.normalizedToolCallPublicArtifactCreated,
    normalizedToolCallSignedUrlCreated:
      result.normalizedToolCallSignedUrlCreated,
    directAgentToolExecutionApprovedNow: result.directAgentToolExecutionApprovedNow,
    routeExecutionApprovedNow: result.routeExecutionApprovedNow,
    gpuRuntimeShouldStartNow: result.gpuRuntimeShouldStartNow,
    queueWriteApprovedNow: result.queueWriteApprovedNow,
    workerDispatchApprovedNow: result.workerDispatchApprovedNow,
    toolExecutionApprovedNow: result.toolExecutionApprovedNow,
  })),
  booleans: {
    externalAgentMountedBlockedRouteSmokePassed: true,
    routeMountFeatureFlagEnabledInSmoke: true,
    defaultRouteMountFeatureFlagDisabled: true,
    flagDisabledRouteUnmounted: disabledStatus === 404,
    all21ToolsCovered: allToolIds.length === 21 && toolResults.length === 21,
    all12CapabilitiesCovered: allCapabilityIds.length === 12 && capabilityResults.length === 12,
    all8GpuToolsTargetGpuRuntime: gpuToolIds.length === 8,
    requestAcceptedForPlanningMetadataForAll21: toolResults.every((result) =>
      result.requestAcceptedForPlanningMetadata,
    ),
    normalizedToolCallResultReturnedForAll33: mountedResults.every((result) =>
      result.normalizedToolCallResultReturned,
    ),
    normalizedToolCallResultBlockedWithReasonForAll33: mountedResults.every((result) =>
      result.normalizedToolCallCallable &&
      !result.normalizedToolCallExecutable &&
      result.normalizedToolCallBlockedWithReason &&
      !result.normalizedToolCallFailedWithDiagnostics &&
      result.normalizedToolCallExecutionState === 'blocked_with_reason',
    ),
    normalizedToolCallResultPreservesSafetyForAll33: mountedResults.every((result) =>
      !result.normalizedToolCallGpuRuntimeShouldStartNow &&
      !result.normalizedToolCallPublicArtifactCreated &&
      !result.normalizedToolCallSignedUrlCreated,
    ),
    structuredToolNotReadyReturnedForAll21: toolResults.every((result) =>
      result.statusCode === 409 && result.errorCode === 'TOOL_NOT_READY',
    ),
    structuredToolNotReadyReturnedForAll12Capabilities: capabilityResults.every((result) =>
      result.statusCode === 409 && result.errorCode === 'TOOL_NOT_READY',
    ),
    localHttpSmokePerformed: true,
    agentCanSelectForPlanning: true,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    workerExecutionApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    providerRuntimeApprovedNow: false,
    browserWebglCanvasRuntimeApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    dependencyInstallPerformed: false,
    packageLockMutationPerformed: false,
    backendQueueSubmissionPerformed: false,
    liveQueueWritePerformed: false,
    workerEnqueuePerformed: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    routeExecutionPerformed: false,
    providerRuntimePerformed: false,
    browserWebglCanvasRuntimePerformed: false,
    gpuRuntimePerformed: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    mediaProcessingPerformed: false,
    supabaseMutationPerformed: false,
    gcsUploadPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  },
}

function makeMarkdown(packet: typeof report): string {
  return `# AI Graphics External Agent Mounted Blocked Route Smoke

Decision: \`${packet.decision}\`

Status: \`${packet.status}\`

This packet proves the external-agent AI graphics tool-call route can be mounted locally behind \`${routeMountFlag}=true\` and still fail closed for every AI graphics tool and every product-facing capability. The smoke uses the real Express app and the source-controlled route, then verifies structured \`409 TOOL_NOT_READY\` envelopes. With the feature flag disabled, the same path remains unmounted and returns \`404\`.

## Scope

- Route path: \`${AI_GRAPHICS_EXTERNAL_AGENT_TOOL_CALL_ROUTE_PATH}\`
- Route mount flag: \`${routeMountFlag}\`
- AI graphics tools covered: \`${packet.counts.totalAiGraphicsTools}\`
- Product-facing capabilities covered: \`${packet.counts.totalProductFacingCapabilities}\`
- Per-tool smoke requests: \`${packet.counts.toolSmokeCases}\`
- Per-capability smoke requests: \`${packet.counts.capabilitySmokeCases}\`
- Total mounted blocked-route requests: \`${packet.counts.mountedBlockedRouteSmokeCases}\`
- \`409 TOOL_NOT_READY\` responses with flag enabled: \`${packet.counts.flagEnabledToolNotReadyResponses}\`
- Disabled-route status with flag off: \`${packet.counts.flagDisabledRouteStatus}\`
- GPU/runtime-targeted tools: \`${packet.counts.gpuRuntimeTargetedTools}\`
- GPU start allowed only as metadata for accepted future jobs: \`${packet.counts.gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools}\`
- Normalized blocked tool-call results: \`${packet.counts.normalizedToolCallBlockedWithReasonResponses}\`
- GPU runtime started now: \`${packet.counts.gpuRuntimeShouldStartNowTools}\`
- Queue writes approved now: \`${packet.counts.queueWriteApprovedNowTools}\`
- Worker enqueue approved now: \`${packet.counts.workerEnqueueApprovedNowTools}\`
- Worker dispatch approved now: \`${packet.counts.workerDispatchApprovedNowTools}\`
- Tool execution approved now: \`${packet.counts.toolExecutionApprovedNowTools}\`
- External-agent executable tools now: \`${packet.counts.externalAgentExecutableNowTools}\`
- External-beta-ready-now tools: \`${packet.counts.externalBetaReadyNowTools}\`
- Production-ready-now tools: \`${packet.counts.productionReadyNowTools}\`

## What This Proves

- An external agent can hit the mounted API shape in a local mock app and receive a machine-readable blocker.
- Every one of the 21 AI graphics tools returns \`TOOL_NOT_READY\` instead of executing.
- Every one of the 12 product-facing capabilities returns \`TOOL_NOT_READY\` with planning metadata accepted.
- The blocked response includes the requested tool, selected planning tools, missing proof, missing execution gates, GPU on-demand metadata, and a normalized blocked \`externalAgentToolCallResult\`.
- GPU/model tools are recognized as GPU-targeted, but \`gpuRuntimeShouldStartNow=false\`.
- The default flag-off behavior keeps the route absent.

## Tool Coverage

${packet.tools.map((item) => `- \`${item.toolId}\`: \`${item.capabilityId}\`, state=\`${item.normalizedToolCallExecutionState}\`, executable=\`${item.normalizedToolCallExecutable}\``).join('\n')}

## Capability Coverage

${packet.capabilities.map((item) => `- \`${item.capabilityId}\`: representative tool \`${item.representativeToolId}\`, state=\`${item.normalizedToolCallExecutionState}\``).join('\n')}

## Required Booleans

${Object.entries(packet.booleans).map(([key, value]) => `- \`${key}=${value}\``).join('\n')}

## Safe Commands

1. \`npm run ai-graphics:external-agent-mounted-blocked-route-smoke\`
2. \`npm run ai-graphics:external-agent-mounted-blocked-route-smoke:diagnostics\`
3. \`npm run ai-graphics:external-agent-execution-gate:diagnostics\`
4. \`npm run ai-graphics:external-beta-api-route-mount-readiness:diagnostics\`
5. \`npm run ai-graphics:external-beta-api-route-mount-implementation-qa:diagnostics\`

## Result

This keeps the 21-tool AI graphics route fail-closed when mounted without controlled execution flags. It does not make the tools executable through this blocked-route packet. Controlled execution is proven by the all-21 controlled route smoke, where the 13 CPU/static and browser-runtime tools execute through their approved adapters and the eight GPU/model tools return \`blocked_with_reason\`.
`
}

if (process.argv.includes('--write-records')) {
  fs.writeFileSync(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(outputMdPath, makeMarkdown(report))
}

console.log(JSON.stringify(report, null, 2))
