import type { AiGraphicsModelWeightManifestReviewSupplementRecord } from './ai-graphics-model-weight-manifest-authoring'
import type { AiGraphicsModelWeightManifestToolId } from './ai-graphics-model-weight-manifest-readiness'
import {
  listAiGraphicsModelWeightSourceCandidates,
  type AiGraphicsModelWeightSourceCandidateStatus,
  type AiGraphicsModelWeightSourceReviewStatus,
} from './ai-graphics-model-weight-source-catalog'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_SCAFFOLD_DECISION =
  'ai_graphics_model_weight_manifest_supplement_scaffold_prepared_for_local_private_records'

export interface AiGraphicsModelWeightManifestSupplementScaffoldSourceCandidateGuidance {
  candidateId: string
  candidateStatus: AiGraphicsModelWeightSourceCandidateStatus
  reviewStatus: AiGraphicsModelWeightSourceReviewStatus
  upstreamSourceName: string
  upstreamSourceUrl: string
  sourceCodeUrl?: string
  artifactSourceUrl?: string
  artifactFileName?: string
  modelIdOrName: string
  licenseClaim: string
  sourceEvidenceRefs: string[]
  selectedCandidateReadyForManifestSupplementDraft: boolean
  manifestSupplementAuthoringStatus:
    | 'ready_from_existing_internal_evidence_after_private_ref_authoring'
    | 'blocked_until_source_review_accepts_selected_candidate'
  nextAction: string
}

export interface AiGraphicsModelWeightManifestSupplementScaffoldRecord {
  toolId: AiGraphicsModelWeightManifestToolId
  directoryName: string
  relativeFilePath: string
  sourceCandidateGuidance: AiGraphicsModelWeightManifestSupplementScaffoldSourceCandidateGuidance
  placeholderRecord: AiGraphicsModelWeightManifestReviewSupplementRecord
  placeholderSourceLicenseRefStatus: 'invalid_public_or_signed_ref'
  placeholderModelCardRefStatus: 'invalid_public_or_signed_ref'
  status: 'template_only_not_reviewed'
}

export interface AiGraphicsModelWeightManifestSupplementAuthoringChecklistItem {
  toolId: AiGraphicsModelWeightManifestToolId
  candidateId: string
  authoringReadiness:
    | 'ready_from_existing_internal_evidence_after_private_ref_authoring'
    | 'blocked_until_source_review_accepts_selected_candidate'
  localOnlySupplementPath: string
  acceptedPrivateEvidenceRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-']
  requiredSupplementFields: string[]
  requiredReviewBooleans: [
    'commercialUseReviewed',
    'redistributionReviewed',
    'provenanceReviewed',
    'qualityReviewed',
    'securityReviewed',
    'approvedForInternalBeta',
  ]
  sourceEvidenceRefs: string[]
  validationCommands: [
    'npm run --silent ai-graphics:model-weight-manifest-supplement:validate -- --supplement-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_SUPPLEMENT_ROOT"',
    'npm run --silent ai-graphics:model-weight-manifest-authoring -- --evidence-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_CHECKSUM_EVIDENCE_ROOT" --supplement-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_SUPPLEMENT_ROOT" --out-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
  ]
  localOnly: true
  committedManifestSupplementApproved: false
  nextAction: string
}

export interface AiGraphicsModelWeightManifestSupplementScaffoldPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_SCAFFOLD_DECISION
  totalAiGraphicsTools: 21
  modelWeightManifestSupplementTools: AiGraphicsModelWeightManifestToolId[]
  scaffoldRecords: AiGraphicsModelWeightManifestSupplementScaffoldRecord[]
  authoringChecklist: AiGraphicsModelWeightManifestSupplementAuthoringChecklistItem[]
  booleans: {
    modelWeightManifestSupplementScaffoldPrepared: true
    all5ModelWeightToolsCovered: true
    manifestReviewSupplementChecklistPrepared: true
    templatesInvalidUntilOwnerReviewed: true
    privateEvidenceRefsNotLogged: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    modelWeightManifestsApprovedNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    mediaProcessingPerformed: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const modelWeightManifestSupplementTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

const directoryNameByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

const requiredSupplementFields = [
  'supplementId',
  'toolId',
  'sourceCandidateId',
  'sourceLicenseRef',
  'modelCardRef',
  'commercialUseReviewed',
  'redistributionReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForInternalBeta',
]

const requiredReviewBooleans = [
  'commercialUseReviewed',
  'redistributionReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForInternalBeta',
] as const

function sourceCandidateForTool(toolId: AiGraphicsModelWeightManifestToolId) {
  const sourceCandidate = listAiGraphicsModelWeightSourceCandidates().find((candidate) => candidate.toolId === toolId)
  if (!sourceCandidate) {
    throw new Error(`Missing AI graphics model-weight source candidate for manifest supplement scaffold: ${toolId}`)
  }
  return sourceCandidate
}

function placeholderRecordForTool(toolId: AiGraphicsModelWeightManifestToolId): AiGraphicsModelWeightManifestReviewSupplementRecord {
  const directoryName = directoryNameByTool[toolId]

  return {
    supplementId: `${toolId}_private_manifest_review_supplement_v1`,
    toolId,
    sourceCandidateId: sourceCandidateForTool(toolId).candidateId,
    sourceLicenseRef: `public://replace-with-reviewed-source-license-evidence/${directoryName}.json`,
    modelCardRef: `public://replace-with-reviewed-model-card-provenance/${directoryName}.json`,
    commercialUseReviewed: false,
    redistributionReviewed: false,
    provenanceReviewed: false,
    qualityReviewed: false,
    securityReviewed: false,
    approvedForInternalBeta: false,
  }
}

function sourceCandidateGuidanceForTool(
  toolId: AiGraphicsModelWeightManifestToolId,
): AiGraphicsModelWeightManifestSupplementScaffoldSourceCandidateGuidance {
  const sourceCandidate = sourceCandidateForTool(toolId)
  const selectedCandidateReadyForManifestSupplementDraft =
    sourceCandidate.candidateStatus === 'internal_evidence_verified_private_manifest_required'

  return {
    candidateId: sourceCandidate.candidateId,
    candidateStatus: sourceCandidate.candidateStatus,
    reviewStatus: sourceCandidate.reviewStatus,
    upstreamSourceName: sourceCandidate.upstreamSourceName,
    upstreamSourceUrl: sourceCandidate.upstreamSourceUrl,
    sourceCodeUrl: sourceCandidate.sourceCodeUrl,
    artifactSourceUrl: sourceCandidate.artifactSourceUrl,
    artifactFileName: sourceCandidate.artifactFileName,
    modelIdOrName: sourceCandidate.modelIdOrName,
    licenseClaim: sourceCandidate.licenseClaim,
    sourceEvidenceRefs: [...sourceCandidate.existingInternalEvidenceRefs],
    selectedCandidateReadyForManifestSupplementDraft,
    manifestSupplementAuthoringStatus: selectedCandidateReadyForManifestSupplementDraft
      ? 'ready_from_existing_internal_evidence_after_private_ref_authoring'
      : 'blocked_until_source_review_accepts_selected_candidate',
    nextAction: sourceCandidate.nextAction,
  }
}

function authoringChecklistItemForTool(
  record: AiGraphicsModelWeightManifestSupplementScaffoldRecord,
): AiGraphicsModelWeightManifestSupplementAuthoringChecklistItem {
  return {
    toolId: record.toolId,
    candidateId: record.sourceCandidateGuidance.candidateId,
    authoringReadiness: record.sourceCandidateGuidance.manifestSupplementAuthoringStatus,
    localOnlySupplementPath: `.local-artifacts/ai-graphics/model-weight-manifest-supplements/${record.relativeFilePath}`,
    acceptedPrivateEvidenceRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-'],
    requiredSupplementFields,
    requiredReviewBooleans: [...requiredReviewBooleans],
    sourceEvidenceRefs: record.sourceCandidateGuidance.sourceEvidenceRefs,
    validationCommands: [
      'npm run --silent ai-graphics:model-weight-manifest-supplement:validate -- --supplement-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_SUPPLEMENT_ROOT"',
      'npm run --silent ai-graphics:model-weight-manifest-authoring -- --evidence-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_CHECKSUM_EVIDENCE_ROOT" --supplement-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_SUPPLEMENT_ROOT" --out-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
      'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
      'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    ],
    localOnly: true,
    committedManifestSupplementApproved: false,
    nextAction: record.sourceCandidateGuidance.nextAction,
  }
}

export function buildAiGraphicsModelWeightManifestSupplementScaffoldPacket(): AiGraphicsModelWeightManifestSupplementScaffoldPacket {
  const scaffoldRecords = modelWeightManifestSupplementTools.map((toolId) => {
    const directoryName = directoryNameByTool[toolId]

    return {
      toolId,
      directoryName,
      relativeFilePath: `${directoryName}/manifest-review-supplement.json`,
      sourceCandidateGuidance: sourceCandidateGuidanceForTool(toolId),
      placeholderRecord: placeholderRecordForTool(toolId),
      placeholderSourceLicenseRefStatus: 'invalid_public_or_signed_ref' as const,
      placeholderModelCardRefStatus: 'invalid_public_or_signed_ref' as const,
      status: 'template_only_not_reviewed' as const,
    }
  })

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_SCAFFOLD_DECISION,
    totalAiGraphicsTools: 21,
    modelWeightManifestSupplementTools: [...modelWeightManifestSupplementTools],
    scaffoldRecords,
    authoringChecklist: scaffoldRecords.map(authoringChecklistItemForTool),
    booleans: {
      modelWeightManifestSupplementScaffoldPrepared: true,
      all5ModelWeightToolsCovered: true,
      manifestReviewSupplementChecklistPrepared: true,
      templatesInvalidUntilOwnerReviewed: true,
      privateEvidenceRefsNotLogged: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      modelWeightManifestsApprovedNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
