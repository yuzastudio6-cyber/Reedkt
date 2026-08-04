import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import {
  activatePrivateOfflineMediaBinaryRuntime,
  buildOfflineMediaBinaryContinuousProgramAudioRequest,
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE,
} from '../tool-execution/media-binary-execution'

const fps = 30 as const
const sourceFrames = 675
const totalFrames = sourceFrames * 2
const expectedSamples = totalFrames * 1_600
const sourcePaths = [
  join('/tmp', `reeditpro-program-audio-source-1-${process.pid}.mp4`),
  join('/tmp', `reeditpro-program-audio-source-2-${process.pid}.mp4`),
]
const colors = ['0x174EA6', '0xB3261E']
const frequencies = [440, 880]

try {
  for (const [index, path] of sourcePaths.entries()) {
    const generated = spawnSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error',
      '-f', 'lavfi', '-i',
      `color=c=${colors[index]}:s=64x64:r=${fps}:d=22.5`,
      '-f', 'lavfi', '-i',
      `sine=frequency=${frequencies[index]}:sample_rate=48000:duration=22.5`,
      '-map', '0:v:0', '-map', '1:a:0',
      '-frames:v', String(sourceFrames),
      '-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency',
      '-x264-params',
      `keyint=${sourceFrames}:min-keyint=${sourceFrames}:scenecut=0:open-gop=0`,
      '-bf', '0', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      '-t', '22.5', '-movflags', '+faststart', '-threads', '1',
      '-y', path,
    ], { encoding: 'utf8' })
    assert.equal(generated.status, 0, generated.stderr)
  }

  const sourceBytes = await Promise.all(sourcePaths.map((path) => readFile(path)))
  const sourceCommitments = sourceBytes.map((bytes, index) => ({
    inputId: `program-audio-input-${index + 1}`,
    sourceSequenceItemId: `program-audio-source-${index + 1}`,
    mediaAssetId: `program-audio-media-${index + 1}`,
    sourceObjectGeneration: String(index + 1),
    mimeType: 'video/mp4' as const,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
  }))
  assert.notEqual(sourceCommitments[0]!.sha256, sourceCommitments[1]!.sha256)

  const request = buildOfflineMediaBinaryContinuousProgramAudioRequest({
    planningPayload: {
      recipeProfileId: OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE,
      audioAuthorityHash: sha256Text('approved-program-audio-authority-v1'),
      expectedObjectIdentity: sha256Text('private-program-audio-object-v1'),
      frameRateNumerator: 30,
      frameRateDenominator: 1,
      totalFrames,
      sampleRate: 48_000,
      channelMode: 'stereo',
      sampleFormat: 's24',
      outputContainer: 'flac',
      outputAudioCodec: 'flac',
      audioPolicy: 'approved_source_program_audio_only_v1',
      transitionPolicy: 'approved_hard_cuts_only_v1',
      timestampPolicy: 'normalize_from_zero',
      sourceQualityPolicy: 'immutable_source_master_audio_no_proxy_v1',
      musicPlanned: false,
      sfxPlanned: false,
      duckingPlanned: false,
      realAudioAnalysisPerformed: false,
      usesApprovedEditReservation: true,
      requiresSeparateExportEstimate: false,
      allowsAdditionalExportCharge: false,
      sourceSlices: sourceCommitments.map((source, index) => ({
        sliceIndex: index + 1,
        segmentId: `program-audio-segment-${index + 1}`,
        sourceSequenceItemId: source.sourceSequenceItemId,
        mediaAssetId: source.mediaAssetId,
        sourceObjectGeneration: source.sourceObjectGeneration,
        sourceSha256: source.sha256,
        sourceCleanupDecisionId: `program-audio-cleanup-${index + 1}`,
        sourceStartFrame: 0,
        sourceEndFrameExclusive: sourceFrames,
        timelineStartFrame: index * sourceFrames,
        timelineEndFrameExclusive: (index + 1) * sourceFrames,
        boundaryBefore: index === 0
          ? 'timeline_start' as const
          : 'approved_hard_cut' as const,
      })),
    },
    sources: sourceCommitments,
  })
  const privateInputs = sourceBytes.map((bytes) => Object.freeze({
    inputMode: 'private_verified_stream_v1' as const,
    byteLength: bytes.byteLength,
    sha256: sha256(bytes),
    async openStream() { return Readable.from([bytes]) },
  }))

  const runtime = await activatePrivateOfflineMediaBinaryRuntime()
  let outputBytes = Buffer.alloc(0)
  const result = await runtime.executeContinuousProgramAudioServerInjected(
    request,
    privateInputs,
    outputSink((bytes) => { outputBytes = Buffer.from(bytes) }),
  )
  assert.equal(outputBytes.subarray(0, 4).toString('ascii'), 'fLaC')
  assert.equal(result.resultArtifact.sha256, sha256(outputBytes))
  assert.equal(result.resultArtifact.byteLength, outputBytes.byteLength)
  assert.equal(result.evidence.sourceSha256s.length, 2)
  assert.equal(result.evidence.confinement.networkMode, 'none')
  assert.equal(
    result.evidence.confinement.serverOwnedEntrypoint,
    '/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio',
  )
  assert.equal(result.evidence.semanticEvidence.frameToSampleMappingExact, true)
  assert.equal(result.evidence.semanticEvidence.musicGeneratedOrMixed, false)
  assert.equal(result.evidence.semanticEvidence.sfxGeneratedOrMixed, false)
  assert.equal(result.evidence.semanticEvidence.duckingApplied, false)
  assert.equal(
    result.evidence.semanticEvidence.originalApprovedEditReservationUsed,
    true,
  )
  assert.equal(
    result.evidence.semanticEvidence.separateExportEstimateRequired,
    false,
  )
  assert.equal(
    result.evidence.semanticEvidence.additionalExportChargeAllowed,
    false,
  )
  assert.equal(result.image.flacEncoding, 'private_continuous_program_audio_only')
  assert.equal(result.readiness.productReady, false)

  let repeatedOutputBytes = Buffer.alloc(0)
  const repeated = await runtime.executeContinuousProgramAudioServerInjected(
    request,
    privateInputs,
    outputSink((bytes) => { repeatedOutputBytes = Buffer.from(bytes) }),
  )
  assert.equal(repeated.resultArtifact.sha256, result.resultArtifact.sha256)
  assert.equal(repeated.resultArtifact.byteLength, result.resultArtifact.byteLength)
  assert.deepEqual(repeatedOutputBytes, outputBytes)

  const semanticEvidence = result.evidence.semanticEvidence as
    Record<string, unknown>
  const independentQa = semanticEvidence.outputProbe as
    Record<string, unknown>
  const qaConfinement = independentQa.decodedSampleVerificationConfinement as
    Record<string, unknown>
  assert.equal(independentQa.container, 'flac')
  assert.equal(independentQa.audioCodec, 'flac')
  assert.equal(independentQa.sampleRate, 48_000)
  assert.equal(independentQa.channels, 2)
  assert.equal(independentQa.channelLayout, 'stereo')
  assert.equal(independentQa.sampleFormat, 's32')
  assert.equal(independentQa.bitsPerRawSample, 24)
  assert.equal(independentQa.timeBase, '1/48000')
  assert.equal(independentQa.expectedSamples, expectedSamples)
  assert.equal(independentQa.actualSamples, expectedSamples)
  assert.equal(independentQa.decodedBytes, expectedSamples * 6)
  assert.equal(independentQa.actualDurationSeconds, totalFrames / fps)
  assert.equal(independentQa.streamingHeaderDurationPresent, false)
  assert.equal(independentQa.streamingHeaderSizePresent, false)
  assert.equal(qaConfinement.networkMode, 'none')
  assert.equal(qaConfinement.readOnlyRootFilesystem, true)
  assert.equal(
    qaConfinement.serverOwnedEntrypoint,
    '/usr/local/bin/reeditpro-ffmpeg-continuous-program-audio-probe',
  )

  assert.throws(() => buildOfflineMediaBinaryContinuousProgramAudioRequest({
    planningPayload: { ...request.payload, command: 'ffmpeg -i caller.mp4' },
    sources: request.inputs.sources,
  }))
  await assert.rejects(() =>
    runtime.executeContinuousProgramAudioServerInjected(
      request,
      [{ ...privateInputs[0]!, sha256: 'f'.repeat(64) }, privateInputs[1]!],
      outputSink(() => {
        throw new Error('tampered input must not persist')
      }),
    ))

  console.log(JSON.stringify({
    ok: true,
    schemaVersion: 'offline-media-binary-continuous-program-audio-smoke-v1',
    sourceCount: sourceBytes.length,
    sourceSliceCount: request.payload.sourceSlices.length,
    totalFrames,
    expectedSamples,
    outputByteLength: outputBytes.byteLength,
    outputSha256: sha256(outputBytes),
    independentQaEvidenceSha256: sha256Text(JSON.stringify(independentQa)),
    deterministicByteReexecutionVerified: true,
    originalApprovedEditReservationUsed: true,
    separateExportEstimateRequired: false,
    additionalExportChargeAllowed: false,
    productReady: false,
    productionReady: false,
  }, null, 2))
} finally {
  await Promise.all(sourcePaths.map((path) => rm(path, { force: true })))
}

function outputSink(onBytes: (bytes: Buffer) => void) {
  return {
    maximumBytes:
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES,
    async persist(input: {
      stream: Readable
      mimeType: 'video/x-matroska' | 'audio/wav' | 'audio/flac' | 'video/mp4'
      expectedByteLength: number
      expectedSha256: string
    }) {
      assert.equal(input.mimeType, 'audio/flac')
      const chunks: Buffer[] = []
      for await (const chunk of input.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      const bytes = Buffer.concat(chunks)
      assert.equal(bytes.byteLength, input.expectedByteLength)
      assert.equal(sha256(bytes), input.expectedSha256)
      onBytes(bytes)
      return { byteLength: bytes.byteLength, sha256: sha256(bytes) }
    },
  }
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256Text(value: string): string {
  return sha256(Buffer.from(value, 'utf8'))
}
