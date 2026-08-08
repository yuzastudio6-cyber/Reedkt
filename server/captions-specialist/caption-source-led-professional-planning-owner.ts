import { z } from 'zod'

import type { CaptionEarlyPlanningInput } from
  '../../src/types/caption-early-planning'
import type {
  CaptionIntegrationClass,
  CaptionSceneSkillActivation,
} from '../../src/types/caption-design-composite'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_SOURCE_LED_ADVANCED_PRESET_IDS,
  CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS,
  type CaptionSourceLedAdvancedPresetId,
  type CaptionSourceLedCrossSystemTarget,
} from '../../src/types/caption-source-led-intent-policy'
import type {
  CanonicalCaptionSourceLedProfessionalPlanningReadPort,
  CanonicalCaptionSourceLedProfessionalPlanningRequest,
} from '../../src/types/canonical-caption-source-led-professional-planning'
import {
  CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
} from '../../src/types/canonical-caption-source-led-professional-planning'
import {
  CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION,
  type CanonicalCaptionSpecialistEstimateBindingMetadata,
  type CanonicalCaptionSpecialistJobAssignmentIntent,
  type CanonicalCaptionSpecialistPlanningBindingV1,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CAPTIONS_VIDEO_JOB_TYPES,
  type CaptionsSupportedJobType,
} from '../../src/types/captions-specialist'
import {
  parseProfessionalSkillCompositionTrace,
} from '../../src/lib/professional-skills/professional-skill-composition-trace'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import type {
  CanonicalSourceLedCleanupAuthorityInput,
} from '../services/canonical-source-led-plan-compiler'
import {
  assertCanonicalSourceCleanupBindingMatchesEvidence,
} from '../services/canonical-source-cleanup-visual-intelligence-binding'
import {
  verifyCanonicalSourceLedContentAnalysisEvidence,
} from '../services/canonical-source-led-content-analysis-evidence'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import {
  canonicalCaptionAssignmentTriggerForJob,
  calculateCanonicalCaptionSpecialistPlanningBindingDigest,
  createCanonicalCaptionSpecialistPlanningBindingV3,
  parseCanonicalCaptionSpecialistPlanningBinding,
} from './caption-canonical-work-planning'
import {
  CAPTION_DESIGN_COMPOSITE,
  activateCaptionMiniSkillsForScene,
} from './caption-design-composite'
import { createCaptionEarlyPlanningBundle } from './caption-early-planning'
import {
  createCanonicalCaptionSourceLedProfessionalPlanningAuthority,
  createCanonicalCaptionSourceLedProfessionalPlanningReadPort,
} from './caption-source-led-professional-planning'

const REQUIRED_SOURCE_LED_SCENE_JOBS: readonly CaptionsSupportedJobType[] = [
  'reserve_caption_space',
  'plan_caption_blocking_preview',
  'check_caption_finish_readiness',
  'resolve_late_bound_caption_scene',
  'resolve_semantic_caption_phrases',
  'compile_caption_scene_graph',
  'compile_caption_render_spec',
  'compile_accessible_caption_projection',
  'compile_reduced_motion_caption_projection',
] as const

const safeDirectiveToken = z.string().trim().min(1).max(240)
  .regex(/^[a-z0-9][a-z0-9._:-]*$/u)
const structuredCustomDirectiveSchema = z.object({
  mappedPresetIds: z.array(safeDirectiveToken).max(64),
  confidence: z.enum(['low', 'medium', 'high']),
  clarifyingQuestions: z.array(z.string().max(1_000)).max(32),
}).passthrough()
const professionalCaptionDirectiveSchema = z.object({
  editStyle: safeDirectiveToken,
  pacingStyle: safeDirectiveToken,
  captionStyle: safeDirectiveToken,
  brollPolicy: safeDirectiveToken,
  soundStyle: safeDirectiveToken,
  customDirectives: z.array(z.union([
    z.string().max(8_000),
    structuredCustomDirectiveSchema,
  ])).max(128),
}).passthrough()

type TrackingJobType =
  | 'resolve_subject_occluded_typography'
  | 'resolve_front_of_subject_typography'
  | 'resolve_object_anchored_typography'
  | 'resolve_environmental_typography'

interface CaptionSourceLedScenePlan extends PlanningSourceScene {
  activation: CaptionSceneSkillActivation
  multiTrackLikely: boolean
  depthMaskOrTrackingLikely: boolean
  requestedTreatment:
    CaptionEarlyPlanningInput['scenes'][number]['requestedTreatment']
  crossSystemTarget: CaptionSourceLedCrossSystemTarget | null
  trackingJobType: TrackingJobType | null
  boundaryAssignments: Array<{
    boundaryId: string
    jobTypes: CaptionsSupportedJobType[]
    reasonCode: string
  }>
}

interface CaptionSourceLedPlanningPolicy {
  projectMode: CaptionEarlyPlanningInput['projectMode']
  allowedTypographyRoles: string[]
  maximumMotionLevel:
    CaptionEarlyPlanningInput['constraints']['maximumMotionLevel']
  maximumHeroMoments: number
  subjectOverlapAllowed: boolean
  objectAnchoringAllowed: boolean
  captionToVisualAllowed: boolean
  captionSoundAllowed: boolean
  scenes: CaptionSourceLedScenePlan[]
}

interface PlanningSourceScene {
  sceneId: string
  startFrame: number
  endFrameExclusive: number
  sourcePhraseIds: string[]
  speechRole: 'none' | 'primary'
  visualDensity: 'low' | 'moderate' | 'high'
  reasonCodes: string[]
}

/**
 * Canonical preapproval owner for the normal source-led route. It consumes
 * only the already-reread source-analysis authority and existing Caption
 * planners. It performs no transcript, provider, media, render, dispatch,
 * approval, credit, asset, QA-approval, delivery, or production action.
 */
export function createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort(
  input: {
    readonly components: CanonicalPlanComponentsInput
    readonly sourceCleanupAuthority?:
      CanonicalSourceLedCleanupAuthorityInput
    readonly confirmedCaptionMarkerSetRef: CaptionDomainRef | null
  },
): CanonicalCaptionSourceLedProfessionalPlanningReadPort {
  const expectedComponentsDigest = sha256AuthorityValue(input.components)
  const skillPlan = input.components.professionalSkillPlan
  if (!skillPlan || !('compositionTrace' in skillPlan)) {
    throw new Error(
      'Canonical source-led Caption planning requires the exact professional-skill composition trace from the plan components.',
    )
  }
  const trace = parseProfessionalSkillCompositionTrace(
    skillPlan.compositionTrace)
  const disposition = trace.entries[0].disposition

  return createCanonicalCaptionSourceLedProfessionalPlanningReadPort(
    async (request) => {
      assertExactOwnerRequest({
        request,
        expectedComponentsDigest,
        confirmedCaptionMarkerSetRef: input.confirmedCaptionMarkerSetRef,
      })
      if (disposition === 'unresolved') {
        return {
          schemaVersion:
            CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
          status: 'not_requested',
          requestRef: requestRef(request),
          authority: null,
          blockerCodes: [],
        }
      }
      if (disposition === 'selected' && !input.sourceCleanupAuthority) {
        return {
          schemaVersion:
            CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
          status: 'blocked_requested',
          requestRef: requestRef(request),
          authority: null,
          blockerCodes: [
            'canonical_caption_source_analysis_evidence_not_ready',
          ],
        }
      }

      const sourcePlanning = input.sourceCleanupAuthority
        ? sourcePlanningFromAuthority({
            authority: input.sourceCleanupAuthority,
            components: input.components,
            request,
          })
        : null
      if (
        disposition === 'selected' &&
        (!sourcePlanning || sourcePlanning.scenes.every(
          (scene) => scene.speechRole === 'none'))
      ) {
        return {
          schemaVersion:
            CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
          status: 'blocked_requested',
          requestRef: requestRef(request),
          authority: null,
          blockerCodes: ['canonical_captionable_speech_evidence_not_ready'],
        }
      }

      const restrained = disposition === 'restrained'
      const earlyPlanning = createEarlyPlanningInput({
        request,
        components: input.components,
        trace,
        sourcePlanning,
        restrained,
      })
      const { earlyPlanningInput, policy } = earlyPlanning
      const bundle = createCaptionEarlyPlanningBundle(earlyPlanningInput)
      const bindingBody: Omit<
        CanonicalCaptionSpecialistPlanningBindingV1,
        'schemaVersion' | 'bindingDigestSha256'
      > = {
        bindingId: `${bundle.bundleId}.binding`,
        canonicalScope: structuredClone(request.canonicalScope),
        confirmedOutputFrame: structuredClone(request.confirmedOutputFrame),
        professionalSkillCompositionTraceRef: traceRef(trace),
        earlyPlanningBundleRef: bundleRef(bundle),
        canonicalTranscriptRef: earlyPlanningInput.canonicalTranscriptRef,
        masterTimingRef: structuredClone(request.masterTimingRef),
        captionEstimateInputRef: {
          id: bundle.estimateInput.componentId,
          version: bundle.estimateInput.componentVersion,
          contentHash: bundle.estimateInput.componentDigestSha256,
        },
        scenePolicies: restrained ? [] : policy.scenes
          .filter((scene) => scene.speechRole !== 'none')
          .map((scene) => ({
            sceneId: scene.sceneId,
            trackingJobType: scene.trackingJobType,
            crossSystemTarget: scene.crossSystemTarget,
          })),
        privateArtifact: true,
        byteFree: true,
        rawChatIncluded: false,
        transcriptTextIncluded: false,
        mediaBytesIncluded: false,
        pathsUrlsOrCredentialsIncluded: false,
        approvedSnapshotPredictedOrInjected: false,
        workCreationAuthorityGrantedToCaption: false,
        operationDispatchAuthorityGranted: false,
        providerRuntimeAuthorityGranted: false,
        assetMutationAuthorityGranted: false,
        finalQaApprovalAuthorityGranted: false,
        billingAuthorityGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      }
      const {
        canonicalTranscriptRef: canonicalTranscriptExpectationRef,
        ...selectedBindingBody
      } = bindingBody
      const binding = restrained
        ? createRestrainedPlanningBinding(bindingBody)
        : createCanonicalCaptionSpecialistPlanningBindingV3({
            ...selectedBindingBody,
            canonicalTranscriptExpectationRef,
            postapprovalCanonicalTranscriptResolutionRequired: true,
            assignmentIntents: createAssignmentIntents({
              request,
              bundle,
              policy,
            }),
            assignmentsSelectedByCanonicalPlanOwner: true,
            oneAllFeatureEditFabricated: false,
          })
      const estimateMetadata:
      CanonicalCaptionSpecialistEstimateBindingMetadata = {
        schemaVersion:
          CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
        outputId: request.canonicalScope.outputId,
        compositionTraceRef: traceRef(trace),
        earlyPlanningBundleRef: bundleRef(bundle),
        captionEstimateInputRef: binding.captionEstimateInputRef,
        selectedComponentKeys: ['caption_design', 'caption_render_qa'],
        estimateOwnerRemainsCanonical: true,
        serviceFeeIncludedInCaptionWorkCost: false,
        billingAuthorityGrantedToCaption: false,
      }
      const authority =
        createCanonicalCaptionSourceLedProfessionalPlanningAuthority({
          request,
          professionalSkillPlan: { compositionTrace: trace },
          captionEarlyPlanningBundle: bundle,
          captionSpecialistPlanningBinding: binding,
          captionEstimateLine: restrained ? null : {
            lineKey: `caption-professional.${request.requestDigestSha256.slice(0, 24)}`,
            label: 'Caption specialist planning, rendering, and private review',
            category: 'caption_specialist',
            estimatedCredits: estimateCaptionCredits(bundle),
            removable: false,
            metadata: estimateMetadata,
          },
        })
      return {
        schemaVersion:
          CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
        status: 'ready',
        requestRef: requestRef(request),
        authority,
        blockerCodes: [],
      }
    },
  )
}

function sourcePlanningFromAuthority(input: {
  authority: CanonicalSourceLedCleanupAuthorityInput
  components: CanonicalPlanComponentsInput
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
}): {
  transcriptRef: CaptionDomainRef
  speechEvidenceRef: CaptionDomainRef
  visualEvidenceRef: CaptionDomainRef
  scenes: PlanningSourceScene[]
} {
  const evidence = verifyCanonicalSourceLedContentAnalysisEvidence(
    input.authority.evidence,
  )
  const binding = assertCanonicalSourceCleanupBindingMatchesEvidence({
    binding: input.authority.binding,
    evidence,
  })
  if (
    binding.scope.workspaceId !== input.request.canonicalScope.workspaceId ||
    binding.scope.projectId !== input.request.canonicalScope.projectId ||
    binding.scope.editSessionId !==
      input.request.canonicalScope.editSessionId
  ) {
    throw new Error(
      'Canonical Caption planning rejected crossed source-analysis scope.',
    )
  }
  const selectedDecisions = binding.sources.flatMap((source) =>
    source.decisionPartition
      .filter((decision) => decision.action === 'keep')
      .map((decision) => ({ source, decision })),
  )
  const scenes = input.components.segments.map((segment) => {
    const matches = selectedDecisions.filter(({ decision }) =>
      decision.timelineStartFrame === segment.startFrame &&
      decision.timelineEndFrameExclusive === segment.endFrameExclusive)
    if (matches.length !== 1) {
      throw new Error(
        'Canonical Caption planning requires one exact source decision for every MasterTiming segment.',
      )
    }
    const { source, decision } = matches[0]!
    const evidenceSource = evidence.sources.find((item) =>
      item.sourceSequenceItemId === source.sourceSequenceItemId &&
      item.mediaAssetId === source.mediaAssetId &&
      item.uploadedOrder === source.uploadedOrder)
    if (!evidenceSource) {
      throw new Error(
        'Canonical Caption planning lost its exact source-analysis evidence.',
      )
    }
    const phraseSegments = evidenceSource.transcript.segments.filter(
      (phrase) => rangesOverlap(
        phrase.startFrame,
        phrase.endFrameExclusive,
        decision.sourceStartFrame,
        decision.sourceEndFrameExclusive,
      ),
    )
    const visualObservations = evidenceSource.visual.observations.filter(
      (observation) => rangesOverlap(
        observation.startFrame,
        observation.endFrameExclusive,
        decision.sourceStartFrame,
        decision.sourceEndFrameExclusive,
      ),
    )
    const unverifiedPhraseCount = phraseSegments.filter(
      (phrase) => !phrase.wordsVerified,
    ).length
    return {
      sceneId: segment.segmentId,
      startFrame: segment.startFrame,
      endFrameExclusive: segment.endFrameExclusive,
      sourcePhraseIds: phraseSegments.map((phrase) =>
        derivedId('caption-source-phrase', {
          sourceSequenceItemId: source.sourceSequenceItemId,
          transcriptSegmentId: phrase.segmentId,
        })),
      speechRole: phraseSegments.length > 0 ? 'primary' as const : 'none' as const,
      visualDensity: visualDensity(visualObservations),
      reasonCodes: [
        phraseSegments.length > 0
          ? 'canonical_source_speech_requires_caption_planning'
          : 'canonical_source_scene_has_no_captionable_speech',
        ...(unverifiedPhraseCount > 0
          ? ['source_words_require_postapproval_integrity_review'] : []),
        'spatial_safe_region_requires_authenticated_visual_support',
      ],
    }
  })
  const transcriptProjection = binding.sources.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId,
    transcriptDigestSha256: source.transcriptDigestSha256,
    transcriptCoverageDigestSha256: source.transcriptCoverageDigestSha256,
  }))
  const visualProjection = binding.sources.map((source) => ({
    sourceSequenceItemId: source.sourceSequenceItemId,
    visualRequestRef: source.visualRequestRef,
    visualReportRef: source.visualReportRef,
    visualCoverageDigestSha256: source.visualCoverageDigestSha256,
  }))
  const evidenceHash = unprefixedSha256(
    binding.sourceAnalysisEvidenceRef.contentHash)
  return {
    transcriptRef: {
      id: derivedId('caption-source-transcript', transcriptProjection),
      version: 'canonical-source-transcript-planning-evidence-v1',
      contentHash: sha256AuthorityValue(transcriptProjection),
    },
    speechEvidenceRef: {
      id: binding.sourceAnalysisEvidenceRef.id,
      version:
        `canonical-source-led-content-analysis-evidence-v${binding.sourceAnalysisEvidenceRef.version}`,
      contentHash: evidenceHash,
    },
    visualEvidenceRef: {
      id: derivedId('caption-source-visual', visualProjection),
      version: 'canonical-source-visual-planning-evidence-v1',
      contentHash: sha256AuthorityValue(visualProjection),
    },
    scenes,
  }
}

function createRestrainedPlanningBinding(
  body: Omit<CanonicalCaptionSpecialistPlanningBindingV1,
    'schemaVersion' | 'bindingDigestSha256'>,
): CanonicalCaptionSpecialistPlanningBindingV1 {
  const withoutDigest: Omit<
    CanonicalCaptionSpecialistPlanningBindingV1,
    'bindingDigestSha256'
  > = {
    ...structuredClone(body),
    schemaVersion: CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION,
  }
  return parseCanonicalCaptionSpecialistPlanningBinding({
    ...withoutDigest,
    bindingDigestSha256:
      calculateCanonicalCaptionSpecialistPlanningBindingDigest(
        withoutDigest),
  }) as CanonicalCaptionSpecialistPlanningBindingV1
}

function createEarlyPlanningInput(input: {
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  components: CanonicalPlanComponentsInput
  trace: ReturnType<typeof parseProfessionalSkillCompositionTrace>
  sourcePlanning: ReturnType<typeof sourcePlanningFromAuthority> | null
  restrained: boolean
}): {
  earlyPlanningInput: CaptionEarlyPlanningInput
  policy: CaptionSourceLedPlanningPolicy
} {
  const ratioDivisor = gcd(
    input.request.confirmedOutputFrame.width,
    input.request.confirmedOutputFrame.height,
  )
  const fallbackEvidenceRef = (role: string): CaptionDomainRef => ({
    id: `${input.request.requestId}.${role}`,
    version: 'caption-planning-not-applicable-ref-v1',
    contentHash: sha256AuthorityValue({
      requestDigestSha256: input.request.requestDigestSha256,
      role,
      restrained: input.restrained,
    }),
  })
  const sourcePlanning = input.sourcePlanning
  const scenes = sourcePlanning?.scenes ?? input.components.segments.map(
    (segment) => ({
      sceneId: segment.segmentId,
      startFrame: segment.startFrame,
      endFrameExclusive: segment.endFrameExclusive,
      sourcePhraseIds: [],
      speechRole: 'none' as const,
      visualDensity: 'low' as const,
      reasonCodes: ['caption_work_restrained_without_source_evidence'],
    }),
  )
  const policy = createCaptionSourceLedPlanningPolicy({
    components: input.components,
    scenes,
    restrained: input.restrained,
  })
  const maxCredits = maximumCaptionCredits(
    input.components.confirmedSettings.editLevel)
  const earlyPlanningInput: CaptionEarlyPlanningInput = {
    bundleId:
      `caption-source-led.${input.request.requestDigestSha256.slice(0, 32)}.early`,
    canonicalScope: {
      ownerUserId: input.request.canonicalScope.ownerUserId,
      workspaceId: input.request.canonicalScope.workspaceId,
      projectId: input.request.canonicalScope.projectId,
      editSessionId: input.request.canonicalScope.editSessionId,
      planVersionId: input.request.canonicalScope.planningRequestId,
      approvedSnapshotRef: null,
      outputId: input.request.canonicalScope.outputId,
      sceneId: null,
      authorizedFrameRanges: [{
        startFrame: 0,
        endFrameExclusive: input.request.totalFrames,
      }],
    },
    captionCompositeRef: {
      id: CAPTION_DESIGN_COMPOSITE.compositeId,
      version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
      contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
    },
    compiledIntentRef: structuredClone(
      input.request.baseCanonicalPlanComponentsRef),
    professionalSkillTraceRef: traceRef(input.trace),
    confirmedOutputFrame: {
      outputId: input.request.canonicalScope.outputId,
      width: input.request.confirmedOutputFrame.width,
      height: input.request.confirmedOutputFrame.height,
      aspectRatioNumerator:
        input.request.confirmedOutputFrame.width / ratioDivisor,
      aspectRatioDenominator:
        input.request.confirmedOutputFrame.height / ratioDivisor,
      confirmedOutputFrameDigestSha256:
        input.request.confirmedOutputFrame.confirmedOutputFrameRef.contentHash,
    },
    canonicalTranscriptRef: sourcePlanning?.transcriptRef ??
      fallbackEvidenceRef('transcript'),
    sourceSpeechEvidenceRef: sourcePlanning?.speechEvidenceRef ??
      fallbackEvidenceRef('speech'),
    sourceVisualUnderstandingRef: sourcePlanning?.visualEvidenceRef ??
      fallbackEvidenceRef('visual'),
    editPreferencesRef: {
      id: `${input.request.requestId}.preferences`,
      version: 'canonical-source-led-edit-preferences-v1',
      contentHash: sha256AuthorityValue({
        confirmedSettings: input.components.confirmedSettings,
        professionalEditingDirective:
          input.components.professionalEditingDirective,
      }),
    },
    referenceDnaRef: null,
    planningTimingBasisRef: structuredClone(input.request.masterTimingRef),
    directive: input.restrained ? {
      disposition: 'no_captions',
      reasonCodes: ['owner_selected_no_captions'],
      ownerApprovedRestraintRef: {
        id: derivedId('caption-no-captions-restraint', {
          traceId: input.trace.traceId,
          traceDigestSha256: input.trace.traceDigestSha256,
        }),
        version: input.trace.schemaVersion,
        contentHash: input.trace.traceDigestSha256,
      },
    } : {
      disposition: 'caption_design_selected',
      reasonCodes: ['caption_design_selected_by_professional_trace'],
      ownerApprovedRestraintRef: null,
    },
    projectMode: policy.projectMode,
    primaryLanguage: 'und',
    requestedLanguages: ['und'],
    accessibleOutputKinds: input.restrained
      ? [] : ['srt', 'webvtt', 'stable_burn_in'],
    constraints: {
      allowedTypographyRoles: policy.allowedTypographyRoles,
      maximumMotionLevel: policy.maximumMotionLevel,
      maximumHeroMoments: policy.maximumHeroMoments,
      subjectOverlapAllowed: policy.subjectOverlapAllowed,
      objectAnchoringAllowed: policy.objectAnchoringAllowed,
      captionToVisualAllowed: policy.captionToVisualAllowed,
      captionSoundAllowed: policy.captionSoundAllowed,
      allowedTextTransformations: ['exact', 'punctuation_cleanup'],
      requestedMaximumCaptionCredits: input.restrained ? 0 : maxCredits,
      fallbackIds: input.restrained ? [] : [
        'fallback.stable_libass',
        'fallback.safe_top_plane',
      ],
    },
    scenes: policy.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      planningFrameRange: {
        startFrame: scene.startFrame,
        endFrameExclusive: scene.endFrameExclusive,
      },
      sourcePhraseIds: scene.sourcePhraseIds,
      speechRole: scene.speechRole,
      semanticImportanceBasisPoints:
        scene.speechRole === 'none'
          ? 0
          : scene.activation.activeComponentSkillIds.includes(
            'hero_typography_direction') ? 9_500 : 8_000,
      visualDensity: scene.visualDensity,
      multiTrackLikely: scene.multiTrackLikely,
      depthMaskOrTrackingLikely: scene.depthMaskOrTrackingLikely,
      requestedTreatment: scene.requestedTreatment,
      crossSystemTarget: scene.crossSystemTarget,
      candidateSafeRegions: [],
      reasonCodes: scene.reasonCodes,
    })),
  }
  return { earlyPlanningInput, policy }
}

function createAssignmentIntents(input: {
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  bundle: ReturnType<typeof createCaptionEarlyPlanningBundle>
  policy: CaptionSourceLedPlanningPolicy
}): CanonicalCaptionSpecialistJobAssignmentIntent[] {
  const selectionEvidenceRef = bundleRef(input.bundle)
  const assignments: Array<{
    jobType: CaptionsSupportedJobType
    scopeLevel: 'video' | 'scene' | 'boundary'
    sceneId: string | null
    boundaryId: string | null
    frameRange: { startFrame: number; endFrameExclusive: number }
    reasonCode: string
  }> = [
    ...CAPTIONS_VIDEO_JOB_TYPES.map((jobType) => ({
      jobType,
      scopeLevel: 'video' as const,
      sceneId: null,
      boundaryId: null,
      frameRange: {
        startFrame: 0,
        endFrameExclusive: input.request.totalFrames,
      },
      reasonCode: 'required_caption_video_planning_lifecycle',
    })),
    ...input.policy.scenes
      .filter((scene) => scene.speechRole !== 'none')
      .flatMap((scene) => {
        const frameRange = {
          startFrame: scene.startFrame,
          endFrameExclusive: scene.endFrameExclusive,
        }
        const integrationClass = input.bundle.integrationClassification
          .sceneClassifications.find((item) =>
            item.sceneId === scene.sceneId)?.integrationClass ?? null
        const advancedJobTypes = new Set<CaptionsSupportedJobType>()
        const active = new Set(scene.activation.activeComponentSkillIds)
        if (scene.multiTrackLikely
          || active.has('caption_speaker_identification')) {
          advancedJobTypes.add('resolve_multi_track_caption_scene')
        }
        if (integrationClass === 'reserved_composition'
          || active.has('spatial_caption_compositing')) {
          advancedJobTypes.add('resolve_spatial_typography')
        }
        if (active.has('subject_occluded_typography')) {
          advancedJobTypes.add('resolve_subject_occluded_typography')
        }
        if (scene.trackingJobType ===
          'resolve_front_of_subject_typography') {
          advancedJobTypes.add('resolve_front_of_subject_typography')
        }
        if (active.has('object_anchored_typography')) {
          advancedJobTypes.add('resolve_object_anchored_typography')
        }
        if (active.has('environmental_typography')) {
          advancedJobTypes.add('resolve_environmental_typography')
        }
        if (active.has('hero_typography_direction')) {
          advancedJobTypes.add('resolve_hero_typography')
        }
        if (active.has('persistent_topic_list_typography')) {
          advancedJobTypes.add('resolve_persistent_topic_typography')
        }
        return [
          ...REQUIRED_SOURCE_LED_SCENE_JOBS.map((jobType) => ({
            jobType,
            scopeLevel: 'scene' as const,
            sceneId: scene.sceneId,
            boundaryId: null,
            frameRange,
            reasonCode: 'required_caption_scene_lifecycle',
          })),
          ...[...advancedJobTypes].map((jobType) => ({
            jobType,
            scopeLevel: 'scene' as const,
            sceneId: scene.sceneId,
            boundaryId: null,
            frameRange,
            reasonCode: 'selected_by_caption_scene_skill_activation',
          })),
          ...scene.boundaryAssignments.flatMap((boundary) =>
            boundary.jobTypes.map((jobType) => ({
              jobType,
              scopeLevel: 'boundary' as const,
              sceneId: scene.sceneId,
              boundaryId: boundary.boundaryId,
              frameRange,
              reasonCode: boundary.reasonCode,
            }))),
        ]
      }),
  ]
  return assignments.map(({
    jobType,
    scopeLevel,
    sceneId,
    boundaryId,
    frameRange,
    reasonCode,
  }) => {
    return {
      assignmentId: derivedId('caption-source-led-assignment', {
        outputId: input.request.canonicalScope.outputId,
        jobType,
        scopeLevel,
        sceneId,
        boundaryId,
        frameRange,
      }),
      jobType,
      scopeLevel,
      outputId: input.request.canonicalScope.outputId,
      sceneId,
      boundaryId,
      authorizedFrameRange: structuredClone(frameRange),
      trigger: canonicalCaptionAssignmentTriggerForJob(jobType),
      selectionEvidenceRef,
      sourceSupportRequestRef: null,
      reasonCodes: [
        'selected_for_canonical_source_led_caption_plan',
        reasonCode,
      ],
      callerMayCreateWork: false,
      captionMayDispatchPeerDirectly: false,
      captionMayExpandScope: false,
      browserMayMarkComplete: false,
    }
  })
}

function createCaptionSourceLedPlanningPolicy(input: {
  components: CanonicalPlanComponentsInput
  scenes: PlanningSourceScene[]
  restrained: boolean
}): CaptionSourceLedPlanningPolicy {
  const directive = professionalCaptionDirectiveSchema.parse(
    input.components.professionalEditingDirective)
  const trustedPresetIds = new Set<string>()
  if (!input.restrained) {
    for (const customDirective of directive.customDirectives) {
      if (typeof customDirective === 'string'
        || customDirective.confidence !== 'high'
        || customDirective.clarifyingQuestions.length > 0) continue
      for (const presetId of customDirective.mappedPresetIds) {
        trustedPresetIds.add(presetId)
      }
    }
  }
  const advancedPresetIds = new Set<CaptionSourceLedAdvancedPresetId>(
    CAPTION_SOURCE_LED_ADVANCED_PRESET_IDS.filter((presetId) =>
      trustedPresetIds.has(presetId)),
  )
  const targetEntries = Object.entries(
    CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS,
  ).filter(([, presetId]) => trustedPresetIds.has(presetId)) as Array<[
    CaptionSourceLedCrossSystemTarget,
    string,
  ]>
  const brollCoComposition = advancedPresetIds.has(
    'caption_broll_co_composition')
  if (targetEntries.length > 1
    || (brollCoComposition && targetEntries.length === 1
      && targetEntries[0]![0] !== 'broll')) {
    throw new Error(
      'Canonical Caption planning requires scene-scoped clarification for multiple cross-system targets.',
    )
  }
  const bridgeRequested = advancedPresetIds.has('caption_to_visual_bridge')
    || brollCoComposition
  const crossSystemTarget = targetEntries[0]?.[0]
    ?? (brollCoComposition ? 'broll' as const : null)
  if ((bridgeRequested && crossSystemTarget === null)
    || (!bridgeRequested && crossSystemTarget !== null)) {
    throw new Error(
      'Canonical Caption-to-Visual planning requires both an exact bridge preset and one exact receiver target.',
    )
  }
  const captionSoundRequested = advancedPresetIds.has(
    'caption_sound_choreography')
  if (captionSoundRequested && directive.soundStyle === 'clean_voice_only') {
    throw new Error(
      'Canonical Caption sound choreography conflicts with the compiled clean-voice-only directive.',
    )
  }

  const captionableSceneIndexes = input.scenes.flatMap((scene, index) =>
    scene.speechRole === 'none' ? [] : [index])
  const sceneFeatures = input.scenes.map(() => ({
    multiTrack: false,
    spatialComposition: false,
    trackingJobType: null as TrackingJobType | null,
    persistentTopic: false,
    hero: false,
    crossSystemTarget: null as CaptionSourceLedCrossSystemTarget | null,
    sound: false,
    cameraCoordination: false,
  }))
  let nextFeatureScene = 0
  const nextSceneIndex = (): number | null => {
    if (captionableSceneIndexes.length === 0) return null
    const sceneIndex = captionableSceneIndexes[
      nextFeatureScene % captionableSceneIndexes.length]!
    nextFeatureScene += 1
    return sceneIndex
  }
  if (!input.restrained && captionableSceneIndexes.length > 0) {
    if (advancedPresetIds.has('caption_speaker_identification')) {
      sceneFeatures[nextSceneIndex()!].multiTrack = true
    }
    if (advancedPresetIds.has('spatial_caption_compositing')) {
      sceneFeatures[nextSceneIndex()!].spatialComposition = true
    }
    const trackingRequests: TrackingJobType[] = [
      ...(advancedPresetIds.has('subject_occluded_typography')
        ? ['resolve_subject_occluded_typography' as const] : []),
      ...(advancedPresetIds.has('front_of_subject_typography')
        ? ['resolve_front_of_subject_typography' as const] : []),
      ...(advancedPresetIds.has('object_anchored_typography')
        ? ['resolve_object_anchored_typography' as const] : []),
      ...(advancedPresetIds.has('environmental_typography')
        ? ['resolve_environmental_typography' as const] : []),
    ]
    if (trackingRequests.length > captionableSceneIndexes.length) {
      throw new Error(
        'Canonical Caption planning requires scene-scoped clarification for multiple tracking treatments.',
      )
    }
    trackingRequests.forEach((jobType, index) => {
      sceneFeatures[captionableSceneIndexes[index]!]!.trackingJobType = jobType
      nextFeatureScene = Math.max(nextFeatureScene, index + 1)
    })
    if (advancedPresetIds.has('persistent_topic_list_typography')) {
      sceneFeatures[nextSceneIndex()!].persistentTopic = true
    }
    if (advancedPresetIds.has('hero_typography_direction')) {
      sceneFeatures[nextSceneIndex()!].hero = true
    }
    if (crossSystemTarget !== null) {
      sceneFeatures[nextSceneIndex()!].crossSystemTarget = crossSystemTarget
    }
    if (captionSoundRequested) {
      sceneFeatures[nextSceneIndex()!].sound = true
    }
    if (advancedPresetIds.has('caption_camera_coordination')) {
      sceneFeatures[nextSceneIndex()!].cameraCoordination = true
    }
  }

  const styleIntegrations = captionStyleIntegrationClasses(
    directive.captionStyle)
  const plans = input.scenes.map((scene, index): CaptionSourceLedScenePlan => {
    const features = sceneFeatures[index]!
    const integrationClasses = new Set<CaptionIntegrationClass>(
      scene.speechRole === 'none' || input.restrained
        ? [] : styleIntegrations)
    if (features.trackingJobType ===
      'resolve_subject_occluded_typography') {
      integrationClasses.add('subject_occluded')
    }
    if (features.trackingJobType ===
      'resolve_front_of_subject_typography') {
      integrationClasses.add('spatial_composite')
    }
    if (features.trackingJobType ===
      'resolve_object_anchored_typography') {
      integrationClasses.add('object_anchored')
    }
    if (features.trackingJobType ===
      'resolve_environmental_typography') {
      integrationClasses.add('environmental')
    }
    if (features.spatialComposition || features.cameraCoordination) {
      integrationClasses.add('spatial_composite')
    }
    if (features.persistentTopic) integrationClasses.add('persistent_topic')
    if (features.hero) integrationClasses.add('hero')
    if (features.crossSystemTarget !== null) {
      integrationClasses.add('caption_to_visual')
    }
    const activation = activateCaptionMiniSkillsForScene({
      sceneId: scene.sceneId,
      sceneDigestSha256: sha256AuthorityValue({
        scene,
        integrationClasses: [...integrationClasses],
        trustedPresetIds: [...trustedPresetIds].sort(),
      }),
      captionPolicy: input.restrained ? 'no_captions' : 'captions',
      integrationClasses: [...integrationClasses],
      requestedLegacySkillIds: [],
      features: {
        multiSpeaker: features.multiTrack,
        brollCoComposition: features.crossSystemTarget === 'broll',
        cameraCoordination: features.cameraCoordination,
        soundChoreography: features.sound,
        multilingual: false,
        reducedMotion: !input.restrained,
        claimSensitive: false,
        quoteSensitive: false,
        needsRevisionAnalysis: false,
      },
    })
    const reservedComposition = features.multiTrack
      || features.spatialComposition
      || features.cameraCoordination
      || features.trackingJobType !== null
      || features.persistentTopic
      || integrationClasses.has('spatial_composite')
    const requestedTreatment = features.crossSystemTarget !== null
      ? 'cross_system_transform' as const
      : features.hero
        ? 'structural_typography' as const
        : reservedComposition
          ? 'reserved_composition' as const
          : 'auto' as const
    const boundaryAssignments: CaptionSourceLedScenePlan[
      'boundaryAssignments'] = []
    if (features.crossSystemTarget !== null) {
      const transitionJobs: CaptionsSupportedJobType[] =
        features.crossSystemTarget === 'transition'
          ? [
              'resolve_caption_mode_transition',
              'prepare_caption_boundary_timing_requirements',
              'provide_typographic_transition_support',
            ] : []
      boundaryAssignments.push({
        boundaryId: derivedId('caption-cross-system-boundary', {
          sceneId: scene.sceneId,
          target: features.crossSystemTarget,
        }),
        jobTypes: ['plan_caption_to_visual_handoff', ...transitionJobs],
        reasonCode: 'selected_caption_to_visual_boundary_requirement',
      })
    }
    if (features.sound && features.crossSystemTarget !== 'transition') {
      boundaryAssignments.push({
        boundaryId: derivedId('caption-sound-boundary', {
          sceneId: scene.sceneId,
          soundStyle: directive.soundStyle,
        }),
        jobTypes: [
          'prepare_caption_boundary_timing_requirements',
          'provide_typographic_transition_support',
        ],
        reasonCode: 'selected_caption_sound_timing_requirement',
      })
    }
    return {
      ...scene,
      activation,
      multiTrackLikely: features.multiTrack,
      depthMaskOrTrackingLikely: features.trackingJobType !== null,
      requestedTreatment,
      crossSystemTarget: features.crossSystemTarget,
      trackingJobType: features.trackingJobType,
      boundaryAssignments,
      reasonCodes: [
        ...scene.reasonCodes,
        `structured_caption_style.${directive.captionStyle}`,
        ...[...integrationClasses].map((integrationClass) =>
          `caption_integration.${integrationClass}`),
      ],
    }
  })
  const roles = new Set<string>(input.restrained ? [] : ['primary_speech'])
  if (advancedPresetIds.has('caption_speaker_identification')) {
    roles.add('speaker_identification')
  }
  if (advancedPresetIds.has('hero_typography_direction')) roles.add('hero')
  if (advancedPresetIds.has('persistent_topic_list_typography')) {
    roles.add('persistent_topic')
  }
  if (plans.some((scene) => scene.requestedTreatment ===
    'reserved_composition')) roles.add('spatial_support')
  const expressive = directive.captionStyle === 'bold_social_captions'
    || directive.captionStyle === 'keyword_emphasis_captions'
    || directive.captionStyle === 'karaoke_word_by_word'
    || advancedPresetIds.has('hero_typography_direction')
    || captionSoundRequested
  const lowCompute = input.components.confirmedSettings.editLevel === 'basic'
    || input.components.confirmedSettings.editLevel === 'normal'
  return {
    projectMode: captionProjectMode(directive),
    allowedTypographyRoles: [...roles],
    maximumMotionLevel: input.restrained
      ? 'none' : lowCompute ? 'restrained' : expressive ? 'expressive' : 'moderate',
    maximumHeroMoments: input.restrained
      ? 0 : advancedPresetIds.has('hero_typography_direction') ? 1 : 0,
    subjectOverlapAllowed: !input.restrained
      && (advancedPresetIds.has('subject_occluded_typography')
        || advancedPresetIds.has('front_of_subject_typography')),
    objectAnchoringAllowed: !input.restrained
      && (advancedPresetIds.has('object_anchored_typography')
        || advancedPresetIds.has('environmental_typography')),
    captionToVisualAllowed: !input.restrained && crossSystemTarget !== null,
    captionSoundAllowed: !input.restrained && captionSoundRequested,
    scenes: plans,
  }
}

function captionStyleIntegrationClasses(
  captionStyle: string,
): CaptionIntegrationClass[] {
  if (captionStyle === 'bold_social_captions'
    || captionStyle === 'keyword_emphasis_captions') return ['active_word']
  if (captionStyle === 'karaoke_word_by_word') return ['semantic_kinetic']
  if (captionStyle === 'sentence_block_captions'
    || captionStyle === 'caption_icon_callout') return ['spatial_composite']
  return ['clean_phrase']
}

function captionProjectMode(
  directive: z.infer<typeof professionalCaptionDirectiveSchema>,
): CaptionEarlyPlanningInput['projectMode'] {
  if (directive.editStyle === 'education_explainer'
    || directive.captionStyle === 'education_label_captions'
    || directive.pacingStyle === 'educational_structured') {
    return 'educational_explainer'
  }
  if (directive.editStyle === 'documentary_evidence'
    || directive.editStyle === 'cinematic_story'
    || directive.captionStyle === 'documentary_lower_third'
    || directive.pacingStyle === 'documentary_measured') {
    return 'cinematic_editorial'
  }
  if (directive.captionStyle === 'minimal_accessibility_captions') {
    return 'accessibility_first'
  }
  if (directive.editStyle === 'business_product'
    || directive.editStyle === 'premium_clean'
    || directive.editStyle === 'luxury_real_estate') return 'brand_directed'
  if (directive.editStyle === 'high_retention_social'
    || directive.editStyle === 'energetic_creator'
    || directive.pacingStyle === 'fast_social'
    || directive.pacingStyle === 'high_retention'
    || directive.captionStyle === 'bold_social_captions'
    || directive.captionStyle === 'keyword_emphasis_captions'
    || directive.captionStyle === 'karaoke_word_by_word') {
    return 'dynamic_short_form'
  }
  return 'clean_long_form'
}

function estimateCaptionCredits(
  bundle: ReturnType<typeof createCaptionEarlyPlanningBundle>,
): number {
  const ceiling = bundle.approvalEnvelope.requestedMaximumCaptionCredits
  const factorQuantity = bundle.estimateInput.factors.reduce(
    (total, factor) => total + factor.quantity,
    0,
  )
  return Math.max(1, Math.min(ceiling, factorQuantity))
}

function maximumCaptionCredits(
  editLevel: CanonicalPlanComponentsInput['confirmedSettings']['editLevel'],
): number {
  if (editLevel === 'basic' || editLevel === 'normal') return 20
  if (editLevel === 'pro') return 40
  return 80
}

function visualDensity(
  observations: readonly {
    actionIntensity: 'none' | 'low' | 'medium' | 'high'
    editUsability: 'strong' | 'usable' | 'weak' | 'reject'
  }[],
): PlanningSourceScene['visualDensity'] {
  if (observations.some((item) =>
    item.actionIntensity === 'high' || item.editUsability === 'reject')) {
    return 'high'
  }
  if (observations.some((item) =>
    item.actionIntensity === 'medium' || item.editUsability === 'weak')) {
    return 'moderate'
  }
  return 'low'
}

function assertExactOwnerRequest(input: {
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  expectedComponentsDigest: string
  confirmedCaptionMarkerSetRef: CaptionDomainRef | null
}): void {
  if (
    input.request.baseCanonicalPlanComponentsRef.contentHash !==
      input.expectedComponentsDigest ||
    !nullableExactRef(
      input.request.confirmedCaptionMarkerSetRef,
      input.confirmedCaptionMarkerSetRef)
  ) {
    throw new Error(
      'Canonical Caption source-led planning owner received stale or crossed plan evidence.',
    )
  }
}

function requestRef(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
): CaptionDomainRef {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function traceRef(
  trace: ReturnType<typeof parseProfessionalSkillCompositionTrace>,
): CaptionDomainRef {
  return {
    id: trace.traceId,
    version: trace.schemaVersion,
    contentHash: trace.traceDigestSha256,
  }
}

function bundleRef(
  bundle: ReturnType<typeof createCaptionEarlyPlanningBundle>,
): CaptionDomainRef {
  return {
    id: bundle.bundleId,
    version: bundle.schemaVersion,
    contentHash: bundle.bundleDigestSha256,
  }
}

function nullableExactRef(
  left: CaptionDomainRef | null,
  right: CaptionDomainRef | null,
): boolean {
  if (left === null || right === null) return left === right
  return left.id === right.id && left.version === right.version &&
    left.contentHash === right.contentHash
}

function rangesOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number,
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd
}

function unprefixedSha256(value: string): string {
  const normalized = value.startsWith('sha256:') ? value.slice(7) : value
  if (!/^[a-f0-9]{64}$/u.test(normalized)) {
    throw new Error('Canonical Caption source evidence digest is malformed.')
  }
  return normalized
}

function gcd(left: number, right: number): number {
  let a = left
  let b = right
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

function derivedId(prefix: string, value: unknown): string {
  return `${prefix}.${sha256AuthorityValue(value).slice(0, 48)}`
}
