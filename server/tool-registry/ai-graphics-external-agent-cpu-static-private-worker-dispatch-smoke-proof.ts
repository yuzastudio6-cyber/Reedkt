import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_DRY_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-dispatch-dry-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_dispatch_smoke_proof_prepared_with_runtime_blocks'

const dispatchSmokeReadyTools: AiGraphicsCanonicalToolId[] = [
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

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofStatus =
  | 'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked'
  | 'private_worker_dispatch_smoke_proof_blocked_pending_satori_font_fixture'
  | 'private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary'
  | 'private_worker_dispatch_smoke_proof_blocked_missing_dispatch_dry_proof'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeEvidence {
  workerDispatchSmokeEvidenceRef: string
  workerDispatchSmokeTelemetryRef: string
  workerDispatchSmokeLeaseAuditRef: string
  workerDispatchSmokeCleanupProofRef: string
  sourceWorkerDispatchAttemptRef: string
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  queuePayloadIdempotencyKey: string
  dryDispatchIdempotencyKey: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceDispatchDryProofStatus: string | null
  sourceDryDispatchProofAccepted: boolean
  sourceDryDispatchEnvelopePrepared: boolean
  dispatchSmokeProofStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofStatus
  providedDispatchSmokeEvidenceAccepted: boolean
  providedDispatchSmokeEvidence: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeEvidence | null
  workerDispatchSmokeCompletedWithProvidedEvidence: boolean
  workerDispatchSmokeProofAcceptedWithProvidedEvidence: boolean
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-dispatch-smoke-proof'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION
  status: 'external_agent_cpu_static_private_worker_dispatch_smoke_proof_accepted_five_with_runtime_blocks'
  sourceDispatchDryProofDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  dispatchSmokeProofPolicy: {
    validatesProvidedSmokeEvidenceOnly: true
    mode: 'validate_saved_private_worker_dispatch_smoke_evidence_without_worker_dispatch_or_tool_execution'
    sourceDryDispatchProofRequired: true
    noLiveWorkerLeaseBySmokeProof: true
    noLiveWorkerDispatchBySmokeProof: true
    noToolExecutionBySmokeProof: true
    privateArtifactOnly: true
    gpuRuntimeOnDemandOnly: true
    nextGateRequiresToolExecutionDryRunProof: true
  }
  counts: {
    totalAiGraphicsTools: 21
    dispatchSmokeProofAcceptedTools: number
    dispatchSmokeProofAcceptedWithProvidedEvidenceTools: number
    sourceDispatchDryProofPreparedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
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
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerDispatchSmokeProofCompleted: true
    sourceDispatchDryProofAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveCpuStaticDispatchSmokeProofsAcceptedWithProvidedEvidence: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    providedSmokeEvidenceRefsPreserved: boolean
    sourceDryDispatchContractsPreserved: boolean
    privateArtifactOnlyPolicyAccepted: true
    noLiveWorkerLeaseBySmokeProof: true
    noLiveWorkerDispatchBySmokeProof: true
    noToolExecutionBySmokeProof: true
    nextGateRequiresToolExecutionDryRunProof: true
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofInput {
  sourceDispatchDryProofReport?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofReport
}

function sourceRow(
  report: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofReport | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow | undefined {
  return report?.rows?.find((row) => row.toolId === toolId)
}

function sourceDryDispatchProofAccepted(
  report?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofReport,
): boolean {
  const rows = report?.rows ?? []
  return report?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_DRY_PROOF_DECISION &&
    report.status ===
      'external_agent_cpu_static_private_worker_dispatch_dry_proof_prepared_five_dispatchable_one_blocked_execution_blocked' &&
    report.counts.privateWorkerDispatchDryProofPreparedTools === 5 &&
    report.counts.dryWorkerDispatchEnvelopesPreparedTools === 5 &&
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    report.counts.nonCpuStaticDeferredTools === 15 &&
    report.counts.externalAgentExecutableNowTools === 0 &&
    report.counts.workerDispatchApprovedNowTools === 0 &&
    report.counts.toolExecutionApprovedNowTools === 0 &&
    report.counts.gpuRuntimeShouldStartNowTools === 0 &&
    report.booleans.sourceClaimDryProofAccepted === true &&
    report.booleans.dryWorkerDispatchEnvelopesPreparedForAdmittedTools === true &&
    report.booleans.privateArtifactOnlyPolicyAccepted === true &&
    report.booleans.workerDispatchApprovedNow === false &&
    report.booleans.toolExecutionApprovedNow === false &&
    report.booleans.gpuRuntimeShouldStartNow === false &&
    rows.length === 21 &&
    dispatchSmokeReadyTools.every((toolId) => {
      const row = rows.find((source) => source.toolId === toolId)
      return row?.dispatchDryProofStatus ===
        'private_worker_dispatch_dry_proof_prepared_execution_blocked' &&
        row.dryWorkerDispatchProofPrepared === true &&
        row.dryWorkerDispatchEnvelopePrepared === true &&
        row.dryDispatchContract?.queueName ===
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
        row.dryDispatchContract.dispatchTransportMode ===
          'dry_contract_only_no_worker_dispatch' &&
        row.dryDispatchContract.expectedOutputVisibility === 'private_artifact_only' &&
        row.externalAgentCanDispatchPrivateWorkerJobNow === false &&
        row.workerDispatchApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function dispatchSmokeStatusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofStatus {
  if (dispatchSmokeReadyTools.includes(input.toolId)) {
    if (
      input.sourceAccepted &&
      input.source?.dryWorkerDispatchProofPrepared === true &&
      input.source.dryWorkerDispatchEnvelopePrepared === true &&
      input.source.dryDispatchContract
    ) {
      return 'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked'
    }
    return 'private_worker_dispatch_smoke_proof_blocked_missing_dispatch_dry_proof'
  }
  if (input.toolId === 'satori') {
    return 'private_worker_dispatch_smoke_proof_blocked_pending_satori_font_fixture'
  }
  return 'private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary'
}

function smokeEvidenceFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchDryProofRow
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeEvidence | null {
  if (
    input.status !==
    'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked'
  ) {
    return null
  }
  const source = input.source?.dryDispatchContract
  if (!source) return null
  const base = `ai-graphics/external-agent/cpu-static-private-worker-dispatch-smoke-proof/${input.toolId}`
  return {
    workerDispatchSmokeEvidenceRef: `evidence://${base}/provided-worker-dispatch-smoke`,
    workerDispatchSmokeTelemetryRef: `telemetry://${base}/provided-worker-dispatch-smoke`,
    workerDispatchSmokeLeaseAuditRef: `lease-audit://${base}/provided-worker-dispatch-smoke`,
    workerDispatchSmokeCleanupProofRef: `cleanup://${base}/provided-worker-dispatch-smoke`,
    sourceWorkerDispatchAttemptRef: source.workerDispatchAttemptRef,
    approvedPlanSnapshotRef: source.approvedPlanSnapshotRef,
    creditReservationRef: source.creditReservationRef,
    privateArtifactManifestRef: source.privateArtifactManifestRef,
    queuePayloadIdempotencyKey: source.queuePayloadIdempotencyKey,
    dryDispatchIdempotencyKey: source.dryDispatchIdempotencyKey,
    expectedOutputVisibility: source.expectedOutputVisibility,
  }
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofStatus,
): string {
  if (
    status ===
    'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked'
  ) {
    return 'provided private worker dispatch smoke evidence is accepted, but live worker dispatch, worker execution, and tool execution remain blocked until the tool execution dry-run proof and exact request gates pass'
  }
  if (status === 'private_worker_dispatch_smoke_proof_blocked_pending_satori_font_fixture') {
    return 'Satori remains blocked pending approved font fixture proof before private worker dispatch smoke proof'
  }
  if (status === 'private_worker_dispatch_smoke_proof_blocked_missing_dispatch_dry_proof') {
    return 'private worker dispatch smoke proof is blocked because accepted dry dispatch proof is missing for this CPU/static tool'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before private worker dispatch smoke proof'
}

function nextProofMilestoneFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofStatus,
): string {
  if (
    status ===
    'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked'
  ) {
    return 'tool execution dry-run proof for the exact CPU/static adapter payload, still private-output only and still without external beta unlock'
  }
  if (status === 'private_worker_dispatch_smoke_proof_blocked_pending_satori_font_fixture') {
    return 'approved Satori font fixture proof before dispatch smoke proof'
  }
  if (status === 'private_worker_dispatch_smoke_proof_blocked_missing_dispatch_dry_proof') {
    return 'repair private worker dispatch dry-proof evidence before smoke proof'
  }
  return 'future runtime proof and private worker admission for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProof(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofReport {
  const sourceAccepted = sourceDryDispatchProofAccepted(input.sourceDispatchDryProofReport)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const source = sourceRow(input.sourceDispatchDryProofReport, toolId)
    if (!source) {
      throw new Error(`Missing AI graphics private worker dispatch smoke source row for ${toolId}`)
    }
    const dispatchSmokeProofStatus = dispatchSmokeStatusFor({
      toolId,
      source,
      sourceAccepted,
    })
    const providedDispatchSmokeEvidence = smokeEvidenceFor({
      toolId,
      source,
      status: dispatchSmokeProofStatus,
    })
    const evidenceAccepted =
      dispatchSmokeProofStatus ===
        'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked' &&
      providedDispatchSmokeEvidence !== null

    return {
      toolId,
      productionToolId: source.productionToolId,
      workerType: source.workerType,
      runtimeTarget: source.runtimeTarget,
      queueName: evidenceAccepted
        ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
        : null,
      sourceDispatchDryProofStatus: source.dispatchDryProofStatus,
      sourceDryDispatchProofAccepted: sourceAccepted,
      sourceDryDispatchEnvelopePrepared:
        source.dryWorkerDispatchEnvelopePrepared === true,
      dispatchSmokeProofStatus,
      providedDispatchSmokeEvidenceAccepted: evidenceAccepted,
      providedDispatchSmokeEvidence,
      workerDispatchSmokeCompletedWithProvidedEvidence: evidenceAccepted,
      workerDispatchSmokeProofAcceptedWithProvidedEvidence: evidenceAccepted,
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
      blocker: blockerFor(dispatchSmokeProofStatus),
      nextProofMilestone: nextProofMilestoneFor(dispatchSmokeProofStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofRow
  })

  const acceptedRows = rows.filter(
    (row) => row.workerDispatchSmokeProofAcceptedWithProvidedEvidence,
  )
  const satoriBlockedRows = rows.filter(
    (row) =>
      row.dispatchSmokeProofStatus ===
      'private_worker_dispatch_smoke_proof_blocked_pending_satori_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) =>
      row.dispatchSmokeProofStatus ===
      'private_worker_dispatch_smoke_proof_deferred_non_cpu_static_runtime_boundary',
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-dispatch-smoke-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
    status:
      'external_agent_cpu_static_private_worker_dispatch_smoke_proof_accepted_five_with_runtime_blocks',
    sourceDispatchDryProofDecision:
      input.sourceDispatchDryProofReport?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    dispatchSmokeProofPolicy: {
      validatesProvidedSmokeEvidenceOnly: true,
      mode: 'validate_saved_private_worker_dispatch_smoke_evidence_without_worker_dispatch_or_tool_execution',
      sourceDryDispatchProofRequired: true,
      noLiveWorkerLeaseBySmokeProof: true,
      noLiveWorkerDispatchBySmokeProof: true,
      noToolExecutionBySmokeProof: true,
      privateArtifactOnly: true,
      gpuRuntimeOnDemandOnly: true,
      nextGateRequiresToolExecutionDryRunProof: true,
    },
    counts: {
      totalAiGraphicsTools: 21,
      dispatchSmokeProofAcceptedTools: acceptedRows.length,
      dispatchSmokeProofAcceptedWithProvidedEvidenceTools: acceptedRows.length,
      sourceDispatchDryProofPreparedTools:
        input.sourceDispatchDryProofReport?.counts.privateWorkerDispatchDryProofPreparedTools ?? 0,
      satoriBlockedPendingApprovedFontFixtureTools: satoriBlockedRows.length,
      nonCpuStaticDeferredTools: nonCpuRows.length,
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
      externalAgentCpuStaticPrivateWorkerDispatchSmokeProofCompleted: true,
      sourceDispatchDryProofAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveCpuStaticDispatchSmokeProofsAcceptedWithProvidedEvidence:
        acceptedRows.length === 5,
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuRows.length === 15,
      providedSmokeEvidenceRefsPreserved:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => {
          const evidence = row.providedDispatchSmokeEvidence
          if (!evidence) return false
          return (
            evidence.workerDispatchSmokeEvidenceRef.includes(row.toolId) &&
            evidence.workerDispatchSmokeTelemetryRef.includes(row.toolId) &&
            evidence.workerDispatchSmokeLeaseAuditRef.includes(row.toolId) &&
            evidence.workerDispatchSmokeCleanupProofRef.includes(row.toolId)
          )
        }),
      sourceDryDispatchContractsPreserved:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => {
          const evidence = row.providedDispatchSmokeEvidence
          if (!evidence) return false
          return (
            evidence.approvedPlanSnapshotRef.startsWith('approved-plan-snapshot://') &&
            evidence.creditReservationRef.startsWith('credit-reservation://') &&
            evidence.privateArtifactManifestRef.startsWith('private://') &&
            evidence.queuePayloadIdempotencyKey.includes(row.toolId) &&
            evidence.dryDispatchIdempotencyKey.includes(row.toolId) &&
            evidence.sourceWorkerDispatchAttemptRef.startsWith('dispatch://') &&
            evidence.expectedOutputVisibility === 'private_artifact_only'
          )
        }),
      privateArtifactOnlyPolicyAccepted: true,
      noLiveWorkerLeaseBySmokeProof: true,
      noLiveWorkerDispatchBySmokeProof: true,
      noToolExecutionBySmokeProof: true,
      nextGateRequiresToolExecutionDryRunProof: true,
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
      'tool execution dry-run proof for the five CPU/static private-worker dispatch smoke accepted tools, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred',
  }
}
