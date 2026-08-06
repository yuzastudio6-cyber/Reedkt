import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION,
} from '../../src/types/canonical-caption-specialist-execution'
import {
  CANONICAL_CAPTION_SPECIALIST_PLANNING_BINDING_V3_VERSION,
  CANONICAL_CAPTION_SPECIALIST_PLANNING_PROJECTION_V3_VERSION,
} from '../../src/types/canonical-caption-specialist-planning'
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
checks += 1
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

console.log(JSON.stringify({
  smoke: 'canonical_caption_source_led_professional_planning_owner',
  status: 'passed',
  checks,
  selectedAssignments: 17,
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
