import { REAL_ESRGAN_X4PLUS_RUNTIME_PATH, getEnhancementModelApprovalCandidate } from '../activation/enhancement-model-approval/enhancement-model-candidate-registry'
import { enhancementEvidenceForCandidate } from '../activation/enhancement-model-approval/enhancement-model-license-evidence'
import { getMaskModelApprovalCandidate } from '../activation/mask-model-approval/mask-model-candidate-registry'
import { maskEvidenceForCandidate } from '../activation/mask-model-approval/mask-model-license-evidence'
import { approvedMaskModelDownloadEvidence } from '../activation/mask-model-download/approved-mask-model-download-evidence'
import { approvedEnhancementModelDownloadEvidence } from '../activation/enhancement-model-download/approved-enhancement-model-download-evidence'
import { approvedSam2ModelDownloadEvidence } from '../activation/sam2-model-download/approved-sam2-model-download-evidence'
import { approvedSam2RuntimeEvidence } from '../activation/sam2-runtime/approved-sam2-runtime-evidence'
import { sam2RuntimeConfig } from '../activation/sam2-runtime/sam2-runtime-policy'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'
import type { AiGraphicsModelWeightManifestToolId } from './ai-graphics-model-weight-manifest-readiness'

export const AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION =
  'ai_graphics_model_weight_source_catalog_prepared_with_review_blocks'

export type AiGraphicsModelWeightSourceCandidateStatus =
  | 'internal_evidence_verified_private_manifest_required'
  | 'source_identified_review_required'
  | 'source_menu_identified_selection_required'

export type AiGraphicsModelWeightSourceReviewStatus =
  | 'limited_staging_evidence_exists_manifest_review_required'
  | 'requires_manual_source_license_checksum_and_quality_review'
  | 'requires_model_choice_license_checksum_and_quality_review'

export type AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource =
  | 'existing_internal_aggregate_sha256'
  | 'existing_internal_file_sha256'
  | 'requires_private_artifact_sha256'

export interface AiGraphicsModelWeightFoundationGpuTool {
  toolId: Extract<AiGraphicsCanonicalToolId, 'torch_torchvision' | 'transformers' | 'kornia'>
  runtimeTarget: string
  standaloneModelWeightManifestRequired: false
  reason: string
  nextProofMilestone: string
}

export interface AiGraphicsModelWeightSourceCandidate {
  toolId: AiGraphicsModelWeightManifestToolId
  candidateId: string
  candidateStatus: AiGraphicsModelWeightSourceCandidateStatus
  reviewStatus: AiGraphicsModelWeightSourceReviewStatus
  upstreamSourceName: string
  upstreamSourceUrl: string
  sourceCodeUrl?: string
  artifactSourceUrl?: string
  artifactFileName?: string
  modelIdOrName: string
  expectedRuntimePath: string
  existingInternalEvidenceRefs: string[]
  existingInternalEvidenceSummary: string
  suggestedPrivateManifestChecksumSha256?: string
  suggestedPrivateManifestChecksumSource: AiGraphicsModelWeightSuggestedPrivateManifestChecksumSource
  checksumStillMustMatchReviewedPrivateArtifact: true
  checksumEvidenceStatus:
    | 'accepted_from_existing_internal_evidence_private_manifest_still_required'
    | 'release_asset_checksum_required_before_private_manifest'
    | 'checksum_required_before_private_manifest'
  licenseClaim:
    | 'apache_2_0_source_claim_requires_owner_manifest_record'
    | 'bsd_3_clause_repository_evidence_release_asset_requires_review'
    | 'mit_source_claim_requires_owner_manifest_record'
    | 'unknown_requires_review'
  commercialUseReviewStatus: 'requires_manual_review' | 'limited_staging_review_only'
  redistributionReviewStatus: 'requires_manual_review' | 'limited_staging_review_only'
  privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace'
  approvedForInternalBetaNow: false
  modelWeightsDownloaded: false
  modelWeightsLoaded: false
  modelInferencePerformed: false
  gpuRuntimeApprovedNow: false
  runtimeReadyNow: false
  nextAction: string
}

export type AiGraphicsModelWeightPrivateManifestPreparationStatus =
  | 'ready_for_private_manifest_authoring_from_existing_evidence'
  | 'blocked_pending_source_selection_or_review'

export interface AiGraphicsModelWeightPrivateManifestPreparationRow {
  toolId: AiGraphicsModelWeightManifestToolId
  candidateId: string
  preparationStatus: AiGraphicsModelWeightPrivateManifestPreparationStatus
  localOnlyManifestPath: string
  expectedRuntimeManifestPath: string
  acceptedPrivateArtifactRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-']
  sourceEvidenceRefs: string[]
  privateManifestReviewCommand: 'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"'
  gpuProofCommandPlanCommand: 'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"'
  ownerReviewRequired: true
  localOnly: true
  committedManifestApproved: false
  modelDownloadRequiredNow: false
  modelWeightsLoaded: false
  modelInferencePerformed: false
  nextAction: string
}

export interface AiGraphicsModelWeightSourceCatalogPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  foundationGpuToolsWithoutStandaloneManifest: AiGraphicsModelWeightFoundationGpuTool[]
  modelWeightSourceCatalogTools: AiGraphicsModelWeightManifestToolId[]
  sourceCandidates: AiGraphicsModelWeightSourceCandidate[]
  privateManifestPreparationPlan: AiGraphicsModelWeightPrivateManifestPreparationRow[]
  sourceCatalogCounts: {
    gpuRuntimeTargetedTools: 8
    foundationGpuToolsWithoutStandaloneManifest: 3
    modelWeightSourceCatalogTools: 5
    sourceCandidatesCovered: 5
    internalEvidenceBackedCandidates: number
    sourceIdentifiedReviewRequiredCandidates: number
    sourceMenuSelectionRequiredCandidates: number
    suggestedPrivateManifestChecksumsFromExistingEvidence: number
    privateArtifactSha256StillRequired: number
    readyForPrivateManifestAuthoringFromExistingEvidence: number
    blockedPendingSourceSelectionOrReview: number
    privateManifestsApprovedNow: 0
    betaReadyModelWeightTools: 0
  }
  gpuRuntimeActivationPolicy: {
    onDemandOnly: true
    noIdleGpuRuntimeApproved: true
    startsOnlyForApprovedWorkerOrToolCall: true
    cpuFallbackAllowedForHeavyTools: false
  }
  booleans: {
    modelWeightSourceCatalogPrepared: true
    all8GpuRuntimeToolsCovered: true
    all5ModelWeightSourceToolsCovered: true
    sourceCandidatesIdentifiedForAll5ModelWeightTools: true
    internalEvidenceBackedSourcesRecorded: true
    privateManifestPreparationPlanPrepared: true
    existingEvidenceCanAuthor3PrivateManifestDrafts: true
    sourceSelectionStillBlocks2PrivateManifestDrafts: false
    sourceReviewStillBlocks2PrivateManifestDrafts: true
    existingEvidenceChecksumSuggestionsRecorded: true
    privateArtifactSha256StillRequiredFor2: true
    suggestedChecksumsDoNotApprovePrivateManifest: true
    privateManifestReviewStillRequired: true
    privateArtifactRefNamespaceRequired: true
    checksumReviewStillRequired: true
    licenseReviewStillRequired: true
    provenanceReviewStillRequired: true
    qualityReviewStillRequired: true
    securityReviewStillRequired: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    cpuFallbackAllowedForHeavyTools: false
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
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const gpuRuntimeTargetedTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

const foundationGpuToolsWithoutStandaloneManifest = [
  {
    toolId: 'torch_torchvision',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    standaloneModelWeightManifestRequired: false,
    reason: 'CUDA tensor/runtime package foundation; downstream model tools own concrete model-weight manifests.',
    nextProofMilestone: 'native_gpu_import_and_tiny_tensor_runtime_proof_with_no_model_download',
  },
  {
    toolId: 'transformers',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    standaloneModelWeightManifestRequired: false,
    reason: 'Model loader package foundation; from-hub loading remains blocked without downstream private manifests.',
    nextProofMilestone: 'native_gpu_import_runtime_proof_with_remote_model_downloads_disabled',
  },
  {
    toolId: 'kornia',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    standaloneModelWeightManifestRequired: false,
    reason: 'Tensor/image operations package; no standalone model-weight artifact is required.',
    nextProofMilestone: 'native_gpu_import_and_tensor_image_ops_fixture_proof',
  },
] as const satisfies readonly AiGraphicsModelWeightFoundationGpuTool[]

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

const modelWeightSourceCatalogTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

function realEsrganCandidate(): AiGraphicsModelWeightSourceCandidate {
  const candidate = getEnhancementModelApprovalCandidate('xinntao_real_esrgan_x4plus')
  const licenseEvidence = enhancementEvidenceForCandidate('xinntao_real_esrgan_x4plus')

  return {
    toolId: 'real_esrgan',
    candidateId: 'xinntao_real_esrgan_x4plus',
    candidateStatus: 'internal_evidence_verified_private_manifest_required',
    reviewStatus: 'limited_staging_evidence_exists_manifest_review_required',
    upstreamSourceName: 'xinntao/Real-ESRGAN',
    upstreamSourceUrl: candidate?.sourceUrl ?? 'https://github.com/xinntao/Real-ESRGAN',
    artifactSourceUrl: candidate?.releaseAssetUrl ?? 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
    artifactFileName: 'RealESRGAN_x4plus.pth',
    modelIdOrName: candidate?.modelName ?? 'RealESRGAN_x4plus',
    expectedRuntimePath: candidate?.expectedPath ?? REAL_ESRGAN_X4PLUS_RUNTIME_PATH,
    existingInternalEvidenceRefs: [
      'server/activation/enhancement-model-approval/enhancement-model-candidate-registry.ts',
      'server/activation/enhancement-model-approval/enhancement-model-license-evidence.ts',
      'server/activation/enhancement-model-download/approved-enhancement-model-download-evidence.ts',
    ],
    existingInternalEvidenceSummary: `Found ${licenseEvidence.length} existing Real-ESRGAN license/source evidence records plus ${approvedEnhancementModelDownloadEvidence.status} Phase 34B staging storage evidence with aggregate SHA-256 ${approvedEnhancementModelDownloadEvidence.aggregateSha256}; the selected single release asset SHA-256 is recorded for private manifest authoring, but acceptance is limited to staging sample-first planning and does not approve beta runtime.`,
    suggestedPrivateManifestChecksumSha256: approvedEnhancementModelDownloadEvidence.fileSha256,
    suggestedPrivateManifestChecksumSource: 'existing_internal_file_sha256',
    checksumStillMustMatchReviewedPrivateArtifact: true,
    checksumEvidenceStatus: 'release_asset_checksum_required_before_private_manifest',
    licenseClaim: 'bsd_3_clause_repository_evidence_release_asset_requires_review',
    commercialUseReviewStatus: 'limited_staging_review_only',
    redistributionReviewStatus: 'limited_staging_review_only',
    privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
    approvedForInternalBetaNow: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    modelInferencePerformed: false,
    gpuRuntimeApprovedNow: false,
    runtimeReadyNow: false,
    nextAction: 'Create reviewed private RealESRGAN_x4plus manifest with checksum, source/license evidence, model-card/provenance evidence, quality/security review, and then run native L4 proof.',
  }
}

export function listAiGraphicsModelWeightSourceCandidates(): AiGraphicsModelWeightSourceCandidate[] {
  const birefnetCandidate = getMaskModelApprovalCandidate('zhengpeng7_birefnet')
  const birefnetLicenseEvidence = maskEvidenceForCandidate('zhengpeng7_birefnet')

  return [
    {
      toolId: 'sam2',
      candidateId: 'facebook_sam2_1_hiera_tiny_existing_staging_evidence',
      candidateStatus: 'internal_evidence_verified_private_manifest_required',
      reviewStatus: 'limited_staging_evidence_exists_manifest_review_required',
      upstreamSourceName: 'facebookresearch/sam2',
      upstreamSourceUrl: 'https://github.com/facebookresearch/sam2',
      artifactSourceUrl: sam2RuntimeConfig.modelGcsPath,
      artifactFileName: sam2RuntimeConfig.checkpointFileName,
      modelIdOrName: sam2RuntimeConfig.modelId,
      expectedRuntimePath: sam2RuntimeConfig.modelRuntimePath,
      existingInternalEvidenceRefs: [
        'server/activation/sam2-model-download/approved-sam2-model-download-evidence.ts',
        'server/activation/sam2-runtime/sam2-runtime-policy.ts',
        'server/activation/sam2-runtime/approved-sam2-runtime-evidence.ts',
      ],
      existingInternalEvidenceSummary: `Existing SAM2 download evidence is ${approvedSam2ModelDownloadEvidence.status} for ${approvedSam2ModelDownloadEvidence.modelId} with aggregate SHA-256 ${approvedSam2ModelDownloadEvidence.aggregateSha256}, and runtime evidence is ${approvedSam2RuntimeEvidence.status} for ${approvedSam2RuntimeEvidence.modelId} on generated synthetic fixtures only; raw gs:// refs remain source evidence and are rejected as public manifest refs.`,
      suggestedPrivateManifestChecksumSha256: approvedSam2ModelDownloadEvidence.aggregateSha256,
      suggestedPrivateManifestChecksumSource: 'existing_internal_aggregate_sha256',
      checksumStillMustMatchReviewedPrivateArtifact: true,
      checksumEvidenceStatus: 'accepted_from_existing_internal_evidence_private_manifest_still_required',
      licenseClaim: 'apache_2_0_source_claim_requires_owner_manifest_record',
      commercialUseReviewStatus: 'limited_staging_review_only',
      redistributionReviewStatus: 'limited_staging_review_only',
      privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
      approvedForInternalBetaNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      nextAction: 'Convert existing SAM2.1 tiny staging evidence into a reviewed private manifest using a private:// or reeditpro-private:// artifact ref, then rerun native L4 proof for AI graphics.',
    },
    {
      toolId: 'birefnet',
      candidateId: 'zhengpeng7_birefnet_official_weights_review_candidate',
      candidateStatus: 'internal_evidence_verified_private_manifest_required',
      reviewStatus: 'limited_staging_evidence_exists_manifest_review_required',
      upstreamSourceName: 'ZhengPeng7/BiRefNet',
      upstreamSourceUrl: birefnetCandidate?.sourceUrl ?? 'https://huggingface.co/ZhengPeng7/BiRefNet',
      sourceCodeUrl: birefnetCandidate?.officialGithubUrl ?? 'https://github.com/ZhengPeng7/BiRefNet',
      modelIdOrName: birefnetCandidate?.modelName ?? approvedMaskModelDownloadEvidence.modelName,
      expectedRuntimePath: approvedMaskModelDownloadEvidence.runtimePath,
      existingInternalEvidenceRefs: [
        'server/activation/mask-model-approval/mask-model-candidate-registry.ts',
        'server/activation/mask-model-approval/mask-model-license-evidence.ts',
        'server/activation/mask-model-download/approved-mask-model-download-evidence.ts',
      ],
      existingInternalEvidenceSummary: `Found ${birefnetLicenseEvidence.length} existing BiRefNet license/source evidence records plus ${approvedMaskModelDownloadEvidence.status} Phase 33B staging storage evidence at revision ${approvedMaskModelDownloadEvidence.resolvedRevision} with aggregate SHA-256 ${approvedMaskModelDownloadEvidence.aggregateSha256}; acceptance is limited to staging single-frame background-removal planning and does not approve beta runtime.`,
      suggestedPrivateManifestChecksumSha256: approvedMaskModelDownloadEvidence.aggregateSha256,
      suggestedPrivateManifestChecksumSource: 'existing_internal_aggregate_sha256',
      checksumStillMustMatchReviewedPrivateArtifact: true,
      checksumEvidenceStatus: 'accepted_from_existing_internal_evidence_private_manifest_still_required',
      licenseClaim: 'mit_source_claim_requires_owner_manifest_record',
      commercialUseReviewStatus: 'limited_staging_review_only',
      redistributionReviewStatus: 'limited_staging_review_only',
      privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
      approvedForInternalBetaNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      nextAction: 'Convert existing Phase 33 BiRefNet staging evidence into a reviewed private manifest using a private:// or reeditpro-private:// artifact ref, then run native L4 proof for AI graphics.',
    },
    realEsrganCandidate(),
    {
      toolId: 'rembg',
      candidateId: 'danielgatis_rembg_isnet_general_use_review_candidate',
      candidateStatus: 'source_identified_review_required',
      reviewStatus: 'requires_manual_source_license_checksum_and_quality_review',
      upstreamSourceName: 'danielgatis/rembg',
      upstreamSourceUrl: 'https://github.com/danielgatis/rembg',
      sourceCodeUrl: 'https://github.com/xuebinqin/DIS',
      artifactSourceUrl: 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx',
      artifactFileName: 'isnet-general-use.onnx',
      modelIdOrName: 'isnet-general-use',
      expectedRuntimePath: '/opt/reeditpro/model-weights/rembg/',
      existingInternalEvidenceRefs: [],
      existingInternalEvidenceSummary: 'Primary-source review selected rembg isnet-general-use as the ReeditPro default candidate because upstream rembg documents it as a general-use model, stores models under ~/.u2net/U2NET_HOME, and supports NVIDIA GPU installs with rembg[gpu]; DIS source evidence remains review-required before private manifest approval.',
      suggestedPrivateManifestChecksumSource: 'requires_private_artifact_sha256',
      checksumStillMustMatchReviewedPrivateArtifact: true,
      checksumEvidenceStatus: 'checksum_required_before_private_manifest',
      licenseClaim: 'apache_2_0_source_claim_requires_owner_manifest_record',
      commercialUseReviewStatus: 'requires_manual_review',
      redistributionReviewStatus: 'requires_manual_review',
      privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
      approvedForInternalBetaNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      nextAction: 'Review DIS/rembg isnet-general-use license and provenance, checksum the private isnet-general-use.onnx artifact tree, record the U2NET_HOME cache layout, create a private manifest, and then run native L4 proof.',
    },
    {
      toolId: 'transparent_background',
      candidateId: 'plemeri_transparent_background_base_ckpt_review_candidate',
      candidateStatus: 'source_identified_review_required',
      reviewStatus: 'requires_manual_source_license_checksum_and_quality_review',
      upstreamSourceName: 'plemeri/transparent-background',
      upstreamSourceUrl: 'https://github.com/plemeri/transparent-background',
      sourceCodeUrl: 'https://github.com/plemeri/InSPyReNet',
      artifactSourceUrl: 'https://github.com/plemeri/transparent-background/releases/download/1.2.12/ckpt_base.pth',
      artifactFileName: 'ckpt_base.pth',
      modelIdOrName: 'transparent-background base mode ckpt_base.pth',
      expectedRuntimePath: '/opt/reeditpro/model-weights/transparent-background/',
      existingInternalEvidenceRefs: [],
      existingInternalEvidenceSummary: 'Primary-source review selected the upstream default base mode checkpoint, ckpt_base.pth from transparent-background v1.2.12, with upstream config MD5 d692e3dd5fa1b9658949d452bebf1cda; private manifest, license, redistribution, checksum, and quality/security review are still not approved.',
      suggestedPrivateManifestChecksumSource: 'requires_private_artifact_sha256',
      checksumStillMustMatchReviewedPrivateArtifact: true,
      checksumEvidenceStatus: 'checksum_required_before_private_manifest',
      licenseClaim: 'mit_source_claim_requires_owner_manifest_record',
      commercialUseReviewStatus: 'requires_manual_review',
      redistributionReviewStatus: 'requires_manual_review',
      privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
      approvedForInternalBetaNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      nextAction: 'Review transparent-background/InSPyReNet license and provenance, verify ckpt_base.pth against the upstream MD5 before private manifest approval, record quality/security evidence, and then run native L4 proof.',
    },
  ]
}

export function buildAiGraphicsModelWeightPrivateManifestPreparationPlan(
  sourceCandidates: readonly AiGraphicsModelWeightSourceCandidate[] = listAiGraphicsModelWeightSourceCandidates(),
): AiGraphicsModelWeightPrivateManifestPreparationRow[] {
  return sourceCandidates.map((candidate) => {
    const hasExistingInternalEvidence =
      candidate.candidateStatus === 'internal_evidence_verified_private_manifest_required'
    const directoryName = directoryNameByTool[candidate.toolId]

    return {
      toolId: candidate.toolId,
      candidateId: candidate.candidateId,
      preparationStatus: hasExistingInternalEvidence
        ? 'ready_for_private_manifest_authoring_from_existing_evidence'
        : 'blocked_pending_source_selection_or_review',
      localOnlyManifestPath: `.local-artifacts/ai-graphics/model-weight-manifests/${directoryName}/model_tree_manifest.json`,
      expectedRuntimeManifestPath: expectedRuntimeManifestPathByTool[candidate.toolId],
      acceptedPrivateArtifactRefNamespaces: ['private://', 'reeditpro-private://', 'reeditpro-private-artifact-ref-'],
      sourceEvidenceRefs: [...candidate.existingInternalEvidenceRefs],
      privateManifestReviewCommand:
        'npm run --silent ai-graphics:model-weight-manifest-review:validate -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
      gpuProofCommandPlanCommand:
        'npm run --silent ai-graphics:gpu-runtime-proof-command-plan -- --manifest-dir "$REEDITPRO_AI_GRAPHICS_PRIVATE_MODEL_WEIGHT_ROOT"',
      ownerReviewRequired: true,
      localOnly: true,
      committedManifestApproved: false,
      modelDownloadRequiredNow: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      nextAction: hasExistingInternalEvidence
        ? `Author the local-only private manifest for ${candidate.toolId} from the recorded internal evidence, validate it, then submit redacted private-ref status for owner review.`
        : candidate.nextAction,
    }
  })
}

export function buildAiGraphicsModelWeightSourceCatalogPacket(): AiGraphicsModelWeightSourceCatalogPacket {
  const sourceCandidates = listAiGraphicsModelWeightSourceCandidates()
  const privateManifestPreparationPlan = buildAiGraphicsModelWeightPrivateManifestPreparationPlan(sourceCandidates)

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    foundationGpuToolsWithoutStandaloneManifest: [...foundationGpuToolsWithoutStandaloneManifest],
    modelWeightSourceCatalogTools: [...modelWeightSourceCatalogTools],
    sourceCandidates,
    privateManifestPreparationPlan,
    sourceCatalogCounts: {
      gpuRuntimeTargetedTools: 8,
      foundationGpuToolsWithoutStandaloneManifest: 3,
      modelWeightSourceCatalogTools: 5,
      sourceCandidatesCovered: 5,
      internalEvidenceBackedCandidates: sourceCandidates.filter((candidate) =>
        candidate.candidateStatus === 'internal_evidence_verified_private_manifest_required').length,
      sourceIdentifiedReviewRequiredCandidates: sourceCandidates.filter((candidate) =>
        candidate.candidateStatus === 'source_identified_review_required').length,
      sourceMenuSelectionRequiredCandidates: sourceCandidates.filter((candidate) =>
        candidate.candidateStatus === 'source_menu_identified_selection_required').length,
      suggestedPrivateManifestChecksumsFromExistingEvidence: sourceCandidates.filter((candidate) =>
        Boolean(candidate.suggestedPrivateManifestChecksumSha256)).length,
      privateArtifactSha256StillRequired: sourceCandidates.filter((candidate) =>
        candidate.suggestedPrivateManifestChecksumSource === 'requires_private_artifact_sha256').length,
      readyForPrivateManifestAuthoringFromExistingEvidence: privateManifestPreparationPlan.filter((row) =>
        row.preparationStatus === 'ready_for_private_manifest_authoring_from_existing_evidence').length,
      blockedPendingSourceSelectionOrReview: privateManifestPreparationPlan.filter((row) =>
        row.preparationStatus === 'blocked_pending_source_selection_or_review').length,
      privateManifestsApprovedNow: 0,
      betaReadyModelWeightTools: 0,
    },
    gpuRuntimeActivationPolicy: {
      onDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      startsOnlyForApprovedWorkerOrToolCall: true,
      cpuFallbackAllowedForHeavyTools: false,
    },
    booleans: {
      modelWeightSourceCatalogPrepared: true,
      all8GpuRuntimeToolsCovered: true,
      all5ModelWeightSourceToolsCovered: true,
      sourceCandidatesIdentifiedForAll5ModelWeightTools: true,
      internalEvidenceBackedSourcesRecorded: true,
      privateManifestPreparationPlanPrepared: true,
      existingEvidenceCanAuthor3PrivateManifestDrafts: true,
      sourceSelectionStillBlocks2PrivateManifestDrafts: false,
      sourceReviewStillBlocks2PrivateManifestDrafts: true,
      existingEvidenceChecksumSuggestionsRecorded: true,
      privateArtifactSha256StillRequiredFor2: true,
      suggestedChecksumsDoNotApprovePrivateManifest: true,
      privateManifestReviewStillRequired: true,
      privateArtifactRefNamespaceRequired: true,
      checksumReviewStillRequired: true,
      licenseReviewStillRequired: true,
      provenanceReviewStillRequired: true,
      qualityReviewStillRequired: true,
      securityReviewStillRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      cpuFallbackAllowedForHeavyTools: false,
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
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
