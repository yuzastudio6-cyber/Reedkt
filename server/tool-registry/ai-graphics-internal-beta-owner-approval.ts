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
  evidenceBundle?: AiGraphicsBetaEvidenceBundle
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

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function isOwnerApprovalGap(value: string): boolean {
  const normalized = value.toLowerCase()
  return normalized.includes('internal_beta_owner_approval') ||
    normalized.includes('internal beta owner approval') ||
    normalized.includes('owner approval')
}

function asTechnicalEvidenceBundle(
  bundle: AiGraphicsBetaEvidenceBundle,
): AiGraphicsBetaEvidenceBundle {
  const ownerGap = 'internal_beta_owner_approval'
  const ownerBlocker = 'internal beta owner approval is not granted'
  const technicalReady = bundle.all21TechnicalEvidenceReadyBeforeOwnerApproval

  return {
    ...bundle,
    betaTestingReadyTools: technicalReady ? 0 : bundle.betaTestingReadyTools,
    blockedTools: technicalReady ? 21 : bundle.blockedTools,
    all21BetaEvidenceReady: false,
    evidence: {
      ...bundle.evidence,
      internalBetaOwnerApprovalGranted: false,
    },
    tools: bundle.tools.map((tool) => ({
      ...tool,
      betaTestingReadyNow: false,
      evidenceMissing: unique([
        ...tool.evidenceMissing.filter((entry) => !isOwnerApprovalGap(entry)),
        ...(technicalReady ? [ownerGap] : []),
      ]),
      blockers: unique([
        ...tool.blockers.filter((entry) => !isOwnerApprovalGap(entry)),
        ...(technicalReady ? [ownerBlocker] : []),
      ]),
    })),
    missingEvidence: unique([
      ...bundle.missingEvidence.filter((entry) => !isOwnerApprovalGap(entry)),
      ...(technicalReady ? [ownerGap] : []),
    ]),
    booleans: {
      ...bundle.booleans,
      all21BetaEvidenceReady: false,
      readyForInternalBetaOwnerGate: technicalReady,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

function applyOwnerApprovalToEvidenceBundle(
  bundle: AiGraphicsBetaEvidenceBundle,
  ownerApprovalAccepted: boolean,
): AiGraphicsBetaEvidenceBundle {
  if (!ownerApprovalAccepted || !bundle.all21TechnicalEvidenceReadyBeforeOwnerApproval) {
    return asTechnicalEvidenceBundle(bundle)
  }

  return {
    ...bundle,
    betaTestingReadyTools: 21,
    blockedTools: 0,
    all21BetaEvidenceReady: true,
    evidence: {
      ...bundle.evidence,
      internalBetaOwnerApprovalGranted: true,
    },
    tools: bundle.tools.map((tool) => ({
      ...tool,
      betaTestingReadyNow: true,
      evidenceMissing: tool.evidenceMissing.filter((entry) => !isOwnerApprovalGap(entry)),
      blockers: tool.blockers.filter((entry) => !isOwnerApprovalGap(entry)),
    })),
    missingEvidence: bundle.missingEvidence.filter((entry) => !isOwnerApprovalGap(entry)),
    booleans: {
      ...bundle.booleans,
      all21BetaEvidenceReady: true,
      all21TechnicalEvidenceReadyBeforeOwnerApproval: true,
      readyForInternalBetaOwnerGate: true,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
    },
  }
}

export function buildAiGraphicsInternalBetaOwnerApproval(
  input: AiGraphicsInternalBetaOwnerApprovalInput = {},
): AiGraphicsInternalBetaOwnerApproval {
  const baseEvidenceInput = input.evidenceBundleInput ?? {}
  const technicalEvidenceBundle = input.evidenceBundle
    ? asTechnicalEvidenceBundle(input.evidenceBundle)
    : buildAiGraphicsBetaEvidenceBundle({
        ...baseEvidenceInput,
        internalBetaOwnerApprovalGranted: false,
      })
  const approvalAccepted = ownerApprovalRecordAccepted(input)
  const approvedEvidenceBundle = input.evidenceBundle
    ? applyOwnerApprovalToEvidenceBundle(input.evidenceBundle, approvalAccepted)
    : buildAiGraphicsBetaEvidenceBundle({
        ...baseEvidenceInput,
        internalBetaOwnerApprovalGranted: approvalAccepted,
      })
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
