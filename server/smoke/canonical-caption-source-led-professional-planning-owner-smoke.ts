import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import type {
  OrchestraSkillCall,
  SkillCanonicalScope,
  SkillContractRef,
} from '../../src/types/orchestra-skill-contracts'
import type { SkillSupportRequestV2 } from
  '../../src/types/orchestra-skill-support-request-v2'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION,
} from '../../src/types/canonical-caption-specialist-planning'
import {
  CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS,
} from '../../src/types/caption-source-led-intent-policy'
import {
  canonicalPlanComponentsSchema,
} from '../validation/edit-planning-authority-schemas'
import {
  applyCanonicalCaptionSourceLedProfessionalPlanning,
  createCanonicalCaptionSourceLedProfessionalPlanningRequest,
  readCanonicalCaptionSourceLedProfessionalPlanning,
} from '../captions-specialist/caption-source-led-professional-planning'
import {
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort,
} from '../captions-specialist/caption-source-led-professional-planning-owner'
import { CAPTIONS_CLOSED_AUTHORITY_BOUNDARY } from
  '../captions-specialist/caption-authority-boundary'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
} from '../orchestra/orchestra-skill-contracts'
import {
  calculateSkillSupportRequestV2Digest,
  parseSkillSupportRequestV2,
} from '../orchestra/orchestra-skill-support-request-v2'
import {
  createCanonicalCaptionIncomingSupportRequestAdmission,
  createCanonicalCaptionIncomingSupportRequestRepository,
} from '../services/canonical-caption-incoming-support-request-service'
import {
  compileCanonicalSourceLedPlan,
} from '../services/canonical-source-led-plan-compiler'
import {
  createCanonicalSourceAnalysisAuthorityFixture as sourceAuthority,
} from './fixtures/canonical-source-led-content-analysis-authority-fixture'

let checks = 0

const selectedPlannerInput = plannerInput(
  'Use readable professional captions throughout the spoken source.',
)
const sourceAsset = finalizedSourceAsset()
const selectedSourceAuthority = sourceAuthority({ hasSpeech: true })
const selectedCompilation = compileCanonicalSourceLedPlan({
  plannerInput: selectedPlannerInput,
  sourceMediaAssets: [sourceAsset],
  confirmedCaptionMarkers: [],
  sourceCleanupAuthority: selectedSourceAuthority,
})
const selectedPublication = requirePublication(selectedCompilation)
const selectedComponents = canonicalPlanComponentsSchema.parse(
  selectedPublication.canonicalPlan.components,
)
const missingCompositionTraceComponents = structuredClone(selectedComponents)
delete missingCompositionTraceComponents.professionalSkillPlan
assert.throws(
  () => createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: missingCompositionTraceComponents,
    sourceCleanupAuthority: selectedSourceAuthority,
    confirmedCaptionMarkerSetRef: null,
  }),
  /exact professional-skill composition trace/i,
)
checks += 1
const selectedRequest = createRequest(selectedComponents)
const selectedPort =
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: selectedComponents,
    sourceCleanupAuthority: selectedSourceAuthority,
    confirmedCaptionMarkerSetRef: null,
  })
const selectedRead = await readCanonicalCaptionSourceLedProfessionalPlanning({
  port: selectedPort,
  request: selectedRequest,
})
assert.equal(selectedRead.status, 'ready')
checks += 1
if (selectedRead.status !== 'ready') throw new Error('unreachable')
assert.equal(selectedRead.authority.selectionDisposition, 'caption_design_selected')
checks += 1
assert.equal(
  selectedRead.authority.captionEarlyPlanningBundle.lifecycleState,
  'blocked_needs_visual_support',
)
checks += 1
assert.deepEqual(
  selectedRead.authority.captionEarlyPlanningBundle.supportRequirementCodes,
  ['visual_intelligence.safe_region_required'],
)
checks += 1
const sourcePhraseIds =
  selectedRead.authority.captionEarlyPlanningBundle.opportunityMap
    .opportunities[0]?.sourcePhraseIds ?? []
assert.equal(sourcePhraseIds.length, 1)
assert.match(sourcePhraseIds[0]!, /^caption-source-phrase\.[a-f0-9]{48}$/u)
checks += 1
assert.equal(
  selectedRead.authority.captionEarlyPlanningBundle.strategyPlan.primaryLanguage,
  'und',
)
assert.equal(
  selectedRead.authority.captionEarlyPlanningBundle.strategyPlan.projectMode,
  'dynamic_short_form',
)
checks += 2
assert.equal(
  selectedRead.authority.captionEarlyPlanningBundle.reservationPlan
    .reservations[0]?.selectedRegionId,
  null,
)
checks += 1
const selectedBinding =
  selectedRead.authority.captionSpecialistPlanningBinding
assert.equal(
  selectedBinding.schemaVersion,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION,
)
assert.equal('canonicalTranscriptRef' in selectedBinding, false)
const sourceTranscriptExpectation =
  selectedRead.authority.captionEarlyPlanningBundle.inputRefs.find((ref) =>
    ref.version === 'canonical-source-transcript-planning-evidence-v1')
assert.deepEqual(
  'canonicalTranscriptExpectationRef' in selectedBinding
    ? selectedBinding.canonicalTranscriptExpectationRef : null,
  sourceTranscriptExpectation,
)
assert.equal(
  'postapprovalCanonicalTranscriptResolutionRequired' in selectedBinding
    && selectedBinding.postapprovalCanonicalTranscriptResolutionRequired,
  true,
)
checks += 4
assert.equal('assignmentIntents' in selectedBinding, true)
if (!('assignmentIntents' in selectedBinding)) throw new Error('unreachable')
assert.equal(selectedBinding.assignmentIntents.length, 17)
const baselineSourceLedAssignmentTypes = selectedBinding.assignmentIntents.map(
  (assignment) => assignment.jobType)
checks += 1
assert.equal(selectedRead.authority.captionEstimateLine?.category, 'caption_specialist')
checks += 1
assert.equal(selectedRead.authority.workCreated, false)
assert.equal(selectedRead.authority.providerCalled, false)
assert.equal(selectedRead.authority.finalQaApproved, false)
checks += 3

const applied = applyCanonicalCaptionSourceLedProfessionalPlanning({
  request: selectedRequest,
  authority: selectedRead.authority,
  components: selectedComponents,
  estimate: selectedPublication.canonicalPlan.estimate,
  workItems: selectedPublication.canonicalPlan.workItems,
})
assert.equal(
  applied.projection.disposition,
  'planning_work_projected_downstream_caption_execution_required',
)
checks += 1
assert.equal(
  applied.projection.schemaVersion,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION,
)
assert.equal(
  'canonicalTranscriptExpectationRef' in applied.projection
    && applied.projection.canonicalTranscriptExpectationRef.contentHash ===
      sourceTranscriptExpectation?.contentHash,
  true,
)
checks += 2
const selectedCaptionWork = applied.workItems.filter((item) =>
  item.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS)
assert.equal(
  selectedCaptionWork.length,
  17,
)
checks += 1
assert.equal(selectedCaptionWork.every((item) => {
  const executionInput = item.executionInput as Record<string, unknown>
  const refs = Array.isArray(executionInput.initialArtifactRefs)
    ? executionInput.initialArtifactRefs as Array<Record<string, unknown>> : []
  return executionInput.schemaVersion ===
      CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION
    && refs.some((ref) => ref.artifactType ===
      'canonical_transcript_planning_expectation')
    && refs.every((ref) => ref.artifactType !== 'canonical_transcript')
}), true)
checks += 1
assert.equal(
  applied.estimate.lineItems.filter((line) =>
    line.category === 'caption_specialist').length,
  1,
)
checks += 1

const spatialPlan = await advancedPlan({
  captionStyle: 'sentence_block_captions',
})
assert.deepEqual(
  assignmentTypes(spatialPlan),
  [...baselineAssignmentTypes(), 'resolve_spatial_typography'],
)
assert.deepEqual(
  spatialPlan.authority.captionEarlyPlanningBundle.strategyPlan
    .selectedIntegrationClasses,
  ['reserved_composition'],
)
checks += 2

for (const presetId of [
  'spatial_caption_compositing',
  'caption_camera_coordination',
] as const) {
  const plan = await advancedPlan({}, [presetId])
  assert.equal(
    assignmentTypes(plan).includes('resolve_spatial_typography'),
    true,
  )
  assert.equal(
    plan.authority.captionEarlyPlanningBundle.strategyPlan
      .selectedIntegrationClasses.includes('reserved_composition'),
    true,
  )
  checks += 2
}

for (const [presetId, jobType] of [
  ['subject_occluded_typography',
    'resolve_subject_occluded_typography'],
  ['front_of_subject_typography',
    'resolve_front_of_subject_typography'],
  ['object_anchored_typography',
    'resolve_object_anchored_typography'],
  ['environmental_typography',
    'resolve_environmental_typography'],
] as const) {
  const plan = await advancedPlan({}, [presetId])
  assert.equal(assignmentTypes(plan).includes('resolve_spatial_typography'), true)
  assert.equal(assignmentTypes(plan).includes(jobType), true)
  assert.equal(
    plan.authority.captionSpecialistPlanningBinding.scenePolicies[0]
      ?.trackingJobType,
    jobType,
  )
  assert.equal(
    plan.authority.captionEarlyPlanningBundle.supportRequirementCodes
      .includes('track_all.mask_track_candidate_required'),
    true,
  )
  checks += 4
}

const multiTrackPlan = await advancedPlan({}, [
  'caption_speaker_identification',
])
assert.equal(
  assignmentTypes(multiTrackPlan).includes(
    'resolve_multi_track_caption_scene'),
  true,
)
assert.equal(
  assignmentTypes(multiTrackPlan).includes('resolve_spatial_typography'),
  true,
)
checks += 2

const heroPlan = await advancedPlan({}, ['hero_typography_direction'])
assert.equal(assignmentTypes(heroPlan).includes('resolve_hero_typography'), true)
assert.equal(
  heroPlan.authority.captionEarlyPlanningBundle.approvalEnvelope
    .maximumHeroMoments,
  1,
)
assert.deepEqual(
  heroPlan.authority.captionEarlyPlanningBundle.strategyPlan
    .selectedIntegrationClasses,
  ['structural_typography'],
)
checks += 3

const persistentPlan = await advancedPlan({}, [
  'persistent_topic_list_typography',
])
assert.equal(
  assignmentTypes(persistentPlan).includes(
    'resolve_persistent_topic_typography'),
  true,
)
assert.equal(
  assignmentTypes(persistentPlan).includes('resolve_spatial_typography'),
  true,
)
checks += 2

for (const target of [
  'broll', 'living_frame', 'map', 'chart', 'diagram', 'transition',
] as const) {
  const plan = await advancedPlan({}, [
    'caption_to_visual_bridge',
    CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS[target],
  ])
  const binding = plan.authority.captionSpecialistPlanningBinding
  assert.equal(binding.scenePolicies[0]?.crossSystemTarget, target)
  assert.equal(
    assignmentTypes(plan).includes('plan_caption_to_visual_handoff'),
    true,
  )
  assert.equal(
    assignmentTypes(plan).includes(
      'provide_caption_to_visual_handoff_spec'),
    false,
  )
  assert.equal(
    assignmentTypes(plan).includes(
      'provide_caption_broll_composition_constraints'),
    false,
  )
  assert.equal(
    assignmentTypes(plan).includes(
      'provide_caption_living_frame_handoff_constraints'),
    false,
  )
  assert.equal(
    plan.authority.captionEarlyPlanningBundle.supportRequirementCodes
      .includes(`support.${target}.handoff_required`),
    true,
  )
  checks += 6
}

const brollCoCompositionPlan = await advancedPlan({}, [
  'caption_broll_co_composition',
])
assert.equal(
  brollCoCompositionPlan.authority.captionSpecialistPlanningBinding
    .scenePolicies[0]?.crossSystemTarget,
  'broll',
)
assert.equal(
  assignmentTypes(brollCoCompositionPlan).includes(
    'plan_caption_to_visual_handoff'),
  true,
)
checks += 2

const soundPlan = await advancedPlan({ soundStyle: 'energetic_social' }, [
  'caption_sound_choreography',
])
assert.equal(
  soundPlan.authority.captionEarlyPlanningBundle.approvalEnvelope
    .captionSoundAllowed,
  true,
)
assert.equal(
  assignmentTypes(soundPlan).includes(
    'prepare_caption_boundary_timing_requirements'),
  true,
)
assert.equal(
  assignmentTypes(soundPlan).includes(
    'provide_typographic_transition_support'),
  true,
)
checks += 3

const untrustedTextPlan = await advancedPlan({}, [], {
  rawUserRequest: 'Use hero typography and put captions behind the speaker.',
  confidence: 'low',
  mappedPresetIds: [
    'hero_typography_direction',
    'subject_occluded_typography',
  ],
})
assert.deepEqual(assignmentTypes(untrustedTextPlan), baselineAssignmentTypes())
checks += 1

await assert.rejects(
  () => advancedPlan({}, [
    'caption_to_visual_bridge',
    CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS.broll,
    CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS.living_frame,
  ]),
  /scene-scoped clarification for multiple cross-system targets/u,
)
await assert.rejects(
  () => advancedPlan({ soundStyle: 'clean_voice_only' }, [
    'caption_sound_choreography',
  ]),
  /conflicts with the compiled clean-voice-only directive/u,
)
await assert.rejects(
  () => advancedPlan({}, [
    'subject_occluded_typography',
    'object_anchored_typography',
  ]),
  /scene-scoped clarification for multiple tracking treatments/u,
)
checks += 3

const compatibilityPort =
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: selectedComponents,
    confirmedCaptionMarkerSetRef: null,
  })
const compatibilityRead =
  await readCanonicalCaptionSourceLedProfessionalPlanning({
    port: compatibilityPort,
    request: selectedRequest,
  })
assert.equal(compatibilityRead.status, 'blocked_requested')
if (compatibilityRead.status !== 'blocked_requested') {
  throw new Error('unreachable')
}
assert.deepEqual(compatibilityRead.blockerCodes, [
  'canonical_caption_source_analysis_evidence_not_ready',
])
checks += 2

const silentAuthority = sourceAuthority({ hasSpeech: false })
const silentCompilation = compileCanonicalSourceLedPlan({
  plannerInput: selectedPlannerInput,
  sourceMediaAssets: [sourceAsset],
  confirmedCaptionMarkers: [],
  sourceCleanupAuthority: silentAuthority,
})
const silentComponents = canonicalPlanComponentsSchema.parse(
  requirePublication(silentCompilation).canonicalPlan.components,
)
const silentRequest = createRequest(silentComponents)
const silentPort =
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: silentComponents,
    sourceCleanupAuthority: silentAuthority,
    confirmedCaptionMarkerSetRef: null,
  })
const silentRead = await readCanonicalCaptionSourceLedProfessionalPlanning({
  port: silentPort,
  request: silentRequest,
})
assert.equal(silentRead.status, 'blocked_requested')
checks += 1
if (silentRead.status !== 'blocked_requested') throw new Error('unreachable')
assert.deepEqual(
  silentRead.blockerCodes,
  ['canonical_captionable_speech_evidence_not_ready'],
)
checks += 1

const restrainedPlannerInput = plannerInput(
  'Do not use captions. This edit must have no captions.',
)
const restrainedCompilation = compileCanonicalSourceLedPlan({
  plannerInput: restrainedPlannerInput,
  sourceMediaAssets: [sourceAsset],
  confirmedCaptionMarkers: [],
})
const restrainedPublication = requirePublication(restrainedCompilation)
const restrainedComponents = canonicalPlanComponentsSchema.parse(
  restrainedPublication.canonicalPlan.components,
)
const restrainedRequest = createRequest(restrainedComponents)
const restrainedPort =
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: restrainedComponents,
    confirmedCaptionMarkerSetRef: null,
  })
const restrainedRead =
  await readCanonicalCaptionSourceLedProfessionalPlanning({
    port: restrainedPort,
    request: restrainedRequest,
  })
assert.equal(restrainedRead.status, 'ready')
checks += 1
if (restrainedRead.status !== 'ready') throw new Error('unreachable')
assert.equal(restrainedRead.authority.selectionDisposition, 'no_captions')
assert.equal(restrainedRead.authority.captionEstimateLine, null)
assert.equal(
  'assignmentIntents' in
    restrainedRead.authority.captionSpecialistPlanningBinding,
  false,
)
checks += 3
const restrainedApplied = applyCanonicalCaptionSourceLedProfessionalPlanning({
  request: restrainedRequest,
  authority: restrainedRead.authority,
  components: restrainedComponents,
  estimate: restrainedPublication.canonicalPlan.estimate,
  workItems: restrainedPublication.canonicalPlan.workItems,
})
assert.equal(
  restrainedApplied.workItems.some((item) =>
    item.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS),
  false,
)
checks += 1

const restrainedWithStaleAdvancedDirective = structuredClone(
  restrainedComponents)
restrainedWithStaleAdvancedDirective.professionalEditingDirective = {
  ...restrainedWithStaleAdvancedDirective.professionalEditingDirective,
  customDirectives: [{
    id: 'stale-advanced-caption-directive',
    rawUserRequest: 'Stale advanced request superseded by no captions.',
    interpretedMeaning: 'The exact no-captions restraint must win.',
    mappedPresetIds: [
      'caption_to_visual_bridge',
      CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS.broll,
      CAPTION_SOURCE_LED_CROSS_SYSTEM_TARGET_PRESET_IDS.living_frame,
    ],
    customOverrides: [],
    mustFollowRules: [],
    avoidRules: [],
    confidence: 'high',
    clarifyingQuestions: [],
  }],
}
const restrainedAdvancedComponents = canonicalPlanComponentsSchema.parse(
  restrainedWithStaleAdvancedDirective)
const restrainedAdvancedRead =
  await readCanonicalCaptionSourceLedProfessionalPlanning({
    port: createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
      components: restrainedAdvancedComponents,
      confirmedCaptionMarkerSetRef: null,
    }),
    request: createRequest(restrainedAdvancedComponents),
  })
assert.equal(restrainedAdvancedRead.status, 'ready')
if (restrainedAdvancedRead.status !== 'ready') throw new Error('unreachable')
assert.equal(
  restrainedAdvancedRead.authority.selectionDisposition,
  'no_captions',
)
assert.equal(
  'assignmentIntents' in
    restrainedAdvancedRead.authority.captionSpecialistPlanningBinding,
  false,
)
checks += 3

const crossedComponents = structuredClone(selectedComponents)
crossedComponents.compiledIntent = {
  ...crossedComponents.compiledIntent,
  crossedCaptionOwnerFixture: true,
}
const crossedRequest = createRequest(
  canonicalPlanComponentsSchema.parse(crossedComponents),
)
await assert.rejects(
  () => readCanonicalCaptionSourceLedProfessionalPlanning({
    port: selectedPort,
    request: crossedRequest,
  }),
  /stale or crossed plan evidence/u,
)
checks += 1

const crossedSourceAuthority = sourceAuthority({
  hasSpeech: true,
  workspaceId: 'workspace-caption-owner-crossed',
})
const crossedSourcePort =
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: selectedComponents,
    sourceCleanupAuthority: crossedSourceAuthority,
    confirmedCaptionMarkerSetRef: null,
  })
await assert.rejects(
  () => readCanonicalCaptionSourceLedProfessionalPlanning({
    port: crossedSourcePort,
    request: selectedRequest,
  }),
  /crossed source-analysis scope/u,
)
checks += 1

const tamperedEvidence = structuredClone(
  selectedSourceAuthority.evidence,
) as Record<string, unknown>
tamperedEvidence.evidenceDigestSha256 = sha('tampered-source-evidence')
await assert.rejects(() =>
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: selectedComponents,
    sourceCleanupAuthority: {
      ...selectedSourceAuthority,
      evidence: tamperedEvidence as never,
    },
    confirmedCaptionMarkerSetRef: null,
  }).readForSourceLedPlan(selectedRequest),
)
checks += 1

const supportScene = selectedComponents.segments[0]!
const incomingSupportScope: SkillCanonicalScope = {
  ownerUserId: selectedRequest.canonicalScope.ownerUserId,
  workspaceId: selectedRequest.canonicalScope.workspaceId,
  projectId: selectedRequest.canonicalScope.projectId,
  editSessionId: selectedRequest.canonicalScope.editSessionId,
  approvedSnapshotRef: null,
  outputId: selectedRequest.canonicalScope.outputId,
  sceneId: supportScene.segmentId,
  boundaryId: null,
  authorizedFrameRanges: [{
    startFrame: supportScene.startFrame,
    endFrameExclusive: supportScene.endFrameExclusive,
  }],
}
const incomingOriginCall = supportCall({
  callId: 'living-frame-caption-owner-support-origin',
  assigneeSkillKey: 'living_frame',
  jobType: 'request_caption_typography_support',
  scope: incomingSupportScope,
})
const incomingSupportRequest = supportRequest({
  requestId: 'caption-owner-incoming-typography-support',
  originalCall: incomingOriginCall,
  scope: incomingSupportScope,
})
const incomingSupportAdmission =
  createCanonicalCaptionIncomingSupportRequestAdmission({
    request: incomingSupportRequest,
    originalCall: incomingOriginCall,
    admittedAt: '2026-08-08T15:10:00.000Z',
  })
const supportObjects = new Map<string, Buffer>()
const incomingSupportRepository =
  createCanonicalCaptionIncomingSupportRequestRepository({
    objectPort: {
      async createOnly({ objectPath, body }) {
        const existing = supportObjects.get(objectPath)
        if (existing) {
          assert.deepEqual(existing, body)
          return 'already_exists'
        }
        supportObjects.set(objectPath, Buffer.from(body))
        return 'created'
      },
      async readExact(objectPath) {
        const body = supportObjects.get(objectPath)
        return body === undefined ? null : Buffer.from(body)
      },
    },
  })
await incomingSupportRepository.persistCreateOnly({
  admission: incomingSupportAdmission,
})
const incomingSupportRead =
  await readCanonicalCaptionSourceLedProfessionalPlanning({
    port: createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
      components: selectedComponents,
      sourceCleanupAuthority: selectedSourceAuthority,
      confirmedCaptionMarkerSetRef: null,
      incomingSupportRequests: [{
        readPort: incomingSupportRepository.readPort,
        requestRef: incomingSupportAdmission.requestRef,
      }],
    }),
    request: selectedRequest,
  })
assert.equal(incomingSupportRead.status, 'ready')
if (incomingSupportRead.status !== 'ready') throw new Error('unreachable')
const incomingBinding =
  incomingSupportRead.authority.captionSpecialistPlanningBinding
assert.ok('assignmentIntents' in incomingBinding)
if (!('assignmentIntents' in incomingBinding)) throw new Error('unreachable')
const supportAssignment = incomingBinding.assignmentIntents.find(
  (assignment) => assignment.jobType ===
    'provide_speech_derived_typography_spec')
assert.ok(supportAssignment)
assert.equal(supportAssignment.trigger, 'hq_mediated_support_request')
assert.deepEqual(
  supportAssignment.sourceSupportRequestRef,
  incomingSupportAdmission.requestRef,
)
const incomingProjection = applyCanonicalCaptionSourceLedProfessionalPlanning({
  request: selectedRequest,
  authority: incomingSupportRead.authority,
  components: selectedComponents,
  estimate: selectedPublication.canonicalPlan.estimate,
  workItems: selectedPublication.canonicalPlan.workItems,
})
const supportWorkItem = incomingProjection.workItems.find((item) =>
  item.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS
  && item.executionInput.captionJobType ===
    'provide_speech_derived_typography_spec')
assert.ok(supportWorkItem)
assert.equal(
  (supportWorkItem.executionInput.initialArtifactRefs as Array<{
    artifactType: string
    contentHash: string
  }>).some((artifact) =>
    artifact.artifactType === 'source_skill_support_request'
    && artifact.contentHash ===
      incomingSupportRequest.requestDigestSha256),
  true,
)
checks += 7

await assert.rejects(() =>
  readCanonicalCaptionSourceLedProfessionalPlanning({
    port: createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
      components: selectedComponents,
      sourceCleanupAuthority: selectedSourceAuthority,
      confirmedCaptionMarkerSetRef: null,
      incomingSupportRequests: [{
        readPort: incomingSupportRepository.readPort,
        requestRef: incomingSupportAdmission.requestRef,
      }, {
        readPort: incomingSupportRepository.readPort,
        requestRef: incomingSupportAdmission.requestRef,
      }],
    }),
    request: selectedRequest,
  }), /duplicated a request/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical_caption_source_led_professional_planning_owner',
  status: 'passed',
  checks,
  selectedAssignments: 17,
  advancedSourceLedProfilesVerified: 18,
  rawDirectiveTextInterpretedByCaptionOwner: false,
  advancedSupportJobsCreatedWithoutTypedRequest: false,
  incomingSupportRequestPersistedAndSelected: true,
  canonicalSourceAnalysisReread: true,
  safeRegionGeometryInvented: false,
  selectedWithoutSourceEvidence: 'blocked_requested',
  selectedWithoutSpeech: 'blocked_requested',
  noCaptionsRestraintReady: true,
  workCreatedByOwner: false,
  providerCalled: false,
  approvalGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

async function advancedPlan(
  directiveOverrides: Record<string, unknown>,
  mappedPresetIds: string[] = [],
  customDirectiveOverrides: Partial<{
    rawUserRequest: string
    interpretedMeaning: string
    mappedPresetIds: string[]
    confidence: 'low' | 'medium' | 'high'
    clarifyingQuestions: string[]
  }> = {},
) {
  const components = structuredClone(selectedComponents)
  components.professionalEditingDirective = {
    ...components.professionalEditingDirective,
    ...directiveOverrides,
    customDirectives: [
      'Raw Caption request text must not activate owner policy.',
      {
        id: 'caption-owner-structured-directive',
        rawUserRequest: 'Structured Caption treatment request.',
        interpretedMeaning:
          'Use only the exact mapped Caption mini-skill presets.',
        mappedPresetIds,
        customOverrides: [],
        mustFollowRules: [],
        avoidRules: [],
        confidence: 'high',
        clarifyingQuestions: [],
        ...customDirectiveOverrides,
      },
    ],
  }
  const parsedComponents = canonicalPlanComponentsSchema.parse(components)
  const request = createRequest(parsedComponents)
  const port = createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    components: parsedComponents,
    sourceCleanupAuthority: selectedSourceAuthority,
    confirmedCaptionMarkerSetRef: null,
  })
  const read = await readCanonicalCaptionSourceLedProfessionalPlanning({
    port,
    request,
  })
  assert.equal(read.status, 'ready')
  if (read.status !== 'ready') throw new Error('unreachable')
  assert.equal(
    'assignmentIntents' in read.authority.captionSpecialistPlanningBinding,
    true,
  )
  const projection = applyCanonicalCaptionSourceLedProfessionalPlanning({
    request,
    authority: read.authority,
    components: parsedComponents,
    estimate: selectedPublication.canonicalPlan.estimate,
    workItems: selectedPublication.canonicalPlan.workItems,
  })
  if (!('assignmentIntents' in
    read.authority.captionSpecialistPlanningBinding)) {
    throw new Error('unreachable')
  }
  assert.equal(
    projection.workItems.filter((item) =>
      item.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS).length,
    read.authority.captionSpecialistPlanningBinding.assignmentIntents.length,
  )
  assert.deepEqual(
    projection.projection.projectedJobTypes,
    read.authority.captionSpecialistPlanningBinding.assignmentIntents.map(
      (assignment) => assignment.jobType),
  )
  checks += 4
  return read
}

function assignmentTypes(
  plan: Awaited<ReturnType<typeof advancedPlan>>,
) {
  const binding = plan.authority.captionSpecialistPlanningBinding
  if (!('assignmentIntents' in binding)) throw new Error('unreachable')
  return binding.assignmentIntents.map((assignment) => assignment.jobType)
}

function baselineAssignmentTypes() {
  return [...baselineSourceLedAssignmentTypes]
}

function plannerInput(customInstructions: string): PlannerInput {
  return {
    projectName: 'Caption source-led planning owner smoke',
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
    customInstructions,
    userInstructionHistory: [customInstructions],
    creditPreference: 'balanced',
    clips: [{
      id: 'uploaded-clip-1',
      uploadedOrder: 1,
      fileName: 'source-1.mp4',
      duration: '4',
      detectedType: 'Verified uploaded video',
      sourceRole: 'main_story',
      isImportant: true,
    }],
    sourceSequenceMode: 'single_complete_video',
    sourceOrderConfirmed: true,
    cleanupPreference: 'preserve_natural',
    cleanupPreferenceConfirmed: true,
    preferenceDefaultsApplied: true,
    preferenceSnapshotId: 'caption-owner-preference-snapshot',
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
    currentEditPreferenceRecordRevision: 1,
    currentEditPreferenceRevision: 1,
    currentEditPreferencePlanningInputRevision: 1,
    currentEditPreferenceFingerprintSha256: sha('preferences'),
  }
}

function finalizedSourceAsset():
ApprovedEditExecutionUploadedMediaSourceAssetClientInput {
  return {
    mediaAssetId: 'media-asset-1',
    storageObjectRecordId: 'storage-object-1',
    sourceSequenceItemId: 'source-item-1',
    uploadedClipId: 'uploaded-clip-1',
    uploadedOrder: 1,
    storageProvider: 'local_private',
    storageBucket: 'private-internal',
    storagePath: 'caption-owner/source-1.mp4',
    fileName: 'source-1.mp4',
    mimeType: 'video/mp4',
    byteSize: 4_096,
    checksumSha256: sha('source-bytes'),
    sourceMetadata: {
      probeStatus: 'probed',
      source: 'local_ffprobe',
      durationSeconds: 4,
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

function createRequest(
  components: ReturnType<typeof canonicalPlanComponentsSchema.parse>,
) {
  return createCanonicalCaptionSourceLedProfessionalPlanningRequest({
    canonicalScope: {
      ownerUserId: 'owner-caption-owner',
      workspaceId: 'workspace-caption-owner',
      projectId: 'project-caption-owner',
      editSessionId: 'edit-caption-owner',
      planningRequestId: 'planning-caption-owner',
      outputId: 'output-caption-owner',
    },
    components,
    confirmedCaptionMarkerSetRef: null,
  })
}

function requirePublication(
  compilation: ReturnType<typeof compileCanonicalSourceLedPlan>,
) {
  const publication = compilation.canonicalDraft.publication ??
    compilation.professionalLongFormPublication
  assert.ok(publication)
  return publication
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function supportCall(input: {
  callId: string
  assigneeSkillKey: string
  jobType: string
  scope: SkillCanonicalScope
}): OrchestraSkillCall {
  const withoutDigest: Omit<OrchestraSkillCall, 'callDigestSha256'> = {
    schemaVersion: 'orchestra-skill-call-v1',
    callId: input.callId,
    idempotencyKey: `${input.callId}-idempotency`,
    caller: {
      callerKind: 'head_of_orchestra',
      callerId: 'canonical-approved-edit-workflow',
    },
    assigneeSkillKey: input.assigneeSkillKey,
    job: {
      jobId: `${input.callId}-job`,
      jobType: input.jobType,
      requestedMode: 'planning',
      scopeLevel: 'scene',
    },
    canonicalScope: structuredClone(input.scope),
    manifestRef: supportRef(`${input.assigneeSkillKey}-manifest`),
    qualificationSnapshotRef:
      supportRef(`${input.assigneeSkillKey}-qualification`),
    inputArtifactRefs: [],
    injectedSupportArtifactRefs: [],
    resumeOfSupportRequestRef: null,
    resumeOriginCallRef: null,
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
    privateArtifactPolicy: {
      tenantScoped: true,
      byteFreeCoordinationOnly: true,
      rawChatAllowed: false,
      mediaBytesAllowed: false,
      urlOrPathAllowed: false,
    },
  }
  return parseOrchestraSkillCall({
    ...withoutDigest,
    callDigestSha256: calculateSkillContractDigest(
      withoutDigest as unknown as Record<string, unknown>,
      'callDigestSha256',
    ),
  })
}

function supportRequest(input: {
  requestId: string
  originalCall: OrchestraSkillCall
  scope: SkillCanonicalScope
}): SkillSupportRequestV2 {
  const withoutDigest: Omit<SkillSupportRequestV2, 'requestDigestSha256'> = {
    schemaVersion: 'skill-support-request-v2',
    requestId: input.requestId,
    originalCallRef: {
      id: input.originalCall.callId,
      version: input.originalCall.schemaVersion,
      contentHash: input.originalCall.callDigestSha256,
    },
    requestingSkillKey: input.originalCall.assigneeSkillKey,
    targetSkillKey: 'captions',
    requestedJobType: 'provide_speech_derived_typography_spec',
    reasonCode: 'speech_typography_required_for_visual_handoff',
    requestedArtifactTypes: ['caption_speech_derived_typography_spec'],
    canonicalScope: structuredClone(input.scope),
    typedPayloadType: 'caption-speech-typography-support-context-v1',
    typedPayload: {
      schemaVersion: 'caption-speech-typography-support-context-v1',
      semanticConceptRef: supportRef('caption-semantic-concept'),
      requesterMayDispatchCaptionDirectly: false,
    },
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: { ...CAPTIONS_CLOSED_AUTHORITY_BOUNDARY },
  }
  return parseSkillSupportRequestV2({
    ...withoutDigest,
    requestDigestSha256: calculateSkillSupportRequestV2Digest(
      withoutDigest as unknown as Record<string, unknown>),
  })
}

function supportRef(id: string): SkillContractRef {
  return {
    id,
    version: 'contract-v1',
    contentHash: sha(id),
  }
}
