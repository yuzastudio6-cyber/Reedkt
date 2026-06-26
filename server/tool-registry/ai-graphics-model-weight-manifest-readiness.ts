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
import type { ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_READINESS_DECISION =
  'ai_graphics_model_weight_manifest_readiness_contract_prepared_with_review_blocks'

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
  privateArtifactRef: string
  checksumSha256: string
  sourceLicenseRef: string
  modelCardRef: string
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

const requiredManifestFields = [
  'manifestId',
  'toolId',
  'templateId',
  'privateArtifactRef',
  'checksumSha256',
  'sourceLicenseRef',
  'modelCardRef',
  'commercialUseReviewed',
  'redistributionReviewed',
  'qualityReviewed',
  'securityReviewed',
  'provenanceReviewed',
  'approvedForInternalBeta',
]

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

function hasText(value: string): boolean {
  return value.trim().length > 0
}

function manifestRecordIsApproved(
  record: AiGraphicsModelWeightManifestEvidenceRecord | undefined,
): record is AiGraphicsModelWeightManifestEvidenceRecord {
  return Boolean(
    record &&
      hasText(record.manifestId) &&
      hasText(record.privateArtifactRef) &&
      hasText(record.checksumSha256) &&
      hasText(record.sourceLicenseRef) &&
      hasText(record.modelCardRef) &&
      record.commercialUseReviewed &&
      record.redistributionReviewed &&
      record.qualityReviewed &&
      record.securityReviewed &&
      record.provenanceReviewed &&
      record.approvedForInternalBeta,
  )
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
    evidenceRecord && !hasText(evidenceRecord.sourceLicenseRef) ? `${input.templateId} source/license evidence ref is missing.` : undefined,
    evidenceRecord && !hasText(evidenceRecord.modelCardRef) ? `${input.templateId} model card or provenance ref is missing.` : undefined,
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
