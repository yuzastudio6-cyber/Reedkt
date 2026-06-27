import type { AiGraphicsModelWeightManifestToolId } from './ai-graphics-model-weight-manifest-readiness'
import type { AiGraphicsModelWeightChecksumEvidenceRecord } from './ai-graphics-model-weight-checksum-evidence'
import {
  listAiGraphicsModelWeightSourceCandidates,
  type AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource,
  type AiGraphicsModelWeightSourceCandidateStatus,
  type AiGraphicsModelWeightSourceReviewStatus,
} from './ai-graphics-model-weight-source-catalog'

export const AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_SCAFFOLD_DECISION =
  'ai_graphics_model_weight_checksum_evidence_scaffold_prepared_for_local_private_records'

export interface AiGraphicsModelWeightChecksumEvidenceScaffoldSourceCandidateGuidance {
  candidateId: string
  candidateStatus: AiGraphicsModelWeightSourceCandidateStatus
  reviewStatus: AiGraphicsModelWeightSourceReviewStatus
  upstreamSourceName: string
  upstreamSourceUrl: string
  sourceCodeUrl?: string
  artifactSourceUrl?: string
  artifactFileName: string
  modelIdOrName: string
  suggestedPrivateManifestChecksumSha256?: string
  suggestedPrivateManifestChecksumSource: AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource
  checksumEvidenceStatus: string
  checksumStillMustMatchReviewedPrivateArtifact: true
  selectedCandidateReadyForChecksumEvidenceDraft: boolean
  checksumEvidenceAuthoringStatus:
    | 'ready_from_existing_internal_evidence_after_private_ref_authoring'
    | 'blocked_until_source_review_accepts_selected_candidate'
  nextAction: string
}

export interface AiGraphicsModelWeightChecksumEvidenceScaffoldRecord {
  toolId: AiGraphicsModelWeightManifestToolId
  directoryName: string
  relativeFilePath: string
  sourceCandidateGuidance: AiGraphicsModelWeightChecksumEvidenceScaffoldSourceCandidateGuidance
  placeholderRecord: AiGraphicsModelWeightChecksumEvidenceRecord
  placeholderChecksumEvidenceRefStatus: 'invalid_public_or_signed_ref'
  placeholderSourceArtifactRefStatus: 'invalid_public_or_signed_ref'
  placeholderArtifactSha256Status: 'invalid_until_replaced_or_reviewed'
  status: 'template_only_not_reviewed'
}

export interface AiGraphicsModelWeightChecksumEvidenceAuthoringChecklistItem {
  toolId: AiGraphicsModelWeightManifestToolId
  candidateId: string
  authoringReadiness:
    | 'ready_from_existing_internal_evidence_after_private_ref_authoring'
    | 'blocked_until_source_review_accepts_selected_candidate'
  localOnlyChecksumEvidencePath: string
  expectedArtifactFileName: string
  acceptedPrivateArtifactRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-']
  requiredEvidenceFields: string[]
  requiredReviewBooleans: [
    'checksumEvidenceReviewed',
    'sourceArtifactReviewed',
    'provenanceReviewed',
    'qualityReviewed',
    'securityReviewed',
    'approvedForManifestAuthoring',
  ]
  sourceEvidenceRefs: string[]
  suggestedPrivateManifestChecksumSha256?: string
  suggestedPrivateManifestChecksumSource: AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource
  checksumStillMustMatchReviewedPrivateArtifact: true
  validationCommands: [
    'npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_CHECKSUM_EVIDENCE_ROOT"',
    'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
  ]
  localOnly: true
  committedChecksumEvidenceApproved: false
  nextAction: string
}

export interface AiGraphicsModelWeightChecksumEvidenceScaffoldPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_SCAFFOLD_DECISION
  totalAiGraphicsTools: 21
  modelWeightChecksumEvidenceRequiredTools: AiGraphicsModelWeightManifestToolId[]
  scaffoldRecords: AiGraphicsModelWeightChecksumEvidenceScaffoldRecord[]
  authoringChecklist: AiGraphicsModelWeightChecksumEvidenceAuthoringChecklistItem[]
  booleans: {
    modelWeightChecksumEvidenceScaffoldPrepared: true
    all5ModelWeightToolsCovered: true
    checksumEvidenceAuthoringChecklistPrepared: true
    templatesInvalidUntilOwnerReviewed: true
    privateArtifactRefsNotLogged: true
    checksumEvidenceRefsNotLogged: true
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

const modelWeightChecksumEvidenceRequiredTools = [
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

const requiredEvidenceFields = [
  'evidenceId',
  'toolId',
  'sourceCandidateId',
  'artifactFileName',
  'artifactSha256',
  'checksumEvidenceRef',
  'sourceArtifactRef',
  'hashCommand',
  'checksumEvidenceReviewed',
  'sourceArtifactReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForManifestAuthoring',
]

const requiredReviewBooleans = [
  'checksumEvidenceReviewed',
  'sourceArtifactReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForManifestAuthoring',
] as const

function sourceCandidateForTool(toolId: AiGraphicsModelWeightManifestToolId) {
  const sourceCandidate = listAiGraphicsModelWeightSourceCandidates().find((candidate) => candidate.toolId === toolId)
  if (!sourceCandidate) {
    throw new Error(`Missing AI graphics model-weight source candidate for checksum evidence scaffold: ${toolId}`)
  }
  return sourceCandidate
}

function artifactFileNameForTool(toolId: AiGraphicsModelWeightManifestToolId): string {
  const candidate = sourceCandidateForTool(toolId)
  return candidate.artifactFileName ?? candidate.modelIdOrName
}

function placeholderRecordForTool(toolId: AiGraphicsModelWeightManifestToolId): AiGraphicsModelWeightChecksumEvidenceRecord {
  const sourceCandidate = sourceCandidateForTool(toolId)
  const directoryName = directoryNameByTool[toolId]

  return {
    evidenceId: `${toolId}_private_checksum_evidence_v1`,
    toolId,
    sourceCandidateId: sourceCandidate.candidateId,
    artifactFileName: artifactFileNameForTool(toolId),
    artifactSha256: sourceCandidate.suggestedPrivateManifestChecksumSha256 ?? 'REPLACE_WITH_64_HEX_SHA256',
    checksumEvidenceRef: `public://replace-with-reviewed-private-checksum-evidence/${directoryName}.json`,
    sourceArtifactRef: `public://replace-with-reviewed-private-source-artifact/${directoryName}`,
    hashCommand: `sha256sum REPLACE_WITH_LOCAL_PRIVATE_ARTIFACT_PATH/${artifactFileNameForTool(toolId)}`,
    checksumEvidenceReviewed: false,
    sourceArtifactReviewed: false,
    provenanceReviewed: false,
    qualityReviewed: false,
    securityReviewed: false,
    approvedForManifestAuthoring: false,
  }
}

function sourceCandidateGuidanceForTool(
  toolId: AiGraphicsModelWeightManifestToolId,
): AiGraphicsModelWeightChecksumEvidenceScaffoldSourceCandidateGuidance {
  const sourceCandidate = sourceCandidateForTool(toolId)
  const selectedCandidateReadyForChecksumEvidenceDraft =
    sourceCandidate.candidateStatus === 'internal_evidence_verified_private_manifest_required'

  return {
    candidateId: sourceCandidate.candidateId,
    candidateStatus: sourceCandidate.candidateStatus,
    reviewStatus: sourceCandidate.reviewStatus,
    upstreamSourceName: sourceCandidate.upstreamSourceName,
    upstreamSourceUrl: sourceCandidate.upstreamSourceUrl,
    sourceCodeUrl: sourceCandidate.sourceCodeUrl,
    artifactSourceUrl: sourceCandidate.artifactSourceUrl,
    artifactFileName: artifactFileNameForTool(toolId),
    modelIdOrName: sourceCandidate.modelIdOrName,
    suggestedPrivateManifestChecksumSha256: sourceCandidate.suggestedPrivateManifestChecksumSha256,
    suggestedPrivateManifestChecksumSource: sourceCandidate.suggestedPrivateManifestChecksumSource,
    checksumEvidenceStatus: sourceCandidate.checksumEvidenceStatus,
    checksumStillMustMatchReviewedPrivateArtifact: true,
    selectedCandidateReadyForChecksumEvidenceDraft,
    checksumEvidenceAuthoringStatus: selectedCandidateReadyForChecksumEvidenceDraft
      ? 'ready_from_existing_internal_evidence_after_private_ref_authoring'
      : 'blocked_until_source_review_accepts_selected_candidate',
    nextAction: sourceCandidate.nextAction,
  }
}

function authoringChecklistItemForTool(
  record: AiGraphicsModelWeightChecksumEvidenceScaffoldRecord,
): AiGraphicsModelWeightChecksumEvidenceAuthoringChecklistItem {
  const sourceCandidate = sourceCandidateForTool(record.toolId)

  return {
    toolId: record.toolId,
    candidateId: record.sourceCandidateGuidance.candidateId,
    authoringReadiness: record.sourceCandidateGuidance.checksumEvidenceAuthoringStatus,
    localOnlyChecksumEvidencePath: `.local-artifacts/ai-graphics/model-weight-checksum-evidence/${record.relativeFilePath}`,
    expectedArtifactFileName: record.sourceCandidateGuidance.artifactFileName,
    acceptedPrivateArtifactRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-'],
    requiredEvidenceFields,
    requiredReviewBooleans: [...requiredReviewBooleans],
    sourceEvidenceRefs: [...sourceCandidate.existingInternalEvidenceRefs],
    suggestedPrivateManifestChecksumSha256: record.sourceCandidateGuidance.suggestedPrivateManifestChecksumSha256,
    suggestedPrivateManifestChecksumSource: record.sourceCandidateGuidance.suggestedPrivateManifestChecksumSource,
    checksumStillMustMatchReviewedPrivateArtifact: true,
    validationCommands: [
      'npm run --silent ai-graphics:model-weight-checksum-evidence:validate -- --evidence-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_CHECKSUM_EVIDENCE_ROOT"',
      'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
      'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    ],
    localOnly: true,
    committedChecksumEvidenceApproved: false,
    nextAction: record.sourceCandidateGuidance.nextAction,
  }
}

export function buildAiGraphicsModelWeightChecksumEvidenceScaffoldPacket(): AiGraphicsModelWeightChecksumEvidenceScaffoldPacket {
  const scaffoldRecords = modelWeightChecksumEvidenceRequiredTools.map((toolId) => {
    const directoryName = directoryNameByTool[toolId]

    return {
      toolId,
      directoryName,
      relativeFilePath: `${directoryName}/checksum-evidence.json`,
      sourceCandidateGuidance: sourceCandidateGuidanceForTool(toolId),
      placeholderRecord: placeholderRecordForTool(toolId),
      placeholderChecksumEvidenceRefStatus: 'invalid_public_or_signed_ref' as const,
      placeholderSourceArtifactRefStatus: 'invalid_public_or_signed_ref' as const,
      placeholderArtifactSha256Status: 'invalid_until_replaced_or_reviewed' as const,
      status: 'template_only_not_reviewed' as const,
    }
  })
  const authoringChecklist = scaffoldRecords.map(authoringChecklistItemForTool)

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_SCAFFOLD_DECISION,
    totalAiGraphicsTools: 21,
    modelWeightChecksumEvidenceRequiredTools: [...modelWeightChecksumEvidenceRequiredTools],
    scaffoldRecords,
    authoringChecklist,
    booleans: {
      modelWeightChecksumEvidenceScaffoldPrepared: true,
      all5ModelWeightToolsCovered: true,
      checksumEvidenceAuthoringChecklistPrepared: true,
      templatesInvalidUntilOwnerReviewed: true,
      privateArtifactRefsNotLogged: true,
      checksumEvidenceRefsNotLogged: true,
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
