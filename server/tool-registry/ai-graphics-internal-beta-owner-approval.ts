import {
  buildAiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundle,
  type AiGraphicsBetaEvidenceBundleInput,
} from './ai-graphics-beta-evidence-bundle'
import {
  buildAiGraphicsBetaToolCallReadiness,
  type AiGraphicsBetaToolCallReadiness,
} from './ai-graphics-beta-tool-call-readiness'

export const AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_DECISION =
  'ai_graphics_internal_beta_owner_approval_contract_prepared_with_fail_closed_defaults'

export type AiGraphicsInternalBetaOwnerApprovalStatus =
  | 'missing_technical_evidence'
  | 'awaiting_owner_approval'
  | 'owner_approved_all21_beta_evidence_ready'

export interface AiGraphicsInternalBetaOwnerApprovalInput {
  evidenceBundleInput?: AiGraphicsBetaEvidenceBundleInput
  ownerApprovalGranted?: boolean
  ownerApprovalRef?: string
  ownerApproverRole?: string
}

export interface AiGraphicsInternalBetaOwnerApproval {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_DECISION
  sourceEvidenceDecision: AiGraphicsBetaEvidenceBundle['decision']
  sourceBetaToolCallDecision: AiGraphicsBetaToolCallReadiness['decision']
  status: AiGraphicsInternalBetaOwnerApprovalStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  technicalEvidenceReadyForOwnerGate: boolean
  ownerApprovalRecordAccepted: boolean
  all21BetaEvidenceReadyAfterOwnerApproval: boolean
  betaToolCallableWithOwnerApprovalTools: number
  betaToolCallableNowTools: 0
  technicalEvidenceBundle: AiGraphicsBetaEvidenceBundle
  approvedEvidenceBundle: AiGraphicsBetaEvidenceBundle
  betaToolCallReadinessAfterOwnerApproval: AiGraphicsBetaToolCallReadiness
  missingOwnerApprovalEvidence: string[]
  missingTechnicalEvidenceBeforeOwnerApproval: string[]
  booleans: {
    internalBetaOwnerApprovalContractPrepared: true
    sourceTechnicalEvidenceBundleAccepted: boolean
    ownerApprovalRecordAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21BetaEvidenceReadyAfterOwnerApproval: boolean
    all21BetaToolCallableWithOwnerApproval: boolean
    internalBetaOwnerApprovalGrantedByRecord: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
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

function ownerApprovalRecordAccepted(input: AiGraphicsInternalBetaOwnerApprovalInput): boolean {
  return input.ownerApprovalGranted === true &&
    typeof input.ownerApprovalRef === 'string' &&
    input.ownerApprovalRef.trim().length > 0 &&
    (input.ownerApproverRole ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') === 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
}

function buildStatus(input: {
  technicalEvidenceReadyForOwnerGate: boolean
  ownerApprovalRecordAccepted: boolean
  all21BetaEvidenceReadyAfterOwnerApproval: boolean
}): AiGraphicsInternalBetaOwnerApprovalStatus {
  if (!input.technicalEvidenceReadyForOwnerGate) return 'missing_technical_evidence'
  if (!input.ownerApprovalRecordAccepted) return 'awaiting_owner_approval'
  return input.all21BetaEvidenceReadyAfterOwnerApproval
    ? 'owner_approved_all21_beta_evidence_ready'
    : 'missing_technical_evidence'
}

export function buildAiGraphicsInternalBetaOwnerApproval(
  input: AiGraphicsInternalBetaOwnerApprovalInput = {},
): AiGraphicsInternalBetaOwnerApproval {
  const baseEvidenceInput = input.evidenceBundleInput ?? {}
  const technicalEvidenceInput: AiGraphicsBetaEvidenceBundleInput = {
    ...baseEvidenceInput,
    internalBetaOwnerApprovalGranted: false,
  }
  const technicalEvidenceBundle = buildAiGraphicsBetaEvidenceBundle(technicalEvidenceInput)
  const approvalAccepted = ownerApprovalRecordAccepted(input)
  const approvedEvidenceInput: AiGraphicsBetaEvidenceBundleInput = {
    ...baseEvidenceInput,
    internalBetaOwnerApprovalGranted: approvalAccepted,
  }
  const approvedEvidenceBundle = buildAiGraphicsBetaEvidenceBundle(approvedEvidenceInput)
  const betaToolCallReadinessAfterOwnerApproval = buildAiGraphicsBetaToolCallReadiness({
    evidenceBundle: approvedEvidenceBundle,
  })
  const technicalEvidenceReadyForOwnerGate =
    technicalEvidenceBundle.all21TechnicalEvidenceReadyBeforeOwnerApproval
  const all21BetaEvidenceReadyAfterOwnerApproval =
    approvedEvidenceBundle.all21BetaEvidenceReady
  const betaToolCallableWithOwnerApprovalTools =
    betaToolCallReadinessAfterOwnerApproval.betaToolCallableWithProvidedEvidenceTools
  const status = buildStatus({
    technicalEvidenceReadyForOwnerGate,
    ownerApprovalRecordAccepted: approvalAccepted,
    all21BetaEvidenceReadyAfterOwnerApproval,
  })
  const missingOwnerApprovalEvidence = [
    !approvalAccepted ? 'internal_beta_owner_approval_record' : undefined,
    !input.ownerApprovalRef ? 'owner_approval_ref' : undefined,
    input.ownerApproverRole && input.ownerApproverRole !== 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
      ? 'owner_approver_role_must_be_AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_OWNER_APPROVAL_DECISION,
    sourceEvidenceDecision: approvedEvidenceBundle.decision,
    sourceBetaToolCallDecision: betaToolCallReadinessAfterOwnerApproval.decision,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    technicalEvidenceReadyForOwnerGate,
    ownerApprovalRecordAccepted: approvalAccepted,
    all21BetaEvidenceReadyAfterOwnerApproval,
    betaToolCallableWithOwnerApprovalTools,
    betaToolCallableNowTools: 0,
    technicalEvidenceBundle,
    approvedEvidenceBundle,
    betaToolCallReadinessAfterOwnerApproval,
    missingOwnerApprovalEvidence,
    missingTechnicalEvidenceBeforeOwnerApproval:
      technicalEvidenceBundle.missingTechnicalEvidenceBeforeOwnerApproval,
    booleans: {
      internalBetaOwnerApprovalContractPrepared: true,
      sourceTechnicalEvidenceBundleAccepted: technicalEvidenceReadyForOwnerGate,
      ownerApprovalRecordAccepted: approvalAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21BetaEvidenceReadyAfterOwnerApproval,
      all21BetaToolCallableWithOwnerApproval:
        betaToolCallableWithOwnerApprovalTools === 21,
      internalBetaOwnerApprovalGrantedByRecord: approvalAccepted,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
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
