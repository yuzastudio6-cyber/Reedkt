import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_CONTAINER_PACKAGING_VALIDATION_PROTOCOL = 'offline-container-packaging-validation-execution-v1' as const
export const OFFLINE_CONTAINER_PACKAGING_VALIDATION_CONTAINER_PROTOCOL = 'offline-container-packaging-validation-execution-container-v1' as const
export const OFFLINE_CONTAINER_PACKAGING_VALIDATION_TOOL_IDS = ['mkvtoolnix_container_validation', 'gpac_mp4box_packaging_validation'] as const
export type OfflineContainerPackagingValidationToolId = (typeof OFFLINE_CONTAINER_PACKAGING_VALIDATION_TOOL_IDS)[number]
export const OFFLINE_CONTAINER_PACKAGING_VALIDATION_OPERATIONS = Object.freeze({
  mkvtoolnix_container_validation: 'tool.mkvtoolnix_container_validation.validate_mkv_container.v1',
  gpac_mp4box_packaging_validation: 'tool.gpac_mp4box_packaging_validation.validate_mp4_package.v1',
} as const)
export const OFFLINE_CONTAINER_PACKAGING_VALIDATION_PACKAGE_IDENTITIES = Object.freeze({
  mkvtoolnix_container_validation: { packageName: 'mkvtoolnix', version: '74.0.0-1' },
  gpac_mp4box_packaging_validation: { packageName: 'gpac', version: '26.02.0' },
} as const)

export type OfflineContainerPackagingValidationRequest =
  | { schemaVersion: typeof OFFLINE_CONTAINER_PACKAGING_VALIDATION_PROTOCOL; toolId: 'mkvtoolnix_container_validation'; operationId: typeof OFFLINE_CONTAINER_PACKAGING_VALIDATION_OPERATIONS.mkvtoolnix_container_validation; payload: { validationProfileId: 'approved_private_packaging_validation_v1'; expectedContainer: 'mkv'; requireAudioVideoSync: true; requireCaptionIntegrity: true } }
  | { schemaVersion: typeof OFFLINE_CONTAINER_PACKAGING_VALIDATION_PROTOCOL; toolId: 'gpac_mp4box_packaging_validation'; operationId: typeof OFFLINE_CONTAINER_PACKAGING_VALIDATION_OPERATIONS.gpac_mp4box_packaging_validation; payload: { validationProfileId: 'approved_private_packaging_validation_v1'; expectedContainer: 'mp4'; requireAudioVideoSync: true; requireCaptionIntegrity: true } }

export function validateOfflineContainerPackagingValidationRequest(value: unknown): OfflineContainerPackagingValidationRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_CONTAINER_PACKAGING_VALIDATION_PROTOCOL || !isToolId(request.toolId) || request.operationId !== OFFLINE_CONTAINER_PACKAGING_VALIDATION_OPERATIONS[request.toolId]) throw invalid('Container packaging validation request identity is unsupported.')
  const payload = exact(request.payload, ['validationProfileId', 'expectedContainer', 'requireAudioVideoSync', 'requireCaptionIntegrity'], 'packaging validation payload')
  const expectedContainer = request.toolId === 'mkvtoolnix_container_validation' ? 'mkv' : 'mp4'
  if (payload.validationProfileId !== 'approved_private_packaging_validation_v1' || payload.expectedContainer !== expectedContainer || payload.requireAudioVideoSync !== true || payload.requireCaptionIntegrity !== true) throw invalid('Container packaging validation policy is unsupported.')
  return { schemaVersion: OFFLINE_CONTAINER_PACKAGING_VALIDATION_PROTOCOL, toolId: request.toolId, operationId: OFFLINE_CONTAINER_PACKAGING_VALIDATION_OPERATIONS[request.toolId], payload: { validationProfileId: 'approved_private_packaging_validation_v1', expectedContainer, requireAudioVideoSync: true, requireCaptionIntegrity: true } } as OfflineContainerPackagingValidationRequest
}

export function buildOfflineContainerPackagingValidationApprovedRequest(input: { toolId: OfflineContainerPackagingValidationToolId; operationId: string; planningPayload: unknown }): OfflineContainerPackagingValidationRequest { return validateOfflineContainerPackagingValidationRequest({ schemaVersion: OFFLINE_CONTAINER_PACKAGING_VALIDATION_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload }) }
export function offlineContainerPackagingValidationRequestSha256(request: OfflineContainerPackagingValidationRequest): string { return createHash('sha256').update(JSON.stringify(request)).digest('hex') }
function isToolId(value: unknown): value is OfflineContainerPackagingValidationToolId { return (OFFLINE_CONTAINER_PACKAGING_VALIDATION_TOOL_IDS as readonly unknown[]).includes(value) }
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`); const record = value as Record<string, unknown>; if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`); return record }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
