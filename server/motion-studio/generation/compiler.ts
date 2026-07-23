import {
  MOTION_STUDIO_GENERATION_SPEC_VERSION,
  type MotionStudioGeneratedMediaKind,
  MOTION_STUDIO_VIDEO_ROUTING_AUTHORITY_VERSION,
  type MotionStudioGenerationRoutePolicyV2,
  type MotionStudioGenerationShotSpecV1,
  type MotionStudioGenerationTier,
  type MotionStudioVersionReference,
  type SceneDocument,
} from '../../../src/types/motion-studio'
import {
  motionStudioGenerationRoutePolicyV2Schema,
  motionStudioGenerationShotSpecV1Schema,
  validateSceneDocumentBoundary,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioTimelineProposalRow } from '../scenes/types'

export interface CompileMotionStudioGenerationInput {
  sceneDocument: SceneDocument
  sceneDocumentVersion: MotionStudioVersionReference
  proposal: MotionStudioTimelineProposalRow
  mediaKind: MotionStudioGeneratedMediaKind
  modelTier: MotionStudioGenerationTier
  referenceVersions?: readonly {
    referenceContract: MotionStudioVersionReference
    assetId: string
    assetVersionId: string
    contentDigest: string
    role: MotionStudioGenerationShotSpecV1['references'][number]['role']
    instruction: string
  }[]
}

export interface CompiledMotionStudioGeneration {
  shotSpec: MotionStudioGenerationShotSpecV1
  shotSpecDigest: string
  routePolicy: MotionStudioGenerationRoutePolicyV2
  routePolicyDigest: string
}

export function compileMotionStudioGeneration(
  input: CompileMotionStudioGenerationInput,
): CompiledMotionStudioGeneration {
  const documentErrors = validateSceneDocumentBoundary(input.sceneDocument).errors
  if (documentErrors.length) throw blocked('SceneDocument is invalid for generated media.', documentErrors)
  const document = input.sceneDocument
  const proposal = input.proposal
  if (!['generative_first', 'hybrid_directed'].includes(document.productionMode)) {
    throw blocked('Generated media requires an approved generative or hybrid SceneDocument.')
  }
  if (
    proposal.approved_snapshot_id !== document.approvedSnapshotId ||
    proposal.source_scene_document_artifact_id !== input.sceneDocumentVersion.artifactId ||
    proposal.source_scene_document_version_id !== input.sceneDocumentVersion.versionId ||
    proposal.source_scene_document_version_number !== input.sceneDocumentVersion.versionNumber ||
    proposal.source_scene_document_digest !== input.sceneDocumentVersion.contentDigest
  ) {
    throw blocked('Generation proposal does not bind the exact SceneDocument authority.')
  }
  if (proposal.operations_json.length !== 1) {
    throw blocked('MS-010A generation proof requires exactly one proposed visual layer.')
  }
  const proposedLayer = proposal.operations_json[0]?.layer
  if (!proposedLayer) {
    throw blocked('MS-010A generation proof requires one concrete proposed visual layer.')
  }
  const expectedLayerType = input.mediaKind === 'still_image' ? 'image' : 'generated_video'
  if (proposedLayer.metadata.layerType !== expectedLayerType) {
    throw blocked(`Generated ${input.mediaKind} requires an approved ${expectedLayerType} layer.`)
  }
  const startFrame = proposedLayer.timelineRange.startFrame
  const endFrame = proposedLayer.timelineRange.endFrame
  if (
    typeof startFrame !== 'number' || typeof endFrame !== 'number' ||
    !Number.isSafeInteger(startFrame) || !Number.isSafeInteger(endFrame) ||
    startFrame < 0 || endFrame <= startFrame || endFrame > document.timingAuthority.durationFrames
  ) throw blocked('Generation proposal range is outside exact timing authority.')

  const semanticPurpose = document.semanticPurpose.trim()
  if (!semanticPurpose || semanticPurpose.length > 240) {
    throw blocked('Generated scene semantic purpose must be 1–240 characters.')
  }
  const routePolicy = buildMotionStudioGenerationRoutePolicy(input.mediaKind, input.modelTier)
  const references = input.referenceVersions ?? []
  const shotSpec: MotionStudioGenerationShotSpecV1 = {
    schemaVersion: MOTION_STUDIO_GENERATION_SPEC_VERSION,
    productionId: document.productionId,
    approvedSnapshotId: document.approvedSnapshotId,
    sceneId: document.sceneId,
    semanticPurpose,
    mediaKind: input.mediaKind,
    timingAuthority: { ...document.timingAuthority },
    sceneRange: { startFrame, endFrame },
    visualDirection: `Create a restrained visual treatment that communicates: ${semanticPurpose}`,
    primaryAction: input.mediaKind === 'still_image'
      ? 'Establish one clear approved composition for later review.'
      : 'Animate one clear visual action while preserving the approved opening composition.',
    cameraBehavior: input.mediaKind === 'still_image'
      ? 'Static approved composition; no simulated camera move.'
      : 'One controlled move with a stable beginning and ending composition.',
    continuityProfileId: `continuity-${document.sceneId}`,
    references: references.map((reference) => ({ ...reference })),
    output: {
      quality: 'draft',
      ...(input.mediaKind === 'still_image' ? { imageFormat: 'png' as const } : { videoFormat: 'mp4' as const }),
    },
    deterministicOverlayPolicy: {
      exactTextInProviderMediaAllowed: false,
      captionsInProviderMediaAllowed: false,
      chartsInProviderMediaAllowed: false,
      mapsInProviderMediaAllowed: false,
      statisticsInProviderMediaAllowed: false,
      logosInProviderMediaAllowed: false,
      finalCanvasOwnedByRemotion: true,
    },
    exclusions: [
      'No captions, exact typography, statistics, maps, charts, documents, or logos inside provider media.',
      'Do not create the final ReeditPro canvas or flatten deterministic overlay layers.',
      'Do not copy reference compositions when a reference role is do_not_copy.',
    ],
    qaRequirements: ['checksum', 'media_facts', 'safety', 'reference_adherence', 'continuity', 'intent_alignment'],
    simulatorPolicy: {
      allowed: true,
      outputIsProviderGenerated: false,
      finalAssetEligible: false,
      qualityCalibrationMeasured: false,
    },
  }
  const parsedSpec = motionStudioGenerationShotSpecV1Schema.safeParse(shotSpec)
  if (!parsedSpec.success) {
    throw blocked('Derived generation ShotSpec failed its registered schema.', parsedSpec.error.issues.map((issue) => issue.message))
  }
  return {
    shotSpec: parsedSpec.data,
    shotSpecDigest: sha256CanonicalJson(parsedSpec.data),
    routePolicy,
    routePolicyDigest: sha256CanonicalJson(routePolicy),
  }
}

export function buildMotionStudioGenerationRoutePolicy(
  mediaKind: MotionStudioGeneratedMediaKind,
  modelTier: MotionStudioGenerationTier,
): MotionStudioGenerationRoutePolicyV2 {
  const candidates: MotionStudioGenerationRoutePolicyV2['candidates'] = mediaKind === 'still_image'
    ? [{
        providerRoute: 'gpt_image_2', routeRole: 'primary', supportedMediaKind: 'still_image',
        allowedTiers: ['basic', 'pro', 'premium'], finalFallbackOnly: false,
        capabilityReason: 'Registered still, storyboard, keyframe and image-edit route.',
      }]
    : [
        {
          providerRoute: 'gemini_omni_flash', routeRole: 'primary', supportedMediaKind: 'video_clip',
          allowedTiers: ['basic', 'pro', 'premium'], finalFallbackOnly: false,
          capabilityReason: 'Registered default multimodal video-generation and conversational-editing route.',
        },
        {
          providerRoute: 'wan', routeRole: 'alternate', supportedMediaKind: 'video_clip',
          allowedTiers: ['basic', 'pro', 'premium'], finalFallbackOnly: false,
          capabilityReason: 'Controlled alternate after an approved primary-route failure or suitability decision.',
        },
        {
          providerRoute: 'hailuo', routeRole: 'fallback', supportedMediaKind: 'video_clip',
          allowedTiers: ['basic', 'pro', 'premium'], finalFallbackOnly: false,
          capabilityReason: 'Registered alternate/fallback route after a reviewed primary failure.',
        },
        ...(modelTier === 'premium' ? [{
          providerRoute: 'veo' as const, routeRole: 'final_rescue' as const,
          supportedMediaKind: 'video_clip' as const, allowedTiers: ['premium' as const],
          finalFallbackOnly: true,
          capabilityReason: 'Premium-only final rescue after approved Omni/Wan/Hailuo failure evidence.',
        }] : []),
      ]
  const policy: MotionStudioGenerationRoutePolicyV2 = {
    policyId: 'motion_studio_generation_route_policy_v2',
    routingAuthorityVersion: MOTION_STUDIO_VIDEO_ROUTING_AUTHORITY_VERSION,
    modelTier,
    mediaKind,
    candidates,
    automaticFallbackAllowed: false,
    newApprovalRequiredForFallback: true,
    exactTextDataAndLogosRemainDeterministic: true,
  }
  const parsed = motionStudioGenerationRoutePolicyV2Schema.safeParse(policy)
  if (!parsed.success) {
    throw blocked('Derived generation route policy failed its registered schema.', parsed.error.issues.map((issue) => issue.message))
  }
  return parsed.data
}

function blocked(message: string, errors: readonly string[] = []): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409, errors.length ? { errors } : undefined)
}
