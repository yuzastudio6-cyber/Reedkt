import type { ID, JSONObject, JSONValue } from '../../types/shared'
import {
  cloudValidationResult,
  hasNonEmptyString,
  inspectForSecretLikeValues,
} from './cloud-runtime-contracts'
import type { CloudValidationResult } from './cloud-runtime-contracts'

export type ProviderRoute =
  | 'gpt_image_2'
  | 'wan'
  | 'hailuo'
  | 'veo'
  | 'mirelo_sfx_v1_5'
  | 'mmaudio_v2'
  | 'remotion_deterministic'
  | 'svg_renderer'
  | 'lottie_renderer'
  | 'none'

export type ProviderModelTier = 'basic' | 'pro' | 'premium'

export type ProviderGenerationType =
  | 'still_image'
  | 'keyframe'
  | 'card'
  | 'ai_video_clip'
  | 'deterministic_motion'
  | 'renderer_asset'
  | 'none'

export type ProviderQualityLevel =
  | 'draft'
  | 'standard'
  | 'high'
  | 'premium'
  | '720p'
  | '768p'

export type ProviderRouteRole =
  | 'primary'
  | 'alternate'
  | 'fallback'
  | 'final_fallback'
  | 'rescue'

export interface ProviderOutputRequirements {
  resolutionLabel?: string
  width?: number
  height?: number
  durationSeconds?: number
  outputAssetType: string
  panelBackground?: string
  isDefaultResolution?: boolean
  metadata?: JSONObject
}

export interface ProviderGatewaySafetyConstraints {
  routeRole: ProviderRouteRole
  finalFallbackOnly?: boolean
  fallbackReason?: string
  matchingPanelBackgroundRequired?: boolean
  noFinalCanvasGeneration?: boolean
  promptPlanMustComeFromApprovedSnapshot?: boolean
  metadata?: JSONObject
}

export interface ProviderGatewayRequest {
  generationRequestId: ID
  jobId: ID
  workspaceId: ID
  projectId: ID
  approvedPlanSnapshotId: ID
  editPlanId: ID
  creditReservationId: ID
  providerRoute: ProviderRoute
  signatureSystem: string
  generationType: ProviderGenerationType
  qualityLevel: ProviderQualityLevel
  modelTier: ProviderModelTier
  promptPlanId?: ID
  inputAssetIds: ID[]
  outputRequirements: ProviderOutputRequirements
  safetyConstraints: ProviderGatewaySafetyConstraints
  idempotencyKey: string
  metadata?: JSONObject
}

export const PROVIDER_GATEWAY_POLICY: string[] = [
  'Basic cannot use Veo.',
  'Pro cannot use Veo.',
  'Premium may use Veo only as final fallback/rescue.',
  'Veo is never primary/default.',
  'Generated video routes must not default to 1080p.',
  'Wan is primary animation route.',
  'Hailuo is normal fallback/alternate.',
  'GPT-Image-2 is still/keyframe/card route.',
  'Remotion/SVG/Lottie are deterministic/compositor routes.',
]

function routeIsAiVideo(route: ProviderRoute): boolean {
  return route === 'wan' || route === 'hailuo' || route === 'veo'
}

function generationIsVideo(generationType: ProviderGenerationType): boolean {
  return generationType === 'ai_video_clip'
}

function outputDefaultsTo1080p(outputRequirements: ProviderOutputRequirements): boolean {
  const resolution = outputRequirements.resolutionLabel?.toLowerCase()
  const dimensionsAre1080Class = outputRequirements.width === 1920 || outputRequirements.height === 1080

  return outputRequirements.isDefaultResolution === true &&
    (resolution === '1080p' || dimensionsAre1080Class)
}

function jsonValueIsTrue(value: JSONValue | undefined): boolean {
  return value === true
}

export function validateProviderGatewayRequest(request: ProviderGatewayRequest): CloudValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!hasNonEmptyString(request.generationRequestId)) {
    errors.push('Provider gateway request must include generationRequestId.')
  }

  if (!hasNonEmptyString(request.jobId)) {
    errors.push('Provider gateway request must include jobId.')
  }

  if (!hasNonEmptyString(request.approvedPlanSnapshotId)) {
    errors.push('Provider gateway request must include approvedPlanSnapshotId.')
  }

  if (!hasNonEmptyString(request.creditReservationId)) {
    errors.push('Provider gateway request must include creditReservationId.')
  }

  if (!hasNonEmptyString(request.idempotencyKey)) {
    errors.push('Provider gateway request must include idempotencyKey.')
  }

  if ((request.modelTier === 'basic' || request.modelTier === 'pro') && request.providerRoute === 'veo') {
    errors.push('Basic and Pro requests must never route to Veo.')
  }

  if (request.providerRoute === 'veo') {
    const routeRole = request.safetyConstraints.routeRole
    const routeAllowed = request.modelTier === 'premium' &&
      request.safetyConstraints.finalFallbackOnly === true &&
      (routeRole === 'final_fallback' || routeRole === 'rescue')

    if (!routeAllowed) {
      errors.push('Veo is allowed only for Premium final fallback/rescue requests.')
    }
  }

  if (request.providerRoute === 'veo' && request.safetyConstraints.routeRole === 'primary') {
    errors.push('Veo must never be primary/default.')
  }

  if (routeIsAiVideo(request.providerRoute) && generationIsVideo(request.generationType) && outputDefaultsTo1080p(request.outputRequirements)) {
    errors.push('Generated AI video routes must not default to 1080p.')
  }

  if (request.providerRoute === 'gpt_image_2' && request.generationType === 'ai_video_clip') {
    errors.push('GPT-Image-2 is for stills, keyframes, cards, and frames, not AI video clips.')
  }

  if ((request.providerRoute === 'remotion_deterministic' || request.providerRoute === 'svg_renderer' || request.providerRoute === 'lottie_renderer') && generationIsVideo(request.generationType)) {
    warnings.push('Deterministic routes should produce renderer assets or motion specs, not provider AI video clips.')
  }

  if (routeIsAiVideo(request.providerRoute) && request.safetyConstraints.matchingPanelBackgroundRequired !== true) {
    warnings.push('AI video requests should require matching white/near-white/custom panel backgrounds.')
  }

  if (jsonValueIsTrue(request.metadata?.isDefaultRoute) && request.providerRoute === 'veo') {
    errors.push('Veo must not be marked as a default provider route.')
  }

  const secretResult = inspectForSecretLikeValues(request)
  errors.push(...secretResult.errors)
  warnings.push(...secretResult.warnings)

  return cloudValidationResult(errors, warnings)
}
