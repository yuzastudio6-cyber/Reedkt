import {
  AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION,
  buildAiGraphicsInternalBetaProductionWorkerJobReadiness,
  type AiGraphicsInternalBetaProductionWorkerJobCandidate,
  type AiGraphicsInternalBetaProductionWorkerJobReadiness,
  type AiGraphicsInternalBetaProductionWorkerJobReadinessInput,
} from './ai-graphics-internal-beta-production-worker-job-readiness'
import {
  getHardFailedGates,
  runProductionWorkerGates,
} from '../workers/production/production-worker-gates'
import type { ProductionWorkerGateCheck } from '../workers/production/production-worker-types'

export const AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION =
  'ai_graphics_internal_beta_production_worker_gate_readiness_contract_prepared_with_fail_closed_runtime'

export type AiGraphicsInternalBetaProductionWorkerGateReadinessStatus =
  | 'missing_technical_evidence'
  | 'awaiting_owner_approval'
  | 'owner_approved_production_worker_gate_checks_ready'

export interface AiGraphicsInternalBetaProductionWorkerGateReadinessInput
  extends AiGraphicsInternalBetaProductionWorkerJobReadinessInput {}

export interface AiGraphicsInternalBetaProductionWorkerGateCheckResult {
  toolId: AiGraphicsInternalBetaProductionWorkerJobCandidate['sourceToolId']
  productionToolId: AiGraphicsInternalBetaProductionWorkerJobCandidate['sourceProductionToolId']
  workerType: AiGraphicsInternalBetaProductionWorkerJobCandidate['productionWorkerJobPayload']['workerType']
  runtimeTarget: AiGraphicsInternalBetaProductionWorkerJobCandidate['sourceRuntimeTarget']
  sourceProductionWorkerJobReadyWithProvidedEvidence: boolean
  gateChecks: ProductionWorkerGateCheck[]
  hardFailedGateNames: string[]
  warningGateNames: string[]
  gateCheckShapeValid: boolean
  gateChecksAcceptedWithProvidedEvidence: boolean
  canEnqueueProductionWorkerJobNow: false
  canDispatchProductionWorkerJobNow: false
  canRunProductionWorkerRouteNow: false
  canExecuteToolNow: false
  blockedRuntimeActions: string[]
}

export interface AiGraphicsInternalBetaProductionWorkerCapabilityGateScenario {
  capabilityId: string
  selectedToolGateChecks: AiGraphicsInternalBetaProductionWorkerJobCandidate['sourceToolId'][]
  acceptedToolGateChecksWithProvidedEvidence: AiGraphicsInternalBetaProductionWorkerJobCandidate['sourceToolId'][]
  scenarioGateChecksAcceptedWithProvidedEvidence: boolean
  canEnqueueProductionWorkerJobsNow: false
  canDispatchProductionWorkerJobsNow: false
  canExecuteToolsNow: false
}

export interface AiGraphicsInternalBetaProductionWorkerGateReadiness {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION
  sourceInternalBetaProductionWorkerJobDecision: typeof AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION
  status: AiGraphicsInternalBetaProductionWorkerGateReadinessStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  productionWorkerGateChecksPrepared: 21
  capabilityProductionWorkerGateScenariosPrepared: 12
  productionWorkerGateChecksAcceptedWithProvidedEvidence: number
  capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence: number
  productionWorkerGateChecksReadyNow: 0
  capabilityProductionWorkerGateScenariosReadyNow: 0
  hardFailedGateChecksWithProvidedEvidence: number
  sourceProductionWorkerJobReadiness: AiGraphicsInternalBetaProductionWorkerJobReadiness
  sourceProductionWorkerJobEvidenceAccepted: boolean
  ownerApprovedProductionWorkerGateEvidenceAccepted: boolean
  requiredGateNames: string[]
  allowedGateActions: string[]
  blockedRuntimeActions: string[]
  productionWorkerGateChecks: AiGraphicsInternalBetaProductionWorkerGateCheckResult[]
  capabilityProductionWorkerGateScenarios: AiGraphicsInternalBetaProductionWorkerCapabilityGateScenario[]
  booleans: {
    internalBetaProductionWorkerGateReadinessContractPrepared: true
    sourceProductionWorkerJobEvidenceAccepted: boolean
    ownerApprovedProductionWorkerGateEvidenceAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ProductionWorkerGateChecksPrepared: true
    all12CapabilityProductionWorkerGateScenariosPrepared: true
    all21ProductionWorkerGateChecksAcceptedWithProvidedEvidence: boolean
    all12CapabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence: boolean
    productionWorkerGateHardFailuresWithProvidedEvidenceAbsent: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerJobEnqueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
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
    productionWorkerDispatchPerformed: false
    productionWorkerRouteExecutionPerformed: false
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

const requiredGateNames = [
  'approved_snapshot',
  'idempotency',
  'raw_prompt_block',
  'signed_url_block',
  'secret_block',
  'registry_runtime',
  'license_model_weight',
  'credit_reservation',
  'artifact_policy',
  'qa_policy',
  'worker_mode',
]

const allowedGateActions = [
  'run shared production worker gate checks against prepared payload candidates',
  'validate approved snapshot, idempotency, artifact, runtime registry, license/model-weight, credit, QA, and worker mode gates',
  'collect gate warnings for future owner review',
  'report fail-closed queue, dispatch, route, and execution blockers',
]

const blockedRuntimeActions = [
  'production worker job enqueue',
  'production worker dispatch',
  'production worker route execution',
  'worker lease creation',
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

function toStatus(
  productionWorkerJobReadiness: AiGraphicsInternalBetaProductionWorkerJobReadiness,
): AiGraphicsInternalBetaProductionWorkerGateReadinessStatus {
  if (productionWorkerJobReadiness.status === 'missing_technical_evidence') return 'missing_technical_evidence'
  if (productionWorkerJobReadiness.status === 'awaiting_owner_approval') return 'awaiting_owner_approval'
  return productionWorkerJobReadiness.ownerApprovedProductionWorkerJobEvidenceAccepted
    ? 'owner_approved_production_worker_gate_checks_ready'
    : 'missing_technical_evidence'
}

function hasRequiredGateShape(gateChecks: ProductionWorkerGateCheck[]): boolean {
  const gateNames = gateChecks.map((gate) => gate.gateName)
  return requiredGateNames.every((gateName) => gateNames.includes(gateName)) &&
    gateChecks.every((gate) => (
      Boolean(gate.gateName) &&
      Boolean(gate.status) &&
      typeof gate.hardBlock === 'boolean' &&
      Boolean(gate.message) &&
      Array.isArray(gate.warnings)
    ))
}

export function buildAiGraphicsInternalBetaProductionWorkerGateReadiness(
  input: AiGraphicsInternalBetaProductionWorkerGateReadinessInput = {},
): AiGraphicsInternalBetaProductionWorkerGateReadiness {
  const sourceProductionWorkerJobReadiness =
    buildAiGraphicsInternalBetaProductionWorkerJobReadiness(input)
  const status = toStatus(sourceProductionWorkerJobReadiness)
  const ownerApprovedProductionWorkerGateEvidenceAccepted =
    status === 'owner_approved_production_worker_gate_checks_ready'

  const productionWorkerGateChecks =
    sourceProductionWorkerJobReadiness.productionWorkerJobPayloads
      .map((candidate): AiGraphicsInternalBetaProductionWorkerGateCheckResult => {
        const gateChecks = runProductionWorkerGates(candidate.productionWorkerJobPayload)
        const hardFailedGates = getHardFailedGates(gateChecks)
        const gateCheckShapeValid = hasRequiredGateShape(gateChecks)
        const gateChecksAcceptedWithProvidedEvidence =
          ownerApprovedProductionWorkerGateEvidenceAccepted &&
          candidate.productionWorkerJobReadyWithProvidedEvidence &&
          gateCheckShapeValid &&
          hardFailedGates.length === 0

        return {
          toolId: candidate.sourceToolId,
          productionToolId: candidate.sourceProductionToolId,
          workerType: candidate.productionWorkerJobPayload.workerType,
          runtimeTarget: candidate.sourceRuntimeTarget,
          sourceProductionWorkerJobReadyWithProvidedEvidence:
            candidate.productionWorkerJobReadyWithProvidedEvidence,
          gateChecks,
          hardFailedGateNames: hardFailedGates.map((gate) => gate.gateName),
          warningGateNames: gateChecks
            .filter((gate) => gate.status === 'warning' || gate.warnings.length > 0)
            .map((gate) => gate.gateName),
          gateCheckShapeValid,
          gateChecksAcceptedWithProvidedEvidence,
          canEnqueueProductionWorkerJobNow: false,
          canDispatchProductionWorkerJobNow: false,
          canRunProductionWorkerRouteNow: false,
          canExecuteToolNow: false,
          blockedRuntimeActions,
        }
      })

  const capabilityProductionWorkerGateScenarios =
    sourceProductionWorkerJobReadiness.capabilityProductionWorkerJobScenarios
      .map((scenario): AiGraphicsInternalBetaProductionWorkerCapabilityGateScenario => {
        const acceptedToolGateChecksWithProvidedEvidence = scenario.selectedToolJobPayloads.filter((toolId) => (
          productionWorkerGateChecks.find((gateCheck) => gateCheck.toolId === toolId)
            ?.gateChecksAcceptedWithProvidedEvidence === true
        ))

        return {
          capabilityId: scenario.capabilityId,
          selectedToolGateChecks: scenario.selectedToolJobPayloads,
          acceptedToolGateChecksWithProvidedEvidence,
          scenarioGateChecksAcceptedWithProvidedEvidence:
            acceptedToolGateChecksWithProvidedEvidence.length > 0,
          canEnqueueProductionWorkerJobsNow: false,
          canDispatchProductionWorkerJobsNow: false,
          canExecuteToolsNow: false,
        }
      })

  const productionWorkerGateChecksAcceptedWithProvidedEvidence =
    productionWorkerGateChecks.filter((gateCheck) => gateCheck.gateChecksAcceptedWithProvidedEvidence).length
  const capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence =
    capabilityProductionWorkerGateScenarios
      .filter((scenario) => scenario.scenarioGateChecksAcceptedWithProvidedEvidence).length
  const hardFailedGateChecksWithProvidedEvidence =
    productionWorkerGateChecks
      .filter((gateCheck) => gateCheck.sourceProductionWorkerJobReadyWithProvidedEvidence)
      .reduce((count, gateCheck) => count + gateCheck.hardFailedGateNames.length, 0)
  const all21ProductionWorkerGateChecksAcceptedWithProvidedEvidence =
    productionWorkerGateChecksAcceptedWithProvidedEvidence === 21
  const all12CapabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence =
    capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence === 12
  const productionWorkerGateHardFailuresWithProvidedEvidenceAbsent =
    hardFailedGateChecksWithProvidedEvidence === 0

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION,
    sourceInternalBetaProductionWorkerJobDecision:
      AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_JOB_READINESS_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    productionWorkerGateChecksPrepared: productionWorkerGateChecks.length as 21,
    capabilityProductionWorkerGateScenariosPrepared:
      capabilityProductionWorkerGateScenarios.length as 12,
    productionWorkerGateChecksAcceptedWithProvidedEvidence,
    capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence,
    productionWorkerGateChecksReadyNow: 0,
    capabilityProductionWorkerGateScenariosReadyNow: 0,
    hardFailedGateChecksWithProvidedEvidence,
    sourceProductionWorkerJobReadiness,
    sourceProductionWorkerJobEvidenceAccepted:
      sourceProductionWorkerJobReadiness.ownerApprovedProductionWorkerJobEvidenceAccepted,
    ownerApprovedProductionWorkerGateEvidenceAccepted,
    requiredGateNames,
    allowedGateActions,
    blockedRuntimeActions,
    productionWorkerGateChecks,
    capabilityProductionWorkerGateScenarios,
    booleans: {
      internalBetaProductionWorkerGateReadinessContractPrepared: true,
      sourceProductionWorkerJobEvidenceAccepted:
        sourceProductionWorkerJobReadiness.ownerApprovedProductionWorkerJobEvidenceAccepted,
      ownerApprovedProductionWorkerGateEvidenceAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ProductionWorkerGateChecksPrepared: true,
      all12CapabilityProductionWorkerGateScenariosPrepared: true,
      all21ProductionWorkerGateChecksAcceptedWithProvidedEvidence,
      all12CapabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence,
      productionWorkerGateHardFailuresWithProvidedEvidenceAbsent,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
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
      productionWorkerDispatchPerformed: false,
      productionWorkerRouteExecutionPerformed: false,
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
