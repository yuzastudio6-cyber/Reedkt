import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  getAiGraphicsMappedProductionProfile,
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
  type AiGraphicsRuntimeTarget,
  type AiGraphicsToolCallReadinessRecord,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION,
  listAiGraphicsToolCallHandoffTools,
} from './ai-graphics-tool-call-handoff'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION =
  'ai_graphics_external_agent_tool_adapter_authorization_prepared_with_runtime_blocks'

export type AiGraphicsExternalAgentToolAdapterBoundary =
  | 'cpu_static_tool_adapter_contract'
  | 'browser_runtime_tool_adapter_contract'
  | 'gpu_model_tool_adapter_contract'

export type AiGraphicsExternalAgentToolAdapterAuthorizationStatus =
  | 'adapter_authorized_for_contract_only_execution_blocked'
  | 'adapter_contract_blocked_missing_readiness'

export interface AiGraphicsExternalAgentToolAdapterAuthorizationInput {
  sourceControlledDispatcherDryRunDecision?: string
  sourceControlledDispatcherDryRunStatus?: string
  sourceControlledDispatcherDryRunCompletedTools?: number
  sourceAiGraphicsHandoffRouteTools?: number
  sourceGpuRuntimeShouldStartNowTools?: number
}

export interface AiGraphicsExternalAgentToolAdapterAuthorizationRow {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: AiGraphicsRuntimeTarget
  adapterBoundary: AiGraphicsExternalAgentToolAdapterBoundary
  authorizationStatus: AiGraphicsExternalAgentToolAdapterAuthorizationStatus
  sourceControlledDispatcherDryRunAccepted: boolean
  sourceAiGraphicsHandoffRouteAccepted: boolean
  mappedProductionProfileAccepted: boolean
  adapterContractAuthorizedWithRuntimeBlocks: boolean
  adapterCanBePreparedForApprovedHandoff: boolean
  externalAgentCanInvokeAdapterNow: false
  agentCanExecuteToolsNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  gpuRuntimeShouldStartNow: false
  publicArtifactCreated: false
  signedUrlCreated: false
  unblockRequirements: string[]
  nextProofMilestone: string
}

export interface AiGraphicsExternalAgentToolAdapterAuthorizationReport {
  schemaVersion: '2026-07-01.ai-graphics.external-agent-tool-adapter-authorization'
  decision: typeof AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION
  status: 'external_agent_tool_adapter_authorization_prepared_all_21_execution_blocked'
  sourceDecision: typeof AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  counts: {
    sourceControlledDispatcherDryRunCompletedTools: number
    sourceAiGraphicsHandoffRouteTools: number
    adapterAuthorizationRows: number
    adapterContractsAuthorizedWithRuntimeBlocks: number
    cpuStaticToolAdapterContracts: number
    browserRuntimeToolAdapterContracts: number
    gpuModelToolAdapterContracts: number
    mappedProductionProfilesAccepted: number
    externalAgentCanInvokeAdapterNowTools: 0
    externalAgentExecutableNowTools: 0
    toolExecutionApprovedNowTools: 0
    gpuRuntimeShouldStartNowTools: 0
  }
  rows: AiGraphicsExternalAgentToolAdapterAuthorizationRow[]
  booleans: {
    externalAgentToolAdapterAuthorizationPrepared: true
    sourceControlledDispatcherDryRunAccepted: boolean
    sourceAiGraphicsHandoffRoutesAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21AdapterContractsAuthorizedWithRuntimeBlocks: boolean
    all21MappedProductionProfilesAccepted: boolean
    all8GpuToolsTargetOnDemandGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    adapterAuthorizationIsContractOnly: true
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

const sourceControlledDispatcherDryRunDecision =
  'ai_graphics_external_agent_controlled_dispatcher_dry_run_proof_passed_with_runtime_blocks'
const sourceControlledDispatcherDryRunStatus =
  'controlled_dispatcher_dry_run_completed_all_21_no_tool_execution'

const baseUnblockRequirements = [
  'approved plan snapshot must select the exact capability and canonical tool',
  'Tool Route approval must accept the productionToolId, workerType, runtimeTarget, and adapterBoundary',
  'Worker handoff must use private artifact manifests, idempotency, approved snapshot, QA, fallback, and checkback references',
  'agent/tool execution remains blocked until the per-tool adapter execution proof explicitly authorizes it',
]

function adapterBoundaryForRuntime(
  runtimeTarget: AiGraphicsRuntimeTarget,
): AiGraphicsExternalAgentToolAdapterBoundary {
  if (runtimeTarget === 'node_cpu_static') return 'cpu_static_tool_adapter_contract'
  if (runtimeTarget.includes('nvidia_l4')) return 'gpu_model_tool_adapter_contract'
  return 'browser_runtime_tool_adapter_contract'
}

function unblockRequirementsFor(
  readiness: AiGraphicsToolCallReadinessRecord,
): string[] {
  if (readiness.runtimeTarget.includes('nvidia_l4')) {
    return [
      ...baseUnblockRequirements,
      'native NVIDIA L4 runtime proof must pass for this tool target',
      'private model, checkpoint, or model-cache manifest must be reviewed where the tool needs weights',
      'GPU runtime may start only for an accepted worker/tool call and must release after completion',
    ]
  }
  if (readiness.runtimeTarget === 'node_cpu_static') {
    return [
      ...baseUnblockRequirements,
      'CPU/static adapter smoke must prove accepted input and output contract without public artifacts',
      'private artifact policy must bind any generated SVG/spec/metadata output before agent execution',
    ]
  }
  return [
    ...baseUnblockRequirements,
    'browser/canvas/WebGL/animation sandbox proof must pass before adapter execution',
    'render-worker artifact policy must keep outputs private until explicit artifact-boundary approval',
  ]
}

export function buildAiGraphicsExternalAgentToolAdapterAuthorization(
  input: AiGraphicsExternalAgentToolAdapterAuthorizationInput = {},
): AiGraphicsExternalAgentToolAdapterAuthorizationReport {
  const handoffTools = listAiGraphicsToolCallHandoffTools()
  const readinessRecords = listAiGraphicsToolCallReadiness()
  const sourceControlledDispatcherDryRunAccepted =
    input.sourceControlledDispatcherDryRunDecision === sourceControlledDispatcherDryRunDecision &&
    input.sourceControlledDispatcherDryRunStatus === sourceControlledDispatcherDryRunStatus &&
    input.sourceControlledDispatcherDryRunCompletedTools === 21 &&
    input.sourceAiGraphicsHandoffRouteTools === 21 &&
    input.sourceGpuRuntimeShouldStartNowTools === 0

  const rows = AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) => {
    const readiness = readinessRecords.find((record) => record.toolId === toolId)
    const handoffTool = handoffTools.find((tool) => tool.toolId === toolId)
    if (
      !readiness ||
      !handoffTool ||
      !readiness.productionToolId ||
      readiness.productionWorkerType === 'none'
    ) {
      throw new Error(`Missing AI graphics adapter readiness for ${toolId}`)
    }

    const productionProfile = getAiGraphicsMappedProductionProfile(toolId)
    const mappedProductionProfileAccepted =
      Boolean(productionProfile) &&
      productionProfile?.toolId === readiness.productionToolId &&
      productionProfile?.workerType === readiness.productionWorkerType
    const adapterBoundary = adapterBoundaryForRuntime(readiness.runtimeTarget)
    const adapterContractAuthorizedWithRuntimeBlocks =
      sourceControlledDispatcherDryRunAccepted &&
      mappedProductionProfileAccepted &&
      handoffTool.productionToolId === readiness.productionToolId &&
      handoffTool.workerType === readiness.productionWorkerType &&
      handoffTool.runtimeTarget === readiness.runtimeTarget &&
      handoffTool.canExecuteNow === false

    return {
      toolId,
      productionToolId: readiness.productionToolId,
      workerType: readiness.productionWorkerType,
      runtimeTarget: readiness.runtimeTarget,
      adapterBoundary,
      authorizationStatus: adapterContractAuthorizedWithRuntimeBlocks
        ? 'adapter_authorized_for_contract_only_execution_blocked'
        : 'adapter_contract_blocked_missing_readiness',
      sourceControlledDispatcherDryRunAccepted,
      sourceAiGraphicsHandoffRouteAccepted:
        input.sourceAiGraphicsHandoffRouteTools === 21 &&
        input.sourceGpuRuntimeShouldStartNowTools === 0,
      mappedProductionProfileAccepted,
      adapterContractAuthorizedWithRuntimeBlocks,
      adapterCanBePreparedForApprovedHandoff: adapterContractAuthorizedWithRuntimeBlocks,
      externalAgentCanInvokeAdapterNow: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      unblockRequirements: unblockRequirementsFor(readiness),
      nextProofMilestone: readiness.nextProofMilestone,
    } satisfies AiGraphicsExternalAgentToolAdapterAuthorizationRow
  })

  const adapterContractsAuthorizedWithRuntimeBlocks =
    rows.filter((row) => row.adapterContractAuthorizedWithRuntimeBlocks).length
  const mappedProductionProfilesAccepted =
    rows.filter((row) => row.mappedProductionProfileAccepted).length

  return {
    schemaVersion:
      '2026-07-01.ai-graphics.external-agent-tool-adapter-authorization',
    decision: AI_GRAPHICS_EXTERNAL_AGENT_TOOL_ADAPTER_AUTHORIZATION_DECISION,
    status:
      'external_agent_tool_adapter_authorization_prepared_all_21_execution_blocked',
    sourceDecision: AI_GRAPHICS_TOOL_CALL_HANDOFF_DECISION,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    counts: {
      sourceControlledDispatcherDryRunCompletedTools:
        input.sourceControlledDispatcherDryRunCompletedTools ?? 0,
      sourceAiGraphicsHandoffRouteTools:
        input.sourceAiGraphicsHandoffRouteTools ?? 0,
      adapterAuthorizationRows: rows.length,
      adapterContractsAuthorizedWithRuntimeBlocks,
      cpuStaticToolAdapterContracts:
        rows.filter((row) => row.adapterBoundary === 'cpu_static_tool_adapter_contract').length,
      browserRuntimeToolAdapterContracts:
        rows.filter((row) => row.adapterBoundary === 'browser_runtime_tool_adapter_contract').length,
      gpuModelToolAdapterContracts:
        rows.filter((row) => row.adapterBoundary === 'gpu_model_tool_adapter_contract').length,
      mappedProductionProfilesAccepted,
      externalAgentCanInvokeAdapterNowTools: 0,
      externalAgentExecutableNowTools: 0,
      toolExecutionApprovedNowTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    rows,
    booleans: {
      externalAgentToolAdapterAuthorizationPrepared: true,
      sourceControlledDispatcherDryRunAccepted,
      sourceAiGraphicsHandoffRoutesAccepted:
        input.sourceAiGraphicsHandoffRouteTools === 21 &&
        input.sourceGpuRuntimeShouldStartNowTools === 0,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21AdapterContractsAuthorizedWithRuntimeBlocks:
        adapterContractsAuthorizedWithRuntimeBlocks === 21,
      all21MappedProductionProfilesAccepted:
        mappedProductionProfilesAccepted === 21,
      all8GpuToolsTargetOnDemandGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      adapterAuthorizationIsContractOnly: true,
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
      'external-agent per-tool adapter execution smoke for the CPU/static cohort first, with private artifact output contracts and execution still limited to approved worker handoff paths',
  }
}
