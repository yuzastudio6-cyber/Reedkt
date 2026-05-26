import type { DepthCompositionManifest, TextBehindSubjectExecutionInput, TextLayerPlan } from './text-behind-subject-types'

export function buildDepthCompositionManifest(input: {
  executionInput: TextBehindSubjectExecutionInput
  textLayerPlan: TextLayerPlan
  maskArtifactIds: string[]
}): DepthCompositionManifest {
  return {
    id: `depth-composition-${input.executionInput.mediaAssetId}`,
    manifestKind: 'depth_composition_manifest',
    sourceMediaRefs: [
      input.executionInput.sourceVideoArtifactId,
      input.executionInput.proxyVideoArtifactId,
    ].filter((value): value is string => Boolean(value)),
    foregroundMaskRefs: [
      input.executionInput.foregroundMaskArtifactId,
      input.executionInput.maskSequenceArtifactId,
      ...input.maskArtifactIds,
    ].filter((value): value is string => Boolean(value)),
    backgroundLayerRefs: [],
    textLayerRefs: [input.textLayerPlan.textLayerId],
    subjectLayerOrdering: ['base_video', 'text_layer', 'foreground_mask', 'captions'],
    timing: { durationSeconds: input.executionInput.durationSeconds },
    safeZones: input.executionInput.safeZones,
    renderEngineHandoff: {
      remotionMetadataOnly: true,
      hyperframeMetadataOnly: true,
      revideoUsed: false,
      finalRenderAllowed: false,
    },
    qaGateRefs: ['mask_edge_quality', 'mask_temporal_stability', 'mask_subject_coverage', 'render_asset_integrity', 'caption_safe_zone', 'caption_readability'],
  }
}
