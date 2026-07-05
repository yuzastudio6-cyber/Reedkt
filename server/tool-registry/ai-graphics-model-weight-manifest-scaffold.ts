import { getGpuModelWeightManifestTemplate } from '../model-weights'
import type {
  AiGraphicsModelWeightManifestEvidenceRecord,
  AiGraphicsModelWeightManifestToolId,
} from './ai-graphics-model-weight-manifest-readiness'
import {
  listAiGraphicsModelWeightSourceCandidates,
  type AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource,
  type AiGraphicsModelWeightSourceCandidateStatus,
  type AiGraphicsModelWeightSourceReviewStatus,
} from './ai-graphics-model-weight-source-catalog'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SCAFFOLD_DECISION =
  'ai_graphics_model_weight_manifest_scaffold_prepared_for_local_private_records'

export interface AiGraphicsModelWeightManifestScaffoldRecord {
  toolId: AiGraphicsModelWeightManifestToolId
  templateId: string
  directoryName: string
  relativeFilePath: string
  expectedRuntimePath: string
  sourceCandidateGuidance: AiGraphicsModelWeightManifestScaffoldSourceCandidateGuidance
  placeholderRecord: AiGraphicsModelWeightManifestEvidenceRecord
  placeholderPrivateArtifactRefStatus: 'invalid_public_or_signed_ref'
  status: 'template_only_not_reviewed'
}

export interface AiGraphicsModelWeightManifestAuthoringChecklistItem {
  toolId: AiGraphicsModelWeightManifestToolId
  candidateId: string
  authoringReadiness:
    | 'ready_from_existing_internal_evidence_after_private_ref_authoring'
    | 'blocked_until_source_review_accepts_selected_candidate'
  localOnlyManifestPath: string
  expectedRuntimeManifestPath: string
  acceptedPrivateArtifactRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-']
  requiredManifestFields: string[]
  requiredReviewBooleans: [
    'checksumEvidenceReviewed',
    'commercialUseReviewed',
    'redistributionReviewed',
    'qualityReviewed',
    'securityReviewed',
    'provenanceReviewed',
    'approvedForInternalBeta',
  ]
  sourceEvidenceRefs: string[]
  suggestedPrivateManifestChecksumSha256?: string
  suggestedPrivateManifestChecksumSource: AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource
  checksumStillMustMatchReviewedPrivateArtifact: true
  validationCommands: [
    'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
  ]
  localOnly: true
  committedManifestApproved: false
  nextAction: string
}

export interface AiGraphicsModelWeightManifestScaffoldSourceCandidateGuidance {
  candidateId: string
  candidateStatus: AiGraphicsModelWeightSourceCandidateStatus
  reviewStatus: AiGraphicsModelWeightSourceReviewStatus
  upstreamSourceName: string
  upstreamSourceUrl: string
  sourceCodeUrl?: string
  artifactSourceUrl?: string
  artifactFileName?: string
  upstreamArtifactChecksumMd5?: string
  modelIdOrName: string
  suggestedPrivateManifestChecksumSha256?: string
  suggestedPrivateManifestChecksumSource: AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource
  checksumStillMustMatchReviewedPrivateArtifact: true
  checksumEvidenceStatus: string
  licenseClaim: string
  reviewRequiredBeforePrivateManifest: true
  selectedCandidateReadyForPrivateManifestDraft: boolean
  privateManifestAuthoringStatus:
    | 'ready_from_existing_internal_evidence_after_private_ref_authoring'
    | 'blocked_until_source_review_accepts_selected_candidate'
  nextAction: string
}

export interface AiGraphicsModelWeightManifestScaffoldPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SCAFFOLD_DECISION
  totalAiGraphicsTools: 21
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  scaffoldRecords: AiGraphicsModelWeightManifestScaffoldRecord[]
  authoringChecklist: AiGraphicsModelWeightManifestAuthoringChecklistItem[]
  booleans: {
    modelWeightManifestScaffoldPrepared: true
    all5ModelWeightToolsCovered: true
    runtimeMountLayoutPrepared: true
    manifestAuthoringChecklistPrepared: true
    templatesInvalidUntilOwnerReviewed: true
    privateArtifactRefsNotLogged: true
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

const modelWeightManifestRequiredTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

const templateIdByTool = {
  sam2: 'sam2_checkpoint',
  birefnet: 'birefnet_model',
  real_esrgan: 'real_esrgan_model',
  rembg: 'rembg_model',
  transparent_background: 'transparent_background_model',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

const directoryNameByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

const expectedRuntimeManifestPathByTool = {
  sam2: '/opt/reeditpro/model-weights/sam2/model_tree_manifest.json',
  birefnet: '/opt/reeditpro/model-weights/birefnet/model_tree_manifest.json',
  real_esrgan: '/opt/reeditpro/model-weights/real-esrgan/model_tree_manifest.json',
  rembg: '/opt/reeditpro/model-weights/rembg/model_tree_manifest.json',
  transparent_background: '/opt/reeditpro/model-weights/transparent-background/model_tree_manifest.json',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

const upstreamArtifactChecksumMd5ByTool: Partial<Record<AiGraphicsModelWeightManifestToolId, string>> = {
  transparent_background: 'd692e3dd5fa1b9658949d452bebf1cda',
}

const requiredManifestFields = [
  'manifestId',
  'toolId',
  'templateId',
  'sourceCandidateId',
  'privateArtifactRef',
  'checksumSha256',
  'checksumEvidenceRef',
  'sourceLicenseRef',
  'modelCardRef',
  'checksumEvidenceReviewed',
  'commercialUseReviewed',
  'redistributionReviewed',
  'qualityReviewed',
  'securityReviewed',
  'provenanceReviewed',
  'approvedForInternalBeta',
]

const requiredReviewBooleans = [
  'checksumEvidenceReviewed',
  'commercialUseReviewed',
  'redistributionReviewed',
  'qualityReviewed',
  'securityReviewed',
  'provenanceReviewed',
  'approvedForInternalBeta',
] as const

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function sourceCandidateIdForTool(toolId: AiGraphicsModelWeightManifestToolId): string {
  const sourceCandidate = listAiGraphicsModelWeightSourceCandidates().find((candidate) => candidate.toolId === toolId)
  if (!sourceCandidate) {
    throw new Error(`Missing AI graphics model-weight source candidate for scaffold: ${toolId}`)
  }
  return sourceCandidate.candidateId
}

function placeholderRecordForTool(
  toolId: AiGraphicsModelWeightManifestToolId,
  templateId: string,
): AiGraphicsModelWeightManifestEvidenceRecord {
  const directoryName = directoryNameByTool[toolId]

  return {
    manifestId: `${toolId}_private_manifest_review_v1`,
    toolId,
    templateId: templateId as AiGraphicsModelWeightManifestEvidenceRecord['templateId'],
    sourceCandidateId: sourceCandidateIdForTool(toolId),
    privateArtifactRef: `public://replace-with-reviewed-private-artifact-ref/${directoryName}/model_tree_manifest.json`,
    checksumSha256: 'REPLACE_WITH_64_HEX_SHA256',
    checksumEvidenceRef: `public://replace-with-reviewed-private-checksum-evidence/${directoryName}.json`,
    sourceLicenseRef: `private://replace-with-reviewed-source-license-evidence/${directoryName}.json`,
    modelCardRef: `private://replace-with-reviewed-model-card-provenance/${directoryName}.json`,
    checksumEvidenceReviewed: false,
    commercialUseReviewed: false,
    redistributionReviewed: false,
    qualityReviewed: false,
    securityReviewed: false,
    provenanceReviewed: false,
    approvedForInternalBeta: false,
  }
}

function sourceCandidateGuidanceForTool(
  toolId: AiGraphicsModelWeightManifestToolId,
): AiGraphicsModelWeightManifestScaffoldSourceCandidateGuidance {
  const sourceCandidate = listAiGraphicsModelWeightSourceCandidates().find((candidate) => candidate.toolId === toolId)
  if (!sourceCandidate) {
    throw new Error(`Missing AI graphics model-weight source candidate for scaffold: ${toolId}`)
  }

  const selectedCandidateReadyForPrivateManifestDraft =
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
    upstreamArtifactChecksumMd5: upstreamArtifactChecksumMd5ByTool[toolId],
    modelIdOrName: sourceCandidate.modelIdOrName,
    suggestedPrivateManifestChecksumSha256: sourceCandidate.suggestedPrivateManifestChecksumSha256,
    suggestedPrivateManifestChecksumSource: sourceCandidate.suggestedPrivateManifestChecksumSource,
    checksumStillMustMatchReviewedPrivateArtifact: true,
    checksumEvidenceStatus: sourceCandidate.checksumEvidenceStatus,
    licenseClaim: sourceCandidate.licenseClaim,
    reviewRequiredBeforePrivateManifest: true,
    selectedCandidateReadyForPrivateManifestDraft,
    privateManifestAuthoringStatus: selectedCandidateReadyForPrivateManifestDraft
      ? 'ready_from_existing_internal_evidence_after_private_ref_authoring'
      : 'blocked_until_source_review_accepts_selected_candidate',
    nextAction: sourceCandidate.nextAction,
  }
}

function authoringChecklistItemForTool(
  record: AiGraphicsModelWeightManifestScaffoldRecord,
): AiGraphicsModelWeightManifestAuthoringChecklistItem {
  return {
    toolId: record.toolId,
    candidateId: record.sourceCandidateGuidance.candidateId,
    authoringReadiness: record.sourceCandidateGuidance.privateManifestAuthoringStatus,
    localOnlyManifestPath: `.local-artifacts/ai-graphics/model-weight-manifests/${record.relativeFilePath}`,
    expectedRuntimeManifestPath: expectedRuntimeManifestPathByTool[record.toolId],
    acceptedPrivateArtifactRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-'],
    requiredManifestFields,
    requiredReviewBooleans: [...requiredReviewBooleans],
    sourceEvidenceRefs: listAiGraphicsModelWeightSourceCandidates()
      .find((candidate) => candidate.toolId === record.toolId)?.existingInternalEvidenceRefs ?? [],
    suggestedPrivateManifestChecksumSha256: record.sourceCandidateGuidance.suggestedPrivateManifestChecksumSha256,
    suggestedPrivateManifestChecksumSource: record.sourceCandidateGuidance.suggestedPrivateManifestChecksumSource,
    checksumStillMustMatchReviewedPrivateArtifact: true,
    validationCommands: [
      'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
      'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
    ],
    localOnly: true,
    committedManifestApproved: false,
    nextAction: record.sourceCandidateGuidance.nextAction,
  }
}

export function buildAiGraphicsModelWeightManifestScaffoldPacket(): AiGraphicsModelWeightManifestScaffoldPacket {
  const scaffoldRecords = modelWeightManifestRequiredTools.map((toolId) => {
    const templateId = templateIdByTool[toolId]
    const template = getGpuModelWeightManifestTemplate(templateId)
    if (!template) {
      throw new Error(`Missing AI graphics model-weight manifest template: ${templateId}`)
    }

    const directoryName = directoryNameByTool[toolId]

    return {
      toolId,
      templateId,
      directoryName,
      relativeFilePath: `${directoryName}/model_tree_manifest.json`,
      expectedRuntimePath: `${trimTrailingSlash(template.expectedPath)}/model_tree_manifest.json`,
      sourceCandidateGuidance: sourceCandidateGuidanceForTool(toolId),
      placeholderRecord: placeholderRecordForTool(toolId, templateId),
      placeholderPrivateArtifactRefStatus: 'invalid_public_or_signed_ref' as const,
      status: 'template_only_not_reviewed' as const,
    }
  })
  const authoringChecklist = scaffoldRecords.map(authoringChecklistItemForTool)

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SCAFFOLD_DECISION,
    totalAiGraphicsTools: 21,
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    scaffoldRecords,
    authoringChecklist,
    booleans: {
      modelWeightManifestScaffoldPrepared: true,
      all5ModelWeightToolsCovered: true,
      runtimeMountLayoutPrepared: true,
      manifestAuthoringChecklistPrepared: true,
      templatesInvalidUntilOwnerReviewed: true,
      privateArtifactRefsNotLogged: true,
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
