import type {
  LivingFrameTimingPhase,
} from '../../src/types/living-frame'
import type {
  CanonicalLivingFrameExecutionRequirements,
} from '../../src/types/living-frame-execution-requirements'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  CANONICAL_LIVING_FRAME_TIMING_BINDING_SOURCE,
  CANONICAL_LIVING_FRAME_TIMING_BINDING_VERSION,
  CANONICAL_LIVING_FRAME_TIMING_POLICY_VERSION,
  type CanonicalLivingFrameFrameRange,
  type CanonicalLivingFrameSceneTimingBinding,
  type CanonicalLivingFrameTimingBinding,
  type CanonicalLivingFrameTimingBindingAuthorityBoundary,
  type CanonicalLivingFrameTimingBindingDraft,
} from '../../src/types/living-frame-timing-binding'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const REQUIRED_TIMING_PHASES: readonly LivingFrameTimingPhase[] = [
  'prepare',
  'activate',
  'demonstrate',
  'resolve',
  'settle',
]

const ACCEPTED_MASTER_TIMING_STATES = new Set([
  'ready',
  'approved_mock',
])

const ACCEPTED_SOUND_SYNC_STATES = new Set([
  'mock_planned',
  'ready_mock',
])

const AUTHORITY_BOUNDARY:
  CanonicalLivingFrameTimingBindingAuthorityBoundary =
    Object.freeze({
      serverDerivedTimingBindingAuthority: true,
      masterTimingPlanMutationAuthority: false,
      soundSyncPlanMutationAuthority: false,
      exactVisualPhaseFrameAuthority: true,
      exactSoundCuePlacementAuthority: true,
      exactAudioMixAuthority: false,
      captionTimingAuthority: false,
      estimateAuthority: false,
      approvalAuthority: false,
      snapshotAuthority: false,
      workGraphAuthority: false,
      assetManifestAuthority: false,
      qaApprovalAuthority: false,
      rendererAuthority: false,
      runtimeAuthority: false,
      productionAuthority: false,
    })

export function compileCanonicalLivingFrameTimingBinding(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly components: CanonicalPlanComponentsInput
}): CanonicalLivingFrameTimingBinding {
  assertCurrentSourceBindings(input)
  const fps = input.components.timingSummary.fps
  const totalFrames = input.components.timingSummary.totalFrames
  if (
    !Number.isInteger(fps)
    || fps <= 0
    || fps !== input.components.confirmedSettings.outputFrame.fps
    || !Number.isInteger(totalFrames)
    || totalFrames <= 0
    || !isRecord(input.components.masterTimingPlan)
    || !ACCEPTED_MASTER_TIMING_STATES.has(
      String(input.components.masterTimingPlan.status),
    )
  ) {
    throw conflict(
      'Canonical Living Frame timing binding requires one ready exact MasterTiming base matching the confirmed output frame.',
    )
  }
  const soundRequestCount =
    input.requirements.metrics.soundRequestCount
  if (
    soundRequestCount > 0
    && (
      !isRecord(input.components.soundSyncTransitionTimingPlan)
      || !ACCEPTED_SOUND_SYNC_STATES.has(
        String(
          input.components.soundSyncTransitionTimingPlan.status,
        ),
      )
      || input.components.soundSyncTransitionTimingPlan
        .speechPriority !== true
    )
  ) {
    throw conflict(
      'Canonical Living Frame sound requests require the current speech-priority SoundSync plan to be ready before exact cue placement.',
    )
  }

  const selectedSceneById = new Map(
    input.publication.binding.selectedComponent.scenePlans.map(
      (scene) => [scene.sceneId, scene],
    ),
  )
  const usedSegmentIds = new Set<string>()
  const scenes = input.requirements.scenes.map((requirement) => {
    if (usedSegmentIds.has(requirement.canonicalSegmentId)) {
      throw conflict(
        'Canonical Living Frame timing currently admits at most one selected scene per exact timeline segment.',
      )
    }
    usedSegmentIds.add(requirement.canonicalSegmentId)
    const selectedScene =
      selectedSceneById.get(requirement.sceneId)
    if (!selectedScene) {
      throw conflict(
        'Canonical Living Frame timing requirement has no selected-scene source.',
      )
    }
    return compileSceneTiming({
      requirement,
      selectedScene,
      fps,
      totalFrames,
    })
  })

  const deliberateNonUse =
    input.publication.binding.deliberateNonUse
  if (
    deliberateNonUse !== (scenes.length === 0)
    || input.publication.binding.selectedSceneCount !==
      scenes.length
  ) {
    throw conflict(
      'Canonical Living Frame selected-scene decision and timing binding disagree.',
    )
  }

  const draft: CanonicalLivingFrameTimingBindingDraft = {
    schemaVersion:
      CANONICAL_LIVING_FRAME_TIMING_BINDING_VERSION,
    source:
      CANONICAL_LIVING_FRAME_TIMING_BINDING_SOURCE,
    timingPolicyVersion:
      CANONICAL_LIVING_FRAME_TIMING_POLICY_VERSION,
    evidenceClass:
      'private_internal_server_derived_master_timing_soundsync_binding',
    identity: {
      workspaceId:
        input.publication.binding.identity.workspaceId,
      projectId:
        input.publication.binding.identity.projectId,
      editSessionId:
        input.publication.binding.identity.editSessionId,
    },
    sourceBindings: {
      executionRequirementsDigestSha256:
        input.requirements.requirementsDigestSha256,
      selectedSceneBindingDigestSha256:
        input.publication.binding.bindingDigestSha256,
      currentMasterTimingDigestSha256:
        sha256AuthorityValue(input.components.masterTimingPlan),
      currentSoundSyncDigestSha256:
        sha256AuthorityValue(
          input.components.soundSyncTransitionTimingPlan,
        ),
      canonicalSegmentsDigestSha256:
        sha256AuthorityValue(input.components.segments),
      confirmedOutputFrameDigestSha256:
        sha256AuthorityValue(
          input.components.confirmedSettings.outputFrame,
        ),
    },
    fps,
    totalFrames,
    deliberateNonUse,
    scenes,
    metrics: {
      selectedSceneCount: scenes.length,
      semanticPhaseBindingCount: scenes.reduce(
        (total, scene) =>
          total + scene.semanticPhaseBindings.length,
        0,
      ),
      soundCueBindingCount: scenes.reduce(
        (total, scene) =>
          total + scene.soundCueBindings.length,
        0,
      ),
    },
    authorityBoundary: AUTHORITY_BOUNDARY,
    masterTimingRemainsSoleClockAuthority: true,
    soundSyncRemainsSoleAudioTimingSystem: true,
    captionSpeechAndMeaningPriorityPreserved: true,
    containsAudioMediaOrCaptionText: false,
    containsRawChatTranscriptOrOperationalMediaData: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    timingBindingDigestSha256:
      sha256AuthorityValue(draft),
  }
}

export function verifyCanonicalLivingFrameTimingBinding(input: {
  readonly timingBinding: unknown
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly components: CanonicalPlanComponentsInput
}): input is {
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly components: CanonicalPlanComponentsInput
} {
  try {
    const expected = compileCanonicalLivingFrameTimingBinding({
      publication: input.publication,
      requirements: input.requirements,
      components: input.components,
    })
    return (
      isRecord(input.timingBinding)
      && input.timingBinding.schemaVersion ===
        CANONICAL_LIVING_FRAME_TIMING_BINDING_VERSION
      && input.timingBinding.source ===
        CANONICAL_LIVING_FRAME_TIMING_BINDING_SOURCE
      && input.timingBinding.timingBindingDigestSha256 ===
        sha256AuthorityValue(
          withoutDigest(input.timingBinding),
        )
      && stableAuthorityStringify(input.timingBinding) ===
        stableAuthorityStringify(expected)
    )
  } catch {
    return false
  }
}

function compileSceneTiming(input: {
  readonly requirement:
    CanonicalLivingFrameExecutionRequirements['scenes'][number]
  readonly selectedScene:
    CanonicalLivingFrameSelectedScenePublication[
      'binding'
    ]['selectedComponent']['scenePlans'][number]
  readonly fps: number
  readonly totalFrames: number
}): CanonicalLivingFrameSceneTimingBinding {
  if (
    input.requirement.startFrame < 0
    || input.requirement.endFrameExclusive >
      input.totalFrames
  ) {
    throw conflict(
      'Canonical Living Frame scene timing exceeds the current MasterTiming range.',
    )
  }
  const segmentFrameRange = frameRange(
    input.requirement.startFrame,
    input.requirement.endFrameExclusive,
  )
  if (segmentFrameRange.durationFrames < 30) {
    throw conflict(
      'Canonical Living Frame selected scenes require at least thirty exact MasterTiming frames.',
    )
  }
  const requests = [...input.selectedScene.semanticTimingRequests]
    .sort((left, right) => left.order - right.order)
  if (
    requests.length !== REQUIRED_TIMING_PHASES.length
    || requests.some(
      (request, index) =>
        request.order !== index
        || request.phase !== REQUIRED_TIMING_PHASES[index],
    )
  ) {
    throw conflict(
      'Canonical Living Frame semantic timing requests do not contain one exact ordered five-phase sequence.',
    )
  }
  const edgePaddingFrames = Math.min(
    12,
    Math.max(
      1,
      Math.floor(
        (segmentFrameRange.durationFrames - 16) / 2,
      ),
    ),
  )
  const preferredActiveFrames = Math.max(
    Math.round(input.fps * 2),
    45,
  )
  const visualStartFrame =
    segmentFrameRange.startFrame + edgePaddingFrames
  const latestVisualEndFrame =
    segmentFrameRange.endFrameExclusive -
    edgePaddingFrames
  const visualEndFrame = Math.min(
    latestVisualEndFrame,
    visualStartFrame + preferredActiveFrames,
  )
  const visualFrameRange = frameRange(
    visualStartFrame,
    visualEndFrame,
  )
  if (visualFrameRange.durationFrames < 16) {
    throw conflict(
      'Canonical Living Frame visual timing does not have enough frames for reveal, hold, and resolution.',
    )
  }
  const motionEdgeFrames = Math.min(
    8,
    Math.max(
      1,
      Math.floor(
        (visualFrameRange.durationFrames - 1) / 3,
      ),
    ),
  )
  const activationEndFrame =
    visualStartFrame + motionEdgeFrames
  const resolutionStartFrame =
    visualEndFrame - motionEdgeFrames
  const phaseRanges = [
    frameRange(
      segmentFrameRange.startFrame,
      visualStartFrame,
    ),
    frameRange(visualStartFrame, activationEndFrame),
    frameRange(activationEndFrame, resolutionStartFrame),
    frameRange(resolutionStartFrame, visualEndFrame),
    frameRange(
      visualEndFrame,
      segmentFrameRange.endFrameExclusive,
    ),
  ]
  if (
    phaseRanges.some((range) => range.durationFrames <= 0)
  ) {
    throw conflict(
      'Canonical Living Frame timing policy produced an empty semantic phase.',
    )
  }
  const semanticPhaseBindings = requests.map(
    (request, index) => ({
      timingRequestId: request.timingRequestId,
      order: request.order,
      phase: request.phase,
      cueCode: request.cueCode,
      frameRange: phaseRanges[index]!,
      derivedFromMasterTimingSegment: true as const,
    }),
  )
  const soundRequests = [
    ...input.selectedScene.soundRequests,
  ].sort((left, right) => left.order - right.order)
  if (
    soundRequests.some(
      (request, index) => request.order !== index,
    )
    || soundRequests.length >
      visualFrameRange.durationFrames
  ) {
    throw conflict(
      'Canonical Living Frame sound requests must have unique contiguous order and fit inside the exact visual range.',
    )
  }
  const soundCueBindings = soundRequests.map(
    (request, index) => {
      const slotStart = visualStartFrame + Math.floor(
        index * visualFrameRange.durationFrames
        / soundRequests.length,
      )
      const slotEnd = visualStartFrame + Math.floor(
        (index + 1) * visualFrameRange.durationFrames
        / soundRequests.length,
      )
      const cueEnd = Math.min(
        slotEnd,
        slotStart + 6,
      )
      return {
        soundRequestId: request.soundRequestId,
        order: request.order,
        soundSyncCueId: safeDerivedId(
          'lf-soundsync',
          {
            sceneId: input.requirement.sceneId,
            soundRequestId: request.soundRequestId,
            order: request.order,
          },
        ),
        linkedComponentId: request.linkedComponentId,
        purpose: request.purpose,
        priority: request.priority,
        narrationProtection: request.narrationProtection,
        duckingExpectation: request.duckingExpectation,
        frameRange: frameRange(slotStart, cueEnd),
        exactCuePlacementProvided: true as const,
        exactMixProvided: false as const,
        speechPriorityPreserved: true as const,
      }
    },
  )
  return {
    sceneId: input.requirement.sceneId,
    treatment: input.requirement.treatment,
    canonicalSegmentId:
      input.requirement.canonicalSegmentId,
    canonicalSegmentDigestSha256:
      input.requirement.canonicalSegmentDigestSha256,
    segmentFrameRange,
    visualTiming: {
      visualTimingId: safeDerivedId(
        'lf-visual-timing',
        {
          sceneId: input.requirement.sceneId,
          segmentId: input.requirement.canonicalSegmentId,
          segmentDigestSha256:
            input.requirement.canonicalSegmentDigestSha256,
        },
      ),
      frameRange: visualFrameRange,
      revealFrames: motionEdgeFrames,
      holdFrames:
        visualFrameRange.durationFrames -
        motionEdgeFrames * 2,
      exitFrames: motionEdgeFrames,
      captionPlaneRemainsAboveLivingFrame: true,
    },
    semanticPhaseBindings,
    soundCueBindings,
  }
}

function assertCurrentSourceBindings(input: {
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly requirements:
    CanonicalLivingFrameExecutionRequirements
  readonly components: CanonicalPlanComponentsInput
}): void {
  if (
    input.requirements.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      input.publication.binding.bindingDigestSha256
    || input.requirements.sourceBindings
      .currentMasterTimingDigestSha256 !==
      sha256AuthorityValue(input.components.masterTimingPlan)
    || input.requirements.sourceBindings
      .currentSoundSyncDigestSha256 !==
      sha256AuthorityValue(
        input.components.soundSyncTransitionTimingPlan,
      )
    || input.requirements.sourceBindings
      .canonicalSegmentsDigestSha256 !==
      sha256AuthorityValue(input.components.segments)
  ) {
    throw conflict(
      'Canonical Living Frame timing binding does not match the current selected-scene requirements or timing sources.',
    )
  }
}

function frameRange(
  startFrame: number,
  endFrameExclusive: number,
): CanonicalLivingFrameFrameRange {
  if (
    !Number.isInteger(startFrame)
    || !Number.isInteger(endFrameExclusive)
    || startFrame < 0
    || endFrameExclusive <= startFrame
  ) {
    throw conflict(
      'Canonical Living Frame frame range is invalid.',
    )
  }
  return {
    startFrame,
    endFrameExclusive,
    durationFrames: endFrameExclusive - startFrame,
  }
}

function safeDerivedId(
  prefix: string,
  value: unknown,
): string {
  return `${prefix}-${sha256AuthorityValue(value).slice(0, 32)}`
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  delete draft.timingBindingDigestSha256
  return draft
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function conflict(message: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    message,
    409,
    {
      requiredGate:
        'canonical_living_frame_master_timing_soundsync_binding',
    },
  )
}
