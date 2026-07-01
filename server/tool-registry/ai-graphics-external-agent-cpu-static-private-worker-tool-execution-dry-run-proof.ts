import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-dispatch-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_with_runtime_blocks'

const toolExecutionDryRunReadyTools: AiGraphicsCanonicalToolId[] = [
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

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofStatus =
  | 'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked'
  | 'private_worker_tool_execution_dry_run_proof_blocked_pending_satori_font_fixture'
  | 'private_worker_tool_execution_dry_run_proof_deferred_non_cpu_static_runtime_boundary'
  | 'private_worker_tool_execution_dry_run_proof_blocked_missing_dispatch_smoke_proof'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunContract {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  toolExecutionDryRunMode: 'dry_contract_only_no_adapter_invocation_or_tool_execution'
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  queuePayloadIdempotencyKey: string
  dryDispatchIdempotencyKey: string
  dryToolExecutionIdempotencyKey: string
  sourceWorkerDispatchAttemptRef: string
  workerDispatchSmokeEvidenceRef: string
  workerDispatchSmokeTelemetryRef: string
  adapterInvocationDryRunRef: string
  toolInputContractRef: string
  expectedPrivateOutputContractRef: string
  expectedToolResultSchemaRef: string
  toolSpecificQaGateRef: string
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceDispatchSmokeProofStatus: string | null
  sourceDispatchSmokeProofAccepted: boolean
  sourceDispatchSmokeEvidenceAccepted: boolean
  toolExecutionDryRunStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofStatus
  dryToolExecutionProofPrepared: boolean
  dryToolExecutionContractPrepared: boolean
  adapterPayloadShapeValidated: boolean
  privateOutputManifestContractValidated: boolean
  toolResultSchemaValidated: boolean
  dryRunContract: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunContract | null
  exactRequestGateStillRequired: true
  approvedPlanSnapshotRequired: true
  creditReservationRequired: true
  privateArtifactManifestRequired: true
  toolRouteApprovalRequired: true
  workerApprovalRequired: true
  backendQueueTransportProofRequired: true
  liveQueueWriteProofRequired: true
  workerClaimLeaseRequired: true
  workerDispatchProofRequired: true
  idempotencyRequired: true
  checkbackPolicyRequired: true
  fallbackPolicyRequired: true
  toolSpecificQaGateRequired: true
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION
  status: 'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_five_with_runtime_blocks'
  sourceDispatchSmokeProofDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  toolExecutionDryRunPolicy: {
    mode: 'prepare_tool_execution_dry_run_contracts_without_adapter_invocation_or_tool_execution'
    sourceDispatchSmokeProofRequired: true
    validatesProvidedDispatchSmokeEvidence: true
    adapterPayloadShapeRequired: true
    privateOutputManifestContractRequired: true
    toolResultSchemaRequired: true
    noAdapterInvocationByDryRun: true
    noToolExecutionByDryRun: true
    privateArtifactOnly: true
    gpuRuntimeOnDemandOnly: true
    nextGateRequiresControlledPrivateToolExecutionProof: true
  }
  counts: {
    totalAiGraphicsTools: 21
    toolExecutionDryRunProofPreparedTools: number
    dryToolExecutionContractsPreparedTools: number
    adapterPayloadShapeValidatedTools: number
    privateOutputManifestContractValidatedTools: number
    toolResultSchemaValidatedTools: number
    sourceDispatchSmokeProofAcceptedTools: number
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
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofCompleted: true
    sourceDispatchSmokeProofAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveCpuStaticToolExecutionDryRunProofsPrepared: boolean
    allFiveDryToolExecutionContractsPrepared: boolean
    allFiveAdapterPayloadShapesValidated: boolean
    allFivePrivateOutputManifestContractsValidated: boolean
    allFiveToolResultSchemasValidated: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    sourceDispatchSmokeEvidenceRefsPreserved: boolean
    privateArtifactOnlyPolicyAccepted: true
    noAdapterInvocationByDryRun: true
    noToolExecutionByDryRun: true
    nextGateRequiresControlledPrivateToolExecutionProof: true
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofInput {
  sourceDispatchSmokeProofReport?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofReport
}

function sourceRow(
  report: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofReport | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofRow | undefined {
  return report?.rows?.find((row) => row.toolId === toolId)
}

function sourceDispatchSmokeProofAccepted(
  report?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofReport,
): boolean {
  const rows = report?.rows ?? []
  return report?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_DISPATCH_SMOKE_PROOF_DECISION &&
    report.status ===
      'external_agent_cpu_static_private_worker_dispatch_smoke_proof_accepted_five_with_runtime_blocks' &&
    report.counts.dispatchSmokeProofAcceptedTools === 5 &&
    report.counts.dispatchSmokeProofAcceptedWithProvidedEvidenceTools === 5 &&
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    report.counts.nonCpuStaticDeferredTools === 15 &&
    report.counts.externalAgentExecutableNowTools === 0 &&
    report.counts.workerDispatchApprovedNowTools === 0 &&
    report.counts.toolExecutionApprovedNowTools === 0 &&
    report.counts.gpuRuntimeShouldStartNowTools === 0 &&
    report.booleans.allFiveCpuStaticDispatchSmokeProofsAcceptedWithProvidedEvidence === true &&
    report.booleans.privateArtifactOnlyPolicyAccepted === true &&
    report.booleans.noLiveWorkerDispatchBySmokeProof === true &&
    report.booleans.noToolExecutionBySmokeProof === true &&
    report.booleans.nextGateRequiresToolExecutionDryRunProof === true &&
    report.booleans.agentCanExecuteToolsNow === false &&
    report.booleans.workerDispatchApprovedNow === false &&
    report.booleans.toolExecutionApprovedNow === false &&
    report.booleans.gpuRuntimeShouldStartNow === false &&
    rows.length === 21 &&
    toolExecutionDryRunReadyTools.every((toolId) => {
      const row = rows.find((source) => source.toolId === toolId)
      return row?.dispatchSmokeProofStatus ===
        'private_worker_dispatch_smoke_proof_accepted_with_provided_evidence_execution_blocked' &&
        row.providedDispatchSmokeEvidenceAccepted === true &&
        row.workerDispatchSmokeProofAcceptedWithProvidedEvidence === true &&
        row.providedDispatchSmokeEvidence?.expectedOutputVisibility === 'private_artifact_only' &&
        row.externalAgentCanDispatchPrivateWorkerJobNow === false &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.workerDispatchApprovedNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function dryRunStatusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofRow
  sourceAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofStatus {
  if (toolExecutionDryRunReadyTools.includes(input.toolId)) {
    if (
      input.sourceAccepted &&
      input.source?.providedDispatchSmokeEvidenceAccepted === true &&
      input.source.providedDispatchSmokeEvidence
    ) {
      return 'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked'
    }
    return 'private_worker_tool_execution_dry_run_proof_blocked_missing_dispatch_smoke_proof'
  }
  if (input.toolId === 'satori') {
    return 'private_worker_tool_execution_dry_run_proof_blocked_pending_satori_font_fixture'
  }
  return 'private_worker_tool_execution_dry_run_proof_deferred_non_cpu_static_runtime_boundary'
}

function dryRunContractFor(input: {
  toolId: AiGraphicsCanonicalToolId
  source?: AiGraphicsExternalAgentCpuStaticPrivateWorkerDispatchSmokeProofRow
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunContract | null {
  if (
    input.status !==
    'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked'
  ) {
    return null
  }
  const evidence = input.source?.providedDispatchSmokeEvidence
  if (!evidence) return null
  const base =
    `ai-graphics/external-agent/cpu-static-private-worker-tool-execution-dry-run-proof/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    toolExecutionDryRunMode: 'dry_contract_only_no_adapter_invocation_or_tool_execution',
    approvedPlanSnapshotRef: evidence.approvedPlanSnapshotRef,
    creditReservationRef: evidence.creditReservationRef,
    privateArtifactManifestRef: evidence.privateArtifactManifestRef,
    queuePayloadIdempotencyKey: evidence.queuePayloadIdempotencyKey,
    dryDispatchIdempotencyKey: evidence.dryDispatchIdempotencyKey,
    dryToolExecutionIdempotencyKey: `dry-tool-execution://${base}/idempotency`,
    sourceWorkerDispatchAttemptRef: evidence.sourceWorkerDispatchAttemptRef,
    workerDispatchSmokeEvidenceRef: evidence.workerDispatchSmokeEvidenceRef,
    workerDispatchSmokeTelemetryRef: evidence.workerDispatchSmokeTelemetryRef,
    adapterInvocationDryRunRef: `adapter-dry-run://${base}/adapter-invocation`,
    toolInputContractRef: `tool-input-contract://${base}/input`,
    expectedPrivateOutputContractRef: `private-output-contract://${base}/output`,
    expectedToolResultSchemaRef: `tool-result-schema://${base}/result`,
    toolSpecificQaGateRef: `tool-qa-gate://${base}/qa`,
    expectedOutputVisibility: evidence.expectedOutputVisibility,
  }
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofStatus,
): string {
  if (status === 'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked') {
    return 'tool execution dry-run contract is prepared, but adapter invocation, worker execution, and tool execution remain blocked until controlled private tool execution proof passes for the exact request'
  }
  if (
    status ===
    'private_worker_tool_execution_dry_run_proof_blocked_pending_satori_font_fixture'
  ) {
    return 'Satori remains blocked pending approved font fixture proof before tool execution dry-run proof'
  }
  if (
    status ===
    'private_worker_tool_execution_dry_run_proof_blocked_missing_dispatch_smoke_proof'
  ) {
    return 'tool execution dry-run proof is blocked because accepted private worker dispatch smoke proof is missing for this CPU/static tool'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before tool execution dry-run proof'
}

function nextProofMilestoneFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofStatus,
): string {
  if (status === 'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked') {
    return 'controlled private worker tool execution proof for the exact CPU/static adapter payload with private artifact output only'
  }
  if (
    status ===
    'private_worker_tool_execution_dry_run_proof_blocked_pending_satori_font_fixture'
  ) {
    return 'approved Satori font fixture proof before tool execution dry-run proof'
  }
  if (
    status ===
    'private_worker_tool_execution_dry_run_proof_blocked_missing_dispatch_smoke_proof'
  ) {
    return 'repair private worker dispatch smoke proof before tool execution dry-run proof'
  }
  return 'future runtime proof and private worker execution dry-run for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProof(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport {
  const sourceAccepted = sourceDispatchSmokeProofAccepted(input.sourceDispatchSmokeProofReport)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const source = sourceRow(input.sourceDispatchSmokeProofReport, toolId)
    if (!source) {
      throw new Error(`Missing AI graphics tool execution dry-run source row for ${toolId}`)
    }
    const toolExecutionDryRunStatus = dryRunStatusFor({
      toolId,
      source,
      sourceAccepted,
    })
    const dryRunContract = dryRunContractFor({
      toolId,
      source,
      status: toolExecutionDryRunStatus,
    })
    const prepared =
      toolExecutionDryRunStatus ===
        'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked' &&
      dryRunContract !== null

    return {
      toolId,
      productionToolId: source.productionToolId,
      workerType: source.workerType,
      runtimeTarget: source.runtimeTarget,
      queueName: prepared ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
      sourceDispatchSmokeProofStatus: source.dispatchSmokeProofStatus,
      sourceDispatchSmokeProofAccepted: sourceAccepted,
      sourceDispatchSmokeEvidenceAccepted: source.providedDispatchSmokeEvidenceAccepted,
      toolExecutionDryRunStatus,
      dryToolExecutionProofPrepared: prepared,
      dryToolExecutionContractPrepared: prepared,
      adapterPayloadShapeValidated: prepared,
      privateOutputManifestContractValidated: prepared,
      toolResultSchemaValidated: prepared,
      dryRunContract,
      exactRequestGateStillRequired: true,
      approvedPlanSnapshotRequired: true,
      creditReservationRequired: true,
      privateArtifactManifestRequired: true,
      toolRouteApprovalRequired: true,
      workerApprovalRequired: true,
      backendQueueTransportProofRequired: true,
      liveQueueWriteProofRequired: true,
      workerClaimLeaseRequired: true,
      workerDispatchProofRequired: true,
      idempotencyRequired: true,
      checkbackPolicyRequired: true,
      fallbackPolicyRequired: true,
      toolSpecificQaGateRequired: true,
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
      blocker: blockerFor(toolExecutionDryRunStatus),
      nextProofMilestone: nextProofMilestoneFor(toolExecutionDryRunStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow
  })

  const preparedRows = rows.filter((row) => row.dryToolExecutionProofPrepared)
  const satoriBlockedRows = rows.filter(
    (row) =>
      row.toolExecutionDryRunStatus ===
      'private_worker_tool_execution_dry_run_proof_blocked_pending_satori_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) =>
      row.toolExecutionDryRunStatus ===
      'private_worker_tool_execution_dry_run_proof_deferred_non_cpu_static_runtime_boundary',
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-tool-execution-dry-run-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION,
    status:
      'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_five_with_runtime_blocks',
    sourceDispatchSmokeProofDecision:
      input.sourceDispatchSmokeProofReport?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    toolExecutionDryRunPolicy: {
      mode: 'prepare_tool_execution_dry_run_contracts_without_adapter_invocation_or_tool_execution',
      sourceDispatchSmokeProofRequired: true,
      validatesProvidedDispatchSmokeEvidence: true,
      adapterPayloadShapeRequired: true,
      privateOutputManifestContractRequired: true,
      toolResultSchemaRequired: true,
      noAdapterInvocationByDryRun: true,
      noToolExecutionByDryRun: true,
      privateArtifactOnly: true,
      gpuRuntimeOnDemandOnly: true,
      nextGateRequiresControlledPrivateToolExecutionProof: true,
    },
    counts: {
      totalAiGraphicsTools: 21,
      toolExecutionDryRunProofPreparedTools: preparedRows.length,
      dryToolExecutionContractsPreparedTools: preparedRows.length,
      adapterPayloadShapeValidatedTools: rows.filter((row) => row.adapterPayloadShapeValidated)
        .length,
      privateOutputManifestContractValidatedTools: rows.filter(
        (row) => row.privateOutputManifestContractValidated,
      ).length,
      toolResultSchemaValidatedTools: rows.filter((row) => row.toolResultSchemaValidated).length,
      sourceDispatchSmokeProofAcceptedTools:
        input.sourceDispatchSmokeProofReport?.counts.dispatchSmokeProofAcceptedTools ?? 0,
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
      externalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofCompleted: true,
      sourceDispatchSmokeProofAccepted: sourceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveCpuStaticToolExecutionDryRunProofsPrepared: preparedRows.length === 5,
      allFiveDryToolExecutionContractsPrepared:
        preparedRows.length === 5 &&
        preparedRows.every((row) => row.dryToolExecutionContractPrepared),
      allFiveAdapterPayloadShapesValidated:
        preparedRows.length === 5 &&
        preparedRows.every((row) => row.adapterPayloadShapeValidated),
      allFivePrivateOutputManifestContractsValidated:
        preparedRows.length === 5 &&
        preparedRows.every((row) => row.privateOutputManifestContractValidated),
      allFiveToolResultSchemasValidated:
        preparedRows.length === 5 && preparedRows.every((row) => row.toolResultSchemaValidated),
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuRows.length === 15,
      sourceDispatchSmokeEvidenceRefsPreserved:
        preparedRows.length === 5 &&
        preparedRows.every((row) => {
          const contract = row.dryRunContract
          return Boolean(contract) &&
            contract.workerDispatchSmokeEvidenceRef.includes(row.toolId) &&
            contract.workerDispatchSmokeTelemetryRef.includes(row.toolId) &&
            contract.sourceWorkerDispatchAttemptRef.startsWith('dispatch://') &&
            contract.approvedPlanSnapshotRef.startsWith('approved-plan-snapshot://') &&
            contract.creditReservationRef.startsWith('credit-reservation://') &&
            contract.privateArtifactManifestRef.startsWith('private://') &&
            contract.queuePayloadIdempotencyKey.includes(row.toolId) &&
            contract.dryDispatchIdempotencyKey.includes(row.toolId) &&
            contract.dryToolExecutionIdempotencyKey.includes(row.toolId) &&
            contract.expectedOutputVisibility === 'private_artifact_only'
        }),
      privateArtifactOnlyPolicyAccepted: true,
      noAdapterInvocationByDryRun: true,
      noToolExecutionByDryRun: true,
      nextGateRequiresControlledPrivateToolExecutionProof: true,
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
      'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF',
  }
}
