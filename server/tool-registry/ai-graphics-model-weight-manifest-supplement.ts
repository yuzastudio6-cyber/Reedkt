import type { AiGraphicsModelWeightManifestReviewSupplementRecord } from './ai-graphics-model-weight-manifest-authoring'
import type { AiGraphicsModelWeightManifestToolId } from './ai-graphics-model-weight-manifest-readiness'
import {
  AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION,
  listAiGraphicsModelWeightSourceCandidates,
} from './ai-graphics-model-weight-source-catalog'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_DECISION =
  'ai_graphics_model_weight_manifest_supplement_prepared_with_no_private_records'

export type AiGraphicsManifestSupplementPrivateRefStatus =
  | 'missing'
  | 'present_private_ref_not_logged'
  | 'invalid_public_or_signed_ref'

export interface AiGraphicsModelWeightManifestSupplementValidationResult {
  toolId: AiGraphicsModelWeightManifestToolId | string
  expectedSourceCandidateId: string | null
  sourceCandidateStatus: string | null
  sourceReviewStatus: string | null
  manifestSupplementRecordProvided: boolean
  schemaValid: boolean
  reviewAccepted: boolean
  eligibleForManifestAuthoring: boolean
  approvedForAgentExecutionNow: false
  sourceLicenseRefStatus: AiGraphicsManifestSupplementPrivateRefStatus
  modelCardRefStatus: AiGraphicsManifestSupplementPrivateRefStatus
  errors: string[]
  warnings: string[]
}

export interface AiGraphicsModelWeightManifestSupplementPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_DECISION
  sourceCatalogDecision: typeof AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION
  totalAiGraphicsTools: 21
  modelWeightManifestSupplementTools: AiGraphicsModelWeightManifestToolId[]
  requiredSupplementFields: string[]
  manifestSupplementRecordsProvided: number
  manifestSupplementRecordsAccepted: number
  manifestAuthoringEligibleRecords: number
  privateArtifactRefsLogged: 0
  betaReadyModelWeightTools: 0
  validationResults: AiGraphicsModelWeightManifestSupplementValidationResult[]
  globalBlockers: string[]
  booleans: {
    manifestSupplementValidatorPrepared: true
    sourceModelWeightSourceCatalogAccepted: true
    all5ModelWeightToolsCovered: true
    sourceLicensePrivateRefsRequired: true
    modelCardPrivateRefsRequired: true
    privateArtifactRefsNotLogged: true
    publicOrSignedRefsRejected: true
    commercialUseReviewRequired: true
    redistributionReviewRequired: true
    provenanceReviewRequired: true
    qualityReviewRequired: true
    securityReviewRequired: true
    approvedForInternalBetaReviewRequired: true
    manifestAuthoringOnly: true
    checksumEvidenceStillRequired: true
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

const modelWeightManifestSupplementTools = [
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
] as const satisfies readonly AiGraphicsModelWeightManifestToolId[]

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

const requiredStringFields = [
  'supplementId',
  'sourceCandidateId',
  'sourceLicenseRef',
  'modelCardRef',
] as const satisfies readonly (keyof AiGraphicsModelWeightManifestReviewSupplementRecord)[]

const requiredReviewBooleanFields = [
  'commercialUseReviewed',
  'redistributionReviewed',
  'provenanceReviewed',
  'qualityReviewed',
  'securityReviewed',
  'approvedForInternalBeta',
] as const satisfies readonly (keyof AiGraphicsModelWeightManifestReviewSupplementRecord)[]

function hasText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function privateRefStatus(ref: string | undefined): AiGraphicsManifestSupplementPrivateRefStatus {
  if (!hasText(ref)) return 'missing'

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

function sourceCandidateForTool(toolId: AiGraphicsModelWeightManifestToolId | string | undefined) {
  return listAiGraphicsModelWeightSourceCandidates().find((candidate) => candidate.toolId === toolId) ?? null
}

function expectedSourceCandidateIdForTool(
  toolId: AiGraphicsModelWeightManifestToolId | string | undefined,
): string | null {
  return sourceCandidateForTool(toolId)?.candidateId ?? null
}

function withValidationErrors(
  result: AiGraphicsModelWeightManifestSupplementValidationResult,
  errors: string[],
): AiGraphicsModelWeightManifestSupplementValidationResult {
  return {
    ...result,
    schemaValid: false,
    reviewAccepted: false,
    eligibleForManifestAuthoring: false,
    errors: [...result.errors, ...errors],
  }
}

export function validateAiGraphicsModelWeightManifestSupplementRecord(
  record: Partial<AiGraphicsModelWeightManifestReviewSupplementRecord> | undefined,
  expectedToolId?: AiGraphicsModelWeightManifestToolId,
): AiGraphicsModelWeightManifestSupplementValidationResult {
  const toolId = expectedToolId ?? record?.toolId ?? 'unknown_model_weight_tool'
  const sourceCandidate = sourceCandidateForTool(toolId)
  const expectedSourceCandidateId = expectedSourceCandidateIdForTool(toolId)
  const errors: string[] = []
  const warnings: string[] = [
    `${toolId} manifest supplement is only private manifest authoring input; it does not approve model download, model load, inference, agent execution, beta, or production.`,
    `${toolId} still requires private checksum evidence, reviewed manifest output, and native linux/amd64 NVIDIA L4 proof before any GPU/model runtime can be approved.`,
  ]

  if (!record) {
    return {
      toolId,
      expectedSourceCandidateId,
      sourceCandidateStatus: sourceCandidate?.candidateStatus ?? null,
      sourceReviewStatus: sourceCandidate?.reviewStatus ?? null,
      manifestSupplementRecordProvided: false,
      schemaValid: false,
      reviewAccepted: false,
      eligibleForManifestAuthoring: false,
      approvedForAgentExecutionNow: false,
      sourceLicenseRefStatus: 'missing',
      modelCardRefStatus: 'missing',
      errors: [`${toolId} private manifest supplement record is missing.`],
      warnings,
    }
  }

  if (!modelWeightManifestSupplementTools.includes(record.toolId as AiGraphicsModelWeightManifestToolId)) {
    errors.push(`${record.toolId ?? 'unknown'} is not an AI graphics model-weight manifest supplement tool.`)
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

  for (const field of requiredStringFields) {
    const value = record[field]
    if (typeof value !== 'string' || !hasText(value)) {
      errors.push(`${String(field)} must be a non-empty string.`)
    }
  }

  const sourceLicenseRefStatus = privateRefStatus(record.sourceLicenseRef)
  const modelCardRefStatus = privateRefStatus(record.modelCardRef)

  if (sourceLicenseRefStatus === 'invalid_public_or_signed_ref') {
    errors.push(
      'sourceLicenseRef must be a reviewed private source/license evidence reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
    )
  }
  if (modelCardRefStatus === 'invalid_public_or_signed_ref') {
    errors.push(
      'modelCardRef must be a reviewed private model-card/provenance reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
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
    sourceCandidateStatus: sourceCandidate?.candidateStatus ?? null,
    sourceReviewStatus: sourceCandidate?.reviewStatus ?? null,
    manifestSupplementRecordProvided: true,
    schemaValid,
    reviewAccepted,
    eligibleForManifestAuthoring: reviewAccepted,
    approvedForAgentExecutionNow: false,
    sourceLicenseRefStatus,
    modelCardRefStatus,
    errors,
    warnings,
  }
}

export function validateAiGraphicsModelWeightManifestSupplementRecords(
  supplementRecords: readonly Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>[] = [],
): AiGraphicsModelWeightManifestSupplementValidationResult[] {
  return modelWeightManifestSupplementTools.map((toolId) => {
    const matchingRecords = supplementRecords.filter((record) => record.toolId === toolId)
    const result = validateAiGraphicsModelWeightManifestSupplementRecord(matchingRecords[0], toolId)

    return matchingRecords.length > 1
      ? withValidationErrors(result, [`${toolId} has duplicate manifest supplement records.`])
      : result
  })
}

export function buildAiGraphicsModelWeightManifestSupplementPacket(
  supplementRecords: readonly Partial<AiGraphicsModelWeightManifestReviewSupplementRecord>[] = [],
): AiGraphicsModelWeightManifestSupplementPacket {
  const validationResults = validateAiGraphicsModelWeightManifestSupplementRecords(supplementRecords)

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SUPPLEMENT_DECISION,
    sourceCatalogDecision: AI_GRAPHICS_MODEL_WEIGHT_SOURCE_CATALOG_DECISION,
    totalAiGraphicsTools: 21,
    modelWeightManifestSupplementTools: [...modelWeightManifestSupplementTools],
    requiredSupplementFields,
    manifestSupplementRecordsProvided: supplementRecords.length,
    manifestSupplementRecordsAccepted: validationResults.filter((result) => result.reviewAccepted).length,
    manifestAuthoringEligibleRecords: validationResults.filter((result) =>
      result.eligibleForManifestAuthoring).length,
    privateArtifactRefsLogged: 0,
    betaReadyModelWeightTools: 0,
    validationResults,
    globalBlockers: [
      'No private manifest supplement records are committed in this public packet.',
      'sourceLicenseRef and modelCardRef must use reviewed private namespaces; HTTP(S), signed, public, raw gs://, and arbitrary placeholders are rejected.',
      'All supplement review booleans must be true before private manifest authoring can consume the record.',
      'Manifest supplements are only source/license/model-card review inputs; they do not approve model download, model load, inference, GPU runtime, Tool Routes, Workers, beta, or production.',
      'GPU runtime remains on-demand only and must start only inside an approved future worker or tool-call job.',
    ],
    booleans: {
      manifestSupplementValidatorPrepared: true,
      sourceModelWeightSourceCatalogAccepted: true,
      all5ModelWeightToolsCovered: true,
      sourceLicensePrivateRefsRequired: true,
      modelCardPrivateRefsRequired: true,
      privateArtifactRefsNotLogged: true,
      publicOrSignedRefsRejected: true,
      commercialUseReviewRequired: true,
      redistributionReviewRequired: true,
      provenanceReviewRequired: true,
      qualityReviewRequired: true,
      securityReviewRequired: true,
      approvedForInternalBetaReviewRequired: true,
      manifestAuthoringOnly: true,
      checksumEvidenceStillRequired: true,
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
