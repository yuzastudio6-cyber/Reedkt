import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_INPUT_VERSION,
  CANONICAL_CAPTION_SPECIALIST_WORK_ITEM_OPERATION,
} from '../../src/types/canonical-caption-specialist-execution'

import {
  CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_CURRENT_VERSION,
  CANONICAL_CAPTION_TRANSCRIPT_EVIDENCE_REPOSITORY_VERSION,
  createCanonicalCaptionApprovedSnapshotReadPort,
  createCanonicalCaptionSourceWordTimingEvidence,
  createCanonicalCaptionSourceWordTimingReadPort,
  createCanonicalCaptionTranscriptEvidenceRepository,
  createCanonicalCaptionTranscriptSupportService,
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
  'The frozen V1 repository identity must remain stable while the scope index uses V2.')
const service = createCanonicalCaptionTranscriptSupportService({
  approvedSnapshotReadPort: createCanonicalCaptionApprovedSnapshotReadPort(
    async (scope) => structuredClone(scope)),
  sourceTranscriptReadPort: {
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
    async readCompleted(scope) {
      return stableAuthorityStringify(scope) ===
        stableAuthorityStringify(sourceScope)
        ? structuredClone(transcriptResult) : null
    },
  },
  wordTimingReadPort: createCanonicalCaptionSourceWordTimingReadPort(
    async ({ scope, transcriptAuthorityRef }) =>
      stableAuthorityStringify(scope) === stableAuthorityStringify(sourceScope)
      && stableAuthorityStringify(transcriptAuthorityRef) ===
        stableAuthorityStringify(transcriptResult.transcriptAuthorityRef)
        ? structuredClone(wordEvidence) : null),
  repository,
  now: () => new Date('2026-08-05T18:00:00.000Z'),
})

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
