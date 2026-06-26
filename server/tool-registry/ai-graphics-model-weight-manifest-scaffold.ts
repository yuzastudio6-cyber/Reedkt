import { getGpuModelWeightManifestTemplate } from '../model-weights'
import type {
  AiGraphicsModelWeightManifestEvidenceRecord,
  AiGraphicsModelWeightManifestToolId,
} from './ai-graphics-model-weight-manifest-readiness'

export const AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SCAFFOLD_DECISION =
  'ai_graphics_model_weight_manifest_scaffold_prepared_for_local_private_records'

export interface AiGraphicsModelWeightManifestScaffoldRecord {
  toolId: AiGraphicsModelWeightManifestToolId
  templateId: string
  directoryName: string
  relativeFilePath: string
  expectedRuntimePath: string
  placeholderRecord: AiGraphicsModelWeightManifestEvidenceRecord
  placeholderPrivateArtifactRefStatus: 'invalid_public_or_signed_ref'
  status: 'template_only_not_reviewed'
}

export interface AiGraphicsModelWeightManifestScaffoldPacket {
  decision: typeof AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SCAFFOLD_DECISION
  totalAiGraphicsTools: 21
  modelWeightManifestRequiredTools: AiGraphicsModelWeightManifestToolId[]
  scaffoldRecords: AiGraphicsModelWeightManifestScaffoldRecord[]
  booleans: {
    modelWeightManifestScaffoldPrepared: true
    all5ModelWeightToolsCovered: true
    runtimeMountLayoutPrepared: true
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

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
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
    privateArtifactRef: `public://replace-with-reviewed-private-artifact-ref/${directoryName}/model_tree_manifest.json`,
    checksumSha256: 'REPLACE_WITH_64_HEX_SHA256',
    sourceLicenseRef: `private://replace-with-reviewed-source-license-evidence/${directoryName}.json`,
    modelCardRef: `private://replace-with-reviewed-model-card-provenance/${directoryName}.json`,
    commercialUseReviewed: false,
    redistributionReviewed: false,
    qualityReviewed: false,
    securityReviewed: false,
    provenanceReviewed: false,
    approvedForInternalBeta: false,
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
      placeholderRecord: placeholderRecordForTool(toolId, templateId),
      placeholderPrivateArtifactRefStatus: 'invalid_public_or_signed_ref' as const,
      status: 'template_only_not_reviewed' as const,
    }
  })

  return {
    decision: AI_GRAPHICS_MODEL_WEIGHT_MANIFEST_SCAFFOLD_DECISION,
    totalAiGraphicsTools: 21,
    modelWeightManifestRequiredTools: [...modelWeightManifestRequiredTools],
    scaffoldRecords,
    booleans: {
      modelWeightManifestScaffoldPrepared: true,
      all5ModelWeightToolsCovered: true,
      runtimeMountLayoutPrepared: true,
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
