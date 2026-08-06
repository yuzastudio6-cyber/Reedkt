import assert from 'node:assert/strict'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import { createProfessionalSkillCompositionTrace } from
  '../../src/lib/professional-skills/professional-skill-composition-trace'
import type { CaptionEarlyPlanningInput } from
  '../../src/types/caption-early-planning'
import type {
  CanonicalCaptionSourceLedProfessionalPlanningReadResult,
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
import type { ProfessionalSkillSelection } from
  '../../src/types/professional-skills'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  canonicalPlanComponentsSchema,
  publishCanonicalEditPlanSchema,
} from '../validation/edit-planning-authority-schemas'
import {
  canonicalCaptionAssignmentTriggerForJob,
  calculateCanonicalCaptionSpecialistPlanningBindingDigest,
  createCanonicalCaptionSpecialistPlanningBindingV2,
  parseCanonicalCaptionSpecialistPlanningBinding,
} from '../captions-specialist/caption-canonical-work-planning'
import { CAPTION_DESIGN_COMPOSITE } from
  '../captions-specialist/caption-design-composite'
import { createCaptionEarlyPlanningBundle } from
  '../captions-specialist/caption-early-planning'
import {
  applyCanonicalCaptionSourceLedProfessionalPlanning,
  calculateCanonicalCaptionSourceLedProfessionalPlanningAuthorityDigest,
  calculateCanonicalCaptionSourceLedProfessionalPlanningRequestDigest,
  createCanonicalCaptionSourceLedProfessionalPlanningAuthority,
  createCanonicalCaptionSourceLedProfessionalPlanningReadPort,
  createCanonicalCaptionSourceLedProfessionalPlanningRequest,
  parseCanonicalCaptionSourceLedProfessionalPlanningAuthority,
  parseCanonicalCaptionSourceLedProfessionalPlanningRequest,
  readCanonicalCaptionSourceLedProfessionalPlanning,
} from '../captions-specialist/caption-source-led-professional-planning'
import {
  compileCanonicalSourceLedPlan,
} from '../services/canonical-source-led-plan-compiler'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  EditBriefMarkerRecord,
  EditBriefRecord,
} from '../services/private-edit-brief-authority-store'

let checks = 0
function check(value: unknown, message: string): void {
  assert.ok(value, message)
  checks += 1
}

const sha = (character: string) => character.repeat(64).slice(0, 64)
const timestamp = '2026-08-06T14:00:00.000Z'
const plannerInput: PlannerInput = {
  projectName: 'Caption professional source-led planning smoke',
  targetPlatform: 'youtube',
  aspectRatio: '16:9',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'youtube_side_panel',
  editingCategory: 'business_brand',
  workflowType: 'simple_clean_edit',
  editLevel: 'premium',
  structurePreference: 'preserve_source_order',
  moodStyle: 'clean',
  visualPreference: 'no_extra_visuals',
  referenceUrl: '',
  customInstructions:
    'Use professional captions derived only from authenticated transcript evidence.',
  userInstructionHistory: [
    'Use professional captions derived only from authenticated transcript evidence.',
  ],
  creditPreference: 'balanced',
  clips: [{
    id: 'caption-source-led-clip-1',
    uploadedOrder: 1,
    fileName: 'caption-source-led-1.mp4',
    duration: '1',
    detectedType: 'Verified uploaded video',
    sourceRole: 'main_story',
    isImportant: true,
  }, {
    id: 'caption-source-led-clip-2',
    uploadedOrder: 2,
    fileName: 'caption-source-led-2.mp4',
    duration: '1',
    detectedType: 'Verified uploaded video',
    sourceRole: 'main_story',
    isImportant: true,
  }],
  sourceSequenceMode: 'multi_clip_story_order',
  sourceOrderConfirmed: true,
  cleanupPreference: 'preserve_natural',
  cleanupPreferenceConfirmed: true,
  preferenceDefaultsApplied: true,
  preferenceSnapshotId: 'caption-source-led-preference-snapshot',
  preferencePersistenceSource: 'authenticated_private_internal_backend',
  currentEditPreferenceAuthorityValues: {
    editLevel: 'premium',
    workflowType: 'simple_clean_edit',
    cleanupPreference: 'preserve_natural',
    visualPreference: 'no_extra_visuals',
    moodStyle: 'clean',
    creditPreference: 'balanced',
    targetPlatform: 'youtube',
  },
  currentEditPreferenceRecordRevision: 3,
  currentEditPreferenceRevision: 2,
  currentEditPreferencePlanningInputRevision: 2,
  currentEditPreferenceFingerprintSha256: sha('a'),
}
const sourceMediaAssets:
ApprovedEditExecutionUploadedMediaSourceAssetClientInput[] = [
  sourceAsset(1), sourceAsset(2),
]
const editBrief: EditBriefRecord = {
  id: 'caption-source-led-brief',
  revision: 1,
  fields: {
    goal: 'Create a clean professional source-led edit with captions.',
    mustIncludeNotes: ['Preserve source order and speech meaning.'],
    avoidNotes: ['Do not fabricate transcript text.'],
    captionPreference: 'dynamic',
    musicPreference: 'none',
    status: 'ready',
  },
  createdAt: timestamp,
  updatedAt: timestamp,
}
const confirmedCaptionMarker: EditBriefMarkerRecord = {
  id: 'caption-source-led-confirmed-marker',
  editSessionId: 'caption-source-led-edit',
  briefId: editBrief.id,
  revision: 1,
  markerType: 'caption',
  timeKind: 'range',
  startSeconds: 0,
  endSeconds: 2,
  priority: 'must_follow',
  title: 'Exact legacy marker',
  note: 'Legacy lane must be retired for professional Caption planning.',
  status: 'confirmed',
  timingStatus: 'frame_authoritative',
  startFrame: 0,
  endFrame: 60,
  frameRate: 30,
  confirmedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
}

const legacyCompilation = compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  editBrief,
  confirmedCaptionMarkers: [confirmedCaptionMarker],
})
const cleanCompilation = compileCanonicalSourceLedPlan({
  plannerInput,
  sourceMediaAssets,
  editBrief,
  confirmedCaptionMarkers: [],
})
const legacyPlan = requirePublication(legacyCompilation)
const cleanPlan = requirePublication(cleanCompilation)
const baseComponents = canonicalPlanComponentsSchema.parse(
  cleanPlan.canonicalPlan.components)
const baseComponentsBefore = structuredClone(baseComponents)
const estimateBefore = structuredClone(cleanPlan.canonicalPlan.estimate)
const workItemsBefore = structuredClone(cleanPlan.canonicalPlan.workItems)
const confirmedCaptionMarkerSetRef = domainRef(
  'caption.marker.set.source-led.1',
  sha256AuthorityValue({
    markerId: confirmedCaptionMarker.id,
    revision: confirmedCaptionMarker.revision,
    startFrame: confirmedCaptionMarker.startFrame,
    endFrame: confirmedCaptionMarker.endFrame,
  }),
)
const request = createCanonicalCaptionSourceLedProfessionalPlanningRequest({
  canonicalScope: {
    ownerUserId: 'owner.caption.source-led.1',
    workspaceId: 'workspace.caption.source-led.1',
    projectId: 'project.caption.source-led.1',
    editSessionId: 'edit.caption.source-led.1',
    planningRequestId: cleanPlan.planningRequestIdSeed,
    outputId: 'output.caption.source-led.1',
  },
  components: baseComponents,
  confirmedCaptionMarkerSetRef,
})
const selectedTrace = createProfessionalSkillCompositionTrace({
  planId: 'professional.caption.source-led.1',
  selectedSkills: [captionSelection()],
})
const selectedBundle = createCaptionEarlyPlanningBundle(
  earlyPlanningInput(request, selectedTrace),
)
const requiredSceneJobs: CaptionsSupportedJobType[] = [
  'reserve_caption_space',
  'plan_caption_blocking_preview',
  'check_caption_finish_readiness',
  'resolve_late_bound_caption_scene',
  'resolve_semantic_caption_phrases',
  'compile_caption_scene_graph',
  'compile_caption_render_spec',
  'compile_accessible_caption_projection',
  'compile_reduced_motion_caption_projection',
]
const assignmentSpecs: Array<{
  jobType: CaptionsSupportedJobType
  sceneId: string | null
  frameRange: { startFrame: number; endFrameExclusive: number }
}> = [
  ...CAPTIONS_VIDEO_JOB_TYPES.map((jobType) => ({
    jobType,
    sceneId: null,
    frameRange: { startFrame: 0, endFrameExclusive: request.totalFrames },
  })),
  ...baseComponents.segments.flatMap((segment) =>
    requiredSceneJobs.map((jobType) => ({
      jobType,
      sceneId: segment.segmentId,
      frameRange: {
        startFrame: segment.startFrame,
        endFrameExclusive: segment.endFrameExclusive,
      },
    }))),
]
const binding = createCanonicalCaptionSpecialistPlanningBindingV2({
  bindingId: 'binding.caption.source-led.1',
  canonicalScope: structuredClone(request.canonicalScope),
  confirmedOutputFrame: structuredClone(request.confirmedOutputFrame),
  professionalSkillCompositionTraceRef: traceRef(selectedTrace),
  earlyPlanningBundleRef: bundleRef(selectedBundle),
  canonicalTranscriptRef: domainRef('transcript.caption.source-led.1'),
  masterTimingRef: structuredClone(request.masterTimingRef),
  captionEstimateInputRef: {
    id: selectedBundle.estimateInput.componentId,
    version: selectedBundle.estimateInput.componentVersion,
    contentHash: selectedBundle.estimateInput.componentDigestSha256,
  },
  scenePolicies: baseComponents.segments.map((segment) => ({
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
  assignmentIntents: assignmentSpecs.map((spec) =>
    assignment(
      request,
      selectedTrace,
      spec.jobType,
      spec.sceneId,
      spec.frameRange,
    )),
  assignmentsSelectedByCanonicalPlanOwner: true,
  oneAllFeatureEditFabricated: false,
})
const estimateMetadata: CanonicalCaptionSpecialistEstimateBindingMetadata = {
  schemaVersion: CANONICAL_CAPTION_SPECIALIST_ESTIMATE_BINDING_VERSION,
  outputId: request.canonicalScope.outputId,
  compositionTraceRef: traceRef(selectedTrace),
  earlyPlanningBundleRef: bundleRef(selectedBundle),
  captionEstimateInputRef: binding.captionEstimateInputRef,
  selectedComponentKeys: ['caption_design', 'caption_render_qa'],
  estimateOwnerRemainsCanonical: true,
  serviceFeeIncludedInCaptionWorkCost: false,
  billingAuthorityGrantedToCaption: false,
}
const authority =
  createCanonicalCaptionSourceLedProfessionalPlanningAuthority({
    request,
    professionalSkillPlan: { compositionTrace: selectedTrace },
    captionEarlyPlanningBundle: selectedBundle,
    captionSpecialistPlanningBinding: binding,
    captionEstimateLine: {
      lineKey: 'caption-source-led-professional-work',
      label: 'Caption specialist planning, rendering, and private review',
      category: 'caption_specialist',
      estimatedCredits: 12,
      removable: false,
      metadata: estimateMetadata,
    },
  })

check(parseCanonicalCaptionSourceLedProfessionalPlanningAuthority(
  authority, request).authorityDigestSha256 === authority.authorityDigestSha256,
'The professional Caption planning authority must verify its exact digest.')
check(request.confirmedCaptionMarkerSetRef?.contentHash ===
  confirmedCaptionMarkerSetRef.contentHash,
'The professional authority request must retain exact confirmed-marker lineage.')

let stableReadCount = 0
const readyPort = createCanonicalCaptionSourceLedProfessionalPlanningReadPort(
  async (observedRequest) => {
    stableReadCount += 1
    assert.equal(observedRequest.requestDigestSha256,
      request.requestDigestSha256)
    return readyResult(observedRequest, authority)
  },
)
const ready = await readCanonicalCaptionSourceLedProfessionalPlanning({
  port: readyPort,
  request,
})
check(ready.status === 'ready' && stableReadCount === 2,
'The canonical owner must be reread twice and remain byte-stable.')

const applied = applyCanonicalCaptionSourceLedProfessionalPlanning({
  request,
  authority,
  components: baseComponents,
  estimate: cleanPlan.canonicalPlan.estimate,
  workItems: cleanPlan.canonicalPlan.workItems,
})
check(applied.projection.schemaVersion ===
  'canonical-caption-specialist-planning-projection-v2'
  && applied.projection.disposition ===
    'planning_work_projected_downstream_caption_execution_required',
'A selected source-led plan must create the exact V2 Caption projection.')
check(applied.projection.projectedJobTypes.join('|') ===
  assignmentSpecs.map((spec) => spec.jobType).join('|'),
'The canonical plan must project exactly the selected Caption assignments.')
check(applied.workItems.length ===
  cleanPlan.canonicalPlan.workItems.length + assignmentSpecs.length
  && applied.workItems.filter((item) => item.workerClass ===
    'canonical_caption_specialist_worker_v1').length === assignmentSpecs.length,
'Caption work must be added once by the existing canonical planner.')
check(!applied.workItems.some((item) =>
  item.executionInput.operation === 'render_approved_caption_overlay'),
'The professional plan must contain no parallel legacy caption renderer.')
check(applied.estimate.lineItems.filter((line) =>
  line.category === 'caption_specialist').length === 1,
'The professional plan must add one exact non-removable Caption estimate line.')
check(applied.projection.downstreamCaptionRenderWorkRequired
  && applied.projection.deterministicRenderedCaptionQaRequired
  && applied.projection.qualifiedCompleteTimeVisualReviewRequired
  && applied.projection.independentPrivateReviewRequired
  && !applied.projection.fullyApprovedCaptionExecutionCoverageClaimed,
'Planning must preserve every downstream render and review gate without claiming completion.')
check(JSON.stringify(baseComponents) === JSON.stringify(baseComponentsBefore)
  && JSON.stringify(cleanPlan.canonicalPlan.estimate) ===
    JSON.stringify(estimateBefore)
  && JSON.stringify(cleanPlan.canonicalPlan.workItems) ===
    JSON.stringify(workItemsBefore),
'The source-led Caption projection must not mutate its base plan inputs.')
check(Boolean(canonicalPlanComponentsSchema.parse(applied.components)
  .captionSpecialistPlanningBinding),
'The projected Caption components must remain valid canonical plan components.')
check(publishCanonicalEditPlanSchema.shape.canonicalPlan.safeParse({
  ...cleanPlan.canonicalPlan,
  components: applied.components,
  estimate: applied.estimate,
  workItems: applied.workItems,
}).success,
'The completed source-led Caption projection must remain publishable.')

assert.throws(() => applyCanonicalCaptionSourceLedProfessionalPlanning({
  request,
  authority,
  components: baseComponents,
  estimate: legacyPlan.canonicalPlan.estimate,
  workItems: legacyPlan.canonicalPlan.workItems,
}), /legacy exact-marker caption lane/u)
checks += 1

assert.throws(() => createCanonicalCaptionSourceLedProfessionalPlanningRequest({
  canonicalScope: request.canonicalScope,
  components: applied.components,
}), /cannot replace or merge pre-existing Caption components/u)
checks += 1

const changedBase = structuredClone(baseComponents)
changedBase.qaPlan = { changedAfterOwnerRead: true }
assert.throws(() => applyCanonicalCaptionSourceLedProfessionalPlanning({
  request,
  authority,
  components: changedBase,
  estimate: cleanPlan.canonicalPlan.estimate,
  workItems: cleanPlan.canonicalPlan.workItems,
}), /changed base plan components/u)
checks += 1

let unstableReadCount = 0
const unstablePort = createCanonicalCaptionSourceLedProfessionalPlanningReadPort(
  async (observedRequest) => {
    unstableReadCount += 1
    return unstableReadCount === 1
      ? readyResult(observedRequest, authority)
      : blockedResult(observedRequest, ['caption_owner_state_changed'])
  },
)
await assert.rejects(() => readCanonicalCaptionSourceLedProfessionalPlanning({
  port: unstablePort,
  request,
}), /changed across exact reread/u)
checks += 1

const fakePort = {
  schemaVersion:
    CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
  async readForSourceLedPlan(observedRequest:
  CanonicalCaptionSourceLedProfessionalPlanningRequest) {
    return readyResult(observedRequest, authority)
  },
}
await assert.rejects(() => readCanonicalCaptionSourceLedProfessionalPlanning({
  port: fakePort,
  request,
}), /requires an admitted read port/u)
checks += 1

let notRequestedReads = 0
const notRequestedPort =
  createCanonicalCaptionSourceLedProfessionalPlanningReadPort(
    async (observedRequest) => {
      notRequestedReads += 1
      return notRequestedResult(observedRequest)
    },
  )
const notRequested =
  await readCanonicalCaptionSourceLedProfessionalPlanning({
    port: notRequestedPort,
    request,
  })
check(notRequested.status === 'not_requested' && notRequestedReads === 2,
'An unselected source-led plan must preserve the existing compatibility lane.')

const restraintRequest =
  createCanonicalCaptionSourceLedProfessionalPlanningRequest({
    canonicalScope: {
      ...request.canonicalScope,
      outputId: 'output.caption.source-led.restraint',
    },
    components: baseComponents,
  })
const restraintTrace = createProfessionalSkillCompositionTrace({
  planId: 'professional.caption.source-led.restraint',
  selectedSkills: [captionSelection('captions.no_caption_policy')],
})
const restraintBundle = createCaptionEarlyPlanningBundle(
  earlyPlanningInput(restraintRequest, restraintTrace, true),
)
const restraintBindingBody: Omit<
  CanonicalCaptionSpecialistPlanningBindingV1,
  'bindingDigestSha256'
> = {
  schemaVersion: CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_VERSION,
  bindingId: 'binding.caption.source-led.restraint',
  canonicalScope: structuredClone(restraintRequest.canonicalScope),
  confirmedOutputFrame:
    structuredClone(restraintRequest.confirmedOutputFrame),
  professionalSkillCompositionTraceRef: traceRef(restraintTrace),
  earlyPlanningBundleRef: bundleRef(restraintBundle),
  canonicalTranscriptRef:
    domainRef('transcript.caption.source-led.1'),
  masterTimingRef: structuredClone(restraintRequest.masterTimingRef),
  captionEstimateInputRef: {
    id: restraintBundle.estimateInput.componentId,
    version: restraintBundle.estimateInput.componentVersion,
    contentHash: restraintBundle.estimateInput.componentDigestSha256,
  },
  scenePolicies: [],
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
const restraintBinding = parseCanonicalCaptionSpecialistPlanningBinding({
  ...restraintBindingBody,
  bindingDigestSha256:
    calculateCanonicalCaptionSpecialistPlanningBindingDigest(
      restraintBindingBody),
})
const restraintAuthority =
  createCanonicalCaptionSourceLedProfessionalPlanningAuthority({
    request: restraintRequest,
    professionalSkillPlan: { compositionTrace: restraintTrace },
    captionEarlyPlanningBundle: restraintBundle,
    captionSpecialistPlanningBinding: restraintBinding,
    captionEstimateLine: null,
  })
const restrained = applyCanonicalCaptionSourceLedProfessionalPlanning({
  request: restraintRequest,
  authority: restraintAuthority,
  components: baseComponents,
  estimate: cleanPlan.canonicalPlan.estimate,
  workItems: cleanPlan.canonicalPlan.workItems,
})
check(restrained.projection.disposition ===
  'no_caption_work_owner_restraint_preserved'
  && restrained.projection.projectedWorkItemKeys.length === 0
  && restrained.workItems.length === cleanPlan.canonicalPlan.workItems.length
  && restrained.estimate.lineItems.every((line) =>
    line.category !== 'caption_specialist'),
'An exact no_captions decision must preserve restraint without hidden work or cost.')

const browserOverclaimRequest = {
  ...structuredClone(request),
  browserCaptionSelectionAccepted: true,
} as unknown as Record<string, unknown>
browserOverclaimRequest.requestDigestSha256 =
  calculateCanonicalCaptionSourceLedProfessionalPlanningRequestDigest(
    browserOverclaimRequest)
assert.throws(() =>
  parseCanonicalCaptionSourceLedProfessionalPlanningRequest(
    browserOverclaimRequest))
checks += 1

const providerOverclaimAuthority = {
  ...structuredClone(authority),
  providerCalled: true,
} as unknown as Record<string, unknown>
providerOverclaimAuthority.authorityDigestSha256 =
  calculateCanonicalCaptionSourceLedProfessionalPlanningAuthorityDigest(
    providerOverclaimAuthority)
assert.throws(() =>
  parseCanonicalCaptionSourceLedProfessionalPlanningAuthority(
    providerOverclaimAuthority, request))
checks += 1

const unknownFieldAuthority = {
  ...structuredClone(authority),
  hiddenRuntimeGrant: false,
} as unknown as Record<string, unknown>
unknownFieldAuthority.authorityDigestSha256 =
  calculateCanonicalCaptionSourceLedProfessionalPlanningAuthorityDigest(
    unknownFieldAuthority)
assert.throws(() =>
  parseCanonicalCaptionSourceLedProfessionalPlanningAuthority(
    unknownFieldAuthority, request))
checks += 1

const crossedEstimateAuthority = structuredClone(authority) as unknown as
  Record<string, unknown>
const crossedEstimateLine = crossedEstimateAuthority.captionEstimateLine as
  Record<string, unknown>
crossedEstimateLine.metadata = {
  ...(crossedEstimateLine.metadata as Record<string, unknown>),
  outputId: 'output.crossed.caption.source-led',
}
crossedEstimateAuthority.authorityDigestSha256 =
  calculateCanonicalCaptionSourceLedProfessionalPlanningAuthorityDigest(
    crossedEstimateAuthority)
assert.throws(() =>
  parseCanonicalCaptionSourceLedProfessionalPlanningAuthority(
    crossedEstimateAuthority, request), /estimate lineage is stale/u)
checks += 1

const cyclicRequest = structuredClone(request) as unknown as
  Record<string, unknown>
cyclicRequest.cycle = cyclicRequest
assert.throws(() =>
  parseCanonicalCaptionSourceLedProfessionalPlanningRequest(cyclicRequest),
/cycle/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical_caption_source_led_professional_planning',
  status: 'passed',
  checks,
  selectedAssignments: assignmentSpecs.length,
  legacyParallelRendererRejected: true,
  stableDoubleRereadRequired: true,
  canonicalPlannerReused: true,
  centralOrchestraImplemented: false,
  approvalGranted: false,
  workDispatched: false,
  providerCalled: false,
  finalQaApproved: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function sourceAsset(
  ordinal: 1 | 2,
): ApprovedEditExecutionUploadedMediaSourceAssetClientInput {
  return {
    mediaAssetId: `caption-source-led-media-${ordinal}`,
    storageObjectRecordId: `caption-source-led-object-${ordinal}`,
    sourceSequenceItemId: `caption-source-led-source-${ordinal}`,
    uploadedClipId: `caption-source-led-clip-${ordinal}`,
    uploadedOrder: ordinal,
    storageProvider: 'local_private',
    storageBucket: 'private-internal',
    storagePath: `caption-source-led/${ordinal}.mp4`,
    fileName: `caption-source-led-${ordinal}.mp4`,
    mimeType: 'video/mp4',
    byteSize: 4_096,
    checksumSha256: sha(String(ordinal)),
    sourceMetadata: {
      probeStatus: 'probed',
      source: 'local_ffprobe',
      durationSeconds: 1,
      width: 1_920,
      height: 1_080,
      videoCodec: 'h264',
      audioCodec: 'aac',
      hasVideo: true,
      hasAudio: true,
    },
    privateArtifact: true,
    publicUrl: null,
    signedUrl: null,
  }
}

function requirePublication(
  compilation: ReturnType<typeof compileCanonicalSourceLedPlan>,
) {
  const publication = compilation.canonicalDraft.publication ??
    compilation.professionalLongFormPublication
  assert.ok(publication)
  return publication
}

function captionSelection(
  skillId = 'captions.semantic_captioning',
): ProfessionalSkillSelection {
  return {
    skillId,
    family: 'captions',
    userFacingName: 'Captions',
    userFacingActivity: 'Design readable professional captions',
    selectionSources: ['user_prompt'],
    selectionEvidence: [{
      source: 'user_prompt',
      label: 'Caption direction',
      summary: 'Professional Caption design was selected explicitly.',
    }],
    reason: 'Explicit professional Caption selection.',
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

function earlyPlanningInput(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
  trace: ReturnType<typeof createProfessionalSkillCompositionTrace>,
  noCaptions = false,
): CaptionEarlyPlanningInput {
  return {
    bundleId: 'bundle.caption.source-led.1',
    canonicalScope: {
      ownerUserId: request.canonicalScope.ownerUserId,
      workspaceId: request.canonicalScope.workspaceId,
      projectId: request.canonicalScope.projectId,
      editSessionId: request.canonicalScope.editSessionId,
      planVersionId: request.canonicalScope.planningRequestId,
      approvedSnapshotRef: null,
      outputId: request.canonicalScope.outputId,
      sceneId: null,
      authorizedFrameRanges: [{
        startFrame: 0,
        endFrameExclusive: request.totalFrames,
      }],
    },
    captionCompositeRef: {
      id: CAPTION_DESIGN_COMPOSITE.compositeId,
      version: CAPTION_DESIGN_COMPOSITE.compositeVersion,
      contentHash: CAPTION_DESIGN_COMPOSITE.compositeDigestSha256,
    },
    compiledIntentRef: request.baseCanonicalPlanComponentsRef,
    professionalSkillTraceRef: traceRef(trace),
    confirmedOutputFrame: {
      outputId: request.canonicalScope.outputId,
      width: request.confirmedOutputFrame.width,
      height: request.confirmedOutputFrame.height,
      aspectRatioNumerator: 16,
      aspectRatioDenominator: 9,
      confirmedOutputFrameDigestSha256:
        request.confirmedOutputFrame.confirmedOutputFrameRef.contentHash,
    },
    canonicalTranscriptRef: domainRef('transcript.caption.source-led.1'),
    sourceSpeechEvidenceRef: domainRef('speech.caption.source-led.1'),
    sourceVisualUnderstandingRef:
      domainRef('visual.caption.source-led.1'),
    editPreferencesRef: domainRef('preferences.caption.source-led.1'),
    referenceDnaRef: null,
    planningTimingBasisRef: request.masterTimingRef,
    directive: {
      disposition: noCaptions ? 'no_captions' : 'caption_design_selected',
      reasonCodes: noCaptions
        ? ['owner_requested_no_captions']
        : ['caption_design_selected_by_professional_trace'],
      ownerApprovedRestraintRef: noCaptions
        ? domainRef('restraint.caption.source-led.1') : null,
    },
    projectMode: 'clean_long_form',
    primaryLanguage: 'en-US',
    requestedLanguages: ['en-US'],
    accessibleOutputKinds: noCaptions ? [] : ['srt', 'webvtt'],
    constraints: {
      allowedTypographyRoles: ['primary_speech'],
      maximumMotionLevel: noCaptions ? 'none' : 'restrained',
      maximumHeroMoments: 0,
      subjectOverlapAllowed: false,
      objectAnchoringAllowed: false,
      captionToVisualAllowed: false,
      captionSoundAllowed: false,
      allowedTextTransformations: ['exact', 'punctuation_cleanup'],
      requestedMaximumCaptionCredits: noCaptions ? 0 : 40,
      fallbackIds: ['fallback.stable_libass'],
    },
    scenes: baseComponents.segments.map((segment, index) => ({
      sceneId: segment.segmentId,
      planningFrameRange: {
        startFrame: segment.startFrame,
        endFrameExclusive: segment.endFrameExclusive,
      },
      sourcePhraseIds: [`phrase.caption.source-led.${index + 1}`],
      speechRole: 'primary',
      semanticImportanceBasisPoints: 8_000,
      visualDensity: 'low',
      multiTrackLikely: false,
      depthMaskOrTrackingLikely: false,
      requestedTreatment: noCaptions ? 'auto' : 'late_overlay',
      crossSystemTarget: null,
      candidateSafeRegions: [{
        regionId: `region.caption.source-led.${index + 1}`,
        regionBasisPoints: {
          x: 1_000, y: 7_000, width: 8_000, height: 1_500,
        },
        confidenceBasisPoints: 9_000,
        protectedRegionIds: ['face.primary'],
        evidenceRef: domainRef(
          `safe-region.caption.source-led.${index + 1}`),
      }],
      reasonCodes: ['speech_requires_readable_caption'],
    })),
  }
}

function assignment(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
  trace: ReturnType<typeof createProfessionalSkillCompositionTrace>,
  jobType: CaptionsSupportedJobType,
  sceneId: string | null,
  frameRange: { startFrame: number; endFrameExclusive: number },
): CanonicalCaptionSpecialistJobAssignmentIntent {
  const video = (CAPTIONS_VIDEO_JOB_TYPES as readonly string[])
    .includes(jobType)
  return {
    assignmentId:
      `assignment.caption.source-led.${jobType}.${sceneId ?? 'video'}`,
    jobType,
    scopeLevel: video ? 'video' : 'scene',
    outputId: request.canonicalScope.outputId,
    sceneId: video ? null : sceneId,
    boundaryId: null,
    authorizedFrameRange: structuredClone(frameRange),
    trigger: canonicalCaptionAssignmentTriggerForJob(jobType),
    selectionEvidenceRef: traceRef(trace),
    sourceSupportRequestRef: null,
    reasonCodes: ['selected_for_source_led_professional_plan'],
    callerMayCreateWork: false,
    captionMayDispatchPeerDirectly: false,
    captionMayExpandScope: false,
    browserMayMarkComplete: false,
  }
}

function domainRef(id: string, contentHash = sha256AuthorityValue(id)) {
  return { id, version: `${id}.v1`, contentHash }
}

function traceRef(
  trace: ReturnType<typeof createProfessionalSkillCompositionTrace>,
) {
  return {
    id: trace.traceId,
    version: trace.schemaVersion,
    contentHash: trace.traceDigestSha256,
  }
}

function bundleRef(bundle: ReturnType<typeof createCaptionEarlyPlanningBundle>) {
  return {
    id: bundle.bundleId,
    version: bundle.schemaVersion,
    contentHash: bundle.bundleDigestSha256,
  }
}

function requestRef(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
) {
  return {
    id: request.requestId,
    version: request.schemaVersion,
    contentHash: request.requestDigestSha256,
  }
}

function readyResult(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
  authority: ReturnType<
    typeof createCanonicalCaptionSourceLedProfessionalPlanningAuthority
  >,
): CanonicalCaptionSourceLedProfessionalPlanningReadResult {
  return {
    schemaVersion:
      CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
    status: 'ready',
    requestRef: requestRef(request),
    authority,
    blockerCodes: [],
  }
}

function blockedResult(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
  blockerCodes: string[],
): CanonicalCaptionSourceLedProfessionalPlanningReadResult {
  return {
    schemaVersion:
      CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
    status: 'blocked_requested',
    requestRef: requestRef(request),
    authority: null,
    blockerCodes,
  }
}

function notRequestedResult(
  request: CanonicalCaptionSourceLedProfessionalPlanningRequest,
): CanonicalCaptionSourceLedProfessionalPlanningReadResult {
  return {
    schemaVersion:
      CANONICAL_CAPTION_SOURCE_LED_PROFESSIONAL_PLANNING_READ_PORT_VERSION,
    status: 'not_requested',
    requestRef: requestRef(request),
    authority: null,
    blockerCodes: [],
  }
}
