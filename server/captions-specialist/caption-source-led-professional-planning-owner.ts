import type { CaptionEarlyPlanningInput } from
  '../../src/types/caption-early-planning'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
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
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  createProfessionalSkillPlan,
} from '../../src/lib/professional-skills/professional-skill-planner'
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
import { CAPTION_DESIGN_COMPOSITE } from './caption-design-composite'
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
    readonly plannerInput: PlannerInput
    readonly components: CanonicalPlanComponentsInput
    readonly sourceCleanupAuthority?:
      CanonicalSourceLedCleanupAuthorityInput
    readonly confirmedCaptionMarkerSetRef: CaptionDomainRef | null
  },
): CanonicalCaptionSourceLedProfessionalPlanningReadPort {
  const expectedComponentsDigest = sha256AuthorityValue(input.components)
  const skillPlan = createProfessionalSkillPlan({
    plannerInput: structuredClone(input.plannerInput),
  })
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
          status: 'not_requested',
          requestRef: requestRef(request),
          authority: null,
          blockerCodes: [],
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
      const earlyPlanningInput = createEarlyPlanningInput({
        request,
        components: input.components,
        trace,
        sourcePlanning,
        restrained,
      })
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
        scenePolicies: restrained ? [] : input.components.segments.map(
          (segment) => ({
            sceneId: segment.segmentId,
            trackingJobType: null,
            crossSystemTarget: null,
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
              trace,
              components: input.components,
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
}): CaptionEarlyPlanningInput {
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
  const maxCredits = maximumCaptionCredits(
    input.components.confirmedSettings.editLevel)
  return {
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
    projectMode: projectMode(input.components),
    primaryLanguage: 'und',
    requestedLanguages: ['und'],
    accessibleOutputKinds: input.restrained
      ? [] : ['srt', 'webvtt', 'stable_burn_in'],
    constraints: {
      allowedTypographyRoles: input.restrained ? [] : ['primary_speech'],
      maximumMotionLevel: input.restrained
        ? 'none' : input.components.confirmedSettings.editLevel === 'basic'
          ? 'restrained' : 'moderate',
      maximumHeroMoments: 0,
      subjectOverlapAllowed: false,
      objectAnchoringAllowed: false,
      captionToVisualAllowed: false,
      captionSoundAllowed: false,
      allowedTextTransformations: ['exact', 'punctuation_cleanup'],
      requestedMaximumCaptionCredits: input.restrained ? 0 : maxCredits,
      fallbackIds: input.restrained ? [] : [
        'fallback.stable_libass',
        'fallback.safe_top_plane',
      ],
    },
    scenes: scenes.map((scene) => ({
      sceneId: scene.sceneId,
      planningFrameRange: {
        startFrame: scene.startFrame,
        endFrameExclusive: scene.endFrameExclusive,
      },
      sourcePhraseIds: scene.sourcePhraseIds,
      speechRole: scene.speechRole,
      semanticImportanceBasisPoints:
        scene.speechRole === 'primary' ? 8_000 : 0,
      visualDensity: scene.visualDensity,
      multiTrackLikely: false,
      depthMaskOrTrackingLikely: false,
      requestedTreatment: 'auto',
      crossSystemTarget: null,
      candidateSafeRegions: [],
      reasonCodes: scene.reasonCodes,
    })),
  }
}

function createAssignmentIntents(input: {
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest
  trace: ReturnType<typeof parseProfessionalSkillCompositionTrace>
  components: CanonicalPlanComponentsInput
}): CanonicalCaptionSpecialistJobAssignmentIntent[] {
  const selectionEvidenceRef = traceRef(input.trace)
  const assignments = [
    ...CAPTIONS_VIDEO_JOB_TYPES.map((jobType) => ({
      jobType,
      sceneId: null,
      frameRange: {
        startFrame: 0,
        endFrameExclusive: input.request.totalFrames,
      },
    })),
    ...input.components.segments.flatMap((segment) =>
      REQUIRED_SOURCE_LED_SCENE_JOBS.map((jobType) => ({
        jobType,
        sceneId: segment.segmentId,
        frameRange: {
          startFrame: segment.startFrame,
          endFrameExclusive: segment.endFrameExclusive,
        },
      }))),
  ]
  return assignments.map(({ jobType, sceneId, frameRange }) => {
    const videoLevel = (CAPTIONS_VIDEO_JOB_TYPES as readonly string[])
      .includes(jobType)
    return {
      assignmentId: derivedId('caption-source-led-assignment', {
        outputId: input.request.canonicalScope.outputId,
        jobType,
        sceneId,
        frameRange,
      }),
      jobType,
      scopeLevel: videoLevel ? 'video' : 'scene',
      outputId: input.request.canonicalScope.outputId,
      sceneId: videoLevel ? null : sceneId,
      boundaryId: null,
      authorizedFrameRange: structuredClone(frameRange),
      trigger: canonicalCaptionAssignmentTriggerForJob(jobType),
      selectionEvidenceRef,
      sourceSupportRequestRef: null,
      reasonCodes: ['selected_for_canonical_source_led_caption_plan'],
      callerMayCreateWork: false,
      captionMayDispatchPeerDirectly: false,
      captionMayExpandScope: false,
      browserMayMarkComplete: false,
    }
  })
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

function projectMode(
  components: CanonicalPlanComponentsInput,
): CaptionEarlyPlanningInput['projectMode'] {
  const directive = JSON.stringify(
    components.professionalEditingDirective).toLowerCase()
  if (/education|tutorial|explainer/u.test(directive)) {
    return 'educational_explainer'
  }
  if (/social|short.form|vertical/u.test(directive)) {
    return 'dynamic_short_form'
  }
  if (/documentary|editorial/u.test(directive)) {
    return 'cinematic_editorial'
  }
  return 'clean_long_form'
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
