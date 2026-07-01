import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_with_runtime_blocks'

const preflightTools: AiGraphicsCanonicalToolId[] = [
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
]

const productFacingCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
  (capabilityId) =>
    capabilityId !== 'planning_metadata_only' &&
    capabilityId !== 'blocked_or_deferred',
)

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightStatus =
  | 'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked'
  | 'non_production_service_role_queue_write_smoke_preflight_blocked_pending_satori_font_fixture'
  | 'non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary'
  | 'non_production_service_role_queue_write_smoke_preflight_blocked_missing_live_adapter_queue_write_proof'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightContract {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  smokeMode: 'non_production_service_role_queue_write_smoke_preflight_only'
  requiredEnvironment: [
    'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true',
    'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'E2E_RUNTIME_MODE=local',
    'WORKER_RUNTIME_MODE=mock',
  ]
  requiredFlags: [
    '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
    '--workspace-id',
    '--project-id',
    '--approved-plan-snapshot-id',
    '--credit-reservation-id',
    '--idempotency-prefix',
    '--source-live-adapter-queue-write-proof-packet',
    '--service-role-boundary-ref',
    '--telemetry-ref',
    '--cleanup-proof-ref',
    '--rollback-ref',
  ]
  requiredSourceProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION
  requiredSourceProofStatus:
    'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_five_mock_queue_validated_execution_blocked'
  expectedSmokeResultStatus:
    'non_production_service_role_queue_write_smoke_passed_with_cleanup_no_worker_dispatch_or_tool_execution'
  expectedQueueRowsBeforeCleanup: 5
  expectedQueueRowsAfterCleanup: 0
  expectedWorkerClaimsNow: 0
  expectedWorkerDispatchesNow: 0
  expectedToolExecutionsNow: 0
  expectedGpuRuntimeStartsNow: 0
  privateArtifactOnly: true
  savedResultRequiredBeforeExecutionGateCanAdvance: true
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightEvidence {
  sourceLiveAdapterQueueWriteProofRef: string
  sourceLocalAdapterInvocationProofRef: string
  sourceMockQueueWriteProofRef: string
  sourceAdapterInvocationEnvelopeRef: string
  sourceWorkerEnqueuePayloadRef: string
  sourceBackendQueueAdapterRef: string
  sourceServiceRoleBoundaryRef: string
  privateArtifactManifestRef: string
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  nonProductionServiceRoleBoundaryRef: string
  smokeTelemetryRef: string
  smokeCleanupProofRef: string
  smokeRollbackRef: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget | 'deferred'
  capabilityId: string | null
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceLiveAdapterQueueWriteProofStatus: string | null
  sourceLiveAdapterQueueWriteProofAccepted: boolean
  nonProductionServiceRoleQueueWriteSmokePreflightStatus:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightStatus
  nonProductionServiceRoleQueueWriteSmokePreflightReady: boolean
  preflightContract:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightContract | null
  preflightEvidence:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightEvidence | null
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  backendQueueTransportProofRequired: true
  serviceRoleCredentialsServerOnly: true
  nonProductionEnvironmentRequired: true
  explicitOperatorConfirmationRequired: true
  cleanupRequired: true
  rollbackRequired: true
  telemetryRequired: true
  savedSmokeResultRequired: true
  privateArtifactOnly: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  externalAgentCanInvokeAdapterNow: false
  externalAgentCanSubmitPrivateWorkerQueueNow: false
  backendQueueSubmissionApprovedNow: false
  serviceRoleQueueWriteSmokeApprovedNow: false
  liveQueueWriteApprovedNow: false
  workerEnqueueApprovedNow: false
  workerClaimApprovedNow: false
  workerDispatchApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  runtimeReadyNow: false
  externalBetaReadyNow: false
  productionReadyNow: false
  blocker: string
  nextProofMilestone: string
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport {
  schemaVersion:
    '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight'
  decision:
    typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION
  status:
    'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_five_execution_blocked'
  sourceLiveAdapterQueueWriteProofDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  smokePreflightPolicy: {
    mode: 'prepare_non_production_service_role_queue_write_smoke_without_running_it'
    sourceLiveAdapterQueueWriteProofRequired: true
    exactFiveCpuStaticToolsOnly: true
    serverOnlyServiceRoleCredentialsRequired: true
    nonProductionEnvironmentRequired: true
    explicitOperatorConfirmationRequired: true
    savedSmokeResultRequiredBeforeExecutionGateCanAdvance: true
    cleanupRequired: true
    rollbackRequired: true
    telemetryRequired: true
    noSupabaseQueueWriteByPreflight: true
    noLiveQueueWriteByPreflight: true
    noWorkerClaimByPreflight: true
    noWorkerDispatchByPreflight: true
    noToolExecutionByPreflight: true
    privateArtifactOnly: true
    gpuRuntimeOnDemandOnly: true
  }
  counts: {
    totalAiGraphicsTools: 21
    sourceLiveAdapterQueueWriteProofAcceptedTools: number
    nonProductionServiceRoleQueueWriteSmokePreflightReadyTools: number
    nonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    serviceRoleQueueWriteSmokeApprovedNowTools: 0
    liveQueueWriteApprovedNowTools: 0
    liveQueueWritePerformedNowTools: 0
    workerClaimApprovedNowTools: 0
    workerClaimPerformedNowTools: 0
    workerDispatchApprovedNowTools: 0
    workerDispatchPerformedNowTools: 0
    workerExecutionApprovedNowTools: 0
    toolExecutionApprovedNowTools: 0
    toolExecutionPerformedNowTools: 0
    externalAgentExecutableNowTools: 0
    publicArtifactAllowedTools: 0
    signedUrlAllowedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightPrepared: true
    sourceLiveAdapterQueueWriteProofAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady: boolean
    allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    serverOnlyServiceRoleCredentialsRequired: true
    nonProductionEnvironmentRequired: true
    explicitOperatorConfirmationRequired: true
    savedSmokeResultRequiredBeforeExecutionGateCanAdvance: true
    cleanupRequired: true
    rollbackRequired: true
    telemetryRequired: true
    privateArtifactOnlyPolicyAccepted: true
    noSupabaseQueueWriteByPreflight: true
    noLiveQueueWriteByPreflight: true
    noWorkerClaimByPreflight: true
    noWorkerDispatchByPreflight: true
    noToolExecutionByPreflight: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanInvokeAdapterNow: false
    externalAgentCanSubmitPrivateWorkerQueueNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueWriteSmokeApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerEnqueueApprovedNow: false
    workerClaimApprovedNow: false
    workerDispatchApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    serviceRoleQueueWriteSmokePerformed: false
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformed: false
    workerEnqueuePerformed: false
    workerClaimPerformed: false
    workerDispatchPerformed: false
    toolExecutionPerformed: false
    routeExecutionPerformed: false
    workerExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
  safeCommandsBeforeSmoke: string[]
  futureSmokeResultRequirements: string[]
  nextMilestone: string
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightInput {
  sourceLiveAdapterQueueWriteProofReport?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport
}

function sourceRow(
  report:
    | AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport
    | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow | undefined {
  return report?.rows?.find((row) => row.toolId === toolId)
}

function sourceAccepted(
  report?:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofReport,
): boolean {
  const rows = report?.rows ?? []
  return report?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION &&
    report.status ===
      'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_five_mock_queue_validated_execution_blocked' &&
    report.counts?.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidenceTools === 5 &&
    report.counts?.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    report.counts?.nonCpuStaticDeferredTools === 15 &&
    report.counts?.liveQueueWriteApprovedNowTools === 0 &&
    report.counts?.workerClaimApprovedNowTools === 0 &&
    report.counts?.workerDispatchApprovedNowTools === 0 &&
    report.counts?.toolExecutionApprovedNowTools === 0 &&
    report.counts?.externalAgentExecutableNowTools === 0 &&
    report.booleans?.noSupabaseQueueWriteByProof === true &&
    report.booleans?.noLiveQueueWriteByProof === true &&
    report.booleans?.noWorkerEnqueueByProof === true &&
    report.booleans?.noWorkerDispatchByProof === true &&
    report.booleans?.noToolExecutionByProof === true &&
    report.booleans?.nextGateRequiresNonProductionServiceRoleQueueWriteSmoke === true &&
    report.booleans?.gpuRuntimeShouldStartNow === false &&
    rows.length === 21 &&
    preflightTools.every((toolId) => {
      const row = rows.find((candidate) => candidate.toolId === toolId)
      return row?.liveAdapterInvocationQueueWriteProofStatus ===
        'live_adapter_invocation_queue_write_proof_passed_mock_queue_validated_execution_blocked' &&
        row.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence === true &&
        row.liveAdapterInvocationQueueWriteProofEvidence != null &&
        row.serviceRoleQueueWriteSmokeRequired === true &&
        row.liveQueueWriteApprovedNow === false &&
        row.workerClaimApprovedNow === false &&
        row.workerDispatchApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightStatus {
  if (preflightTools.includes(input.toolId)) {
    return input.sourceAccepted &&
      input.source?.liveAdapterInvocationQueueWriteProofEvidence != null
      ? 'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked'
      : 'non_production_service_role_queue_write_smoke_preflight_blocked_missing_live_adapter_queue_write_proof'
  }
  if (input.toolId === 'satori') {
    return 'non_production_service_role_queue_write_smoke_preflight_blocked_pending_satori_font_fixture'
  }
  return 'non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary'
}

function blockerFor(
  status:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightStatus,
): string {
  switch (status) {
    case 'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked':
      return 'non-production service-role queue-write smoke preflight is ready; actual smoke, worker claim, worker dispatch, and tool execution remain blocked until a saved smoke result is accepted'
    case 'non_production_service_role_queue_write_smoke_preflight_blocked_pending_satori_font_fixture':
      return 'blocked pending approved Satori font fixture evidence bridge'
    case 'non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary':
      return 'deferred to browser/canvas/WebGL, animation, or GPU/model runtime boundary lanes'
    case 'non_production_service_role_queue_write_smoke_preflight_blocked_missing_live_adapter_queue_write_proof':
      return 'missing accepted CPU/static live-adapter queue-service proof'
  }
}

function contractFor(
  status:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightStatus,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightContract | null {
  if (status !== 'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked') {
    return null
  }
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    smokeMode: 'non_production_service_role_queue_write_smoke_preflight_only',
    requiredEnvironment: [
      'REEDITPRO_CONFIRM_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE=true',
      'REEDITPRO_AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_SERVICE_ROLE_QUEUE_WRITE_SMOKE_ENV=non_production',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'E2E_RUNTIME_MODE=local',
      'WORKER_RUNTIME_MODE=mock',
    ],
    requiredFlags: [
      '--execute-ai-graphics-external-agent-cpu-static-service-role-queue-write-smoke',
      '--workspace-id',
      '--project-id',
      '--approved-plan-snapshot-id',
      '--credit-reservation-id',
      '--idempotency-prefix',
      '--source-live-adapter-queue-write-proof-packet',
      '--service-role-boundary-ref',
      '--telemetry-ref',
      '--cleanup-proof-ref',
      '--rollback-ref',
    ],
    requiredSourceProofDecision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_LIVE_ADAPTER_INVOCATION_QUEUE_WRITE_PROOF_DECISION,
    requiredSourceProofStatus:
      'external_agent_cpu_static_private_worker_live_adapter_invocation_queue_write_proof_passed_five_mock_queue_validated_execution_blocked',
    expectedSmokeResultStatus:
      'non_production_service_role_queue_write_smoke_passed_with_cleanup_no_worker_dispatch_or_tool_execution',
    expectedQueueRowsBeforeCleanup: 5,
    expectedQueueRowsAfterCleanup: 0,
    expectedWorkerClaimsNow: 0,
    expectedWorkerDispatchesNow: 0,
    expectedToolExecutionsNow: 0,
    expectedGpuRuntimeStartsNow: 0,
    privateArtifactOnly: true,
    savedResultRequiredBeforeExecutionGateCanAdvance: true,
  }
}

function evidenceFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow
  status:
    AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightEvidence | null {
  const sourceEvidence = input.source?.liveAdapterInvocationQueueWriteProofEvidence
  if (
    input.status !==
      'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked' ||
    !sourceEvidence
  ) {
    return null
  }
  const base =
    `ai-graphics/external-agent/cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight/${input.toolId}`
  return {
    sourceLiveAdapterQueueWriteProofRef:
      `private://ai-graphics/external-agent/cpu-static-private-worker-live-adapter-invocation-queue-write-proof/${input.toolId}/report.json`,
    sourceLocalAdapterInvocationProofRef:
      sourceEvidence.localAdapterInvocationProofRef,
    sourceMockQueueWriteProofRef:
      sourceEvidence.mockQueueWriteProofRef,
    sourceAdapterInvocationEnvelopeRef:
      sourceEvidence.sourceAdapterInvocationEnvelopeRef,
    sourceWorkerEnqueuePayloadRef:
      sourceEvidence.sourceWorkerEnqueuePayloadRef,
    sourceBackendQueueAdapterRef:
      sourceEvidence.sourceBackendQueueAdapterRef,
    sourceServiceRoleBoundaryRef:
      sourceEvidence.sourceServiceRoleBoundaryRef,
    privateArtifactManifestRef:
      sourceEvidence.privateArtifactManifestRef,
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    nonProductionServiceRoleBoundaryRef:
      `service-role-boundary://${base}/non-production-boundary`,
    smokeTelemetryRef:
      `private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/${input.toolId}/telemetry.json`,
    smokeCleanupProofRef:
      `private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/${input.toolId}/cleanup.json`,
    smokeRollbackRef:
      `private://ai-graphics/external-agent/cpu-static-service-role-queue-write-smoke/${input.toolId}/rollback.json`,
    expectedOutputVisibility: 'private_artifact_only',
  }
}

function buildRow(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerLiveAdapterInvocationQueueWriteProofRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow {
  const status = statusFor(input)
  const ready =
    status === 'non_production_service_role_queue_write_smoke_preflight_ready_execution_blocked'
  const evidence = evidenceFor({
    toolId: input.toolId,
    source: input.source,
    status,
  })
  return {
    toolId: input.toolId,
    productionToolId:
      input.source?.productionToolId ?? (`ai_graphics_${input.toolId}` as ProductionToolId),
    workerType: input.source?.workerType ?? 'tool_readiness_worker',
    runtimeTarget: input.source?.runtimeTarget ?? 'deferred',
    capabilityId: input.source?.capabilityId ?? null,
    queueName: ready ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
    sourceLiveAdapterQueueWriteProofStatus:
      input.source?.liveAdapterInvocationQueueWriteProofStatus ?? null,
    sourceLiveAdapterQueueWriteProofAccepted:
      input.source?.externalAgentLiveAdapterInvocationQueueWriteProofPassedWithProvidedEvidence === true &&
      input.source.liveAdapterInvocationQueueWriteProofEvidence != null,
    nonProductionServiceRoleQueueWriteSmokePreflightStatus: status,
    nonProductionServiceRoleQueueWriteSmokePreflightReady: ready,
    preflightContract: contractFor(status),
    preflightEvidence: evidence,
    approvedPlanSnapshotRequired: true,
    creditReservationRequired: true,
    privateArtifactManifestRequired: true,
    backendQueueTransportProofRequired: true,
    serviceRoleCredentialsServerOnly: true,
    nonProductionEnvironmentRequired: true,
    explicitOperatorConfirmationRequired: true,
    cleanupRequired: true,
    rollbackRequired: true,
    telemetryRequired: true,
    savedSmokeResultRequired: true,
    privateArtifactOnly: true,
    publicArtifactAllowed: false,
    signedUrlAllowed: false,
    externalAgentCanInvokeAdapterNow: false,
    externalAgentCanSubmitPrivateWorkerQueueNow: false,
    backendQueueSubmissionApprovedNow: false,
    serviceRoleQueueWriteSmokeApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerClaimApprovedNow: false,
    workerDispatchApprovedNow: false,
    workerExecutionApprovedNow: false,
    toolExecutionApprovedNow: false,
    agentCanExecuteToolsNow: false,
    routeExecutionApprovedNow: false,
    providerRuntimeApprovedNow: false,
    browserWebglCanvasRuntimeApprovedNow: false,
    gpuRuntimeApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
    runtimeReadyNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    blocker: blockerFor(status),
    nextProofMilestone: ready
      ? 'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF'
      : input.toolId === 'satori'
        ? 'AI_GRAPHICS_SATORI_FONT_FIXTURE_EVIDENCE_BRIDGE'
        : 'AI_GRAPHICS_BROWSER_GPU_MODEL_RUNTIME_EXECUTION_ADMISSION',
  }
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflight(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightReport {
  const accepted = sourceAccepted(input.sourceLiveAdapterQueueWriteProofReport)
  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
    buildRow({
      toolId,
      source: sourceRow(input.sourceLiveAdapterQueueWriteProofReport, toolId),
      sourceAccepted: accepted,
    }),
  )
  const count = (
    predicate: (row: AiGraphicsExternalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightRow) => boolean,
  ) => rows.filter(predicate).length
  const readyCount = count(
    (row) => row.nonProductionServiceRoleQueueWriteSmokePreflightReady,
  )
  const satoriBlockedPendingApprovedFontFixtureTools = count(
    (row) =>
      row.nonProductionServiceRoleQueueWriteSmokePreflightStatus ===
      'non_production_service_role_queue_write_smoke_preflight_blocked_pending_satori_font_fixture',
  )
  const nonCpuStaticDeferredTools = count(
    (row) =>
      row.nonProductionServiceRoleQueueWriteSmokePreflightStatus ===
      'non_production_service_role_queue_write_smoke_preflight_deferred_non_cpu_static_runtime_boundary',
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PREFLIGHT_DECISION,
    status:
      'external_agent_cpu_static_private_worker_non_production_service_role_queue_write_smoke_preflight_prepared_five_execution_blocked',
    sourceLiveAdapterQueueWriteProofDecision:
      input.sourceLiveAdapterQueueWriteProofReport?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    smokePreflightPolicy: {
      mode: 'prepare_non_production_service_role_queue_write_smoke_without_running_it',
      sourceLiveAdapterQueueWriteProofRequired: true,
      exactFiveCpuStaticToolsOnly: true,
      serverOnlyServiceRoleCredentialsRequired: true,
      nonProductionEnvironmentRequired: true,
      explicitOperatorConfirmationRequired: true,
      savedSmokeResultRequiredBeforeExecutionGateCanAdvance: true,
      cleanupRequired: true,
      rollbackRequired: true,
      telemetryRequired: true,
      noSupabaseQueueWriteByPreflight: true,
      noLiveQueueWriteByPreflight: true,
      noWorkerClaimByPreflight: true,
      noWorkerDispatchByPreflight: true,
      noToolExecutionByPreflight: true,
      privateArtifactOnly: true,
      gpuRuntimeOnDemandOnly: true,
    },
    counts: {
      totalAiGraphicsTools: 21,
      sourceLiveAdapterQueueWriteProofAcceptedTools:
        count((row) => row.sourceLiveAdapterQueueWriteProofAccepted),
      nonProductionServiceRoleQueueWriteSmokePreflightReadyTools:
        readyCount,
      nonProductionServiceRoleQueueWriteSmokePreflightReadyWithProvidedEvidenceTools:
        count((row) => Boolean(row.preflightEvidence)),
      satoriBlockedPendingApprovedFontFixtureTools,
      nonCpuStaticDeferredTools,
      serviceRoleQueueWriteSmokeApprovedNowTools: 0,
      liveQueueWriteApprovedNowTools: 0,
      liveQueueWritePerformedNowTools: 0,
      workerClaimApprovedNowTools: 0,
      workerClaimPerformedNowTools: 0,
      workerDispatchApprovedNowTools: 0,
      workerDispatchPerformedNowTools: 0,
      workerExecutionApprovedNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      toolExecutionPerformedNowTools: 0,
      externalAgentExecutableNowTools: 0,
      publicArtifactAllowedTools: 0,
      signedUrlAllowedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticPrivateWorkerNonProductionServiceRoleQueueWriteSmokePreflightPrepared:
        true,
      sourceLiveAdapterQueueWriteProofAccepted: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReady:
        readyCount === 5,
      allFiveCpuStaticNonProductionServiceRoleQueueWriteSmokePreflightsReadyWithProvidedEvidence:
        count((row) => Boolean(row.preflightEvidence)) === 5,
      satoriBlockedPendingApprovedFontFixture:
        satoriBlockedPendingApprovedFontFixtureTools === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuStaticDeferredTools === 15,
      serverOnlyServiceRoleCredentialsRequired: true,
      nonProductionEnvironmentRequired: true,
      explicitOperatorConfirmationRequired: true,
      savedSmokeResultRequiredBeforeExecutionGateCanAdvance: true,
      cleanupRequired: true,
      rollbackRequired: true,
      telemetryRequired: true,
      privateArtifactOnlyPolicyAccepted: true,
      noSupabaseQueueWriteByPreflight: true,
      noLiveQueueWriteByPreflight: true,
      noWorkerClaimByPreflight: true,
      noWorkerDispatchByPreflight: true,
      noToolExecutionByPreflight: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanInvokeAdapterNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueWriteSmokeApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
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
      serviceRoleQueueWriteSmokePerformed: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWritePerformed: false,
      workerEnqueuePerformed: false,
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      toolExecutionPerformed: false,
      routeExecutionPerformed: false,
      workerExecutionPerformed: false,
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
    safeCommandsBeforeSmoke: [
      'npm run ai-graphics:external-agent-cpu-static-private-worker-live-adapter-invocation-queue-write-proof:diagnostics',
      'npm run ai-graphics:external-agent-cpu-static-private-worker-non-production-service-role-queue-write-smoke-preflight:diagnostics',
    ],
    futureSmokeResultRequirements: [
      'explicit non-production operator confirmation',
      'server-only Supabase service-role credentials',
      'exact five CPU/static queue rows written for the accepted private-worker queue payloads',
      'zero persisted fixture rows after cleanup',
      'no worker dispatch, tool execution, provider/model execution, browser/WebGL/canvas runtime, GPU runtime, signed URL, or public artifact',
      'saved private evidence, telemetry, cleanup, and rollback refs',
    ],
    nextMilestone:
      'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_NON_PRODUCTION_SERVICE_ROLE_QUEUE_WRITE_SMOKE_PROOF',
  }
}
