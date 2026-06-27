import {
  AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION,
  listAiGraphicsModelWeightSourceCandidates,
} from './ai-graphics-model-weight-source-catalog'
import type { AiGraphicsModelWeightManifestToolId } from './ai-graphics-model-weight-manifest-readiness'

export const AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_DECISION =
  'ai_graphics_model_weight_checksum_evidence_prepared_with_no_private_records'

export type AiGraphicsPrivateChecksumEvidenceRefStatus =
  | 'missing'
  | 'present_private_ref_not_logged'
  | 'invalid_public_or_signed_ref'

export interface AiGraphicsModelWeightChecksumEvidenceRecord {
  evidenceId: string
  toolId: AiGraphicsModelWeightManifestToolId
  sourceCandidateId: string
  artifactFileName: string
  artifactSha256: string
  checksumEvidenceRef: string
  sourceArtifactRef?: string
  privateArtifactRef?: string
  hashCommand: string
  checksumEvidenceReviewed: boolean
  sourceArtifactReviewed: boolean
  provenanceReviewed: boolean
  qualityReviewed: boolean
  securityReviewed: boolean
  approvedForManifestAuthoring: boolean
}

export interface AiGraphicsModelWeightChecksumEvidenceValidationResult {
  toolId: AiGraphicsModelWeightManifestToolId | string
  expectedSourceCandidateId: string | null
  expectedArtifactFileName: string | null
  sourceCatalogSuggestedChecksumSha256: string | null
  sourceCatalogChecksumEvidenceStatus: string | null
  checksumEvidenceRecordProvided: boolean
  schemaValid: boolean
  reviewAccepted: boolean
  eligibleForPrivateManifestAuthoring: boolean
  approvedForAgentExecutionNow: false
  checksumEvidenceRefStatus: AiGraphicsPrivateChecksumEvidenceRefStatus
  sourceArtifactRefStatus: AiGraphicsPrivateChecksumEvidenceRefStatus
  checksumMatchesSourceCatalog: boolean | null
  errors: string[]
  warnings: string[]
}

export interface AiGraphicsModelWeightChecksumEvidencePacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_DECISION
  sourceCatalogDecision: typeof AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION
  totalAiGraphicsTools: 21
  modelWeightChecksumEvidenceRequiredTools: AiGraphicsModelWeightManifestToolId[]
  requiredEvidenceFields: string[]
  checksumEvidenceRecordsProvided: number
  checksumEvidenceRecordsAccepted: number
  manifestAuthoringEligibleRecords: number
  privateArtifactRefsLogged: 0
  betaReadyModelWeightTools: 0
  validationResults: AiGraphicsModelWeightChecksumEvidenceValidationResult[]
  globalBlockers: string[]
  booleans: {
    checksumEvidenceValidatorPrepared: true
    sourceModelWeightSourceCatalogAccepted: true
    all5ModelWeightToolsCovered: true
    privateChecksumEvidenceRefsRequired: true
    sourceArtifactPrivateRefsRequired: true
    privateArtifactRefsNotLogged: true
    publicOrSignedArtifactRefsRejected: true
    sha256EvidenceRequired: true
    sourceCatalogChecksumGuidanceEnforced: true
    sourceCatalogChecksumMismatchRejected: true
    rembgTransparentBackgroundPrivateShaEvidenceStillRequired: true
    checksumEvidenceReviewRequired: true
    provenanceReviewRequired: true
    qualityReviewRequired: true
    securityReviewRequired: true
    manifestAuthoringOnly: true
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

const requiredStringFields = [
  'evidenceId',
  'sourceCandidateId',
  'artifactFileName',
  'artifactSha256',
  'checksumEvidenceRef',
  'hashCommand',
] as const satisfies readonly (keyof AiGraphicsModelWeightChecksumEvidenceRecord)[]

const requiredReviewBooleanFields = [
  'checksumEvidenceReviewed',
  'sourceArtifactReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForManifestAuthoring',
] as const satisfies readonly (keyof AiGraphicsModelWeightChecksumEvidenceRecord)[]

const sha256Pattern = /^[a-f0-9]{64}$/i

function hasText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function privateRefStatus(ref: string | undefined): AiGraphicsPrivateChecksumEvidenceRefStatus {
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

function sourceArtifactRefFromRecord(
  record: Partial<AiGraphicsModelWeightChecksumEvidenceRecord> | undefined,
): string | undefined {
  return hasText(record?.sourceArtifactRef)
    ? record?.sourceArtifactRef
    : record?.privateArtifactRef
}

function sourceCandidateForTool(toolId: AiGraphicsModelWeightManifestToolId | string | undefined) {
  return listAiGraphicsModelWeightSourceCandidates().find((candidate) => candidate.toolId === toolId) ?? null
}

function expectedArtifactFileNameForTool(
  toolId: AiGraphicsModelWeightManifestToolId | string | undefined,
): string | null {
  const candidate = sourceCandidateForTool(toolId)
  return candidate?.artifactFileName ?? candidate?.modelIdOrName ?? null
}

function expectedSourceCandidateIdForTool(
  toolId: AiGraphicsModelWeightManifestToolId | string | undefined,
): string | null {
  return sourceCandidateForTool(toolId)?.candidateId ?? null
}

const modelWeightChecksumEvidenceTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

function withValidationErrors(
  result: AiGraphicsModelWeightChecksumEvidenceValidationResult,
  errors: string[],
): AiGraphicsModelWeightChecksumEvidenceValidationResult {
  return {
    ...result,
    schemaValid: false,
    reviewAccepted: false,
    eligibleForPrivateManifestAuthoring: false,
    errors: [...result.errors, ...errors],
  }
}

export function validateAiGraphicsModelWeightChecksumEvidenceRecord(
  record: Partial<AiGraphicsModelWeightChecksumEvidenceRecord> | undefined,
  expectedToolId?: AiGraphicsModelWeightManifestToolId,
): AiGraphicsModelWeightChecksumEvidenceValidationResult {
  const toolId = expectedToolId ?? record?.toolId ?? 'unknown_model_weight_tool'
  const sourceCandidate = sourceCandidateForTool(toolId)
  const expectedSourceCandidateId = expectedSourceCandidateIdForTool(toolId)
  const sourceCatalogSuggestedChecksumSha256 = sourceCandidate?.suggestedPrivateManifestChecksumSha256 ?? null
  const sourceCatalogChecksumEvidenceStatus = sourceCandidate?.checksumEvidenceStatus ?? null
  const expectedArtifactFileName = expectedArtifactFileNameForTool(toolId)
  const errors: string[] = []
  const warnings: string[] = [
    `${toolId} checksum evidence is only private manifest authoring input; it does not approve model download, model load, inference, agent execution, beta, or production.`,
    `${toolId} still requires native linux/amd64 NVIDIA L4 proof before any GPU/model runtime can be approved.`,
  ]

  if (!record) {
    return {
      toolId,
      expectedSourceCandidateId,
      expectedArtifactFileName,
      sourceCatalogSuggestedChecksumSha256,
      sourceCatalogChecksumEvidenceStatus,
      checksumEvidenceRecordProvided: false,
      schemaValid: false,
      reviewAccepted: false,
      eligibleForPrivateManifestAuthoring: false,
      approvedForAgentExecutionNow: false,
      checksumEvidenceRefStatus: 'missing',
      sourceArtifactRefStatus: 'missing',
      checksumMatchesSourceCatalog: null,
      errors: [`${toolId} private checksum evidence record is missing.`],
      warnings,
    }
  }

  if (!modelWeightChecksumEvidenceTools.includes(record.toolId as AiGraphicsModelWeightManifestToolId)) {
    errors.push(`${record.toolId ?? 'unknown'} is not an AI graphics model-weight checksum-evidence tool.`)
  }
  if (expectedToolId && record.toolId !== expectedToolId) {
    errors.push(`toolId must be ${expectedToolId}.`)
  }
  if (!sourceCandidate) {
    errors.push(`${toolId} is missing a selected source candidate in the AI graphics source catalog.`)
  }
  if (expectedSourceCandidateId && record.sourceCandidateId !== expectedSourceCandidateId) {
    errors.push(`sourceCandidateId must be ${expectedSourceCandidateId}.`)
  }
  if (expectedArtifactFileName && record.artifactFileName !== expectedArtifactFileName) {
    errors.push(`artifactFileName must be ${expectedArtifactFileName}.`)
  }

  for (const field of requiredStringFields) {
    const value = record[field]
    if (typeof value !== 'string' || !hasText(value)) {
      errors.push(`${String(field)} must be a non-empty string.`)
    }
  }

  if (!hasText(sourceArtifactRefFromRecord(record))) {
    errors.push('sourceArtifactRef or privateArtifactRef must be present for private checksum evidence.')
  }

  if (typeof record.artifactSha256 === 'string' && !sha256Pattern.test(record.artifactSha256)) {
    errors.push('artifactSha256 must be a 64-character hex SHA-256 digest.')
  }

  const checksumMatchesSourceCatalog = sourceCatalogSuggestedChecksumSha256 && sha256Pattern.test(String(record.artifactSha256 ?? ''))
    ? record.artifactSha256?.toLowerCase() === sourceCatalogSuggestedChecksumSha256.toLowerCase()
    : null

  if (checksumMatchesSourceCatalog === false) {
    errors.push(
      `artifactSha256 must match reviewed source-catalog checksum ${sourceCatalogSuggestedChecksumSha256} for ${sourceCandidate?.candidateId}.`,
    )
  }

  const checksumEvidenceRefStatus = privateRefStatus(record.checksumEvidenceRef)
  const sourceArtifactRefStatus = privateRefStatus(sourceArtifactRefFromRecord(record))

  if (checksumEvidenceRefStatus === 'invalid_public_or_signed_ref') {
    errors.push(
      'checksumEvidenceRef must be a reviewed private checksum evidence reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
    )
  }
  if (sourceArtifactRefStatus === 'invalid_public_or_signed_ref') {
    errors.push(
      'sourceArtifactRef or privateArtifactRef must be a reviewed private artifact reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
    )
  }

  for (const field of requiredReviewBooleanFields) {
    if (record[field] !== true) {
      errors.push(`${String(field)} must be true after owner review.`)
    }
  }

  const schemaValid = errors.length === 0
  const reviewAccepted = schemaValid && requiredReviewBooleanFields.every((field) => record[field] === true)

  return {
    toolId,
    expectedSourceCandidateId,
    expectedArtifactFileName,
    sourceCatalogSuggestedChecksumSha256,
    sourceCatalogChecksumEvidenceStatus,
    checksumEvidenceRecordProvided: true,
    schemaValid,
    reviewAccepted,
    eligibleForPrivateManifestAuthoring: reviewAccepted,
    approvedForAgentExecutionNow: false,
    checksumEvidenceRefStatus,
    sourceArtifactRefStatus,
    checksumMatchesSourceCatalog,
    errors,
    warnings,
  }
}

export function validateAiGraphicsModelWeightChecksumEvidenceRecords(
  evidenceRecords: readonly Partial<AiGraphicsModelWeightChecksumEvidenceRecord>[] = [],
): AiGraphicsModelWeightChecksumEvidenceValidationResult[] {
  return modelWeightChecksumEvidenceTools.map((toolId) => {
    const matchingRecords = evidenceRecords.filter((record) => record.toolId === toolId)
    const result = validateAiGraphicsModelWeightChecksumEvidenceRecord(matchingRecords[0], toolId)

    return matchingRecords.length > 1
      ? withValidationErrors(result, [`${toolId} has duplicate checksum evidence records.`])
      : result
  })
}

export function buildAiGraphicsModelWeightChecksumEvidencePacket(
  evidenceRecords: readonly Partial<AiGraphicsModelWeightChecksumEvidenceRecord>[] = [],
): AiGraphicsModelWeightChecksumEvidencePacket {
  const validationResults = validateAiGraphicsModelWeightChecksumEvidenceRecords(evidenceRecords)

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_CHECKSUM_EVIDENCE_DECISION,
    sourceCatalogDecision: AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION,
    totalAiGraphicsTools: 21,
    modelWeightChecksumEvidenceRequiredTools: [...modelWeightChecksumEvidenceTools],
    requiredEvidenceFields,
    checksumEvidenceRecordsProvided: evidenceRecords.length,
    checksumEvidenceRecordsAccepted: validationResults.filter((result) => result.reviewAccepted).length,
    manifestAuthoringEligibleRecords: validationResults.filter((result) =>
      result.eligibleForPrivateManifestAuthoring).length,
    privateArtifactRefsLogged: 0,
    betaReadyModelWeightTools: 0,
    validationResults,
    globalBlockers: [
      'No private checksum evidence records are committed in this public packet.',
      'checksumEvidenceRef and sourceArtifactRef/privateArtifactRef must use reviewed private namespaces; HTTP(S), signed, public, raw gs://, and arbitrary placeholders are rejected.',
      'When the source catalog includes reviewed checksum guidance, artifactSha256 must match that value before private manifest authoring can be eligible.',
      'rembg and transparent_background still require owner-reviewed private artifact SHA-256 evidence before manifest authoring.',
      'Checksum evidence is only input for later private manifest authoring; it does not approve model download, model load, inference, GPU runtime, Tool Routes, Workers, beta, or production.',
      'GPU runtime remains on-demand only and must start only inside an approved future worker or tool-call job.',
    ],
    booleans: {
      checksumEvidenceValidatorPrepared: true,
      sourceModelWeightSourceCatalogAccepted: true,
      all5ModelWeightToolsCovered: true,
      privateChecksumEvidenceRefsRequired: true,
      sourceArtifactPrivateRefsRequired: true,
      privateArtifactRefsNotLogged: true,
      publicOrSignedArtifactRefsRejected: true,
      sha256EvidenceRequired: true,
      sourceCatalogChecksumGuidanceEnforced: true,
      sourceCatalogChecksumMismatchRejected: true,
      rembgTransparentBackgroundPrivateShaEvidenceStillRequired: true,
      checksumEvidenceReviewRequired: true,
      provenanceReviewRequired: true,
      qualityReviewRequired: true,
      securityReviewRequired: true,
      manifestAuthoringOnly: true,
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
  }
}
