import {
  PROFESSIONAL_LONG_FORM_FRAME_RATE_PROFILE_IDS,
  PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES,
  type ProfessionalLongFormFrameRateProfileId,
} from '../edit-architecture/professional-long-form-object-execution-plan'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION,
} from './canonical-professional-long-form-publication-authority'

type RuntimeRegion = 'us-east1' | 'europe-west1'

export interface CanonicalSourceLedLongFormSourceObject {
  sourceSequenceItemId: string
  mediaAssetId: string
  storageProvider: 'local_private' | 'google_cloud_storage'
  generation?: string
  region?: string
  sizeBytes: number
  checksumSha256: string
}

/**
 * Projects the already-approved source-led timeline into the existing
 * professional long-form seed. It does not create an execution graph or grant
 * dispatch: the canonical publication authority revalidates this draft against
 * the persisted source manifest and adds the single post-approval controller.
 */
export function buildCanonicalSourceLedProfessionalLongFormSeedDraft(input: {
  workspaceId: string
  projectId: string
  editSessionId: string
  planningRequestId: string
  components: CanonicalPlanComponentsInput
  sourceObjects: CanonicalSourceLedLongFormSourceObject[]
}) {
  const components = input.components
  const runtimeRegion = resolveRuntimeRegion(input.sourceObjects)
  const sourceBySequenceId = new Map(
    input.sourceObjects.map((source) => [
      source.sourceSequenceItemId,
      source,
    ]),
  )
  if (
    input.sourceObjects.length !== components.sourceSequence.length ||
    input.sourceObjects.length > PROFESSIONAL_LONG_FORM_MAXIMUM_SOURCE_RANGES ||
    sourceBySequenceId.size !== input.sourceObjects.length ||
    components.sourceCleanupPlan.decisions.length !==
      components.sourceSequence.length ||
    components.segments.length !== components.sourceSequence.length
  ) {
    throw new Error(
      'Professional long-form source-led publication requires one exact source object, cleanup decision, and timeline segment per confirmed source.',
    )
  }

  let expectedTimelineStartFrame = 0
  const sourceRanges = components.sourceSequence.map((source, index) => {
    const sourceObject = sourceBySequenceId.get(source.sourceSequenceItemId)
    const cleanup = components.sourceCleanupPlan.decisions[index]
    const segment = components.segments[index]
    if (
      !sourceObject ||
      !cleanup ||
      !segment ||
      sourceObject.mediaAssetId !== source.mediaAssetId ||
      sourceObject.checksumSha256 !== source.checksumSha256 ||
      cleanup.sourceSequenceItemId !== source.sourceSequenceItemId ||
      cleanup.action === 'cut' ||
      cleanup.endFrameExclusive <= cleanup.startFrame ||
      segment.startFrame !== expectedTimelineStartFrame ||
      segment.endFrameExclusive <= segment.startFrame ||
      segment.endFrameExclusive - segment.startFrame !==
        cleanup.endFrameExclusive - cleanup.startFrame
    ) {
      throw new Error(
        `Professional long-form source ${index + 1} lost exact source, cleanup, or contiguous timeline authority.`,
      )
    }
    const generation = sourceObject.storageProvider === 'google_cloud_storage'
      ? sourceObject.generation
      : '1'
    if (!generation || !/^[1-9][0-9]{0,30}$/u.test(generation)) {
      throw new Error(
        `Professional long-form source ${index + 1} is missing exact object generation authority.`,
      )
    }
    const range = {
      segmentId: segment.segmentId,
      sourceSequenceItemId: source.sourceSequenceItemId,
      mediaAssetId: source.mediaAssetId,
      sourceObjectGeneration: generation,
      sourceObjectRegion: runtimeRegion,
      sourceByteLength: sourceObject.sizeBytes,
      sourceSha256: sourceObject.checksumSha256,
      sourceCleanupDecisionId: cleanup.decisionId,
      sourceStartFrame: cleanup.startFrame,
      sourceEndFrameExclusive: cleanup.endFrameExclusive,
      timelineStartFrame: segment.startFrame,
      timelineEndFrameExclusive: segment.endFrameExclusive,
      editorialBoundaryBefore:
        index === 0
          ? 'timeline_start' as const
          : 'approved_hard_cut' as const,
    }
    expectedTimelineStartFrame = range.timelineEndFrameExclusive
    return range
  })

  if (expectedTimelineStartFrame !== components.timingSummary.totalFrames) {
    throw new Error(
      'Professional long-form source ranges do not cover the exact canonical timeline.',
    )
  }
  const frameRate = frameRateForFps(components.timingSummary.fps)
  if (
    components.confirmedSettings.outputFrame.fps !==
      components.timingSummary.fps
  ) {
    throw new Error(
      'Professional long-form source-led publication requires one exact confirmed frame-rate authority.',
    )
  }

  return {
    schemaVersion: CANONICAL_PROFESSIONAL_LONG_FORM_SEED_DRAFT_VERSION,
    identity: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editSessionId: input.editSessionId,
      planningRequestId: input.planningRequestId,
    },
    runtimeRegion,
    confirmedOutputFrame: {
      frameTemplateId: frameTemplateId(
        components.confirmedSettings.aspectRatio,
      ),
      width: components.confirmedSettings.outputFrame.width,
      height: components.confirmedSettings.outputFrame.height,
      confirmed: true as const,
      deliveryCeilingProfileId: 'uhd_2160_4k_ceiling_v1' as const,
      frameRate,
    },
    totalFrames: components.timingSummary.totalFrames,
    sourceRanges,
    executionPolicy: {
      videoChunkPolicy: 'object_backed_frame_exact_mezzanine_v1' as const,
      audioPolicy: 'single_continuous_timeline_mix_v1' as const,
      colorPolicy:
        'source_bound_transform_plus_boundary_continuity_v1' as const,
      transitionPolicy: 'approved_hard_cuts_only_v1' as const,
      objectResidencyPolicy:
        'single_region_no_cross_region_copy_v1' as const,
      finalizationPolicy:
        'compatible_object_mezzanine_concat_or_block_v1' as const,
      requiredAssetPlaceholderPolicy: 'forbidden_in_final_v1' as const,
    },
    approvalAndCostBoundary: {
      originalApprovedFourKEstimateReused: true as const,
      originalApprovedReservationReused: true as const,
      secondExportEstimateAllowed: false as const,
      secondExportChargeAllowed: false as const,
      attemptLevelInternalProductionCostEvidenceRequired: true as const,
      customerCommercialAuthorityIncluded: false as const,
    },
  }
}

function resolveRuntimeRegion(
  sources: CanonicalSourceLedLongFormSourceObject[],
): RuntimeRegion {
  const cloudRegions = new Set(
    sources
      .filter((source) => source.storageProvider === 'google_cloud_storage')
      .map((source) => source.region),
  )
  if (
    cloudRegions.size > 1 ||
    [...cloudRegions].some(
      (region) => region !== 'us-east1' && region !== 'europe-west1',
    )
  ) {
    throw new Error(
      'Professional long-form source objects must resolve to one admitted runtime region.',
    )
  }
  return ([...cloudRegions][0] as RuntimeRegion | undefined) ?? 'us-east1'
}

function frameRateForFps(fps: number): {
  profileId: ProfessionalLongFormFrameRateProfileId
  numerator: number
  denominator: number
} {
  const profileId = `fps_${fps}` as ProfessionalLongFormFrameRateProfileId
  if (
    !PROFESSIONAL_LONG_FORM_FRAME_RATE_PROFILE_IDS.includes(profileId) ||
    (fps !== 24 && fps !== 30)
  ) {
    throw new Error(
      'The source-led professional long-form route currently requires an exact 24fps or 30fps canonical timing base.',
    )
  }
  return { profileId, numerator: fps, denominator: 1 }
}

function frameTemplateId(aspectRatio: string): string {
  return `confirmed-${aspectRatio.replace(':', 'x')}-uhd-v1`
}
