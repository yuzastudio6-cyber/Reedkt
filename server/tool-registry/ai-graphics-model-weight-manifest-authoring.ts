import {
  buildAiGraphicsModelWeightChecksumEvidencePacket,
  type AiGraphicsModelWeightChecksumEvidenceRecord,
} from './ai-graphics-model-weight-checksum-evidence'
import {
  AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION,
  buildAiGraphicsModelWeightManifestReviewPacket,
  listAiGraphicsModelWeightManifestRequiredTools,
  type AiGraphicsModelWeightManifestEvidenceRecord,
  type AiGraphicsModelWeightManifestToolId,
} from './ai-graphics-model-weight-manifest-readiness'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_AUTHORING_DECISION =
  'ai_graphics_model_weight_manifest_authoring_from_checksum_evidence_prepared_with_local_only_private_drafts'

export type AiGraphicsManifestAuthoringPrivateRefStatus =
  | 'missing'
  | 'present_private_ref_not_logged'
  | 'invalid_public_or_signed_ref'

export type AiGraphicsModelWeightManifestAuthoringStatus =
  | 'missing_checksum_evidence'
  | 'blocked_invalid_checksum_evidence'
  | 'blocked_missing_manifest_review_supplement'
  | 'blocked_invalid_manifest_review_supplement'
  | 'local_private_manifest_draft_ready'

export interface AiGraphicsModelWeightManifestReviewSupplementRecord {
  supplementId: string
  toolId: AiGraphicsModelWeightManifestToolId
  sourceCandidateId: string
  sourceLicenseRef: string
  modelCardRef: string
  commercialUseReviewed: boolean
  redistributionReviewed: boolean
  provenanceReviewed: boolean
  qualityReviewed: boolean
  securityReviewed: boolean
  approvedForInternalBeta: boolean
}

export interface AiGraphicsModelWeightManifestAuthoringResult {
  toolId: AiGraphicsModelWeightManifestToolId
  templateId: string
  expectedSourceCandidateId: string | null
  checksumEvidenceProvided: boolean
  checksumEvidenceAccepted: boolean
  manifestReviewSupplementProvided: boolean
  manifestReviewSupplementAccepted: boolean
  localPrivateManifestDraftReady: boolean
  manifestReviewValidatorInputReady: boolean
  status: AiGraphicsModelWeightManifestAuthoringStatus
  checksumEvidenceRefStatus: AiGraphicsManifestAuthoringPrivateRefStatus
  privateArtifactRefStatus: AiGraphicsManifestAuthoringPrivateRefStatus
  sourceLicenseRefStatus: AiGraphicsManifestAuthoringPrivateRefStatus
  modelCardRefStatus: AiGraphicsManifestAuthoringPrivateRefStatus
  privateArtifactRefsLogged: 0
  approvedForAgentExecutionNow: false
  errors: string[]
  warnings: string[]
}

export interface AiGraphicsModelWeightManifestAuthoringPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_AUTHORING_DECISION
  sourceManifestReviewPacketDecision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION
  totalAiGraphicsTools: 21
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  requiredSupplementFields: string[]
  checksumEvidenceRecordsProvided: number
  checksumEvidenceRecordsAccepted: number
  manifestReviewSupplementsProvided: number
  manifestReviewSupplementsAccepted: number
  localPrivateManifestDraftsReady: number
  manifestReviewValidatorInputReadyRecords: number
  privateArtifactRefsLogged: 0
  validationResults: AiGraphicsModelWeightManifestAuthoringResult[]
  globalBlockers: string[]
  booleans: {
    modelWeightManifestAuthoringBridgePrepared: true
    sourceChecksumEvidenceAccepted: true
    sourceManifestReviewPacketAccepted: true
    all5ModelWeightToolsCovered: true
    checksumEvidenceRequiredBeforeManifestDraft: true
    manifestReviewSupplementRequired: true
    localPrivateManifestDraftsOnly: true
    privateArtifactRefsNotLogged: true
    publicOrSignedRefsRejected: true
    nativeGpuProofStillRequired: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
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

const requiredSupplementStringFields = [
  'supplementId',
  'sourceCandidateId',
  'sourceLicenseRef',
  'modelCardRef',
] as const satisfies readonly (keyof AiGraphicsModelWeightManifestReviewSupplementRecord)[]

const requiredSupplementReviewBooleanFields = [
  'commercialUseReviewed',
  'redistributionReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForInternalBeta',
] as const satisfies readonly (keyof AiGraphicsModelWeightManifestReviewSupplementRecord)[]

const directoryNameByTool = {
  sam2: 'sam2',
  birefnet: 'birefnet',
  real_esrgan: 'real-esrgan',
  rembg: 'rembg',
  transparent_background: 'transparent-background',
} as const satisfies Record<AiGraphicsModelWeightManifestToolId, string>

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function privateRefStatus(ref: string | undefined): AiGraphicsManifestAuthoringPrivateRefStatus {
  if (!hasText(ref)) {
    return 'missing'
  }

  const normalizedRef = ref.trim()
  const hasPublicUrl = /^(https?:\/\/|public:\/\/|gs:\/\/)/i.test(normalizedRef)
  const hasSignedUrl = /^signed:\/\//i.test(normalizedRef) ||
    /[?&](X-Goog-Signature|X-Amz-Signature|Signature)=/i.test(normalizedRef)
  const hasReviewedPrivateNamespace = /^(private:\/\/|reeditpro-private:\/\/|reeditpro-private-artifact-ref-)/i
    .test(normalizedRef)

  return hasPublicUrl || hasSignedUrl || !hasReviewedPrivateNamespace
    ? 'invalid_public_or_signed_ref'
    : 'present_private_ref_not_logged'
}

function sourceArtifactRefFromEvidence(
  record: Partial<AiGraphicsModelWeightChecksumEvidenceRecord> | undefined,
): string | undefined {
  return hasText(record?.sourceArtifactRef)
    ? record?.sourceArtifactRef
    : record?.privateArtifactRef
}

function requiredToolIds(): AiGraphicsModelWeightManifestToolId[] {
  return listAiGraphicsModelWeightManifestRequiredTools().map((tool) => tool.toolId)
}

function templateIdForTool(toolId: AiGraphicsModelWeightManifestToolId): string {
  return listAiGraphicsModelWeightManifestRequiredTools().find((tool) => tool.toolId === toolId)?.templateId ??
    'unknown_model_weight_template'
}

function supplementErrors(
  supplement: Partial<AiGraphicsModelWeightManifestReviewSupplementRecord> | undefined,
  toolId: AiGraphicsModelWeightManifestToolId,
  expectedSourceCandidateId: string | null,
): string[] {
  const errors: string[] = []
  if (!supplement) {
    return [`${toolId} manifest review supplement is missing.`]
  }

  if (supplement.toolId !== toolId) {
    errors.push(`toolId must be ${toolId}.`)
  }
  if (expectedSourceCandidateId && supplement.sourceCandidateId !== expectedSourceCandidateId) {
    errors.push(`sourceCandidateId must be ${expectedSourceCandidateId}.`)
  }
  for (const field of requiredSupplementStringFields) {
    const value = supplement[field]
    if (!hasText(value)) {
      errors.push(`${String(field)} must be a non-empty string.`)
    }
  }
  if (privateRefStatus(supplement.sourceLicenseRef) === 'invalid_public_or_signed_ref') {
    errors.push(
      'sourceLicenseRef must be a reviewed private reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
    )
  }
  if (privateRefStatus(supplement.modelCardRef) === 'invalid_public_or_signed_ref') {
    errors.push(
      'modelCardRef must be a reviewed private reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
    )
  }
  for (const field of requiredSupplementReviewBooleanFields) {
    if (supplement[field] !== true) {
      errors.push(`${String(field)} must be true after owner review.`)
    }
  }

  return errors
}

function buildDraftManifest(
  toolId: AiGraphicsModelWeightManifestToolId,
  checksumEvidence: Partial<AiGraphicsModelWeightChecksumEvidenceRecord>,
  supplement: Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>,
): AiGraphicsModelWeightManifestEvidenceRecord {
  return {
    manifestId: `${toolId}_private_manifest_from_checksum_evidence_v1`,
    toolId,
    templateId: templateIdForTool(toolId) as AiGraphicsModelWeightManifestEvidenceRecord['templateId'],
    sourceCandidateId: checksumEvidence.sourceCandidateId ?? '',
    privateArtifactRef: sourceArtifactRefFromEvidence(checksumEvidence) ?? '',
    checksumSha256: checksumEvidence.artifactSha256 ?? '',
    checksumEvidenceRef: checksumEvidence.checksumEvidenceRef ?? '',
    sourceLicenseRef: supplement.sourceLicenseRef ?? '',
    modelCardRef: supplement.modelCardRef ?? '',
    checksumEvidenceReviewed: checksumEvidence.checksumEvidenceReviewed === true,
    commercialUseReviewed: supplement.commercialUseReviewed === true,
    redistributionReviewed: supplement.redistributionReviewed === true,
    qualityReviewed: checksumEvidence.qualityReviewed === true && supplement.qualityReviewed === true,
    securityReviewed: checksumEvidence.securityReviewed === true && supplement.securityReviewed === true,
    provenanceReviewed: checksumEvidence.provenanceReviewed === true && supplement.provenanceReviewed === true,
    approvedForInternalBeta: supplement.approvedForInternalBeta === true,
  }
}

export function buildAiGraphicsModelWeightManifestAuthoringDrafts(
  checksumEvidenceRecords: readonly Partial<AiGraphicsModelWeightChecksumEvidenceRecord>[] = [],
  manifestReviewSupplements: readonly Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>[] = [],
): {
  packet: AiGraphicsModelWeightManifestAuthoringPacket
  drafts: AiGraphicsModelWeightManifestEvidenceRecord[]
  draftRelativeFilePaths: Record<AiGraphicsModelWeightManifestToolId, string>
} {
  const checksumPacket = buildAiGraphicsModelWeightChecksumEvidencePacket(checksumEvidenceRecords)
  const requiredTools = requiredToolIds()
  const drafts: AiGraphicsModelWeightManifestEvidenceRecord[] = []
  const draftRelativeFilePaths = Object.fromEntries(
    requiredTools.map((toolId) => [toolId, `${directoryNameByTool[toolId]}/model_tree_manifest.json`]),
  ) as Record<AiGraphicsModelWeightManifestToolId, string>

  const validationResults = requiredTools.map((toolId): AiGraphicsModelWeightManifestAuthoringResult => {
    const checksumMatches = checksumEvidenceRecords.filter((record) => record.toolId === toolId)
    const supplementMatches = manifestReviewSupplements.filter((record) => record.toolId === toolId)
    const checksumResult = checksumPacket.validationResults.find((result) => result.toolId === toolId)
    const checksumEvidence = checksumMatches[0]
    const supplement = supplementMatches[0]
    const expectedSourceCandidateId = checksumResult?.expectedSourceCandidateId ?? null
    const errors: string[] = []
    const warnings = [
      `${toolId} local manifest authoring does not approve model download, model load, inference, GPU runtime, beta, or production.`,
      `${toolId} still requires native linux/amd64 NVIDIA L4 proof before any on-demand GPU worker execution can be approved.`,
    ]

    if (checksumMatches.length > 1) {
      errors.push(`${toolId} has duplicate checksum evidence records.`)
    }
    if (supplementMatches.length > 1) {
      errors.push(`${toolId} has duplicate manifest review supplement records.`)
    }
    if (!checksumEvidence) {
      errors.push(`${toolId} private checksum evidence is missing.`)
    }
    if (checksumEvidence && !checksumResult?.eligibleForPrivateManifestAuthoring) {
      errors.push(`${toolId} private checksum evidence is not eligible for manifest authoring.`)
    }
    errors.push(...supplementErrors(supplement, toolId, expectedSourceCandidateId))

    const draftCandidate = checksumEvidence && supplement
      ? buildDraftManifest(toolId, checksumEvidence, supplement)
      : undefined
    const manifestPacket = draftCandidate
      ? buildAiGraphicsModelWeightManifestReviewPacket([draftCandidate])
      : undefined
    const manifestResult = manifestPacket?.validationResults.find((result) => result.toolId === toolId)
    if (draftCandidate && manifestResult && !manifestResult.eligibleForNativeGpuProofInput) {
      errors.push(...manifestResult.errors.map((error) => `draft manifest invalid: ${error}`))
    }

    const sourceLicenseRefStatus = privateRefStatus(supplement?.sourceLicenseRef)
    const modelCardRefStatus = privateRefStatus(supplement?.modelCardRef)
    const manifestReviewSupplementAccepted = Boolean(
      supplement && supplementErrors(supplement, toolId, expectedSourceCandidateId).length === 0,
    )
    const manifestReviewValidatorInputReady = Boolean(
      checksumResult?.eligibleForPrivateManifestAuthoring &&
        manifestReviewSupplementAccepted &&
        draftCandidate &&
        manifestResult?.eligibleForNativeGpuProofInput &&
        errors.length === 0,
    )

    if (manifestReviewValidatorInputReady && draftCandidate) {
      drafts.push(draftCandidate)
    }

    const status: AiGraphicsModelWeightManifestAuthoringStatus = !checksumEvidence
      ? 'missing_checksum_evidence'
      : !checksumResult?.eligibleForPrivateManifestAuthoring
        ? 'blocked_invalid_checksum_evidence'
        : !supplement
          ? 'blocked_missing_manifest_review_supplement'
          : !manifestReviewSupplementAccepted
            ? 'blocked_invalid_manifest_review_supplement'
            : manifestReviewValidatorInputReady
              ? 'local_private_manifest_draft_ready'
              : 'blocked_invalid_manifest_review_supplement'

    return {
      toolId,
      templateId: templateIdForTool(toolId),
      expectedSourceCandidateId,
      checksumEvidenceProvided: Boolean(checksumEvidence),
      checksumEvidenceAccepted: Boolean(checksumResult?.eligibleForPrivateManifestAuthoring),
      manifestReviewSupplementProvided: Boolean(supplement),
      manifestReviewSupplementAccepted,
      localPrivateManifestDraftReady: manifestReviewValidatorInputReady,
      manifestReviewValidatorInputReady,
      status,
      checksumEvidenceRefStatus: checksumResult?.checksumEvidenceRefStatus ?? 'missing',
      privateArtifactRefStatus: manifestResult?.privateArtifactRefStatus ??
        privateRefStatus(sourceArtifactRefFromEvidence(checksumEvidence)),
      sourceLicenseRefStatus,
      modelCardRefStatus,
      privateArtifactRefsLogged: 0,
      approvedForAgentExecutionNow: false,
      errors,
      warnings,
    }
  })

  const manifestReviewSupplementsAccepted = validationResults
    .filter((result) => result.manifestReviewSupplementAccepted).length
  const localPrivateManifestDraftsReady = validationResults
    .filter((result) => result.localPrivateManifestDraftReady).length

  return {
    packet: {
      decision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_AUTHORING_DECISION,
      sourceManifestReviewPacketDecision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION,
      totalAiGraphicsTools: 21,
      modelWeightManifestRequiredTools: requiredTools,
      requiredSupplementFields,
      checksumEvidenceRecordsProvided: checksumEvidenceRecords.length,
      checksumEvidenceRecordsAccepted: checksumPacket.checksumEvidenceRecordsAccepted,
      manifestReviewSupplementsProvided: manifestReviewSupplements.length,
      manifestReviewSupplementsAccepted,
      localPrivateManifestDraftsReady,
      manifestReviewValidatorInputReadyRecords: validationResults
        .filter((result) => result.manifestReviewValidatorInputReady).length,
      privateArtifactRefsLogged: 0,
      validationResults,
      globalBlockers: [
        'No private checksum evidence, source artifact refs, source license refs, model card refs, or private manifests are committed in this public packet.',
        'Manifest authoring needs both reviewed private checksum evidence and a reviewed private manifest supplement for every model-weight tool.',
        'Generated manifest drafts are local/private files only and must stay under ignored local evidence paths such as .local-artifacts.',
        'Local private manifest drafts are only input for the existing manifest-review validator and later native GPU proof.',
        'GPU runtime remains on-demand only and must start only inside an approved future worker or tool-call job.',
        'No idle GPU runtime, CPU fallback for heavy tools, model download/load/inference, Tool Route, Worker, beta, or production execution is approved.',
      ],
      booleans: {
        modelWeightManifestAuthoringBridgePrepared: true,
        sourceChecksumEvidenceAccepted: true,
        sourceManifestReviewPacketAccepted: true,
        all5ModelWeightToolsCovered: true,
        checksumEvidenceRequiredBeforeManifestDraft: true,
        manifestReviewSupplementRequired: true,
        localPrivateManifestDraftsOnly: true,
        privateArtifactRefsNotLogged: true,
        publicOrSignedRefsRejected: true,
        nativeGpuProofStillRequired: true,
        gpuRuntimeOnDemandOnly: true,
        noIdleGpuRuntimeApproved: true,
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
    },
    drafts,
    draftRelativeFilePaths,
  }
}

export function buildAiGraphicsModelWeightManifestAuthoringPacket(
  checksumEvidenceRecords: readonly Partial<AiGraphicsModelWeightChecksumEvidenceRecord>[] = [],
  manifestReviewSupplements: readonly Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>[] = [],
): AiGraphicsModelWeightManifestAuthoringPacket {
  return buildAiGraphicsModelWeightManifestAuthoringDrafts(checksumEvidenceRecords, manifestReviewSupplements).packet
}
