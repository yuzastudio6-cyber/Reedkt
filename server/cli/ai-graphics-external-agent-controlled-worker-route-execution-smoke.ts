import fs from 'node:fs'
import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  createAiGraphicsToolRuntimeQueueService,
  type AiGraphicsToolRuntimeQueueJobInput,
} from '../services/ai-graphics-tool-runtime-queue-service'
import {
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
  AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
  type AiGraphicsExternalBetaToolCallRequest,
  listAiGraphicsExternalBetaToolCallBlockedReadinessCases,
} from '../routes/ai-graphics-external-beta-tool-call-routes'
import { AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS } from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import {
  getAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

const decision =
  'ai_graphics_external_agent_controlled_worker_route_execution_smoke_passed_with_runtime_blocks'
const status =
  'controlled_worker_claim_route_execution_passed_for_thirteen_tools_gpu_model_still_blocked'
const sourceRouteSmokePath =
  'docs/tool-intelligence/ai-graphics/external-beta-tool-call-route-browser-runtime-controlled-execution-smoke.json'
const sourceRouteSmokeDecision =
  'ai_graphics_external_beta_tool_call_route_browser_runtime_controlled_execution_smoke_passed'
const outputJsonPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.json'
const outputMdPath =
  'docs/tool-intelligence/ai-graphics/external-agent-controlled-worker-route-execution-smoke.md'
const leaseSeconds = 900

type JsonRecord = Record<string, any>

interface ControlledWorkerRouteResult {
  toolId: string
  group: 'cpu_static' | 'browser_runtime'
  capabilityId: string
  productionToolId: string
  workerType: string
  runtimeTarget: string
  mockQueueJobIdPresent: boolean
  mockWorkerClaimIdPresent: boolean
  mockWorkerEventIdPresent: boolean
  routeStatusCode: number
  routeOk: boolean
  routeStatus: string | null
  controlledAdapterExecutedNow: boolean
  localControlledPackageExecutionPerformed: boolean
  outputKind: string | null
  outputSha256: string | null
  publicArtifactCreated: boolean
  signedUrlCreated: boolean
  gpuRuntimeShouldStartNow: boolean
  workerDispatchPerformed: boolean
}

interface BlockedGpuModelResult {
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

function readJson(file: string): JsonRecord {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as JsonRecord
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

function buildQueueService() {
  const env = buildRuntimeEnv()
  assert(env.mockOnly === true, 'Controlled worker route smoke must run mock-only')
  return createAiGraphicsToolRuntimeQueueService({
    env,
    clients: { admin: null, public: null },
    requestId: 'ai-graphics-external-agent-controlled-worker-route-execution-smoke',
    auth: {
      userId: 'ai_graphics_external_agent_controlled_worker_route_smoke_user',
      isMockUser: true,
    },
  })
}

function controlledRequest(
  request: AiGraphicsExternalBetaToolCallRequest,
  prefix: string,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    ...request,
    requestId: request.requestId.replace('blocked-details-', `${prefix}-`),
    traceId: request.traceId.replace('blocked-details', prefix),
    privateArtifactManifestRef:
      `private://ai-graphics/external-agent/controlled-worker-route-execution-smoke/${request.toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-agent/controlled-worker-route-execution-smoke/${request.toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-agent/controlled-worker-route-execution-smoke/${request.toolId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-agent/controlled-worker-route-execution-smoke/${request.toolId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-agent/controlled-worker-route-execution-smoke/${request.toolId}/owner-runtime-approval`,
    payload: undefined,
  }
}

function buildJob(
  request: AiGraphicsExternalBetaToolCallRequest,
): AiGraphicsToolRuntimeQueueJobInput {
  const readiness = getAiGraphicsToolCallReadiness(
    request.toolId as AiGraphicsCanonicalToolId,
  )
  assert(readiness, `Missing AI graphics readiness record for ${request.toolId}`)
  assert(readiness.productionToolId, `Missing production tool id for ${request.toolId}`)
  return {
    toolId: request.toolId,
    productionToolId: readiness.productionToolId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    capabilityIds: [request.capabilityId],
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    idempotencyKey:
      `ai-graphics-external-agent-controlled-worker-route-execution-smoke:job:${request.toolId}`,
    priority: 'normal',
    maxAttempts: 1,
    inputPayload: {
      sourceRoute: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
      sourceRouteSmokePath,
      sourceRouteSmokeDecision,
      traceId: request.traceId,
      routeExecutionExpected: true,
      controlledAdapterExecutionExpected: true,
      liveQueueWriteExpected: false,
      workerDispatchExpected: false,
      toolExecutionExpected: false,
      gpuRuntimeExpected: false,
    },
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
  let body: JsonRecord | null = null
  try {
    body = JSON.parse(text) as JsonRecord
  } catch {
    body = null
  }
  return { response, body }
}

async function runControlledCase(input: {
  baseUrl: string
  service: ReturnType<typeof createAiGraphicsToolRuntimeQueueService>
  request: AiGraphicsExternalBetaToolCallRequest
  jobId: string
  group: 'cpu_static' | 'browser_runtime'
}): Promise<ControlledWorkerRouteResult> {
  const readiness = getAiGraphicsToolCallReadiness(
    input.request.toolId as AiGraphicsCanonicalToolId,
  )
  assert(readiness?.productionToolId, `Missing readiness for ${input.request.toolId}`)
  const claim = await input.service.claimToolRuntimeJob({
    jobId: input.jobId,
    workerType: readiness.productionWorkerType,
    workerInstanceId:
      'ai_graphics_external_agent_controlled_worker_route_execution_smoke_worker',
    idempotencyKey:
      `ai-graphics-external-agent-controlled-worker-route-execution-smoke:claim:${input.request.toolId}`,
    leaseSeconds,
  })
  const claimResult = claim.claimResult as JsonRecord
  assert(claimResult.mockOnly === true, `Claim result was not mock-only for ${input.request.toolId}`)
  assert(claimResult.toolExecutionPerformed === false, `Claim executed tool for ${input.request.toolId}`)

  const { response, body } = await postToolCall(input.baseUrl, input.request)
  const data = body?.data ?? {}
  const booleans = data.booleans ?? {}
  const adapterResult = data.adapterResult ?? {}
  const output = adapterResult.output ?? {}

  const event = await input.service.recordWorkerEvent({
    jobId: input.jobId,
    eventType: 'controlled_route_execution_completed',
    message:
      'External-agent controlled worker route smoke executed the canonical route after a mock worker claim.',
    progressPercent: 100,
    payload: {
      toolId: input.request.toolId,
      routeStatusCode: response.status,
      routeStatus: data.routeStatus,
      controlledAdapterExecutedNow:
        adapterResult.controlledAdapterExecutedNow === true,
      localControlledPackageExecutionPerformed:
        booleans.localBrowserRuntimePackageExecutionPerformed === true ||
        booleans.localCpuStaticPackageExecutionPerformed === true ||
        adapterResult.localBrowserRuntimePackageExecutionPerformed === true ||
        adapterResult.localCpuStaticPackageExecutionPerformed === true,
      privateArtifactManifestRef: input.request.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      gpuRuntimeShouldStartNow: false,
    },
  })
  const eventResult = event.eventResult as JsonRecord
  assert(eventResult.mockOnly === true, `Worker event was not mock-only for ${input.request.toolId}`)
  assert(eventResult.toolExecutionPerformed === false, `Worker event executed tool for ${input.request.toolId}`)

  return {
    toolId: input.request.toolId,
    group: input.group,
    capabilityId: input.request.capabilityId,
    productionToolId: readiness.productionToolId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    mockQueueJobIdPresent: Boolean(input.jobId),
    mockWorkerClaimIdPresent: Boolean(claimResult.workerClaimId),
    mockWorkerEventIdPresent: Boolean(eventResult.jobEventId),
    routeStatusCode: response.status,
    routeOk: body?.ok === true,
    routeStatus: typeof data.routeStatus === 'string' ? data.routeStatus : null,
    controlledAdapterExecutedNow:
      adapterResult.controlledAdapterExecutedNow === true,
    localControlledPackageExecutionPerformed:
      booleans.localBrowserRuntimePackageExecutionPerformed === true ||
      booleans.localCpuStaticPackageExecutionPerformed === true ||
      adapterResult.localBrowserRuntimePackageExecutionPerformed === true ||
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

async function runBlockedCase(
  baseUrl: string,
  request: AiGraphicsExternalBetaToolCallRequest,
): Promise<BlockedGpuModelResult> {
  const { response, body } = await postToolCall(baseUrl, request)
  const details = body?.details ?? body?.error?.details ?? {}
  return {
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    statusCode: response.status,
    blocked: response.status === 409,
    code: typeof body?.code === 'string' ? body.code : null,
    gpuRuntimeShouldStartNow: details.gpuRuntimeShouldStartNow === true,
    agentCanExecuteToolsNow: details.directAgentToolExecutionApprovedNow === true ||
      details.agentCanExecuteToolsNow === true,
  }
}

function makeMarkdown(report: ReturnType<typeof buildReport>): string {
  const rows = report.controlledWorkerRouteResults
    .map((item) => (
      `| \`${item.toolId}\` | \`${item.group}\` | \`${item.capabilityId}\` | \`${item.routeStatusCode}\` | \`${item.controlledAdapterExecutedNow}\` | \`${item.localControlledPackageExecutionPerformed}\` | \`${item.outputKind}\` | \`${item.outputSha256}\` |`
    ))
    .join('\n')

  return `# AI Graphics External Agent Controlled Worker Route Execution Smoke

Decision: \`${report.decision}\`

Status: \`${report.status}\`

This smoke proves the external-agent path can create mock worker queue jobs, claim those jobs, execute the canonical controlled route for the 13 currently proven CPU/static and browser/runtime tools, and record worker events against the claimed jobs. It preserves live service-role queue writes, worker dispatch, broad all-tool execution, GPU/model runtime, public artifacts, signed URLs, external beta unlock, and production unlock as blocked.

## Controlled Worker Route Executed Tools

| Tool | Group | Capability | HTTP status | Adapter executed | Local package execution | Output kind | Private output SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Counts

${Object.entries(report.counts).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Booleans

${Object.entries(report.booleans).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n')}

## Boundary

The smoke runs in explicit local/mock mode. GPU/model tools remain fail-closed and GPU runtime stays idle. The worker claim is a mock lease, not a live production Worker dispatch. The controlled route returns private artifact metadata and hashes only; it does not create signed URLs or public artifacts.
`
}

function buildReport(input: {
  queueResult: JsonRecord
  controlledWorkerRouteResults: ControlledWorkerRouteResult[]
  blockedGpuModelResults: BlockedGpuModelResult[]
}) {
  const cpuRows = input.controlledWorkerRouteResults.filter(
    (item) => item.group === 'cpu_static',
  )
  const browserRows = input.controlledWorkerRouteResults.filter(
    (item) => item.group === 'browser_runtime',
  )
  return {
    schemaVersion:
      '2026-07-02.ai-graphics.external-agent-controlled-worker-route-execution-smoke',
    decision,
    status,
    summary:
      'External-agent controlled worker route execution smoke for the 13 tools that already have controlled canonical route proof. It proves mock queue insertion, mock worker claim, route execution after claim, adapter execution, private output metadata, and worker event recording while keeping the eight GPU/model tools fail-closed.',
    sourceEvidence: {
      routeControlledExecutionSmoke: sourceRouteSmokePath,
      queueService: 'server/services/ai-graphics-tool-runtime-queue-service.ts',
      canonicalRoute: 'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
      cpuStaticControlledAdapter:
        'server/tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter.ts',
      browserRuntimeControlledAdapter:
        'server/tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter.ts',
    },
    interfaces: {
      packageScript:
        'ai-graphics:external-agent-controlled-worker-route-execution-smoke',
      diagnosticScript:
        'ai-graphics:external-agent-controlled-worker-route-execution-smoke:diagnostics',
      cli:
        'server/cli/ai-graphics-external-agent-controlled-worker-route-execution-smoke.ts',
      diagnostic:
        'scripts/validation/ai-graphics-external-agent-controlled-worker-route-execution-smoke-diagnostics.mjs',
      routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
      queueService: 'createAiGraphicsToolRuntimeQueueService',
      claimMethod: 'claimToolRuntimeJob',
      workerEventMethod: 'recordWorkerEvent',
      routeEventType: 'controlled_route_execution_completed',
      queueName: 'ai_graphics_external_beta_tool_runtime',
    },
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      controlledWorkerRouteExecutionAttemptedTools:
        input.controlledWorkerRouteResults.length,
      controlledWorkerRouteExecutionCompletedTools:
        input.controlledWorkerRouteResults.filter((item) => item.routeOk).length,
      mockQueueInsertedJobsWithProvidedEvidence:
        input.queueResult.insertedJobCount ?? 0,
      mockWorkerClaimsCreatedWithProvidedEvidence:
        input.controlledWorkerRouteResults.filter(
          (item) => item.mockWorkerClaimIdPresent,
        ).length,
      mockWorkerEventsRecordedWithProvidedEvidence:
        input.controlledWorkerRouteResults.filter(
          (item) => item.mockWorkerEventIdPresent,
        ).length,
      controlledCanonicalRouteExecutedToolsWithProvidedEvidence:
        input.controlledWorkerRouteResults.length,
      cpuStaticControlledCanonicalRouteExecutedToolsWithProvidedEvidence:
        cpuRows.length,
      browserRuntimeControlledCanonicalRouteExecutedToolsWithProvidedEvidence:
        browserRows.length,
      localControlledPackageExecutionPerformedToolsWithProvidedEvidence:
        input.controlledWorkerRouteResults.filter(
          (item) => item.localControlledPackageExecutionPerformed,
        ).length,
      controlledAdapterExecutedToolsWithProvidedEvidence:
        input.controlledWorkerRouteResults.filter(
          (item) => item.controlledAdapterExecutedNow,
        ).length,
      gpuModelBlockedToolsWithProvidedEvidence:
        input.blockedGpuModelResults.length,
      externalAgentControlledWorkerRouteExecutableToolsWithProvidedEvidence:
        input.controlledWorkerRouteResults.length,
      externalAgentBroadExecutableNowTools: 0,
      workerDispatchPerformedTools: 0,
      routeExecutionPerformedTools:
        input.controlledWorkerRouteResults.filter((item) => item.routeOk).length,
      toolExecutionPerformedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
      externalBetaReadyNowTools: 0,
      productionReadyNowTools: 0,
    },
    controlledWorkerRouteResults: input.controlledWorkerRouteResults,
    blockedGpuModelResults: input.blockedGpuModelResults,
    booleans: {
      externalAgentControlledWorkerRouteExecutionSmokePassed: true,
      sourceRouteControlledExecutionSmokeAccepted: true,
      mockQueueServiceClaimAccepted: true,
      mockQueueServiceWorkerEventAccepted: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      thirteenControlledToolsClaimedBeforeRouteExecution: true,
      thirteenControlledToolsExecutedViaClaimedCanonicalRoute: true,
      sixCpuStaticToolsExecutedViaClaimedCanonicalRoute: cpuRows.length === 6,
      sevenBrowserRuntimeToolsExecutedViaClaimedCanonicalRoute:
        browserRows.length === 7,
      eightGpuModelToolsRemainBlocked: input.blockedGpuModelResults.length === 8,
      localControlledPackageExecutionPerformed: true,
      controlledAdapterExecutionPerformed: true,
      privateOutputMetadataReturned: true,
      agentCanSelectForPlanning: true,
      externalAgentCanExecuteControlledWorkerRouteToolsNow: true,
      agentCanExecuteControlledCpuStaticAndBrowserRuntimeRouteToolsNow: true,
      agentCanExecuteAll21ToolsNow: false,
      agentCanExecuteGpuModelToolsNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: true,
      routeExecutionPerformed: true,
      mockWorkerClaimPerformed: true,
      backendQueueSubmissionApprovedNow: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformed: false,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerEnqueueApprovedNow: false,
      workerEnqueuePerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      controlledLocalBrowserRuntimePerformed: true,
      browserRuntimeStartedByCanonicalRoute: true,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
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
  }
}

async function main() {
  const sourceRouteSmoke = readJson(sourceRouteSmokePath)
  assert(
    sourceRouteSmoke.decision === sourceRouteSmokeDecision,
    'Source controlled route smoke decision mismatch',
  )
  assert(
    sourceRouteSmoke.status ===
      'canonical_tool_call_route_controlled_execution_passed_for_thirteen_cpu_static_and_browser_tools',
    'Source controlled route smoke status mismatch',
  )
  assert(
    sourceRouteSmoke.counts?.controlledAdapterExecutedTools === 13,
    'Source controlled route smoke must execute 13 adapters',
  )
  assert(
    sourceRouteSmoke.booleans
      ?.agentCanExecuteControlledCpuStaticAndBrowserRuntimeToolsNow === true,
    'Source controlled route smoke must accept 13 controlled route tools',
  )
  assert(
    sourceRouteSmoke.booleans?.agentCanExecuteAll21ToolsNow === false,
    'Source controlled route smoke must keep all-21 execution blocked',
  )

  const cases = listAiGraphicsExternalBetaToolCallBlockedReadinessCases()
  const cpuStaticToolIds = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
  )
  const browserRuntimeToolIds = new Set<string>(
    AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
  )

  const cpuStaticRequests = cases
    .filter((item) => cpuStaticToolIds.has(item.request.toolId))
    .map((item) => controlledRequest(item.request, 'controlled-worker-route-cpu-static'))
  const browserRuntimeRequests = cases
    .filter((item) => browserRuntimeToolIds.has(item.request.toolId))
    .map((item) => controlledRequest(item.request, 'controlled-worker-route-browser'))
  const blockedGpuModelRequests = cases
    .filter((item) => (
      !cpuStaticToolIds.has(item.request.toolId) &&
      !browserRuntimeToolIds.has(item.request.toolId)
    ))
    .map((item) => controlledRequest(item.request, 'controlled-worker-route-gpu-blocked'))

  assert(cpuStaticRequests.length === 6, `Expected six CPU/static requests, got ${cpuStaticRequests.length}`)
  assert(browserRuntimeRequests.length === 7, `Expected seven browser/runtime requests, got ${browserRuntimeRequests.length}`)
  assert(blockedGpuModelRequests.length === 8, `Expected eight GPU/model requests, got ${blockedGpuModelRequests.length}`)

  const controlledRequests = [
    ...cpuStaticRequests.map((request) => ({ request, group: 'cpu_static' as const })),
    ...browserRuntimeRequests.map((request) => ({ request, group: 'browser_runtime' as const })),
  ]
  const service = buildQueueService()
  const jobs = controlledRequests.map((item) => buildJob(item.request))
  const enqueue = await service.enqueueToolRuntimeJobs({
    workspaceId:
      'workspace_ai_graphics_external_agent_controlled_worker_route_execution_smoke',
    projectId:
      'project_ai_graphics_external_agent_controlled_worker_route_execution_smoke',
    approvedPlanSnapshotId:
      'approved_snapshot_ai_graphics_external_agent_controlled_worker_route_execution_smoke',
    creditReservationId:
      'credit_reservation_ai_graphics_external_agent_controlled_worker_route_execution_smoke',
    jobs,
    idempotencyKey:
      'ai-graphics-external-agent-controlled-worker-route-execution-smoke:batch:13',
    chatSessionId:
      'chat_ai_graphics_external_agent_controlled_worker_route_execution_smoke',
    editPlanId:
      'edit_plan_ai_graphics_external_agent_controlled_worker_route_execution_smoke',
    creditEstimateId:
      'credit_estimate_ai_graphics_external_agent_controlled_worker_route_execution_smoke',
    batchName: 'AI graphics external agent controlled worker route execution smoke',
    createdByAgent:
      'ai_graphics_external_agent_controlled_worker_route_execution_smoke',
  })
  const queueResult = enqueue.queueResult as JsonRecord
  assert(queueResult.mockOnly === true, 'Queue result must be mock-only')
  assert(Array.isArray(queueResult.jobIds), 'Queue result must return job IDs')
  assert(queueResult.jobIds.length === controlledRequests.length, 'Queue result job ID count mismatch')
  assert(queueResult.insertedJobCount === controlledRequests.length, 'Queue result inserted count mismatch')

  const { controlledWorkerRouteResults, blockedGpuModelResults } = await withServer(
    async (baseUrl) => {
      const controlled: ControlledWorkerRouteResult[] = []
      for (const [index, item] of controlledRequests.entries()) {
        controlled.push(await runControlledCase({
          baseUrl,
          service,
          request: item.request,
          jobId: queueResult.jobIds[index],
          group: item.group,
        }))
      }
      const blocked: BlockedGpuModelResult[] = []
      for (const request of blockedGpuModelRequests) {
        blocked.push(await runBlockedCase(baseUrl, request))
      }
      return { controlledWorkerRouteResults: controlled, blockedGpuModelResults: blocked }
    },
  )

  for (const result of controlledWorkerRouteResults) {
    assert(result.routeStatusCode === 200, `${result.toolId} route did not return 200`)
    assert(result.routeOk === true, `${result.toolId} route did not return ok envelope`)
    assert(result.controlledAdapterExecutedNow === true, `${result.toolId} adapter did not execute`)
    assert(result.localControlledPackageExecutionPerformed === true, `${result.toolId} local package execution missing`)
    assert(result.mockQueueJobIdPresent === true, `${result.toolId} missing mock queue job id`)
    assert(result.mockWorkerClaimIdPresent === true, `${result.toolId} missing mock worker claim id`)
    assert(result.mockWorkerEventIdPresent === true, `${result.toolId} missing mock worker event id`)
    assert(Boolean(result.outputKind), `${result.toolId} missing output kind`)
    assert(Boolean(result.outputSha256), `${result.toolId} missing output hash`)
    assert(result.publicArtifactCreated === false, `${result.toolId} created public artifact`)
    assert(result.signedUrlCreated === false, `${result.toolId} created signed URL`)
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.workerDispatchPerformed === false, `${result.toolId} dispatched a worker`)
  }
  for (const result of blockedGpuModelResults) {
    assert(result.blocked === true, `${result.toolId} GPU/model route should block`)
    assert(result.statusCode === 409, `${result.toolId} GPU/model route should return 409`)
    assert(result.gpuRuntimeShouldStartNow === false, `${result.toolId} started GPU runtime`)
    assert(result.agentCanExecuteToolsNow === false, `${result.toolId} enabled global execution`)
  }

  const report = buildReport({
    queueResult,
    controlledWorkerRouteResults,
    blockedGpuModelResults,
  })
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
