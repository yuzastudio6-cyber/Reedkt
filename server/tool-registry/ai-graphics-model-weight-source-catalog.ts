import { REAL_ESRGAN_X4PLUS_RUNTIME_PATH, getEnhancementModelApprovalCandidate } from '../activation/enhancement-model-approval/enhancement-model-candidate-registry'
import { enhancementEvidenceForCandidate } from '../activation/enhancement-model-approval/enhancement-model-license-evidence'
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
  checksumEvidenceStatus:
    | 'accepted_from_existing_internal_evidence_private_manifest_still_required'
    | 'release_asset_checksum_required_before_private_manifest'
    | 'checksum_required_before_private_manifest'
  licenseClaim:
    | 'apache_2_0_source_claim_requires_owner_manifest_record'
    | 'bsd_3_clause_repository_evidence_release_asset_requires_review'
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

export interface AiGraphicsModelWeightSourceCatalogPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  foundationGpuToolsWithoutStandaloneManifest: AiGraphicsModelWeightFoundationGpuTool[]
  modelWeightSourceCatalogTools: AiGraphicsModelWeightManifestToolId[]
  sourceCandidates: AiGraphicsModelWeightSourceCandidate[]
  sourceCatalogCounts: {
    gpuRuntimeTargetedTools: 8
    foundationGpuToolsWithoutStandaloneManifest: 3
    modelWeightSourceCatalogTools: 5
    sourceCandidatesCovered: 5
    internalEvidenceBackedCandidates: number
    sourceIdentifiedReviewRequiredCandidates: number
    sourceMenuSelectionRequiredCandidates: number
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
    ],
    existingInternalEvidenceSummary: `Found ${licenseEvidence.length} existing Real-ESRGAN license/source evidence records; acceptance is limited to staging sample-first planning and does not approve beta runtime.`,
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
        'server/activation/sam2-runtime/sam2-runtime-policy.ts',
        'server/activation/sam2-runtime/approved-sam2-runtime-evidence.ts',
      ],
      existingInternalEvidenceSummary: `Existing SAM2 evidence is ${approvedSam2RuntimeEvidence.status} for ${approvedSam2RuntimeEvidence.modelId} on generated synthetic fixtures only; raw gs:// refs remain source evidence and are rejected as public manifest refs.`,
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
      candidateStatus: 'source_identified_review_required',
      reviewStatus: 'requires_manual_source_license_checksum_and_quality_review',
      upstreamSourceName: 'ZhengPeng7/BiRefNet',
      upstreamSourceUrl: 'https://huggingface.co/ZhengPeng7/BiRefNet',
      sourceCodeUrl: 'https://github.com/ZhengPeng7/BiRefNet',
      modelIdOrName: 'BiRefNet official weights candidate',
      expectedRuntimePath: '/opt/reeditpro/model-weights/birefnet/',
      existingInternalEvidenceRefs: [],
      existingInternalEvidenceSummary: 'Official source candidate is identified, but no ReeditPro private manifest, checksum, commercial-use review, redistribution review, or quality/security review is approved.',
      checksumEvidenceStatus: 'checksum_required_before_private_manifest',
      licenseClaim: 'unknown_requires_review',
      commercialUseReviewStatus: 'requires_manual_review',
      redistributionReviewStatus: 'requires_manual_review',
      privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
      approvedForInternalBetaNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      nextAction: 'Select the exact BiRefNet checkpoint, record license/model-card/provenance evidence, checksum it, create a private manifest, and run native L4 proof.',
    },
    realEsrganCandidate(),
    {
      toolId: 'rembg',
      candidateId: 'danielgatis_rembg_model_menu_selection_required',
      candidateStatus: 'source_menu_identified_selection_required',
      reviewStatus: 'requires_model_choice_license_checksum_and_quality_review',
      upstreamSourceName: 'danielgatis/rembg',
      upstreamSourceUrl: 'https://github.com/danielgatis/rembg',
      modelIdOrName: 'rembg model menu: u2net, isnet, sam, birefnet, and related ONNX/cache options',
      expectedRuntimePath: '/opt/reeditpro/model-weights/rembg/',
      existingInternalEvidenceRefs: [],
      existingInternalEvidenceSummary: 'The upstream tool exposes multiple model choices; ReeditPro has not selected a default model, checksum, private cache layout, license record, or cutout-quality review.',
      checksumEvidenceStatus: 'checksum_required_before_private_manifest',
      licenseClaim: 'unknown_requires_review',
      commercialUseReviewStatus: 'requires_manual_review',
      redistributionReviewStatus: 'requires_manual_review',
      privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
      approvedForInternalBetaNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      nextAction: 'Choose one rembg model/cache option for ReeditPro, review license/provenance and cutout quality, checksum the private artifact tree, and create a private manifest before GPU proof.',
    },
    {
      toolId: 'transparent_background',
      candidateId: 'plemeri_transparent_background_inspyrenet_review_candidate',
      candidateStatus: 'source_identified_review_required',
      reviewStatus: 'requires_manual_source_license_checksum_and_quality_review',
      upstreamSourceName: 'plemeri/transparent-background',
      upstreamSourceUrl: 'https://github.com/plemeri/transparent-background',
      sourceCodeUrl: 'https://github.com/plemeri/InSPyReNet',
      modelIdOrName: 'transparent-background InSPyReNet checkpoint candidate',
      expectedRuntimePath: '/opt/reeditpro/model-weights/transparent-background/',
      existingInternalEvidenceRefs: [],
      existingInternalEvidenceSummary: 'Upstream package/model family is identified, but exact checkpoint, license, redistribution, checksum, private manifest, and quality/security review are not approved.',
      checksumEvidenceStatus: 'checksum_required_before_private_manifest',
      licenseClaim: 'unknown_requires_review',
      commercialUseReviewStatus: 'requires_manual_review',
      redistributionReviewStatus: 'requires_manual_review',
      privateManifestStatus: 'missing_reviewed_private_artifact_ref_namespace',
      approvedForInternalBetaNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      nextAction: 'Select the exact transparent-background/InSPyReNet checkpoint, record license/provenance and quality evidence, checksum the private artifact tree, and create a private manifest before GPU proof.',
    },
  ]
}

export function buildAiGraphicsModelWeightSourceCatalogPacket(): AiGraphicsModelWeightSourceCatalogPacket {
  const sourceCandidates = listAiGraphicsModelWeightSourceCandidates()

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools: [...gpuRuntimeTargetedTools],
    foundationGpuToolsWithoutStandaloneManifest: [...foundationGpuToolsWithoutStandaloneManifest],
    modelWeightSourceCatalogTools: [...modelWeightSourceCatalogTools],
    sourceCandidates,
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
