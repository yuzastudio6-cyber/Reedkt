import type { ID, JSONObject } from '../../../types/shared'
import type { ProviderGatewayRequest, ProviderRoute } from '../../cloud/provider-gateway-contracts'
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
    case 'remotion_deterministic':
      return 'remotion_renderer_asset'
    case 'svg_renderer':
      return 'svg_overlay_asset'
    case 'lottie_renderer':
      return 'lottie_overlay_asset'
    default:
      return 'no_asset'
  }
}

function createUsageEstimate(request: ProviderGatewayRequest): ProviderGatewayUsageEstimate {
  return {
    providerRoute: request.providerRoute,
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
  if (request.providerRoute === 'none') {
    return undefined
  }

  const bucketPurpose = request.providerRoute === 'gpt_image_2' ? 'generated_assets' : 'generated_assets'
  const extension = request.providerRoute === 'gpt_image_2' ? 'png' : request.providerRoute === 'svg_renderer' ? 'svg' : request.providerRoute === 'lottie_renderer' ? 'json' : 'mp4'
  const storagePrefix = request.providerRoute === 'gpt_image_2' ? 'images' : request.providerRoute === 'svg_renderer' ? 'svg' : request.providerRoute === 'lottie_renderer' ? 'lottie' : 'videos'

  return {
    id: createMockId('generated_asset_draft', request.idempotencyKey),
    assetType: outputAssetType(request.providerRoute),
    displayName: `Mock ${request.providerRoute} output`,
    storageLocation: {
      bucketPurpose,
      bucketName: getReeditProBucketName(bucketPurpose),
      objectPath: `workspaces/${request.workspaceId}/projects/${request.projectId}/generated-assets/${storagePrefix}/${request.generationRequestId}.${extension}`,
      contentType: extension === 'png' ? 'image/png' : extension === 'json' ? 'application/json' : extension === 'svg' ? 'image/svg+xml' : 'video/mp4',
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

    return {
      requestId: createMockId('provider_gateway_response', request.idempotencyKey),
      generationRequestId: request.generationRequestId,
      jobId: request.jobId,
      providerRoute: request.providerRoute,
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
