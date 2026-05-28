import { resolveTextBehindSubjectFrameArtifacts, resolveTextBehindSubjectFrameInputs } from './text-behind-subject-frame-source-resolver'
import type { TextBehindSubjectDepthCompositionManifest } from './text-behind-subject-frame-types'

export function buildStaticDepthCompositionFrameManifest(runId = 'phase33e-pending'): TextBehindSubjectDepthCompositionManifest {
  const inputs = resolveTextBehindSubjectFrameInputs()
  const artifacts = resolveTextBehindSubjectFrameArtifacts(runId)
  return {
    id: `phase33e-depth-composition-${runId}`,
    manifestKind: 'depth_composition_frame_manifest',
    runId,
    sourcePhase33DRunId: 'phase33d-20260528T161056',
    inputRefs: {
      backgroundFrame: inputs.representativeFrame,
      mask: inputs.mask,
      foregroundCutout: inputs.cutout,
    },
    textLayerPlanRef: artifacts.textLayerPlan,
    layerOrder: ['background_frame', 'text_layer', 'foreground_cutout'],
    outputPreviewRef: artifacts.preview,
    renderMode: 'single_frame_preview_only',
    renderEngineHandoff: {
      ffmpegSingleFrame: true,
      remotionUsed: false,
      revideoUsed: false,
      finalRenderAllowed: false,
      videoRenderAllowed: false,
    },
    qaRequirements: [
      'mask_edge_quality',
      'mask_subject_coverage',
      'render_asset_integrity',
      'text_readability',
      'text_safe_zone',
      'text_behind_subject_composition',
      'final_delivery',
    ],
  }
}
