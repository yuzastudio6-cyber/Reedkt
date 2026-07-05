import {
  GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES,
  summarizeGpuModelWeightReadiness,
  type GpuModelWeightTemplateId,
  type ProductionModelWeightManifestTemplate,
} from '../model-weights'
import {
  AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
} from './ai-graphics-beta-readiness-gate'
import {
  listAiGraphicsToolCallReadiness,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION,
} from './ai-graphics-worker-handoff-readiness'
import {
  listAiGraphicsModelWeightSourceCandidates,
} from './ai-graphics-model-weight-source-catalog'
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION =
  'ai_graphics_model_weight_manifest_readiness_contract_prepared_with_review_blocks'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION =
  'ai_graphics_model_weight_manifest_review_packet_prepared_with_no_private_records'

export type AiGraphicsModelWeightManifestToolId =
  | 'sam2'
  | 'birefnet'
  | 'real_esrgan'
  | 'rembg'
  | 'transparent_background'

export interface AiGraphicsModelWeightManifestEvidenceRecord {
  manifestId: string
  toolId: AiGraphicsModelWeightManifestToolId
  templateId: GpuModelWeightTemplateId
  sourceCandidateId: string
  privateArtifactRef: string
  checksumSha256: string
  checksumEvidenceRef: string
  sourceLicenseRef: string
  modelCardRef: string
  checksumEvidenceReviewed: boolean
  commercialUseReviewed: boolean
  redistributionReviewed: boolean
  qualityReviewed: boolean
  securityReviewed: boolean
  provenanceReviewed: boolean
  approvedForInternalBeta: boolean
}

export interface AiGraphicsModelWeightManifestRequirement {
  toolId: AiGraphicsModelWeightManifestToolId
  productionToolId: ProductionToolId
  templateId: GpuModelWeightTemplateId
  templateModelName: string
  expectedRuntimePath: string
  manifestRequired: true
  gpuRequiredForRuntime: true
  runtimeTarget: string
  manifestRecordProvided: boolean
  manifestApprovedNow: boolean
  modelWeightsDownloaded: false
  modelWeightsLoaded: false
  blockedReasons: string[]
  nextProofMilestone: string
}

export interface AiGraphicsModelWeightFoundationTool {
  toolId: Extract<AiGraphicsCanonicalToolId, 'torch_torchvision' | 'transformers' | 'kornia'>
  manifestRequired: false
  gpuRequiredForRuntime: true
  reason: string
}

export interface AiGraphicsModelWeightManifestReadinessContract {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION
  sourceWorkerHandoffDecision: typeof AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION
  sourceBetaGateDecision: typeof AI_GRAPHICS_BETA_READINESS_GATE_DECISION
  totalAiGraphicsTools: 21
  gpuRuntimeTargetedTools: AiGraphicsCanonicalToolId[]
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  modelWeightTemplateIdsCovered: GpuModelWeightTemplateId[]
  foundationGpuToolsWithoutModelManifest: AiGraphicsModelWeightFoundationTool[]
  manifestRecordsProvided: number
  manifestRecordsApproved: number
  betaReadyModelWeightTools: 0
  requiredManifestFields: string[]
  requirements: AiGraphicsModelWeightManifestRequirement[]
  globalBlockers: string[]
  booleans: {
    modelWeightManifestReadinessContractPrepared: true
    sourceWorkerHandoffAccepted: true
    sourceBetaReadinessGateAccepted: true
    all5ModelWeightToolsCovered: true
    all5TemplateTypesCovered: true
    privateArtifactManifestRequired: true
    checksumRequired: true
    licenseReviewRequired: true
    provenanceReviewRequired: true
    qualityReviewRequired: true
    securityReviewRequired: true
    gpuRuntimeProofRequired: true
    gpuHeavyToolsTargetGpuRuntime: true
    agentCanSelectForPlanning: true
    modelWeightManifestsApprovedNow: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    modelInferencePerformed: false
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerCanQueueNow: false
    workerCanExecuteToolsNow: false
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
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

export type AiGraphicsPrivateArtifactRefStatus =
  | 'missing'
  | 'present_private_ref_not_logged'
  | 'invalid_public_or_signed_ref'

export interface AiGraphicsModelWeightManifestValidationResult {
  toolId: AiGraphicsModelWeightManifestToolId | string
  templateId: GpuModelWeightTemplateId | string
  expectedTemplateId: GpuModelWeightTemplateId | null
  expectedSourceCandidateId: string | null
  sourceCatalogSuggestedChecksumSha256: string | null
  sourceCatalogChecksumEvidenceStatus: string | null
  checksumEvidenceRefStatus: AiGraphicsPrivateArtifactRefStatus
  manifestRecordProvided: boolean
  schemaValid: boolean
  reviewAccepted: boolean
  eligibleForNativeGpuProofInput: boolean
  approvedForAgentExecutionNow: false
  privateArtifactRefStatus: AiGraphicsPrivateArtifactRefStatus
  errors: string[]
  warnings: string[]
}

export interface AiGraphicsModelWeightManifestReviewPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION
  sourceManifestReadinessDecision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION
  totalAiGraphicsTools: 21
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  requiredManifestFields: string[]
  manifestRecordsProvided: number
  schemaValidManifestRecords: number
  reviewAcceptedManifestRecords: number
  nativeGpuProofInputEligibleRecords: number
  privateArtifactRefsLogged: 0
  betaReadyModelWeightTools: 0
  validationResults: AiGraphicsModelWeightManifestValidationResult[]
  globalBlockers: string[]
  booleans: {
    modelWeightManifestReviewPacketPrepared: true
    sourceManifestReadinessContractAccepted: true
    all5ModelWeightToolsCovered: true
    all5TemplateTypesCovered: true
    manifestSchemaValidationReady: true
    privateArtifactRefNamespaceRequired: true
    privateArtifactRefsNotLogged: true
    publicOrSignedArtifactRefsRejected: true
    checksumSha256Required: true
    checksumEvidenceRefRequired: true
    checksumEvidenceReviewRequired: true
    sourceCatalogChecksumGuidanceEnforced: true
    suggestedChecksumMismatchRejected: true
    licenseReviewRequired: true
    provenanceReviewRequired: true
    qualityReviewRequired: true
    securityReviewRequired: true
    nativeGpuProofStillRequired: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
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

const requiredManifestStringFields = [
  'manifestId',
  'sourceCandidateId',
  'privateArtifactRef',
  'checksumSha256',
  'checksumEvidenceRef',
  'sourceLicenseRef',
  'modelCardRef',
] as const satisfies readonly (keyof AiGraphicsModelWeightManifestEvidenceRecord)[]

const requiredManifestReviewBooleanFields = [
  'checksumEvidenceReviewed',
  'commercialUseReviewed',
  'redistributionReviewed',
  'qualityReviewed',
  'securityReviewed',
  'provenanceReviewed',
  'approvedForInternalBeta',
] as const satisfies readonly (keyof AiGraphicsModelWeightManifestEvidenceRecord)[]

const sha256Pattern = /^[a-f0-9]{64}$/i

const requiredModelManifestTools = [
  {
    toolId: 'sam2',
    productionToolId: 'sam2',
    templateId: 'sam2_checkpoint',
    nextProofMilestone: 'sam2_private_checkpoint_manifest_review_then_native_gpu_fixture_runtime',
  },
  {
    toolId: 'birefnet',
    productionToolId: 'birefnet',
    templateId: 'birefnet_model',
    nextProofMilestone: 'birefnet_private_model_manifest_review_then_native_gpu_fixture_runtime',
  },
  {
    toolId: 'real_esrgan',
    productionToolId: 'real_esrgan',
    templateId: 'real_esrgan_model',
    nextProofMilestone: 'real_esrgan_private_weight_manifest_review_then_native_gpu_fixture_runtime',
  },
  {
    toolId: 'rembg',
    productionToolId: 'rembg',
    templateId: 'rembg_model',
    nextProofMilestone: 'rembg_private_model_cache_manifest_review_then_native_gpu_fixture_runtime',
  },
  {
    toolId: 'transparent_background',
    productionToolId: 'transparent_background',
    templateId: 'transparent_background_model',
    nextProofMilestone: 'transparent_background_private_model_cache_manifest_review_then_native_gpu_fixture_runtime',
  },
] as const satisfies readonly {
  toolId: AiGraphicsModelWeightManifestToolId
  productionToolId: ProductionToolId
  templateId: GpuModelWeightTemplateId
  nextProofMilestone: string
}[]

export function listAiGraphicsModelWeightManifestRequiredTools(): readonly {
  toolId: AiGraphicsModelWeightManifestToolId
  templateId: GpuModelWeightTemplateId
}[] {
  return requiredModelManifestTools.map((tool) => ({
    toolId: tool.toolId,
    templateId: tool.templateId,
  }))
}

const foundationGpuToolsWithoutModelManifest = [
  {
    toolId: 'torch_torchvision',
    manifestRequired: false,
    gpuRequiredForRuntime: true,
    reason: 'Torch/Torchvision is the CUDA tensor runtime foundation; concrete model manifests are required by downstream model tools.',
  },
  {
    toolId: 'transformers',
    manifestRequired: false,
    gpuRequiredForRuntime: true,
    reason: 'Transformers is the model loader foundation; no from-hub loading is approved without downstream private manifests.',
  },
  {
    toolId: 'kornia',
    manifestRequired: false,
    gpuRequiredForRuntime: true,
    reason: 'Kornia is tensor/image operations runtime; it still requires native GPU proof but no standalone model-weight manifest.',
  },
] as const satisfies readonly AiGraphicsModelWeightFoundationTool[]

function templateById(templateId: GpuModelWeightTemplateId): ProductionModelWeightManifestTemplate {
  const template = GPU_MODEL_WEIGHT_MANIFEST_TEMPLATES.find((entry) => entry.id === templateId)
  if (!template) {
    throw new Error(`Missing AI graphics model-weight manifest template: ${templateId}`)
  }
  return template
}

function sourceCandidateForTool(toolId: AiGraphicsModelWeightManifestToolId | string | undefined) {
  return listAiGraphicsModelWeightSourceCandidates().find((candidate) => candidate.toolId === toolId) ?? null
}

function expectedSourceCandidateIdForTool(toolId: AiGraphicsModelWeightManifestToolId | string | undefined): string | null {
  return sourceCandidateForTool(toolId)?.candidateId ?? null
}

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function privateArtifactRefStatus(privateArtifactRef: string | undefined): AiGraphicsPrivateArtifactRefStatus {
  if (!privateArtifactRef || !hasText(privateArtifactRef)) {
    return 'missing'
  }

  const normalizedRef = privateArtifactRef.trim()
  const hasPublicUrl = /^https?:\/\//i.test(normalizedRef) || /^public:\/\//i.test(normalizedRef)
  const hasSignedUrl = /^signed:\/\//i.test(normalizedRef) ||
    /[?&](X-Goog-Signature|X-Amz-Signature|Signature)=/i.test(normalizedRef)
  const hasReviewedPrivateNamespace = /^(private:\/\/|reeditpro-private:\/\/|reeditpro-private-artifact-ref-)/i
    .test(normalizedRef)

  return hasPublicUrl || hasSignedUrl || !hasReviewedPrivateNamespace
    ? 'invalid_public_or_signed_ref'
    : 'present_private_ref_not_logged'
}

function manifestRecordIsApproved(
  record: AiGraphicsModelWeightManifestEvidenceRecord | undefined,
): record is AiGraphicsModelWeightManifestEvidenceRecord {
  return Boolean(
    record &&
      hasText(record.manifestId) &&
      hasText(record.sourceCandidateId) &&
      hasText(record.privateArtifactRef) &&
      hasText(record.checksumSha256) &&
      hasText(record.checksumEvidenceRef) &&
      hasText(record.sourceLicenseRef) &&
      hasText(record.modelCardRef) &&
      record.checksumEvidenceReviewed &&
      record.commercialUseReviewed &&
      record.redistributionReviewed &&
      record.qualityReviewed &&
      record.securityReviewed &&
      record.provenanceReviewed &&
      record.approvedForInternalBeta,
  )
}

function requiredModelManifestToolByToolId(
  toolId: AiGraphicsModelWeightManifestToolId | string | undefined,
): typeof requiredModelManifestTools[number] | undefined {
  return requiredModelManifestTools.find((input) => input.toolId === toolId)
}

function withValidationErrors(
  result: AiGraphicsModelWeightManifestValidationResult,
  errors: string[],
): AiGraphicsModelWeightManifestValidationResult {
  return {
    ...result,
    schemaValid: false,
    reviewAccepted: false,
    eligibleForNativeGpuProofInput: false,
    errors: [...result.errors, ...errors],
  }
}

export function validateAiGraphicsModelWeightManifestRecord(
  record: Partial<AiGraphicsModelWeightManifestEvidenceRecord> | undefined,
  expectedToolId?: AiGraphicsModelWeightManifestToolId,
): AiGraphicsModelWeightManifestValidationResult {
  const expectedTool = requiredModelManifestToolByToolId(expectedToolId) ??
    requiredModelManifestToolByToolId(record?.toolId)
  const toolId = expectedTool?.toolId ?? record?.toolId ?? expectedToolId ?? 'unknown_model_weight_tool'
  const templateId = record?.templateId ?? expectedTool?.templateId ?? 'unknown_model_weight_template'
  const errors: string[] = []
  const sourceCandidate = sourceCandidateForTool(expectedTool?.toolId ?? record?.toolId ?? expectedToolId)
  const sourceCatalogSuggestedChecksumSha256 = sourceCandidate?.suggestedPrivateManifestChecksumSha256 ?? null
  const sourceCatalogChecksumEvidenceStatus = sourceCandidate?.checksumEvidenceStatus ?? null
  const warnings: string[] = [
    `${toolId} remains blocked from agent, Tool Route, Worker, provider, public artifact, beta, and production execution.`,
    `${toolId} still requires native linux/amd64 NVIDIA L4 runtime proof before model load or inference.`,
  ]

  if (!record) {
    return {
      toolId,
      templateId,
      expectedTemplateId: expectedTool?.templateId ?? null,
      expectedSourceCandidateId: expectedSourceCandidateIdForTool(toolId),
      sourceCatalogSuggestedChecksumSha256,
      sourceCatalogChecksumEvidenceStatus,
      checksumEvidenceRefStatus: 'missing',
      manifestRecordProvided: false,
      schemaValid: false,
      reviewAccepted: false,
      eligibleForNativeGpuProofInput: false,
      approvedForAgentExecutionNow: false,
      privateArtifactRefStatus: 'missing',
      errors: [`${toolId} reviewed private manifest record is missing.`],
      warnings,
    }
  }

  if (!expectedTool) {
    errors.push(`${record.toolId ?? 'unknown'} is not an AI graphics model-weight manifest-required tool.`)
  }
  if (expectedTool && record.toolId !== expectedTool.toolId) {
    errors.push(`toolId must be ${expectedTool.toolId}.`)
  }
  if (expectedTool && record.templateId !== expectedTool.templateId) {
    errors.push(`templateId must be ${expectedTool.templateId}.`)
  }

  const expectedSourceCandidateId = expectedSourceCandidateIdForTool(expectedTool?.toolId ?? record.toolId)
  if (!expectedSourceCandidateId) {
    errors.push(`${record.toolId ?? 'unknown'} is missing a selected source candidate in the AI graphics source catalog.`)
  }
  if (expectedSourceCandidateId && record.sourceCandidateId !== expectedSourceCandidateId) {
    errors.push(`sourceCandidateId must be ${expectedSourceCandidateId}.`)
  }

  for (const field of requiredManifestStringFields) {
    const value = record[field]
    if (typeof value !== 'string' || !hasText(value)) {
      errors.push(`${String(field)} must be a non-empty string.`)
    }
  }

  if (typeof record.checksumSha256 === 'string' && !sha256Pattern.test(record.checksumSha256)) {
    errors.push('checksumSha256 must be a 64-character hex SHA-256 digest.')
  }
  if (
    sourceCatalogSuggestedChecksumSha256 &&
    typeof record.checksumSha256 === 'string' &&
    sha256Pattern.test(record.checksumSha256) &&
    record.checksumSha256.toLowerCase() !== sourceCatalogSuggestedChecksumSha256.toLowerCase()
  ) {
    errors.push(
      `checksumSha256 must match reviewed source-catalog checksum ${sourceCatalogSuggestedChecksumSha256} for ${sourceCandidate?.candidateId}.`,
    )
  }

  const artifactRefStatus = privateArtifactRefStatus(record.privateArtifactRef)
  const checksumEvidenceRefStatus = privateArtifactRefStatus(record.checksumEvidenceRef)
  if (artifactRefStatus === 'invalid_public_or_signed_ref') {
    errors.push(
      'privateArtifactRef must be a reviewed private storage reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
    )
  }
  if (checksumEvidenceRefStatus === 'invalid_public_or_signed_ref') {
    errors.push(
      'checksumEvidenceRef must be a reviewed private checksum evidence reference using private://, reeditpro-private://, or reeditpro-private-artifact-ref-; HTTP(S), public, signed, raw gs://, and arbitrary placeholders are rejected.',
    )
  }

  for (const field of requiredManifestReviewBooleanFields) {
    if (record[field] !== true) {
      errors.push(`${String(field)} must be true after owner review.`)
    }
  }

  const schemaValid = errors.length === 0
  const reviewAccepted = schemaValid && requiredManifestReviewBooleanFields.every((field) => record[field] === true)

  return {
    toolId,
    templateId,
    expectedTemplateId: expectedTool?.templateId ?? null,
    expectedSourceCandidateId,
    sourceCatalogSuggestedChecksumSha256,
    sourceCatalogChecksumEvidenceStatus,
    checksumEvidenceRefStatus,
    manifestRecordProvided: true,
    schemaValid,
    reviewAccepted,
    eligibleForNativeGpuProofInput: reviewAccepted,
    approvedForAgentExecutionNow: false,
    privateArtifactRefStatus: artifactRefStatus,
    errors,
    warnings,
  }
}

export function validateAiGraphicsModelWeightManifestRecords(
  evidenceRecords: readonly Partial<AiGraphicsModelWeightManifestEvidenceRecord>[] = [],
): AiGraphicsModelWeightManifestValidationResult[] {
  return requiredModelManifestTools.map((input) => {
    const matchingRecords = evidenceRecords.filter((record) => record.toolId === input.toolId)
    const result = validateAiGraphicsModelWeightManifestRecord(matchingRecords[0], input.toolId)

    return matchingRecords.length > 1
      ? withValidationErrors(result, [`${input.toolId} has duplicate manifest records.`])
      : result
  })
}

function buildRequirement(
  input: typeof requiredModelManifestTools[number],
  evidenceRecords: readonly AiGraphicsModelWeightManifestEvidenceRecord[],
): AiGraphicsModelWeightManifestRequirement {
  const template = templateById(input.templateId)
  const readinessRecord = listAiGraphicsToolCallReadiness().find((record) => record.toolId === input.toolId)
  if (!readinessRecord) {
    throw new Error(`Missing AI graphics readiness record for model-weight tool: ${input.toolId}`)
  }

  const evidenceRecord = evidenceRecords.find((record) =>
    record.toolId === input.toolId && record.templateId === input.templateId)
  const approved = manifestRecordIsApproved(evidenceRecord)

  const blockedReasons = [
    !evidenceRecord ? `${input.templateId} reviewed private manifest record is missing.` : undefined,
    evidenceRecord && !hasText(evidenceRecord.privateArtifactRef) ? `${input.templateId} private artifact ref is missing.` : undefined,
    evidenceRecord && !hasText(evidenceRecord.checksumSha256) ? `${input.templateId} checksumSha256 is missing.` : undefined,
    evidenceRecord && !hasText(evidenceRecord.checksumEvidenceRef) ? `${input.templateId} checksum evidence ref is missing.` : undefined,
    evidenceRecord && !hasText(evidenceRecord.sourceLicenseRef) ? `${input.templateId} source/license evidence ref is missing.` : undefined,
    evidenceRecord && !hasText(evidenceRecord.modelCardRef) ? `${input.templateId} model card or provenance ref is missing.` : undefined,
    evidenceRecord && !evidenceRecord.checksumEvidenceReviewed ? `${input.templateId} checksum evidence review is not accepted.` : undefined,
    evidenceRecord && !evidenceRecord.commercialUseReviewed ? `${input.templateId} commercial-use review is not accepted.` : undefined,
    evidenceRecord && !evidenceRecord.redistributionReviewed ? `${input.templateId} redistribution review is not accepted.` : undefined,
    evidenceRecord && !evidenceRecord.qualityReviewed ? `${input.templateId} quality review is not accepted.` : undefined,
    evidenceRecord && !evidenceRecord.securityReviewed ? `${input.templateId} security review is not accepted.` : undefined,
    evidenceRecord && !evidenceRecord.provenanceReviewed ? `${input.templateId} provenance review is not accepted.` : undefined,
    evidenceRecord && !evidenceRecord.approvedForInternalBeta ? `${input.templateId} internal beta owner approval is not accepted.` : undefined,
    `${input.toolId} still requires native NVIDIA L4 runtime proof before any model load or inference.`,
    `${input.toolId} remains blocked from agent, route, worker, provider, public artifact, beta, and production execution.`,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    toolId: input.toolId,
    productionToolId: input.productionToolId,
    templateId: input.templateId,
    templateModelName: template.modelName,
    expectedRuntimePath: template.expectedPath,
    manifestRequired: true,
    gpuRequiredForRuntime: true,
    runtimeTarget: readinessRecord.runtimeTarget,
    manifestRecordProvided: Boolean(evidenceRecord),
    manifestApprovedNow: false,
    modelWeightsDownloaded: false,
    modelWeightsLoaded: false,
    blockedReasons: approved
      ? [
          `${input.toolId} manifest fields are present, but runtime, worker, artifact, and beta-owner gates still block execution.`,
          `${input.toolId} still requires native NVIDIA L4 runtime proof before any model load or inference.`,
        ]
      : blockedReasons,
    nextProofMilestone: input.nextProofMilestone,
  }
}

export function listAiGraphicsModelWeightManifestRequirements(
  evidenceRecords: readonly AiGraphicsModelWeightManifestEvidenceRecord[] = [],
): AiGraphicsModelWeightManifestRequirement[] {
  return requiredModelManifestTools.map((input) => buildRequirement(input, evidenceRecords))
}

export function buildAiGraphicsModelWeightManifestReviewPacket(
  evidenceRecords: readonly Partial<AiGraphicsModelWeightManifestEvidenceRecord>[] = [],
): AiGraphicsModelWeightManifestReviewPacket {
  const validationResults = validateAiGraphicsModelWeightManifestRecords(evidenceRecords)

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_REVIEW_PACKET_DECISION,
    sourceManifestReadinessDecision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION,
    totalAiGraphicsTools: 21,
    modelWeightManifestRequiredTools: requiredModelManifestTools.map((tool) => tool.toolId),
    requiredManifestFields,
    manifestRecordsProvided: evidenceRecords.length,
    schemaValidManifestRecords: validationResults.filter((result) => result.schemaValid).length,
    reviewAcceptedManifestRecords: validationResults.filter((result) => result.reviewAccepted).length,
    nativeGpuProofInputEligibleRecords: validationResults.filter((result) => result.eligibleForNativeGpuProofInput).length,
    privateArtifactRefsLogged: 0,
    betaReadyModelWeightTools: 0,
    validationResults,
    globalBlockers: [
      'No private model/checkpoint artifact refs are logged in public docs or diagnostics.',
      'privateArtifactRef must use an approved private artifact namespace; raw gs://, HTTP(S), signed, public, or arbitrary placeholder refs are rejected.',
      'sourceCandidateId must match the selected ReeditPro source-catalog candidate for the tool before native GPU proof input can be eligible.',
      'When the source catalog includes reviewed checksum guidance, checksumSha256 must match that value before native GPU proof input can be eligible.',
      'checksumEvidenceRef must point to private checksum evidence, and checksumEvidenceReviewed must be true before native GPU proof input can be eligible.',
      'Reviewed private manifests are only inputs to later native GPU proof; they do not approve model download, model load, or inference.',
      'Native linux/amd64 NVIDIA L4 proof, Tool Route gating, Worker gating, approved snapshot, credit reservation, private artifact boundary, and owner beta gates remain blocked.',
      'Agent/tool/route/worker/provider execution, media processing, signed URLs, public artifacts, beta, and production remain blocked.',
    ],
    booleans: {
      modelWeightManifestReviewPacketPrepared: true,
      sourceManifestReadinessContractAccepted: true,
      all5ModelWeightToolsCovered: true,
      all5TemplateTypesCovered: true,
      manifestSchemaValidationReady: true,
      privateArtifactRefNamespaceRequired: true,
      privateArtifactRefsNotLogged: true,
      publicOrSignedArtifactRefsRejected: true,
      checksumSha256Required: true,
      checksumEvidenceRefRequired: true,
      checksumEvidenceReviewRequired: true,
      sourceCatalogChecksumGuidanceEnforced: true,
      suggestedChecksumMismatchRejected: true,
      licenseReviewRequired: true,
      provenanceReviewRequired: true,
      qualityReviewRequired: true,
      securityReviewRequired: true,
      nativeGpuProofStillRequired: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
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

export function buildAiGraphicsModelWeightManifestReadinessContract(
  evidenceRecords: readonly AiGraphicsModelWeightManifestEvidenceRecord[] = [],
): AiGraphicsModelWeightManifestReadinessContract {
  const allReadinessTools = listAiGraphicsToolCallReadiness()
  const gpuRuntimeTargetedTools = allReadinessTools
    .filter((record) => record.gpuRequiredForRuntime)
    .map((record) => record.toolId)
  const requirements = listAiGraphicsModelWeightManifestRequirements(evidenceRecords)
  const manifestRecordsApproved = requirements.filter((requirement) => requirement.manifestApprovedNow).length
  const modelWeightReadiness = summarizeGpuModelWeightReadiness()

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION,
    sourceWorkerHandoffDecision: AI_GRAPHICS_WORKER_HANDOFF_READINESS_DECISION,
    sourceBetaGateDecision: AI_GRAPHICS_BETA_READINESS_GATE_DECISION,
    totalAiGraphicsTools: 21,
    gpuRuntimeTargetedTools,
    modelWeightManifestRequiredTools: requiredModelManifestTools.map((tool) => tool.toolId),
    modelWeightTemplateIdsCovered: requiredModelManifestTools.map((tool) => tool.templateId),
    foundationGpuToolsWithoutModelManifest: [...foundationGpuToolsWithoutModelManifest],
    manifestRecordsProvided: evidenceRecords.length,
    manifestRecordsApproved,
    betaReadyModelWeightTools: 0,
    requiredManifestFields,
    requirements,
    globalBlockers: [
      'No reviewed private model/checkpoint manifest records are approved in this lane.',
      `Generic model-weight readiness still reports ${modelWeightReadiness.needsReview.length} needs-review templates.`,
      'Native linux/amd64 NVIDIA L4 runtime proof is still required before model load or inference.',
      'Tool Route, Worker, approved snapshot, credit reservation, private artifact, idempotency, and owner beta gates remain blocked.',
      'Model-weight download, model load, inference, media processing, signed URL creation, public artifact creation, beta, and production remain blocked.',
    ],
    booleans: {
      modelWeightManifestReadinessContractPrepared: true,
      sourceWorkerHandoffAccepted: true,
      sourceBetaReadinessGateAccepted: true,
      all5ModelWeightToolsCovered: true,
      all5TemplateTypesCovered: true,
      privateArtifactManifestRequired: true,
      checksumRequired: true,
      licenseReviewRequired: true,
      provenanceReviewRequired: true,
      qualityReviewRequired: true,
      securityReviewRequired: true,
      gpuRuntimeProofRequired: true,
      gpuHeavyToolsTargetGpuRuntime: true,
      agentCanSelectForPlanning: true,
      modelWeightManifestsApprovedNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerCanQueueNow: false,
      workerCanExecuteToolsNow: false,
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
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
