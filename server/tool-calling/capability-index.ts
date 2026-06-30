import {
  getProductionToolProfile,
  isProductionToolId,
  listProductionToolProfiles,
} from '../tool-registry'
import type {
  ProductionToolId,
  ProductionToolProfile,
} from '../tool-registry'
import {
  getOperationDefinition,
  listOperationDefinitions,
} from './operation-ontology'
import type {
  ToolCallingArtifactType,
  ToolCallingOperationDefinition,
  ToolCallingOperationId,
} from './operation-ontology'
import type { ToolCapabilityCard } from './tool-capability-card-types'

export const OPERATION_TOOL_SEEDS: Record<ToolCallingOperationId, readonly ProductionToolId[]> = {
  'media.inspect': ['ffprobe', 'ffmpeg', 'pyav', 'opencv'],
  'media.proxy.create': ['ffmpeg', 'pyav', 'vapoursynth'],
  'media.audio.extract': ['ffmpeg', 'pyav'],
  'video.scene.detect': ['pyscenedetect', 'opencv', 'ffmpeg'],
  'video.frame.sample': ['pyav', 'opencv', 'ffmpeg', 'sharp'],
  'video.motion.score': ['opencv', 'pyscenedetect', 'vapoursynth'],
  'video.blur.score': ['opencv', 'sharp', 'kornia'],
  'video.safe_zone.detect': ['opencv', 'mediapipe', 'paddleocr', 'sharp'],
  'audio.transcribe': ['faster_whisper', 'whisper_cpp'],
  'audio.word_align': ['faster_whisper', 'whisper_cpp'],
  'audio.loudness.normalize': ['ffmpeg', 'rnnoise', 'signalsmith_stretch'],
  'audio.cleanup': ['deepfilternet', 'rnnoise', 'demucs', 'ffmpeg'],
  'caption.generate': ['faster_whisper', 'remotion', 'libass'],
  'caption.align': ['faster_whisper', 'libass', 'remotion'],
  'caption.style': ['remotion', 'libass', 'sharp'],
  'caption.burn_in': ['libass', 'remotion', 'ffmpeg'],
  'timeline.smart_cut': ['pyscenedetect', 'opentimelineio', 'hyperframe', 'opencv'],
  'timeline.validate': ['opentimelineio', 'hyperframe', 'remotion', 'ffprobe'],
  'timeline.to_otio': ['opentimelineio', 'hyperframe', 'remotion'],
  'render.preview': ['remotion', 'hyperframe', 'ffmpeg', 'pixijs', 'three_js'],
  'render.compose': ['remotion', 'ffmpeg', 'libass', 'pixijs', 'three_js', 'lottie'],
  'export.mux': ['ffmpeg', 'libass', 'vapoursynth'],
  'export.validate': ['ffprobe', 'ffmpeg', 'opentimelineio'],
  'mask.generate': ['birefnet', 'sam2', 'rembg', 'transparent_background', 'opencv'],
  'mask.refine': ['kornia', 'sam2', 'opencv', 'birefnet'],
  'background.remove': ['birefnet', 'sam2', 'rembg', 'transparent_background', 'opencv', 'kornia'],
  'video.enhance': ['real_esrgan', 'sharp', 'ffmpeg', 'vapoursynth'],
  'video.slow_motion': ['film', 'ffmpeg', 'vapoursynth'],
  'color.exposure.correct': ['opencolorio', 'ffmpeg', 'openimageio', 'opencv'],
  'color.shot_match': ['opencolorio', 'openimageio', 'opencv', 'ffmpeg'],
  'ocr.detect_text': ['paddleocr', 'opencv', 'playwright'],
  'thumbnail.generate': ['sharp', 'pyav', 'ffmpeg', 'opencv'],
  'qa.final_delivery': ['ffprobe', 'ffmpeg', 'opentimelineio', 'remotion', 'duckdb', 'polars'],
}

const actionOperationHints: ReadonlyArray<{
  actionNeedle: string
  operationId: ToolCallingOperationId
}> = [
  { actionNeedle: 'probe', operationId: 'media.inspect' },
  { actionNeedle: 'proxy', operationId: 'media.proxy.create' },
  { actionNeedle: 'audio_extract', operationId: 'media.audio.extract' },
  { actionNeedle: 'extract_audio', operationId: 'media.audio.extract' },
  { actionNeedle: 'detect_scenes', operationId: 'video.scene.detect' },
  { actionNeedle: 'sample_frames', operationId: 'video.frame.sample' },
  { actionNeedle: 'thumbnail', operationId: 'thumbnail.generate' },
  { actionNeedle: 'score_blur', operationId: 'video.blur.score' },
  { actionNeedle: 'safe_zone', operationId: 'video.safe_zone.detect' },
  { actionNeedle: 'transcribe', operationId: 'audio.transcribe' },
  { actionNeedle: 'align_words', operationId: 'audio.word_align' },
  { actionNeedle: 'loudness', operationId: 'audio.loudness.normalize' },
  { actionNeedle: 'denoise', operationId: 'audio.cleanup' },
  { actionNeedle: 'caption', operationId: 'caption.generate' },
  { actionNeedle: 'subtitle', operationId: 'caption.burn_in' },
  { actionNeedle: 'timeline', operationId: 'timeline.validate' },
  { actionNeedle: 'serialize_otio', operationId: 'timeline.to_otio' },
  { actionNeedle: 'render_preview', operationId: 'render.preview' },
  { actionNeedle: 'compose', operationId: 'render.compose' },
  { actionNeedle: 'mux', operationId: 'export.mux' },
  { actionNeedle: 'final_export', operationId: 'export.mux' },
  { actionNeedle: 'export_inspect', operationId: 'export.validate' },
  { actionNeedle: 'mask', operationId: 'mask.generate' },
  { actionNeedle: 'refine_mask', operationId: 'mask.refine' },
  { actionNeedle: 'background', operationId: 'background.remove' },
  { actionNeedle: 'upscale', operationId: 'video.enhance' },
  { actionNeedle: 'enhance', operationId: 'video.enhance' },
  { actionNeedle: 'slow_motion', operationId: 'video.slow_motion' },
  { actionNeedle: 'interpolate', operationId: 'video.slow_motion' },
  { actionNeedle: 'color', operationId: 'color.exposure.correct' },
  { actionNeedle: 'match_shots', operationId: 'color.shot_match' },
  { actionNeedle: 'ocr', operationId: 'ocr.detect_text' },
  { actionNeedle: 'quality', operationId: 'qa.final_delivery' },
]

const artifactAliases: Record<string, readonly string[]> = {
  audio: ['extracted_audio', 'processed_audio', 'cleaned_audio'],
  extracted_audio: ['audio'],
  processed_audio: ['audio', 'cleaned_audio'],
  video: ['source_media', 'proxy_media', 'proxy_video', 'processed_video', 'preview_video', 'final_export'],
  source_media: ['video', 'audio'],
  proxy_media: ['video', 'proxy_video'],
  proxy_video: ['proxy_media', 'video'],
  processed_video: ['video', 'enhanced_video', 'interpolated_video'],
  image: ['image_asset', 'keyframe_image', 'representative_frame'],
  image_asset: ['image', 'keyframe_image', 'representative_frame'],
  caption_segments: ['caption_segments_json'],
  caption_segments_json: ['caption_segments'],
  mask: ['mask_image', 'mask_sequence'],
  mask_image: ['mask'],
  mask_sequence: ['mask'],
  timeline_manifest: ['opentimelineio_manifest', 'render_manifest'],
  opentimelineio_manifest: ['timeline_manifest'],
  render_manifest: ['timeline_manifest'],
  analysis_report: ['json_spec', 'qa_report'],
  qa_report: ['analysis_report', 'json_spec'],
}

function expandArtifact(artifactType: ToolCallingArtifactType | string): Set<string> {
  return new Set([artifactType, ...(artifactAliases[artifactType] ?? [])])
}

export function artifactsCompatible(
  requestedArtifact: ToolCallingArtifactType | string,
  availableArtifacts: readonly (ToolCallingArtifactType | string)[],
): boolean {
  const requested = expandArtifact(requestedArtifact)
  return availableArtifacts.some((artifact) => requested.has(artifact) || expandArtifact(artifact).has(requestedArtifact))
}

function inferOperationsFromProfile(profile: ProductionToolProfile): ToolCallingOperationId[] {
  const operationIds = new Set<ToolCallingOperationId>()
  const actionText = profile.supportedActions.join(' ').toLowerCase()

  for (const operation of listOperationDefinitions()) {
    const operationId = operation.operationId as ToolCallingOperationId
    if (OPERATION_TOOL_SEEDS[operationId].includes(profile.toolId)) {
      operationIds.add(operationId)
    }
  }

  for (const hint of actionOperationHints) {
    const matchesHint = profile.supportedActions.some((action) => {
      const normalizedAction = action.toLowerCase()
      if (hint.actionNeedle === 'extract_audio' || hint.actionNeedle === 'audio_extract') {
        return normalizedAction === hint.actionNeedle
      }
      return normalizedAction.includes(hint.actionNeedle)
    })

    if (matchesHint || actionText.includes(` ${hint.actionNeedle} `)) {
      operationIds.add(hint.operationId)
    }
  }

  if (profile.outputTypes.some((outputType) => outputType === 'final_export')) {
    operationIds.add('export.mux')
    operationIds.add('export.validate')
  }

  if (profile.qaResponsibilities.includes('final_delivery')) {
    operationIds.add('qa.final_delivery')
  }

  return [...operationIds].sort()
}

function buildToolCapabilityCard(profile: ProductionToolProfile): ToolCapabilityCard {
  return {
    toolId: profile.toolId,
    displayName: profile.displayName,
    operations: inferOperationsFromProfile(profile),
    bestFor: profile.bestFor,
    notFor: profile.notBestFor,
    inputArtifacts: profile.requiredArtifacts,
    outputArtifacts: profile.producedArtifacts,
    validators: profile.qaResponsibilities,
    fallbackToolIds: profile.fallbackToolIds,
    resourceProfile: {
      workerType: profile.workerType,
      gpuRequired: profile.gpuRequired,
      cpuAllowed: profile.cpuAllowed,
      executionMode: profile.executionMode,
    },
    qualityProfile: {
      productionStatus: profile.productionStatus,
      adoptionStage: profile.adoptionStage,
      launchCore: profile.launchCore,
      modelWeightsRequired: profile.modelWeightsRequired,
      licenseRisk: profile.licenseRisk,
      commercialUseStatus: profile.commercialUseStatus,
    },
    readinessNotes: profile.productionReadinessNotes,
    benchmarkPlaceholders: [
      `benchmark:${profile.toolId}:latency_pending`,
      `benchmark:${profile.toolId}:quality_pending`,
      `benchmark:${profile.toolId}:cost_pending`,
    ],
    telemetryPlaceholders: [
      `telemetry:${profile.toolId}:selection_count`,
      `telemetry:${profile.toolId}:fallback_count`,
      `telemetry:${profile.toolId}:qa_gate_outcomes`,
    ],
  }
}

export function listToolCapabilityCards(): ToolCapabilityCard[] {
  return listProductionToolProfiles().map(buildToolCapabilityCard)
}

export function getToolCapabilityCard(toolId: ProductionToolId | string): ToolCapabilityCard | undefined {
  if (!isProductionToolId(toolId)) return undefined
  const profile = getProductionToolProfile(toolId)
  return profile ? buildToolCapabilityCard(profile) : undefined
}

export function findToolsForOperation(operationId: ToolCallingOperationId | string): ToolCapabilityCard[] {
  const operation = getOperationDefinition(operationId)
  if (!operation) return []

  const resolvedOperationId = operation.operationId as ToolCallingOperationId
  const seededToolIds = new Set<ProductionToolId>(OPERATION_TOOL_SEEDS[resolvedOperationId])

  return listToolCapabilityCards()
    .filter((card) => card.operations.includes(resolvedOperationId) || seededToolIds.has(card.toolId))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export function findToolsProducingArtifact(artifactType: ToolCallingArtifactType | string): ToolCapabilityCard[] {
  return listToolCapabilityCards()
    .filter((card) => artifactsCompatible(artifactType, card.outputArtifacts))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export function findToolsConsumingArtifact(artifactType: ToolCallingArtifactType | string): ToolCapabilityCard[] {
  return listToolCapabilityCards()
    .filter((card) => artifactsCompatible(artifactType, card.inputArtifacts))
    .sort((left, right) => left.toolId.localeCompare(right.toolId))
}

export { getOperationDefinition }
export type { ToolCallingOperationDefinition }
