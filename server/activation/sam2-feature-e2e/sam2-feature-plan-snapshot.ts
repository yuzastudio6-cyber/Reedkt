import { phase35fPrefix, sam2FeatureE2EConfig, sam2FeatureE2EDoesNotDo } from './sam2-feature-e2e-policy'
import type {
  Sam2FeatureApprovedPlanSnapshot,
  Sam2FeaturePreviewScope,
  Sam2FeatureSourceValidation,
} from './sam2-feature-e2e-types'

export function buildSam2FeatureApprovedPlanSnapshot(input: {
  runId: string
  sourceValidation: Sam2FeatureSourceValidation
  previewScope: Sam2FeaturePreviewScope
}): Sam2FeatureApprovedPlanSnapshot {
  const prefix = phase35fPrefix(input.runId)
  return {
    planId: `phase35f-sam2-feature-e2e-${input.runId}`,
    phase: '35F',
    phase35FRunId: input.runId,
    approvedSource: sam2FeatureE2EConfig.approvedPreviewSource,
    selectedSource: input.sourceValidation.selectedSource,
    sourceValidation: input.sourceValidation,
    feature: 'sam2_text_behind_subject_preview',
    text: sam2FeatureE2EConfig.approvedText,
    model: {
      modelId: sam2FeatureE2EConfig.modelId,
      modelGcsPath: sam2FeatureE2EConfig.modelGcsPath,
      checkpointSha256: sam2FeatureE2EConfig.checkpointSha256,
      configSha256: sam2FeatureE2EConfig.configSha256,
      aggregateSha256: sam2FeatureE2EConfig.aggregateSha256,
    },
    previewScope: input.previewScope,
    promptSource: 'phase33d_mask_bbox',
    compositionStrategy: 'native_node_png_alpha_composite_with_sam2_mask_foreground',
    executionSteps: [
      'extract_preview_frames',
      'run_sam2_temporal_tracking',
      'compose_text_behind_subject',
      'assemble_private_preview_if_ffmpeg_available',
      'run_qa',
    ],
    outputPrefixes: {
      generatedAssets: `gs://${sam2FeatureE2EConfig.generatedAssetsBucket}/${prefix}/`,
      masks: `gs://${sam2FeatureE2EConfig.masksBucket}/${prefix}/`,
      previews: `gs://${sam2FeatureE2EConfig.previewsBucket}/${prefix}/`,
      qa: `gs://${sam2FeatureE2EConfig.qaBucket}/${prefix}/`,
      workerTemp: `gs://${sam2FeatureE2EConfig.workerTempBucket}/${prefix}/`,
    },
    blockedFeatures: sam2FeatureE2EDoesNotDo,
    approval: {
      approvedPlanSnapshot: true,
      rawPromptExecution: false,
    },
    safety: {
      providerAllowed: false,
      publicAccessAllowed: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      full4KProcessingAllowed: false,
    },
  }
}
