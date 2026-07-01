import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-claim-dry-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_DRY_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_with_runtime_blocks'

const AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS =
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
    (capabilityId) =>
      capabilityId !== 'planning_metadata_only' &&
      capabilityId !== 'blocked_or_deferred',
  )

const dryDispatchLeaseSeconds = 900

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofStatus =
  | 'private_worker_dispatch_dry_proof_prepared_execution_blocked'
  | 'private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture'
  | 'private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary'
  | 'private_worker_dispatch_dry_proof_blocked_missing_claim_dry_proof'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofInput {
  sourceClaimDryProofDecision?: string
  sourceClaimDryProofStatus?: string
  sourceClaimDryProofRows?: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow[]
  sourcePrivateWorkerClaimDryProofPreparedTools?: number
  sourceCpuStaticPrivateWorkerClaimDryReadyTools?: number
  sourceCpuStaticPrivateWorkerClaimDryBlockedTools?: number
  sourceSatoriBlockedPendingApprovedFontFixtureTools?: number
  sourceNonCpuStaticDeferredTools?: number
  sourceDryWorkerClaimEnvelopesPreparedTools?: number
  sourceExternalAgentCanClaimPrivateWorkerJobNowTools?: number
  sourceExternalAgentCanSubmitPrivateWorkerQueueNowTools?: number
  sourceBackendQueueSubmissionApprovedNowTools?: number
  sourceLiveQueueWriteApprovedNowTools?: number
  sourceWorkerClaimApprovedNowTools?: number
  sourceWorkerEnqueueApprovedNowTools?: number
  sourceWorkerDispatchApprovedNowTools?: number
  sourceToolExecutionApprovedNowTools?: number
  sourceGpuRuntimeShouldStartNowTools?: number
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDryDispatchContract {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  dispatchTransportMode: 'dry_contract_only_no_worker_dispatch'
  dryDispatchLeaseSeconds: typeof dryDispatchLeaseSeconds
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  queuePayloadIdempotencyKey: string
  dryDispatchIdempotencyKey: string
  requestTraceRef: string
  workerDispatchAttemptRef: string
  workerCheckbackPolicyRef: string
  workerFallbackPolicyRef: string
  workerQaGateRef: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  workItemKind:
    | 'ai_graphics_cpu_static_private_worker_dispatch_dry_proof'
    | 'ai_graphics_cpu_static_private_worker_dispatch_blocked'
    | 'ai_graphics_runtime_deferred_private_worker_dispatch'
  dispatchDryProofStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofStatus
  sourceClaimDryProofStatus: string | null
  sourcePrivateWorkerClaimDryProofPrepared: boolean
  sourceDryQueuePayloadContractPrepared: boolean
  sourceQueuePayloadIdempotencyKey: string | null
  sourcePrivateArtifactManifestRef: string | null
  dryWorkerDispatchProofPrepared: boolean
  dryWorkerDispatchEnvelopePrepared: boolean
  dryDispatchContract: AiGraphicsExternalAgentCpuStaticPrivateWorkerDryDispatchContract | null
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  toolRouteApprovalRequired: true
  workerApprovalRequired: true
  backendQueueTransportProofRequired: true
  workerClaimLeaseRequired: true
  idempotencyRequired: true
  checkbackPolicyRequired: true
  fallbackPolicyRequired: true
  qaGateRequired: true
  privateArtifactOnly: true
  publicArtifactAllowed: false
  signedUrlAllowed: false
  externalAgentCanDispatchPrivateWorkerJobNow: false
  externalAgentCanSubmitPrivateWorkerQueueNow: false
  externalAgentCanRequestPrivateWorkerHandoffNow: false
  externalAgentCanInvokeAdapterNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  backendQueueSubmissionApprovedNow: false
  liveQueueWriteApprovedNow: false
  workerClaimApprovedNow: false
  workerDispatchApprovedNow: false
  workerExecutionApprovedNow: false
  workerEnqueueApprovedNow: false
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-dispatch-dry-proof'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_DRY_PROOF_DECISION
  status: 'external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_five_dispatchable_one_blocked_execution_blocked'
  sourceClaimDryProofDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  dryDispatchPolicy: {
    temporaryRuntimeBlock: true
    mode: 'prepare_private_worker_dispatch_envelopes_without_worker_dispatch_or_tool_execution'
    dryDispatchLeaseSeconds: typeof dryDispatchLeaseSeconds
    requiredBeforeAnyLiveWorkerDispatch: string[]
  }
  counts: {
    totalAiGraphicsTools: 21
    privateWorkerDispatchDryProofPreparedTools: number
    cpuStaticPrivateWorkerDispatchDryReadyTools: number
    cpuStaticPrivateWorkerDispatchDryBlockedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    dryWorkerDispatchEnvelopesPreparedTools: number
    externalAgentCanDispatchPrivateWorkerJobNowTools: 0
    externalAgentCanSubmitPrivateWorkerQueueNowTools: 0
    externalAgentCanRequestPrivateWorkerHandoffNowTools: 0
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentExecutableNowTools: 0
    backendQueueSubmissionApprovedNowTools: 0
    liveQueueWriteApprovedNowTools: 0
    workerClaimApprovedNowTools: 0
    workerDispatchApprovedNowTools: 0
    workerEnqueueApprovedNowTools: 0
    toolExecutionApprovedNowTools: 0
    publicArtifactAllowedTools: 0
    signedUrlAllowedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerDispatchDryProofCompleted: true
    sourceClaimDryProofAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveCpuStaticQueuePayloadsDispatchableDry: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    dryWorkerDispatchEnvelopesPreparedForAdmittedTools: boolean
    approvedPlanSnapshotRefsPreserved: boolean
    creditReservationFixtureRefsPreserved: boolean
    privateArtifactManifestRefsPreserved: boolean
    idempotencyKeysPreserved: boolean
    checkbackPolicyRefsPreserved: boolean
    fallbackPolicyRefsPreserved: boolean
    qaGateRefsPreserved: boolean
    privateArtifactOnlyPolicyAccepted: true
    backendQueueTransportProofRequired: true
    workerClaimLeaseRequired: true
    workerDispatchProofRequired: true
    workerCheckbackPolicyRequired: true
    workerFallbackPolicyRequired: true
    workerQaGateRequired: true
    unblockPolicyDefined: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanDispatchPrivateWorkerJobNow: false
    externalAgentCanSubmitPrivateWorkerQueueNow: false
    externalAgentCanRequestPrivateWorkerHandoffNow: false
    externalAgentCanInvokeAdapterNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerClaimApprovedNow: false
    workerDispatchApprovedNow: false
    workerExecutionApprovedNow: false
    workerEnqueueApprovedNow: false
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
    workerClaimPerformed: false
    workerDispatchPerformed: false
    workerEnqueuePerformed: false
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

const requiredBeforeAnyLiveWorkerDispatch = [
  'approved plan snapshot record persisted by backend',
  'approved credit reservation record persisted by backend',
  'Tool Route admission approval for the exact tool request',
  'Worker admission approval for the exact tool request',
  'private artifact manifest writer and retention policy',
  'backend queue transport proof',
  'live queue write proof',
  'worker claim lease proof',
  'worker dispatch authorization proof',
  'worker dispatch smoke proof',
  'idempotency and retry policy',
  'checkback policy',
  'fallback policy',
  'tool-specific QA gate',
  'per-tool runtime proof for browser/GPU/model targets when applicable',
]

function sourceRow(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofInput,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow | undefined {
  return input.sourceClaimDryProofRows?.find((row) => row.toolId === toolId)
}

function sourceClaimDryProofAccepted(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofInput,
): boolean {
  const rows = input.sourceClaimDryProofRows ?? []
  const readyRowsAccepted = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'].every(
    (toolId) => {
      const row = rows.find((source) => source.toolId === toolId)
      return row?.claimDryProofStatus ===
        'private_worker_claim_dry_proof_prepared_execution_blocked' &&
        row.dryWorkerClaimProofPrepared === true &&
        row.dryWorkerClaimEnvelopePrepared === true &&
        row.dryClaimContract?.queueName ===
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
        row.dryClaimContract.claimTransportMode ===
          'dry_contract_only_no_worker_claim' &&
        typeof row.dryClaimContract.approvedPlanSnapshotRef === 'string' &&
        typeof row.dryClaimContract.creditReservationRef === 'string' &&
        typeof row.dryClaimContract.privateArtifactManifestRef === 'string' &&
        typeof row.dryClaimContract.queuePayloadIdempotencyKey === 'string' &&
        typeof row.dryClaimContract.dryClaimIdempotencyKey === 'string' &&
        typeof row.dryClaimContract.workerClaimLeaseRef === 'string' &&
        typeof row.dryClaimContract.workerCheckbackPolicyRef === 'string' &&
        typeof row.dryClaimContract.workerFallbackPolicyRef === 'string' &&
        typeof row.dryClaimContract.workerQaGateRef === 'string' &&
        row.externalAgentCanClaimPrivateWorkerJobNow === false &&
        row.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
        row.liveQueueWriteApprovedNow === false &&
        row.workerClaimApprovedNow === false &&
        row.workerEnqueueApprovedNow === false &&
        row.workerDispatchApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    },
  )
  const satori = rows.find((row) => row.toolId === 'satori')

  return input.sourceClaimDryProofDecision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF_DECISION &&
    input.sourceClaimDryProofStatus ===
      'external_agent_cpu_static_private_worker_claim_dry_proof_prepared_five_claimable_one_blocked_execution_blocked' &&
    rows.length === 21 &&
    input.sourcePrivateWorkerClaimDryProofPreparedTools === 5 &&
    input.sourceCpuStaticPrivateWorkerClaimDryReadyTools === 5 &&
    input.sourceCpuStaticPrivateWorkerClaimDryBlockedTools === 1 &&
    input.sourceSatoriBlockedPendingApprovedFontFixtureTools === 1 &&
    input.sourceNonCpuStaticDeferredTools === 15 &&
    input.sourceDryWorkerClaimEnvelopesPreparedTools === 5 &&
    input.sourceExternalAgentCanClaimPrivateWorkerJobNowTools === 0 &&
    input.sourceExternalAgentCanSubmitPrivateWorkerQueueNowTools === 0 &&
    input.sourceBackendQueueSubmissionApprovedNowTools === 0 &&
    input.sourceLiveQueueWriteApprovedNowTools === 0 &&
    input.sourceWorkerClaimApprovedNowTools === 0 &&
    input.sourceWorkerEnqueueApprovedNowTools === 0 &&
    input.sourceWorkerDispatchApprovedNowTools === 0 &&
    input.sourceToolExecutionApprovedNowTools === 0 &&
    input.sourceGpuRuntimeShouldStartNowTools === 0 &&
    readyRowsAccepted &&
    satori?.claimDryProofStatus ===
      'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture' &&
    satori.dryWorkerClaimProofPrepared === false
}

function isDispatchDryReadyTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'].includes(toolId)
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofStatus {
  if (isDispatchDryReadyTool(input.toolId)) {
    if (
      input.sourceAccepted &&
      input.source?.dryWorkerClaimProofPrepared === true &&
      input.source.dryWorkerClaimEnvelopePrepared === true &&
      input.source.dryClaimContract
    ) {
      return 'private_worker_dispatch_dry_proof_prepared_execution_blocked'
    }
    return 'private_worker_dispatch_dry_proof_blocked_missing_claim_dry_proof'
  }

  if (input.toolId === 'satori') {
    return 'private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture'
  }

  return 'private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary'
}

function workItemKindFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofStatus,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow['workItemKind'] {
  if (status === 'private_worker_dispatch_dry_proof_prepared_execution_blocked') {
    return 'ai_graphics_cpu_static_private_worker_dispatch_dry_proof'
  }
  if (
    status === 'private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture' ||
    status === 'private_worker_dispatch_dry_proof_blocked_missing_claim_dry_proof'
  ) {
    return 'ai_graphics_cpu_static_private_worker_dispatch_blocked'
  }
  return 'ai_graphics_runtime_deferred_private_worker_dispatch'
}

function dryDispatchContractFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerDryDispatchContract | null {
  if (input.status !== 'private_worker_dispatch_dry_proof_prepared_execution_blocked') {
    return null
  }
  const payload = input.source?.dryClaimContract
  if (!payload) return null

  const base = `ai-graphics/external-agent/cpu-static-private-worker-dispatch-dry-proof/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    dispatchTransportMode: 'dry_contract_only_no_worker_dispatch',
    dryDispatchLeaseSeconds,
    approvedPlanSnapshotRef: payload.approvedPlanSnapshotRef,
    creditReservationRef: payload.creditReservationRef,
    privateArtifactManifestRef: payload.privateArtifactManifestRef,
    queuePayloadIdempotencyKey: payload.queuePayloadIdempotencyKey,
    dryDispatchIdempotencyKey:
      `ai-graphics:external-agent:cpu-static-private-worker-dispatch-dry-proof:${input.toolId}:lease-${dryDispatchLeaseSeconds}:dry-only`,
    requestTraceRef: payload.requestTraceRef,
    workerDispatchAttemptRef: `dispatch://${base}/dispatch-attempt-fixture`,
    workerCheckbackPolicyRef: payload.workerCheckbackPolicyRef,
    workerFallbackPolicyRef: payload.workerFallbackPolicyRef,
    workerQaGateRef: payload.workerQaGateRef,
    expectedOutputVisibility: 'private_artifact_only',
  }
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofStatus,
): string {
  if (status === 'private_worker_dispatch_dry_proof_prepared_execution_blocked') {
    return 'private worker dispatch envelope is prepared in dry mode, but external-agent worker dispatch, worker enqueue, tool execution, and runtime remain blocked until live execution gates pass'
  }
  if (status === 'private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture') {
    return 'Satori remains blocked pending approved font fixture proof before private worker dispatch dry proof'
  }
  if (status === 'private_worker_dispatch_dry_proof_blocked_missing_claim_dry_proof') {
    return 'private worker dispatch dry-proof evidence is missing or incompatible for this CPU/static tool'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch proof'
}

function nextProofMilestoneFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofStatus,
): string {
  if (status === 'private_worker_dispatch_dry_proof_prepared_execution_blocked') {
    return 'controlled private worker dispatch smoke proof with provided evidence for the dispatchable CPU/static payload, still without tool execution'
  }
  if (status === 'private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture') {
    return 'approved Satori font fixture proof before private worker queue and dispatch dry proof'
  }
  if (status === 'private_worker_dispatch_dry_proof_blocked_missing_claim_dry_proof') {
    return 'repair private worker dispatch dry-proof evidence for this CPU/static tool'
  }
  return 'future runtime proof and private worker admission for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProof(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofReport {
  const sourceAccepted = sourceClaimDryProofAccepted(input)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const source = sourceRow(input, toolId)
    if (
      !source ||
      !source.productionToolId ||
      !source.workerType ||
      !source.runtimeTarget
    ) {
      throw new Error(`Missing AI graphics dispatch dry-proof source row for ${toolId}`)
    }

    const dispatchDryProofStatus = statusFor({ toolId, source, sourceAccepted })
    const dryDispatchPrepared =
      dispatchDryProofStatus === 'private_worker_dispatch_dry_proof_prepared_execution_blocked'
    const dryDispatchContract = dryDispatchContractFor({
      toolId,
      source,
      status: dispatchDryProofStatus,
    })

    return {
      toolId,
      productionToolId: source.productionToolId,
      workerType: source.workerType,
      runtimeTarget: source.runtimeTarget,
      queueName: dryDispatchPrepared
        ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
        : null,
      workItemKind: workItemKindFor(dispatchDryProofStatus),
      dispatchDryProofStatus,
      sourceClaimDryProofStatus: source.claimDryProofStatus,
      sourcePrivateWorkerClaimDryProofPrepared:
        source.dryWorkerClaimProofPrepared === true,
      sourceDryQueuePayloadContractPrepared:
        source.sourceDryQueuePayloadContractPrepared === true,
      sourceQueuePayloadIdempotencyKey:
        source.dryClaimContract?.queuePayloadIdempotencyKey ?? null,
      sourcePrivateArtifactManifestRef:
        source.dryClaimContract?.privateArtifactManifestRef ?? null,
      dryWorkerDispatchProofPrepared: dryDispatchPrepared,
      dryWorkerDispatchEnvelopePrepared: dryDispatchContract !== null,
      dryDispatchContract,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      toolRouteApprovalRequired: true,
      workerApprovalRequired: true,
      backendQueueTransportProofRequired: true,
      workerClaimLeaseRequired: true,
      idempotencyRequired: true,
      checkbackPolicyRequired: true,
      fallbackPolicyRequired: true,
      qaGateRequired: true,
      privateArtifactOnly: true,
      publicArtifactAllowed: false,
      signedUrlAllowed: false,
      externalAgentCanDispatchPrivateWorkerJobNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      blocker: blockerFor(dispatchDryProofStatus),
      nextProofMilestone: nextProofMilestoneFor(dispatchDryProofStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow
  })

  const dispatchPreparedRows = rows.filter((row) => row.dryWorkerDispatchProofPrepared)
  const satoriBlockedRows = rows.filter(
    (row) =>
      row.dispatchDryProofStatus ===
      'private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) =>
      row.dispatchDryProofStatus ===
      'private_worker_dispatch_dry_proof_deferred_non_cpu_static_runtime_boundary',
  )
  const cpuStaticBlockedRows = rows.filter(
    (row) =>
      row.dispatchDryProofStatus ===
        'private_worker_dispatch_dry_proof_blocked_pending_satori_font_fixture' ||
      row.dispatchDryProofStatus ===
        'private_worker_dispatch_dry_proof_blocked_missing_claim_dry_proof',
  )
  const dryDispatchEnvelopeRows = rows.filter((row) => row.dryWorkerDispatchEnvelopePrepared)

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-dispatch-dry-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_DRY_PROOF_DECISION,
    status:
      'external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_five_dispatchable_one_blocked_execution_blocked',
    sourceClaimDryProofDecision: input.sourceClaimDryProofDecision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    dryDispatchPolicy: {
      temporaryRuntimeBlock: true,
      mode: 'prepare_private_worker_dispatch_envelopes_without_worker_dispatch_or_tool_execution',
      dryDispatchLeaseSeconds,
      requiredBeforeAnyLiveWorkerDispatch,
    },
    counts: {
      totalAiGraphicsTools: 21,
      privateWorkerDispatchDryProofPreparedTools: dispatchPreparedRows.length,
      cpuStaticPrivateWorkerDispatchDryReadyTools: dispatchPreparedRows.length,
      cpuStaticPrivateWorkerDispatchDryBlockedTools: cpuStaticBlockedRows.length,
      satoriBlockedPendingApprovedFontFixtureTools: satoriBlockedRows.length,
      nonCpuStaticDeferredTools: nonCpuRows.length,
      dryWorkerDispatchEnvelopesPreparedTools: dryDispatchEnvelopeRows.length,
      externalAgentCanDispatchPrivateWorkerJobNowTools: 0,
      externalAgentCanSubmitPrivateWorkerQueueNowTools: 0,
      externalAgentCanRequestPrivateWorkerHandoffNowTools: 0,
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentExecutableNowTools: 0,
      backendQueueSubmissionApprovedNowTools: 0,
      liveQueueWriteApprovedNowTools: 0,
      workerClaimApprovedNowTools: 0,
      workerDispatchApprovedNowTools: 0,
      workerEnqueueApprovedNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      publicArtifactAllowedTools: 0,
      signedUrlAllowedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticPrivateWorkerDispatchDryProofCompleted: true,
      sourceClaimDryProofAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveCpuStaticQueuePayloadsDispatchableDry: dispatchPreparedRows.length === 5,
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuRows.length === 15,
      dryWorkerDispatchEnvelopesPreparedForAdmittedTools:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every((row) => row.dryWorkerDispatchEnvelopePrepared),
      approvedPlanSnapshotRefsPreserved:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every((row) =>
          row.dryDispatchContract?.approvedPlanSnapshotRef.startsWith(
            'approved-plan-snapshot://',
          ),
        ),
      creditReservationFixtureRefsPreserved:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every((row) =>
          row.dryDispatchContract?.creditReservationRef.startsWith(
            'credit-reservation://',
          ),
        ),
      privateArtifactManifestRefsPreserved:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every(
          (row) =>
            row.dryDispatchContract?.privateArtifactManifestRef ===
              row.sourcePrivateArtifactManifestRef &&
            row.sourcePrivateArtifactManifestRef?.startsWith('private://'),
        ),
      idempotencyKeysPreserved:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every(
          (row) =>
            row.dryDispatchContract?.queuePayloadIdempotencyKey ===
              row.sourceQueuePayloadIdempotencyKey &&
            row.dryDispatchContract?.dryDispatchIdempotencyKey.includes(row.toolId),
        ),
      checkbackPolicyRefsPreserved:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every((row) =>
          row.dryDispatchContract?.workerCheckbackPolicyRef.startsWith('policy://'),
        ),
      fallbackPolicyRefsPreserved:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every((row) =>
          row.dryDispatchContract?.workerFallbackPolicyRef.startsWith('policy://'),
        ),
      qaGateRefsPreserved:
        dispatchPreparedRows.length === 5 &&
        dispatchPreparedRows.every((row) =>
          row.dryDispatchContract?.workerQaGateRef.startsWith('policy://'),
        ),
      privateArtifactOnlyPolicyAccepted: true,
      backendQueueTransportProofRequired: true,
      workerClaimLeaseRequired: true,
      workerDispatchProofRequired: true,
      workerCheckbackPolicyRequired: true,
      workerFallbackPolicyRequired: true,
      workerQaGateRequired: true,
      unblockPolicyDefined: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanDispatchPrivateWorkerJobNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerClaimApprovedNow: false,
      workerDispatchApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
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
      workerClaimPerformed: false,
      workerDispatchPerformed: false,
      workerEnqueuePerformed: false,
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
      'controlled private worker dispatch smoke proof with provided evidence for the five dispatchable CPU/static payloads, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred',
  }
}
