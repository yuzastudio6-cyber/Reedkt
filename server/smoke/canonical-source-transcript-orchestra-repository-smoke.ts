import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import {
  createCanonicalQualityFirstUserTriggeredGpuPolicy,
} from '../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalSourceLedSourceFrameAuthority,
} from '../services/canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceTranscriptOrchestraReadScope,
} from '../services/canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalSourceLedProfessionalContentAnalysisSource,
} from '../services/canonical-source-led-professional-content-analysis-port'
import {
  createCanonicalSourceTranscriptOrchestraRepository,
} from '../services/canonical-source-transcript-orchestra-repository'
import type {
  CanonicalVisualIntelligenceSourceTranscriptResult,
} from '../services/canonical-source-visual-intelligence-analysis-contract'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const rawSha = (value: string | Buffer) => createHash('sha256')
  .update(value).digest('hex')
const ref = (
  id: string,
  value: unknown = { id },
): VisualIntelligenceEvidenceRef => Object.freeze({
  id,
  version: 1,
  contentHash: `sha256:${sha256AuthorityValue(value)}`,
})

class MemoryObjectPort implements CanonicalCreateOnlyJsonObjectPort {
  readonly objects = new Map<string, Buffer>()

  async createOnly(input: {
    readonly objectPath: string
    readonly body: Buffer
    readonly contentSha256: string
  }): Promise<'created' | 'already_exists'> {
    assert.equal(rawSha(input.body), input.contentSha256)
    if (this.objects.has(input.objectPath)) return 'already_exists'
    this.objects.set(input.objectPath, Buffer.from(input.body))
    return 'created'
  }

  async readExact(objectPath: string): Promise<Buffer | null> {
    const body = this.objects.get(objectPath)
    return body ? Buffer.from(body) : null
  }
}

const finalizedMediaAuthorityRef = ref('finalized-media-authority')
const sourceProbeAuthorityRef = ref('source-probe-authority')
const frameAuthority = createCanonicalSourceLedSourceFrameAuthority({
  fpsNumerator: 24,
  fpsDenominator: 1,
  frameCount: 11_520,
  timeBaseNumerator: 1,
  timeBaseDenominator: 12_288,
})
const source: CanonicalSourceLedProfessionalContentAnalysisSource = {
  sourceSequenceItemId: 'source-item-1',
  mediaAssetId: 'media-asset-1',
  uploadedOrder: 1,
  storageProvider: 'google_cloud_storage',
  storageBucket: 'reeditpro-private-source-media',
  storagePath: 'workspaces/workspace-1/source/video.mp4',
  checksumSha256: rawSha('exact-source-video'),
  byteLength: 48_000_000,
  durationFrames: 11_520,
  managedApiAuthority: {
    ownerUserId: 'user-1',
    storageBucket: 'reeditpro-private-source-media',
    storagePath: 'workspaces/workspace-1/source/video.mp4',
    contentType: 'video/mp4',
    storageGeneration: '101',
    storageEtag: 'source-etag-101',
    width: 1920,
    height: 1080,
    hasAudio: true,
    audioProbe: {
      disposition: 'verified_audio_stream',
      videoStreamIndex: 0,
      videoStartTimeBaseUnits: 0,
      videoTimeBaseNumerator: 1,
      videoTimeBaseDenominator: 12_288,
      audioStreamIndex: 1,
      audioStartTimeBaseUnits: 0,
      audioDurationTimeBaseUnits: 23_040_000,
      audioTimeBaseNumerator: 1,
      audioTimeBaseDenominator: 48_000,
      audioSampleRateHertz: 48_000,
      audioChannelCount: 2,
    },
    fpsNumerator: 24,
    fpsDenominator: 1,
    frameCount: 11_520,
    sourceTimeBaseNumerator: 1,
    sourceTimeBaseDenominator: 12_288,
    finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef: ref('finalized-storage-authority'),
    sourceBindingManifestCandidateRef: ref('source-binding-manifest'),
    sourceProbeAuthorityRef,
    providerMediaReadAuthorityRef: ref('provider-media-read-authority'),
    sourceAnalysisConsentRef: ref('source-analysis-consent'),
    platformAnalysisCostCapRef: ref('platform-analysis-cost-cap'),
  },
}
const scope: CanonicalSourceTranscriptOrchestraReadScope = Object.freeze({
  ownerUserId: 'user-1',
  workspaceId: 'workspace-1',
  projectId: 'project-1',
  editSessionId: 'edit-session-1',
  analysisRunId: 'source-analysis-run-1',
  sourceSequenceItemId: source.sourceSequenceItemId,
  mediaAssetId: source.mediaAssetId,
  uploadedOrder: source.uploadedOrder,
  checksumSha256: source.checksumSha256,
  byteLength: source.byteLength,
  durationFrames: source.durationFrames,
  sourceFrameAuthority: frameAuthority,
  finalizedMediaAuthorityRef,
  sourceProbeAuthorityRef,
})

const segments = [{
  segmentId: 'segment-1',
  startFrame: 0,
  endFrameExclusive: 11_520,
  text: 'Keep the useful explanation and remove the failed take before it.',
  confidenceBasisPoints: 9_700,
  wordsVerified: true,
}]
const coveragePayload = {
  schemaVersion: 'canonical-source-audio-complete-timeline-coverage-v1' as const,
  coveredStartFrame: 0 as const,
  coveredEndFrameExclusive: source.durationFrames,
  completeAudioTimelineProcessed: true as const,
  speechSegmentsMayOmitSilence: true as const,
  embeddedInstructionDetectionRequired: true as const,
}
const transcriptDigest = sha256AuthorityValue(segments)
const policy = createCanonicalQualityFirstUserTriggeredGpuPolicy()
const result: CanonicalVisualIntelligenceSourceTranscriptResult = {
  schemaVersion: 'canonical-visual-intelligence-source-transcript-result-v1',
  transcriptAuthorityRef: Object.freeze({
    id: 'source-transcript-authority',
    version: 1,
    contentHash: `sha256:${transcriptDigest}`,
  }),
  transcript: {
    status: 'completed',
    modelId: 'faster-whisper-large-v3',
    modelDigestSha256: rawSha('faster-whisper-large-v3-model'),
    runtimeVersion: 'faster-whisper-1.2.1',
    transcriptDigestSha256: transcriptDigest,
    segments,
    coverage: {
      ...coveragePayload,
      coverageDigestSha256: sha256AuthorityValue(coveragePayload),
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
    primaryAttemptReceiptRef: ref('a100-primary-attempt'),
    completedAttemptReceiptRef: ref('a100-primary-attempt'),
    completedRuntimeReleaseRef: ref('a100-transcript-runtime-release'),
    fallbackAdmissionRef: null,
    attemptCostEvidenceRefs: [ref('a100-transcript-terminal-cost')],
    routePolicyDigestSha256: `sha256:${policy.policyHash}`,
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

const objectPort = new MemoryObjectPort()
const repository = createCanonicalSourceTranscriptOrchestraRepository({
  objectPort,
  prefix: 'private/smoke/source-transcripts',
})
assert.equal(await repository.readCompleted(scope), null)

const created = await repository.persistCreateOnly({ scope, source, result })
assert.equal(created.disposition, 'created')
assert.deepEqual(created.transcriptAuthorityRef, result.transcriptAuthorityRef)
assert.equal(created.exactCreateOnlyRereadVerified, true)
assert.equal(created.gpuJobStarted, false)
assert.equal(created.customerCreditMutated, false)
assert.equal(objectPort.objects.size, 1)
assert.deepEqual(await repository.readCompleted(scope), result)

const replay = await repository.persistCreateOnly({ scope, source, result })
assert.equal(replay.disposition, 'identical_replay')
assert.equal(objectPort.objects.size, 1)

await assert.rejects(repository.persistCreateOnly({
  scope,
  source,
  result: {
    ...result,
    execution: {
      ...result.execution,
      completedRuntimeReleaseRef: null,
    },
  },
}))
await assert.rejects(repository.persistCreateOnly({
  scope,
  source,
  result: {
    ...result,
    transcript: {
      ...result.transcript,
      modelId: 'faster-whisper-small',
    },
  },
}))
await assert.rejects(repository.persistCreateOnly({
  scope: { ...scope, byteLength: scope.byteLength + 1 },
  source,
  result,
}))
await assert.rejects(repository.persistCreateOnly({
  scope,
  source,
  result: {
    ...result,
    execution: {
      ...result.execution,
      completedRuntimeReleaseRef: ref('different-a100-runtime-release'),
    },
  },
}))
await assert.rejects(repository.persistCreateOnly({
  scope,
  source,
  result: {
    ...result,
    callerSelectedPath: '/tmp/transcript.json',
  } as unknown as CanonicalVisualIntelligenceSourceTranscriptResult,
}))

let getterInvoked = false
const hostile = Object.defineProperty({}, 'schemaVersion', {
  enumerable: true,
  get() {
    getterInvoked = true
    throw new Error('getter must not run')
  },
})
await assert.rejects(repository.persistCreateOnly({
  scope,
  source,
  result: hostile as CanonicalVisualIntelligenceSourceTranscriptResult,
}))
assert.equal(getterInvoked, false)

const storedPath = [...objectPort.objects.keys()][0]!
const stored = JSON.parse(
  objectPort.objects.get(storedPath)!.toString('utf8'),
) as Record<string, unknown>
const tampered = structuredClone(stored) as {
  result: CanonicalVisualIntelligenceSourceTranscriptResult
}
tampered.result.transcript.segments[0]!.text = 'Tampered transcript text.'
objectPort.objects.set(storedPath, Buffer.from(JSON.stringify(tampered)))
await assert.rejects(repository.readCompleted(scope))

console.log(JSON.stringify({
  qualification: 'canonical-source-transcript-orchestra-repository-v1',
  exactA100TranscriptPersistedAndReread: true,
  completedRuntimeReleaseRequired: true,
  fasterWhisperLargeV3RequiredForAudio: true,
  completeAudioTimelineRequired: true,
  staleSourceScopeRejected: true,
  conflictingReplayRejected: true,
  unknownAndAccessorFieldsRejected: true,
  transcriptTamperingRejected: true,
  repositoryMayDispatchGpuJob: false,
  customerCreditsMutated: false,
  liveGpuJobStarted: false,
  publicDeliveryGranted: false,
  productionAuthorityGranted: false,
}, null, 2))
