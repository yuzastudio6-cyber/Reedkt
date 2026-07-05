import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_DECISION,
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_TOOL_IDS,
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_BLOCKED_TOOL_IDS,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-handoff-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_queue_dry_admission_prepared_with_runtime_blocks'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME =
  'ai_graphics_external_agent_cpu_static_private_worker_queue'

const AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS =
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
    (capabilityId) =>
      capabilityId !== 'planning_metadata_only' &&
      capabilityId !== 'blocked_or_deferred',
  )

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionStatus =
  | 'private_worker_queue_dry_admission_prepared_execution_blocked'
  | 'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture'
  | 'private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary'
  | 'private_worker_queue_dry_admission_blocked_missing_handoff_admission'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionInput {
  sourceHandoffDecision?: string
  sourceHandoffStatus?: string
  sourceHandoffRows?: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow[]
  sourcePrivateWorkerHandoffAdmissionPreparedTools?: number
  sourceCpuStaticPrivateWorkerHandoffBlockedTools?: number
  sourceSatoriBlockedPendingApprovedFontFixtureTools?: number
  sourceNonCpuStaticDeferredTools?: number
  sourceExternalAgentCanRequestPrivateWorkerHandoffNowTools?: number
  sourceWorkerEnqueueApprovedNowTools?: number
  sourceWorkerDispatchApprovedNowTools?: number
  sourceToolExecutionApprovedNowTools?: number
  sourceGpuRuntimeShouldStartNowTools?: number
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerQueuePayloadContract {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  queueTransportMode: 'dry_contract_only_no_backend_write'
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  idempotencyKey: string
  requestTraceRef: string
  workerCheckbackPolicyRef: string
  workerFallbackPolicyRef: string
  workerQaGateRef: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  workItemKind:
    | 'ai_graphics_cpu_static_private_worker_queue_dry_admission'
    | 'ai_graphics_cpu_static_private_worker_queue_blocked'
    | 'ai_graphics_runtime_deferred_private_worker_queue'
  dryAdmissionStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionStatus
  sourceHandoffAdmissionStatus: string | null
  sourcePrivateWorkerHandoffAdmissionPrepared: boolean
  sourcePrivateArtifactManifestRef: string | null
  privateWorkerQueueDryAdmissionPrepared: boolean
  dryQueuePayloadContractPrepared: boolean
  queuePayloadContract: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueuePayloadContract | null
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  toolRouteApprovalRequired: true
  workerApprovalRequired: true
  workerQueueTransportProofRequired: true
  workerClaimLeaseRequired: true
  checkbackPolicyRequired: true
  fallbackPolicyRequired: true
  qaGateRequired: true
  privateArtifactOnly: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  externalAgentCanSubmitPrivateWorkerQueueNow: false
  externalAgentCanRequestPrivateWorkerHandoffNow: false
  externalAgentCanInvokeAdapterNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  backendQueueSubmissionApprovedNow: false
  liveQueueWriteApprovedNow: false
  workerExecutionApprovedNow: false
  workerEnqueueApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-queue-dry-admission'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION_DECISION
  status: 'external_agent_cpu_static_private_worker_queue_dry_admission_prepared_five_dry_admitted_one_blocked_execution_blocked'
  sourceHandoffDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  dryAdmissionPolicy: {
    temporaryRuntimeBlock: true
    mode: 'prepare_private_worker_queue_payloads_without_backend_write'
    requiredBeforeAnyLiveQueueSubmission: string[]
  }
  counts: {
    totalAiGraphicsTools: 21
    privateWorkerQueueDryAdmissionPreparedTools: number
    cpuStaticPrivateWorkerQueueDryReadyTools: number
    cpuStaticPrivateWorkerQueueDryBlockedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    dryQueuePayloadContractsPreparedTools: number
    externalAgentCanSubmitPrivateWorkerQueueNowTools: 0
    externalAgentCanRequestPrivateWorkerHandoffNowTools: 0
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentExecutableNowTools: 0
    backendQueueSubmissionApprovedNowTools: 0
    liveQueueWriteApprovedNowTools: 0
    workerEnqueueApprovedNowTools: 0
    workerDispatchApprovedNowTools: 0
    toolExecutionApprovedNowTools: 0
    publicArtifactAllowedTools: 0
    signedUrlAllowedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerQueueDryAdmissionPrepared: true
    sourcePrivateWorkerHandoffAdmissionAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    fiveCpuStaticPrivateWorkerQueueDryAdmissionsPrepared: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    nonCpuStaticToolsDeferredByRuntimeBoundary: boolean
    dryQueuePayloadContractsPreparedForAdmittedTools: boolean
    approvedPlanSnapshotFixtureRefsPrepared: boolean
    creditReservationFixtureRefsPrepared: boolean
    privateArtifactManifestRefsInheritedFromHandoff: boolean
    privateArtifactOnlyPolicyAccepted: true
    queueTransportProofRequired: true
    workerClaimLeaseRequired: true
    workerCheckbackPolicyRequired: true
    workerFallbackPolicyRequired: true
    workerQaGateRequired: true
    unblockPolicyDefined: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanSubmitPrivateWorkerQueueNow: false
    externalAgentCanRequestPrivateWorkerHandoffNow: false
    externalAgentCanInvokeAdapterNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerExecutionApprovedNow: false
    workerEnqueueApprovedNow: false
    workerDispatchApprovedNow: false
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
    backendQueueSubmissionPerformed: false
    liveQueueWritePerformed: false
    workerEnqueuePerformed: false
    workerDispatchPerformed: false
    toolExecutionPerformed: false
    routeExecutionPerformed: false
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
  nextMilestone: string
}

const requiredBeforeAnyLiveQueueSubmission = [
  'approved plan snapshot record persisted by backend',
  'approved credit reservation record persisted by backend',
  'Tool Route admission approval for the exact tool request',
  'Worker admission approval for the exact tool request',
  'private artifact manifest writer and retention policy',
  'backend queue transport proof',
  'worker claim and lease proof',
  'idempotency and retry policy',
  'checkback policy',
  'fallback policy',
  'tool-specific QA gate',
  'per-tool runtime proof for browser/GPU/model targets when applicable',
]

function sourceRow(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionInput,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow | undefined {
  return input.sourceHandoffRows?.find((row) => row.toolId === toolId)
}

function sourceHandoffAccepted(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionInput,
): boolean {
  const rows = input.sourceHandoffRows ?? []
  const readyRowsAccepted =
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_TOOL_IDS.every(
      (toolId) => {
        const row = rows.find((source) => source.toolId === toolId)
        return row?.admissionStatus ===
          'private_worker_handoff_admission_prepared_execution_blocked' &&
          row.privateWorkerHandoffAdmissionPrepared === true &&
          row.privateOutputManifestContractPrepared === true &&
          typeof row.privateArtifactManifestRef === 'string' &&
          row.privateArtifactManifestRef.startsWith('private://') &&
          row.externalAgentCanRequestPrivateWorkerHandoffNow === false &&
          row.workerEnqueueApprovedNow === false &&
          row.workerDispatchApprovedNow === false &&
          row.toolExecutionApprovedNow === false &&
          row.gpuRuntimeShouldStartNow === false
      },
    )
  const satori = rows.find((row) => row.toolId === 'satori')

  return input.sourceHandoffDecision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_DECISION &&
    input.sourceHandoffStatus ===
      'external_agent_cpu_static_private_worker_handoff_admission_prepared_five_admitted_one_blocked_execution_blocked' &&
    rows.length === 21 &&
    input.sourcePrivateWorkerHandoffAdmissionPreparedTools === 5 &&
    input.sourceCpuStaticPrivateWorkerHandoffBlockedTools === 1 &&
    input.sourceSatoriBlockedPendingApprovedFontFixtureTools === 1 &&
    input.sourceNonCpuStaticDeferredTools === 15 &&
    input.sourceExternalAgentCanRequestPrivateWorkerHandoffNowTools === 0 &&
    input.sourceWorkerEnqueueApprovedNowTools === 0 &&
    input.sourceWorkerDispatchApprovedNowTools === 0 &&
    input.sourceToolExecutionApprovedNowTools === 0 &&
    input.sourceGpuRuntimeShouldStartNowTools === 0 &&
    readyRowsAccepted &&
    satori?.admissionStatus ===
      'private_worker_handoff_blocked_pending_satori_font_fixture' &&
    satori.privateWorkerHandoffAdmissionPrepared === false
}

function isDryAdmittedTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return (
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_ADMISSION_TOOL_IDS as readonly AiGraphicsCanonicalToolId[]
  ).includes(toolId)
}

function isSatoriBlockedTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return (
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_HANDOFF_BLOCKED_TOOL_IDS as readonly AiGraphicsCanonicalToolId[]
  ).includes(toolId)
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionStatus {
  if (isDryAdmittedTool(input.toolId)) {
    if (
      input.sourceAccepted &&
      input.source?.privateWorkerHandoffAdmissionPrepared === true &&
      typeof input.source.privateArtifactManifestRef === 'string'
    ) {
      return 'private_worker_queue_dry_admission_prepared_execution_blocked'
    }
    return 'private_worker_queue_dry_admission_blocked_missing_handoff_admission'
  }

  if (isSatoriBlockedTool(input.toolId)) {
    return 'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture'
  }

  return 'private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary'
}

function workItemKindFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionStatus,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow['workItemKind'] {
  if (status === 'private_worker_queue_dry_admission_prepared_execution_blocked') {
    return 'ai_graphics_cpu_static_private_worker_queue_dry_admission'
  }
  if (
    status === 'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture' ||
    status === 'private_worker_queue_dry_admission_blocked_missing_handoff_admission'
  ) {
    return 'ai_graphics_cpu_static_private_worker_queue_blocked'
  }
  return 'ai_graphics_runtime_deferred_private_worker_queue'
}

function queuePayloadContractFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerHandoffAdmissionRow
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerQueuePayloadContract | null {
  if (input.status !== 'private_worker_queue_dry_admission_prepared_execution_blocked') {
    return null
  }
  if (!input.source?.privateArtifactManifestRef) {
    return null
  }
  const base = `ai-graphics/external-agent/cpu-static-private-worker-queue-dry-admission/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    queueTransportMode: 'dry_contract_only_no_backend_write',
    approvedPlanSnapshotRef: `approved-plan-snapshot://${base}/snapshot-fixture`,
    creditReservationRef: `credit-reservation://${base}/reservation-fixture`,
    privateArtifactManifestRef: input.source.privateArtifactManifestRef,
    idempotencyKey:
      `ai-graphics:external-agent:cpu-static-private-worker-queue-dry-admission:${input.toolId}:approved-plan-snapshot-fixture:credit-reservation-fixture`,
    requestTraceRef: `trace://${base}/request-trace-fixture`,
    workerCheckbackPolicyRef: `policy://${base}/checkback-fixture`,
    workerFallbackPolicyRef: `policy://${base}/fallback-fixture`,
    workerQaGateRef: `policy://${base}/qa-gate-fixture`,
    expectedOutputVisibility: 'private_artifact_only',
  }
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionStatus,
): string {
  if (status === 'private_worker_queue_dry_admission_prepared_execution_blocked') {
    return 'private worker queue dry-admission payload is prepared, but external-agent queue submission, backend queue write, worker enqueue, worker dispatch, and tool execution remain blocked until the exact execution gates pass'
  }
  if (status === 'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture') {
    return 'Satori remains blocked pending approved font fixture proof for text SVG layout before private worker queue dry admission'
  }
  if (status === 'private_worker_queue_dry_admission_blocked_missing_handoff_admission') {
    return 'private worker handoff admission evidence is missing or incompatible for this CPU/static tool'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker queue admission'
}

function nextProofMilestoneFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionStatus,
): string {
  if (status === 'private_worker_queue_dry_admission_prepared_execution_blocked') {
    return 'controlled private worker claim dry proof for the dry-admitted CPU/static queue payload, still without live queue write, worker dispatch, or tool execution'
  }
  if (status === 'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture') {
    return 'approved Satori font fixture proof before private worker queue dry admission'
  }
  if (status === 'private_worker_queue_dry_admission_blocked_missing_handoff_admission') {
    return 'repair private worker handoff admission evidence for this CPU/static tool'
  }
  return 'future runtime proof and queue admission for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmission(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionReport {
  const sourceAccepted = sourceHandoffAccepted(input)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const source = sourceRow(input, toolId)
    if (
      !source ||
      !source.productionToolId ||
      !source.workerType ||
      !source.runtimeTarget
    ) {
      throw new Error(`Missing AI graphics queue dry-admission source row for ${toolId}`)
    }

    const dryAdmissionStatus = statusFor({ toolId, source, sourceAccepted })
    const dryAdmissionPrepared =
      dryAdmissionStatus === 'private_worker_queue_dry_admission_prepared_execution_blocked'
    const queuePayloadContract = queuePayloadContractFor({
      toolId,
      source,
      status: dryAdmissionStatus,
    })

    return {
      toolId,
      productionToolId: source.productionToolId,
      workerType: source.workerType,
      runtimeTarget: source.runtimeTarget,
      queueName: dryAdmissionPrepared
        ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
        : null,
      workItemKind: workItemKindFor(dryAdmissionStatus),
      dryAdmissionStatus,
      sourceHandoffAdmissionStatus: source.admissionStatus,
      sourcePrivateWorkerHandoffAdmissionPrepared:
        source.privateWorkerHandoffAdmissionPrepared === true,
      sourcePrivateArtifactManifestRef: source.privateArtifactManifestRef,
      privateWorkerQueueDryAdmissionPrepared: dryAdmissionPrepared,
      dryQueuePayloadContractPrepared: queuePayloadContract !== null,
      queuePayloadContract,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      toolRouteApprovalRequired: true,
      workerApprovalRequired: true,
      workerQueueTransportProofRequired: true,
      workerClaimLeaseRequired: true,
      checkbackPolicyRequired: true,
      fallbackPolicyRequired: true,
      qaGateRequired: true,
      privateArtifactOnly: true,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
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
      blocker: blockerFor(dryAdmissionStatus),
      nextProofMilestone: nextProofMilestoneFor(dryAdmissionStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow
  })

  const dryAdmissionRows = rows.filter(
    (row) => row.privateWorkerQueueDryAdmissionPrepared,
  )
  const satoriBlockedRows = rows.filter(
    (row) =>
      row.dryAdmissionStatus ===
      'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) =>
      row.dryAdmissionStatus ===
      'private_worker_queue_dry_admission_deferred_non_cpu_static_runtime_boundary',
  )
  const cpuStaticBlockedRows = rows.filter(
    (row) =>
      row.dryAdmissionStatus ===
        'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture' ||
      row.dryAdmissionStatus ===
        'private_worker_queue_dry_admission_blocked_missing_handoff_admission',
  )
  const dryPayloadRows = rows.filter((row) => row.dryQueuePayloadContractPrepared)

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-queue-dry-admission',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION_DECISION,
    status:
      'external_agent_cpu_static_private_worker_queue_dry_admission_prepared_five_dry_admitted_one_blocked_execution_blocked',
    sourceHandoffDecision: input.sourceHandoffDecision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    dryAdmissionPolicy: {
      temporaryRuntimeBlock: true,
      mode: 'prepare_private_worker_queue_payloads_without_backend_write',
      requiredBeforeAnyLiveQueueSubmission,
    },
    counts: {
      totalAiGraphicsTools: 21,
      privateWorkerQueueDryAdmissionPreparedTools: dryAdmissionRows.length,
      cpuStaticPrivateWorkerQueueDryReadyTools: dryAdmissionRows.length,
      cpuStaticPrivateWorkerQueueDryBlockedTools: cpuStaticBlockedRows.length,
      satoriBlockedPendingApprovedFontFixtureTools: satoriBlockedRows.length,
      nonCpuStaticDeferredTools: nonCpuRows.length,
      dryQueuePayloadContractsPreparedTools: dryPayloadRows.length,
      externalAgentCanSubmitPrivateWorkerQueueNowTools: 0,
      externalAgentCanRequestPrivateWorkerHandoffNowTools: 0,
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentExecutableNowTools: 0,
      backendQueueSubmissionApprovedNowTools: 0,
      liveQueueWriteApprovedNowTools: 0,
      workerEnqueueApprovedNowTools: 0,
      workerDispatchApprovedNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      publicArtifactAllowedTools: 0,
      signedUrlAllowedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticPrivateWorkerQueueDryAdmissionPrepared: true,
      sourcePrivateWorkerHandoffAdmissionAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      fiveCpuStaticPrivateWorkerQueueDryAdmissionsPrepared:
        dryAdmissionRows.length === 5,
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      nonCpuStaticToolsDeferredByRuntimeBoundary: nonCpuRows.length === 15,
      dryQueuePayloadContractsPreparedForAdmittedTools:
        dryAdmissionRows.length === 5 &&
        dryAdmissionRows.every((row) => row.dryQueuePayloadContractPrepared),
      approvedPlanSnapshotFixtureRefsPrepared:
        dryAdmissionRows.length === 5 &&
        dryAdmissionRows.every((row) =>
          row.queuePayloadContract?.approvedPlanSnapshotRef.startsWith(
            'approved-plan-snapshot://',
          ),
        ),
      creditReservationFixtureRefsPrepared:
        dryAdmissionRows.length === 5 &&
        dryAdmissionRows.every((row) =>
          row.queuePayloadContract?.creditReservationRef.startsWith(
            'credit-reservation://',
          ),
        ),
      privateArtifactManifestRefsInheritedFromHandoff:
        dryAdmissionRows.length === 5 &&
        dryAdmissionRows.every(
          (row) =>
            row.queuePayloadContract?.privateArtifactManifestRef ===
              row.sourcePrivateArtifactManifestRef &&
            row.sourcePrivateArtifactManifestRef?.startsWith('private://'),
        ),
      privateArtifactOnlyPolicyAccepted: true,
      queueTransportProofRequired: true,
      workerClaimLeaseRequired: true,
      workerCheckbackPolicyRequired: true,
      workerFallbackPolicyRequired: true,
      workerQaGateRequired: true,
      unblockPolicyDefined: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
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
    nextMilestone:
      'controlled private worker claim dry proof for the five dry-admitted CPU/static queue payloads, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred',
  }
}
