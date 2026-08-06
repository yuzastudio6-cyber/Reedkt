import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL = 'offline-native-image-pipeline-execution-v1' as const
export const OFFLINE_NATIVE_IMAGE_PIPELINE_CONTAINER_PROTOCOL = 'offline-native-image-pipeline-execution-container-v1' as const
export const OFFLINE_NATIVE_IMAGE_PIPELINE_TOOL_IDS = ['opencolorio', 'openimageio', 'streamer_render_pipeline_support'] as const
export type OfflineNativeImagePipelineToolId = (typeof OFFLINE_NATIVE_IMAGE_PIPELINE_TOOL_IDS)[number]
export const OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS = Object.freeze({
  opencolorio: 'tool.opencolorio.apply_color_transform.v1',
  openimageio: 'tool.openimageio.process_image_sequence.v1',
  streamer_render_pipeline_support: 'tool.streamer_render_pipeline_support.verify_render_pipeline_support.v1',
} as const)
export const OFFLINE_NATIVE_IMAGE_PIPELINE_PACKAGE_IDENTITIES = Object.freeze({
  opencolorio: { packageName: 'opencolorio-tools', version: '2.1.2+dfsg1-4+b3' },
  openimageio: { packageName: 'openimageio-tools', version: '2.4.7.1+dfsg-2' },
  streamer_render_pipeline_support: { packageName: 'gstreamer1.0-tools+plugins-base', version: '1.22.0-2+deb12u1+1.22.0-3+deb12u6' },
} as const)

export type OfflineNativeImagePipelineRequest =
  | { schemaVersion: typeof OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL; toolId: 'opencolorio'; operationId: typeof OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS.opencolorio; payload: { transformProfileId: 'approved_srgb_to_rec709_v1'; inputColorSpace: 'srgb'; outputColorSpace: 'rec709'; strength: 1; preserveSkinTone: true; fixtureProfileId: 'approved_color_chart_v1' } }
  | { schemaVersion: typeof OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL; toolId: 'openimageio'; operationId: typeof OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS.openimageio; payload: { transformProfileId: 'approved_sequence_resize_v1'; outputFormat: 'png'; outputWidth: 64; outputHeight: 64; preserveMetadata: false; fixtureProfileId: 'approved_two_frame_sequence_v1' } }
  | { schemaVersion: typeof OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL; toolId: 'streamer_render_pipeline_support'; operationId: typeof OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS.streamer_render_pipeline_support; payload: { probeProfileId: 'approved_av_pipeline_probe_v1'; requireVideoPipeline: true; requireAudioPipeline: true } }

export function validateOfflineNativeImagePipelineRequest(value: unknown): OfflineNativeImagePipelineRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL || !isToolId(request.toolId) || request.operationId !== OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS[request.toolId]) throw invalid('Native image pipeline request identity is unsupported.')
  if (request.toolId === 'opencolorio') {
    const payload = exact(request.payload, ['transformProfileId', 'inputColorSpace', 'outputColorSpace', 'strength', 'preserveSkinTone', 'fixtureProfileId'], 'OpenColorIO payload')
    if (payload.transformProfileId !== 'approved_srgb_to_rec709_v1' || payload.inputColorSpace !== 'srgb' || payload.outputColorSpace !== 'rec709' || payload.strength !== 1 || payload.preserveSkinTone !== true || payload.fixtureProfileId !== 'approved_color_chart_v1') throw invalid('OpenColorIO policy is unsupported.')
    return { schemaVersion: OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL, toolId: 'opencolorio', operationId: OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS.opencolorio, payload: { transformProfileId: 'approved_srgb_to_rec709_v1', inputColorSpace: 'srgb', outputColorSpace: 'rec709', strength: 1, preserveSkinTone: true, fixtureProfileId: 'approved_color_chart_v1' } }
  }
  if (request.toolId === 'openimageio') {
    const payload = exact(request.payload, ['transformProfileId', 'outputFormat', 'outputWidth', 'outputHeight', 'preserveMetadata', 'fixtureProfileId'], 'OpenImageIO payload')
    if (payload.transformProfileId !== 'approved_sequence_resize_v1' || payload.outputFormat !== 'png' || payload.outputWidth !== 64 || payload.outputHeight !== 64 || payload.preserveMetadata !== false || payload.fixtureProfileId !== 'approved_two_frame_sequence_v1') throw invalid('OpenImageIO policy is unsupported.')
    return { schemaVersion: OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL, toolId: 'openimageio', operationId: OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS.openimageio, payload: { transformProfileId: 'approved_sequence_resize_v1', outputFormat: 'png', outputWidth: 64, outputHeight: 64, preserveMetadata: false, fixtureProfileId: 'approved_two_frame_sequence_v1' } }
  }
  const payload = exact(request.payload, ['probeProfileId', 'requireVideoPipeline', 'requireAudioPipeline'], 'GStreamer payload')
  if (payload.probeProfileId !== 'approved_av_pipeline_probe_v1' || payload.requireVideoPipeline !== true || payload.requireAudioPipeline !== true) throw invalid('GStreamer pipeline policy is unsupported.')
  return { schemaVersion: OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL, toolId: 'streamer_render_pipeline_support', operationId: OFFLINE_NATIVE_IMAGE_PIPELINE_OPERATIONS.streamer_render_pipeline_support, payload: { probeProfileId: 'approved_av_pipeline_probe_v1', requireVideoPipeline: true, requireAudioPipeline: true } }
}

export function buildOfflineNativeImagePipelineApprovedRequest(input: { toolId: OfflineNativeImagePipelineToolId; operationId: string; planningPayload: unknown }): OfflineNativeImagePipelineRequest {
  return validateOfflineNativeImagePipelineRequest({ schemaVersion: OFFLINE_NATIVE_IMAGE_PIPELINE_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload })
}
export function offlineNativeImagePipelineRequestSha256(request: OfflineNativeImagePipelineRequest): string { return createHash('sha256').update(JSON.stringify(request)).digest('hex') }
function isToolId(value: unknown): value is OfflineNativeImagePipelineToolId { return (OFFLINE_NATIVE_IMAGE_PIPELINE_TOOL_IDS as readonly unknown[]).includes(value) }
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`); const record = value as Record<string, unknown>; if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`); return record }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
