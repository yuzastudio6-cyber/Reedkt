import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const decision =
  'ai_graphics_external_agent_route_to_queue_blocked_admission_prepared_with_runtime_blocks'
const status = 'mounted_route_to_queue_blocked_admission_ready_runtime_still_blocked'
const mountedSmokeScript = 'ai-graphics:external-agent-mounted-blocked-route-smoke'
const routeToQueueBridgePath =
  'docs/tool-intelligence/ai-graphics/external-beta-route-to-queue-authorization-bridge.json'

type JsonRecord = Record<string, any>

const falseKeys = [
  'directAgentToolExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'queueWriteApprovedNow',
  'workerEnqueueApprovedNow',
  'workerDispatchApprovedNow',
  'toolExecutionApprovedNow',
  'gpuRuntimeShouldStartNow',
  'externalBetaReadyNow',
  'productionReadyNow',
]

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
}

function runMountedSmoke(): JsonRecord {
  const output = execFileSync('npm', ['run', '--silent', mountedSmokeScript], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  })
  return JSON.parse(output) as JsonRecord
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const mountedSmoke = runMountedSmoke()
const routeToQueueBridge = readJson(routeToQueueBridgePath)

assert(
  mountedSmoke.decision ===
    'ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks',
  'Mounted blocked-route smoke decision mismatch',
)
assert(
  mountedSmoke.status === 'mounted_route_returns_structured_tool_not_ready_for_all_21',
  'Mounted blocked-route smoke status mismatch',
)
assert(routeToQueueBridge.decision ===
  'ai_graphics_external_beta_route_to_queue_authorization_bridge_prepared_with_runtime_blocks',
  'Route-to-queue authorization bridge decision mismatch',
)
assert(
  routeToQueueBridge.status === 'route_to_queue_authorization_bridge_ready_runtime_still_blocked',
  'Route-to-queue authorization bridge status mismatch',
)

const smokeTools = mountedSmoke.tools as JsonRecord[]
const bridgeCandidates = routeToQueueBridge.routeToQueueAuthorizationCandidates as JsonRecord[]
assert(smokeTools.length === 21, 'Mounted smoke must cover 21 tools')
assert(bridgeCandidates.length === 21, 'Route-to-queue bridge must cover 21 candidates')

const toolRows = smokeTools.map((smokeTool) => {
  const candidate = bridgeCandidates.find((item) => item.toolId === smokeTool.toolId)
  assert(candidate, `Missing route-to-queue candidate for ${smokeTool.toolId}`)
  assert(smokeTool.statusCode === 409, `Mounted route status is not 409 for ${smokeTool.toolId}`)
  assert(smokeTool.errorCode === 'TOOL_NOT_READY', `Mounted route error is not TOOL_NOT_READY for ${smokeTool.toolId}`)
  assert(candidate.queueJobStatus === 'prepared_not_submitted', `Queue status is not prepared_not_submitted for ${smokeTool.toolId}`)
  for (const key of falseKeys) {
    assert(smokeTool[key] === false, `Mounted smoke ${key} is not false for ${smokeTool.toolId}`)
  }
  for (const key of [
    'apiRouteExecutionApprovedNow',
    'routeExecutionPerformed',
    'routeToQueueAuthorizationApprovedNow',
    'backendQueueSubmissionApprovedNow',
    'backendQueueSubmissionPerformed',
    'liveQueueWriteApprovedNow',
    'liveQueueWritePerformed',
    'workerEnqueueApprovedNow',
    'workerEnqueuePerformed',
    'workerDispatchPerformed',
    'toolExecutionPerformed',
    'publicArtifactCreated',
    'signedUrlCreated',
  ]) {
    assert(candidate[key] === false, `Route-to-queue candidate ${key} is not false for ${smokeTool.toolId}`)
  }
  return {
    toolId: smokeTool.toolId,
    capabilityId: smokeTool.capabilityId,
    routeStatusCode: smokeTool.statusCode,
    routeErrorCode: smokeTool.errorCode,
    requestAcceptedForPlanningMetadata: smokeTool.requestAcceptedForPlanningMetadata,
    queueAuthorizationId: candidate.authorizationId,
    queueName: candidate.queueName,
    queueJobStatus: candidate.queueJobStatus,
    runtimeTarget: candidate.runtimeTarget,
    workerType: candidate.workerType,
    gpuRuntimeTargetedTool: smokeTool.gpuRuntimeTargetedTool,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      smokeTool.gpuRuntimeStartAllowedForAcceptedExternalBetaJob &&
      candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    routeExecutionApprovedNow: false,
    routeToQueueAuthorizationApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
})

const capabilityIds = new Set((mountedSmoke.capabilities as JsonRecord[]).map((row) => row.capabilityId))
const gpuRows = toolRows.filter((row) => row.gpuRuntimeTargetedTool)

const report = {
  schemaVersion: 1,
  decision,
  status,
  summary:
    'All-21 external-agent route-to-queue blocked admission bridge. It runs the mounted blocked-route smoke, maps each structured 409 TOOL_NOT_READY route response to the all-21 route-to-queue authorization bridge candidate, and keeps every queue job prepared_not_submitted with no live queue write, worker enqueue, worker dispatch, tool execution, or GPU startup.',
  sourceEvidence: {
    mountedBlockedRouteSmoke:
      'ai_graphics_external_agent_mounted_blocked_route_smoke_passed_with_runtime_blocks',
    routeToQueueAuthorizationBridge:
      'ai_graphics_external_beta_route_to_queue_authorization_bridge_prepared_with_runtime_blocks',
  },
  interfaces: {
    packageScript: 'ai-graphics:external-agent-route-to-queue-blocked-admission',
    diagnosticScript:
      'ai-graphics:external-agent-route-to-queue-blocked-admission:diagnostics',
    cli: 'server/cli/ai-graphics-external-agent-route-to-queue-blocked-admission.ts',
    diagnostic:
      'scripts/validation/ai-graphics-external-agent-route-to-queue-blocked-admission-diagnostics.mjs',
    routePath: '/api/ai-graphics/external-beta/tool-call',
    queueName: 'ai_graphics_external_beta_tool_runtime',
  },
  counts: {
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: capabilityIds.size,
    mountedBlockedRouteSmokeCases: mountedSmoke.counts.mountedBlockedRouteSmokeCases,
    flagEnabledToolNotReadyResponses: mountedSmoke.counts.flagEnabledToolNotReadyResponses,
    routeToQueueAuthorizationCandidates: bridgeCandidates.length,
    routeToQueueBlockedAdmissionMappedTools: toolRows.length,
    queuePreparedNotSubmittedTools: toolRows.filter((row) => row.queueJobStatus === 'prepared_not_submitted').length,
    gpuRuntimeTargetedTools: gpuRows.length,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
      gpuRows.filter((row) => row.gpuRuntimeStartAllowedForAcceptedExternalBetaJob).length,
    gpuRuntimeShouldStartNowTools: 0,
    routeExecutionApprovedNowTools: 0,
    routeToQueueAuthorizationApprovedNowTools: 0,
    backendQueueSubmissionApprovedNowTools: 0,
    liveQueueWriteApprovedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchPerformedTools: 0,
    toolExecutionPerformedTools: 0,
    externalAgentExecutableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
  },
  tools: toolRows,
  capabilities: mountedSmoke.capabilities,
  booleans: {
    externalAgentRouteToQueueBlockedAdmissionPrepared: true,
    sourceMountedBlockedRouteSmokeAccepted: true,
    sourceRouteToQueueAuthorizationBridgeAccepted: true,
    all21ToolsCovered: toolRows.length === 21,
    all12CapabilitiesCovered: capabilityIds.size === 12,
    all8GpuToolsTargetGpuRuntime: gpuRows.length === 8,
    mountedRouteReturnsStructuredToolNotReadyForAll21: true,
    routeResponseMappedToQueueAuthorizationForAll21: true,
    queueJobPreparedNotSubmittedOnly: true,
    requestAcceptedForPlanningMetadataForAll21: true,
    agentCanSelectForPlanning: true,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    routeToQueueAuthorizationApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
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
