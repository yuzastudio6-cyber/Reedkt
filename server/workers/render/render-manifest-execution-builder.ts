import { resolveRenderAssets } from './render-asset-resolver'
import type { FinalRenderExecutionInput, RenderExecutionManifest } from './render-execution-types'

export function buildRenderManifestExecution(input: FinalRenderExecutionInput): RenderExecutionManifest {
  const resolvedAssets = resolveRenderAssets(input)
  const timelineClips = input.timelineManifest?.clips ?? []
  const renderLayers = input.renderManifest?.layers ?? []
  const captionIds = input.captionArtifactIds ?? input.renderManifest?.captions.flatMap((caption) => caption.captionArtifactId ? [caption.captionArtifactId] : []) ?? []
  const audioIds = input.audioArtifactIds ?? input.renderManifest?.audio.sourceArtifactIds ?? []

  return {
    executionManifestId: `render-execution-${input.mediaAssetId}-${input.renderMode}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    timelineManifestId: input.timelineManifestId ?? input.timelineManifest?.id,
    renderManifestId: input.renderManifestId ?? input.renderManifest?.id,
    clips: timelineClips.length > 0
      ? timelineClips.map((clip) => ({
        clipId: clip.id,
        sourceArtifactId: clip.sourceMediaAssetId,
        startSeconds: clip.timelineRange.startSeconds,
        endSeconds: clip.timelineRange.endSeconds,
      }))
      : [{ clipId: `${input.mediaAssetId}-full-range`, sourceArtifactId: input.sourceVideoArtifactIds?.[0] ?? input.proxyVideoArtifactIds?.[0], startSeconds: 0, endSeconds: input.durationSeconds }],
    captions: captionIds.map((artifactId) => ({ artifactId, burnInRequired: input.enableCaptionBurnIn === true })),
    audio: audioIds.map((artifactId) => ({ artifactId, role: 'mix' as const })),
    overlays: renderLayers.filter((layer) => layer.layerType.includes('overlay') || layer.layerType.includes('text')).map((layer) => layer.id),
    masks: [...(input.maskArtifactIds ?? []), ...renderLayers.filter((layer) => layer.layerType.includes('mask')).map((layer) => layer.id)],
    colorArtifactIds: input.colorArtifactIds ?? [],
    enhancementArtifactIds: input.enhancementArtifactIds ?? [],
    slowMotionArtifactIds: input.slowMotionArtifactIds ?? [],
    canvas: input.canvas,
    fps: input.fps,
    durationSeconds: input.durationSeconds,
    renderEngine: input.renderEngine,
    renderMode: input.renderMode,
    exportSettings: input.exportSettings,
    resolvedAssets,
    qaRequirements: buildQaRequirements(input),
    hyperframeBridgeOnly: true,
    revideoUsed: false,
    finalDeliveryCandidate: input.renderMode === 'final_export',
  }
}

function buildQaRequirements(input: FinalRenderExecutionInput): RenderExecutionManifest['qaRequirements'] {
  const gates: RenderExecutionManifest['qaRequirements'] = [
    'render_asset_integrity',
    'render_timeline_integrity',
    'export_codec_format',
    'export_duration_sync',
    'audio_sync',
    'final_delivery',
  ]
  if ((input.captionArtifactIds?.length ?? 0) > 0 || (input.captionLocalPaths?.length ?? 0) > 0) gates.push('caption_safe_zone', 'caption_readability')
  if ((input.colorArtifactIds?.length ?? 0) > 0) gates.push('color_export_space')
  if ((input.maskArtifactIds?.length ?? 0) > 0) gates.push('mask_subject_coverage')
  if ((input.enhancementArtifactIds?.length ?? 0) > 0) gates.push('enhancement_artifacts')
  if ((input.slowMotionArtifactIds?.length ?? 0) > 0) gates.push('slow_motion_artifacts')
  return [...new Set(gates)]
}
