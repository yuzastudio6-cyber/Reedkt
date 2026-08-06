import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_AUDIOFLUX_ANALYSIS_PROTOCOL = 'offline-audioflux-analysis-execution-v1' as const
export const OFFLINE_AUDIOFLUX_ANALYSIS_CONTAINER_PROTOCOL = 'offline-audioflux-analysis-execution-container-v1' as const
export const OFFLINE_AUDIOFLUX_ANALYSIS_TOOL_IDS = ['audioflux'] as const
export type OfflineAudioFluxAnalysisToolId = (typeof OFFLINE_AUDIOFLUX_ANALYSIS_TOOL_IDS)[number]
export const OFFLINE_AUDIOFLUX_ANALYSIS_OPERATIONS = Object.freeze({ audioflux: 'tool.audioflux.analyze_beat_and_energy.v1' } as const)
export const OFFLINE_AUDIOFLUX_ANALYSIS_PACKAGE_IDENTITIES = Object.freeze({
  audioflux: { packageName: 'audioflux', version: '0.1.9', sourceSha256: '538c2b5ff718c88b8c457b10f4b8fc03796680e43daf4afc2e95d717d01d281b', nativeArchitecture: 'linux_arm64_source_build' },
} as const)

export type OfflineAudioFluxAnalysisRequest = {
  schemaVersion: typeof OFFLINE_AUDIOFLUX_ANALYSIS_PROTOCOL
  toolId: 'audioflux'
  operationId: typeof OFFLINE_AUDIOFLUX_ANALYSIS_OPERATIONS.audioflux
  payload: { sampleRate: 16000; channelMode: 'mono'; analysisProfileId: 'approved_server_owned_beat_energy_fixture_v1'; confidenceThreshold: 0.75 }
}

export function validateOfflineAudioFluxAnalysisRequest(value: unknown): OfflineAudioFluxAnalysisRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_AUDIOFLUX_ANALYSIS_PROTOCOL || request.toolId !== 'audioflux' || request.operationId !== OFFLINE_AUDIOFLUX_ANALYSIS_OPERATIONS.audioflux) throw invalid('AudioFlux analysis request identity is unsupported.')
  const payload = exact(request.payload, ['sampleRate', 'channelMode', 'analysisProfileId', 'confidenceThreshold'], 'analysis payload')
  if (payload.sampleRate !== 16_000 || payload.channelMode !== 'mono' || payload.analysisProfileId !== 'approved_server_owned_beat_energy_fixture_v1' || payload.confidenceThreshold !== 0.75) throw invalid('AudioFlux analysis policy is unsupported.')
  return { schemaVersion: OFFLINE_AUDIOFLUX_ANALYSIS_PROTOCOL, toolId: 'audioflux', operationId: OFFLINE_AUDIOFLUX_ANALYSIS_OPERATIONS.audioflux, payload: { sampleRate: 16_000, channelMode: 'mono', analysisProfileId: 'approved_server_owned_beat_energy_fixture_v1', confidenceThreshold: 0.75 } }
}
export function buildOfflineAudioFluxAnalysisApprovedRequest(input: { toolId: OfflineAudioFluxAnalysisToolId; operationId: string; planningPayload: unknown }): OfflineAudioFluxAnalysisRequest { return validateOfflineAudioFluxAnalysisRequest({ schemaVersion: OFFLINE_AUDIOFLUX_ANALYSIS_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload }) }
export function offlineAudioFluxAnalysisRequestSha256(request: OfflineAudioFluxAnalysisRequest): string { return createHash('sha256').update(JSON.stringify(request)).digest('hex') }
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`); const record = value as Record<string, unknown>; if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`); return record }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
