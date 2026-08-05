import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from '../../src/types/caption-domain-contracts'
import type {
  CaptionTrackAllSubjectEvidence,
  CaptionTrackAllSupportPayload,
} from '../../src/types/caption-track-all-support'
import type {
  OrchestraSkillCall as CaptionOrchestraSkillCall,
  OrchestraSkillJobResult as CaptionOrchestraSkillJobResult,
  SkillClosedAuthorityBoundary,
  SkillContractRef,
  SkillSupportRequest as CaptionSkillSupportRequest,
} from '../../src/types/orchestra-skill-contracts'
import {
  ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
} from '../../src/types/orchestra-skill-capability'
import {
  createOrchestraSkillCall,
  createSkillSupportRequest,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  calculateSkillContractDigest,
  parseOrchestraSkillCall,
  parseOrchestraSkillJobResult,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-contracts'
import {
  createCanonicalCaptionTrackAllEvidenceRepository,
  createCanonicalCaptionTrackAllSupportService,
  createCanonicalTrackAllSam31CaptionSceneEvidenceRepository,
  parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord,
  parseCanonicalTrackAllSam31CaptionSceneEvidence,
  parseCaptionTrackAllSupportPayload,
} from '../services/canonical-caption-track-all-support-service'
import {
  createCanonicalTrackAllSam31TaskQaOwner,
  createCanonicalTrackAllSam31TaskQaRepository,
  sealCanonicalTrackAllSam31L4MaskQaMeasurement,
  sealCanonicalTrackAllSam31PrivateSceneReview,
} from '../services/canonical-track-all-sam3_1-task-qa-owner'
import {
  buildTrackAllSam31CaptionEvidenceFinalizationRequest,
  createCanonicalTrackAllSam31CaptionEvidenceFinalizationRuntime,
  parseTrackAllSam31CaptionEvidenceFinalizationRequest,
  parseTrackAllSam31CaptionEvidenceFinalizationResult,
} from '../services/canonical-track-all-sam3_1-caption-evidence-finalization-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSpecialistCallResultPair,
  createCanonicalSpecialistSupportResumeRepository,
} from '../services/canonical-specialist-support-resume-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  buildCanonicalSam31GpuTaskContext,
  buildCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'
import {
  admitCanonicalSam31GpuRuntimeResult,
  canonicalSam31PrivateOutputRereadEvidenceSchema,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  createCanonicalTrackAllSam31OrchestraBinding,
} from '../workers/masks/canonical-track-all-sam3_1-orchestra-binding'
import {
  a100,
  canonicalSam31A100LaunchFixture,
  canonicalSam31A100PrivateOutputEvidenceFixture,
  canonicalSam31A100RuntimeResponseFixture,
  canonicalSam31A100TaskFixture,
  canonicalSam31A100TerminalFixture,
} from './canonical-sam3_1-gpu-task-owner-smoke'

const controlObjects = new Map<string, Buffer>()
const controlPort = memoryObjectPort(controlObjects)
const supportResumeRepository =
  createCanonicalSpecialistSupportResumeRepository({
    objectPort: controlPort,
    prefix: 'private/smoke/caption-track-all/support-resume/v1',
  })
const sceneEvidenceRepository =
  createCanonicalTrackAllSam31CaptionSceneEvidenceRepository({
    objectPort: controlPort,
    prefix: 'private/smoke/caption-track-all/scene-evidence/v1',
  })
const taskQaRepository = createCanonicalTrackAllSam31TaskQaRepository({
  objectPort: controlPort,
  prefix: 'private/smoke/caption-track-all/task-qa/v1',
})
const evidenceRepository = createCanonicalCaptionTrackAllEvidenceRepository({
  objectPort: controlPort,
  prefix: 'private/smoke/caption-track-all/records/v2',
})

const backendSupport = createSkillSupportRequest({
  schemaVersion: ORCHESTRA_SKILL_SUPPORT_REQUEST_VERSION,
  requestId: 'caption-backend-track-all-support-request',
  requestingSkillKey: 'captions',
  requestingSkillJobId: 'caption-backend-track-all-job',
  parentOrchestraJobId: a100.orchestraCall.orchestraJobRef.id,
  requiredCapability: 'track_all',
  requestedJobType: 'track_subject_geometry',
  phase: a100.orchestraCall.phase,
  scope: a100.orchestraCall.scope,
  purposeCode: 'produce_exact_subject_geometry',
  inputArtifactRefs: a100.orchestraCall.sourceArtifactRefs,
  comparisonArtifactRefs: a100.orchestraCall.comparisonArtifactRefs,
  expectedOutcomeRefs: a100.orchestraCall.expectedOutcomeRefs,
  requiredEvidenceRefs: a100.orchestraCall.requiredEvidenceRefs,
  urgency: 'blocking',
  supportRequestOnly: true,
  executionAuthorityGranted: false,
  providerInvocationAuthorityGranted: false,
  timelineMutationAuthorityGranted: false,
  scopeExpansionAuthorityGranted: false,
})
const {
  callDigestSha256: _backendCallDigest,
  ...backendCallWithoutDigest
} = a100.orchestraCall
assert.equal(_backendCallDigest, a100.orchestraCall.callDigestSha256)
const backendCall = createOrchestraSkillCall({
  ...backendCallWithoutDigest,
  callId: 'caption-backend-track-all-call',
  requestedBy: {
    kind: 'skill',
    skillKey: 'captions',
    skillJobRef: backendRef('caption-backend-track-all-job'),
    supportRequestRef: backendRef(
      backendSupport.requestId,
      backendSupport.requestDigestSha256,
    ),
  },
})
const backendBinding = createCanonicalTrackAllSam31OrchestraBinding({
  bindingId: 'caption-backend-track-all-binding',
  call: backendCall,
  supportRequest: backendSupport,
  admission: a100.admission,
})
const baseContext = a100.context
const captionContext = buildCanonicalSam31GpuTaskContext({
  taskContextId: 'caption-track-all-task-context',
  trackAllOrchestraBinding: backendBinding,
  editPlanVersionId: baseContext.editPlanVersionId,
  editPlanVersionRef: baseContext.editPlanVersionRef,
  outputId: baseContext.outputId,
  confirmedOutputFrameRef: baseContext.confirmedOutputFrameRef,
  sceneId: baseContext.sceneId,
  sourceBindingRef: baseContext.sourceBindingRef,
  sourceMedia: baseContext.sourceMedia,
  approvedPrompt: baseContext.approvedPrompt,
  specializedRuntimeRelease: baseContext.specializedRuntimeRelease,
  primaryRateAuthorityRef: baseContext.primaryRateAuthorityRef,
  fallbackRateAuthorityRef: baseContext.fallbackRateAuthorityRef,
  privateTaskInputTransportRef: baseContext.privateTaskInputTransportRef,
  privateTaskOutputTransportRef: baseContext.privateTaskOutputTransportRef,
  preparedAt: baseContext.preparedAt,
})
const captionTask = buildCanonicalSam31GpuTaskRecord({
  admission: a100.admission,
  target: a100.target,
  admissionConsumptionRef:
    canonicalSam31A100TaskFixture.admissionConsumptionRef,
  executionEnvelopeRef: canonicalSam31A100TaskFixture.executionEnvelopeRef,
  context: captionContext,
  privateInputStagingEvidence:
    canonicalSam31A100TaskFixture.privateInputStagingEvidence,
  preparedAt: canonicalSam31A100TaskFixture.preparedAt,
})
const gpuObjects = new Map<string, Buffer>()
const gpuPort = memoryObjectPort(gpuObjects)
const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
  objectPort: gpuPort,
})
assert.equal(await taskStore.persistTaskCreateOnly(captionTask), 'created')
const runtimeResponseBytes = Buffer.from(stableAuthorityStringify(
  canonicalSam31A100RuntimeResponseFixture,
), 'utf8')
assert.equal(await gpuPort.createOnly({
  objectPath:
    'private/canonical-professional-gpu/sam3_1/v1/invocations/'
      + `${captionTask.invocationId}/response.json`,
  body: runtimeResponseBytes,
  contentSha256: hashBytes(runtimeResponseBytes),
}), 'created')
const {
  evidenceHash: discardedBaselineEvidenceHash,
  ...baselineOutputPayload
} = canonicalSam31A100PrivateOutputEvidenceFixture
assert.equal(typeof discardedBaselineEvidenceHash, 'string')
const outputPayload = {
  ...baselineOutputPayload,
  taskRef: backendRef(captionTask.taskId, captionTask.taskRecordHash),
}
const outputEvidence = canonicalSam31PrivateOutputRereadEvidenceSchema.parse({
  ...outputPayload,
  evidenceHash: sha256AuthorityValue(outputPayload),
})
const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
  objectPort: gpuPort,
})
const captionResult = await admitCanonicalSam31GpuRuntimeResult({
  invocationId: captionTask.invocationId,
  launch: canonicalSam31A100LaunchFixture,
  terminal: canonicalSam31A100TerminalFixture,
  taskStore,
  privateOutputRereadPort: {
    async rereadExactPrivateOutput() {
      return structuredClone(outputEvidence)
    },
  },
  resultStore,
  resultAdmissionId: 'caption-track-all-result-admission',
  admittedAt: '2026-08-02T18:08:00.000Z',
})

const captionCall = captionCallFixture(captionTask)
const payload = captionPayloadFixture(captionCall, captionTask)
const captionSupportRequest = captionSupportRequestFixture(captionCall, payload)
const captionResultWaiting = captionResultFixture(
  captionCall,
  captionSupportRequest,
)
const pair = createCanonicalSpecialistCallResultPair({
  call: captionCall,
  result: captionResultWaiting,
  persistedAt: '2026-08-05T18:00:00.000Z',
})
assert.equal(await supportResumeRepository.persistCallResultPairCreateOnly({
  pair,
}), 'created')

const maskSequenceRef = domainRef(captionResult.maskSequenceArtifactRef)
const trackManifestRef = domainRef(captionResult.manifestRef)
const korniaExecutionRef = rawRef('track-all-l4-kornia-cuda-execution')
const opencvExecutionRef = rawRef('track-all-l4-opencv-crosscheck-execution')
const subjectEvidence: CaptionTrackAllSubjectEvidence = {
  subjectRequestId: payload.subjectRequests[0]!.subjectRequestId,
  subjectEvidenceId: 'caption-primary-subject-evidence',
  subjectRole: 'primary_speaker',
  frameRange: structuredClone(payload.requestedRange),
  maskSequenceRef,
  trackManifestRef,
  anchorManifestRef: null,
  sourceFrameMappingRef: structuredClone(payload.sourceFrameMappingRef),
  outputFrameDigestSha256: payload.confirmedOutputFrameDigestSha256,
  temporalQa: {
    measuredFrameCount: 240,
    expectedFrameCount: 240,
    emptyMaskFrameCount: 0,
    fullFrameMaskCount: 0,
    minimumBinaryIntersectionOverUnionBasisPoints: 8_700,
    maximumNormalizedCentroidShiftBasisPoints: 350,
    maximumBoundaryDisagreementBasisPoints: 600,
    maximumAlphaFlickerBasisPoints: 420,
    minimumEdgeQualityBasisPoints: 9_200,
    minimumSubjectCoverageBasisPoints: 9_850,
    identitySwapCount: 0,
    lostAnchorFrameCount: 0,
    completeRequestedRangeCoverage: true,
  },
  refinementEvidence: [{
    refinementId: 'caption-opencv-temporal-measurement',
    tool: 'opencv',
    operation: 'temporal_median_check',
    inputArtifactRef: maskSequenceRef,
    outputArtifactRef: maskSequenceRef,
    executionEvidenceRef: opencvExecutionRef,
    actualExecutionObserved: true,
  }, {
    refinementId: 'caption-kornia-edge-measurement',
    tool: 'kornia',
    operation: 'edge_feather_measurement',
    inputArtifactRef: maskSequenceRef,
    outputArtifactRef: maskSequenceRef,
    executionEvidenceRef: korniaExecutionRef,
    actualExecutionObserved: true,
  }],
  evidenceRefs: [opencvExecutionRef, korniaExecutionRef],
}
const captionTaskRef = rawRef(
  captionTask.taskId,
  captionTask.schemaVersion,
  captionTask.taskRecordHash,
)
const captionResultRef = rawRef(
  captionResult.resultAdmissionId,
  captionResult.schemaVersion,
  captionResult.resultAdmissionHash,
)
const measurement = sealCanonicalTrackAllSam31L4MaskQaMeasurement({
  schemaVersion: 'canonical-track-all-sam3_1-l4-mask-qa-measurement-v1',
  measurementId: 'caption-track-all-l4-mask-qa-measurement',
  invocationId: captionTask.invocationId,
  sam31TaskRef: captionTaskRef,
  sam31RuntimeResultAdmissionRef: captionResultRef,
  canonicalScope: structuredClone(payload.canonicalScope),
  sourcePrivateArtifactRef: structuredClone(payload.sourcePrivateArtifactRef),
  sourceFrameMappingRef: structuredClone(payload.sourceFrameMappingRef),
  confirmedOutputFrameRef: rawRef(
    captionContext.confirmedOutputFrameRef.id,
    String(captionContext.confirmedOutputFrameRef.version),
    stripSha(captionContext.confirmedOutputFrameRef.contentHash),
  ),
  requestedRange: structuredClone(payload.requestedRange),
  subjectEvidence: [subjectEvidence],
  l4QaExecution: {
    routeId: 'l4_standard_primary',
    gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
    accelerator: 'nvidia_l4',
    approvedWorkItemRef: rawRef('track-all-l4-qa-work-item'),
    workerLeaseRef: rawRef('track-all-l4-qa-worker-lease'),
    executionAttemptRef: rawRef('track-all-l4-qa-attempt'),
    currentAccountPriceAuthorityRef: rawRef('track-all-l4-price-authority'),
    workerUsageEvidenceRef: rawRef('track-all-l4-worker-usage'),
    attemptCostReceiptRef: rawRef('track-all-l4-attempt-cost'),
    korniaCudaExecutionEvidenceRef: korniaExecutionRef,
    opencvCrosscheckExecutionEvidenceRef: opencvExecutionRef,
    actualL4GpuExecutionObserved: true,
    actualKorniaCudaKernelExecutionObserved: true,
    actualOpenCvCrosscheckExecutionObserved: true,
    cpuOnlySubstantiveMaskQaUsed: false,
    userTriggeredAfterApprovedWork: true,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true,
    exactAccountEffectiveAttemptCostPersisted: true,
  },
  everyRequestedFrameAndSubjectMeasured: true,
  sampledOrRepresentativeOnlyMeasurementAccepted: false,
  exactMaskManifestAndEveryMaskPngReread: true,
  browserOrCallerMeasurementAccepted: false,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  assetManifestMutated: false,
  renderAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  measuredAt: '2026-08-05T18:01:00.000Z',
})
assert.equal(await taskQaRepository.persistMeasurementCreateOnly({
  measurement,
}), 'created')
const privateReview = sealCanonicalTrackAllSam31PrivateSceneReview({
  schemaVersion: 'canonical-track-all-sam3_1-private-scene-review-v1',
  reviewId: 'caption-track-all-private-scene-review',
  measurementRef: rawRef(
    measurement.measurementId,
    measurement.schemaVersion,
    measurement.measurementDigestSha256,
  ),
  sam31TaskRef: captionTaskRef,
  sam31RuntimeResultAdmissionRef: captionResultRef,
  canonicalScope: structuredClone(payload.canonicalScope),
  requestedRange: structuredClone(payload.requestedRange),
  reviewedSubjectEvidenceIds: [subjectEvidence.subjectEvidenceId],
  fullResolutionCompleteIntervalPlaybackRef:
    rawRef('track-all-private-complete-interval-playback'),
  reviewerIdentityRef: rawRef('track-all-independent-private-reviewer'),
  reviewerRole: 'independent_private_track_all_visual_reviewer',
  reviewedFrameCount: 240,
  expectedFrameCount: 240,
  findingCodes: [],
  everyRequestedFrameAndSubjectReviewed: true,
  completeIntervalReviewAccepted: true,
  sampledOrRepresentativeOnlyReviewAccepted: false,
  reviewerIndependentFromSamAndMaskQaWorkers: true,
  browserOrCallerReviewAccepted: false,
  providerOrModelCallMade: false,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
  customerCreditsMutated: false,
  qaApprovalGranted: false,
  assetManifestMutated: false,
  renderAuthorized: false,
  publicDeliveryAuthorized: false,
  productionAuthorityGranted: false,
  reviewedAt: '2026-08-05T18:02:00.000Z',
})
assert.equal(await taskQaRepository.persistReviewCreateOnly({
  review: privateReview,
}), 'created')

const taskContextRepository = {
  async rereadTaskContext() {
    return structuredClone(captionContext)
  },
}
const taskQaOwner = createCanonicalTrackAllSam31TaskQaOwner({
  supportResumeRepository,
  taskStore,
  taskContextRepository,
  resultStore,
  qaRepository: taskQaRepository,
  sceneEvidenceRepository,
})
const sceneQaAuthority = await taskQaOwner.admitCaptionSceneEvidence({
  authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
  priorCallRef: callRef(captionCall),
  selectedSupportRequestRef: requestRef(captionSupportRequest),
  invocationId: captionTask.invocationId,
  measurementRef: rawRef(
    measurement.measurementId,
    measurement.schemaVersion,
    measurement.measurementDigestSha256,
  ),
  privateSceneReviewRef: rawRef(
    privateReview.reviewId,
    privateReview.schemaVersion,
    privateReview.reviewDigestSha256,
  ),
})

const {
  measurementDigestSha256: discardedMeasurementDigest,
  ...failingMeasurementInput
} = structuredClone(measurement)
assert.equal(typeof discardedMeasurementDigest, 'string')
failingMeasurementInput.measurementId =
  'caption-track-all-l4-mask-qa-measurement-failing'
failingMeasurementInput.subjectEvidence[0]!
  .temporalQa.minimumBinaryIntersectionOverUnionBasisPoints = 6_999
const failingMeasurement =
  sealCanonicalTrackAllSam31L4MaskQaMeasurement(failingMeasurementInput)
assert.equal(await taskQaRepository.persistMeasurementCreateOnly({
  measurement: failingMeasurement,
}), 'created')
const {
  reviewDigestSha256: discardedReviewDigest,
  ...failingReviewInput
} = structuredClone(privateReview)
assert.equal(typeof discardedReviewDigest, 'string')
failingReviewInput.reviewId = 'caption-track-all-private-scene-review-failing'
failingReviewInput.measurementRef = rawRef(
  failingMeasurement.measurementId,
  failingMeasurement.schemaVersion,
  failingMeasurement.measurementDigestSha256,
)
const failingReview =
  sealCanonicalTrackAllSam31PrivateSceneReview(failingReviewInput)
assert.equal(await taskQaRepository.persistReviewCreateOnly({
  review: failingReview,
}), 'created')
await assert.rejects(() => taskQaOwner.admitCaptionSceneEvidence({
  authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
  priorCallRef: callRef(captionCall),
  selectedSupportRequestRef: requestRef(captionSupportRequest),
  invocationId: captionTask.invocationId,
  measurementRef: rawRef(
    failingMeasurement.measurementId,
    failingMeasurement.schemaVersion,
    failingMeasurement.measurementDigestSha256,
  ),
  privateSceneReviewRef: rawRef(
    failingReview.reviewId,
    failingReview.schemaVersion,
    failingReview.reviewDigestSha256,
  ),
}), /lost exact lineage or quality/u)

const sceneEvidence = await sceneEvidenceRepository.rereadByRef({
  evidenceRef: sceneQaAuthority.captionSceneEvidenceRef,
})
assert.ok(sceneEvidence)

const service = createCanonicalCaptionTrackAllSupportService({
  supportResumeRepository,
  taskStore,
  taskContextRepository,
  resultStore,
  sceneQaAuthorityReadPort: taskQaRepository,
  sceneEvidenceRepository,
  evidenceRepository,
})
const serviceInput = {
  authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
  priorCallRef: callRef(captionCall),
  selectedSupportRequestRef: requestRef(captionSupportRequest),
  invocationId: captionTask.invocationId,
  runtimeResultAdmissionRef: rawRef(
    captionResult.resultAdmissionId,
    captionResult.schemaVersion,
    captionResult.resultAdmissionHash,
  ),
  trackAllSceneQaAuthorityRef: rawRef(
    sceneQaAuthority.authorityId,
    sceneQaAuthority.schemaVersion,
    sceneQaAuthority.authorityDigestSha256,
  ),
  trackAllSceneEvidenceRef: rawRef(
    sceneEvidence!.evidenceId,
    sceneEvidence!.schemaVersion,
    sceneEvidence!.evidenceDigestSha256,
  ),
}
const record = await service.projectAuthenticatedEvidence(serviceInput)
let assertions = 0
check(
  record.captionEvidencePacket.selectedSegmentationRoute === 'sam3_1'
    && record.captionEvidencePacket.actualSam31GpuExecutionObserved
    && record.captionEvidencePacket.actualOpenCvExecutionObserved,
  'Authenticated projection must carry actual SAM 3.1 and OpenCV evidence.',
)
check(
  record.captionAdmission.disposition === 'admitted_for_caption_scene_graph'
    && record.captionAdmission.textBehindSubjectAllowed
    && record.captionAdmission.subjectAdmissions[0]?.qaPassed,
  'Only the exact passing task-level evidence may admit subject occlusion.',
)
check(
  record.authenticatedOwnerProjection.ownerKey === 'track_all'
    && record.authenticatedOwnerProjection.artifactRefs.length === 1
    && record.authenticatedOwnerProjection.artifactRefs[0]?.artifactType
      === 'track_all_mask_binding',
  'The owner must project one neutral Track All artifact.',
)
check(
  record.distinctCaptionAndBackendSupportWireIdentitiesPreserved
    && record.taskLevelSceneQaAuthorityExactReread
    && record.trackAllSceneQaAuthorityRef.contentHash
      === sceneQaAuthority.authorityDigestSha256
    && record.supportRequestRef.contentHash
      !== record.backendTrackAllSupportRequestRef.contentHash,
  'The distinct Caption/backend wires and task-QA authority must stay bound.',
)
check(
  !record.runtimeExecutionPerformedByBridge
    && !record.runtimeExecutionAuthorityGrantedToCaption
    && !record.assetMutationAuthorityGrantedToCaption
    && !record.costOrBillingAuthorityGrantedToCaption
    && !record.finalQaApprovalGrantedToCaption
    && !record.publicDeliveryGranted
    && !record.productionAuthorityGranted,
  'The bridge must retain every closed authority boundary.',
)
const replay = await service.projectAuthenticatedEvidence(serviceInput)
check(
  replay.recordDigestSha256 === record.recordDigestSha256,
  'Exact replay must reconcile to one immutable record.',
)
check(
  parseCanonicalCaptionTrackAllAuthenticatedEvidenceRecord(record)
    .recordDigestSha256 === record.recordDigestSha256,
  'The complete authenticated record must validate independently.',
)
const finalizationRuntime =
  createCanonicalTrackAllSam31CaptionEvidenceFinalizationRuntime({
    taskQaOwner,
    supportService: service,
  })
const finalizationRequest =
  buildTrackAllSam31CaptionEvidenceFinalizationRequest({
    requestId: 'caption-track-all-finalization-1',
    priorCallRef: callRef(captionCall),
    selectedSupportRequestRef: requestRef(captionSupportRequest),
    invocationId: captionTask.invocationId,
    runtimeResultAdmissionRef: serviceInput.runtimeResultAdmissionRef,
    l4MaskQaMeasurementRef: rawRef(
      measurement.measurementId,
      measurement.schemaVersion,
      measurement.measurementDigestSha256,
    ),
    privateSceneReviewRef: rawRef(
      privateReview.reviewId,
      privateReview.schemaVersion,
      privateReview.reviewDigestSha256,
    ),
  })
const finalizationInput = {
  authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
  workspaceId: payload.canonicalScope.workspaceId,
  idempotencyKey: finalizationRequest.requestId,
  request: finalizationRequest,
}
const finalization = await finalizationRuntime.finalizeCaptionEvidence(
  finalizationInput,
)
const finalizationReplay = await finalizationRuntime.finalizeCaptionEvidence(
  finalizationInput,
)
check(
  finalization.disposition === 'ready_for_specialist_resume'
    && finalization.resultDigestSha256
      === finalizationReplay.resultDigestSha256
    && finalization.sceneQaAuthorityRef.contentHash
      === sceneQaAuthority.authorityDigestSha256
    && finalization.authenticatedEvidenceRecordRef.contentHash
      === record.recordDigestSha256,
  'The authenticated finalizer must replay to one byte-free resume receipt.',
)
check(
  parseTrackAllSam31CaptionEvidenceFinalizationResult(finalization)
    .resultDigestSha256 === finalization.resultDigestSha256,
  'The bounded finalization result must validate independently.',
)
const tamperedFinalizationRequest = {
  ...structuredClone(finalizationRequest),
  invocationId: 'invocation-crossed',
}
assert.throws(() =>
  parseTrackAllSam31CaptionEvidenceFinalizationRequest(
    tamperedFinalizationRequest,
  ))
assertions += 1
await assert.rejects(() => finalizationRuntime.finalizeCaptionEvidence({
  ...finalizationInput,
  workspaceId: 'workspace-crossed',
}))
assertions += 1

await assert.rejects(() => service.projectAuthenticatedEvidence({
  ...serviceInput,
  authenticatedOwnerUserId: 'owner-crossed',
}))
assertions += 1
await assert.rejects(() => service.projectAuthenticatedEvidence({
  ...serviceInput,
  runtimeResultAdmissionRef: rawRef(
    'wrong-result',
    captionResult.schemaVersion,
  ),
}))
assertions += 1
await assert.rejects(() => service.projectAuthenticatedEvidence({
  ...serviceInput,
  trackAllSceneQaAuthorityRef: rawRef(
    'wrong-scene-qa-authority',
    sceneQaAuthority.schemaVersion,
  ),
}))
assertions += 1
await assert.rejects(() => service.projectAuthenticatedEvidence({
  ...serviceInput,
  trackAllSceneEvidenceRef: rawRef(
    'wrong-scene-evidence',
    sceneEvidence.schemaVersion,
  ),
}))
assertions += 1

const tamperedScene = structuredClone(sceneEvidence)
tamperedScene.subjectEvidence[0]!.temporalQa.identitySwapCount = 1
assert.throws(() =>
  parseCanonicalTrackAllSam31CaptionSceneEvidence(tamperedScene))
assertions += 1
const noOpenCv = structuredClone(sceneEvidence)
noOpenCv.subjectEvidence[0]!.refinementEvidence =
  noOpenCv.subjectEvidence[0]!.refinementEvidence.filter((item) =>
    item.tool !== 'opencv')
noOpenCv.evidenceDigestSha256 = digest(
  withoutField(noOpenCv, 'evidenceDigestSha256'),
  'evidenceDigestSha256',
)
assert.throws(() => parseCanonicalTrackAllSam31CaptionSceneEvidence(noOpenCv))
assertions += 1
const stalePayload = structuredClone(payload)
stalePayload.requestedSceneId = 'scene-crossed'
stalePayload.payloadDigestSha256 = digest(
  withoutField(stalePayload, 'payloadDigestSha256'),
  'payloadDigestSha256',
)
assert.throws(() => parseCaptionTrackAllSupportPayload(stalePayload))
assertions += 1

let getterInvoked = false
const accessor = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    return payload.schemaVersion
  },
})
assert.throws(() => parseCaptionTrackAllSupportPayload(accessor))
assert.equal(getterInvoked, false)
assertions += 1
assert.throws(() => parseCaptionTrackAllSupportPayload(new Proxy({}, {
  ownKeys() { throw new Error('hostile proxy') },
})))
assertions += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-track-all-support-service',
  assertions,
  frozenCaptionTrackAllTypeConsumed: true,
  exactCaptionAndBackendSupportWiresBridgedWithoutCast: true,
  canonicalSam31TaskAndResultOwnerReread: true,
  taskLevelSceneQaAuthorityCreateOnlyPersistedAndReread: true,
  a100ActualGpuResultRequired: true,
  l4FallbackMustRemainSeparatelyQualified: true,
  userTriggeredScaleFromZeroTerminalVerified: true,
  taskLevelIndependentL4KorniaCudaAndOpenCvMaskQaRequired: true,
  taskLevelPrivateVisualReviewRequired: true,
  completeRequestedSceneRangeRequired: true,
  exactSubjectThresholdsApplied: true,
  genericSequentialResumeProjectionPersisted: true,
  directPeerDispatchPerformed: false,
  bridgeRuntimeAssetCostQaBillingOrDeliveryAuthority: false,
}, null, 2))

function captionPayloadFixture(
  call: CaptionOrchestraSkillCall,
  task: typeof captionTask,
): CaptionTrackAllSupportPayload {
  const scope: CaptionDomainCanonicalScope = {
    ownerUserId: call.canonicalScope.ownerUserId,
    workspaceId: call.canonicalScope.workspaceId,
    projectId: call.canonicalScope.projectId,
    editSessionId: call.canonicalScope.editSessionId,
    planVersionId: task.runtimeRequest.scope.editPlanVersionId,
    approvedSnapshotRef: structuredClone(call.canonicalScope.approvedSnapshotRef),
    outputId: call.canonicalScope.outputId!,
    sceneId: call.canonicalScope.sceneId,
    authorizedFrameRanges: structuredClone(
      call.canonicalScope.authorizedFrameRanges,
    ),
  }
  const subjectRequests = [{
    subjectRequestId: 'caption-primary-speaker-track-request',
    subjectRole: 'primary_speaker' as const,
    visualObservationRefs: [rawRef('caption-primary-speaker-observation')],
    sourcePhraseRefs: [rawRef('caption-primary-speaker-phrase')],
    maskRequired: true,
    trackRequired: true as const,
    anchorRequired: false,
    preserveHairAndFineEdges: true,
    preserveContactObjects: true,
  }]
  const qaThresholds = {
    minimumBinaryIntersectionOverUnionBasisPoints: 7_000,
    maximumNormalizedCentroidShiftBasisPoints: 800,
    maximumBoundaryDisagreementBasisPoints: 1_200,
    maximumAlphaFlickerBasisPoints: 1_000,
    minimumEdgeQualityBasisPoints: 8_000,
    minimumSubjectCoverageBasisPoints: 9_500,
    emptyMaskFrameCountAllowed: 0 as const,
    fullFrameMaskCountAllowed: 0 as const,
    identitySwapCountAllowed: 0 as const,
    lostAnchorFrameCountAllowed: 0 as const,
  }
  const refinementPolicy = {
    opencvMaskQaRequired: true as const,
    korniaRefinementAllowed: true,
    korniaCannotReplacePrimarySegmentation: true as const,
    deterministicOperations: [
      'morphological_cleanup', 'hole_fill', 'edge_feather_measurement',
      'temporal_median_check', 'connected_component_filter',
    ] as CaptionTrackAllSupportPayload['refinementPolicy'][
      'deterministicOperations'
    ],
  }
  const sourcePrivateArtifactRef = domainRef(
    task.runtimeRequest.sourceMedia.finalizedSourceArtifactRef,
  )
  const sourceFrameMappingRef = domainRef(
    task.runtimeRequest.sourceMedia.sourceFrameRangeMappingRef,
  )
  const cacheIdentityDigestSha256 = digest({
    purpose: 'subject_occlusion',
    canonicalScope: scope,
    sourcePrivateArtifactRef,
    sourceFrameMappingRef,
    confirmedOutputFrameDigestSha256:
      stripSha(captionContext.confirmedOutputFrameRef.contentHash),
    requestedRange: scope.authorizedFrameRanges[0],
    subjectRequests,
    qaThresholds,
    refinementPolicy,
  }, 'cacheIdentityDigestSha256')
  const withoutDigest: Omit<CaptionTrackAllSupportPayload,
    'payloadDigestSha256'> = {
    schemaVersion: 'caption-track-all-support-payload-v1',
    payloadId: 'caption-track-all-support-payload',
    purpose: 'subject_occlusion',
    canonicalScope: scope,
    pictureLockRef: rawRef('caption-picture-lock'),
    finishReadinessRef: rawRef('caption-finish-readiness'),
    visualOccupancyManifestRef: rawRef('caption-visual-occupancy'),
    confirmedOutputFrameDigestSha256:
      stripSha(captionContext.confirmedOutputFrameRef.contentHash),
    sourcePrivateArtifactRef,
    sourceFrameMappingRef,
    requestedSceneId: scope.sceneId!,
    requestedRange: structuredClone(scope.authorizedFrameRanges[0]!),
    subjectRequests,
    depthIntent: 'behind_subject',
    qaThresholds,
    refinementPolicy,
    cachePolicy: {
      cacheIdentityDigestSha256,
      exactSourceRangeSubjectFrameAndPolicyBound: true,
      crossSceneReuseAllowed: false,
      crossOutputReuseAllowed: false,
      staleReuseAllowed: false,
    },
    fallbackLadder: [
      'retry_track_all_same_approved_input',
      'opencv_kornia_refine',
      'safe_top_plane',
      'stable_libass',
      'user_review',
    ],
    expectedArtifactTypes: ['mask_sequence', 'track_manifest'],
    byteFreeRequest: true,
    rawChatIncluded: false,
    mediaBytesIncluded: false,
    mediaLocatorIncluded: false,
    modelPromptIncluded: false,
    providerCredentialIncluded: false,
    samRuntimeSelectedOrDispatchedByCaption: false,
    directPeerDispatchRequested: false,
    trackAllRemainsArtifactOwner: true,
  }
  return parseCaptionTrackAllSupportPayload({
    ...withoutDigest,
    payloadDigestSha256: digest(withoutDigest, 'payloadDigestSha256'),
  })
}

function captionCallFixture(
  task: typeof captionTask,
): CaptionOrchestraSkillCall {
  const withoutDigest: Omit<CaptionOrchestraSkillCall,
    'callDigestSha256'> = {
    schemaVersion: 'orchestra-skill-call-v1',
    callId: 'caption-resolve-subject-occlusion-call',
    idempotencyKey: 'caption-resolve-subject-occlusion-idempotency',
    caller: {
      callerKind: 'head_of_orchestra',
      callerId: 'canonical-head-of-orchestra',
    },
    assigneeSkillKey: 'captions',
    job: {
      jobId: 'caption-resolve-subject-occlusion-job',
      jobType: 'resolve_subject_occluded_typography',
      requestedMode: 'private_internal',
      scopeLevel: 'scene',
    },
    canonicalScope: {
      ownerUserId: task.runtimeRequest.scope.ownerUserId,
      workspaceId: task.runtimeRequest.scope.workspaceId,
      projectId: task.runtimeRequest.scope.projectId,
      editSessionId: task.runtimeRequest.scope.editSessionId,
      approvedSnapshotRef: rawRef(
        task.runtimeRequest.scope.approvedPlanSnapshotId,
        '1',
        task.runtimeRequest.scope.approvedPlanSnapshotHash,
      ),
      outputId: task.runtimeRequest.scope.outputId,
      sceneId: task.runtimeRequest.scope.sceneId,
      boundaryId: null,
      authorizedFrameRanges: [{
        startFrame:
          task.runtimeRequest.sourceMedia.canonicalSourceStartFrameInclusive,
        endFrameExclusive:
          task.runtimeRequest.sourceMedia.canonicalSourceEndFrameInclusive + 1,
      }],
    },
    manifestRef: rawRef('captions-capability-manifest'),
    qualificationSnapshotRef: rawRef('captions-qualification-snapshot'),
    inputArtifactRefs: [],
    injectedSupportArtifactRefs: [],
    resumeOfSupportRequestRef: null,
    resumeOriginCallRef: null,
    authorityBoundary: closedAuthority(),
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
    callDigestSha256: digest(withoutDigest, 'callDigestSha256'),
  })
}

function captionSupportRequestFixture(
  call: CaptionOrchestraSkillCall,
  payload: CaptionTrackAllSupportPayload,
): CaptionSkillSupportRequest {
  const withoutDigest: Omit<CaptionSkillSupportRequest,
    'requestDigestSha256'> = {
    schemaVersion: 'skill-support-request-v1',
    requestId: 'caption-track-all-support-request',
    originalCallRef: callRef(call),
    requestingSkillKey: 'captions',
    targetSkillKey: 'track_all',
    reasonCode: 'caption_track_all.subject_occlusion.required',
    requestedArtifactTypes: ['track_all_mask_binding'],
    canonicalScope: structuredClone(call.canonicalScope),
    typedPayloadType: payload.schemaVersion,
    typedPayload: structuredClone(payload),
    mediationPolicy: {
      hqMediated: true,
      directPeerDispatchAllowed: false,
      assigneeMayOnlyResumeAfterInjection: true,
    },
    authorityBoundary: closedAuthority(),
  }
  return parseSkillSupportRequest({
    ...withoutDigest,
    requestDigestSha256: digest(withoutDigest, 'requestDigestSha256'),
  })
}

function captionResultFixture(
  call: CaptionOrchestraSkillCall,
  supportRequest: CaptionSkillSupportRequest,
): CaptionOrchestraSkillJobResult {
  const withoutDigest: Omit<CaptionOrchestraSkillJobResult,
    'resultDigestSha256'> = {
    schemaVersion: 'orchestra-skill-job-result-v1',
    resultId: 'caption-resolve-subject-occlusion-result',
    disposition: 'needs_followup',
    originalCallRef: callRef(call),
    producerSkillKey: 'captions',
    jobType: call.job.jobType,
    manifestRef: structuredClone(call.manifestRef),
    qualificationSnapshotRef: structuredClone(call.qualificationSnapshotRef),
    canonicalScope: structuredClone(call.canonicalScope),
    producedArtifactRefs: [],
    supportRequests: [supportRequest],
    reasonCodes: ['authenticated-track-all-evidence-required'],
    safeUserSummary: 'Waiting for authenticated Track All evidence.',
    replayBinding: {
      idempotencyKey: call.idempotencyKey,
      resumedFromSupportRequestRef: null,
      resumeOriginCallRef: null,
    },
    authorityBoundary: closedAuthority(),
  }
  return parseOrchestraSkillJobResult({
    ...withoutDigest,
    resultDigestSha256: digest(withoutDigest, 'resultDigestSha256'),
  })
}

function closedAuthority(): SkillClosedAuthorityBoundary {
  return {
    scopeExpansionGranted: false,
    timelineMutationGranted: false,
    directPeerDispatchGranted: false,
    providerCallGranted: false,
    runtimeExecutionGranted: false,
    assetCreationGranted: false,
    costAuthorityGranted: false,
    billingAuthorityGranted: false,
    qaApprovalGranted: false,
    publicDeliveryGranted: false,
    productionAuthorityGranted: false,
  }
}

function rawRef(
  id: string,
  version = 'fixture-v1',
  contentHash = hash(`${id}:${version}`),
): CaptionDomainRef {
  return { id, version, contentHash }
}

function domainRef(value: {
  id: string
  version: number
  contentHash: string
}): CaptionDomainRef {
  return rawRef(value.id, String(value.version), stripSha(value.contentHash))
}

function backendRef(id: string, contentHash = hash(id), version = 1) {
  return {
    id,
    version,
    contentHash: contentHash.startsWith('sha256:')
      ? contentHash
      : `sha256:${contentHash}`,
  }
}

function callRef(call: CaptionOrchestraSkillCall): SkillContractRef {
  return rawRef(call.callId, call.schemaVersion, call.callDigestSha256)
}

function requestRef(request: CaptionSkillSupportRequest): SkillContractRef {
  return rawRef(
    request.requestId,
    request.schemaVersion,
    request.requestDigestSha256,
  )
}

function digest(value: unknown, omittedField: string): string {
  return calculateSkillContractDigest(
    value as Record<string, unknown>,
    omittedField,
  )
}

function withoutField<T extends object>(
  value: T,
  field: keyof T,
): Record<string, unknown> {
  const clone = structuredClone(value) as unknown as Record<string, unknown>
  delete clone[field as string]
  return clone
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function hashBytes(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function stripSha(value: string): string {
  return value.startsWith('sha256:') ? value.slice(7) : value
}

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(hashBytes(input.body), input.contentSha256)
      const existing = values.get(input.objectPath)
      if (existing) {
        assert.equal(existing.equals(input.body), true)
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(objectPath) {
      const value = values.get(objectPath)
      return value ? Buffer.from(value) : null
    },
  }
}

function check(condition: unknown, message: string): void {
  assert.ok(condition, message)
  assertions += 1
}
