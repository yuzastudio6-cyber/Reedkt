import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION_DECISION,
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_claim_dry_proof_prepared_with_runtime_blocks'

const AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS =
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
    (capabilityId) =>
      capabilityId !== 'planning_metadata_only' &&
      capabilityId !== 'blocked_or_deferred',
  )

const dryClaimLeaseSeconds = 900

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofStatus =
  | 'private_worker_claim_dry_proof_prepared_execution_blocked'
  | 'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture'
  | 'private_worker_claim_dry_proof_deferred_non_cpu_static_runtime_boundary'
  | 'private_worker_claim_dry_proof_blocked_missing_queue_dry_admission'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofInput {
  sourceQueueDryAdmissionDecision?: string
  sourceQueueDryAdmissionStatus?: string
  sourceQueueDryAdmissionRows?: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow[]
  sourcePrivateWorkerQueueDryAdmissionPreparedTools?: number
  sourceCpuStaticPrivateWorkerQueueDryReadyTools?: number
  sourceCpuStaticPrivateWorkerQueueDryBlockedTools?: number
  sourceSatoriBlockedPendingApprovedFontFixtureTools?: number
  sourceNonCpuStaticDeferredTools?: number
  sourceDryQueuePayloadContractsPreparedTools?: number
  sourceExternalAgentCanSubmitPrivateWorkerQueueNowTools?: number
  sourceBackendQueueSubmissionApprovedNowTools?: number
  sourceLiveQueueWriteApprovedNowTools?: number
  sourceWorkerEnqueueApprovedNowTools?: number
  sourceWorkerDispatchApprovedNowTools?: number
  sourceToolExecutionApprovedNowTools?: number
  sourceGpuRuntimeShouldStartNowTools?: number
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDryClaimContract {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  claimTransportMode: 'dry_contract_only_no_worker_claim'
  dryClaimLeaseSeconds: typeof dryClaimLeaseSeconds
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  queuePayloadIdempotencyKey: string
  dryClaimIdempotencyKey: string
  requestTraceRef: string
  workerClaimLeaseRef: string
  workerCheckbackPolicyRef: string
  workerFallbackPolicyRef: string
  workerQaGateRef: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  workItemKind:
    | 'ai_graphics_cpu_static_private_worker_claim_dry_proof'
    | 'ai_graphics_cpu_static_private_worker_claim_blocked'
    | 'ai_graphics_runtime_deferred_private_worker_claim'
  claimDryProofStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofStatus
  sourceQueueDryAdmissionStatus: string | null
  sourcePrivateWorkerQueueDryAdmissionPrepared: boolean
  sourceDryQueuePayloadContractPrepared: boolean
  sourceQueuePayloadIdempotencyKey: string | null
  sourcePrivateArtifactManifestRef: string | null
  dryWorkerClaimProofPrepared: boolean
  dryWorkerClaimEnvelopePrepared: boolean
  dryClaimContract: AiGraphicsExternalAgentCpuStaticPrivateWorkerDryClaimContract | null
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
  externalAgentCanClaimPrivateWorkerJobNow: false
  externalAgentCanSubmitPrivateWorkerQueueNow: false
  externalAgentCanRequestPrivateWorkerHandoffNow: false
  externalAgentCanInvokeAdapterNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  backendQueueSubmissionApprovedNow: false
  liveQueueWriteApprovedNow: false
  workerClaimApprovedNow: false
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-claim-dry-proof'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF_DECISION
  status: 'external_agent_cpu_static_private_worker_claim_dry_proof_prepared_five_claimable_one_blocked_execution_blocked'
  sourceQueueDryAdmissionDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  dryClaimPolicy: {
    temporaryRuntimeBlock: true
    mode: 'prepare_private_worker_claim_envelopes_without_worker_claim_or_dispatch'
    dryClaimLeaseSeconds: typeof dryClaimLeaseSeconds
    requiredBeforeAnyLiveWorkerClaim: string[]
  }
  counts: {
    totalAiGraphicsTools: 21
    privateWorkerClaimDryProofPreparedTools: number
    cpuStaticPrivateWorkerClaimDryReadyTools: number
    cpuStaticPrivateWorkerClaimDryBlockedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    dryWorkerClaimEnvelopesPreparedTools: number
    externalAgentCanClaimPrivateWorkerJobNowTools: 0
    externalAgentCanSubmitPrivateWorkerQueueNowTools: 0
    externalAgentCanRequestPrivateWorkerHandoffNowTools: 0
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentExecutableNowTools: 0
    backendQueueSubmissionApprovedNowTools: 0
    liveQueueWriteApprovedNowTools: 0
    workerClaimApprovedNowTools: 0
    workerEnqueueApprovedNowTools: 0
    workerDispatchApprovedNowTools: 0
    toolExecutionApprovedNowTools: 0
    publicArtifactAllowedTools: 0
    signedUrlAllowedTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerClaimDryProofCompleted: true
    sourceQueueDryAdmissionAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveCpuStaticQueuePayloadsClaimableDry: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    dryWorkerClaimEnvelopesPreparedForAdmittedTools: boolean
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
    externalAgentCanClaimPrivateWorkerJobNow: false
    externalAgentCanSubmitPrivateWorkerQueueNow: false
    externalAgentCanRequestPrivateWorkerHandoffNow: false
    externalAgentCanInvokeAdapterNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerClaimApprovedNow: false
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
    workerClaimPerformed: false
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

const requiredBeforeAnyLiveWorkerClaim = [
  'approved plan snapshot record persisted by backend',
  'approved credit reservation record persisted by backend',
  'Tool Route admission approval for the exact tool request',
  'Worker admission approval for the exact tool request',
  'private artifact manifest writer and retention policy',
  'backend queue transport proof',
  'live queue write proof',
  'worker claim and lease proof',
  'worker dispatch proof',
  'idempotency and retry policy',
  'checkback policy',
  'fallback policy',
  'tool-specific QA gate',
  'per-tool runtime proof for browser/GPU/model targets when applicable',
]

function sourceRow(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofInput,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow | undefined {
  return input.sourceQueueDryAdmissionRows?.find((row) => row.toolId === toolId)
}

function sourceQueueDryAdmissionAccepted(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofInput,
): boolean {
  const rows = input.sourceQueueDryAdmissionRows ?? []
  const readyRowsAccepted = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'].every(
    (toolId) => {
      const row = rows.find((source) => source.toolId === toolId)
      return row?.dryAdmissionStatus ===
        'private_worker_queue_dry_admission_prepared_execution_blocked' &&
        row.privateWorkerQueueDryAdmissionPrepared === true &&
        row.dryQueuePayloadContractPrepared === true &&
        row.queuePayloadContract?.queueName ===
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
        row.queuePayloadContract.queueTransportMode ===
          'dry_contract_only_no_backend_write' &&
        typeof row.queuePayloadContract.approvedPlanSnapshotRef === 'string' &&
        typeof row.queuePayloadContract.creditReservationRef === 'string' &&
        typeof row.queuePayloadContract.privateArtifactManifestRef === 'string' &&
        typeof row.queuePayloadContract.idempotencyKey === 'string' &&
        typeof row.queuePayloadContract.workerCheckbackPolicyRef === 'string' &&
        typeof row.queuePayloadContract.workerFallbackPolicyRef === 'string' &&
        typeof row.queuePayloadContract.workerQaGateRef === 'string' &&
        row.externalAgentCanSubmitPrivateWorkerQueueNow === false &&
        row.liveQueueWriteApprovedNow === false &&
        row.workerEnqueueApprovedNow === false &&
        row.workerDispatchApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    },
  )
  const satori = rows.find((row) => row.toolId === 'satori')

  return input.sourceQueueDryAdmissionDecision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_DRY_ADMISSION_DECISION &&
    input.sourceQueueDryAdmissionStatus ===
      'external_agent_cpu_static_private_worker_queue_dry_admission_prepared_five_dry_admitted_one_blocked_execution_blocked' &&
    rows.length === 21 &&
    input.sourcePrivateWorkerQueueDryAdmissionPreparedTools === 5 &&
    input.sourceCpuStaticPrivateWorkerQueueDryReadyTools === 5 &&
    input.sourceCpuStaticPrivateWorkerQueueDryBlockedTools === 1 &&
    input.sourceSatoriBlockedPendingApprovedFontFixtureTools === 1 &&
    input.sourceNonCpuStaticDeferredTools === 15 &&
    input.sourceDryQueuePayloadContractsPreparedTools === 5 &&
    input.sourceExternalAgentCanSubmitPrivateWorkerQueueNowTools === 0 &&
    input.sourceBackendQueueSubmissionApprovedNowTools === 0 &&
    input.sourceLiveQueueWriteApprovedNowTools === 0 &&
    input.sourceWorkerEnqueueApprovedNowTools === 0 &&
    input.sourceWorkerDispatchApprovedNowTools === 0 &&
    input.sourceToolExecutionApprovedNowTools === 0 &&
    input.sourceGpuRuntimeShouldStartNowTools === 0 &&
    readyRowsAccepted &&
    satori?.dryAdmissionStatus ===
      'private_worker_queue_dry_admission_blocked_pending_satori_font_fixture' &&
    satori.privateWorkerQueueDryAdmissionPrepared === false
}

function isClaimDryReadyTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'].includes(toolId)
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofStatus {
  if (isClaimDryReadyTool(input.toolId)) {
    if (
      input.sourceAccepted &&
      input.source?.privateWorkerQueueDryAdmissionPrepared === true &&
      input.source.dryQueuePayloadContractPrepared === true &&
      input.source.queuePayloadContract
    ) {
      return 'private_worker_claim_dry_proof_prepared_execution_blocked'
    }
    return 'private_worker_claim_dry_proof_blocked_missing_queue_dry_admission'
  }

  if (input.toolId === 'satori') {
    return 'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture'
  }

  return 'private_worker_claim_dry_proof_deferred_non_cpu_static_runtime_boundary'
}

function workItemKindFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofStatus,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow['workItemKind'] {
  if (status === 'private_worker_claim_dry_proof_prepared_execution_blocked') {
    return 'ai_graphics_cpu_static_private_worker_claim_dry_proof'
  }
  if (
    status === 'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture' ||
    status === 'private_worker_claim_dry_proof_blocked_missing_queue_dry_admission'
  ) {
    return 'ai_graphics_cpu_static_private_worker_claim_blocked'
  }
  return 'ai_graphics_runtime_deferred_private_worker_claim'
}

function dryClaimContractFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerQueueDryAdmissionRow
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerDryClaimContract | null {
  if (input.status !== 'private_worker_claim_dry_proof_prepared_execution_blocked') {
    return null
  }
  const payload = input.source?.queuePayloadContract
  if (!payload) return null

  const base = `ai-graphics/external-agent/cpu-static-private-worker-claim-dry-proof/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    claimTransportMode: 'dry_contract_only_no_worker_claim',
    dryClaimLeaseSeconds,
    approvedPlanSnapshotRef: payload.approvedPlanSnapshotRef,
    creditReservationRef: payload.creditReservationRef,
    privateArtifactManifestRef: payload.privateArtifactManifestRef,
    queuePayloadIdempotencyKey: payload.idempotencyKey,
    dryClaimIdempotencyKey:
      `ai-graphics:external-agent:cpu-static-private-worker-claim-dry-proof:${input.toolId}:lease-${dryClaimLeaseSeconds}:dry-only`,
    requestTraceRef: payload.requestTraceRef,
    workerClaimLeaseRef: `lease://${base}/claim-lease-fixture`,
    workerCheckbackPolicyRef: payload.workerCheckbackPolicyRef,
    workerFallbackPolicyRef: payload.workerFallbackPolicyRef,
    workerQaGateRef: payload.workerQaGateRef,
    expectedOutputVisibility: 'private_artifact_only',
  }
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofStatus,
): string {
  if (status === 'private_worker_claim_dry_proof_prepared_execution_blocked') {
    return 'private worker claim envelope is prepared in dry mode, but external-agent worker claim, worker enqueue, worker dispatch, tool execution, and runtime remain blocked until live execution gates pass'
  }
  if (status === 'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture') {
    return 'Satori remains blocked pending approved font fixture proof before private worker claim dry proof'
  }
  if (status === 'private_worker_claim_dry_proof_blocked_missing_queue_dry_admission') {
    return 'private worker queue dry-admission evidence is missing or incompatible for this CPU/static tool'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker claim proof'
}

function nextProofMilestoneFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofStatus,
): string {
  if (status === 'private_worker_claim_dry_proof_prepared_execution_blocked') {
    return 'controlled private worker dispatch dry proof for the claimable CPU/static payload, still without live worker dispatch or tool execution'
  }
  if (status === 'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture') {
    return 'approved Satori font fixture proof before private worker queue and claim dry proof'
  }
  if (status === 'private_worker_claim_dry_proof_blocked_missing_queue_dry_admission') {
    return 'repair private worker queue dry-admission evidence for this CPU/static tool'
  }
  return 'future runtime proof and claim admission for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProof(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofReport {
  const sourceAccepted = sourceQueueDryAdmissionAccepted(input)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const source = sourceRow(input, toolId)
    if (
      !source ||
      !source.productionToolId ||
      !source.workerType ||
      !source.runtimeTarget
    ) {
      throw new Error(`Missing AI graphics claim dry-proof source row for ${toolId}`)
    }

    const claimDryProofStatus = statusFor({ toolId, source, sourceAccepted })
    const dryClaimPrepared =
      claimDryProofStatus === 'private_worker_claim_dry_proof_prepared_execution_blocked'
    const dryClaimContract = dryClaimContractFor({
      toolId,
      source,
      status: claimDryProofStatus,
    })

    return {
      toolId,
      productionToolId: source.productionToolId,
      workerType: source.workerType,
      runtimeTarget: source.runtimeTarget,
      queueName: dryClaimPrepared
        ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
        : null,
      workItemKind: workItemKindFor(claimDryProofStatus),
      claimDryProofStatus,
      sourceQueueDryAdmissionStatus: source.dryAdmissionStatus,
      sourcePrivateWorkerQueueDryAdmissionPrepared:
        source.privateWorkerQueueDryAdmissionPrepared === true,
      sourceDryQueuePayloadContractPrepared:
        source.dryQueuePayloadContractPrepared === true,
      sourceQueuePayloadIdempotencyKey:
        source.queuePayloadContract?.idempotencyKey ?? null,
      sourcePrivateArtifactManifestRef:
        source.queuePayloadContract?.privateArtifactManifestRef ?? null,
      dryWorkerClaimProofPrepared: dryClaimPrepared,
      dryWorkerClaimEnvelopePrepared: dryClaimContract !== null,
      dryClaimContract,
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
      externalAgentCanClaimPrivateWorkerJobNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerClaimApprovedNow: false,
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
      blocker: blockerFor(claimDryProofStatus),
      nextProofMilestone: nextProofMilestoneFor(claimDryProofStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticPrivateWorkerClaimDryProofRow
  })

  const claimPreparedRows = rows.filter((row) => row.dryWorkerClaimProofPrepared)
  const satoriBlockedRows = rows.filter(
    (row) =>
      row.claimDryProofStatus ===
      'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) =>
      row.claimDryProofStatus ===
      'private_worker_claim_dry_proof_deferred_non_cpu_static_runtime_boundary',
  )
  const cpuStaticBlockedRows = rows.filter(
    (row) =>
      row.claimDryProofStatus ===
        'private_worker_claim_dry_proof_blocked_pending_satori_font_fixture' ||
      row.claimDryProofStatus ===
        'private_worker_claim_dry_proof_blocked_missing_queue_dry_admission',
  )
  const dryEnvelopeRows = rows.filter((row) => row.dryWorkerClaimEnvelopePrepared)

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-claim-dry-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CLAIM_DRY_PROOF_DECISION,
    status:
      'external_agent_cpu_static_private_worker_claim_dry_proof_prepared_five_claimable_one_blocked_execution_blocked',
    sourceQueueDryAdmissionDecision: input.sourceQueueDryAdmissionDecision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    dryClaimPolicy: {
      temporaryRuntimeBlock: true,
      mode: 'prepare_private_worker_claim_envelopes_without_worker_claim_or_dispatch',
      dryClaimLeaseSeconds,
      requiredBeforeAnyLiveWorkerClaim,
    },
    counts: {
      totalAiGraphicsTools: 21,
      privateWorkerClaimDryProofPreparedTools: claimPreparedRows.length,
      cpuStaticPrivateWorkerClaimDryReadyTools: claimPreparedRows.length,
      cpuStaticPrivateWorkerClaimDryBlockedTools: cpuStaticBlockedRows.length,
      satoriBlockedPendingApprovedFontFixtureTools: satoriBlockedRows.length,
      nonCpuStaticDeferredTools: nonCpuRows.length,
      dryWorkerClaimEnvelopesPreparedTools: dryEnvelopeRows.length,
      externalAgentCanClaimPrivateWorkerJobNowTools: 0,
      externalAgentCanSubmitPrivateWorkerQueueNowTools: 0,
      externalAgentCanRequestPrivateWorkerHandoffNowTools: 0,
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentExecutableNowTools: 0,
      backendQueueSubmissionApprovedNowTools: 0,
      liveQueueWriteApprovedNowTools: 0,
      workerClaimApprovedNowTools: 0,
      workerEnqueueApprovedNowTools: 0,
      workerDispatchApprovedNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      publicArtifactAllowedTools: 0,
      signedUrlAllowedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticPrivateWorkerClaimDryProofCompleted: true,
      sourceQueueDryAdmissionAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveCpuStaticQueuePayloadsClaimableDry: claimPreparedRows.length === 5,
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuRows.length === 15,
      dryWorkerClaimEnvelopesPreparedForAdmittedTools:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every((row) => row.dryWorkerClaimEnvelopePrepared),
      approvedPlanSnapshotRefsPreserved:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every((row) =>
          row.dryClaimContract?.approvedPlanSnapshotRef.startsWith(
            'approved-plan-snapshot://',
          ),
        ),
      creditReservationFixtureRefsPreserved:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every((row) =>
          row.dryClaimContract?.creditReservationRef.startsWith(
            'credit-reservation://',
          ),
        ),
      privateArtifactManifestRefsPreserved:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every(
          (row) =>
            row.dryClaimContract?.privateArtifactManifestRef ===
              row.sourcePrivateArtifactManifestRef &&
            row.sourcePrivateArtifactManifestRef?.startsWith('private://'),
        ),
      idempotencyKeysPreserved:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every(
          (row) =>
            row.dryClaimContract?.queuePayloadIdempotencyKey ===
              row.sourceQueuePayloadIdempotencyKey &&
            row.dryClaimContract?.dryClaimIdempotencyKey.includes(row.toolId),
        ),
      checkbackPolicyRefsPreserved:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every((row) =>
          row.dryClaimContract?.workerCheckbackPolicyRef.startsWith('policy://'),
        ),
      fallbackPolicyRefsPreserved:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every((row) =>
          row.dryClaimContract?.workerFallbackPolicyRef.startsWith('policy://'),
        ),
      qaGateRefsPreserved:
        claimPreparedRows.length === 5 &&
        claimPreparedRows.every((row) =>
          row.dryClaimContract?.workerQaGateRef.startsWith('policy://'),
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
      externalAgentCanClaimPrivateWorkerJobNow: false,
      externalAgentCanSubmitPrivateWorkerQueueNow: false,
      externalAgentCanRequestPrivateWorkerHandoffNow: false,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerClaimApprovedNow: false,
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
      workerClaimPerformed: false,
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
      'controlled private worker dispatch dry proof for the five claimable CPU/static payloads, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred',
  }
}
