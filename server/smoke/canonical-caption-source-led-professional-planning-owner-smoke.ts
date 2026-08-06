import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  ApprovedEditExecutionUploadedMediaSourceAssetClientInput,
} from '../../src/lib/approved-edit-execution-package-client'
import type { PlannerInput } from '../../src/types/reeditpro'
import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
} from '../../src/types/canonical-caption-specialist-execution'
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
  canonicalSourceLedVisualIntelligenceEvidenceSchema,
  createCanonicalSourceLedContentAnalysisEvidence,
  createCanonicalSourceLedSourceFrameAuthority,
  digestCanonicalSourceLedStructuredSelection,
} from '../services/canonical-source-led-content-analysis-evidence'
import {
  createCanonicalSourceCleanupVisualIntelligenceBinding,
} from '../services/canonical-source-cleanup-visual-intelligence-binding'
import {
  compileCanonicalSourceLedPlan,
  type CanonicalSourceLedCleanupAuthorityInput,
} from '../services/canonical-source-led-plan-compiler'

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
const selectedRequest = createRequest(selectedComponents)
const selectedPort =
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    plannerInput: selectedPlannerInput,
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
  applied.workItems.filter((item) =>
    item.workerClass === CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS).length,
  17,
)
checks += 1
assert.equal(
  applied.estimate.lineItems.filter((line) =>
    line.category === 'caption_specialist').length,
  1,
)
checks += 1

const compatibilityPort =
  createCanonicalCaptionSourceLedProfessionalPlanningOwnerPort({
    plannerInput: selectedPlannerInput,
    components: selectedComponents,
    confirmedCaptionMarkerSetRef: null,
  })
const compatibilityRead =
  await readCanonicalCaptionSourceLedProfessionalPlanning({
    port: compatibilityPort,
    request: selectedRequest,
  })
assert.equal(compatibilityRead.status, 'not_requested')
checks += 1

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
    plannerInput: selectedPlannerInput,
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
    plannerInput: restrainedPlannerInput,
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
    plannerInput: selectedPlannerInput,
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
    plannerInput: selectedPlannerInput,
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
  selectedWithoutSourceEvidence: 'not_requested',
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

function sourceAuthority(input: {
  hasSpeech: boolean
  workspaceId?: string
}): CanonicalSourceLedCleanupAuthorityInput {
  const durationFrames = 120
  const transcriptSegments = input.hasSpeech ? [{
    segmentId: 'transcript-segment-1',
    startFrame: 0,
    endFrameExclusive: durationFrames,
    text: 'Authenticated fixture speech for deterministic planning.',
    confidenceBasisPoints: 9_500,
    wordsVerified: true,
  }] : []
  const transcriptCoverageWithoutDigest = {
    schemaVersion:
      'canonical-source-audio-complete-timeline-coverage-v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: durationFrames,
    completeAudioTimelineProcessed: true as const,
    speechSegmentsMayOmitSilence: true as const,
    embeddedInstructionDetectionRequired: true as const,
  }
  const observation = {
    observationId: 'visual-window-1',
    windowIndex: 1,
    startFrame: 0,
    endFrameExclusive: durationFrames,
    sourceFunction: input.hasSpeech ? 'dialogue' as const : 'idle' as const,
    actionIntensity: 'low' as const,
    editUsability: 'strong' as const,
    cameraStability: 'stable' as const,
    continuity: 'continuous' as const,
    confidenceBasisPoints: 9_400,
    evidenceRefs: [evidenceRef('source-probe')],
    providerObservationScope:
      'complete_source_range_semantic_partition' as const,
    exactProviderSampleFramesKnown: false as const,
  }
  const observations = [observation]
  const visualCoverageWithoutDigest = {
    schemaVersion:
      'canonical-source-visual-intelligence-semantic-coverage-v4' as const,
    profileId:
      'visual_intelligence_source_edit_planning_professional_high_v1' as const,
    coveredStartFrame: 0 as const,
    coveredEndFrameExclusive: durationFrames,
    maximumWindowFrames: 240 as const,
    windowCount: 1,
    gapCount: 0 as const,
    completeSourceRangeRequested: true as const,
    completeRequestedRangeSemanticCoverage: true as const,
    orderedGaplessObservationPartition: true as const,
    deterministicGpuEvidenceUsed: true as const,
    providerVisualPreprocessingExpected: true as const,
    everyTimelineFrameInspected: false as const,
    completeTimePixelInspectionClaimAllowed: false as const,
    providerAudioUnderstandingClaimAllowed: false as const,
    completeAudioTranscriptSuppliedToHeadReasonerSeparately: true as const,
  }
  const visual = canonicalSourceLedVisualIntelligenceEvidenceSchema.parse({
    status: 'completed',
    evidenceMode: 'visual_intelligence_gemini_pro_high_v1',
    providerCapabilityId: 'visual_intelligence',
    providerSkillId: 'visual_intelligence.analyze_media',
    operation: 'analyze_media',
    profile: 'source_edit_planning',
    providerAdapterId: 'vertex_gemini_pro',
    providerId: 'google_vertex_ai',
    providerModel: 'gemini-3.1-pro-preview',
    qualityProfile: 'professional_high',
    thinkingLevel: 'high',
    mediaResolution: 'high',
    requestRef: evidenceRef('visual-request'),
    reportRef: evidenceRef('visual-report'),
    admissionRef: evidenceRef('visual-admission'),
    providerReleaseRef: evidenceRef('visual-release'),
    costEvidenceRef: evidenceRef('visual-cost'),
    observationDigestSha256:
      digestCanonicalSourceLedStructuredSelection(observations),
    observations,
    coverage: {
      ...visualCoverageWithoutDigest,
      coverageDigestSha256:
        digestCanonicalSourceLedStructuredSelection(
          visualCoverageWithoutDigest),
    },
    lifecycleInvocationDisposition: 'cache_replay',
    providerCallMadeDuringInvocation: false,
    costSettledDuringInvocation: false,
    exactImmutableReportRereadVerified: true,
    applicationDefaultCredentialsUsed: true,
    accountEffectiveBillingRateUsed: true,
    publicListPriceUsedAsSettlementAuthority: false,
    providerVisualPreprocessingExpected: true,
    completeTimePixelInspectionClaimAllowed: false,
    selfHostedQwenRuntimeUsed: false,
    managedQwenApiUsed: false,
    localQwen25VlRuntimeUsed: false,
    signedReadUrlPersisted: false,
    signedReadUrlReturned: false,
    rawModelOutputPersisted: false,
  })
  const selectedRange = {
    rangeId: 'keep-source-1',
    startFrame: 0,
    endFrameExclusive: durationFrames,
    role: 'main_story' as const,
    reason: 'Preserve the complete source-backed explanation.',
    confidenceBasisPoints: 9_500,
    phraseBoundaryAligned: true as const,
    preservesSourceMeaning: true as const,
    userReviewRequired: false as const,
    evidenceIds: input.hasSpeech
      ? ['transcript-segment-1', 'visual-window-1']
      : ['visual-window-1'],
    keepReasonCodes: ['clear_explanation' as const],
    removedContextCodes: [],
    decisionBasis: 'content_understanding' as const,
    instructionIds: [],
    timeOnlyDecision: false as const,
  }
  const selection = {
    sources: [{
      sourceSequenceItemId: 'source-item-1',
      mediaAssetId: 'media-asset-1',
      uploadedOrder: 1,
      selectedRanges: [selectedRange],
      removedRanges: [],
      embeddedEditInstructions: [],
    }],
    sourceOrderPreserved: true,
    completeSourceCoverageVerified: true,
    allTimelineIntervalsReviewed: true,
    embeddedInstructionsEvaluated: true,
    timeOnlyCutDecisionCount: 0,
    meaningPreservationPassed: true,
    userReviewRequired: false,
    reviewReasons: [],
  }
  const evidence = createCanonicalSourceLedContentAnalysisEvidence({
    schemaVersion: 'canonical-source-led-content-analysis-evidence-v5',
    source: 'server_private_source_understanding_pipeline',
    identity: {
      workspaceId: input.workspaceId ?? 'workspace-caption-owner',
      projectId: 'project-caption-owner',
      editSessionId: 'edit-caption-owner',
      analysisRunId: input.hasSpeech
        ? 'analysis-caption-owner-speech'
        : 'analysis-caption-owner-silent',
      userInstructionDigestSha256: sha('user-instructions'),
      fps: 30,
    },
    sources: [{
      sourceSequenceItemId: 'source-item-1',
      mediaAssetId: 'media-asset-1',
      uploadedOrder: 1,
      checksumSha256: sha('source-bytes'),
      byteLength: 4_096,
      durationFrames,
      sourceFrameAuthority: createCanonicalSourceLedSourceFrameAuthority({
        fpsNumerator: 30,
        fpsDenominator: 1,
        frameCount: durationFrames,
        timeBaseNumerator: 1,
        timeBaseDenominator: 30,
      }),
      transcript: {
        status: input.hasSpeech ? 'completed' : 'no_speech',
        modelId: 'faster-whisper-large-v3',
        modelDigestSha256: sha('faster-whisper-large-v3'),
        runtimeVersion: 'faster-whisper-1.2.1',
        transcriptDigestSha256:
          digestCanonicalSourceLedStructuredSelection(transcriptSegments),
        segments: transcriptSegments,
        coverage: {
          ...transcriptCoverageWithoutDigest,
          coverageDigestSha256:
            digestCanonicalSourceLedStructuredSelection(
              transcriptCoverageWithoutDigest),
        },
        rawAudioPersisted: false,
        modelDownloadPerformed: false,
        networkAttempted: false,
      },
      visual,
      selectedRanges: [selectedRange],
      removedRanges: [],
      embeddedEditInstructions: [],
    }],
    reasoning: {
      status: 'completed',
      routeId: 'kimi_k3_primary',
      providerModel: 'kimi-k3',
      credentialSource: 'google_secret_manager_pinned_version',
      credentialVersion: 1,
      providerCallMade: true,
      modelCallMade: true,
      attemptDigestSha256: sha('reasoning-attempt'),
      structuredResultDigestSha256:
        digestCanonicalSourceLedStructuredSelection(selection),
      completeSourceCoverageConfirmed: true,
      allTimelineIntervalsReviewed: true,
      embeddedInstructionsEvaluated: true,
      timeOnlyCutDecisionsAllowed: false,
      rawProviderResponsePersisted: false,
    },
    summary: {
      selectedSourceCount: 1,
      selectedRangeCount: 1,
      selectedTotalFrames: durationFrames,
      originalTotalFrames: durationFrames,
      originalTotalTimelineFrames: durationFrames,
      selectedTotalTimelineFrames: durationFrames,
      rationalSourceFrameMappingVerified: true,
      sourceOrderPreserved: true,
      everySelectionEvidenceBound: true,
      everyRemovalEvidenceBound: true,
      completeSourceCoverageVerified: true,
      allTimelineIntervalsReviewed: true,
      embeddedInstructionsEvaluated: true,
      embeddedInstructionCount: 0,
      unresolvedEmbeddedInstructionCount: 0,
      timeOnlyCutDecisionCount: 0,
      meaningPreservationPassed: true,
      userReviewRequired: false,
    },
    boundaries: {
      privateEvidence: true,
      sourceBytesSerialized: false,
      localPathsSerialized: false,
      rawModelOutputSerialized: false,
      rawChatUsedAsWorkerInstruction: false,
      planPublished: false,
      approvalGranted: false,
      executionStarted: false,
      customerChargeCreated: false,
      publicDeliveryCreated: false,
      productionAuthority: false,
    },
  })
  const expectedScope = {
    workspaceId: evidence.identity.workspaceId,
    projectId: evidence.identity.projectId,
    editSessionId: evidence.identity.editSessionId,
    planningDirectionDigestSha256: sha('planning-direction'),
    userInstructionDigestSha256: evidence.identity.userInstructionDigestSha256,
  }
  return {
    evidence,
    binding: createCanonicalSourceCleanupVisualIntelligenceBinding({
      evidence,
      expectedScope,
    }),
    expectedScope,
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

function evidenceRef(id: string) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha(id)}`,
  }
}

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
