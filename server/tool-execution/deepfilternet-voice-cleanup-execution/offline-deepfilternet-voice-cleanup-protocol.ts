import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PROTOCOL = 'offline-deepfilternet-voice-cleanup-execution-v1' as const
export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_CONTAINER_PROTOCOL = 'offline-deepfilternet-voice-cleanup-execution-container-v1' as const
export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS = ['deepfilternet'] as const
export type OfflineDeepFilterNetVoiceCleanupToolId = (typeof OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_TOOL_IDS)[number]
export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS = Object.freeze({ deepfilternet: 'tool.deepfilternet.enhance_voice.v1' } as const)
export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PACKAGE_IDENTITY = Object.freeze({
  packageName: 'DeepFilterNet',
  version: '0.5.6',
  nativePackageName: 'DeepFilterLib',
  nativePackageVersion: '0.5.6',
  torchVersion: '2.2.2',
  torchaudioVersion: '2.2.2',
} as const)
export const OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_MODEL_IDENTITY = Object.freeze({
  modelId: 'DeepFilterNet3',
  archiveSha256: '49c52edc8947ae1f9bf50d81530beaf3a2c3245aeaf34b6f31ff535cd22284d2',
  archiveByteLength: 7_986_207,
  checkpointSha256: '23b92884f63ccf54bb026014604625ab231657b6480df65db4095c4c171e6003',
  configSha256: '415eb925d44990d938fb739f514aa3662c1ec0ea836cff044fa1291b82cb4290',
  fixtureSha256: 'db1c85abd221a559fd18d59e77f960d6efd3306c51e8c4bd4e423a66b1bda8ec',
  upstreamLicense: 'MIT',
  productionLicenseReviewRequired: true,
} as const)

export type OfflineDeepFilterNetVoiceCleanupRequest = {
  schemaVersion: typeof OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PROTOCOL
  toolId: 'deepfilternet'
  operationId: typeof OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS.deepfilternet
  payload: {
    attenuationLimitDb: 12
    cleanupProfileId: 'approved_gentle_voice_cleanup_v1'
    preserveNaturalVoice: true
    postFilterEnabled: false
  }
}

export function validateOfflineDeepFilterNetVoiceCleanupRequest(value: unknown): OfflineDeepFilterNetVoiceCleanupRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PROTOCOL || request.toolId !== 'deepfilternet' || request.operationId !== OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS.deepfilternet) throw invalid('DeepFilterNet voice-cleanup request identity is unsupported.')
  const payload = exact(request.payload, ['attenuationLimitDb', 'cleanupProfileId', 'preserveNaturalVoice', 'postFilterEnabled'], 'voice-cleanup payload')
  if (payload.attenuationLimitDb !== 12 || payload.cleanupProfileId !== 'approved_gentle_voice_cleanup_v1' || payload.preserveNaturalVoice !== true || payload.postFilterEnabled !== false) throw invalid('DeepFilterNet voice-cleanup policy is unsupported.')
  return {
    schemaVersion: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PROTOCOL,
    toolId: 'deepfilternet',
    operationId: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_OPERATIONS.deepfilternet,
    payload: { attenuationLimitDb: 12, cleanupProfileId: 'approved_gentle_voice_cleanup_v1', preserveNaturalVoice: true, postFilterEnabled: false },
  }
}

export function buildOfflineDeepFilterNetVoiceCleanupApprovedRequest(input: { toolId: OfflineDeepFilterNetVoiceCleanupToolId; operationId: string; planningPayload: unknown }): OfflineDeepFilterNetVoiceCleanupRequest {
  return validateOfflineDeepFilterNetVoiceCleanupRequest({ schemaVersion: OFFLINE_DEEPFILTERNET_VOICE_CLEANUP_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload })
}

export function offlineDeepFilterNetVoiceCleanupRequestSha256(request: OfflineDeepFilterNetVoiceCleanupRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex')
}

function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`)
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`)
  return record
}

function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
