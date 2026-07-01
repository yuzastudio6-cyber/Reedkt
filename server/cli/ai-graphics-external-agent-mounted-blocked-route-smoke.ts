import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { buildAiGraphicsToolCallHandoffContract } from '../tool-registry/ai-graphics-tool-call-handoff'

const decision =
  'ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks'
const status = 'mounted_route_returns_structured_tool_not_ready_for_all_21'
const routeMountFlag = 'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOUNT_ENABLED'

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
  const response = await fetch(`${baseUrl}${AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH}`, {
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
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
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

console.log(JSON.stringify(report, null, 2))
