import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'

import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import {
  CAPTION_CANONICAL_TRANSCRIPT_VERSION,
} from '../../src/types/caption-transcript-lineage'
import {
  createCaptionPrivateInternalCanonicalTranscript,
  createCaptionPrivateInternalPhraseProjection,
  createCaptionPrivateLocalAlignmentQualification,
  createCaptionPrivateLocalTranscriptExecutionEvidence,
  createCaptionPrivateTranscriptInspectionReceipt,
  createCaptionPrivateTranscriptRuntimeQualification,
  parseCaptionPrivateLocalTranscriptExecutionEvidence,
  parseCaptionPrivateTranscriptInspectionReceipt,
  parseCaptionPrivateTranscriptRuntimeQualification,
} from '../captions-specialist/caption-private-transcript-runtime'
import {
  parseCaptionCanonicalTranscript,
} from '../captions-specialist/caption-transcript-lineage'
import {
  validateEditReferenceReviewedLocalFasterWhisperRuntime,
} from '../edit-references/edit-reference-reviewed-local-faster-whisper-runtime'
import { probeMediaFile } from '../media/ffprobe'
import { calculateSkillContractDigest } from
  '../orchestra/orchestra-skill-contracts'
import { createCanonicalPrivateLocalJsonObjectPort } from
  '../services/canonical-private-local-json-object-port'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { runSpeechCaptionExecutionPipeline } from
  '../workers/speech-caption'

const sourcePath = requiredAbsolutePath(
  'REEDITPRO_CAPTION_TRANSCRIPT_PRIVATE_SOURCE_PATH')
const evidenceRoot = requiredAbsolutePath(
  'REEDITPRO_CAPTION_TRANSCRIPT_PRIVATE_EVIDENCE_ROOT')
const manifestPath = requiredAbsolutePath(
  'REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_MANIFEST_PATH')
const localModelPath = requiredAbsolutePath(
  'REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH')
const pythonCommand = requiredAbsolutePath(
  'REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND')
const observedAt = requiredValue(
  'REEDITPRO_CAPTION_TRANSCRIPT_OBSERVED_AT')
const inspectionAttestation =
  process.env.REEDITPRO_CAPTION_TRANSCRIPT_INSPECTION_ATTESTATION?.trim() ?? ''
const inspectedPrivatePayloadSha256 =
  process.env.REEDITPRO_CAPTION_TRANSCRIPT_INSPECTED_PRIVATE_PAYLOAD_SHA256
    ?.trim() ?? ''
const independentAudioTruthReviewSha256 =
  process.env.REEDITPRO_CAPTION_TRANSCRIPT_INDEPENDENT_AUDIO_TRUTH_REVIEW_SHA256
    ?.trim() ?? ''

assert.equal(extname(sourcePath).toLowerCase(), '.mp4',
  'Caption transcript private source must be an MP4.')
assert.match(observedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u)

const sourceStat = await stat(sourcePath)
assert.equal(sourceStat.isFile(), true)
assert.ok(sourceStat.size > 0)
const sourceSha256 = await hashFile(sourcePath)
const sourceMediaRef = ref(
  `caption.private.source.${sourceSha256.slice(0, 24)}`,
  'private-source-media-sha256-v1', sourceSha256)
const sourceProbe = await probeMediaFile(sourcePath, { timeoutMs: 30_000 })
assert.ok(sourceProbe.durationSeconds && sourceProbe.durationSeconds > 1)
assert.ok(sourceProbe.width && sourceProbe.height)
assert.ok(sourceProbe.audioCodec)
const sourceProbeSafe = {
  durationMilliseconds: Math.round(sourceProbe.durationSeconds * 1_000),
  width: sourceProbe.width,
  height: sourceProbe.height,
  videoCodec: sourceProbe.videoCodec ?? 'unknown',
  audioCodec: sourceProbe.audioCodec,
  audioSampleRateHertz: sourceProbe.audioSampleRateHertz ?? null,
  audioChannelCount: sourceProbe.audioChannelCount ?? null,
  streamTypes: sourceProbe.rawSummary.streamTypes,
}
const sourceProbeRef = ref(
  `caption.private.source.probe.${sourceSha256.slice(0, 24)}`,
  'caption-private-source-probe-v1', sha256AuthorityValue(sourceProbeSafe))
const runtime = await validateEditReferenceReviewedLocalFasterWhisperRuntime({
  manifestPath,
  localModelPath,
  pythonCommand,
  timeoutMs: 30_000,
})
const reviewedRuntimeRef = ref(runtime.runtimeId, runtime.receiptVersion,
  sha256AuthorityValue(runtime))
const modelManifestRef = ref(
  `caption.private.model.${runtime.modelDirectorySha256.slice(0, 24)}`,
  runtime.manifestVersion, runtime.manifestDigestSha256)

process.env.HF_HUB_OFFLINE = '1'
process.env.HF_HUB_DISABLE_TELEMETRY = '1'
process.env.TRANSFORMERS_OFFLINE = '1'

const transientOutput = await mkdtemp(join(tmpdir(),
  'reeditpro-caption-private-transcript-'))
try {
  const speech = await runSpeechCaptionExecutionPipeline({
    mode: 'local_dev',
    workspaceId: 'workspace.caption.private.transcript',
    projectId: 'project.caption.private.transcript',
    mediaAssetId: `media.caption.private.${sourceSha256.slice(0, 20)}`,
    approvedSnapshotId: 'snapshot.caption.private.transcript.v1',
    toolExecutionPlanId: 'tool.caption.private.transcript.v1',
    idempotencyKey: `caption-private-transcript-${sourceSha256}`,
    sourceAudioArtifactId: `audio.caption.private.${sourceSha256.slice(0, 20)}`,
    sourceAudioLocalPath: sourcePath,
    outputDirectory: transientOutput,
    modelWeightManifestId: runtime.modelManifestId,
    modelName: runtime.modelName,
    modelVersion: runtime.modelVersion,
    localModelPath,
    language: 'en',
    device: 'cpu',
    computeType: 'int8',
    wordTimestamps: true,
    vadFilter: true,
    beamSize: 5,
    timeoutMs: 300_000,
    enableRealTranscription: true,
    allowModelDownload: false,
    pythonCommand,
    enableCaptionPreview: false,
    buildSpeech: true,
    buildCaptions: false,
  })
  assert.equal(speech.status, 'completed')
  assert.equal(speech.skippedReasons.length, 0)
  assert.equal(speech.modelWeightStatus, 'needs_review')
  assert.ok(speech.transcript)
  assert.ok(speech.wordTimestamps)
  assert.ok(speech.transcript.segments.length > 0)
  assert.ok(speech.wordTimestamps.words.length > 0)
  assert.equal(speech.qaResults.some((gate) => gate.blocking), false)
  assert.equal(speech.transcript.fullText.toLowerCase().includes('placeholder'),
    false)
  assert.equal(speech.transcript.fullText.toLowerCase().includes('software'),
    true)
  assert.equal(speech.transcript.fullText.toLowerCase().includes('customers'),
    true)

  const privateTranscriptPayload = sanitizePrivateTranscriptPayload({
    transcript: speech.transcript,
    runtime,
    sourceMediaRef,
  })
  const privateWordTimingPayload = sanitizePrivateWordTimingPayload({
    wordTimestamps: speech.wordTimestamps,
    runtime,
    sourceMediaRef,
  })
  const privateTranscriptBytes = canonicalBytes(privateTranscriptPayload)
  const privateWordTimingBytes = canonicalBytes(privateWordTimingPayload)
  const privateTranscriptArtifactRef = ref(
    `caption.private.transcript.payload.${sourceSha256.slice(0, 24)}`,
    'caption-private-transcript-payload-v1', sha256(privateTranscriptBytes))
  const privateWordTimingArtifactRef = ref(
    `caption.private.word-timing.payload.${sourceSha256.slice(0, 24)}`,
    'caption-private-word-timing-payload-v1', sha256(privateWordTimingBytes))
  const privateSpeechEvidenceRef = ref(
    `caption.private.speech.evidence.${sourceSha256.slice(0, 24)}`,
    'caption-private-independent-speech-worker-evidence-v1',
    sha256AuthorityValue({
      sourceMediaRef,
      reviewedRuntimeRef,
      privateTranscriptArtifactRef,
      privateWordTimingArtifactRef,
    }))
  const alignmentQualification =
    createCaptionPrivateLocalAlignmentQualification({
      qualificationId: 'caption.private.alignment.qualification.v1',
      reviewedRuntimeRef,
      wordTimingArtifactRef: privateWordTimingArtifactRef,
      observedAt,
    })
  const canonicalTranscript = createCaptionPrivateInternalCanonicalTranscript({
    transcriptId: `caption.private.canonical.${sourceSha256.slice(0, 24)}`,
    workspaceId: 'workspace.caption.private.transcript',
    projectId: 'project.caption.private.transcript',
    editSessionId: 'edit.caption.private.transcript',
    sourceSequenceItemId: 'source.caption.private.transcript.1',
    sourceSpeechEvidenceRef: privateSpeechEvidenceRef,
    wordTimingArtifactRef: privateWordTimingArtifactRef,
    timestampEvidenceRef: privateWordTimingArtifactRef,
    alignmentQualification,
    transcript: speech.transcript,
    wordTimestamps: speech.wordTimestamps,
  })
  const canonicalTranscriptRef = ref(canonicalTranscript.transcriptId,
    CAPTION_CANONICAL_TRANSCRIPT_VERSION,
    canonicalTranscript.transcriptDigestSha256)
  const confidences = canonicalTranscript.words.map(
    (word) => word.confidenceBasisPoints)
  const executionEvidence =
    createCaptionPrivateLocalTranscriptExecutionEvidence({
      evidenceId: `caption.private.transcript.execution.${
        sourceSha256.slice(0, 24)}`,
      sourceMediaRef,
      sourceProbeRef,
      sourceByteLength: sourceStat.size,
      sourceDurationMilliseconds: sourceProbeSafe.durationMilliseconds,
      sourceWidth: sourceProbeSafe.width,
      sourceHeight: sourceProbeSafe.height,
      sourceAudioStreamCount: sourceProbeSafe.streamTypes.filter(
        (type) => type === 'audio').length,
      reviewedRuntimeRef,
      modelManifestRef,
      privateTranscriptArtifactRef,
      privateWordTimingArtifactRef,
      canonicalTranscriptRef,
      alignmentQualificationRef: ref(
        alignmentQualification.qualificationId,
        alignmentQualification.schemaVersion,
        alignmentQualification.qualificationDigestSha256),
      languageCode: canonicalTranscript.languageCode,
      segmentCount: canonicalTranscript.segments.length,
      wordCount: canonicalTranscript.words.length,
      minimumConfidenceBasisPoints: Math.min(...confidences),
      lowConfidenceWordCount: confidences.filter(
        (confidence) => confidence < 8_000).length,
      runtimePlacement: 'local_cpu_private_internal',
      actualPrivateMediaBytesProcessed: true,
      actualFasterWhisperPackageExecuted: true,
      actualAsrNativeWordTimestampsProduced: true,
      completeSourceMediaPresentedToRuntime: true,
      speechSegmentsMayOmitSilence: true,
      exactSourceWordLineageVerified: true,
      singleImmutableCaptionTranscriptCreated: true,
      modelDownloadPerformed: false,
      networkAccessRequired: false,
      canonicalGpuTranscriptOwnerClaimed: false,
      authenticatedCanonicalOwnerReadClaimed: false,
      whisperXExecutionClaimed: false,
      pyannoteExecutionClaimed: false,
      rawTranscriptTextIncluded: false,
      mediaBytesIncluded: false,
      pathsUrlsOrCredentialsIncluded: false,
      privateInternalHarnessOnly: true,
      providerCallMade: false,
      directPeerDispatchPerformed: false,
      timingAuthorityGranted: false,
      assetMutationAuthorityGranted: false,
      finalQaApprovalGranted: false,
      billingAuthorityGranted: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    })

  const objectPort = createCanonicalPrivateLocalJsonObjectPort({
    localStorageRoot: evidenceRoot,
  })
  await persistExact(objectPort, objectPath('private-transcript',
    privateTranscriptArtifactRef.contentHash), privateTranscriptBytes)
  await persistExact(objectPort, objectPath('private-word-timing',
    privateWordTimingArtifactRef.contentHash), privateWordTimingBytes)
  await persistExact(objectPort, objectPath('canonical-transcript',
    canonicalTranscript.transcriptDigestSha256), canonicalBytes(canonicalTranscript))
  await persistExact(objectPort, objectPath('execution-evidence',
    executionEvidence.evidenceDigestSha256), canonicalBytes(executionEvidence))

  runAdversarialChecks({ executionEvidence, canonicalTranscript })

  if (!inspectionAttestation) {
    console.log(JSON.stringify({
      ok: true,
      smoke: 'canonical_caption_transcript_private_runtime',
      status: 'awaiting_direct_private_transcript_inspection',
      sourceMediaSha256: sourceMediaRef.contentHash,
      privateTranscriptArtifactSha256:
        privateTranscriptArtifactRef.contentHash,
      canonicalTranscriptSha256: canonicalTranscript.transcriptDigestSha256,
      segmentCount: canonicalTranscript.segments.length,
      wordCount: canonicalTranscript.words.length,
      minimumConfidenceBasisPoints: executionEvidence.minimumConfidenceBasisPoints,
      lowConfidenceWordCount: executionEvidence.lowConfidenceWordCount,
      inspectionRequired: true,
      privateInternalOnly: true,
      canonicalGpuTranscriptOwnerClaimed: false,
      authenticatedCanonicalOwnerReadClaimed: false,
      providerCallMade: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
    }, null, 2))
  } else {
    assert.match(inspectedPrivatePayloadSha256, /^[a-f0-9]{64}$/u)
    assert.equal(inspectedPrivatePayloadSha256,
      privateTranscriptArtifactRef.contentHash)
    const sampledWords = [
      canonicalTranscript.words[0]!,
      canonicalTranscript.words[Math.floor(canonicalTranscript.words.length / 2)]!,
      canonicalTranscript.words.at(-1)!,
    ]
    for (const word of sampledWords) {
      assert.ok(word.endMillisecondsExclusive > word.startMilliseconds)
    }
    const executionEvidenceRef = ref(executionEvidence.evidenceId,
      executionEvidence.schemaVersion, executionEvidence.evidenceDigestSha256)
    const lowConfidenceRatioBasisPoints = Math.round(
      (executionEvidence.lowConfidenceWordCount
        / executionEvidence.wordCount) * 10_000)
    if (inspectionAttestation ===
      'rejected_product_name_semantic_garbling_low_confidence_density') {
      const inspectionReceipt =
        createCaptionPrivateTranscriptInspectionReceipt({
          inspectionId: `caption.private.transcript.inspection.rejected.${
            sourceSha256.slice(0, 24)}`,
          observedAt,
          executionEvidenceRef,
          privateTranscriptArtifactRef,
          canonicalTranscriptRef,
          independentGroundTruthReviewRef: null,
          inspectedSegmentCount: canonicalTranscript.segments.length,
          inspectedWordTimingSampleCount: 3,
          sampledSourceWordIds: sampledWords.map((word) => word.sourceWordId),
          observedLowConfidenceWordCount:
            executionEvidence.lowConfidenceWordCount,
          observedLowConfidenceWordRatioBasisPoints:
            lowConfidenceRatioBasisPoints,
          visibleDefectCodes: [
            'product_or_brand_name_misrecognition',
            'semantic_phrase_garbling',
            'excessive_low_confidence_word_density',
          ],
          transcriptTextOpenedAndRead: true,
          everyTranscriptSegmentInspected: true,
          firstMiddleLastWordTimingInspected: true,
          coherentEnglishSpeechObserved: true,
          expectedTopicEvidenceObserved: true,
          placeholderOrFixtureSpeechObserved: false,
          nonMonotonicTimestampObserved: false,
          emptyOrZeroDurationWordObserved: false,
          transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified: false,
          directAudioListeningAccuracyVerified: false,
          semanticMeaningSafeForCaptionProjection: false,
          properNamesAndClaimSensitiveTermsVerified: false,
          finalPhraseProjectionAllowed: false,
          manualCorrectionOrCanonicalOwnerRequired: true,
          inspectionScope:
            'private_transcript_text_and_sampled_asr_timing_not_independent_audio_truth',
          disposition:
            'rejected_requires_reviewed_correction_or_canonical_owner',
          rawTranscriptTextIncluded: false,
          mediaBytesIncluded: false,
          pathsUrlsOrCredentialsIncluded: false,
          browserLocalCompletionAccepted: false,
          finalQaApprovalGranted: false,
          publicDeliveryGranted: false,
          productionAuthorityGranted: false,
        })
      await persistExact(objectPort, objectPath('inspection-receipt-rejected',
        inspectionReceipt.inspectionDigestSha256),
      canonicalBytes(inspectionReceipt))
      runRejectedAdversarialChecks({
        executionEvidence,
        canonicalTranscript,
        alignmentQualification,
        inspectionReceipt,
      })
      console.log(JSON.stringify({
        ok: true,
        smoke: 'canonical_caption_transcript_private_runtime',
        status:
          'rejected_private_transcript_requires_reviewed_correction_or_canonical_owner',
        sourceMediaSha256: sourceMediaRef.contentHash,
        runtimeEvidenceSha256: executionEvidence.evidenceDigestSha256,
        privateTranscriptArtifactSha256:
          privateTranscriptArtifactRef.contentHash,
        canonicalTranscriptSha256: canonicalTranscript.transcriptDigestSha256,
        inspectionReceiptSha256: inspectionReceipt.inspectionDigestSha256,
        segmentCount: canonicalTranscript.segments.length,
        wordCount: canonicalTranscript.words.length,
        lowConfidenceWordCount: executionEvidence.lowConfidenceWordCount,
        lowConfidenceWordRatioBasisPoints: lowConfidenceRatioBasisPoints,
        visibleDefectCodes: inspectionReceipt.visibleDefectCodes,
        finalPhraseProjectionAllowed: false,
        privateRuntimeExecuted: true,
        privateRuntimeQualifiedForFinalCaptionText: false,
        manualCorrectionOrCanonicalOwnerRequired: true,
        providerCallMade: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      }, null, 2))
    } else {
      assert.equal(inspectionAttestation,
      'accepted_private_text_timing_and_independent_audio_truth')
      assert.match(independentAudioTruthReviewSha256, /^[a-f0-9]{64}$/u)
      assert.equal(executionEvidence.lowConfidenceWordCount, 0,
      'Unreviewed low-confidence words cannot enter the accepted raw-ASR lane.')
      const inspectionReceipt =
      createCaptionPrivateTranscriptInspectionReceipt({
        inspectionId: `caption.private.transcript.inspection.${
          sourceSha256.slice(0, 24)}`,
        observedAt,
        executionEvidenceRef,
        privateTranscriptArtifactRef,
        canonicalTranscriptRef,
        independentGroundTruthReviewRef: ref(
          `caption.private.audio-truth-review.${
            independentAudioTruthReviewSha256.slice(0, 24)}`,
          'caption-private-independent-audio-truth-review-v1',
          independentAudioTruthReviewSha256),
        inspectedSegmentCount: canonicalTranscript.segments.length,
        inspectedWordTimingSampleCount: 3,
        sampledSourceWordIds: sampledWords.map((word) => word.sourceWordId),
        observedLowConfidenceWordCount:
          executionEvidence.lowConfidenceWordCount,
        observedLowConfidenceWordRatioBasisPoints:
          lowConfidenceRatioBasisPoints,
        visibleDefectCodes: [],
        transcriptTextOpenedAndRead: true,
        everyTranscriptSegmentInspected: true,
        firstMiddleLastWordTimingInspected: true,
        coherentEnglishSpeechObserved: true,
        expectedTopicEvidenceObserved: true,
        placeholderOrFixtureSpeechObserved: false,
        nonMonotonicTimestampObserved: false,
        emptyOrZeroDurationWordObserved: false,
        transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified: true,
        directAudioListeningAccuracyVerified: true,
        semanticMeaningSafeForCaptionProjection: true,
        properNamesAndClaimSensitiveTermsVerified: true,
        finalPhraseProjectionAllowed: true,
        manualCorrectionOrCanonicalOwnerRequired: false,
        inspectionScope:
          'private_transcript_text_timing_and_independent_audio_truth',
        disposition:
          'accepted_private_text_timing_and_independent_audio_truth',
        rawTranscriptTextIncluded: false,
        mediaBytesIncluded: false,
        pathsUrlsOrCredentialsIncluded: false,
        browserLocalCompletionAccepted: false,
        finalQaApprovalGranted: false,
        publicDeliveryGranted: false,
        productionAuthorityGranted: false,
      })
      const phraseLineage = createCaptionPrivateInternalPhraseProjection({
      projectionId: `caption.private.phrase-lineage.${
        sourceSha256.slice(0, 24)}`,
      canonicalTranscript,
      alignmentQualification,
      inspectionReceipt,
    })
      assert.equal(phraseLineage.phrases.flatMap(
      (phrase) => phrase.exactSourceWordIds).length,
    canonicalTranscript.words.length)
      const qualification = createCaptionPrivateTranscriptRuntimeQualification({
      qualificationId: `caption.private.transcript.qualification.${
        sourceSha256.slice(0, 24)}`,
      executionEvidence,
      inspectionReceipt,
      phraseLineageProjection: phraseLineage,
    })
      await persistExact(objectPort, objectPath('inspection-receipt',
      inspectionReceipt.inspectionDigestSha256), canonicalBytes(inspectionReceipt))
      await persistExact(objectPort, objectPath('phrase-lineage',
      phraseLineage.projectionDigestSha256), canonicalBytes(phraseLineage))
      await persistExact(objectPort, objectPath('runtime-qualification',
      qualification.qualificationDigestSha256), canonicalBytes(qualification))
      runQualifiedAdversarialChecks({
      executionEvidence,
      inspectionReceipt,
      phraseLineage,
      qualification,
    })

      console.log(JSON.stringify({
      ok: true,
      smoke: 'canonical_caption_transcript_private_runtime',
      status: 'passed_private_real_media_transcript_and_lineage_qualification',
      sourceMediaSha256: sourceMediaRef.contentHash,
      runtimeEvidenceSha256: executionEvidence.evidenceDigestSha256,
      privateTranscriptArtifactSha256:
        privateTranscriptArtifactRef.contentHash,
      privateWordTimingArtifactSha256:
        privateWordTimingArtifactRef.contentHash,
      canonicalTranscriptSha256: canonicalTranscript.transcriptDigestSha256,
      inspectionReceiptSha256: inspectionReceipt.inspectionDigestSha256,
      phraseLineageProjectionSha256:
        phraseLineage.projectionDigestSha256,
      qualificationSha256: qualification.qualificationDigestSha256,
      segmentCount: canonicalTranscript.segments.length,
      wordCount: canonicalTranscript.words.length,
      phraseCount: phraseLineage.phrases.length,
      inspectedWordTimingSampleCount: sampledWords.length,
      privateInternalRouteQualified: true,
      independentAudioTruthReviewComplete: true,
      canonicalGpuTranscriptOwnerIntegrated: false,
      authenticatedCanonicalOwnerReadIntegrated: false,
      whisperXQualified: false,
      pyannoteQualified: false,
      providerCallMade: false,
      publicDeliveryGranted: false,
      productionAuthorityGranted: false,
      }, null, 2))
    }
  }
} finally {
  await rm(transientOutput, { recursive: true, force: true })
}

function sanitizePrivateTranscriptPayload(input: {
  transcript: NonNullable<Awaited<ReturnType<
    typeof runSpeechCaptionExecutionPipeline>>['transcript']>
  runtime: Awaited<ReturnType<
    typeof validateEditReferenceReviewedLocalFasterWhisperRuntime>>
  sourceMediaRef: CaptionDomainRef
}) {
  return {
    schemaVersion: 'caption-private-transcript-payload-v1',
    sourceMediaRef: input.sourceMediaRef,
    language: input.transcript.language ?? 'en',
    languageConfidence: input.transcript.languageConfidence ?? null,
    segments: input.transcript.segments,
    fullText: input.transcript.fullText,
    durationSeconds: input.transcript.durationSeconds,
    sourceAudioArtifactId: input.transcript.sourceAudioArtifactId,
    modelInfo: {
      toolId: input.transcript.modelInfo.toolId,
      modelName: input.runtime.modelName,
      modelVersion: input.runtime.modelVersion,
      modelWeightManifestId: input.runtime.modelManifestId,
      packageVersion: input.runtime.packageVersion,
    },
    confidence: input.transcript.confidence,
    issues: input.transcript.issues,
    privateArtifact: true,
    browserShareable: false,
  }
}

function sanitizePrivateWordTimingPayload(input: {
  wordTimestamps: NonNullable<Awaited<ReturnType<
    typeof runSpeechCaptionExecutionPipeline>>['wordTimestamps']>
  runtime: Awaited<ReturnType<
    typeof validateEditReferenceReviewedLocalFasterWhisperRuntime>>
  sourceMediaRef: CaptionDomainRef
}) {
  return {
    schemaVersion: 'caption-private-word-timing-payload-v1',
    sourceMediaRef: input.sourceMediaRef,
    words: input.wordTimestamps.words,
    sourceAudioArtifactId: input.wordTimestamps.sourceAudioArtifactId,
    modelInfo: {
      toolId: input.wordTimestamps.modelInfo.toolId,
      modelName: input.runtime.modelName,
      modelVersion: input.runtime.modelVersion,
      modelWeightManifestId: input.runtime.modelManifestId,
      packageVersion: input.runtime.packageVersion,
    },
    timestampProvenance: 'asr_native',
    privateArtifact: true,
    browserShareable: false,
  }
}

function runAdversarialChecks(input: {
  executionEvidence: ReturnType<
    typeof createCaptionPrivateLocalTranscriptExecutionEvidence>
  canonicalTranscript: ReturnType<typeof parseCaptionCanonicalTranscript>
}): void {
  const staleEvidence = structuredClone(input.executionEvidence)
  staleEvidence.wordCount += 1
  assert.throws(() =>
    parseCaptionPrivateLocalTranscriptExecutionEvidence(staleEvidence))
  const authorityOverclaim = structuredClone(input.executionEvidence)
  ;(authorityOverclaim as unknown as Record<string, unknown>)
    .productionAuthorityGranted = true
  ;(authorityOverclaim as unknown as Record<string, unknown>)
    .evidenceDigestSha256 =
    calculateSkillContractDigest(
      authorityOverclaim as unknown as Record<string, unknown>,
      'evidenceDigestSha256')
  assert.throws(() =>
    parseCaptionPrivateLocalTranscriptExecutionEvidence(authorityOverclaim))
  const crossedTranscript = structuredClone(input.canonicalTranscript)
  crossedTranscript.words[0]!.sourceSegmentId = 'caption.private.segment.crossed'
  crossedTranscript.transcriptDigestSha256 = calculateSkillContractDigest(
    crossedTranscript as unknown as Record<string, unknown>,
    'transcriptDigestSha256')
  assert.throws(() => parseCaptionCanonicalTranscript(crossedTranscript))
}

function runRejectedAdversarialChecks(input: {
  executionEvidence: ReturnType<
    typeof createCaptionPrivateLocalTranscriptExecutionEvidence>
  canonicalTranscript: ReturnType<typeof parseCaptionCanonicalTranscript>
  alignmentQualification: ReturnType<
    typeof createCaptionPrivateLocalAlignmentQualification>
  inspectionReceipt: ReturnType<
    typeof createCaptionPrivateTranscriptInspectionReceipt>
}): void {
  assert.equal(input.inspectionReceipt.disposition,
    'rejected_requires_reviewed_correction_or_canonical_owner')
  assert.throws(() => createCaptionPrivateInternalPhraseProjection({
    projectionId: 'caption.private.rejected.phrase-projection',
    canonicalTranscript: input.canonicalTranscript,
    alignmentQualification: input.alignmentQualification,
    inspectionReceipt: input.inspectionReceipt,
  }), /requires accepted transcript truth/u)

  const projectionOverclaim = structuredClone(input.inspectionReceipt)
  ;(projectionOverclaim as unknown as Record<string, unknown>)
    .finalPhraseProjectionAllowed =
    true
  ;(projectionOverclaim as unknown as Record<string, unknown>)
    .inspectionDigestSha256 =
    calculateSkillContractDigest(
      projectionOverclaim as unknown as Record<string, unknown>,
      'inspectionDigestSha256')
  assert.throws(() => parseCaptionPrivateTranscriptInspectionReceipt(
    projectionOverclaim))

  const duplicateDefect = structuredClone(input.inspectionReceipt)
  duplicateDefect.visibleDefectCodes.push(
    duplicateDefect.visibleDefectCodes[0]!)
  duplicateDefect.inspectionDigestSha256 = calculateSkillContractDigest(
    duplicateDefect as unknown as Record<string, unknown>,
    'inspectionDigestSha256')
  assert.throws(() => parseCaptionPrivateTranscriptInspectionReceipt(
    duplicateDefect))

  const forgedAccepted = {
    ...structuredClone(input.inspectionReceipt),
    independentGroundTruthReviewRef: null,
    visibleDefectCodes: [],
    transcriptMeaningAccuracyAgainstIndependentGroundTruthVerified: true,
    directAudioListeningAccuracyVerified: true,
    semanticMeaningSafeForCaptionProjection: true,
    properNamesAndClaimSensitiveTermsVerified: true,
    finalPhraseProjectionAllowed: true,
    manualCorrectionOrCanonicalOwnerRequired: false,
    inspectionScope:
      'private_transcript_text_timing_and_independent_audio_truth',
    disposition:
      'accepted_private_text_timing_and_independent_audio_truth',
  }
  forgedAccepted.inspectionDigestSha256 = calculateSkillContractDigest(
    forgedAccepted as unknown as Record<string, unknown>,
    'inspectionDigestSha256')
  assert.throws(() => parseCaptionPrivateTranscriptInspectionReceipt(
    forgedAccepted))

  assert.throws(() => createCaptionPrivateTranscriptRuntimeQualification({
    qualificationId: 'caption.private.rejected.qualification',
    executionEvidence: input.executionEvidence,
    inspectionReceipt: input.inspectionReceipt,
    phraseLineageProjection: {},
  }), /Rejected Caption transcript cannot qualify phrases/u)
}

function runQualifiedAdversarialChecks(input: {
  executionEvidence: ReturnType<
    typeof createCaptionPrivateLocalTranscriptExecutionEvidence>
  inspectionReceipt: ReturnType<
    typeof createCaptionPrivateTranscriptInspectionReceipt>
  phraseLineage: ReturnType<
    typeof createCaptionPrivateInternalPhraseProjection>
  qualification: ReturnType<
    typeof createCaptionPrivateTranscriptRuntimeQualification>
}): void {
  const unsafeReceipt = structuredClone(input.inspectionReceipt)
  unsafeReceipt.sampledSourceWordIds[0] = '/Users/operator/private-word'
  unsafeReceipt.inspectionDigestSha256 = calculateSkillContractDigest(
    unsafeReceipt as unknown as Record<string, unknown>,
    'inspectionDigestSha256')
  assert.throws(() => parseCaptionPrivateTranscriptInspectionReceipt(
    unsafeReceipt))
  const externalOverclaim = structuredClone(input.qualification)
  ;(externalOverclaim as unknown as Record<string, unknown>)
    .publicDeliveryGranted = true
  ;(externalOverclaim as unknown as Record<string, unknown>)
    .qualificationDigestSha256 =
    calculateSkillContractDigest(
      externalOverclaim as unknown as Record<string, unknown>,
      'qualificationDigestSha256')
  assert.throws(() => parseCaptionPrivateTranscriptRuntimeQualification(
    externalOverclaim))
  const crossedProjection = structuredClone(input.phraseLineage)
  crossedProjection.canonicalTranscriptRef.contentHash = '0'.repeat(64)
  crossedProjection.projectionDigestSha256 = calculateSkillContractDigest(
    crossedProjection as unknown as Record<string, unknown>,
    'projectionDigestSha256')
  assert.throws(() => createCaptionPrivateTranscriptRuntimeQualification({
    qualificationId: input.qualification.qualificationId,
    executionEvidence: input.executionEvidence,
    inspectionReceipt: input.inspectionReceipt,
    phraseLineageProjection: crossedProjection,
  }))
}

async function persistExact(
  port: ReturnType<typeof createCanonicalPrivateLocalJsonObjectPort>,
  objectPathValue: string,
  body: Buffer,
): Promise<void> {
  const contentSha256 = sha256(body)
  await port.createOnly({ objectPath: objectPathValue, body, contentSha256 })
  const reread = await port.readExact(objectPathValue)
  assert.ok(reread)
  assert.equal(sha256(reread), contentSha256)
}

function objectPath(kind: string, contentHash: string): string {
  return `caption-transcript-private-runtime/v1/${kind}-${contentHash}.json`
}

function canonicalBytes(value: unknown): Buffer {
  return Buffer.from(`${stableAuthorityStringify(value)}\n`, 'utf8')
}

function requiredAbsolutePath(name: string): string {
  const value = requiredValue(name)
  assert.equal(resolve(value), value, `${name} must be absolute.`)
  return value
}

function requiredValue(name: string): string {
  const value = process.env[name]?.trim() ?? ''
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function ref(id: string, version: string, contentHash: string): CaptionDomainRef {
  return { id, version, contentHash }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

async function hashFile(path: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}
