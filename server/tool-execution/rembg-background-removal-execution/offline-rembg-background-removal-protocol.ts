import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_REMBG_BACKGROUND_REMOVAL_PROTOCOL = 'offline-rembg-background-removal-execution-v1' as const
export const OFFLINE_REMBG_BACKGROUND_REMOVAL_CONTAINER_PROTOCOL = 'offline-rembg-background-removal-execution-container-v1' as const
export const OFFLINE_REMBG_BACKGROUND_REMOVAL_TOOL_IDS = ['rembg'] as const
export type OfflineRembgBackgroundRemovalToolId = (typeof OFFLINE_REMBG_BACKGROUND_REMOVAL_TOOL_IDS)[number]
export const OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS = Object.freeze({ rembg: 'tool.rembg.remove_image_background.v1' } as const)
export const OFFLINE_REMBG_BACKGROUND_REMOVAL_PACKAGE_IDENTITIES = Object.freeze({
  rembg: { packageName: 'rembg', version: '2.0.76', onnxRuntimeVersion: '1.27.0' },
} as const)
export const OFFLINE_REMBG_BACKGROUND_REMOVAL_MODEL_IDENTITY = Object.freeze({ modelId: 'u2netp', sha256: '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8', byteLength: 4_574_861, upstreamLicense: 'Apache-2.0', productionLicenseReviewRequired: true } as const)

export type OfflineRembgBackgroundRemovalRequest = {
  schemaVersion: typeof OFFLINE_REMBG_BACKGROUND_REMOVAL_PROTOCOL
  toolId: 'rembg'
  operationId: typeof OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS.rembg
  payload: { confidenceThreshold: 0.5; alphaMatteMode: 'straight'; edgeRefinementProfileId: 'approved_u2netp_default_v1'; maximumSubjects: 1 }
}

export function validateOfflineRembgBackgroundRemovalRequest(value: unknown): OfflineRembgBackgroundRemovalRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_REMBG_BACKGROUND_REMOVAL_PROTOCOL || request.toolId !== 'rembg' || request.operationId !== OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS.rembg) throw invalid('rembg background removal request identity is unsupported.')
  const payload = exact(request.payload, ['confidenceThreshold', 'alphaMatteMode', 'edgeRefinementProfileId', 'maximumSubjects'], 'background-removal payload')
  if (payload.confidenceThreshold !== 0.5 || payload.alphaMatteMode !== 'straight' || payload.edgeRefinementProfileId !== 'approved_u2netp_default_v1' || payload.maximumSubjects !== 1) throw invalid('rembg background removal policy is unsupported.')
  return { schemaVersion: OFFLINE_REMBG_BACKGROUND_REMOVAL_PROTOCOL, toolId: 'rembg', operationId: OFFLINE_REMBG_BACKGROUND_REMOVAL_OPERATIONS.rembg, payload: { confidenceThreshold: 0.5, alphaMatteMode: 'straight', edgeRefinementProfileId: 'approved_u2netp_default_v1', maximumSubjects: 1 } }
}
export function buildOfflineRembgBackgroundRemovalApprovedRequest(input: { toolId: OfflineRembgBackgroundRemovalToolId; operationId: string; planningPayload: unknown }): OfflineRembgBackgroundRemovalRequest { return validateOfflineRembgBackgroundRemovalRequest({ schemaVersion: OFFLINE_REMBG_BACKGROUND_REMOVAL_PROTOCOL, toolId: input.toolId, operationId: input.operationId, payload: input.planningPayload }) }
export function offlineRembgBackgroundRemovalRequestSha256(request: OfflineRembgBackgroundRemovalRequest): string { return createHash('sha256').update(JSON.stringify(request)).digest('hex') }
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`); const record = value as Record<string, unknown>; if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`); return record }
function invalid(message: string) { return new ApiError('VALIDATION_FAILED', message, 400) }
