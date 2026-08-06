import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-specialist-execution'

import {
  CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_CURRENT_VERSION,
  CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_VERSION,
  createCanonicalCaptionApprovedSnapshotReadPort,
  createCanonicalCaptionSourceWordTimingEvidence,
  createCanonicalCaptionSourceWordTimingReadPort,
  createCanonicalCaptionTranscriptEvidenceRepository,
  createCanonicalCaptionTranscriptPlanningExpectationOwnerReadPort,
  createCanonicalCaptionTranscriptSupportService,
  createCanonicalCaptionTranscriptSupportServiceV2,
  parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord,
} from '../services/canonical-caption-transcript-support-service'
import { createCanonicalSourceLedSourceFrameAuthority } from
  '../services/canonical-source-led-content-analysis-evidence'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  type CanonicalSourceTranscriptOrchestraReadScope,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import type { CanonicalCreateOnlyJsonObjectPort } from
  '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  resolveCanonicalCaptionTranscriptExecutionMount,
} from '../services/canonical-internal-authority-runner-service'
import {
  executeCanonicalCaptionSpecialistWorkItem,
  parseCanonicalCaptionSpecialistWorkItemInput,
} from
  '../services/canonical-caption-specialist-execution-service'
import { createCanonicalSpecialistSupportResumeRepository } from
  '../services/canonical-specialist-support-resume-service'
import type { CanonicalApprovedExecutionAuthority } from
  '../services/edit-planning-authority-service'
import type { CanonicalApprovedEditExecutionPackage } from
  '../edit-architecture/canonical-approved-edit-execution-package'
import type { CanonicalVisualIntelligenceSourceTranscriptResult } from
  '../services/canonical-source-visual-intelligence-analysis-contract'
import { createCanonicalQualityFirstUserTriggeredGpuPolicy } from
  '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

let checks = 0
function check(value: unknown, message: string): void {
  assert.ok(value, message)
  checks += 1
}
function visualRef(id: string, value = id) {
  return {
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(value)}`,
  }
}

const sourceFrameAuthority = createCanonicalSourceLedSourceFrameAuthority({
  fpsNumerator: 30,
  fpsDenominator: 1,
  frameCount: 90,
  timeBaseNumerator: 1,
  timeBaseDenominator: 30,
})
const sourceScope: CanonicalSourceTranscriptOrchestraReadScope = {
  ownerUserId: 'owner.caption.transcript.1',
  workspaceId: 'workspace.caption.transcript.1',
  projectId: 'project.caption.transcript.1',
  editSessionId: 'edit.caption.transcript.1',
  analysisRunId: 'analysis.caption.transcript.1',
  sourceSequenceItemId: 'source.caption.transcript.1',
  mediaAssetId: 'media.caption.transcript.1',
  uploadedOrder: 1,
  checksumSha256: sha256AuthorityValue('caption-transcript-source'),
  byteLength: 4_096,
  durationFrames: 90,
  sourceFrameAuthority,
  finalizedMediaAuthorityRef: visualRef('finalized-caption-source'),
  sourceProbeAuthorityRef: visualRef('probe-caption-source'),
}
const transcriptSegments = [{
  segmentId: 'source-segment-1',
  startFrame: 0,
  endFrameExclusive: 36,
  text: 'Ideas move through the frame',
  confidenceBasisPoints: 9_700,
  wordsVerified: true,
}]
const transcriptCoverage = {
  schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
  coveredStartFrame: 0 as const,
  coveredEndFrameExclusive: 90,
  completeAudioTimelineProcessed: true as const,
  speechSegmentsMayOmitSilence: true as const,
  embeddedInstructionDetectionRequired: true as const,
}
const transcriptDigestSha256 = sha256AuthorityValue(transcriptSegments)
const transcriptResult: CanonicalVisualIntelligenceSourceTranscriptResult = {
  schemaVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
  transcriptAuthorityRef: {
    id: `source-transcript-${transcriptDigestSha256.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${transcriptDigestSha256}`,
  },
  transcript: {
    status: 'completed',
    modelId: 'faster-whisper-large-v3',
    modelDigestSha256: sha256AuthorityValue('faster-whisper-large-v3'),
    runtimeVersion: 'faster-whisper-1.2.1',
    transcriptDigestSha256,
    segments: transcriptSegments,
    coverage: {
      ...transcriptCoverage,
      coverageDigestSha256: sha256AuthorityValue(transcriptCoverage),
    },
    rawAudioPersisted: false,
    modelDownloadPerformed: false,
    networkAttempted: false,
  },
  execution: {
    executionOwner: 'canonical_quality_first_source_transcript_router',
    sourceAudioDisposition: 'transcribed_on_nvidia_a100_80gb_primary',
    routeProfileId: 'quality_a100_80gb_user_triggered_heavy_job_v1',
    acceleratorClass: 'nvidia_a100_80gb',
    primaryAttemptOutcome: 'completed',
    fallbackAttemptOutcome: 'not_attempted',
    primaryAttemptTerminalFailureClass: null,
    primaryAttemptReceiptRef: visualRef('caption-transcript-attempt'),
    completedAttemptReceiptRef: visualRef('caption-transcript-attempt'),
    completedRuntimeReleaseRef: visualRef('caption-transcript-runtime-release'),
    fallbackAdmissionRef: null,
    attemptCostEvidenceRefs: [visualRef('caption-transcript-cost')],
    routePolicyDigestSha256:
      `sha256:${createCanonicalQualityFirstUserTriggeredGpuPolicy().policyHash}`,
    gpuAccelerationUsed: true,
    cpuInferenceFallbackUsed: false,
    completeAudioTimelineProcessed: true,
    modelBytesPinnedBeforeExecution: true,
    runtimeDownloadPerformed: false,
    rawAudioPersisted: false,
    transcriptRereadVerified: true,
    customerCreditMutated: false,
    systemFailureChargedToCustomer: false,
    unapprovedOverageChargedToCustomer: false,
  },
}

const wordEvidence = createCanonicalCaptionSourceWordTimingEvidence({
  evidenceId: 'caption.word-timing.source.1',
  ownerUserId: sourceScope.ownerUserId,
  workspaceId: sourceScope.workspaceId,
  projectId: sourceScope.projectId,
  editSessionId: sourceScope.editSessionId,
  analysisRunId: sourceScope.analysisRunId,
  sourceSequenceItemId: sourceScope.sourceSequenceItemId,
  mediaAssetId: sourceScope.mediaAssetId,
  uploadedOrder: sourceScope.uploadedOrder,
  sourceChecksumSha256: sourceScope.checksumSha256,
  durationFrames: sourceScope.durationFrames,
  fpsNumerator: sourceFrameAuthority.fpsNumerator,
  fpsDenominator: sourceFrameAuthority.fpsDenominator,
  sourceScopeDigestSha256: sha256AuthorityValue(sourceScope),
  sourceTranscriptAuthorityRef: transcriptResult.transcriptAuthorityRef,
  sourceTranscriptDigestSha256: transcriptDigestSha256,
  languageCode: 'en-US',
  wordTimingArtifactRef: {
    id: 'canonical.word-timing.source.1',
    version: 'canonical-source-word-timing-artifact-v1',
    contentHash: sha256AuthorityValue('canonical-word-timing-source-1'),
  },
  diarizationArtifactRef: null,
  speakerDiarizationState: 'not_present',
  segments: [{
    sourceTranscriptSegmentId: 'source-segment-1',
    order: 1,
    startFrame: 0,
    endFrameExclusive: 36,
    startMilliseconds: 0,
    endMillisecondsExclusive: 1_200,
    text: 'Ideas move through the frame',
    confidenceBasisPoints: 9_700,
    words: [
      ['Ideas', 0, 220],
      ['move', 220, 430],
      ['through', 430, 680],
      ['the', 680, 830],
      ['frame', 830, 1_150],
    ].map(([text, start, end], index) => ({
      orderInSegment: index + 1,
      text: String(text),
      startMilliseconds: Number(start),
      endMillisecondsExclusive: Number(end),
      confidenceBasisPoints: 9_700,
      speakerId: null,
    })),
  }],
  exactPrivateArtifactRereadVerified: true,
  exactSourceScopeVerified: true,
  exactTranscriptDigestVerified: true,
  exactWordTimestampCoverageVerified: true,
  asrNativeWordTiming: true,
  privateArtifact: true,
  browserShareable: false,
  rawAudioIncluded: false,
  rawChatIncluded: false,
  mediaBytesIncluded: false,
  pathsUrlsOrCredentialsIncluded: false,
  transcriptMutationAuthorityGranted: false,
  timingAuthorityGranted: false,
  runtimeOrDispatchAuthorityGranted: false,
  assetMutationAuthorityGranted: false,
  finalQaApprovalGranted: false,
  billingAuthorityGranted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
})

const approvedScope = {
  ownerUserId: sourceScope.ownerUserId,
  workspaceId: sourceScope.workspaceId,
  projectId: sourceScope.projectId,
  editSessionId: sourceScope.editSessionId,
  planVersionId: 'plan.caption.transcript.1.v1',
  approvedSnapshotRef: {
    id: 'snapshot.caption.transcript.1',
    version: 'private-edit-authority-approved-snapshot-v3',
    contentHash: sha256AuthorityValue('snapshot-caption-transcript-1'),
  },
}
const objects = new Map<string, Buffer>()
const repository = createCanonicalCaptionTranscriptEvidenceRepository({
  objectPort: memoryObjectPort(objects),
  prefix: 'private/smoke/caption-transcript-support/v1',
})
check(CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_VERSION ===
  'canonical-caption-transcript-evidence-repository-v1'
  && repository.repositoryVersion ===
    CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_CURRENT_VERSION,
  'The frozen V1 repository identity must remain stable while current indexes advance additively.')
const approvedSnapshotReadPort =
  createCanonicalCaptionApprovedSnapshotReadPort(
    async (scope) => structuredClone(scope))
const sourceTranscriptReadPort = {
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
    async readCompleted(scope: CanonicalSourceTranscriptOrchestraReadScope) {
      return stableAuthorityStringify(scope) ===
        stableAuthorityStringify(sourceScope)
        ? structuredClone(transcriptResult) : null
    },
  } as const
const wordTimingReadPort = createCanonicalCaptionSourceWordTimingReadPort(
    async ({ scope, transcriptAuthorityRef }) =>
      stableAuthorityStringify(scope) === stableAuthorityStringify(sourceScope)
      && stableAuthorityStringify(transcriptAuthorityRef) ===
        stableAuthorityStringify(transcriptResult.transcriptAuthorityRef)
        ? structuredClone(wordEvidence) : null)
const serviceInput = {
  approvedSnapshotReadPort,
  sourceTranscriptReadPort,
  wordTimingReadPort,
  repository,
  now: () => new Date('2026-08-05T18:00:00.000Z'),
} as const
const service = createCanonicalCaptionTranscriptSupportService(serviceInput)
const serviceV2 = createCanonicalCaptionTranscriptSupportServiceV2(serviceInput)

const record = await service.projectAuthenticatedTranscript({
  canonicalReadScope: approvedScope,
  sourceScopes: [sourceScope],
})
check(record.canonicalTranscript.words.length === 5,
  'The authenticated projection must preserve all exact source words.')
check(record.canonicalTranscript.segments[0]?.text ===
  'Ideas move through the frame',
  'The canonical Caption transcript must preserve exact source text.')
check(record.authenticatedReadBinding.speakerDiarizationState === 'not_present',
  'Missing diarization must remain explicit and must not invent speakers.')
check(record.alignmentQualification.routes[0]?.status === 'qualified',
  'The real Faster-Whisper word-timing route must be qualified.')
check(record.alignmentQualification.routes[1]?.status === 'blocked'
  && record.alignmentQualification.routes[2]?.status === 'blocked',
  'WhisperX and diarization must remain blocked without exact evidence.')
check(record.providerCallPerformedByBridge === false
  && record.transcriptRuntimePerformedByBridge === false,
  'The bridge must reread owner evidence without becoming a runtime owner.')
check(parseCanonicalCaptionTranscriptAuthenticatedEvidenceRecord(record)
  .recordDigestSha256 === record.recordDigestSha256,
  'The closed authenticated record must verify its digest.')

const transcriptProjection = [{
  sourceSequenceItemId: sourceScope.sourceSequenceItemId,
  transcriptDigestSha256,
  transcriptCoverageDigestSha256:
    transcriptResult.transcript.coverage.coverageDigestSha256,
}]
const planningExpectationDigestSha256 = sha256AuthorityValue(
  transcriptProjection)
const planningExpectationRef = {
  id: `caption-source-transcript.${
    planningExpectationDigestSha256.slice(0, 48)}`,
  version: 'canonical-source-transcript-planning-evidence-v1',
  contentHash: planningExpectationDigestSha256,
} as const
const expectationProjection =
  await serviceV2.projectAuthenticatedTranscriptForPlanningExpectation({
    canonicalReadScope: approvedScope,
    sourceScopes: [sourceScope],
    planningExpectationRef,
  })
check(expectationProjection.transcriptRecord.recordDigestSha256 ===
  record.recordDigestSha256,
  'V2 must bind the exact preapproval expectation to the authenticated transcript record.')
check(expectationProjection.expectationBinding.planningExpectationRef.id ===
  planningExpectationRef.id
  && expectationProjection.expectationBinding.byteFreeBinding
  && expectationProjection.expectationBinding
    .transcriptMutationAuthorityGrantedToCaption === false,
  'The expectation bridge must stay byte-free and grant Caption no transcript authority.')
const expectationReread =
  await repository.findExactForPlanningExpectation({
    canonicalReadScope: approvedScope,
    planningExpectationRef,
  })
check(expectationReread?.binding.bindingDigestSha256 ===
  expectationProjection.expectationBinding.bindingDigestSha256
  && expectationReread.transcriptRecord.recordDigestSha256 ===
    record.recordDigestSha256,
  'The create-only expectation index must reread the exact mapping and transcript.')
await assert.rejects(
  () => serviceV2.projectAuthenticatedTranscriptForPlanningExpectation({
    canonicalReadScope: approvedScope,
    sourceScopes: [sourceScope],
    planningExpectationRef: {
      ...planningExpectationRef,
      contentHash: sha256AuthorityValue('crossed-planning-expectation'),
    },
  }),
  /crossed its exact source-analysis lineage/u,
)
checks += 1
const alternateWordEvidence = createCanonicalCaptionSourceWordTimingEvidence({
  ...wordEvidence,
  evidenceId: 'caption.word-timing.source.alternate.1',
  wordTimingArtifactRef: {
    id: 'canonical.word-timing.source.alternate.1',
    version: 'canonical-source-word-timing-artifact-v1',
    contentHash: sha256AuthorityValue('alternate-word-timing-source-1'),
  },
  segments: wordEvidence.segments.map((segment) => ({
    ...segment,
    words: segment.words.map((word, index) => index === 4
      ? { ...word, endMillisecondsExclusive: 1_160 }
      : structuredClone(word)),
  })),
})
const alternateServiceV2 = createCanonicalCaptionTranscriptSupportServiceV2({
  approvedSnapshotReadPort,
  sourceTranscriptReadPort,
  wordTimingReadPort: createCanonicalCaptionSourceWordTimingReadPort(
    async () => structuredClone(alternateWordEvidence)),
  repository,
  now: () => new Date('2026-08-05T18:00:00.000Z'),
})
await assert.rejects(
  () => alternateServiceV2
    .projectAuthenticatedTranscriptForPlanningExpectation({
      canonicalReadScope: approvedScope,
      sourceScopes: [sourceScope],
      planningExpectationRef,
    }),
  /create-only collision/u,
)
checks += 1

const reread = await repository.readExact({
  canonicalReadScope: record.canonicalReadScope,
  canonicalTranscriptRef:
    record.authenticatedReadBinding.canonicalTranscriptRef,
  authenticatedReadBindingRef: {
    id: record.authenticatedReadBinding.bindingId,
    version: record.authenticatedReadBinding.schemaVersion,
    contentHash: record.authenticatedReadBinding.bindingDigestSha256,
  },
})
check(reread?.canonicalTranscript.transcriptDigestSha256 ===
  record.canonicalTranscript.transcriptDigestSha256,
  'The private repository must exact-reread the canonical transcript.')
check(reread?.authenticatedReadBinding.bindingDigestSha256 ===
  record.authenticatedReadBinding.bindingDigestSha256,
  'The private repository must exact-reread the Caption binding.')

const executionRecord = await repository.findExactForExecution({
  canonicalReadScope: record.canonicalReadScope,
  canonicalTranscriptRef:
    record.authenticatedReadBinding.canonicalTranscriptRef,
})
check(executionRecord?.recordDigestSha256 === record.recordDigestSha256,
  'The postapproval runner must discover the exact transcript from its scope and transcript ref.')
check(await repository.findExactForExecution({
  canonicalReadScope: record.canonicalReadScope,
  canonicalTranscriptRef: {
    ...record.authenticatedReadBinding.canonicalTranscriptRef,
    contentHash: sha256AuthorityValue('crossed-transcript'),
  },
}) === null,
  'A crossed transcript ref must not discover another postapproval record.')

const mountWorkInput = {
  schemaVersion: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  operation: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
  captionJobType: 'plan_caption_strategy',
  requestedMode: 'planning',
  scopeLevel: 'video',
  outputId: 'output.caption.transcript.1',
  sceneId: null,
  boundaryId: null,
  authorizedFrameRanges: [{ startFrame: 0, endFrameExclusive: 90 }],
  initialArtifactRefs: [{
    ...record.authenticatedReadBinding.canonicalTranscriptRef,
    artifactType: 'canonical_transcript',
    producerSkillKey: 'canonical_transcript',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  }, {
    id: 'frame.caption.transcript.1',
    version: 'confirmed-output-frame-v1',
    contentHash: sha256AuthorityValue('frame-caption-transcript-1'),
    artifactType: 'confirmed_output_frame',
    producerSkillKey: 'canonical_layout_owner',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  }, {
    id: 'timing.caption.transcript.1',
    version: 'master-timing-plan-v1',
    contentHash: sha256AuthorityValue('timing-caption-transcript-1'),
    artifactType: 'master_timing_or_planning_timing',
    producerSkillKey: 'canonical_timing_owner',
    privateArtifact: true,
    byteFreeRef: true,
    sourceSupportRequestRef: null,
  }],
  rawChatIncluded: false,
  transcriptTextIncluded: false,
  mediaBytesIncluded: false,
  pathsUrlsOrCredentialsIncluded: false,
  directPeerDispatchRequested: false,
  providerCallRequested: false,
  timelineMutationRequested: false,
  assetMutationRequested: false,
  qaApprovalRequested: false,
  billingAuthorityRequested: false,
  publicDeliveryRequested: false,
  productionAuthorityRequested: false,
} as const
const mountAuthority = {
  snapshot: {
    approvedByUserId: approvedScope.ownerUserId,
    workspaceId: approvedScope.workspaceId,
    projectId: approvedScope.projectId,
    editSessionId: approvedScope.editSessionId,
    planId: 'plan.caption.transcript.1',
    planVersion: 1,
    snapshotId: approvedScope.approvedSnapshotRef.id,
    schemaVersion: approvedScope.approvedSnapshotRef.version,
    snapshotHash: approvedScope.approvedSnapshotRef.contentHash,
  },
  jobs: [{ id: 'job.caption.transcript.1', approvedWorkItemId:
    'work.caption.transcript.1' }],
  workItems: [{
    id: 'work.caption.transcript.1',
    executionInput: mountWorkInput,
  }],
} as unknown as Parameters<
  typeof resolveCanonicalCaptionTranscriptExecutionMount
>[0]['authority']
const executionMount =
  await resolveCanonicalCaptionTranscriptExecutionMount({
    authority: mountAuthority,
    jobId: 'job.caption.transcript.1',
    transcriptRepository: repository,
  })
check(executionMount.recordDigestSha256 === record.recordDigestSha256
  && executionMount.bindingRef.contentHash ===
    record.authenticatedReadBinding.bindingDigestSha256,
  'The internal Caption runner mount must inject the exact postapproval transcript binding.')

const expectationMountWorkInput = {
  ...mountWorkInput,
  schemaVersion: CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_V3_VERSION,
  initialArtifactRefs: mountWorkInput.initialArtifactRefs.map((artifact) =>
    artifact.artifactType === 'canonical_transcript'
      ? {
          ...planningExpectationRef,
          artifactType: 'canonical_transcript_planning_expectation' as const,
          producerSkillKey: 'canonical_transcript' as const,
          privateArtifact: true as const,
          byteFreeRef: true as const,
          sourceSupportRequestRef: null,
        }
      : artifact),
  assignmentIntentRef: {
    id: 'caption.assignment.transcript.expectation.1',
    version: 'canonical-caption-specialist-job-assignment-v1',
    contentHash: sha256AuthorityValue('caption-assignment-transcript-1'),
  },
  assignmentTrigger: 'approved_early_plan',
  sourceSupportRequestRef: null,
  selectionEvidenceRef: {
    id: 'caption.selection.transcript.expectation.1',
    version: 'professional-skill-composition-trace-v1',
    contentHash: sha256AuthorityValue('caption-selection-transcript-1'),
  },
} as const
const expectationMountAuthority = {
  ...mountAuthority,
  jobs: [{ id: 'job.caption.transcript.expectation.1', approvedWorkItemId:
    'work.caption.transcript.expectation.1' }],
  workItems: [{
    id: 'work.caption.transcript.expectation.1',
    executionInput: expectationMountWorkInput,
  }],
} as unknown as Parameters<
  typeof resolveCanonicalCaptionTranscriptExecutionMount
>[0]['authority']
assert.throws(() => parseCanonicalCaptionSpecialistWorkItemInput({
  ...expectationMountWorkInput,
  initialArtifactRefs: [
    ...expectationMountWorkInput.initialArtifactRefs,
    {
      id: expectationProjection.transcriptRecord.authenticatedReadBinding
        .bindingId,
      version: expectationProjection.transcriptRecord.authenticatedReadBinding
        .schemaVersion,
      contentHash: expectationProjection.transcriptRecord
        .authenticatedReadBinding.bindingDigestSha256,
      artifactType: 'canonical_transcript_authenticated_read_binding',
      producerSkillKey: 'canonical_transcript',
      privateArtifact: true,
      byteFreeRef: true,
      sourceSupportRequestRef: null,
    },
  ],
}), /initial evidence/u)
checks += 1
assert.throws(() => parseCanonicalCaptionSpecialistWorkItemInput({
  ...expectationMountWorkInput,
  initialArtifactRefs: expectationMountWorkInput.initialArtifactRefs.map(
    (artifact) => artifact.artifactType ===
      'canonical_transcript_planning_expectation'
      ? {
          ...expectationProjection.transcriptRecord.authenticatedReadBinding
            .canonicalTranscriptRef,
          artifactType: 'canonical_transcript',
          producerSkillKey: 'canonical_transcript',
          privateArtifact: true,
          byteFreeRef: true,
          sourceSupportRequestRef: null,
        }
      : artifact,
  ),
}), /initial evidence/u)
checks += 1
const expectationExecutionMount =
  await resolveCanonicalCaptionTranscriptExecutionMount({
    authority: expectationMountAuthority,
    jobId: 'job.caption.transcript.expectation.1',
    transcriptRepository: repository,
  })
const expectationMountBindingRef =
  expectationExecutionMount.planningExpectationBindingRef
check(expectationExecutionMount.transcriptRef.contentHash ===
  record.canonicalTranscript.transcriptDigestSha256
  && expectationMountBindingRef?.contentHash ===
    expectationProjection.expectationBinding.bindingDigestSha256,
  'The runner must resolve V3 expectation work to the exact transcript and immutable mapping.')

const ownerProjectionRepository =
  createCanonicalCaptionTranscriptEvidenceRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/caption-transcript-support/owner-projection',
  })
let ownerProjectionReadCount = 0
const ownerProjectionReadPort =
  createCanonicalCaptionTranscriptPlanningExpectationOwnerReadPort(
    async ({ canonicalReadScope, planningExpectationRef: requestedRef }) => {
      ownerProjectionReadCount += 1
      return stableAuthorityStringify(canonicalReadScope) ===
        stableAuthorityStringify(approvedScope)
        && stableAuthorityStringify(requestedRef) ===
          stableAuthorityStringify(planningExpectationRef)
        ? structuredClone(expectationProjection)
        : null
    },
  )
const ownerProjectionMount =
  await resolveCanonicalCaptionTranscriptExecutionMount({
    authority: expectationMountAuthority,
    jobId: 'job.caption.transcript.expectation.1',
    transcriptRepository: ownerProjectionRepository,
    planningExpectationOwnerReadPort: ownerProjectionReadPort,
  })
check(ownerProjectionReadCount === 2
  && ownerProjectionMount.recordDigestSha256 === record.recordDigestSha256
  && ownerProjectionMount.planningExpectationBindingRef?.contentHash ===
    expectationProjection.expectationBinding.bindingDigestSha256,
  'The runner must double-reread and mount an exact canonical owner projection.')
const ownerProjectionPersistence =
  await ownerProjectionRepository.findExactForPlanningExpectation({
    canonicalReadScope: approvedScope,
    planningExpectationRef,
  })
check(ownerProjectionPersistence?.transcriptRecord.recordDigestSha256 ===
  record.recordDigestSha256
  && ownerProjectionPersistence.binding.bindingDigestSha256 ===
    expectationProjection.expectationBinding.bindingDigestSha256,
  'The owner projection must persist create-only and reread exactly before use.')

await assert.rejects(
  () => resolveCanonicalCaptionTranscriptExecutionMount({
    authority: expectationMountAuthority,
    jobId: 'job.caption.transcript.expectation.1',
    transcriptRepository: createCanonicalCaptionTranscriptEvidenceRepository({
      objectPort: memoryObjectPort(new Map()),
      prefix: 'private/smoke/caption-transcript-support/unadmitted-owner',
    }),
    planningExpectationOwnerReadPort: {
      ...ownerProjectionReadPort,
    },
  }),
  /owner reader is invalid/u,
)
checks += 1

let unstableOwnerReadCount = 0
const unstableOwnerReadPort =
  createCanonicalCaptionTranscriptPlanningExpectationOwnerReadPort(
    async () => {
      unstableOwnerReadCount += 1
      return unstableOwnerReadCount === 1
        ? structuredClone(expectationProjection)
        : null
    },
  )
await assert.rejects(
  () => resolveCanonicalCaptionTranscriptExecutionMount({
    authority: expectationMountAuthority,
    jobId: 'job.caption.transcript.expectation.1',
    transcriptRepository: createCanonicalCaptionTranscriptEvidenceRepository({
      objectPort: memoryObjectPort(new Map()),
      prefix: 'private/smoke/caption-transcript-support/unstable-owner',
    }),
    planningExpectationOwnerReadPort: unstableOwnerReadPort,
  }),
  /owner reread is not stable/u,
)
checks += 1

const crossedPlanningExpectationRef = {
  ...planningExpectationRef,
  contentHash: sha256AuthorityValue('crossed-owner-expectation'),
}
const crossedOwnerAuthority = {
  ...expectationMountAuthority,
  workItems: [{
    id: 'work.caption.transcript.expectation.1',
    executionInput: {
      ...expectationMountWorkInput,
      initialArtifactRefs:
        expectationMountWorkInput.initialArtifactRefs.map((artifact) =>
          artifact.artifactType ===
            'canonical_transcript_planning_expectation'
            ? { ...artifact, ...crossedPlanningExpectationRef }
            : artifact),
    },
  }],
} as unknown as Parameters<
  typeof resolveCanonicalCaptionTranscriptExecutionMount
>[0]['authority']
await assert.rejects(
  () => resolveCanonicalCaptionTranscriptExecutionMount({
    authority: crossedOwnerAuthority,
    jobId: 'job.caption.transcript.expectation.1',
    transcriptRepository: createCanonicalCaptionTranscriptEvidenceRepository({
      objectPort: memoryObjectPort(new Map()),
      prefix: 'private/smoke/caption-transcript-support/crossed-owner',
    }),
    planningExpectationOwnerReadPort:
      createCanonicalCaptionTranscriptPlanningExpectationOwnerReadPort(
        async () => structuredClone(expectationProjection),
      ),
  }),
  /owner projection lineage is crossed/u,
)
checks += 1

const v3ExecutionInputRef = {
  sha256: sha256AuthorityValue(expectationMountWorkInput),
  byteLength: Buffer.byteLength(JSON.stringify(expectationMountWorkInput)),
}
const v3ExpectedOutput = {
  outputKey: 'caption-plan-receipt',
  artifactType: 'caption_specialist_job_receipt',
  assetRole: 'qa' as const,
  required: true,
  previewPlaceholderAllowed: false,
  contentType: 'application/json',
  segmentIds: [] as string[],
  timingIds: ['timing.caption.transcript.1'],
  rendererLayerIds: [] as string[],
}
const v3WorkItem = {
  id: 'approved-caption-expectation-work-1',
  snapshotId: approvedScope.approvedSnapshotRef.id,
  sourceWorkItemId: 'caption-expectation-source-work-1',
  workItemKey: 'caption-expectation-plan-strategy',
  workItemType: 'custom',
  workerClass: CANONICAL_CAPTION_SPECIALIST_WORKER_CLASS,
  executionInputRef: v3ExecutionInputRef,
  sourceSequenceItemIds: [sourceScope.sourceSequenceItemId],
  sourceCleanupDecisionIds: ['caption-source-cleanup-decision-1'],
  expectedOutputs: [v3ExpectedOutput],
  dependencyKeys: [],
  approvedToolIds: [] as string[],
  providerExecutionMode: 'none' as const,
  fallbackPolicyRef: {
    sha256: sha256AuthorityValue({ fallback: 'fail_closed' }),
    byteLength: 24,
  },
  maxAttempts: 1,
  attemptTimeoutSeconds: 60,
  scheduledDelaySeconds: 0,
  maximumCreditBudget: 0,
  required: true,
  executionInputHash: v3ExecutionInputRef.sha256,
  createdAt: '2026-08-05T18:00:00.000Z',
  executionInput: expectationMountWorkInput,
  fallbackPolicy: { fallback: 'fail_closed' },
}
const v3Job = {
  id: 'caption-expectation-job-1',
  snapshotId: v3WorkItem.snapshotId,
  reservationId: 'caption-expectation-reservation-1',
  approvedWorkItemId: v3WorkItem.id,
  workItemKey: v3WorkItem.workItemKey,
  jobType: v3WorkItem.workItemType,
  workerClass: v3WorkItem.workerClass,
  executionInputRef: v3ExecutionInputRef,
  sourceSequenceItemIds: [sourceScope.sourceSequenceItemId],
  sourceCleanupDecisionIds: ['caption-source-cleanup-decision-1'],
  expectedAssetIds: ['caption-expectation-manifest-entry-1'],
  dependencyJobIds: [] as string[],
  status: 'ready' as const,
  maxAttempts: 1,
  attemptTimeoutSeconds: 60,
  scheduledFor: '2026-08-05T18:00:00.000Z',
  createdAt: '2026-08-05T18:00:00.000Z',
}
const v3ManifestEntry = {
  id: 'caption-expectation-manifest-entry-1',
  snapshotId: v3WorkItem.snapshotId,
  approvedWorkItemId: v3WorkItem.id,
  workItemKey: v3WorkItem.workItemKey,
  ...v3ExpectedOutput,
  status: 'planned' as const,
  version: 1 as const,
  createdAt: '2026-08-05T18:00:00.000Z',
}
const v3ComponentRefs = {
  masterTimingPlan: {
    sha256: sha256AuthorityValue('timing-caption-transcript-1'),
    byteLength: 64,
  },
}
const v3SnapshotWithoutHash = {
  schemaVersion: 'private-edit-authority-approved-snapshot-v3' as const,
  snapshotId: approvedScope.approvedSnapshotRef.id,
  workspaceId: approvedScope.workspaceId,
  projectId: approvedScope.projectId,
  editSessionId: approvedScope.editSessionId,
  planId: 'plan.caption.transcript.1',
  planVersion: 1,
  estimateId: 'caption-expectation-estimate-1',
  approvalId: 'caption-expectation-approval-1',
  reservationId: v3Job.reservationId,
  approvedByUserId: approvedScope.ownerUserId,
  approvedAt: '2026-08-05T18:00:00.000Z',
  componentRefs: v3ComponentRefs,
  approvedWorkItemIds: [v3WorkItem.id],
  planHash: sha256AuthorityValue('caption-expectation-plan'),
  estimateHash: sha256AuthorityValue('caption-expectation-estimate'),
  workGraphHash: sha256AuthorityValue('caption-expectation-work-graph'),
  sourceSequenceHash: sha256AuthorityValue('caption-expectation-source'),
  timingHash: sha256AuthorityValue('caption-expectation-timing'),
  approvedAssetManifestRef: {
    sha256: sha256AuthorityValue('caption-expectation-manifest-ref'),
    byteLength: 512,
  },
  approvedAssetManifestHash:
    sha256AuthorityValue('caption-expectation-manifest'),
  approvedSourceAssetManifestRef: {
    sha256: sha256AuthorityValue('caption-expectation-source-manifest-ref'),
    byteLength: 512,
  },
  approvedSourceAssetManifestHash:
    sha256AuthorityValue('caption-expectation-source-manifest'),
}
const v3Snapshot = {
  ...v3SnapshotWithoutHash,
  snapshotHash: approvedScope.approvedSnapshotRef.contentHash,
}
const v3Authority = {
  authorityRevision: 1,
  snapshot: v3Snapshot,
  estimate: {
    id: v3Snapshot.estimateId,
    planId: v3Snapshot.planId,
    estimateVersion: 1,
    status: 'approved' as const,
    lineItems: [],
    estimatedCredits: 1,
    fallbackAllowanceCredits: 0,
    approvedMaximumCredits: 1,
    estimateHash: v3Snapshot.estimateHash,
    validUntil: '2026-08-06T18:00:00.000Z',
    createdAt: v3Snapshot.approvedAt,
    approvedAt: v3Snapshot.approvedAt,
  },
  reservation: {
    id: v3Snapshot.reservationId,
    approvalId: v3Snapshot.approvalId,
    snapshotId: v3Snapshot.snapshotId,
    estimateId: v3Snapshot.estimateId,
    planId: v3Snapshot.planId,
    projectId: v3Snapshot.projectId,
    editSessionId: v3Snapshot.editSessionId,
    status: 'reserved' as const,
    reservedCredits: 1,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservedAt: v3Snapshot.approvedAt,
    expiresAt: '2026-08-06T18:00:00.000Z',
    updatedAt: v3Snapshot.approvedAt,
  },
  workItems: [v3WorkItem],
  jobs: [v3Job],
  assetManifest: {
    schemaVersion: 'private-edit-asset-manifest-v1',
    snapshotId: v3Snapshot.snapshotId,
    planId: v3Snapshot.planId,
    planHash: v3Snapshot.planHash,
    workGraphHash: v3Snapshot.workGraphHash,
    entries: [v3ManifestEntry],
    requiredAssetCount: 1,
    optionalAssetCount: 0,
    manifestHash: v3Snapshot.approvedAssetManifestHash,
  },
} as unknown as CanonicalApprovedExecutionAuthority
const v3ExecutionPackage = {
  schemaVersion: 'canonical-approved-edit-execution-package-v5',
  packageRecordId: 'caption-expectation-execution-package-1',
  packageHash: sha256AuthorityValue('caption-expectation-package'),
  workspaceId: v3Snapshot.workspaceId,
  projectId: v3Snapshot.projectId,
  editSessionId: v3Snapshot.editSessionId,
  approvedPlanSnapshotId: v3Snapshot.snapshotId,
  snapshotHash: v3Snapshot.snapshotHash,
  planHash: v3Snapshot.planHash,
  estimateHash: v3Snapshot.estimateHash,
  workGraphHash: v3Snapshot.workGraphHash,
  timingHash: v3Snapshot.timingHash,
  approvedAssetManifestHash: v3Snapshot.approvedAssetManifestHash,
  componentRefs: v3ComponentRefs,
  approvedWorkItems: [{
    id: v3WorkItem.id,
    workItemKey: v3WorkItem.workItemKey,
    executionInputHash: v3WorkItem.executionInputHash,
  }],
  jobs: [{
    id: v3Job.id,
    approvedWorkItemId: v3Job.approvedWorkItemId,
    executionInputRef: v3Job.executionInputRef,
    dispatchState: 'not_authorized',
  }],
} as unknown as CanonicalApprovedEditExecutionPackage
const v3SpecialistRepository =
  createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/caption-transcript-support/specialist-v3',
  })
const v3Execution = await executeCanonicalCaptionSpecialistWorkItem({
  authority: v3Authority,
  executionPackage: v3ExecutionPackage,
  jobId: v3Job.id,
  repository: v3SpecialistRepository,
  canonicalTranscriptReadPort: repository,
  canonicalTranscriptRef: expectationExecutionMount.transcriptRef,
  canonicalTranscriptAuthenticatedReadBindingRef:
    expectationExecutionMount.bindingRef,
  canonicalTranscriptPlanningExpectationBindingRef:
    expectationMountBindingRef,
  now: () => new Date('2026-08-05T18:01:00.000Z'),
})
check(v3Execution.pair.result.disposition === 'completed'
  && v3Execution.pair.call.inputArtifactRefs.some((artifact) =>
    artifact.artifactType ===
      'canonical_transcript_planning_expectation_binding'
    && artifact.contentHash === expectationMountBindingRef?.contentHash)
  && v3Execution.pair.call.inputArtifactRefs.every((artifact) =>
    artifact.artifactType !== 'canonical_transcript_planning_expectation'),
  'Approved V3 work must execute only after the exact expectation is replaced by authenticated transcript lineage.')
await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: v3Authority,
  executionPackage: v3ExecutionPackage,
  jobId: v3Job.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/caption-transcript-support/forged-v3-mapping',
  }),
  canonicalTranscriptReadPort: repository,
  canonicalTranscriptRef: expectationExecutionMount.transcriptRef,
  canonicalTranscriptAuthenticatedReadBindingRef:
    expectationExecutionMount.bindingRef,
  canonicalTranscriptPlanningExpectationBindingRef: {
    ...expectationMountBindingRef!,
    contentHash: sha256AuthorityValue('forged-expectation-binding'),
  },
}), /expectation mapping crossed approved authority/u)
checks += 1
await assert.rejects(() => executeCanonicalCaptionSpecialistWorkItem({
  authority: v3Authority,
  executionPackage: v3ExecutionPackage,
  jobId: v3Job.id,
  repository: createCanonicalSpecialistSupportResumeRepository({
    objectPort: memoryObjectPort(new Map()),
    prefix: 'private/smoke/caption-transcript-support/missing-v3-resolution',
  }),
}), /requires an exact postapproval transcript resolution/u)
checks += 1
await assert.rejects(
  () => resolveCanonicalCaptionTranscriptExecutionMount({
    authority: {
      ...mountAuthority,
      snapshot: {
        ...mountAuthority.snapshot,
        snapshotHash: sha256AuthorityValue('crossed-approved-snapshot'),
      },
    },
    jobId: 'job.caption.transcript.1',
    transcriptRepository: repository,
  }),
  /exact postapproval transcript projection/u,
)
checks += 1

const replay = await service.projectAuthenticatedTranscript({
  canonicalReadScope: approvedScope,
  sourceScopes: [sourceScope],
})
check(replay.recordDigestSha256 === record.recordDigestSha256,
  'An exact projection replay must preserve the create-only record.')

const tamperedReader = createCanonicalCaptionSourceWordTimingReadPort(
  async () => createCanonicalCaptionSourceWordTimingEvidence({
    ...wordEvidence,
    evidenceId: 'caption.word-timing.crossed.1',
    sourceSequenceItemId: 'source.caption.crossed.1',
  }),
)
const tamperedService = createCanonicalCaptionTranscriptSupportService({
  approvedSnapshotReadPort: createCanonicalCaptionApprovedSnapshotReadPort(
    async (scope) => structuredClone(scope)),
  sourceTranscriptReadPort: {
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
    async readCompleted() { return structuredClone(transcriptResult) },
  },
  wordTimingReadPort: tamperedReader,
  repository,
})
await assert.rejects(() => tamperedService.projectAuthenticatedTranscript({
  canonicalReadScope: approvedScope,
  sourceScopes: [sourceScope],
}), /crossed source authority/u)
checks += 1

const staleSnapshotService = createCanonicalCaptionTranscriptSupportService({
  approvedSnapshotReadPort: createCanonicalCaptionApprovedSnapshotReadPort(
    async () => null),
  sourceTranscriptReadPort: {
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
    async readCompleted() { return structuredClone(transcriptResult) },
  },
  wordTimingReadPort: createCanonicalCaptionSourceWordTimingReadPort(
    async () => structuredClone(wordEvidence)),
  repository,
})
await assert.rejects(() => staleSnapshotService.projectAuthenticatedTranscript({
  canonicalReadScope: approvedScope,
  sourceScopes: [sourceScope],
}), /approved snapshot reread failed/u)
checks += 1

assert.throws(() => createCanonicalCaptionSourceWordTimingEvidence({
  ...wordEvidence,
  evidenceId: 'caption.word-timing.overlap.1',
  segments: [{
    ...wordEvidence.segments[0]!,
    words: wordEvidence.segments[0]!.words.map((word, index) =>
      index === 1 ? { ...word, startMilliseconds: 100 } : word),
  }],
}), /word timing is invalid/u)
checks += 1

console.log(JSON.stringify({
  smoke: 'canonical-caption-transcript-support-service',
  status: 'passed',
  checks,
  wordCount: record.canonicalTranscript.words.length,
  transcriptDigestSha256:
    record.canonicalTranscript.transcriptDigestSha256,
  bindingDigestSha256:
    record.authenticatedReadBinding.bindingDigestSha256,
  recordDigestSha256: record.recordDigestSha256,
  speakerDiarizationState:
    record.authenticatedReadBinding.speakerDiarizationState,
  providerCallPerformedByBridge: false,
  transcriptRuntimePerformedByBridge: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))

function memoryObjectPort(
  values: Map<string, Buffer>,
): CanonicalCreateOnlyJsonObjectPort {
  return {
    async createOnly(input) {
      assert.equal(
        createHash('sha256').update(input.body).digest('hex'),
        input.contentSha256,
      )
      const prior = values.get(input.objectPath)
      if (prior) {
        if (!prior.equals(input.body)) throw new Error('create-only collision')
        return 'already_exists'
      }
      values.set(input.objectPath, Buffer.from(input.body))
      return 'created'
    },
    async readExact(path) {
      const value = values.get(path)
      return value ? Buffer.from(value) : null
    },
  }
}
