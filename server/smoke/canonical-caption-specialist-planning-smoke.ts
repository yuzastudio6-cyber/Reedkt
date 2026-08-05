import assert from 'node:assert/strict'

import type {
  CanonicalCaptionSpecialistEstimateBindingMetadata,
  CanonicalCaptionSpecialistPlanningBinding,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION,
} from '../../src/types/canonical-caption-specialist-planning'
import type { CaptionEarlyPlanningInput } from
  '../../src/types/caption-early-planning'
import type { ProfessionalSkillSelection } from
  '../../src/types/professional-skills'
import type {
  CanonicalEstimateInput,
  CanonicalPlanComponentsInput,
  CanonicalWorkItemInput,
} from '../validation/edit-planning-authority-schemas'
import {
  assertCanonicalCaptionSpecialistPlanningProjectionMatchesWorkItems,
  calculateCanonicalCaptionSpecialistPlanningBindingDigest,
  canonicalCaptionSpecialistMissingApprovalGates,
  parseCanonicalCaptionSpecialistPlanningBinding,
  parseCanonicalCaptionSpecialistPlanningProjection,
  prepareCanonicalCaptionSpecialistPlanningProjection,
} from '../captions-specialist/caption-canonical-work-planning'
import {
  assertCanonicalCaptionRenderedMediaWorkBindingMatches,
  parseCanonicalCaptionRenderedMediaWorkBinding,
  prepareCanonicalCaptionRenderedMediaWorkBinding,
} from '../captions-specialist/caption-rendered-media-work-binding'
import {
  assertCanonicalCaptionPostrenderVisualQaWorkBindingMatches,
  parseCanonicalCaptionPostrenderVisualQaWorkBinding,
  prepareCanonicalCaptionPostrenderVisualQaWorkBinding,
  prepareCanonicalCaptionPostrenderVisualQaWorkItem,
} from '../captions-specialist/caption-postrender-visual-qa-work-binding'
import {
  assertCanonicalCaptionPrivateReviewDependencyBindingMatches,
  parseCanonicalCaptionPrivateReviewDependencyBinding,
  prepareCanonicalCaptionPrivateReviewDependencyBinding,
} from '../captions-specialist/caption-private-review-dependency-binding'
import { createCanonicalApprovedWorkGraphResourcePlacementAuthority } from
  '../edit-architecture/canonical-private-resource-placement-authority'
import { CAPTION_DESIGN_COMPOSITE } from
  '../captions-specialist/caption-design-composite'
import { createCaptionEarlyPlanningBundle } from
  '../captions-specialist/caption-early-planning'
import { createProfessionalSkillCompositionTrace } from
  '../../src/lib/professional-skills/professional-skill-composition-trace'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

let checks = 0
function check(value: unknown, message: string): void {
  assert.ok(value, message)
  checks += 1
}
function domainRef(id: string, contentHash = sha256AuthorityValue(id)) {
  return { id, version: `${id}.v1`, contentHash }
}
function selection(
  skillId: string,
): ProfessionalSkillSelection {
  return {
    skillId,
    family: 'captions',
    userFacingName: 'Captions',
    userFacingActivity: 'Design readable captions',
    selectionSources: ['user_prompt'],
    selectionEvidence: [{
      source: 'user_prompt',
      label: 'Caption direction',
      summary: 'Captions were selected explicitly.',
    }],
    reason: 'Explicit Caption selection.',
    requiredInputs: ['planning_context'],
    outputArtifacts: ['caption_plan'],
    hiddenAdapterToolNames: [],
    backendIntents: [],
    qaGates: ['caption_readability'],
    executionModes: ['plan_only'],
    readiness: 'ready_for_plan',
    blockers: [],
  }
}

const scope = {
  ownerUserId: 'owner.caption.plan.1',
  workspaceId: 'workspace.caption.plan.1',
  projectId: 'project.caption.plan.1',
  editSessionId: 'edit.caption.plan.1',
  planningRequestId: 'planning.caption.plan.1',
  outputId: 'output.caption.plan.1',
}
const selectedTrace = createProfessionalSkillCompositionTrace({
  planId: 'professional.caption.plan.1',
  selectedSkills: [selection('captions.semantic_captioning')],
})
const masterTimingPlan = {
  schemaVersion: 'master-timing-plan-v1',
  fps: 30,
  totalFrames: 360,
}
const masterTimingRef = domainRef(
  'master.timing.caption.plan.1',
  sha256AuthorityValue(masterTimingPlan),
)
const transcriptRef = domainRef('canonical.transcript.caption.plan.1')
const frameDigest = sha256AuthorityValue({
  outputId: scope.outputId,
  width: 1920,
  height: 1080,
  fps: 30,
})
const confirmedFrameRef = domainRef(
  'confirmed.frame.caption.plan.1', frameDigest)

function earlyInput(input: {
  trace: typeof selectedTrace
  noCaptions?: boolean
}): CaptionEarlyPlanningInput {
  return {
    bundleId: input.noCaptions
      ? 'caption.early.plan.restrained.1'
      : 'caption.early.plan.selected.1',
    canonicalScope: {
      ownerUserId: scope.ownerUserId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      editSessionId: scope.editSessionId,
      outputId: scope.outputId,
      planVersionId: scope.planningRequestId,
      approvedSnapshotRef: null,
      sceneId: null,
      authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 360 }],
    },
    captionCompositeRef: {
      id: CAPTION_DESIGN_COMPOSITE.compositeId,
      version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
      contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
    },
    compiledIntentRef: domainRef('compiled.intent.caption.plan.1'),
    professionalSkillTraceRef: {
      id: input.trace.traceId,
      version: input.trace.schemaVersion,
      contentHash: input.trace.traceDigestSha256,
    },
    confirmedOutputFrame: {
      outputId: scope.outputId,
      width: 1920,
      height: 1080,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      confirmedOutputFrameDigestSha256: frameDigest,
    },
    canonicalTranscriptRef: transcriptRef,
    sourceSpeechEvidenceRef: domainRef('speech.caption.plan.1'),
    sourceVisualUnderstandingRef: domainRef('visual.caption.plan.1'),
    editPreferencesRef: domainRef('preferences.caption.plan.1'),
    referenceDnaRef: null,
    planningTimingBasisRef: masterTimingRef,
    directive: input.noCaptions ? {
      disposition: 'no_captions',
      reasonCodes: ['owner_requested_no_captions'],
      ownerApprovedRestraintRef: domainRef('restraint.caption.plan.1'),
    } : {
      disposition: 'caption_design_selected',
      reasonCodes: ['caption_design_selected_by_professional_trace'],
      ownerApprovedRestraintRef: null,
    },
    projectMode: 'clean_long_form',
    primaryLanguage: 'en-US',
    requestedLanguages: ['en-US'],
    accessibleOutputKinds: input.noCaptions ? [] : ['srt', 'webvtt'],
    constraints: {
      allowedTypographyRoles: ['primary_speech'],
      maximumMotionLevel: input.noCaptions ? 'none' : 'moderate',
      maximumHeroMoments: 0,
      subjectOverlapAllowed: false,
      objectAnchoringAllowed: false,
      captionToVisualAllowed: false,
      captionSoundAllowed: false,
      allowedTextTransformations: ['exact', 'punctuation_cleanup'],
      requestedMaximumCaptionCredits: input.noCaptions ? 0 : 40,
      fallbackIds: ['fallback.stable_libass'],
    },
    scenes: [{
      sceneId: 'scene.caption.plan.1',
      planningFrameRange: { startFrame: 0, endFrameExclusive: 360 },
      sourcePhraseIds: ['phrase.caption.plan.1'],
      speechRole: 'primary',
      semanticImportanceBasisPoints: 8_000,
      visualDensity: 'low',
      multiTrackLikely: false,
      depthMaskOrTrackingLikely: false,
      requestedTreatment: input.noCaptions ? 'auto' : 'late_overlay',
      crossSystemTarget: null,
      candidateSafeRegions: [{
        regionId: 'region.caption.plan.1',
        regionBasisPoints: {
          x: 1_000, y: 7_000, width: 8_000, height: 1_500,
        },
        confidenceBasisPoints: 9_000,
        protectedRegionIds: ['face.primary'],
        evidenceRef: domainRef('safe.region.caption.plan.1'),
      }],
      reasonCodes: ['speech_requires_readable_caption'],
    }],
  }
}

function planningBinding(input: {
  trace: typeof selectedTrace
  bundle: ReturnType<typeof createCaptionEarlyPlanningBundle>
}): CanonicalCaptionSpecialistPlanningBinding {
  const withoutDigest: Omit<CanonicalCaptionSpecialistPlanningBinding,
  'bindingDigestSha256'> = {
    schemaVersion: CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION,
    bindingId: `${input.bundle.bundleId}.canonical-binding`,
    canonicalScope: { ...scope },
    confirmedOutputFrame: {
      width: 1920,
      height: 1080,
      fpsNumerator: 30,
      fpsDenominator: 1,
      confirmedOutputFrameRef: confirmedFrameRef,
    },
    professionalSkillCompositionTraceRef: {
      id: input.trace.traceId,
      version: input.trace.schemaVersion,
      contentHash: input.trace.traceDigestSha256,
    },
    earlyPlanningBundleRef: {
      id: input.bundle.bundleId,
      version: input.bundle.schemaVersion,
      contentHash: input.bundle.bundleDigestSha256,
    },
    canonicalTranscriptRef: transcriptRef,
    masterTimingRef,
    captionEstimateInputRef: {
      id: input.bundle.estimateInput.componentId,
      version: input.bundle.estimateInput.componentVersion,
      contentHash: input.bundle.estimateInput.componentDigestSha256,
    },
    scenePolicies: input.bundle.opportunityMap.opportunities.map((item) => ({
      sceneId: item.sceneId,
      trackingJobType: null,
      crossSystemTarget: item.handoffTarget,
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
  return parseCanonicalCaptionSpecialistPlanningBinding({
    ...withoutDigest,
    bindingDigestSha256:
      calculateCanonicalCaptionSpecialistPlanningBindingDigest(withoutDigest),
  })
}

function components(input: {
  trace: typeof selectedTrace
  bundle: ReturnType<typeof createCaptionEarlyPlanningBundle>
  binding: CanonicalCaptionSpecialistPlanningBinding
}): CanonicalPlanComponentsInput {
  return {
    professionalSkillPlan: { compositionTrace: input.trace },
    captionEarlyPlanningBundle: input.bundle,
    captionSpecialistPlanningBinding: input.binding,
    confirmedSettings: {
      outputFrame: { width: 1920, height: 1080, fps: 30 },
    },
    masterTimingPlan,
    timingSummary: {
      validationStatus: 'passed', approvalBlocked: false,
      fps: 30, totalFrames: 360,
    },
    segments: [{
      segmentId: 'scene.caption.plan.1',
      startFrame: 0,
      endFrameExclusive: 360,
      operationIds: ['caption.operation.1'],
    }],
    sourceSequence: [{
      sourceSequenceItemId: 'source.caption.plan.1',
      mediaAssetId: 'media.caption.plan.1',
      uploadedOrder: 1,
      checksumSha256: sha256AuthorityValue('source.caption.plan.1'),
      required: true,
    }],
    sourceCleanupPlan: {
      status: 'confirmed',
      decisions: [{
        decisionId: 'cleanup.caption.plan.1',
        sourceSequenceItemId: 'source.caption.plan.1',
        action: 'preserve',
        startFrame: 0,
        endFrameExclusive: 360,
        reason: 'Preserve the complete approved source meaning.',
        confidence: 1,
        meaningPreservationStatus: 'passed',
        userReviewStatus: 'not_required',
      }],
    },
  } as unknown as CanonicalPlanComponentsInput
}

const snapshotValidation: CanonicalWorkItemInput = {
  workItemKey: 'snapshot-validation',
  workItemType: 'validate_approved_snapshot',
  workerClass: 'authority_worker',
  executionInput: { operation: 'validate_snapshot_manifest' },
  sourceSequenceItemIds: [],
  sourceCleanupDecisionIds: [],
  expectedOutputs: [{
    outputKey: 'snapshot-validation-evidence',
    artifactType: 'authority_validation_evidence',
    assetRole: 'qa',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: [], timingIds: [], rendererLayerIds: [],
  }],
  dependencyKeys: [],
  approvedToolIds: [],
  providerExecutionMode: 'none',
  fallbackPolicy: {},
  maxAttempts: 1,
  attemptTimeoutSeconds: 60,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 1,
  required: true,
}

const selectedBundle = createCaptionEarlyPlanningBundle(earlyInput({
  trace: selectedTrace,
}))
const selectedBinding = planningBinding({
  trace: selectedTrace,
  bundle: selectedBundle,
})
const traceRef = selectedBinding.professionalSkillCompositionTraceRef
const bundleRef = selectedBinding.earlyPlanningBundleRef
const estimateMetadata: CanonicalCaptionSpecialistEstimateBindingMetadata = {
  schemaVersion: CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
  outputId: scope.outputId,
  compositionTraceRef: traceRef,
  earlyPlanningBundleRef: bundleRef,
  captionEstimateInputRef: selectedBinding.captionEstimateInputRef,
  selectedComponentKeys: ['caption_design', 'caption_render_qa'],
  estimateOwnerRemainsCanonical: true,
  serviceFeeIncludedInCaptionWorkCost: false,
  billingAuthorityGrantedToCaption: false,
}
const estimate: CanonicalEstimateInput = {
  lineItems: [{
    lineKey: 'caption-specialist-private-work',
    label: 'Caption design, rendering, and private review',
    category: 'caption_specialist',
    estimatedCredits: 12,
    removable: false,
    metadata: estimateMetadata as unknown as Record<string, unknown>,
  }],
  fallbackAllowanceCredits: 2,
  validForSeconds: 3_600,
}
const selected = prepareCanonicalCaptionSpecialistPlanningProjection({
  ...scope,
  components: components({
    trace: selectedTrace,
    bundle: selectedBundle,
    binding: selectedBinding,
  }),
  estimate,
  existingWorkItems: [snapshotValidation],
})
check(selected.projection?.disposition ===
  'planning_work_projected_downstream_caption_execution_required',
'Selected Caption composition must create an honest planning projection.')
check(selected.workItems.length === 7,
  'One simple scene must create the bounded continuity and scene planning set.')
check(selected.workItems.every((item) =>
  item.workerClass === 'canonical_caption_specialist_worker_v1'
  && item.maximumCreditBudget === 0
  && item.approvedToolIds.length === 0),
'Canonical Caption planning jobs must not smuggle tool, provider, or cost authority.')
const selectedResourcePlacement =
  createCanonicalApprovedWorkGraphResourcePlacementAuthority({
    workItems: selected.workItems.map((item) => ({
      ...item,
      approvedToolOperationIds: [],
    })),
    tools: [],
  })
check(selectedResourcePlacement.placements.every((placement) =>
  placement.canonicalWorkerClass === 'canonical_caption_specialist_worker_v1'
  && placement.workerType === 'cpu_analysis_worker'
  && placement.placementSource === 'tool_free_control_plane_policy'
  && placement.privateExecutionReady
  && placement.providerExecutionMode === 'none'
  && placement.approvedToolIds.length === 0
  && placement.approvedToolOperationIds.length === 0),
'Canonical Caption planning jobs must receive exact tool-free private CPU placement.')
check(selectedResourcePlacement.summary.totalWorkItemCount ===
  selected.workItems.length
  && selectedResourcePlacement.summary.privatelyExecutableWorkItemCount ===
    selected.workItems.length
  && selectedResourcePlacement.summary.blockedWorkItemCount === 0
  && selectedResourcePlacement.boundaries.privateInternalOnly
  && !selectedResourcePlacement.boundaries.cloudDispatchAuthorized
  && !selectedResourcePlacement.boundaries.customerBillingAuthorized
  && !selectedResourcePlacement.boundaries.productionExecutionAuthorized,
'Caption placement must cover every planning job while preserving closed authority.')
check(selected.workItems[0]?.dependencyKeys[0] === 'snapshot-validation',
  'Caption planning must remain downstream of exact snapshot validation.')
check(selected.workItems.some((item) =>
  item.executionInput.captionJobType === 'compile_caption_render_spec'),
'Selected work must include a real render-spec planning assignment.')
check(selected.projection?.planningJobsClaimFinishedCaptionMedia === false
  && selected.projection.fullyApprovedCaptionExecutionCoverageClaimed === false
  && selected.projection.downstreamCaptionRenderWorkRequired,
'Planning projection must not masquerade as rendered-caption completion.')
check(parseCanonicalCaptionSpecialistPlanningProjection(selected.projection)
  .projectionDigestSha256 === selected.projection?.projectionDigestSha256,
'The canonical planning projection must verify its own digest.')
assertCanonicalCaptionSpecialistPlanningProjectionMatchesWorkItems(
  selected.projection!,
  selected.workItems,
)
checks += 1
check(canonicalCaptionSpecialistMissingApprovalGates(
  selected.projection ?? undefined)
  .join('|') === [
    'caption_rendered_media_work_binding',
    'canonical_postrender_visual_qa_work_and_lifecycle_binding',
    'canonical_caption_independent_private_review_binding',
  ].join('|'),
'Selected Caption planning must expose the exact remaining backend gates.')

const captionOverlayWorkItem: CanonicalWorkItemInput = {
  workItemKey: 'caption-overlay',
  workItemType: 'custom',
  workerClass: 'render_worker',
  executionInput: {
    operation: 'render_approved_caption_overlay',
    approvedToolOperationIds: [
      'tool.libass.render_approved_caption_track.v1',
    ],
    expectedOutputKeys: ['caption-overlay-png'],
    structuredPayload: {
      captionProfileId: 'approved_ass_track_render_v1',
      fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
      collisionPolicy: 'fail_on_reserved_zone_collision',
      preserveSpeechTiming: true,
      width: 1920,
      height: 1080,
      timestampMs: 1_000,
      fontSize: 64,
      marginV: 72,
      alignment: 2,
      caption: 'Approved frame accurate caption',
    },
  },
  sourceSequenceItemIds: [],
  sourceCleanupDecisionIds: [],
  expectedOutputs: [{
    outputKey: 'caption-overlay-png',
    artifactType: 'controlled_libass_caption_overlay_png',
    assetRole: 'processed',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'image/png',
    segmentIds: ['scene.caption.plan.1'],
    timingIds: ['master-timing-plan', 'caption-timing-1'],
    rendererLayerIds: ['caption-overlay-layer'],
  }],
  dependencyKeys: [],
  approvedToolIds: ['libass'],
  providerExecutionMode: 'none',
  fallbackPolicy: {},
  maxAttempts: 2,
  attemptTimeoutSeconds: 300,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 1,
  required: true,
}
const finalCompositionWorkItem: CanonicalWorkItemInput = {
  workItemKey: 'final-export',
  workItemType: 'render_final_export',
  workerClass: 'render_worker',
  executionInput: {
    operation: 'render_approved_source_caption_final',
    approvedToolOperationIds: [
      'tool.remotion.render_approved_composition.v1',
    ],
    expectedOutputKeys: ['final-export'],
    structuredPayload: {
      compositionProfileId: 'approved_source_caption_final_v1',
      sourceStartFrame: 0,
      sourceEndFrameExclusive: 360,
      audioPolicy: 'preserve_source',
      width: 1920,
      height: 1080,
      fps: 30,
      durationFrames: 360,
      sourceFit: 'contain',
      panelBackground: '#FFFFFF',
      renderPurpose: 'private_4k_delivery_master_v1',
      deliveryProfileId: 'uhd_2160',
      estimateCostBasisProfileId: 'uhd_2160',
      sourceQualityPolicy: 'immutable_source_master_no_proxy_v1',
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
      captionOverlayPolicy: 'approved_full_frame_rgba',
    },
  },
  sourceSequenceItemIds: ['source.caption.plan.1'],
  sourceCleanupDecisionIds: ['cleanup.caption.plan.1'],
  expectedOutputs: [{
    outputKey: 'final-export',
    artifactType: 'private_source_caption_4k_delivery_master_v1',
    assetRole: 'final',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'video/mp4',
    segmentIds: ['scene.caption.plan.1'],
    timingIds: ['master-timing-plan'],
    rendererLayerIds: ['source-video-layer', 'caption-overlay-layer'],
  }],
  dependencyKeys: ['source-trim-validation', 'caption-overlay'],
  approvedToolIds: ['remotion'],
  providerExecutionMode: 'none',
  fallbackPolicy: {},
  maxAttempts: 2,
  attemptTimeoutSeconds: 1_800,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 3,
  required: true,
}
const deterministicFinalQaWorkItem: CanonicalWorkItemInput = {
  workItemKey: 'final-qa',
  workItemType: 'run_final_qa',
  workerClass: 'qa_worker',
  executionInput: {
    operation: 'inspect_final_artifact',
    approvedToolOperationIds: ['tool.ffprobe.inspect_approved_media.v1'],
    expectedOutputKeys: ['final-qa-report'],
    structuredPayload: {
      inspectionProfileId: 'final_export_v1',
      countFrames: true,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
    },
  },
  sourceSequenceItemIds: [],
  sourceCleanupDecisionIds: [],
  expectedOutputs: [{
    outputKey: 'final-qa-report',
    artifactType: 'final_qa_report',
    assetRole: 'qa',
    required: true,
    previewPlaceholderAllowed: false,
    contentType: 'application/json',
    segmentIds: ['scene.caption.plan.1'],
    timingIds: ['master-timing-plan'],
    rendererLayerIds: ['source-video-layer', 'caption-overlay-layer'],
  }],
  dependencyKeys: ['final-export'],
  approvedToolIds: ['ffprobe'],
  providerExecutionMode: 'none',
  fallbackPolicy: {},
  maxAttempts: 2,
  attemptTimeoutSeconds: 300,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 2,
  required: true,
}
const renderedMediaWorkItems = [
  snapshotValidation,
  ...selected.workItems,
  captionOverlayWorkItem,
  finalCompositionWorkItem,
  deterministicFinalQaWorkItem,
]
const renderedMediaBinding =
  prepareCanonicalCaptionRenderedMediaWorkBinding({
    projection: selected.projection ?? undefined,
    planningBinding: selectedBinding,
    workItems: renderedMediaWorkItems,
  })
check(renderedMediaBinding?.captionRenderOwner === 'libass'
  && renderedMediaBinding.finalCanvasOwner === 'remotion'
  && renderedMediaBinding.captionOverlays.length === 1,
'Selected Caption media must bind the existing libass and Remotion owners.')
check(renderedMediaBinding?.captionOverlays[0]?.startFrame === 0
  && renderedMediaBinding.captionOverlays[0]?.endFrameExclusive === 360
  && renderedMediaBinding.canonicalMasterTimingId === 'master-timing-plan'
  && renderedMediaBinding.finalComposition.dependencyKeys
    .includes('caption-overlay'),
'Caption media binding must preserve exact cue timing and graph dependency.')
check(renderedMediaBinding?.captionAboveLivingFrame
  && renderedMediaBinding.captionAboveControlledVisuals
  && !renderedMediaBinding.providerRuntimeAuthorityGranted
  && !renderedMediaBinding.publicDeliveryGranted
  && !renderedMediaBinding.productionAuthorityGranted,
'Caption media binding must freeze layer order without authority promotion.')
check(parseCanonicalCaptionRenderedMediaWorkBinding(renderedMediaBinding)
  .bindingDigestSha256 === renderedMediaBinding?.bindingDigestSha256,
'Caption rendered-media binding must verify its closed digest.')
assertCanonicalCaptionRenderedMediaWorkBindingMatches(
  renderedMediaBinding!, {
    projection: selected.projection!,
    planningBinding: selectedBinding,
    workItems: renderedMediaWorkItems,
  })
checks += 1
check(canonicalCaptionSpecialistMissingApprovalGates(
  selected.projection ?? undefined,
  { renderedMediaWorkBound: true },
).join('|') === [
  'canonical_postrender_visual_qa_work_and_lifecycle_binding',
  'canonical_caption_independent_private_review_binding',
].join('|'),
'Exact rendered-media work must close only its own downstream gate.')
const postrenderVisualQaWorkItem =
  prepareCanonicalCaptionPostrenderVisualQaWorkItem({
    projection: selected.projection ?? undefined,
    renderedMediaWorkBinding: renderedMediaBinding,
    workItems: renderedMediaWorkItems,
  })
check(postrenderVisualQaWorkItem?.dependencyKeys[0] === 'final-qa'
  && postrenderVisualQaWorkItem.workerClass ===
    'canonical_caption_postrender_visual_qa_coordinator_v1'
  && postrenderVisualQaWorkItem.maximumCreditBudget === 0
  && postrenderVisualQaWorkItem.approvedToolIds.length === 0,
'Post-render visual review must be scheduled after deterministic QA without planning-time dispatch or cost authority.')
const visualQaWorkItems = [
  ...renderedMediaWorkItems,
  postrenderVisualQaWorkItem!,
]
const postrenderVisualQaPlacement =
  createCanonicalApprovedWorkGraphResourcePlacementAuthority({
    workItems: [{
      ...postrenderVisualQaWorkItem!,
      approvedToolOperationIds: [],
    }],
    tools: [],
  }).placements.find((item) =>
    item.workItemKey === postrenderVisualQaWorkItem?.workItemKey)
check(postrenderVisualQaPlacement?.workerType === 'qa_worker'
  && postrenderVisualQaPlacement.placementSource ===
    'caption_postrender_visual_qa_lifecycle_pending'
  && !postrenderVisualQaPlacement.privateExecutionReady
  && postrenderVisualQaPlacement.providerExecutionMode === 'none'
  && postrenderVisualQaPlacement.requiredGate ===
    'canonical_caption_postrender_visual_qa_lifecycle_execution',
'Post-render visual-QA coordination must have one exact blocked QA placement until the lifecycle runner is mounted.')
const postrenderVisualQaBinding =
  prepareCanonicalCaptionPostrenderVisualQaWorkBinding({
    projection: selected.projection ?? undefined,
    renderedMediaWorkBinding: renderedMediaBinding ?? undefined,
    workItems: visualQaWorkItems,
  })
check(postrenderVisualQaBinding?.visualQaLifecycle
  .sharedProviderOperationId === 'postrender_private_visual_qa'
  && postrenderVisualQaBinding.approvalCoverageBindsScheduledWorkNotCompletedResult
  && !postrenderVisualQaBinding.actualLifecycleResultPersisted
  && !postrenderVisualQaBinding.providerDispatchGrantedAtPlanning,
'Approval coverage must bind exact post-render work without claiming a result before rendering.')
check(parseCanonicalCaptionPostrenderVisualQaWorkBinding(
  postrenderVisualQaBinding).bindingDigestSha256 ===
    postrenderVisualQaBinding?.bindingDigestSha256,
'Post-render visual-QA binding must verify its closed digest.')
assertCanonicalCaptionPostrenderVisualQaWorkBindingMatches(
  postrenderVisualQaBinding!, {
    projection: selected.projection!,
    renderedMediaWorkBinding: renderedMediaBinding!,
    workItems: visualQaWorkItems,
  })
checks += 1
check(canonicalCaptionSpecialistMissingApprovalGates(
  selected.projection ?? undefined,
  {
    renderedMediaWorkBound: true,
    postrenderVisualQaWorkAndLifecycleBound: true,
  },
).join('|') === 'canonical_caption_independent_private_review_binding',
'Scheduled post-render visual-QA work must close only planning coverage; independent review remains open.')
const privateReviewDependencyBinding =
  prepareCanonicalCaptionPrivateReviewDependencyBinding({
    projection: selected.projection ?? undefined,
    renderedMediaWorkBinding: renderedMediaBinding ?? undefined,
    postrenderVisualQaWorkBinding: postrenderVisualQaBinding ?? undefined,
    workItems: visualQaWorkItems,
  })
check(privateReviewDependencyBinding?.requiredReviewArtifacts
  .map((item) => item.role).join('|') === [
    'final_captioned_render',
    'deterministic_final_qa',
    'qualified_complete_time_visual_review',
  ].join('|')
  && privateReviewDependencyBinding.canonicalPrivateReview
    .assemblyServiceId === 'canonical_private_review_assembly_service'
  && !privateReviewDependencyBinding.actualReviewAssemblyCreated
  && !privateReviewDependencyBinding.privateReviewAcceptanceClaimed,
'Private review must bind all three exact downstream artifacts without claiming assembly or acceptance.')
check(parseCanonicalCaptionPrivateReviewDependencyBinding(
  privateReviewDependencyBinding).bindingDigestSha256 ===
    privateReviewDependencyBinding?.bindingDigestSha256,
'Caption private-review dependency binding must verify its closed digest.')
assertCanonicalCaptionPrivateReviewDependencyBindingMatches(
  privateReviewDependencyBinding!, {
    projection: selected.projection!,
    renderedMediaWorkBinding: renderedMediaBinding!,
    postrenderVisualQaWorkBinding: postrenderVisualQaBinding!,
    workItems: visualQaWorkItems,
  })
checks += 1
check(canonicalCaptionSpecialistMissingApprovalGates(
  selected.projection ?? undefined,
  {
    renderedMediaWorkBound: true,
    postrenderVisualQaWorkAndLifecycleBound: true,
    independentPrivateReviewBound: true,
  },
).length === 0,
'A selected Caption plan with exact render, visual-QA, and private-review work coverage must be internally approvable.')
assert.throws(() => assertCanonicalCaptionPrivateReviewDependencyBindingMatches(
  privateReviewDependencyBinding!, {
    projection: selected.projection!,
    renderedMediaWorkBinding: renderedMediaBinding!,
    postrenderVisualQaWorkBinding: postrenderVisualQaBinding!,
    workItems: visualQaWorkItems.map((item) =>
      item.workItemKey === postrenderVisualQaWorkItem?.workItemKey
        ? { ...item, dependencyKeys: ['final-export'] }
        : item),
  }), /ordering|no longer matches/u)
checks += 1
assert.throws(() => parseCanonicalCaptionPrivateReviewDependencyBinding({
  ...privateReviewDependencyBinding,
  bindingDigestSha256: sha256AuthorityValue('tampered-private-review-binding'),
}), /digest failed/u)
checks += 1
check(prepareCanonicalCaptionPostrenderVisualQaWorkItem({
  projection: selected.projection ?? undefined,
  renderedMediaWorkBinding: renderedMediaBinding,
  workItems: renderedMediaWorkItems.filter((item) =>
    item.workItemKey !== 'final-qa'),
}) === null,
'Missing deterministic QA must keep post-render visual review unscheduled.')
assert.throws(() => assertCanonicalCaptionPostrenderVisualQaWorkBindingMatches(
  postrenderVisualQaBinding!, {
    projection: selected.projection!,
    renderedMediaWorkBinding: renderedMediaBinding!,
    workItems: visualQaWorkItems.map((item) =>
      item.workItemKey === 'final-qa'
        ? { ...item, dependencyKeys: ['snapshot-validation'] }
        : item),
  }), /deterministic final-QA evidence first|no longer matches/u)
checks += 1
assert.throws(() => parseCanonicalCaptionPostrenderVisualQaWorkBinding({
  ...postrenderVisualQaBinding,
  bindingDigestSha256: sha256AuthorityValue('tampered-visual-qa-binding'),
}), /digest failed/u)
checks += 1
check(prepareCanonicalCaptionRenderedMediaWorkBinding({
  projection: selected.projection ?? undefined,
  planningBinding: selectedBinding,
  workItems: [snapshotValidation, ...selected.workItems],
}) === null,
'Missing libass or Remotion work must remain an explicit open gate.')
assert.throws(() => assertCanonicalCaptionRenderedMediaWorkBindingMatches(
  renderedMediaBinding!, {
    projection: selected.projection!,
    planningBinding: selectedBinding,
    workItems: renderedMediaWorkItems.map((item) =>
      item.workItemKey === 'caption-overlay'
        ? {
            ...item,
            executionInput: {
              ...item.executionInput,
              structuredPayload: {
                ...(item.executionInput.structuredPayload as object),
                caption: 'Crossed caption text',
              },
            },
          }
        : item),
  }), /no longer matches its immutable work graph/u)
checks += 1
assert.throws(() => prepareCanonicalCaptionRenderedMediaWorkBinding({
  projection: selected.projection ?? undefined,
  planningBinding: selectedBinding,
  workItems: renderedMediaWorkItems.map((item) =>
    item.workItemKey === 'final-export'
      ? { ...item, dependencyKeys: ['source-trim-validation'] }
      : item),
}), /does not depend on every overlay/u)
checks += 1
assert.throws(() => parseCanonicalCaptionRenderedMediaWorkBinding({
  ...renderedMediaBinding,
  bindingDigestSha256: sha256AuthorityValue('tampered-render-binding'),
}), /digest failed/u)
checks += 1
assert.throws(() =>
  assertCanonicalCaptionSpecialistPlanningProjectionMatchesWorkItems(
    selected.projection!,
    selected.workItems.map((item, index) => index === 0
      ? {
          ...item,
          executionInput: {
            ...item.executionInput,
            captionJobType: 'compile_caption_render_spec',
          },
        }
      : item),
  ), /no longer matches its immutable projection/u)
checks += 1

const restrainedTrace = createProfessionalSkillCompositionTrace({
  planId: 'professional.caption.plan.restrained.1',
  selectedSkills: [selection('captions.no_caption_policy')],
})
const restrainedBundle = createCaptionEarlyPlanningBundle(earlyInput({
  trace: restrainedTrace,
  noCaptions: true,
}))
const restrainedBinding = planningBinding({
  trace: restrainedTrace,
  bundle: restrainedBundle,
})
const restrained = prepareCanonicalCaptionSpecialistPlanningProjection({
  ...scope,
  components: components({
    trace: restrainedTrace,
    bundle: restrainedBundle,
    binding: restrainedBinding,
  }),
  estimate: {
    lineItems: [{
      lineKey: 'base-planning', label: 'Base planning', category: 'planning',
      estimatedCredits: 2, removable: false, metadata: {},
    }],
    fallbackAllowanceCredits: 0,
    validForSeconds: 3_600,
  },
  existingWorkItems: [snapshotValidation],
})
check(restrained.projection?.disposition ===
  'no_caption_work_owner_restraint_preserved'
  && restrained.workItems.length === 0,
'Exact no_captions restraint must create no hidden Caption work.')
assertCanonicalCaptionSpecialistPlanningProjectionMatchesWorkItems(
  restrained.projection!,
  restrained.workItems,
)
checks += 1
check(canonicalCaptionSpecialistMissingApprovalGates(
  restrained.projection ?? undefined)
  .length === 0,
'Owner-approved no_captions restraint must not create Caption approval gates.')

assert.throws(() => prepareCanonicalCaptionSpecialistPlanningProjection({
  ...scope,
  components: {
    ...components({
      trace: selectedTrace,
      bundle: selectedBundle,
      binding: selectedBinding,
    }),
    captionEarlyPlanningBundle: undefined,
  },
  estimate,
  existingWorkItems: [snapshotValidation],
}), /requires the professional plan, early bundle, and planning binding/u)
checks += 1

assert.throws(() => prepareCanonicalCaptionSpecialistPlanningProjection({
  ...scope,
  components: components({
    trace: selectedTrace,
    bundle: selectedBundle,
    binding: selectedBinding,
  }),
  estimate,
  existingWorkItems: [{
    ...snapshotValidation,
    workerClass: 'canonical_caption_specialist_worker_v1',
  }],
}), /only by the canonical planner/u)
checks += 1

assert.throws(() => parseCanonicalCaptionSpecialistPlanningBinding({
  ...selectedBinding,
  bindingDigestSha256: sha256AuthorityValue('tampered-binding'),
}), /digest failed/u)
checks += 1

assert.throws(() => prepareCanonicalCaptionSpecialistPlanningProjection({
  ...scope,
  components: components({
    trace: selectedTrace,
    bundle: selectedBundle,
    binding: {
      ...selectedBinding,
      masterTimingRef: domainRef('crossed-master-timing'),
      bindingDigestSha256: selectedBinding.bindingDigestSha256,
    },
  }),
  estimate,
  existingWorkItems: [snapshotValidation],
}), /digest failed|stale or crossed/u)
checks += 1

const trackingEarlyInput = earlyInput({ trace: selectedTrace })
trackingEarlyInput.scenes[0]!.depthMaskOrTrackingLikely = true
trackingEarlyInput.scenes[0]!.requestedTreatment = 'reserved_composition'
const trackingBundle = createCaptionEarlyPlanningBundle(trackingEarlyInput)
const trackingBindingWithoutPurpose = planningBinding({
  trace: selectedTrace,
  bundle: trackingBundle,
})
assert.throws(() => prepareCanonicalCaptionSpecialistPlanningProjection({
  ...scope,
  components: components({
    trace: selectedTrace,
    bundle: trackingBundle,
    binding: trackingBindingWithoutPurpose,
  }),
  estimate,
  existingWorkItems: [snapshotValidation],
}), /scene policy or timing is inconsistent/u)
checks += 1

assert.throws(() => prepareCanonicalCaptionSpecialistPlanningProjection({
  ...scope,
  components: components({
    trace: restrainedTrace,
    bundle: restrainedBundle,
    binding: restrainedBinding,
  }),
  estimate,
  existingWorkItems: [snapshotValidation],
}), /cannot retain hidden Caption estimate work/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-specialist-planning',
  status: 'passed',
  checks,
  selectedWorkItemCount: selected.workItems.length,
  selectedProjectionDigestSha256:
    selected.projection?.projectionDigestSha256,
  restrainedWorkItemCount: restrained.workItems.length,
  planningJobsClaimFinishedCaptionMedia: false,
  fullyApprovedCaptionExecutionCoverageClaimed: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
