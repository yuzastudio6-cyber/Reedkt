import type { ID, ISODateString, JSONObject } from '../../../types/shared'
import type {
  ProviderGatewayRequest,
  ProviderGenerationType,
  ProviderOutputRequirements,
  ProviderQualityLevel,
  ProviderRoute,
} from '../../cloud/provider-gateway-contracts'
import type { GcsObjectLocation } from '../../cloud/gcs-storage-contracts'

export type ProviderGatewayExecutionMode = 'mock_only' | 'dry_run' | 'real_provider_blocked'

export type ProviderGatewayStatus =
  | 'accepted_mock'
  | 'blocked_by_policy'
  | 'blocked_missing_secret_reference'
  | 'blocked_real_provider_disabled'
  | 'failed_validation'

export type ProviderGatewayErrorCategory =
  | 'none'
  | 'policy_blocked'
  | 'validation_failed'
  | 'missing_secret_reference'
  | 'real_provider_disabled'
  | 'unsupported_route'
  | 'unknown'

export interface ProviderSecretReference {
  providerRoute: ProviderRoute
  secretName: string
  purpose: string
  neverExposeToClient: true
}

export interface ProviderGatewayUsageEstimate {
  providerRoute: ProviderRoute
  generationType: ProviderGenerationType
  qualityLevel: ProviderQualityLevel
  estimatedProviderCostCents: number
  estimatedUserCredits: number
  estimatedDurationSeconds?: number
  estimatePayload: JSONObject
}

export interface ProviderGatewayGeneratedAssetDraft {
  id: ID
  assetType: string
  displayName: string
  storageLocation?: GcsObjectLocation
  outputRequirements: ProviderOutputRequirements
  metadata: JSONObject
}

export interface ProviderGatewayNormalizedResponse {
  requestId: ID
  generationRequestId: ID
  jobId: ID
  providerRoute: ProviderRoute
  status: ProviderGatewayStatus
  executionMode: ProviderGatewayExecutionMode
  errorCategory: ProviderGatewayErrorCategory
  errorMessage?: string
  secretReferenceName?: string
  usageEstimate: ProviderGatewayUsageEstimate
  generatedAssetDraft?: ProviderGatewayGeneratedAssetDraft
  providerEventPayload: JSONObject
  createdAt: ISODateString
}

export interface ProviderGatewayClient {
  readonly providerRoute: ProviderRoute
  readonly executionMode: ProviderGatewayExecutionMode
  prepareRequest(request: ProviderGatewayRequest): ProviderGatewayNormalizedResponse
}

export interface ProviderGatewayDispatchOptions {
  executionMode?: ProviderGatewayExecutionMode
  allowRealProviderCalls?: false
}

export interface ProviderGatewayDispatchResult {
  ok: boolean
  response?: ProviderGatewayNormalizedResponse
  errors: string[]
  warnings: string[]
}

export const PROVIDER_GATEWAY_SKELETON_RULES = [
  'RP-GCP-03 is mock-only and must not call real providers.',
  'Frontend must never import provider keys or call provider APIs directly.',
  'Provider requests require approved snapshots and credit reservations before future real execution.',
  'Secret Manager reference names are allowed; raw secret values are forbidden.',
] as const
