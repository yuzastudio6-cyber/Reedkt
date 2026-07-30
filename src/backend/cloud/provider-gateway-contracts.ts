import type { ID, JSONObject, JSONValue } from '../../types/shared'
import type { ReEditProModelRoleId, ReEditProRequestedModelUse } from '../../types/model-role-routing'
import {
  getReEditProModelRoleContract,
  validateReEditProModelRoleUse,
} from '../../lib/model-role-routing-contract'
import {
  cloudValidationResult,
  hasNonEmptyString,
  inspectForSecretLikeValues,
} from './cloud-runtime-contracts'
import type { CloudValidationResult } from './cloud-runtime-contracts'

export const PROVIDER_ROUTES = [
  'gpt_image_2',
  'wan',
  'hailuo',
  'veo',
  'kimi_k3_provider_boundary',
  'gpt_5_6_terra_provider_boundary',
  'qwen_3_7_provider_boundary',
  'qwen2_5_vl_7b_instruct_provider_boundary',
  'deepseek_v4_pro_tool_code_boundary',
  'mirelo_sfx_v1_5',
  'mmaudio_v2',
  'remotion_deterministic',
  'svg_renderer',
  'lottie_renderer',
  'none',
] as const

export type ProviderRoute = (typeof PROVIDER_ROUTES)[number]

export const MODEL_ROLE_PROVIDER_ROUTES = [
  'kimi_k3_provider_boundary',
  'gpt_5_6_terra_provider_boundary',
  'qwen_3_7_provider_boundary',
  'qwen2_5_vl_7b_instruct_provider_boundary',
  'deepseek_v4_pro_tool_code_boundary',
] as const satisfies readonly ProviderRoute[]

export const GENERATED_ASSET_PROVIDER_ROUTES = [
  'gpt_image_2',
  'wan',
  'hailuo',
  'veo',
  'mirelo_sfx_v1_5',
  'mmaudio_v2',
  'remotion_deterministic',
  'svg_renderer',
  'lottie_renderer',
] as const satisfies readonly ProviderRoute[]

export const AI_VIDEO_PROVIDER_ROUTES = [
  'wan',
  'hailuo',
  'veo',
] as const satisfies readonly ProviderRoute[]

export const AUDIO_PROVIDER_ROUTES = [
  'mirelo_sfx_v1_5',
  'mmaudio_v2',
] as const satisfies readonly ProviderRoute[]

export type ProviderModelTier = 'basic' | 'pro' | 'premium'

export type ProviderGenerationType =
  | 'still_image'
  | 'keyframe'
  | 'card'
  | 'ai_video_clip'
  | 'sfx_asset'
  | 'music_asset'
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
  providerModel?: string
  modelRoleId?: ReEditProModelRoleId
  requestedModelUse?: ReEditProRequestedModelUse
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
  'Kimi K3 is the primary edit reasoning, planning, creativity, and coding route.',
  'GPT-5.6 Terra is the first full-capability edit reasoning fallback.',
  'Qwen 3.7 is a bounded Marker Chat and Edit Reference specialist, not a head-reasoning fallback.',
  'Qwen2.5-VL is visual-understanding only.',
  'DeepSeek V4 Pro is the final bounded edit reasoning/coding fallback.',
  'Mirelo SFX V1.5 and MMAudio V2 are generated audio/SFX routes.',
  'Remotion/SVG/Lottie are deterministic/compositor routes.',
]

function routeIsAiVideo(route: ProviderRoute): boolean {
  return providerRouteIncluded(AI_VIDEO_PROVIDER_ROUTES, route)
}

function generationIsVideo(generationType: ProviderGenerationType): boolean {
  return generationType === 'ai_video_clip'
}

function generationIsAudio(generationType: ProviderGenerationType): boolean {
  return generationType === 'sfx_asset' || generationType === 'music_asset'
}

function outputIsAudio(outputRequirements: ProviderOutputRequirements): boolean {
  const outputAssetType = outputRequirements.outputAssetType.toLowerCase()
  return outputAssetType.includes('audio') || outputAssetType.includes('sfx') || outputAssetType.includes('music')
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

export function isModelRoleProviderRoute(route: ProviderRoute): boolean {
  return providerRouteIncluded(MODEL_ROLE_PROVIDER_ROUTES, route)
}

export function isGeneratedAssetProviderRoute(route: ProviderRoute): boolean {
  return providerRouteIncluded(GENERATED_ASSET_PROVIDER_ROUTES, route)
}

export function isAiVideoProviderRoute(route: ProviderRoute): boolean {
  return providerRouteIncluded(AI_VIDEO_PROVIDER_ROUTES, route)
}

export function isAudioProviderRoute(route: ProviderRoute): boolean {
  return providerRouteIncluded(AUDIO_PROVIDER_ROUTES, route)
}

function providerRouteIncluded(
  routes: readonly ProviderRoute[],
  route: ProviderRoute,
): boolean {
  return routes.includes(route)
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

  const modelRoleValidation = validateReEditProModelRoleUse({
    modelRoleId: request.modelRoleId,
    providerRoute: request.providerRoute,
    providerModel: request.providerModel,
    requestedUse: request.requestedModelUse,
  })
  errors.push(...modelRoleValidation.errors)
  warnings.push(...modelRoleValidation.warnings)

  if (modelRoleValidation.resolvedModelRoleId) {
    const role = getReEditProModelRoleContract(modelRoleValidation.resolvedModelRoleId)
    if (role.reasoningRouteRole === 'primary' && request.safetyConstraints.routeRole !== 'primary') {
      errors.push(`${role.displayName} must be invoked as the primary reasoning route.`)
    }
    if (role.fallbackOnly && request.safetyConstraints.routeRole !== 'fallback') {
      errors.push(`${role.displayName} is fallback-only and requires explicit fallback route authority.`)
    }
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

  if (isAudioProviderRoute(request.providerRoute) && !generationIsAudio(request.generationType)) {
    errors.push('Mirelo SFX V1.5 and MMAudio V2 must use generated audio/SFX generation types.')
  }

  if (generationIsAudio(request.generationType) && !isAudioProviderRoute(request.providerRoute)) {
    errors.push('Generated audio/SFX generation types must use an audio provider route.')
  }

  if (isAudioProviderRoute(request.providerRoute) && !outputIsAudio(request.outputRequirements)) {
    errors.push('Generated audio/SFX provider routes must request an audio output asset type.')
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
