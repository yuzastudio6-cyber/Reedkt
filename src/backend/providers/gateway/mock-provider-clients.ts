import type { ID, JSONObject } from '../../../types/shared'
import type { ReEditProModelRoleId } from '../../../types/model-role-routing'
import { resolveReEditProModelRoleContract, validateReEditProModelRoleUse } from '../../../lib/model-role-routing-contract'
import {
  isAudioProviderRoute,
  isGeneratedAssetProviderRoute,
  type ProviderGatewayRequest,
  type ProviderRoute,
} from '../../cloud/provider-gateway-contracts'
import { getReeditProBucketName } from '../../cloud/live-gcp-resource-map'
import { getProviderSecretReference } from './provider-secret-boundary'
import type {
  ProviderGatewayClient,
  ProviderGatewayExecutionMode,
  ProviderGatewayGeneratedAssetDraft,
  ProviderGatewayNormalizedResponse,
  ProviderGatewayUsageEstimate,
} from './provider-gateway-types'

function nowIso(): string {
  return new Date().toISOString()
}

function createMockId(prefix: string, seed: string): ID {
  const sanitizedSeed = seed.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48)
  return `${prefix}_${sanitizedSeed}`
}

function estimateCreditsForRoute(providerRoute: ProviderRoute): number {
  switch (providerRoute) {
    case 'gpt_image_2':
      return 8
    case 'wan':
      return 28
    case 'hailuo':
      return 24
    case 'veo':
      return 60
    case 'mirelo_sfx_v1_5':
      return 10
    case 'mmaudio_v2':
      return 8
    case 'remotion_deterministic':
    case 'svg_renderer':
    case 'lottie_renderer':
      return 6
    default:
      return 0
  }
}

function estimateCostCentsForRoute(providerRoute: ProviderRoute): number {
  switch (providerRoute) {
    case 'gpt_image_2':
      return 20
    case 'wan':
      return 120
    case 'hailuo':
      return 100
    case 'veo':
      return 400
    case 'mirelo_sfx_v1_5':
      return 35
    case 'mmaudio_v2':
      return 25
    case 'remotion_deterministic':
    case 'svg_renderer':
    case 'lottie_renderer':
      return 5
    default:
      return 0
  }
}

function outputAssetType(providerRoute: ProviderRoute): string {
  switch (providerRoute) {
    case 'gpt_image_2':
      return 'generated_image_or_keyframe'
    case 'wan':
    case 'hailuo':
    case 'veo':
      return 'generated_ai_video_clip'
    case 'mirelo_sfx_v1_5':
      return 'generated_sfx_audio'
    case 'mmaudio_v2':
      return 'generated_audio'
    case 'remotion_deterministic':
      return 'remotion_renderer_asset'
    case 'svg_renderer':
      return 'svg_overlay_asset'
    case 'lottie_renderer':
      return 'lottie_overlay_asset'
    case 'kimi_k3_provider_boundary':
      return 'edit_planning_result'
    case 'gpt_5_6_terra_provider_boundary':
      return 'edit_planning_fallback_result'
    case 'qwen_3_7_provider_boundary':
      return 'marker_or_reference_specialist_result'
    case 'qwen2_5_vl_7b_instruct_provider_boundary':
      return 'visual_understanding_result'
    case 'deepseek_v4_pro_tool_code_boundary':
      return 'edit_planning_or_tool_code_fallback_result'
    default:
      return 'no_asset'
  }
}

function resolveModelRoleId(request: ProviderGatewayRequest): ReEditProModelRoleId | undefined {
  return resolveModelRoleValidation(request).resolvedModelRoleId ??
    request.modelRoleId ??
    resolveReEditProModelRoleContract(request.providerModel)?.modelRoleId ??
    resolveReEditProModelRoleContract(request.providerRoute)?.modelRoleId
}

function resolveModelRoleValidation(request: ProviderGatewayRequest) {
  return validateReEditProModelRoleUse({
    modelRoleId: request.modelRoleId,
    providerRoute: request.providerRoute,
    providerModel: request.providerModel,
    requestedUse: request.requestedModelUse,
  })
}

function createUsageEstimate(request: ProviderGatewayRequest): ProviderGatewayUsageEstimate {
  const modelRoleValidation = resolveModelRoleValidation(request)
  const modelRoleId = modelRoleValidation.resolvedModelRoleId ?? resolveModelRoleId(request)

  return {
    providerRoute: request.providerRoute,
    providerModel: request.providerModel,
    modelRoleId,
    modelRoleProviderBoundary: modelRoleValidation.resolvedProviderBoundary,
    canonicalProviderModel: modelRoleValidation.resolvedCanonicalProviderModel,
    requestedModelUse: request.requestedModelUse,
    generationType: request.generationType,
    qualityLevel: request.qualityLevel,
    estimatedProviderCostCents: estimateCostCentsForRoute(request.providerRoute),
    estimatedUserCredits: estimateCreditsForRoute(request.providerRoute),
    estimatedDurationSeconds: request.outputRequirements.durationSeconds,
    estimatePayload: {
      mockOnly: true,
      routeRole: request.safetyConstraints.routeRole,
      modelTier: request.modelTier,
    },
  }
}

function createGeneratedAssetDraft(request: ProviderGatewayRequest): ProviderGatewayGeneratedAssetDraft | undefined {
  if (!isGeneratedAssetProviderRoute(request.providerRoute)) {
    return undefined
  }

  const bucketPurpose = request.providerRoute === 'gpt_image_2' ? 'generated_assets' : 'generated_assets'
  const extension = request.providerRoute === 'gpt_image_2'
    ? 'png'
    : request.providerRoute === 'svg_renderer'
      ? 'svg'
      : request.providerRoute === 'lottie_renderer'
        ? 'json'
        : isAudioProviderRoute(request.providerRoute)
          ? 'wav'
          : 'mp4'
  const storagePrefix = request.providerRoute === 'gpt_image_2'
    ? 'images'
    : request.providerRoute === 'svg_renderer'
      ? 'svg'
      : request.providerRoute === 'lottie_renderer'
        ? 'lottie'
        : isAudioProviderRoute(request.providerRoute)
          ? 'audio'
          : 'videos'
  const contentType = extension === 'png'
    ? 'image/png'
    : extension === 'json'
      ? 'application/json'
      : extension === 'svg'
        ? 'image/svg+xml'
        : extension === 'wav'
          ? 'audio/wav'
          : 'video/mp4'

  return {
    id: createMockId('generated_asset_draft', request.idempotencyKey),
    assetType: outputAssetType(request.providerRoute),
    displayName: `Mock ${request.providerRoute} output`,
    storageLocation: {
      bucketPurpose,
      bucketName: getReeditProBucketName(bucketPurpose),
      objectPath: `workspaces/${request.workspaceId}/projects/${request.projectId}/generated-assets/${storagePrefix}/${request.generationRequestId}.${extension}`,
      contentType,
      signedUrlRequired: true,
      publicUrlAllowed: false,
      createdByJobId: request.jobId,
      metadata: {
        mockOnly: true,
        providerRoute: request.providerRoute,
      },
    },
    outputRequirements: request.outputRequirements,
    metadata: {
      mockOnly: true,
      approvedPlanSnapshotId: request.approvedPlanSnapshotId,
      promptPlanId: request.promptPlanId ?? null,
      signatureSystem: request.signatureSystem,
    },
  }
}

export class MockProviderGatewayClient implements ProviderGatewayClient {
  readonly providerRoute: ProviderRoute
  readonly executionMode: ProviderGatewayExecutionMode = 'mock_only'

  constructor(providerRoute: ProviderRoute) {
    this.providerRoute = providerRoute
  }

  prepareRequest(request: ProviderGatewayRequest): ProviderGatewayNormalizedResponse {
    const secretReference = getProviderSecretReference(request.providerRoute)
    const usageEstimate = createUsageEstimate(request)
    const generatedAssetDraft = createGeneratedAssetDraft(request)
    const modelRoleValidation = resolveModelRoleValidation(request)
    const modelRoleId = modelRoleValidation.resolvedModelRoleId ?? resolveModelRoleId(request)

    return {
      requestId: createMockId('provider_gateway_response', request.idempotencyKey),
      generationRequestId: request.generationRequestId,
      jobId: request.jobId,
      providerRoute: request.providerRoute,
      providerModel: request.providerModel,
      modelRoleId,
      modelRoleProviderBoundary: modelRoleValidation.resolvedProviderBoundary,
      canonicalProviderModel: modelRoleValidation.resolvedCanonicalProviderModel,
      requestedModelUse: request.requestedModelUse,
      status: request.providerRoute === 'none' ? 'blocked_by_policy' : 'accepted_mock',
      executionMode: this.executionMode,
      errorCategory: request.providerRoute === 'none' ? 'unsupported_route' : 'none',
      errorMessage: request.providerRoute === 'none' ? 'No provider route selected.' : undefined,
      secretReferenceName: secretReference?.secretName,
      usageEstimate,
      generatedAssetDraft,
      providerEventPayload: {
        mockOnly: true,
        noExternalNetworkCall: true,
        providerRoute: request.providerRoute,
        providerModel: request.providerModel ?? null,
        modelRoleId: modelRoleId ?? null,
        modelRoleProviderBoundary: modelRoleValidation.resolvedProviderBoundary ?? null,
        canonicalProviderModel: modelRoleValidation.resolvedCanonicalProviderModel ?? null,
        requestedModelUse: request.requestedModelUse ?? null,
        generationType: request.generationType,
        qualityLevel: request.qualityLevel,
        outputAssetType: request.outputRequirements.outputAssetType,
      } satisfies JSONObject,
      createdAt: nowIso(),
    }
  }
}

export function createMockProviderGatewayClient(providerRoute: ProviderRoute): MockProviderGatewayClient {
  return new MockProviderGatewayClient(providerRoute)
}
