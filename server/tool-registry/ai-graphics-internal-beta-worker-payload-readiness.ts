import {
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  listAiGraphicsToolCallHandoffTools,
} from './ai-graphics-tool-call-handoff'
import {
  AI_GRAPHICS_INTERNAL_BETA_DRY_RUN_READINESS_DECISION,
  buildAiGraphicsInternalBetaDryRunReadiness,
  type AiGraphicsInternalBetaDryRunReadiness,
  type AiGraphicsInternalBetaDryRunReadinessInput,
} from './ai-graphics-internal-beta-dry-run-readiness'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_WORKER_PAYLOAD_READINESS_DECISION =
  'ai_graphics_internal_beta_worker_payload_readiness_contract_prepared_with_fail_closed_runtime'

export type AiGraphicsInternalBetaWorkerPayloadReadinessStatus =
  | 'missing_technical_evidence'
  | 'awaiting_owner_approval'
  | 'owner_approved_worker_payloads_ready'

export interface AiGraphicsInternalBetaWorkerPayloadReadinessInput
  extends AiGraphicsInternalBetaDryRunReadinessInput {}

export interface AiGraphicsInternalBetaWorkerPayload {
  jobId: string
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  editPlanId: string
  workerType: ProductionRegistryWorkerType
  executionMode: 'metadata_dry_run_payload_only'
  idempotencyKey: string
  attempt: 0
  maxAttempts: 1
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  toolStrategyId: string
  privateArtifactManifestRef: string
  expectedOutputRefs: string[]
  payloadReadyWithProvidedEvidence: boolean
  canQueueWorkerNow: false
  canExecuteWorkerNow: false
  canCallProviderNow: false
  canCreatePublicArtifactNow: false
  blockedRuntimeActions: string[]
}

export interface AiGraphicsInternalBetaCapabilityPayloadScenario {
  capabilityId: AiGraphicsCapabilityId
  selectedToolPayloads: AiGraphicsCanonicalToolId[]
  payloadReadyToolsWithProvidedEvidence: AiGraphicsCanonicalToolId[]
  scenarioPayloadReadyWithProvidedEvidence: boolean
  canQueueWorkersNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsInternalBetaWorkerPayloadReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_WORKER_PAYLOAD_READINESS_DECISION
  sourceInternalBetaDryRunDecision: typeof AI_GRAPHICS_INTERNAL_BETA_DRY_RUN_READINESS_DECISION
  status: AiGraphicsInternalBetaWorkerPayloadReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  workerPayloadsPrepared: 21
  capabilityPayloadScenariosPrepared: 12
  workerPayloadsReadyWithProvidedEvidence: number
  capabilityPayloadScenariosReadyWithProvidedEvidence: number
  workerPayloadsReadyNow: 0
  capabilityPayloadScenariosReadyNow: 0
  sourceMetadataDryRunAccepted: boolean
  ownerApprovedPayloadEvidenceAccepted: boolean
  sourceDryRunReadiness: AiGraphicsInternalBetaDryRunReadiness
  allowedPayloadActions: string[]
  blockedRuntimeActions: string[]
  workerPayloads: AiGraphicsInternalBetaWorkerPayload[]
  capabilityPayloadScenarios: AiGraphicsInternalBetaCapabilityPayloadScenario[]
  booleans: {
    internalBetaWorkerPayloadReadinessContractPrepared: true
    sourceMetadataDryRunAccepted: boolean
    ownerApprovedPayloadEvidenceAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21WorkerPayloadsPrepared: true
    all12CapabilityPayloadScenariosPrepared: true
    all21WorkerPayloadsReadyWithProvidedEvidence: boolean
    all12CapabilityPayloadScenariosReadyWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
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
}

const allowedPayloadActions = [
  'build approved-snapshot worker payload metadata',
  'assign productionToolId, workerType, runtimeTarget, and capability ids',
  'assign deterministic idempotency keys',
  'reference private artifact manifest records without logging private refs',
  'record expected metadata-only output references',
  'return queue and execution blockers without enqueueing work',
]

const blockedRuntimeActions = [
  'worker queue enqueue',
  'worker execution',
  'tool execution',
  'Tool Route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'internal beta runtime unlock',
  'external beta unlock',
  'production unlock',
]

function statusFromDryRun(
  dryRun: AiGraphicsInternalBetaDryRunReadiness,
): AiGraphicsInternalBetaWorkerPayloadReadinessStatus {
  if (dryRun.status === 'missing_technical_evidence') return 'missing_technical_evidence'
  if (dryRun.status === 'awaiting_owner_approval') return 'awaiting_owner_approval'
  return dryRun.internalBetaMetadataDryRunReadyWithProvidedEvidence
    ? 'owner_approved_worker_payloads_ready'
    : 'missing_technical_evidence'
}

function idPart(value: string): string {
  return value.replace(/[^a-z0-9_]+/gi, '_').toLowerCase()
}

export function buildAiGraphicsInternalBetaWorkerPayloadReadiness(
  input: AiGraphicsInternalBetaWorkerPayloadReadinessInput = {},
): AiGraphicsInternalBetaWorkerPayloadReadiness {
  const sourceDryRunReadiness = buildAiGraphicsInternalBetaDryRunReadiness(input)
  const status = statusFromDryRun(sourceDryRunReadiness)
  const ownerApprovedPayloadEvidenceAccepted = status === 'owner_approved_worker_payloads_ready'
  const handoffToolsById = new Map(listAiGraphicsToolCallHandoffTools().map((tool) => [tool.toolId, tool]))

  const workerPayloads = sourceDryRunReadiness.toolCases.map((toolCase): AiGraphicsInternalBetaWorkerPayload => {
    const handoffTool = handoffToolsById.get(toolCase.toolId)
    const payloadReadyWithProvidedEvidence =
      ownerApprovedPayloadEvidenceAccepted &&
      toolCase.metadataDryRunReadyWithProvidedEvidence

    return {
      jobId: `ai-graphics-beta-${idPart(toolCase.toolId)}-metadata-payload`,
      workspaceId: 'workspace_ai_graphics_internal_beta_fixture',
      projectId: 'project_ai_graphics_internal_beta_fixture',
      approvedSnapshotId: 'approved_snapshot_ai_graphics_internal_beta_fixture',
      editPlanId: 'edit_plan_ai_graphics_internal_beta_fixture',
      workerType: toolCase.workerType,
      executionMode: 'metadata_dry_run_payload_only',
      idempotencyKey: `ai_graphics_beta_${idPart(toolCase.toolId)}_metadata_payload_v1`,
      attempt: 0,
      maxAttempts: 1,
      toolId: toolCase.toolId,
      productionToolId: toolCase.productionToolId,
      runtimeTarget: toolCase.runtimeTarget,
      capabilityIds: handoffTool?.capabilities ?? [],
      toolStrategyId: `tool_strategy_${idPart(toolCase.toolId)}_internal_beta_metadata`,
      privateArtifactManifestRef: 'private-artifact-manifest-ref-redacted-ai-graphics-internal-beta',
      expectedOutputRefs: [
        `metadata://ai-graphics/internal-beta/${toolCase.toolId}/selection`,
        `metadata://ai-graphics/internal-beta/${toolCase.toolId}/blockers`,
        `metadata://ai-graphics/internal-beta/${toolCase.toolId}/next-proof-milestone`,
      ],
      payloadReadyWithProvidedEvidence,
      canQueueWorkerNow: false,
      canExecuteWorkerNow: false,
      canCallProviderNow: false,
      canCreatePublicArtifactNow: false,
      blockedRuntimeActions,
    }
  })

  const capabilityPayloadScenarios = sourceDryRunReadiness.capabilityCases.map((capability): AiGraphicsInternalBetaCapabilityPayloadScenario => {
    const payloadReadyToolsWithProvidedEvidence = capability.selectedPlanningTools.filter((toolId) => (
      workerPayloads.find((payload) => payload.toolId === toolId)?.payloadReadyWithProvidedEvidence === true
    ))

    return {
      capabilityId: capability.capabilityId,
      selectedToolPayloads: capability.selectedPlanningTools,
      payloadReadyToolsWithProvidedEvidence,
      scenarioPayloadReadyWithProvidedEvidence: payloadReadyToolsWithProvidedEvidence.length > 0,
      canQueueWorkersNow: false,
      canExecuteToolsNow: false,
    }
  })

  const workerPayloadsReadyWithProvidedEvidence =
    workerPayloads.filter((payload) => payload.payloadReadyWithProvidedEvidence).length
  const capabilityPayloadScenariosReadyWithProvidedEvidence =
    capabilityPayloadScenarios.filter((scenario) => scenario.scenarioPayloadReadyWithProvidedEvidence).length
  const all21WorkerPayloadsReadyWithProvidedEvidence =
    workerPayloadsReadyWithProvidedEvidence === 21
  const all12CapabilityPayloadScenariosReadyWithProvidedEvidence =
    capabilityPayloadScenariosReadyWithProvidedEvidence === 12

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_WORKER_PAYLOAD_READINESS_DECISION,
    sourceInternalBetaDryRunDecision: AI_GRAPHICS_INTERNAL_BETA_DRY_RUN_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    workerPayloadsPrepared: workerPayloads.length as 21,
    capabilityPayloadScenariosPrepared: capabilityPayloadScenarios.length as 12,
    workerPayloadsReadyWithProvidedEvidence,
    capabilityPayloadScenariosReadyWithProvidedEvidence,
    workerPayloadsReadyNow: 0,
    capabilityPayloadScenariosReadyNow: 0,
    sourceMetadataDryRunAccepted: sourceDryRunReadiness.internalBetaMetadataDryRunReadyWithProvidedEvidence,
    ownerApprovedPayloadEvidenceAccepted,
    sourceDryRunReadiness,
    allowedPayloadActions,
    blockedRuntimeActions,
    workerPayloads,
    capabilityPayloadScenarios,
    booleans: {
      internalBetaWorkerPayloadReadinessContractPrepared: true,
      sourceMetadataDryRunAccepted: sourceDryRunReadiness.internalBetaMetadataDryRunReadyWithProvidedEvidence,
      ownerApprovedPayloadEvidenceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21WorkerPayloadsPrepared: true,
      all12CapabilityPayloadScenariosPrepared: true,
      all21WorkerPayloadsReadyWithProvidedEvidence,
      all12CapabilityPayloadScenariosReadyWithProvidedEvidence,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
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
  }
}
