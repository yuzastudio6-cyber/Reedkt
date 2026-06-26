import {
  AI_GRAPHICS_INTERNAL_BETA_WORKER_PAYLOAD_READINESS_DECISION,
  buildAiGraphicsInternalBetaWorkerPayloadReadiness,
  type AiGraphicsInternalBetaWorkerPayload,
  type AiGraphicsInternalBetaWorkerPayloadReadiness,
  type AiGraphicsInternalBetaWorkerPayloadReadinessInput,
} from './ai-graphics-internal-beta-worker-payload-readiness'
import type {
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'
import type { ProductionRegistryWorkerType } from './production-tool-types'

export const AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION =
  'ai_graphics_internal_beta_production_worker_job_readiness_contract_prepared_with_fail_closed_runtime'

export type AiGraphicsInternalBetaProductionWorkerJobReadinessStatus =
  | 'missing_technical_evidence'
  | 'awaiting_owner_approval'
  | 'owner_approved_production_worker_jobs_ready'

export interface AiGraphicsInternalBetaProductionWorkerJobReadinessInput
  extends AiGraphicsInternalBetaWorkerPayloadReadinessInput {}

export interface AiGraphicsInternalBetaProductionWorkerJobCandidate {
  sourceToolId: AiGraphicsInternalBetaWorkerPayload['toolId']
  sourceProductionToolId: AiGraphicsInternalBetaWorkerPayload['productionToolId']
  sourceRuntimeTarget: AiGraphicsInternalBetaWorkerPayload['runtimeTarget']
  sourcePayloadReadyWithProvidedEvidence: boolean
  productionWorkerJobPayload: ProductionWorkerJobPayload
  productionWorkerJobShapeValid: boolean
  productionWorkerJobReadyWithProvidedEvidence: boolean
  canEnqueueProductionWorkerJobNow: false
  canRunProductionWorkerRouteNow: false
  canExecuteToolNow: false
  blockedRuntimeActions: string[]
}

export interface AiGraphicsInternalBetaProductionWorkerCapabilityJobScenario {
  capabilityId: string
  selectedToolJobPayloads: AiGraphicsInternalBetaWorkerPayload['toolId'][]
  readyToolJobPayloadsWithProvidedEvidence: AiGraphicsInternalBetaWorkerPayload['toolId'][]
  scenarioProductionWorkerJobsReadyWithProvidedEvidence: boolean
  canEnqueueProductionWorkerJobsNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsInternalBetaProductionWorkerJobReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION
  sourceInternalBetaWorkerPayloadDecision: typeof AI_GRAPHICS_INTERNAL_BETA_WORKER_PAYLOAD_READINESS_DECISION
  status: AiGraphicsInternalBetaProductionWorkerJobReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  productionWorkerJobPayloadsPrepared: 21
  capabilityProductionWorkerJobScenariosPrepared: 12
  productionWorkerJobPayloadsReadyWithProvidedEvidence: number
  capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence: number
  productionWorkerJobPayloadsReadyNow: 0
  capabilityProductionWorkerJobScenariosReadyNow: 0
  sourceWorkerPayloadReadiness: AiGraphicsInternalBetaWorkerPayloadReadiness
  sourceWorkerPayloadEvidenceAccepted: boolean
  ownerApprovedProductionWorkerJobEvidenceAccepted: boolean
  allowedPreparationActions: string[]
  blockedRuntimeActions: string[]
  jobPayloadFields: string[]
  productionWorkerJobPayloads: AiGraphicsInternalBetaProductionWorkerJobCandidate[]
  capabilityProductionWorkerJobScenarios: AiGraphicsInternalBetaProductionWorkerCapabilityJobScenario[]
  booleans: {
    internalBetaProductionWorkerJobReadinessContractPrepared: true
    sourceWorkerPayloadEvidenceAccepted: boolean
    ownerApprovedProductionWorkerJobEvidenceAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ProductionWorkerJobPayloadsPrepared: true
    all12CapabilityProductionWorkerJobScenariosPrepared: true
    all21ProductionWorkerJobPayloadsReadyWithProvidedEvidence: boolean
    all12CapabilityProductionWorkerJobScenariosReadyWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerJobEnqueueApprovedNow: false
    productionWorkerRouteExecutionApprovedNow: false
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

const allowedPreparationActions = [
  'map AI graphics worker payload metadata into canonical ProductionWorkerJobPayload shape',
  'populate requestedToolIds from productionToolId',
  'populate toolExecutionPlanId from the approved tool strategy id',
  'populate storageReferenceIds with private manifest references only',
  'attach canonical tool id, capability ids, runtime target, and blocker metadata',
  'validate production worker payload shape without queueing or executing it',
]

const blockedRuntimeActions = [
  'production worker job enqueue',
  'production worker route execution',
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

export const aiGraphicsProductionWorkerJobPayloadFields = [
  'jobId',
  'workspaceId',
  'projectId',
  'approvedSnapshotId',
  'editPlanId',
  'toolExecutionPlanId',
  'workerType',
  'executionMode',
  'idempotencyKey',
  'attempt',
  'maxAttempts',
  'requestedToolIds',
  'requestedRecipeIds',
  'storageReferenceIds',
  'creditReservationId',
  'requiredQualityGateTypes',
  'createdAt',
  'metadata',
] as const

function toStatus(
  workerPayloadReadiness: AiGraphicsInternalBetaWorkerPayloadReadiness,
): AiGraphicsInternalBetaProductionWorkerJobReadinessStatus {
  if (workerPayloadReadiness.status === 'missing_technical_evidence') return 'missing_technical_evidence'
  if (workerPayloadReadiness.status === 'awaiting_owner_approval') return 'awaiting_owner_approval'
  return workerPayloadReadiness.ownerApprovedPayloadEvidenceAccepted
    ? 'owner_approved_production_worker_jobs_ready'
    : 'missing_technical_evidence'
}

function asProductionWorkerRuntimeType(
  workerType: ProductionRegistryWorkerType,
): ProductionWorkerRuntimeType {
  if (
    workerType === 'cpu_analysis_worker' ||
    workerType === 'gpu_ai_worker' ||
    workerType === 'render_worker' ||
    workerType === 'qa_worker' ||
    workerType === 'tool_readiness_worker'
  ) {
    return workerType
  }

  throw new Error(`AI graphics tool cannot map to a production worker runtime: ${workerType}`)
}

function recipeIdForPayload(payload: AiGraphicsInternalBetaWorkerPayload): string {
  if (payload.workerType === 'gpu_ai_worker') return 'ai_graphics_gpu_model_metadata_payload'
  if (payload.workerType === 'render_worker') return 'ai_graphics_render_metadata_payload'
  if (payload.workerType === 'cpu_analysis_worker') return 'ai_graphics_cpu_static_metadata_payload'
  return 'ai_graphics_metadata_payload'
}

function buildProductionWorkerJobPayload(
  payload: AiGraphicsInternalBetaWorkerPayload,
): ProductionWorkerJobPayload {
  return {
    jobId: payload.jobId.replace('-metadata-payload', '-production-worker-job-payload'),
    workspaceId: payload.workspaceId,
    projectId: payload.projectId,
    approvedSnapshotId: payload.approvedSnapshotId,
    editPlanId: payload.editPlanId,
    toolExecutionPlanId: payload.toolStrategyId,
    workerType: asProductionWorkerRuntimeType(payload.workerType),
    executionMode: 'dry_run',
    idempotencyKey: `${payload.idempotencyKey}_production_worker_job_v1`,
    attempt: payload.attempt,
    maxAttempts: payload.maxAttempts,
    requestedToolIds: [payload.productionToolId],
    requestedRecipeIds: [recipeIdForPayload(payload)],
    storageReferenceIds: [payload.privateArtifactManifestRef],
    creditReservationId: 'credit_reservation_ai_graphics_internal_beta_fixture',
    requiredQualityGateTypes: ['render_asset_integrity'],
    createdAt: '2026-06-26T00:00:00.000Z',
    metadata: {
      aiGraphicsCanonicalToolId: payload.toolId,
      aiGraphicsCapabilityIds: payload.capabilityIds,
      aiGraphicsRuntimeTarget: payload.runtimeTarget,
      expectedOutputRefs: payload.expectedOutputRefs,
      sourcePayloadReadyWithProvidedEvidence: payload.payloadReadyWithProvidedEvidence,
      canEnqueueProductionWorkerJobNow: false,
      canRunProductionWorkerRouteNow: false,
      canExecuteToolNow: false,
      blockedRuntimeActions,
    },
  }
}

function hasRequiredProductionWorkerJobShape(payload: ProductionWorkerJobPayload): boolean {
  return aiGraphicsProductionWorkerJobPayloadFields.every((field) => Object.hasOwn(payload, field)) &&
    payload.executionMode === 'dry_run' &&
    payload.requestedToolIds.length === 1 &&
    payload.requestedRecipeIds.length === 1 &&
    payload.storageReferenceIds.length === 1 &&
    Boolean(payload.toolExecutionPlanId) &&
    Boolean(payload.idempotencyKey) &&
    Boolean(payload.approvedSnapshotId) &&
    Boolean(payload.creditReservationId)
}

export function buildAiGraphicsInternalBetaProductionWorkerJobReadiness(
  input: AiGraphicsInternalBetaProductionWorkerJobReadinessInput = {},
): AiGraphicsInternalBetaProductionWorkerJobReadiness {
  const sourceWorkerPayloadReadiness = buildAiGraphicsInternalBetaWorkerPayloadReadiness(input)
  const status = toStatus(sourceWorkerPayloadReadiness)
  const ownerApprovedProductionWorkerJobEvidenceAccepted =
    status === 'owner_approved_production_worker_jobs_ready'

  const productionWorkerJobPayloads =
    sourceWorkerPayloadReadiness.workerPayloads.map((sourcePayload): AiGraphicsInternalBetaProductionWorkerJobCandidate => {
      const productionWorkerJobPayload = buildProductionWorkerJobPayload(sourcePayload)
      const productionWorkerJobShapeValid = hasRequiredProductionWorkerJobShape(productionWorkerJobPayload)
      const productionWorkerJobReadyWithProvidedEvidence =
        ownerApprovedProductionWorkerJobEvidenceAccepted &&
        sourcePayload.payloadReadyWithProvidedEvidence &&
        productionWorkerJobShapeValid

      return {
        sourceToolId: sourcePayload.toolId,
        sourceProductionToolId: sourcePayload.productionToolId,
        sourceRuntimeTarget: sourcePayload.runtimeTarget,
        sourcePayloadReadyWithProvidedEvidence: sourcePayload.payloadReadyWithProvidedEvidence,
        productionWorkerJobPayload,
        productionWorkerJobShapeValid,
        productionWorkerJobReadyWithProvidedEvidence,
        canEnqueueProductionWorkerJobNow: false,
        canRunProductionWorkerRouteNow: false,
        canExecuteToolNow: false,
        blockedRuntimeActions,
      }
    })

  const capabilityProductionWorkerJobScenarios =
    sourceWorkerPayloadReadiness.capabilityPayloadScenarios.map((scenario): AiGraphicsInternalBetaProductionWorkerCapabilityJobScenario => {
      const readyToolJobPayloadsWithProvidedEvidence = scenario.selectedToolPayloads.filter((toolId) => (
        productionWorkerJobPayloads.find((payload) => payload.sourceToolId === toolId)
          ?.productionWorkerJobReadyWithProvidedEvidence === true
      ))

      return {
        capabilityId: scenario.capabilityId,
        selectedToolJobPayloads: scenario.selectedToolPayloads,
        readyToolJobPayloadsWithProvidedEvidence,
        scenarioProductionWorkerJobsReadyWithProvidedEvidence:
          readyToolJobPayloadsWithProvidedEvidence.length > 0,
        canEnqueueProductionWorkerJobsNow: false,
        canExecuteToolsNow: false,
      }
    })

  const productionWorkerJobPayloadsReadyWithProvidedEvidence =
    productionWorkerJobPayloads.filter((payload) => payload.productionWorkerJobReadyWithProvidedEvidence).length
  const capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence =
    capabilityProductionWorkerJobScenarios
      .filter((scenario) => scenario.scenarioProductionWorkerJobsReadyWithProvidedEvidence).length
  const all21ProductionWorkerJobPayloadsReadyWithProvidedEvidence =
    productionWorkerJobPayloadsReadyWithProvidedEvidence === 21
  const all12CapabilityProductionWorkerJobScenariosReadyWithProvidedEvidence =
    capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence === 12

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION,
    sourceInternalBetaWorkerPayloadDecision: AI_GRAPHICS_INTERNAL_BETA_WORKER_PAYLOAD_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    productionWorkerJobPayloadsPrepared: productionWorkerJobPayloads.length as 21,
    capabilityProductionWorkerJobScenariosPrepared: capabilityProductionWorkerJobScenarios.length as 12,
    productionWorkerJobPayloadsReadyWithProvidedEvidence,
    capabilityProductionWorkerJobScenariosReadyWithProvidedEvidence,
    productionWorkerJobPayloadsReadyNow: 0,
    capabilityProductionWorkerJobScenariosReadyNow: 0,
    sourceWorkerPayloadReadiness,
    sourceWorkerPayloadEvidenceAccepted: sourceWorkerPayloadReadiness.ownerApprovedPayloadEvidenceAccepted,
    ownerApprovedProductionWorkerJobEvidenceAccepted,
    allowedPreparationActions,
    blockedRuntimeActions,
    jobPayloadFields: [...aiGraphicsProductionWorkerJobPayloadFields],
    productionWorkerJobPayloads,
    capabilityProductionWorkerJobScenarios,
    booleans: {
      internalBetaProductionWorkerJobReadinessContractPrepared: true,
      sourceWorkerPayloadEvidenceAccepted: sourceWorkerPayloadReadiness.ownerApprovedPayloadEvidenceAccepted,
      ownerApprovedProductionWorkerJobEvidenceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ProductionWorkerJobPayloadsPrepared: true,
      all12CapabilityProductionWorkerJobScenariosPrepared: true,
      all21ProductionWorkerJobPayloadsReadyWithProvidedEvidence,
      all12CapabilityProductionWorkerJobScenariosReadyWithProvidedEvidence,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerRouteExecutionApprovedNow: false,
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
