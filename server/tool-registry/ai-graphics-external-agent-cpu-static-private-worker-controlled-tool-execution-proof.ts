import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport,
  type AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow,
} from './ai-graphics-external-agent-cpu-static-private-worker-tool-execution-dry-run-proof'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
} from './ai-graphics-external-agent-cpu-static-private-worker-queue-dry-admission'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION =
  'ai_graphics_external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_with_runtime_blocks'

const controlledExecutionProofTools: AiGraphicsCanonicalToolId[] = [
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

export const AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE_0_DECISION =
  'ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings'

export interface AiGraphicsCpuStaticExecutionProofPhase0ToolResult {
  toolId: AiGraphicsCanonicalToolId
  status: string
  importStatus?: string
  fixtureStatus?: string
  outputContractStatus?: string
  blockedReason?: string | null
  localArtifactPaths?: string[]
  outputSummary?: Record<string, unknown>
}

export interface AiGraphicsCpuStaticExecutionProofPhase0Report {
  decision?: string
  status?: string
  packageLockStatus?: string
  localArtifactRoot?: string
  tools?: AiGraphicsCpuStaticExecutionProofPhase0ToolResult[]
  booleans?: Record<string, boolean>
}

export type AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofStatus =
  | 'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked'
  | 'controlled_private_tool_execution_proof_blocked_pending_satori_font_fixture'
  | 'controlled_private_tool_execution_proof_deferred_non_cpu_static_runtime_boundary'
  | 'controlled_private_tool_execution_proof_blocked_missing_tool_execution_dry_run_proof'
  | 'controlled_private_tool_execution_proof_blocked_missing_phase0_execution_evidence'

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionEvidence {
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  controlledProofMode: 'accept_phase0_local_execution_evidence_without_new_tool_execution'
  approvedPlanSnapshotRef: string
  creditReservationRef: string
  privateArtifactManifestRef: string
  queuePayloadIdempotencyKey: string
  dryDispatchIdempotencyKey: string
  dryToolExecutionIdempotencyKey: string
  controlledToolExecutionIdempotencyKey: string
  sourceWorkerDispatchAttemptRef: string
  workerDispatchSmokeEvidenceRef: string
  workerDispatchSmokeTelemetryRef: string
  adapterInvocationDryRunRef: string
  toolInputContractRef: string
  expectedPrivateOutputContractRef: string
  expectedToolResultSchemaRef: string
  toolSpecificQaGateRef: string
  controlledToolExecutionEvidenceRef: string
  phase0LocalArtifactEvidenceRef: string
  phase0LocalArtifactPaths: string[]
  phase0OutputSummaryAccepted: boolean
  expectedOutputVisibility: 'private_artifact_only'
}

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME | null
  sourceToolExecutionDryRunStatus: string | null
  sourceToolExecutionDryRunProofPrepared: boolean
  sourceDryRunContractAccepted: boolean
  sourceWorkerClaimAndDispatchSmokeProofStatus: string | null
  sourceWorkerClaimAndDispatchSmokeProofAccepted: boolean
  sourceWorkerClaimAndDispatchEvidenceAccepted: boolean
  phase0Status: string | null
  phase0ImportStatus: string | null
  phase0FixtureStatus: string | null
  phase0OutputContractStatus: string | null
  controlledToolExecutionProofStatus: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofStatus
  controlledToolExecutionProofAccepted: boolean
  phase0ExecutionEvidenceAccepted: boolean
  exactRequestContractAccepted: boolean
  privateOutputManifestAccepted: boolean
  toolResultSchemaAccepted: boolean
  toolSpecificQaGateAccepted: boolean
  controlledToolExecutionEvidence: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionEvidence | null
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
  adapterInvocationProofRequired: true
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-controlled-tool-execution-proof'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION
  status: 'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_five_with_runtime_blocks'
  sourceToolExecutionDryRunProofDecision: string | null
  sourcePhase0Decision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  queueName: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME
  controlledToolExecutionPolicy: {
    mode: 'accept_phase0_local_execution_evidence_and_bind_to_private_worker_contracts_without_new_tool_execution'
    sourceToolExecutionDryRunProofRequired: true
    sourcePhase0ExecutionEvidenceRequired: true
    exactRequestContractRequired: true
    privateArtifactManifestRequired: true
    toolResultSchemaRequired: true
    toolSpecificQaGateRequired: true
    noNewToolExecutionByControlledProof: true
    noAdapterInvocationByControlledProof: true
    privateArtifactOnly: true
    gpuRuntimeOnDemandOnly: true
    nextGateRequiresExactExternalAgentExecutionAdmission: true
  }
  counts: {
    totalAiGraphicsTools: 21
    controlledToolExecutionProofAcceptedTools: number
    sourceToolExecutionDryRunProofPreparedTools: number
    sourceWorkerClaimAndDispatchSmokeProofAcceptedTools: number
    sourcePhase0ProofPassedTools: number
    exactRequestContractsAcceptedTools: number
    privateOutputManifestAcceptedTools: number
    toolResultSchemaAcceptedTools: number
    toolSpecificQaGateAcceptedTools: number
    phase0LocalArtifactEvidenceAcceptedTools: number
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
  rows: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow[]
  booleans: {
    externalAgentCpuStaticPrivateWorkerControlledToolExecutionProofCompleted: true
    sourceToolExecutionDryRunProofAccepted: boolean
    sourceWorkerClaimAndDispatchSmokeProofAccepted: boolean
    sourcePhase0ExecutionProofAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    allFiveControlledToolExecutionProofsAccepted: boolean
    allFiveSourceDryRunContractsAccepted: boolean
    allFivePhase0ExecutionEvidenceAccepted: boolean
    allFivePrivateOutputManifestsAccepted: boolean
    allFiveToolResultSchemasAccepted: boolean
    allFiveToolSpecificQaGatesAccepted: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    fifteenRuntimeDeferredToolsPreserved: boolean
    sourceDryRunContractRefsPreserved: boolean
    sourceWorkerClaimAndDispatchEvidenceRefsPreserved: boolean
    phase0LocalArtifactPolicyAccepted: boolean
    privateArtifactOnlyPolicyAccepted: true
    noNewToolExecutionByControlledProof: true
    noAdapterInvocationByControlledProof: true
    nextGateRequiresExactExternalAgentExecutionAdmission: true
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
    adapterInvocationPerformed: false
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

export interface AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofInput {
  sourceToolExecutionDryRunProofReport?: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport
  sourcePhase0Report?: AiGraphicsCpuStaticExecutionProofPhase0Report
}

function dryRunRow(
  report: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow | undefined {
  return report?.rows?.find((row) => row.toolId === toolId)
}

function phase0Tool(
  report: AiGraphicsCpuStaticExecutionProofPhase0Report | undefined,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsCpuStaticExecutionProofPhase0ToolResult | undefined {
  return report?.tools?.find((tool) => tool.toolId === toolId)
}

function sourceToolExecutionDryRunProofAccepted(
  report?: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofReport,
): boolean {
  const rows = report?.rows ?? []
  return report?.decision ===
    AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_TOOL_EXECUTION_DRY_RUN_PROOF_DECISION &&
    report.status ===
      'external_agent_cpu_static_private_worker_tool_execution_dry_run_proof_prepared_five_with_runtime_blocks' &&
    report.counts.toolExecutionDryRunProofPreparedTools === 5 &&
    report.counts.dryToolExecutionContractsPreparedTools === 5 &&
    report.counts.adapterPayloadShapeValidatedTools === 5 &&
    report.counts.privateOutputManifestContractValidatedTools === 5 &&
    report.counts.toolResultSchemaValidatedTools === 5 &&
    report.counts.satoriBlockedPendingApprovedFontFixtureTools === 1 &&
    report.counts.nonCpuStaticDeferredTools === 15 &&
    report.counts.externalAgentExecutableNowTools === 0 &&
    report.counts.externalAgentCanInvokeAdapterNowTools === 0 &&
    report.counts.workerDispatchApprovedNowTools === 0 &&
    report.counts.toolExecutionApprovedNowTools === 0 &&
    report.counts.gpuRuntimeShouldStartNowTools === 0 &&
    report.booleans.allFiveCpuStaticToolExecutionDryRunProofsPrepared === true &&
    report.booleans.allFiveDryToolExecutionContractsPrepared === true &&
    report.booleans.privateArtifactOnlyPolicyAccepted === true &&
    report.booleans.noAdapterInvocationByDryRun === true &&
    report.booleans.noToolExecutionByDryRun === true &&
    report.booleans.nextGateRequiresControlledPrivateToolExecutionProof === true &&
    report.booleans.agentCanExecuteToolsNow === false &&
    rows.length === 21 &&
    controlledExecutionProofTools.every((toolId) => {
      const row = rows.find((source) => source.toolId === toolId)
      return row?.toolExecutionDryRunStatus ===
        'private_worker_tool_execution_dry_run_proof_prepared_execution_blocked' &&
        row.dryToolExecutionProofPrepared === true &&
        row.dryToolExecutionContractPrepared === true &&
        row.adapterPayloadShapeValidated === true &&
        row.privateOutputManifestContractValidated === true &&
        row.toolResultSchemaValidated === true &&
        row.dryRunContract?.queueName ===
          AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME &&
        row.dryRunContract.toolExecutionDryRunMode ===
          'dry_contract_only_no_adapter_invocation_or_tool_execution' &&
        row.dryRunContract.expectedOutputVisibility === 'private_artifact_only' &&
        row.externalAgentCanInvokeAdapterNow === false &&
        row.toolExecutionApprovedNow === false &&
        row.gpuRuntimeShouldStartNow === false
    })
}

function sourcePhase0Accepted(report?: AiGraphicsCpuStaticExecutionProofPhase0Report): boolean {
  const tools = report?.tools ?? []
  const requiredPasses = controlledExecutionProofTools.every((toolId) => {
    const tool = tools.find((source) => source.toolId === toolId)
    return tool?.status === 'proof_passed' &&
      tool.importStatus === 'passed' &&
      tool.fixtureStatus === 'executed' &&
      tool.outputContractStatus === 'checked' &&
      Array.isArray(tool.localArtifactPaths) &&
      tool.localArtifactPaths.length > 0
  })
  const satori = tools.find((tool) => tool.toolId === 'satori')
  return report?.decision === AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE_0_DECISION &&
    report.status === 'completed_with_warnings' &&
    report.packageLockStatus === 'unchanged' &&
    requiredPasses &&
    satori?.status === 'proof_blocked_missing_runtime' &&
    /font/i.test(satori.blockedReason ?? '') &&
    report.booleans?.agentCanExecuteToolsNow === false &&
    report.booleans?.routeExecutionApprovedNow === false &&
    report.booleans?.workerExecutionApprovedNow === false &&
    report.booleans?.toolExecutionApprovedNow === false &&
    report.booleans?.runtimeReadyNow === false &&
    report.booleans?.productionReadyNow === false
}

function statusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  dryRun?: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow
  phase0?: AiGraphicsCpuStaticExecutionProofPhase0ToolResult
  dryRunAccepted: boolean
  phase0Accepted: boolean
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofStatus {
  if (controlledExecutionProofTools.includes(input.toolId)) {
    if (!input.dryRunAccepted || input.dryRun?.dryRunContract == null) {
      return 'controlled_private_tool_execution_proof_blocked_missing_tool_execution_dry_run_proof'
    }
    if (
      !input.phase0Accepted ||
      input.phase0?.status !== 'proof_passed' ||
      input.phase0.outputContractStatus !== 'checked'
    ) {
      return 'controlled_private_tool_execution_proof_blocked_missing_phase0_execution_evidence'
    }
    return 'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked'
  }
  if (input.toolId === 'satori') {
    return 'controlled_private_tool_execution_proof_blocked_pending_satori_font_fixture'
  }
  return 'controlled_private_tool_execution_proof_deferred_non_cpu_static_runtime_boundary'
}

function evidenceFor(input: {
  toolId: AiGraphicsCanonicalToolId
  dryRun?: AiGraphicsExternalAgentCpuStaticPrivateWorkerToolExecutionDryRunProofRow
  phase0?: AiGraphicsCpuStaticExecutionProofPhase0ToolResult
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofStatus
}): AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionEvidence | null {
  if (
    input.status !==
      'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked' ||
    !input.dryRun?.dryRunContract ||
    !input.phase0
  ) {
    return null
  }
  const contract = input.dryRun.dryRunContract
  const base =
    `ai-graphics/external-agent/cpu-static-private-worker-controlled-tool-execution-proof/${input.toolId}`
  return {
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    controlledProofMode: 'accept_phase0_local_execution_evidence_without_new_tool_execution',
    approvedPlanSnapshotRef: contract.approvedPlanSnapshotRef,
    creditReservationRef: contract.creditReservationRef,
    privateArtifactManifestRef: contract.privateArtifactManifestRef,
    queuePayloadIdempotencyKey: contract.queuePayloadIdempotencyKey,
    dryDispatchIdempotencyKey: contract.dryDispatchIdempotencyKey,
    dryToolExecutionIdempotencyKey: contract.dryToolExecutionIdempotencyKey,
    controlledToolExecutionIdempotencyKey: `controlled-tool-execution://${base}/idempotency`,
    sourceWorkerDispatchAttemptRef: contract.sourceWorkerDispatchAttemptRef,
    workerDispatchSmokeEvidenceRef: contract.workerDispatchSmokeEvidenceRef,
    workerDispatchSmokeTelemetryRef: contract.workerDispatchSmokeTelemetryRef,
    adapterInvocationDryRunRef: contract.adapterInvocationDryRunRef,
    toolInputContractRef: contract.toolInputContractRef,
    expectedPrivateOutputContractRef: contract.expectedPrivateOutputContractRef,
    expectedToolResultSchemaRef: contract.expectedToolResultSchemaRef,
    toolSpecificQaGateRef: contract.toolSpecificQaGateRef,
    controlledToolExecutionEvidenceRef: `controlled-tool-execution-proof://${base}/phase0-result-evidence`,
    phase0LocalArtifactEvidenceRef: `phase0-local-artifact-evidence://${base}/local-artifacts`,
    phase0LocalArtifactPaths: [...(input.phase0.localArtifactPaths ?? [])],
    phase0OutputSummaryAccepted: Boolean(input.phase0.outputSummary),
    expectedOutputVisibility: contract.expectedOutputVisibility,
  }
}

function blockerFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofStatus,
): string {
  if (
    status ===
    'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked'
  ) {
    return 'controlled proof accepted Phase 0 local execution evidence for the exact private-worker dry-run contract, but external agent adapter invocation and live tool execution remain blocked until the exact external-agent execution admission gate passes'
  }
  if (
    status === 'controlled_private_tool_execution_proof_blocked_pending_satori_font_fixture'
  ) {
    return 'Satori remains blocked pending approved font fixture proof before controlled private tool execution proof'
  }
  if (
    status ===
    'controlled_private_tool_execution_proof_blocked_missing_tool_execution_dry_run_proof'
  ) {
    return 'controlled tool execution proof is blocked because the private worker tool execution dry-run contract is missing or not accepted'
  }
  if (
    status ===
    'controlled_private_tool_execution_proof_blocked_missing_phase0_execution_evidence'
  ) {
    return 'controlled tool execution proof is blocked because Phase 0 proof_passed execution evidence is missing'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes before controlled private tool execution proof'
}

function nextProofMilestoneFor(
  status: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofStatus,
): string {
  if (
    status ===
    'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked'
  ) {
    return 'exact external-agent CPU/static private worker execution admission with adapter invocation still gated by approved snapshot, credit reservation, private artifact manifest, worker claim, QA, fallback, and checkback policy'
  }
  if (
    status === 'controlled_private_tool_execution_proof_blocked_pending_satori_font_fixture'
  ) {
    return 'approved Satori font fixture proof before controlled private tool execution proof'
  }
  if (
    status ===
    'controlled_private_tool_execution_proof_blocked_missing_tool_execution_dry_run_proof'
  ) {
    return 'repair private worker tool execution dry-run proof before controlled tool execution proof'
  }
  if (
    status ===
    'controlled_private_tool_execution_proof_blocked_missing_phase0_execution_evidence'
  ) {
    return 'repair CPU/static Phase 0 proof evidence before controlled private tool execution proof'
  }
  return 'future runtime proof and controlled private worker execution proof for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProof(
  input: AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofInput = {},
): AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofReport {
  const dryRunAccepted = sourceToolExecutionDryRunProofAccepted(
    input.sourceToolExecutionDryRunProofReport,
  )
  const workerClaimAndDispatchSourceAccepted =
    input.sourceToolExecutionDryRunProofReport?.booleans
      ?.sourceWorkerClaimAndDispatchSmokeProofAccepted === true
  const phase0Accepted = sourcePhase0Accepted(input.sourcePhase0Report)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const dryRun = dryRunRow(input.sourceToolExecutionDryRunProofReport, toolId)
    if (!dryRun) {
      throw new Error(`Missing AI graphics controlled tool execution dry-run source row for ${toolId}`)
    }
    const phase0 = phase0Tool(input.sourcePhase0Report, toolId)
    const controlledToolExecutionProofStatus = statusFor({
      toolId,
      dryRun,
      phase0,
      dryRunAccepted,
      phase0Accepted,
    })
    const controlledToolExecutionEvidence = evidenceFor({
      toolId,
      dryRun,
      phase0,
      status: controlledToolExecutionProofStatus,
    })
    const accepted =
      controlledToolExecutionProofStatus ===
        'controlled_private_tool_execution_proof_accepted_with_phase0_evidence_execution_blocked' &&
      controlledToolExecutionEvidence !== null

    return {
      toolId,
      productionToolId: dryRun.productionToolId,
      workerType: dryRun.workerType,
      runtimeTarget: dryRun.runtimeTarget,
      queueName: accepted ? AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME : null,
      sourceToolExecutionDryRunStatus: dryRun.toolExecutionDryRunStatus,
      sourceToolExecutionDryRunProofPrepared: dryRun.dryToolExecutionProofPrepared,
      sourceDryRunContractAccepted: Boolean(dryRun.dryRunContract) && dryRunAccepted,
      sourceWorkerClaimAndDispatchSmokeProofStatus:
        dryRun.sourceWorkerClaimAndDispatchSmokeProofStatus,
      sourceWorkerClaimAndDispatchSmokeProofAccepted:
        dryRun.sourceWorkerClaimAndDispatchSmokeProofAccepted,
      sourceWorkerClaimAndDispatchEvidenceAccepted:
        dryRun.sourceWorkerClaimAndDispatchEvidenceAccepted,
      phase0Status: phase0?.status ?? null,
      phase0ImportStatus: phase0?.importStatus ?? null,
      phase0FixtureStatus: phase0?.fixtureStatus ?? null,
      phase0OutputContractStatus: phase0?.outputContractStatus ?? null,
      controlledToolExecutionProofStatus,
      controlledToolExecutionProofAccepted: accepted,
      phase0ExecutionEvidenceAccepted: accepted,
      exactRequestContractAccepted: accepted,
      privateOutputManifestAccepted: accepted,
      toolResultSchemaAccepted: accepted,
      toolSpecificQaGateAccepted: accepted,
      controlledToolExecutionEvidence,
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
      adapterInvocationProofRequired: true,
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
      blocker: blockerFor(controlledToolExecutionProofStatus),
      nextProofMilestone: nextProofMilestoneFor(controlledToolExecutionProofStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticPrivateWorkerControlledToolExecutionProofRow
  })

  const acceptedRows = rows.filter((row) => row.controlledToolExecutionProofAccepted)
  const satoriBlockedRows = rows.filter(
    (row) =>
      row.controlledToolExecutionProofStatus ===
      'controlled_private_tool_execution_proof_blocked_pending_satori_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) =>
      row.controlledToolExecutionProofStatus ===
      'controlled_private_tool_execution_proof_deferred_non_cpu_static_runtime_boundary',
  )

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-cpu-static-private-worker-controlled-tool-execution-proof',
    decision:
      AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_CONTROLLED_TOOL_EXECUTION_PROOF_DECISION,
    status:
      'external_agent_cpu_static_private_worker_controlled_tool_execution_proof_prepared_five_with_runtime_blocks',
    sourceToolExecutionDryRunProofDecision:
      input.sourceToolExecutionDryRunProofReport?.decision ?? null,
    sourcePhase0Decision: input.sourcePhase0Report?.decision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...productFacingCapabilities],
    queueName: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_QUEUE_NAME,
    controlledToolExecutionPolicy: {
      mode: 'accept_phase0_local_execution_evidence_and_bind_to_private_worker_contracts_without_new_tool_execution',
      sourceToolExecutionDryRunProofRequired: true,
      sourcePhase0ExecutionEvidenceRequired: true,
      exactRequestContractRequired: true,
      privateArtifactManifestRequired: true,
      toolResultSchemaRequired: true,
      toolSpecificQaGateRequired: true,
      noNewToolExecutionByControlledProof: true,
      noAdapterInvocationByControlledProof: true,
      privateArtifactOnly: true,
      gpuRuntimeOnDemandOnly: true,
      nextGateRequiresExactExternalAgentExecutionAdmission: true,
    },
    counts: {
      totalAiGraphicsTools: 21,
      controlledToolExecutionProofAcceptedTools: acceptedRows.length,
      sourceToolExecutionDryRunProofPreparedTools:
        input.sourceToolExecutionDryRunProofReport?.counts.toolExecutionDryRunProofPreparedTools ?? 0,
      sourceWorkerClaimAndDispatchSmokeProofAcceptedTools:
        input.sourceToolExecutionDryRunProofReport?.counts
          .sourceWorkerClaimAndDispatchSmokeProofAcceptedTools ?? 0,
      sourcePhase0ProofPassedTools:
        input.sourcePhase0Report?.tools?.filter((tool) => tool.status === 'proof_passed').length ?? 0,
      exactRequestContractsAcceptedTools: rows.filter((row) => row.exactRequestContractAccepted)
        .length,
      privateOutputManifestAcceptedTools: rows.filter((row) => row.privateOutputManifestAccepted)
        .length,
      toolResultSchemaAcceptedTools: rows.filter((row) => row.toolResultSchemaAccepted).length,
      toolSpecificQaGateAcceptedTools: rows.filter((row) => row.toolSpecificQaGateAccepted)
        .length,
      phase0LocalArtifactEvidenceAcceptedTools: rows.filter(
        (row) => row.phase0ExecutionEvidenceAccepted,
      ).length,
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
      externalAgentCpuStaticPrivateWorkerControlledToolExecutionProofCompleted: true,
      sourceToolExecutionDryRunProofAccepted: dryRunAccepted,
      sourceWorkerClaimAndDispatchSmokeProofAccepted:
        workerClaimAndDispatchSourceAccepted,
      sourcePhase0ExecutionProofAccepted: phase0Accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      allFiveControlledToolExecutionProofsAccepted: acceptedRows.length === 5,
      allFiveSourceDryRunContractsAccepted:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => row.sourceDryRunContractAccepted),
      allFivePhase0ExecutionEvidenceAccepted:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => row.phase0ExecutionEvidenceAccepted),
      allFivePrivateOutputManifestsAccepted:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => row.privateOutputManifestAccepted),
      allFiveToolResultSchemasAccepted:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => row.toolResultSchemaAccepted),
      allFiveToolSpecificQaGatesAccepted:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => row.toolSpecificQaGateAccepted),
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      fifteenRuntimeDeferredToolsPreserved: nonCpuRows.length === 15,
      sourceDryRunContractRefsPreserved:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => {
          const evidence = row.controlledToolExecutionEvidence
          return Boolean(evidence) &&
            evidence!.approvedPlanSnapshotRef.startsWith('approved-plan-snapshot://') &&
            evidence!.creditReservationRef.startsWith('credit-reservation://') &&
            evidence!.privateArtifactManifestRef.startsWith('private://') &&
            evidence!.controlledToolExecutionIdempotencyKey.includes(row.toolId) &&
            evidence!.controlledToolExecutionEvidenceRef.includes(row.toolId) &&
            evidence!.expectedOutputVisibility === 'private_artifact_only'
        }),
      sourceWorkerClaimAndDispatchEvidenceRefsPreserved:
        workerClaimAndDispatchSourceAccepted &&
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => {
          const evidence = row.controlledToolExecutionEvidence
          return row.sourceWorkerClaimAndDispatchEvidenceAccepted === true &&
            Boolean(evidence) &&
            evidence!.sourceWorkerDispatchAttemptRef.startsWith(
              'worker-claim-dispatch://',
            ) &&
            evidence!.workerDispatchSmokeEvidenceRef.startsWith('private://') &&
            evidence!.workerDispatchSmokeTelemetryRef.startsWith('private://') &&
            evidence!.sourceWorkerDispatchAttemptRef.includes(row.toolId) &&
            evidence!.workerDispatchSmokeEvidenceRef.includes(row.toolId) &&
            evidence!.workerDispatchSmokeTelemetryRef.includes(row.toolId)
        }),
      phase0LocalArtifactPolicyAccepted:
        acceptedRows.length === 5 &&
        acceptedRows.every((row) => {
          const evidence = row.controlledToolExecutionEvidence
          return Boolean(evidence) &&
            evidence!.phase0LocalArtifactPaths.length > 0 &&
            evidence!.phase0LocalArtifactPaths.every((artifactPath) =>
              artifactPath.startsWith('.local-artifacts/ai-graphics/cpu-static-proof/'),
            )
        }),
      privateArtifactOnlyPolicyAccepted: true,
      noNewToolExecutionByControlledProof: true,
      noAdapterInvocationByControlledProof: true,
      nextGateRequiresExactExternalAgentExecutionAdmission: true,
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
      adapterInvocationPerformed: false,
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
      'AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_PRIVATE_WORKER_EXACT_EXECUTION_ADMISSION',
  }
}
