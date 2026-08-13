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
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest,
  compileCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerResult,
  createCanonicalTrackAllSam31TaskQaCandidateRepository,
  createCanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntime,
  parseTrackAllSam31TaskQaEvidenceFinalizationResult,
  sealCanonicalTrackAllSam31L4MaskQaWorkerResult,
  sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult,
  sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResultV3,
  sealCanonicalTrackAllSam31PrivateReviewResult,
} from '../services/canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import {
  buildCanonicalTrackAllSam31L4TaskQaWorkerRequest,
  buildCanonicalTrackAllSam31L4TaskQaWorkerResponse,
  buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV3,
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-worker-contract'
import {
  buildTrackAllSam31CaptionEvidenceFinalizationRequest,
  createCanonicalTrackAllSam31CaptionEvidenceFinalizationRuntime,
  parseTrackAllSam31CaptionEvidenceFinalizationRequest,
  parseTrackAllSam31CaptionEvidenceFinalizationResult,
} from '../services/canonical-track-all-sam3_1-caption-evidence-finalization-service'
import {
  canonicalProfessionalGpuExecutionEnvelopeSchema,
  canonicalProfessionalGpuJobLaunchSchema,
  canonicalProfessionalGpuJobTerminalSchema,
} from '../services/canonical-professional-gpu-job-lifecycle-service'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from '../services/canonical-professional-gpu-durable-lifecycle-store'
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
  createCanonicalSam31GpuTaskContextRepository,
} from '../services/canonical-sam3_1-gpu-task-context-owner'
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
let assertions = 0

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
const qualificationTaskContextRepository =
  createCanonicalSam31GpuTaskContextRepository({
    objectPort: controlPort,
    prefix: 'private/smoke/caption-track-all/task-context/v1',
  })
await qualificationTaskContextRepository.persistTaskContextCreateOnly({
  context: captionContext,
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
const l4ApprovedWorkItemRef = rawRef(
  'track-all-l4-qa-work-item',
  '1',
)
const l4WorkerLeaseRef = rawRef('track-all-l4-qa-worker-lease', '1')
const l4ExecutionAttemptRef = rawRef('track-all-l4-qa-attempt', '1')
const l4CurrentPriceRef = rawRef('track-all-l4-price-authority', '1')
const l4WorkerUsageRef = rawRef('track-all-l4-worker-usage', '1')
const l4AttemptCostRef = rawRef('track-all-l4-attempt-cost', '1')
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
    approvedWorkItemRef: l4ApprovedWorkItemRef,
    workerLeaseRef: l4WorkerLeaseRef,
    executionAttemptRef: l4ExecutionAttemptRef,
    currentAccountPriceAuthorityRef: l4CurrentPriceRef,
    workerUsageEvidenceRef: l4WorkerUsageRef,
    attemptCostReceiptRef: l4AttemptCostRef,
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

const l4EnvelopePayload = {
  schemaVersion: 'canonical-professional-gpu-execution-envelope-v1' as const,
  source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
  envelopeId: 'caption-track-all-l4-qa-envelope',
  admissionRef: backendRef('caption-track-all-l4-qa-admission'),
  admissionConsumptionRef:
    backendRef('caption-track-all-l4-qa-admission-consumption'),
  runtimeReleaseRef: backendRef('caption-track-all-l4-qa-runtime-release'),
  approvedSnapshotRef: backendRef(
    captionTask.runtimeRequest.scope.approvedPlanSnapshotId,
    captionTask.runtimeRequest.scope.approvedPlanSnapshotHash,
  ),
  confirmedOutputFrameRef: structuredClone(
    captionContext.confirmedOutputFrameRef,
  ),
  masterTimingRef:
    structuredClone(captionTask.runtimeRequest.scope.masterTimingRef),
  approvedWorkItemRef: prefixedRef(l4ApprovedWorkItemRef),
  workerLeaseRef: prefixedRef(l4WorkerLeaseRef),
  fundedReservationRef: backendRef('caption-track-all-l4-reservation'),
  userTriggerRecordRef: backendRef('caption-track-all-l4-user-trigger'),
  executionAttemptRef: prefixedRef(l4ExecutionAttemptRef),
  fixedServerTaskContractRef:
    canonicalTrackAllSam31L4TaskQaFixedTaskContractRef(),
  toolId: 'kornia',
  operationId: 'tool.kornia.refine_mask.v1',
  routeId: 'l4_standard_primary' as const,
  immutableImageDigest:
    `sha256:${hash('caption-track-all-l4-image')}` as const,
  byteFreeEnvelope: true as const,
  privateWorkerRereadsEnvelopeByExactRef: true as const,
  callerCodeCommandImageModelPathUrlOrEnvironmentIncluded: false as const,
  rawChatMediaBytesCredentialsOrSecretsIncluded: false as const,
  runtimeDownloadAllowed: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  createdBeforeCloudJob: true as const,
  createOnlyAndExactRereadRequired: true as const,
}
const l4Envelope = canonicalProfessionalGpuExecutionEnvelopeSchema.parse({
  ...l4EnvelopePayload,
  envelopeHash: sha256AuthorityValue(l4EnvelopePayload),
})
const l4LaunchPayload = {
  schemaVersion: 'canonical-professional-gpu-job-launch-v1' as const,
  source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
  launchRecordId: 'caption-track-all-l4-qa-launch',
  admissionRef: l4Envelope.admissionRef,
  admissionConsumptionRef: l4Envelope.admissionConsumptionRef,
  runtimeReleaseRef: l4Envelope.runtimeReleaseRef,
  executionEnvelopeRef: backendRef(
    l4Envelope.envelopeId,
    l4Envelope.envelopeHash,
  ),
  toolId: l4Envelope.toolId,
  operationId: l4Envelope.operationId,
  routeId: l4Envelope.routeId,
  runtimeRegion: 'us-central1' as const,
  executionTarget: 'google_cloud_run_l4_job' as const,
  accelerator: 'nvidia_l4' as const,
  immutableImageDigest: l4Envelope.immutableImageDigest,
  cloudJobCreateRequestRef: backendRef('caption-track-all-l4-create'),
  cloudJobExecutionRef: backendRef('caption-track-all-l4-execution'),
  launchDisposition: 'job_created' as const,
  providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed' as const,
  createOnlyAdmissionConsumedBeforeLaunch: true as const,
  duplicateLaunchAllowed: false as const,
  unknownOutcomeRetryAllowed: false as const,
  noApprovedAdmissionMeansZeroGpuJobs: true as const,
  minimumIdleInstances: 0 as const,
  prewarmingKeepaliveOrAlwaysOnPoolAllowed: false as const,
  cpuOnlySubstantiveExecutionAllowed: false as const,
  customerCreditsMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  launchedAt: '2026-08-05T18:00:30.000Z',
}
const l4Launch = canonicalProfessionalGpuJobLaunchSchema.parse({
  ...l4LaunchPayload,
  launchHash: sha256AuthorityValue(l4LaunchPayload),
})
const l4TerminalPayload = {
  schemaVersion: 'canonical-professional-gpu-job-terminal-v1' as const,
  source: 'canonical_professional_gpu_job_lifecycle_owner' as const,
  terminalRecordId: 'caption-track-all-l4-qa-terminal',
  launchRef: backendRef(l4Launch.launchRecordId, l4Launch.launchHash),
  admissionRef: l4Launch.admissionRef,
  cloudJobExecutionRef: l4Launch.cloudJobExecutionRef,
  cloudTerminalObservationRef: backendRef('caption-track-all-l4-terminal'),
  cloudCapacityTeardownObservationRef:
    backendRef('caption-track-all-l4-scale-zero'),
  workerUsageEvidenceRef: prefixedRef(l4WorkerUsageRef),
  currentAccountPriceAuthorityRef: prefixedRef(l4CurrentPriceRef),
  attemptCostReceiptRef: prefixedRef(l4AttemptCostRef),
  terminalOutcome: 'completed' as const,
  providerInferenceOrSubstantiveWorkOutcome: 'executed' as const,
  cloudJobTerminalStateReread: true as const,
  workerStoppedVerified: true as const,
  activeGpuInstancesAfterTerminalObservation: 0 as const,
  minimumIdleInstances: 0 as const,
  retryAllowedWithoutCanonicalReconciliation: false as const,
  unknownOutcomeBlocksRetry: false,
  exactPlatformUsageAndAccountPriceReread: true as const,
  costReceiptPersistedBeforeSettlement: true as const,
  systemFailureOrUnknownCostChargedToCustomer: false as const,
  unapprovedOverageChargedToCustomer: false as const,
  customerWalletOrLedgerMutated: false as const,
  qaApproved: false as const,
  publicDeliveryAuthorized: false as const,
  productionAuthorityGranted: false as const,
  observedAt: '2026-08-05T18:01:30.000Z',
}
const l4Terminal = canonicalProfessionalGpuJobTerminalSchema.parse({
  ...l4TerminalPayload,
  terminalHash: sha256AuthorityValue(l4TerminalPayload),
})
const l4LifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
  objectPort: controlPort,
  prefix: 'private/smoke/caption-track-all/l4-lifecycle/v1',
})
assert.equal(await l4LifecycleStore.createExecutionEnvelopeOnly({
  record: l4Envelope,
}), 'created')
assert.equal(await l4LifecycleStore.createLaunchRecordOnly({
  record: l4Launch,
}), 'created')
assert.equal(await l4LifecycleStore.createTerminalRecordOnly({
  record: l4Terminal,
}), 'created')

const taskQaCandidateRepository =
  createCanonicalTrackAllSam31TaskQaCandidateRepository({
    objectPort: gpuPort,
    prefix: 'private/smoke/caption-track-all/task-qa-candidates/v1',
  })
const workerServiceIdentityRef = rawRef(
  'caption-track-all-l4-worker-service',
)
const l4WorkerResult = sealCanonicalTrackAllSam31L4MaskQaWorkerResult({
  schemaVersion: 'canonical-track-all-sam3_1-l4-mask-qa-worker-result-v1',
  workerResultId: 'caption-track-all-l4-worker-result',
  invocationId: captionTask.invocationId,
  workerServiceIdentityRef,
  l4LaunchRef: rawRef(
    l4Launch.launchRecordId,
    l4Launch.schemaVersion,
    l4Launch.launchHash,
  ),
  l4ExecutionEnvelopeRef: rawRef(
    l4Envelope.envelopeId,
    l4Envelope.schemaVersion,
    l4Envelope.envelopeHash,
  ),
  l4TerminalRef: rawRef(
    l4Terminal.terminalRecordId,
    l4Terminal.schemaVersion,
    l4Terminal.terminalHash,
  ),
  measurement,
  privateCreateOnlyWorkerOutput: true,
  actualKorniaCudaAndOpenCvExecutionReportedByWorker: true,
  callerOrBrowserOutputAccepted: false,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
})
assert.equal(await taskQaCandidateRepository.persistWorkerResultCreateOnly({
  result: l4WorkerResult,
}), 'created')
const independentReviewResult = sealCanonicalTrackAllSam31PrivateReviewResult({
  schemaVersion: 'canonical-track-all-sam3_1-private-review-result-v1',
  reviewResultId: 'caption-track-all-independent-review-result',
  invocationId: captionTask.invocationId,
  reviewerServiceIdentityRef: privateReview.reviewerIdentityRef,
  workerResultRef: rawRef(
    l4WorkerResult.workerResultId,
    l4WorkerResult.schemaVersion,
    l4WorkerResult.workerResultDigestSha256,
  ),
  review: privateReview,
  privateCreateOnlyReviewOutput: true,
  completeIntervalPlaybackRereadByIndependentReviewOwner: true,
  callerOrBrowserReviewAccepted: false,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
})
assert.equal(await taskQaCandidateRepository.persistReviewResultCreateOnly({
  result: independentReviewResult,
}), 'created')
const taskContextRepository = {
  async rereadTaskContext() {
    return structuredClone(captionContext)
  },
}
const taskQaEvidenceFinalizationRuntime =
  createCanonicalTrackAllSam31TaskQaEvidenceFinalizationRuntime({
    candidateRepository: taskQaCandidateRepository,
    lifecycleReadPort: l4LifecycleStore,
    sam31ResultStore: resultStore,
    sam31TaskStore: taskStore,
    taskContextRepository,
    taskQaRepository,
  })
const taskQaEvidenceFinalizationRequest =
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest({
    requestId: 'caption-track-all-task-qa-finalization',
    invocationId: captionTask.invocationId,
    sam31RuntimeResultAdmissionRef: captionResultRef,
    l4MaskQaWorkerResultRef: rawRef(
      l4WorkerResult.workerResultId,
      l4WorkerResult.schemaVersion,
      l4WorkerResult.workerResultDigestSha256,
    ),
    independentPrivateReviewResultRef: rawRef(
      independentReviewResult.reviewResultId,
      independentReviewResult.schemaVersion,
      independentReviewResult.reviewResultDigestSha256,
    ),
  })
await assert.rejects(() =>
  taskQaEvidenceFinalizationRuntime.finalizeTaskQaEvidence({
    authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
    workspaceId: payload.canonicalScope.workspaceId,
    idempotencyKey: taskQaEvidenceFinalizationRequest.requestId,
    request: taskQaEvidenceFinalizationRequest,
  }), /Historical Track All worker measurement v1 is read-only/u)
assertions += 1

const fixedWorkerRequest = buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV3({
  schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-request-v3',
  operationId: 'tool.kornia.refine_mask.v1',
  sam31InvocationId: captionTask.invocationId,
  l4InvocationId: l4Envelope.envelopeId,
  sam31TaskRef: backendRef(captionTask.taskId, captionTask.taskRecordHash),
  sam31RuntimeRequestBindingSha256:
    captionTask.runtimeRequest.requestBindingSha256,
  sam31RuntimeResultAdmissionRef: backendRef(
    captionResult.resultAdmissionId,
    captionResult.resultAdmissionHash,
  ),
  sam31MaskManifestRef: structuredClone(captionResult.manifestRef),
  l4ExecutionEnvelopeRef: backendRef(
    l4Envelope.envelopeId,
    l4Envelope.envelopeHash,
  ),
  approvedWorkItemRef: structuredClone(l4Envelope.approvedWorkItemRef),
  workerLeaseRef: structuredClone(l4Envelope.workerLeaseRef),
  executionAttemptRef: structuredClone(l4Envelope.executionAttemptRef),
  sourceFrameMappingRef: structuredClone(
    captionTask.runtimeRequest.sourceMedia.sourceFrameRangeMappingRef,
  ),
  confirmedOutputFrameRef:
    structuredClone(captionContext.confirmedOutputFrameRef),
  sourceWidth: captionTask.runtimeRequest.sourceMedia.width,
  sourceHeight: captionTask.runtimeRequest.sourceMedia.height,
  maskFrameRange: {
    startFrame: 0,
    endFrameExclusive:
      captionTask.runtimeRequest.sourceMedia.decodedFrameCount,
  },
  expectedMaskManifestByteLength: outputEvidence.manifestByteLength,
  expectedMaskManifestSha256: outputEvidence.manifestSha256,
  expectedMaskPngCount: captionResult.maskFileCount,
  chunkOrdinal: 1,
  canonicalStartFrameInclusive: payload.requestedRange.startFrame,
  canonicalEndFrameInclusive: payload.requestedRange.endFrameExclusive - 1,
  previousChunkBoundaryInput: null,
  subjects: [{
    subjectRequestId: subjectEvidence.subjectRequestId,
    subjectEvidenceId: subjectEvidence.subjectEvidenceId,
    subjectRole: subjectEvidence.subjectRole,
    maskObjectId: outputEvidence.distinctObjectIds[0]!,
    canonicalFrameRange: structuredClone(payload.requestedRange),
    maskFrameRange: {
      startFrame: 0,
      endFrameExclusive:
        captionTask.runtimeRequest.sourceMedia.decodedFrameCount,
    },
    trackManifestRef: structuredClone(captionResult.manifestRef),
    anchorManifestRef: null,
    sourceFrameMappingRef: structuredClone(
      captionTask.runtimeRequest.sourceMedia.sourceFrameRangeMappingRef,
    ),
    outputFrameDigestSha256:
      stripSha(captionContext.confirmedOutputFrameRef.contentHash),
  }],
  executionPolicy: {
    routeId: 'l4_standard_primary',
    gpuProfileId: 'quality_l4_user_triggered_standard_media_job_v1',
    accelerator: 'nvidia_l4',
    korniaVersion: '0.8.3',
    torchVersion: '2.10.0+cu128',
    cudaRuntimeVersion: '12.8',
    morphologyKernelSize: 3,
    binaryThreshold: 127,
    everyManifestMaskMustBeReread: true,
    everyRequestedFrameAndSubjectMustBeMeasured: true,
    korniaCudaSubstantiveMeasurementRequired: true,
    opencvCudaEveryMaskCrosscheckRequired: true,
    cpuDecodeAndBoundedSerializationOnly: true,
    cpuOnlySubstantiveMaskQaAllowed: false,
    runtimeDownloadAllowed: false,
    automaticRetryAfterUnknownOutcomeAllowed: false,
  },
  byteFreeRequest: true,
  callerPathUrlCommandCodeOrEnvironmentAccepted: false,
  browserOrCallerMeasurementAccepted: false,
})
const fixedWorkerResponse =
  buildCanonicalTrackAllSam31L4TaskQaWorkerResponseV3({
    schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-response-v3',
    operationId: 'tool.kornia.refine_mask.v1',
    sam31InvocationId: fixedWorkerRequest.sam31InvocationId,
    l4InvocationId: fixedWorkerRequest.l4InvocationId,
    chunkOrdinal: 1,
    requestBindingSha256: fixedWorkerRequest.requestBindingSha256,
    status: 'completed',
    terminalStage: 'completed',
    gpuEvidence: {
      requestedAccelerator: 'nvidia_l4',
      observedDeviceNameDigestSha256: hash('caption-track-all-l4-device'),
      observedNvidiaDriverVersion: '535.216.03',
      observedCudaRuntimeVersion: '12.8',
      observedTorchVersion: '2.10.0+cu128',
      observedKorniaVersion: '0.8.3',
      observedOpenCvVersion: '4.13.0',
      observedComputeCapabilityMajor: 8,
      observedComputeCapabilityMinor: 9,
      observedTotalDeviceMemoryBytes: 24 * 1024 ** 3,
      maximumObservedGpuUtilizationPercent: 72,
      cudaAvailable: true,
      exactL4DeviceObserved: true,
      korniaCudaTensorExecutionObserved: true,
      opencvCudaDeviceCount: 1,
      opencvCudaEveryMaskCrosschecked: true,
      torchCudaKernelCount: 240,
      opencvCudaKernelCount: 240,
      cpuOnlySubstantiveMaskQaUsed: false,
      cudaDriverLibraryMode: 'cuda_compat_12_8',
      observedCudaDriverLibraryPathDigestSha256:
        hash('caption-track-all-l4-cuda-compat'),
    },
    inputEvidence: {
      manifestByteLength: outputEvidence.manifestByteLength,
      manifestSha256: outputEvidence.manifestSha256,
      manifestRefExactMatch: true,
      manifestRequestBindingExactMatch: true,
      maskPngCount: captionResult.maskFileCount,
      maskPngByteLength: outputEvidence.combinedMaskByteLength,
      everyManifestMaskPngRereadAndHashed: true,
      everyRequestedFrameAndSubjectPresentExactlyOnce: true,
      everyMaskMatchesSourceGeometry: true,
      everyMaskIsBinaryGrayscalePng: true,
      unrequestedManifestObjectOrFrameAccepted: false,
    },
    previousBoundaryInputEvidence: null,
    runtimeMeasurement: {
      wallTimeMilliseconds: 1_200,
      decodeAndUploadMilliseconds: 120,
      korniaCudaMilliseconds: 450,
      opencvCudaCrosscheckMilliseconds: 300,
      peakCudaAllocatedBytes: 1_024_000,
      peakCudaReservedBytes: 2_048_000,
    },
    outputSummary: {
      subjectMeasurements: [{
        subjectRequestId: subjectEvidence.subjectRequestId,
        subjectEvidenceId: subjectEvidence.subjectEvidenceId,
        maskObjectId: outputEvidence.distinctObjectIds[0]!,
        measuredFrameCount: subjectEvidence.temporalQa.measuredFrameCount,
        expectedFrameCount: subjectEvidence.temporalQa.expectedFrameCount,
        emptyMaskFrameCount: subjectEvidence.temporalQa.emptyMaskFrameCount,
        fullFrameMaskCount: subjectEvidence.temporalQa.fullFrameMaskCount,
        minimumBinaryIntersectionOverUnionBasisPoints:
          subjectEvidence.temporalQa
            .minimumBinaryIntersectionOverUnionBasisPoints,
        maximumNormalizedCentroidShiftBasisPoints:
          subjectEvidence.temporalQa
            .maximumNormalizedCentroidShiftBasisPoints,
        maximumBoundaryDisagreementBasisPoints:
          subjectEvidence.temporalQa.maximumBoundaryDisagreementBasisPoints,
        maximumAlphaFlickerBasisPoints:
          subjectEvidence.temporalQa.maximumAlphaFlickerBasisPoints,
        minimumEdgeQualityBasisPoints:
          subjectEvidence.temporalQa.minimumEdgeQualityBasisPoints,
        minimumSubjectCoverageBasisPoints:
          subjectEvidence.temporalQa.minimumSubjectCoverageBasisPoints,
        identitySwapCount: subjectEvidence.temporalQa.identitySwapCount,
        lostAnchorFrameCount: subjectEvidence.temporalQa.lostAnchorFrameCount,
        firstMaskFrameIndex: 0,
        lastMaskFrameIndex:
          captionTask.runtimeRequest.sourceMedia.decodedFrameCount - 1,
        maskPngCount: captionTask.runtimeRequest.sourceMedia.decodedFrameCount,
        maskPngByteLength: outputEvidence.combinedMaskByteLength,
        orderedMaskSetDigestSha256: hash('caption-track-all-mask-set'),
        completeRequestedRangeCoverage: true,
      }],
      temporalMetricSeries: [{
        subjectRequestId: subjectEvidence.subjectRequestId,
        subjectEvidenceId: subjectEvidence.subjectEvidenceId,
        maskObjectId: outputEvidence.distinctObjectIds[0]!,
        expectedFrameCount: subjectEvidence.temporalQa.expectedFrameCount,
        expectedFramePairCount:
          subjectEvidence.temporalQa.expectedFrameCount - 1,
        centroidTranslationCompensatedBinaryIntersectionOverUnionBasisPoints:
          Array.from({
            length: subjectEvidence.temporalQa.expectedFrameCount - 1,
          }, () => subjectEvidence.temporalQa
            .minimumBinaryIntersectionOverUnionBasisPoints),
        meanAbsoluteAlphaDeltaBasisPoints: Array.from({
          length: subjectEvidence.temporalQa.expectedFrameCount - 1,
        }, () => subjectEvidence.temporalQa.maximumAlphaFlickerBasisPoints),
        boundaryDisagreementBasisPoints: Array.from({
          length: subjectEvidence.temporalQa.expectedFrameCount,
        }, () => subjectEvidence.temporalQa
          .maximumBoundaryDisagreementBasisPoints),
        exactOrderedPerFramePairMetricsFromKorniaCuda: true,
        exactOrderedPerFrameMetricsFromKorniaCuda: true,
        opencvCudaEveryMaskCrosschecked: true,
      }],
      crossChunkBoundaryMeasurements: [],
      korniaCudaExecutionDigestSha256: korniaExecutionRef.contentHash,
      opencvCudaCrosscheckExecutionDigestSha256:
        opencvExecutionRef.contentHash,
      completeRequestedFrameAndSubjectCoverage: true,
      sampledOrRepresentativeOnlyMeasurementAccepted: false,
      exactMaskManifestAndEveryMaskPngReread: true,
      exactOrderedTemporalMetricSeriesIncluded: true,
      previousChunkBoundaryComparedWhenRequired: true,
    },
    failureCode: 'none',
    privateCreateOnlyWorkerOutput: true,
    runtimeDownloadPerformed: false,
    cpuOnlySubstantiveMaskQaUsed: false,
    serverCostReceiptIncluded: false,
    customerCreditsMutated: false,
    qaApprovalGranted: false,
    assetManifestMutated: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
const fixedWorkerEvidenceResult =
  sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResultV3({
    schemaVersion: 'canonical-track-all-sam3_1-l4-mask-qa-worker-result-v3',
    workerResultId: 'caption-track-all-l4-fixed-worker-result-v3',
    sam31InvocationId: captionTask.invocationId,
    l4InvocationId: l4Envelope.envelopeId,
    workerServiceIdentityRef,
    l4LaunchRef: rawRef(
      l4Launch.launchRecordId,
      l4Launch.schemaVersion,
      l4Launch.launchHash,
    ),
    l4ExecutionEnvelopeRef: rawRef(
      l4Envelope.envelopeId,
      l4Envelope.schemaVersion,
      l4Envelope.envelopeHash,
    ),
    l4TerminalRef: rawRef(
      l4Terminal.terminalRecordId,
      l4Terminal.schemaVersion,
      l4Terminal.terminalHash,
    ),
    workerRequest: fixedWorkerRequest,
    workerResponse: fixedWorkerResponse,
    privateCreateOnlyWorkerOutput: true,
    fixedWorkerRequestAndResponseExactReread: true,
    separateSam31InputAndL4JobInvocationRootsVerified: true,
    l4WorkerWroteUnderSam31InvocationRoot: false,
    measurementCompiledOnlyByCanonicalBackend: true,
    callerOrBrowserMeasurementAccepted: false,
    callerOrBrowserOutputAccepted: false,
    pathsUrlsCredentialsOrMediaBytesIncluded: false,
  })
assert.equal(await taskQaCandidateRepository.persistWorkerResultCreateOnly({
  result: fixedWorkerEvidenceResult,
}), 'created')
const compiledMeasurement =
  compileCanonicalTrackAllSam31L4MaskQaMeasurementFromWorkerResult({
    samTask: captionTask,
    samTaskContext: captionContext,
    samResult: captionResult,
    workerResult: fixedWorkerEvidenceResult,
    launch: l4Launch,
    envelope: l4Envelope,
    terminal: l4Terminal,
  })
const compiledReview = sealCanonicalTrackAllSam31PrivateSceneReview({
  ...(() => {
    const { reviewDigestSha256: _digest, ...review } =
      structuredClone(privateReview)
    assert.equal(typeof _digest, 'string')
    return review
  })(),
  reviewId: 'caption-track-all-private-scene-review-v2',
  measurementRef: rawRef(
    compiledMeasurement.measurementId,
    compiledMeasurement.schemaVersion,
    compiledMeasurement.measurementDigestSha256,
  ),
  canonicalScope: structuredClone(compiledMeasurement.canonicalScope),
  requestedRange: structuredClone(compiledMeasurement.requestedRange),
  reviewedSubjectEvidenceIds: compiledMeasurement.subjectEvidence.map(
    (subject) => subject.subjectEvidenceId,
  ),
})
const compiledReviewResult = sealCanonicalTrackAllSam31PrivateReviewResult({
  schemaVersion: 'canonical-track-all-sam3_1-private-review-result-v1',
  reviewResultId: 'caption-track-all-independent-review-result-v2',
  invocationId: captionTask.invocationId,
  reviewerServiceIdentityRef: compiledReview.reviewerIdentityRef,
  workerResultRef: rawRef(
    fixedWorkerEvidenceResult.workerResultId,
    fixedWorkerEvidenceResult.schemaVersion,
    fixedWorkerEvidenceResult.workerResultDigestSha256,
  ),
  review: compiledReview,
  privateCreateOnlyReviewOutput: true,
  completeIntervalPlaybackRereadByIndependentReviewOwner: true,
  callerOrBrowserReviewAccepted: false,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
})
assert.equal(await taskQaCandidateRepository.persistReviewResultCreateOnly({
  result: compiledReviewResult,
}), 'created')
const fixedEvidenceFinalizationRequest =
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest({
    requestId: 'caption-track-all-task-qa-finalization-v2',
    invocationId: captionTask.invocationId,
    sam31RuntimeResultAdmissionRef: captionResultRef,
    l4MaskQaWorkerResultRef: rawRef(
      fixedWorkerEvidenceResult.workerResultId,
      fixedWorkerEvidenceResult.schemaVersion,
      fixedWorkerEvidenceResult.workerResultDigestSha256,
    ),
    independentPrivateReviewResultRef: rawRef(
      compiledReviewResult.reviewResultId,
      compiledReviewResult.schemaVersion,
      compiledReviewResult.reviewResultDigestSha256,
    ),
  })
const fixedEvidenceFinalization =
  await taskQaEvidenceFinalizationRuntime.finalizeTaskQaEvidence({
    authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
    workspaceId: payload.canonicalScope.workspaceId,
    idempotencyKey: fixedEvidenceFinalizationRequest.requestId,
    request: fixedEvidenceFinalizationRequest,
  })
assert.equal(
  parseTrackAllSam31TaskQaEvidenceFinalizationResult(
    fixedEvidenceFinalization,
  ).disposition,
  'ready_for_caption_evidence_finalization',
)
check(
  fixedEvidenceFinalization.l4MaskQaMeasurementRef.contentHash ===
    compiledMeasurement.measurementDigestSha256,
  'The task-QA finalizer must compile v3 worker evidence into one canonical measurement.',
)
const fixedEvidenceFinalizationReplay =
  await taskQaEvidenceFinalizationRuntime.finalizeTaskQaEvidence({
    authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
    workspaceId: payload.canonicalScope.workspaceId,
    idempotencyKey: fixedEvidenceFinalizationRequest.requestId,
    request: fixedEvidenceFinalizationRequest,
  })
check(
  fixedEvidenceFinalizationReplay.resultDigestSha256 ===
    fixedEvidenceFinalization.resultDigestSha256,
  'The fixed-evidence task-QA finalizer must replay to one immutable result.',
)
const {
  schemaVersion: discardedV2RequestVersion,
  l4InvocationId: discardedV2L4InvocationId,
  sam31InvocationId: discardedV2Sam31InvocationId,
  chunkOrdinal: discardedV3ChunkOrdinal,
  canonicalStartFrameInclusive: discardedV3CanonicalStart,
  canonicalEndFrameInclusive: discardedV3CanonicalEnd,
  previousChunkBoundaryInput: discardedV3PreviousBoundary,
  requestBindingSha256: discardedV2RequestDigest,
  ...historicalV1WorkerRequestPayload
} = structuredClone(fixedWorkerRequest)
assert.equal(typeof discardedV2RequestVersion, 'string')
assert.equal(discardedV2L4InvocationId, l4Envelope.envelopeId)
assert.equal(discardedV2Sam31InvocationId, captionTask.invocationId)
assert.equal(discardedV3ChunkOrdinal, 1)
assert.equal(typeof discardedV3CanonicalStart, 'number')
assert.equal(typeof discardedV3CanonicalEnd, 'number')
assert.equal(discardedV3PreviousBoundary, null)
assert.equal(typeof discardedV2RequestDigest, 'string')
const historicalV1WorkerRequest =
  buildCanonicalTrackAllSam31L4TaskQaWorkerRequest({
    ...historicalV1WorkerRequestPayload,
    schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-request-v1',
    invocationId: captionTask.invocationId,
  })
const {
  schemaVersion: discardedV2ResponseVersion,
  l4InvocationId: discardedResponseL4InvocationId,
  sam31InvocationId: discardedResponseSam31InvocationId,
  chunkOrdinal: discardedV3ResponseChunkOrdinal,
  previousBoundaryInputEvidence: discardedV3BoundaryEvidence,
  requestBindingSha256: discardedV2ResponseRequestDigest,
  responseBindingSha256: discardedV2ResponseDigest,
  ...historicalV1WorkerResponsePayload
} = structuredClone(fixedWorkerResponse)
assert.equal(typeof discardedV2ResponseVersion, 'string')
assert.equal(discardedResponseL4InvocationId, l4Envelope.envelopeId)
assert.equal(discardedResponseSam31InvocationId, captionTask.invocationId)
assert.equal(discardedV3ResponseChunkOrdinal, 1)
assert.equal(discardedV3BoundaryEvidence, null)
assert.equal(typeof discardedV2ResponseRequestDigest, 'string')
assert.equal(typeof discardedV2ResponseDigest, 'string')
const historicalV1WorkerResponse =
  buildCanonicalTrackAllSam31L4TaskQaWorkerResponse({
    ...historicalV1WorkerResponsePayload,
    outputSummary: (() => {
      const {
        temporalMetricSeries: _discardedSeries,
        crossChunkBoundaryMeasurements: _discardedBoundaries,
        exactOrderedTemporalMetricSeriesIncluded: _discardedSeriesFlag,
        previousChunkBoundaryComparedWhenRequired: _discardedBoundaryFlag,
        ...historicalSummary
      } = historicalV1WorkerResponsePayload.outputSummary!
      void _discardedSeries
      void _discardedBoundaries
      void _discardedSeriesFlag
      void _discardedBoundaryFlag
      return historicalSummary
    })(),
    schemaVersion: 'canonical-track-all-sam3_1-l4-task-qa-worker-response-v1',
    requestBindingSha256: historicalV1WorkerRequest.requestBindingSha256,
  })
const historicalV2WorkerEvidenceResult =
  sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResult({
    schemaVersion: 'canonical-track-all-sam3_1-l4-mask-qa-worker-result-v2',
    workerResultId: 'caption-track-all-l4-historical-worker-result-v2',
    invocationId: captionTask.invocationId,
    workerServiceIdentityRef,
    l4LaunchRef: structuredClone(fixedWorkerEvidenceResult.l4LaunchRef),
    l4ExecutionEnvelopeRef:
      structuredClone(fixedWorkerEvidenceResult.l4ExecutionEnvelopeRef),
    l4TerminalRef: structuredClone(fixedWorkerEvidenceResult.l4TerminalRef),
    workerRequest: historicalV1WorkerRequest,
    workerResponse: historicalV1WorkerResponse,
    privateCreateOnlyWorkerOutput: true,
    fixedWorkerRequestAndResponseExactReread: true,
    measurementCompiledOnlyByCanonicalBackend: true,
    callerOrBrowserMeasurementAccepted: false,
    callerOrBrowserOutputAccepted: false,
    pathsUrlsCredentialsOrMediaBytesIncluded: false,
  })
assert.equal(await taskQaCandidateRepository.persistWorkerResultCreateOnly({
  result: historicalV2WorkerEvidenceResult,
}), 'created')
const historicalV2ReviewResult = sealCanonicalTrackAllSam31PrivateReviewResult({
  schemaVersion: 'canonical-track-all-sam3_1-private-review-result-v1',
  reviewResultId: 'caption-track-all-historical-v2-review-result',
  invocationId: captionTask.invocationId,
  reviewerServiceIdentityRef: compiledReview.reviewerIdentityRef,
  workerResultRef: rawRef(
    historicalV2WorkerEvidenceResult.workerResultId,
    historicalV2WorkerEvidenceResult.schemaVersion,
    historicalV2WorkerEvidenceResult.workerResultDigestSha256,
  ),
  review: compiledReview,
  privateCreateOnlyReviewOutput: true,
  completeIntervalPlaybackRereadByIndependentReviewOwner: true,
  callerOrBrowserReviewAccepted: false,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
})
assert.equal(await taskQaCandidateRepository.persistReviewResultCreateOnly({
  result: historicalV2ReviewResult,
}), 'created')
const historicalV2FinalizationRequest =
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest({
    requestId: 'caption-track-all-task-qa-historical-v2-finalization',
    invocationId: captionTask.invocationId,
    sam31RuntimeResultAdmissionRef: captionResultRef,
    l4MaskQaWorkerResultRef: rawRef(
      historicalV2WorkerEvidenceResult.workerResultId,
      historicalV2WorkerEvidenceResult.schemaVersion,
      historicalV2WorkerEvidenceResult.workerResultDigestSha256,
    ),
    independentPrivateReviewResultRef: rawRef(
      historicalV2ReviewResult.reviewResultId,
      historicalV2ReviewResult.schemaVersion,
      historicalV2ReviewResult.reviewResultDigestSha256,
    ),
  })
await assert.rejects(() =>
  taskQaEvidenceFinalizationRuntime.finalizeTaskQaEvidence({
    authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
    workspaceId: payload.canonicalScope.workspaceId,
    idempotencyKey: historicalV2FinalizationRequest.requestId,
    request: historicalV2FinalizationRequest,
  }), /Historical single-invocation Track All worker evidence v2 is read-only/u)
assertions += 1
assert.throws(() => sealCanonicalTrackAllSam31L4MaskQaWorkerEvidenceResultV3({
  ...structuredClone(fixedWorkerEvidenceResult),
  workerResultDigestSha256: undefined,
  measurement: compiledMeasurement,
} as never))
assertions += 1
assert.throws(() =>
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest({
    ...taskQaEvidenceFinalizationRequest,
    requestId: 'caption-track-all-task-qa-raw-claim',
    measurement: { minimumIouBasisPoints: 10_000 },
  } as never))
assertions += 1
await assert.rejects(() =>
  taskQaEvidenceFinalizationRuntime.finalizeTaskQaEvidence({
    authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
    workspaceId: 'workspace-crossed',
    idempotencyKey: fixedEvidenceFinalizationRequest.requestId,
    request: fixedEvidenceFinalizationRequest,
  }))
assertions += 1
const {
  reviewDigestSha256: discardedPrivateReviewDigest,
  ...sameWorkerReviewPayload
} = structuredClone(compiledReview)
assert.equal(typeof discardedPrivateReviewDigest, 'string')
sameWorkerReviewPayload.reviewId =
  'caption-track-all-non-independent-private-scene-review'
sameWorkerReviewPayload.reviewerIdentityRef = workerServiceIdentityRef
const sameWorkerReview = sealCanonicalTrackAllSam31PrivateSceneReview(
  sameWorkerReviewPayload,
)
const sameWorkerReviewResult = sealCanonicalTrackAllSam31PrivateReviewResult({
  schemaVersion: 'canonical-track-all-sam3_1-private-review-result-v1',
  reviewResultId: 'caption-track-all-non-independent-review-result',
  invocationId: captionTask.invocationId,
  reviewerServiceIdentityRef: workerServiceIdentityRef,
  workerResultRef: rawRef(
    fixedWorkerEvidenceResult.workerResultId,
    fixedWorkerEvidenceResult.schemaVersion,
    fixedWorkerEvidenceResult.workerResultDigestSha256,
  ),
  review: sameWorkerReview,
  privateCreateOnlyReviewOutput: true,
  completeIntervalPlaybackRereadByIndependentReviewOwner: true,
  callerOrBrowserReviewAccepted: false,
  pathsUrlsCredentialsOrMediaBytesIncluded: false,
})
assert.equal(await taskQaCandidateRepository.persistReviewResultCreateOnly({
  result: sameWorkerReviewResult,
}), 'created')
const sameWorkerRequest =
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest({
    requestId: 'caption-track-all-task-qa-same-worker-reviewer',
    invocationId: captionTask.invocationId,
    sam31RuntimeResultAdmissionRef: captionResultRef,
    l4MaskQaWorkerResultRef:
      fixedEvidenceFinalizationRequest.l4MaskQaWorkerResultRef,
    independentPrivateReviewResultRef: rawRef(
      sameWorkerReviewResult.reviewResultId,
      sameWorkerReviewResult.schemaVersion,
      sameWorkerReviewResult.reviewResultDigestSha256,
    ),
  })
await assert.rejects(() =>
  taskQaEvidenceFinalizationRuntime.finalizeTaskQaEvidence({
    authenticatedOwnerUserId: payload.canonicalScope.ownerUserId,
    workspaceId: payload.canonicalScope.workspaceId,
    idempotencyKey: sameWorkerRequest.requestId,
    request: sameWorkerRequest,
  }))
assertions += 1

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
    compiledMeasurement.measurementId,
    compiledMeasurement.schemaVersion,
    compiledMeasurement.measurementDigestSha256,
  ),
  privateSceneReviewRef: rawRef(
    compiledReview.reviewId,
    compiledReview.schemaVersion,
    compiledReview.reviewDigestSha256,
  ),
})

const {
  measurementDigestSha256: discardedMeasurementDigest,
  ...failingMeasurementInput
} = structuredClone(compiledMeasurement)
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
} = structuredClone(compiledReview)
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
      compiledMeasurement.measurementId,
      compiledMeasurement.schemaVersion,
      compiledMeasurement.measurementDigestSha256,
    ),
    privateSceneReviewRef: rawRef(
      compiledReview.reviewId,
      compiledReview.schemaVersion,
      compiledReview.reviewDigestSha256,
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

export const canonicalCaptionTrackAllRepositoryQualificationFixture =
  Object.freeze({
    supportRequestRef: requestRef(captionSupportRequest),
    context: captionContext,
    task: captionTask,
    result: captionResult,
    measurement: compiledMeasurement,
    review: compiledReview,
    authority: sceneQaAuthority,
    sceneEvidence: sceneEvidence!,
    record,
    taskContextRepository: qualificationTaskContextRepository,
    taskStore,
    runtimeResultStore: resultStore,
    taskQaRepository,
    captionSceneEvidenceRepository: sceneEvidenceRepository,
    captionTrackAllEvidenceRepository: evidenceRepository,
  })

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
  authenticatedTaskQaFinalizerRereadsSamTaskResultAndL4Lifecycle: true,
  fixedWorkerV3SeparateInvocationEvidenceCompiledByCanonicalBackend: true,
  historicalSingleInvocationWorkerV2FreshFinalizationRejected: true,
  workerSuppliedCanonicalMeasurementAccepted: false,
  taskQaFinalizerRequiresZeroActiveGpuInstancesAndExactCostLineage: true,
  taskQaFinalizerRejectsWorkerAsIndependentReviewer: true,
  rawTaskQaMeasurementOrReviewAcceptedFromRoute: false,
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

function prefixedRef(reference: CaptionDomainRef) {
  const version = Number(reference.version)
  assert.equal(Number.isSafeInteger(version) && version > 0, true)
  return backendRef(reference.id, reference.contentHash, version)
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
