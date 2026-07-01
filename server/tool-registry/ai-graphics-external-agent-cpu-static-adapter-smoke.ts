import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  getAiGraphicsMappedProductionProfile,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION,
} from './ai-graphics-external-agent-tool-adapter-authorization'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION =
  'ai_graphics_external_agent_cpu_static_adapter_smoke_prepared_with_runtime_blocks'

export const AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE_0_DECISION =
  'ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings'

export const AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_TOOL_IDS = [
  'd3',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS =
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
    (capabilityId) =>
      capabilityId !== 'planning_metadata_only' &&
      capabilityId !== 'blocked_or_deferred',
  )

export type AiGraphicsExternalAgentCpuStaticAdapterSmokeStatus =
  | 'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked'
  | 'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture'
  | 'cpu_static_adapter_smoke_blocked_missing_phase0_proof'
  | 'deferred_non_cpu_static_runtime_boundary'

export interface AiGraphicsExternalAgentCpuStaticPhase0ToolResult {
  toolId: AiGraphicsCanonicalToolId
  status: string
  importStatus?: string
  fixtureStatus?: string
  outputContractStatus?: string
  blockedReason?: string | null
}

export interface AiGraphicsExternalAgentCpuStaticAdapterSmokeInput {
  sourcePhase0Decision?: string
  sourcePhase0Status?: string
  sourcePhase0Tools?: AiGraphicsExternalAgentCpuStaticPhase0ToolResult[]
  sourceAdapterAuthorizationDecision?: string
  sourceAdapterAuthorizationStatus?: string
  sourceAdapterAuthorizationRows?: number
  sourceAdapterContractsAuthorizedWithRuntimeBlocks?: number
  sourceAdapterExternalAgentCanInvokeAdapterNowTools?: number
  sourceAdapterToolExecutionApprovedNowTools?: number
  sourceAdapterGpuRuntimeShouldStartNowTools?: number
}

export interface AiGraphicsExternalAgentCpuStaticAdapterSmokeRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  cpuStaticCohortTool: boolean
  phase0Status: string | null
  phase0ImportStatus: string | null
  phase0FixtureStatus: string | null
  phase0OutputContractStatus: string | null
  adapterSmokeStatus: AiGraphicsExternalAgentCpuStaticAdapterSmokeStatus
  adapterSmokePreparedWithProvidedEvidence: boolean
  privateOutputContractPrepared: boolean
  satoriApprovedFontFixtureRequired: boolean
  externalAgentCanInvokeAdapterNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
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

export interface AiGraphicsExternalAgentCpuStaticAdapterSmokeReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-adapter-smoke'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION
  status: 'external_agent_cpu_static_adapter_smoke_prepared_five_ready_one_blocked_execution_blocked'
  sourcePhase0Decision: string | null
  sourceAdapterAuthorizationDecision: string | null
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  tools: AiGraphicsCanonicalToolId[]
  capabilities: string[]
  counts: {
    totalAiGraphicsTools: 21
    cpuStaticCohortTools: 6
    cpuStaticAdapterSmokeReadyTools: number
    cpuStaticAdapterSmokeBlockedTools: number
    satoriBlockedPendingApprovedFontFixtureTools: number
    nonCpuStaticDeferredTools: number
    sourceAdapterAuthorizationRows: number
    sourceAdapterContractsAuthorizedWithRuntimeBlocks: number
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentExecutableNowTools: 0
    toolExecutionApprovedNowTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentCpuStaticAdapterSmokeRow[]
  booleans: {
    externalAgentCpuStaticAdapterSmokePrepared: true
    sourcePhase0Accepted: boolean
    sourceAdapterAuthorizationAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    cpuStaticCohortCovered: boolean
    fiveCpuStaticAdapterSmokeReadyWithPrivateOutputContracts: boolean
    satoriBlockedPendingApprovedFontFixture: boolean
    nonCpuStaticToolsDeferredByRuntimeBoundary: boolean
    privateOutputContractsPreparedForPassedCpuStaticTools: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    externalAgentCanInvokeAdapterNow: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
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

function isCpuStaticTool(toolId: AiGraphicsCanonicalToolId): boolean {
  return AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_TOOL_IDS.includes(toolId)
}

function phase0Tool(
  input: AiGraphicsExternalAgentCpuStaticAdapterSmokeInput,
  toolId: AiGraphicsCanonicalToolId,
): AiGraphicsExternalAgentCpuStaticPhase0ToolResult | undefined {
  return input.sourcePhase0Tools?.find((tool) => tool.toolId === toolId)
}

function sourcePhase0Accepted(input: AiGraphicsExternalAgentCpuStaticAdapterSmokeInput): boolean {
  const tools = input.sourcePhase0Tools ?? []
  const requiredToolsPresent = AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_TOOL_IDS.every(
    (toolId) => tools.some((tool) => tool.toolId === toolId),
  )
  const expectedPasses = ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js'].every(
    (toolId) => tools.find((tool) => tool.toolId === toolId)?.status === 'proof_passed',
  )
  const satori = tools.find((tool) => tool.toolId === 'satori')
  return input.sourcePhase0Decision === AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE_0_DECISION &&
    input.sourcePhase0Status === 'completed_with_warnings' &&
    requiredToolsPresent &&
    expectedPasses &&
    satori?.status === 'proof_blocked_missing_runtime' &&
    /font/i.test(satori.blockedReason ?? '')
}

function sourceAdapterAuthorizationAccepted(
  input: AiGraphicsExternalAgentCpuStaticAdapterSmokeInput,
): boolean {
  return input.sourceAdapterAuthorizationDecision ===
    AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION &&
    input.sourceAdapterAuthorizationStatus ===
      'external_agent_tool_adapter_authorization_prepared_all_21_execution_blocked' &&
    input.sourceAdapterAuthorizationRows === 21 &&
    input.sourceAdapterContractsAuthorizedWithRuntimeBlocks === 21 &&
    input.sourceAdapterExternalAgentCanInvokeAdapterNowTools === 0 &&
    input.sourceAdapterToolExecutionApprovedNowTools === 0 &&
    input.sourceAdapterGpuRuntimeShouldStartNowTools === 0
}

function smokeStatusFor(input: {
  toolId: AiGraphicsCanonicalToolId
  phase0?: AiGraphicsExternalAgentCpuStaticPhase0ToolResult
  phase0Accepted: boolean
  adapterAccepted: boolean
}): AiGraphicsExternalAgentCpuStaticAdapterSmokeStatus {
  if (!isCpuStaticTool(input.toolId)) return 'deferred_non_cpu_static_runtime_boundary'
  if (input.toolId === 'satori') {
    return 'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture'
  }
  if (input.phase0Accepted && input.adapterAccepted && input.phase0?.status === 'proof_passed') {
    return 'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked'
  }
  return 'cpu_static_adapter_smoke_blocked_missing_phase0_proof'
}

function blockerFor(status: AiGraphicsExternalAgentCpuStaticAdapterSmokeStatus): string {
  if (status === 'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked') {
    return 'adapter smoke contract is ready, but external-agent execution remains blocked until Tool Route, Worker, private artifact, QA, fallback, and checkback gates authorize a real tool call'
  }
  if (status === 'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture') {
    return 'Satori remains blocked pending approved font fixture evidence for text SVG layout'
  }
  if (status === 'cpu_static_adapter_smoke_blocked_missing_phase0_proof') {
    return 'CPU/static Phase 0 proof did not provide an accepted proof_passed result for this tool'
  }
  return 'non-CPU/static tools remain deferred to browser/canvas/WebGL or GPU/model runtime proof lanes'
}

function nextProofMilestoneFor(status: AiGraphicsExternalAgentCpuStaticAdapterSmokeStatus): string {
  if (status === 'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked') {
    return 'private worker-handoff execution admission for this CPU/static adapter with private output manifest and no public artifact'
  }
  if (status === 'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture') {
    return 'approved Satori font fixture proof before adapter smoke can become ready'
  }
  if (status === 'cpu_static_adapter_smoke_blocked_missing_phase0_proof') {
    return 'rerun or repair CPU/static Phase 0 proof for the missing tool result'
  }
  return 'future runtime proof for browser/canvas/WebGL or GPU/model worker target'
}

export function buildAiGraphicsExternalAgentCpuStaticAdapterSmoke(
  input: AiGraphicsExternalAgentCpuStaticAdapterSmokeInput = {},
): AiGraphicsExternalAgentCpuStaticAdapterSmokeReport {
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const phase0Accepted = sourcePhase0Accepted(input)
  const adapterAccepted = sourceAdapterAuthorizationAccepted(input)

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const readiness = readinessRecords.find((record) => record.toolId === toolId)
    const productionProfile = getAiGraphicsMappedProductionProfile(toolId)
    if (
      !readiness ||
      !readiness.productionToolId ||
      !productionProfile ||
      readiness.productionWorkerType === 'none'
    ) {
      throw new Error(`Missing AI graphics CPU/static adapter smoke readiness for ${toolId}`)
    }

    const phase0 = phase0Tool(input, toolId)
    const adapterSmokeStatus = smokeStatusFor({
      toolId,
      phase0,
      phase0Accepted,
      adapterAccepted,
    })
    const smokeReady =
      adapterSmokeStatus ===
      'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked'
    return {
      toolId,
      productionToolId: readiness.productionToolId,
      workerType: productionProfile.workerType,
      runtimeTarget: readiness.runtimeTarget,
      cpuStaticCohortTool: isCpuStaticTool(toolId),
      phase0Status: phase0?.status ?? null,
      phase0ImportStatus: phase0?.importStatus ?? null,
      phase0FixtureStatus: phase0?.fixtureStatus ?? null,
      phase0OutputContractStatus: phase0?.outputContractStatus ?? null,
      adapterSmokeStatus,
      adapterSmokePreparedWithProvidedEvidence: smokeReady,
      privateOutputContractPrepared: smokeReady,
      satoriApprovedFontFixtureRequired:
        adapterSmokeStatus === 'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture',
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      blocker: blockerFor(adapterSmokeStatus),
      nextProofMilestone: nextProofMilestoneFor(adapterSmokeStatus),
    } satisfies AiGraphicsExternalAgentCpuStaticAdapterSmokeRow
  })

  const cpuStaticRows = rows.filter((row) => row.cpuStaticCohortTool)
  const smokeReadyRows = rows.filter(
    (row) =>
      row.adapterSmokeStatus ===
      'cpu_static_adapter_smoke_ready_private_output_contract_execution_blocked',
  )
  const satoriBlockedRows = rows.filter(
    (row) =>
      row.adapterSmokeStatus ===
      'cpu_static_adapter_smoke_blocked_pending_approved_font_fixture',
  )
  const nonCpuRows = rows.filter(
    (row) => row.adapterSmokeStatus === 'deferred_non_cpu_static_runtime_boundary',
  )

  return {
    schemaVersion: '2026-07-01.ai-graphics.external-agent-cpu-static-adapter-smoke',
    decision: AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_ADAPTER_SMOKE_DECISION,
    status:
      'external_agent_cpu_static_adapter_smoke_prepared_five_ready_one_blocked_execution_blocked',
    sourcePhase0Decision: input.sourcePhase0Decision ?? null,
    sourceAdapterAuthorizationDecision: input.sourceAdapterAuthorizationDecision ?? null,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    tools: [...AI_GRAPHICS_CANONICAL_TOOL_IDS],
    capabilities: [...AI_GRAPHICS_PRODUCT_FACING_CAPABILITY_IDS],
    counts: {
      totalAiGraphicsTools: 21,
      cpuStaticCohortTools: cpuStaticRows.length,
      cpuStaticAdapterSmokeReadyTools: smokeReadyRows.length,
      cpuStaticAdapterSmokeBlockedTools: cpuStaticRows.length - smokeReadyRows.length,
      satoriBlockedPendingApprovedFontFixtureTools: satoriBlockedRows.length,
      nonCpuStaticDeferredTools: nonCpuRows.length,
      sourceAdapterAuthorizationRows: input.sourceAdapterAuthorizationRows ?? 0,
      sourceAdapterContractsAuthorizedWithRuntimeBlocks:
        input.sourceAdapterContractsAuthorizedWithRuntimeBlocks ?? 0,
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentExecutableNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentCpuStaticAdapterSmokePrepared: true,
      sourcePhase0Accepted: phase0Accepted,
      sourceAdapterAuthorizationAccepted: adapterAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      cpuStaticCohortCovered: cpuStaticRows.length === 6,
      fiveCpuStaticAdapterSmokeReadyWithPrivateOutputContracts:
        smokeReadyRows.length === 5,
      satoriBlockedPendingApprovedFontFixture: satoriBlockedRows.length === 1,
      nonCpuStaticToolsDeferredByRuntimeBoundary: nonCpuRows.length === 15,
      privateOutputContractsPreparedForPassedCpuStaticTools:
        smokeReadyRows.length === 5 &&
        smokeReadyRows.every((row) => row.privateOutputContractPrepared),
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
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
      'external-agent CPU/static private worker-handoff admission for the five ready adapter-smoke tools, while Satori waits for approved font fixture proof and browser/GPU tools remain deferred',
  }
}
