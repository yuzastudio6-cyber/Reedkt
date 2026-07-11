import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PROTOCOL = 'offline-vapoursynth-frame-pipeline-execution-v1' as const
export const OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_CONTAINER_PROTOCOL = 'offline-vapoursynth-frame-pipeline-execution-container-v1' as const
export const OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_TOOL_IDS = ['vapoursynth'] as const
export type OfflineVapourSynthFramePipelineToolId = (typeof OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_TOOL_IDS)[number]
export const OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_OPERATIONS = Object.freeze({
  vapoursynth: 'tool.vapoursynth.process_approved_frame_pipeline.v1',
} as const)
export const OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PACKAGE_IDENTITIES = Object.freeze({
  vapoursynth: { packageName: 'vapoursynth', version: '77' },
} as const)

export type OfflineVapourSynthFramePipelineRequest = { schemaVersion: typeof OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PROTOCOL; toolId: 'vapoursynth'; operationId: typeof OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_OPERATIONS.vapoursynth; payload: { pipelineProfileId: 'approved_frame_preprocess_v1'; pluginPackProfileId: 'reviewed_builtin_plugins_v1'; frameRate: 24; callerScriptAllowed: false } }

export function validateOfflineVapourSynthFramePipelineRequest(value: unknown): OfflineVapourSynthFramePipelineRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PROTOCOL || !isToolId(request.toolId) || request.operationId !== OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_OPERATIONS[request.toolId]) throw invalid('VapourSynth frame pipeline request identity is unsupported.')
  const payload = exact(request.payload, ['pipelineProfileId', 'pluginPackProfileId', 'frameRate', 'callerScriptAllowed'], 'frame pipeline payload')
  if (payload.pipelineProfileId !== 'approved_frame_preprocess_v1' || payload.pluginPackProfileId !== 'reviewed_builtin_plugins_v1' || payload.frameRate !== 24 || payload.callerScriptAllowed !== false) throw invalid('VapourSynth frame pipeline policy is unsupported.')
  return { schemaVersion: OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PROTOCOL, toolId: 'vapoursynth', operationId: OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_OPERATIONS.vapoursynth, payload: { pipelineProfileId: 'approved_frame_preprocess_v1', pluginPackProfileId: 'reviewed_builtin_plugins_v1', frameRate: 24, callerScriptAllowed: false } }
}

export function buildOfflineVapourSynthFramePipelineApprovedRequest(input: { toolId: OfflineVapourSynthFramePipelineToolId; operationId: string; planningPayload: unknown }): OfflineVapourSynthFramePipelineRequest { return validateOfflineVapourSynthFramePipelineRequest({ schemaVersion: OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload }) }
export function offlineVapourSynthFramePipelineRequestSha256(request: OfflineVapourSynthFramePipelineRequest): string { return createHash('sha256').update(JSON.stringify(request)).digest('hex') }
function isToolId(value: unknown): value is OfflineVapourSynthFramePipelineToolId { return (OFFLINE_VAPOURSYNTH_FRAME_PIPELINE_TOOL_IDS as readonly unknown[]).includes(value) }
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`); const record = value as Record<string, unknown>; if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`); return record }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
