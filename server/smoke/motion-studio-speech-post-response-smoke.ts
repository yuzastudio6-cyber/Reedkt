import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

import { readCanonicalPrivateAudioArtifact } from '../services/canonical-private-audio-artifact-storage'
import {
  APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
  activatePrivateOfflineMediaBinaryRuntime,
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
} from '../tool-execution/media-binary-execution'
import {
  compileMotionStudioElevenLabsTimingRequest,
  createMotionStudioSpeechC2FixtureFetchTransport,
  createMotionStudioSpeechC2SingleUseTransportPermit,
  processMotionStudioSpeechC2Response,
  readMotionStudioSpeechC2PostResponseEvidence,
} from '../motion-studio/speech-production'
import { createMotionStudioSpeechLiveFixture } from './fixtures/motion-studio-speech-live-fixture'

const executionTime = '2026-07-17T21:06:00.000Z'
const providerVoiceId = 'catalogVoice_PostResponse'
const fixture = createMotionStudioSpeechLiveFixture('post-response', providerVoiceId)
const expectedDurationSeconds =
  (fixture.request.range.endFrame - fixture.request.range.startFrame) / 24
const compiled = compileMotionStudioElevenLabsTimingRequest({
  request: fixture.request,
  capabilitySnapshot: fixture.capability,
  executionAuthority: fixture.authority,
  executionTime,
  providerVoiceId,
})
const permit = createMotionStudioSpeechC2SingleUseTransportPermit({
  permitId: 'permit-post-response',
  operationId: 'operation-post-response',
  executionAuthority: fixture.authority,
  request: compiled,
  issuedAt: '2026-07-17T21:05:30.000Z',
  expiresAt: '2026-07-17T21:10:00.000Z',
})

const mp3Path = join('/tmp', `reeditpro-speech-post-response-${process.pid}.mp3`)
const localStorageRoot = join('/tmp', `reeditpro-speech-post-response-private-${process.pid}`)
await rm(localStorageRoot, { recursive: true, force: true })
try {
  const generated = spawnSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-f', 'lavfi', '-i',
    `sine=frequency=310:sample_rate=44100:duration=${expectedDurationSeconds}`,
    '-filter:a', 'volume=0.12', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k',
    '-write_xing', '0', '-id3v2_version', '3', '-y', mp3Path,
  ], { encoding: 'utf8' })
  assert.equal(generated.status, 0, generated.stderr)
  const mp3Bytes = await readFile(mp3Path)
  assert.equal(
    mp3Bytes.subarray(0, 3).toString('ascii') === 'ID3' ||
      (mp3Bytes[0] === 0xff && (mp3Bytes[1]! & 0xe0) === 0xe0),
    true,
  )
  const characters = [...fixture.request.spokenText]
  const characterDuration = 2.4 / characters.length
  const alignment = {
    characters,
    character_start_times_seconds: characters.map((_, index) => Number((0.1 + index * characterDuration).toFixed(6))),
    character_end_times_seconds: characters.map((_, index) => Number((0.1 + (index + 1) * characterDuration).toFixed(6))),
  }
  const responsePayload = {
    audio_base64: mp3Bytes.toString('base64'),
    alignment,
    normalized_alignment: alignment,
  }
  const transport = createMotionStudioSpeechC2FixtureFetchTransport({
    transportEnabled: true,
    async fixtureFetchImplementation() {
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'request-id': 'private-local-post-response-request',
          'character-cost': String(fixture.request.spokenText.length),
        },
      })
    },
  })
  const transportResult = await transport.execute({ request: compiled, permit, now: executionTime })
  assert.equal(transportResult.status, 'response_received')

  await assert.rejects(
    () => processMotionStudioSpeechC2Response({
      request: fixture.request,
      capabilitySnapshot: fixture.capability,
      executionAuthority: fixture.authority,
      compiledRequest: compiled,
      transportPermit: permit,
      transportResult: structuredClone(transportResult),
      fps: 24,
      localStorageRoot,
      createdAt: '2026-07-17T21:07:00.000Z',
    }),
    /no trusted in-process evidence provenance/,
  )

  await activatePrivateOfflineMediaBinaryRuntime()
  const evidence = await processMotionStudioSpeechC2Response({
    request: fixture.request,
    capabilitySnapshot: fixture.capability,
    executionAuthority: fixture.authority,
    compiledRequest: compiled,
    transportPermit: permit,
    transportResult,
    fps: 24,
    localStorageRoot,
    createdAt: '2026-07-17T21:07:00.000Z',
  })
  assert.equal(evidence.schemaVersion, 'motion-studio.speech-c2-post-response-evidence.v1')
  assert.equal(evidence.evidenceClass, 'private_local_transport_fixture')
  assert.equal(evidence.externalProviderCallCount, 0)
  assert.equal(evidence.transportDispatchCount, 1)
  assert.equal(evidence.requestDigest, fixture.authority.speechRequestDigest)
  assert.equal(evidence.executionAuthorityDigest, fixture.authority.authorityDigest)
  assert.equal(evidence.compiledRequestDigest, compiled.compiledRequestDigest)
  assert.equal(evidence.transportPermitDigest, permit.permitDigest)
  assert.equal(evidence.transportResponseCanonicalDigest, transportResult.parsedResponseCanonicalDigest)
  assert.equal(evidence.source.sha256, createHash('sha256').update(mp3Bytes).digest('hex'))
  assert.equal(evidence.source.persistedRawProviderBytes, false)
  assert.equal(evidence.normalizedArtifact.mimeType, 'audio/wav')
  assert.equal(evidence.normalizedArtifact.codec, 'pcm_s16le')
  assert.equal(evidence.normalizedArtifact.sampleRateHertz, 48_000)
  assert.equal(evidence.normalizedArtifact.channelCount, 1)
  assert.equal(
    evidence.normalizedArtifact.durationMilliseconds,
    expectedDurationSeconds * 1_000,
  )
  assert.equal(
    evidence.normalizedArtifact.sampleCountPerChannel,
    expectedDurationSeconds * 48_000,
  )
  assert.equal(
    evidence.normalizedArtifact.resourceObservation.observerKind,
    'media_container_cgroup_v2_attempt_aggregate_v1',
  )
  assert.equal(
    evidence.normalizedArtifact.resourceObservation.measurementAgentVersion,
    'embedded_media_cgroup_v2_attempt_aggregate_v1',
  )
  assert(
    evidence.normalizedArtifact.resourceObservation.finish.cpuUsageNanoseconds >
      evidence.normalizedArtifact.resourceObservation.start.cpuUsageNanoseconds,
  )
  assert.ok(evidence.alignment.wordTimings.length >= 8)
  assert.equal(evidence.alignment.wordTimings[0]!.text, 'At')
  assert.equal(evidence.alignment.wordTimings.every((word, index, words) =>
    word.startFrame < word.endFrame &&
    word.startFrame >= fixture.request.range.startFrame &&
    word.endFrame <= fixture.request.range.endFrame &&
    (index === 0 || word.startFrame >= words[index - 1]!.endFrame)), true)
  assert.equal(evidence.qa.results.filter((gate) => gate.result === 'passed').length, 9)
  assert.equal(evidence.qa.results.filter((gate) => gate.result === 'not_evaluated').length, 4)
  assert.equal(evidence.qa.selectionEligible, false)
  assert.equal(evidence.reconciliation.providerCostReconciliationRequired, true)
  assert.equal(evidence.reconciliation.providerCharacterCostHeaderPresent, true)
  assert.equal(evidence.reconciliation.providerCharacterCostCredits, fixture.request.spokenText.length)
  assert.equal(
    evidence.reconciliation.providerCharacterCostMicrocredits,
    fixture.request.spokenText.length * 1_000_000,
  )
  assert.equal(evidence.providerCharacterCostCredits, fixture.request.spokenText.length)
  assert.equal(evidence.providerCharacterCostMicrocredits, fixture.request.spokenText.length * 1_000_000)
  assert.match(evidence.providerCharacterCostEvidenceDigest ?? '', /^[a-f0-9]{64}$/)
  assert.equal(
    evidence.reconciliation.providerCharacterCostEvidenceDigest,
    evidence.providerCharacterCostEvidenceDigest,
  )
  assert.equal(evidence.reconciliation.localComputeCostReconciliationRequired, true)
  assert.equal(evidence.selection.selected, false)
  assert.equal(evidence.selection.finalAssetEligible, false)
  assert.equal(evidence.selection.timelineMutationPerformed, false)
  assert.equal(evidence.persistence.rawProviderResponsePersisted, false)
  assert.equal(evidence.persistence.rawProviderAudioPersisted, false)
  assert.equal(evidence.persistence.normalizedAudioPersisted, true)
  assert.equal(evidence.readiness.privateReviewEvidenceReady, false)
  assert.equal(evidence.readiness.productReady, false)
  assert.equal(JSON.stringify(evidence).includes(responsePayload.audio_base64), false)

  const stored = await readCanonicalPrivateAudioArtifact({
    localStorageRoot,
    privateObjectIdentityHash: evidence.normalizedArtifact.privateObjectIdentityHash,
  })
  assert(stored)
  assert.equal(stored.sha256, evidence.normalizedArtifact.sha256)
  assert.equal(stored.byteLength, evidence.normalizedArtifact.byteLength)
  assert.equal(stored.contentType, 'audio/wav')
  const storedEvidence = await readMotionStudioSpeechC2PostResponseEvidence({
    localStorageRoot,
    evidenceObjectIdentityHash: evidence.persistence.evidenceObjectIdentityHash,
  })
  assert(storedEvidence)
  assert.equal(storedEvidence.evidenceDigest, evidence.evidenceDigest)
  assert.equal(storedEvidence.normalizedArtifact.sha256, evidence.normalizedArtifact.sha256)
  assert.equal(Object.isFrozen(storedEvidence), true)

  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  assert(runtimeAuthority)
  assert.equal(runtimeAuthority.supportedOperations.some((operation) =>
    operation.operationId === OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg), true)
  assert.equal(runtimeAuthority.supportedRecipeProfiles.includes(
    APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID), true)
  assert.equal(runtimeAuthority.readiness.productReady, false)

  if (transportResult.status !== 'response_received') throw new Error('Expected response receipt.')
  await assert.rejects(
    () => processMotionStudioSpeechC2Response({
      request: fixture.request,
      capabilitySnapshot: fixture.capability,
      executionAuthority: fixture.authority,
      compiledRequest: compiled,
      transportPermit: { ...permit, permitDigest: 'f'.repeat(64) },
      transportResult,
      fps: 24,
      localStorageRoot,
      createdAt: '2026-07-17T21:07:00.000Z',
    }),
    /transport result does not bind/,
  )
  await assert.rejects(
    () => processMotionStudioSpeechC2Response({
      request: fixture.request,
      capabilitySnapshot: fixture.capability,
      executionAuthority: fixture.authority,
      compiledRequest: compiled,
      transportPermit: permit,
      transportResult: {
        ...transportResult,
        responseBody: { ...responsePayload, audio_base64: `${responsePayload.audio_base64.slice(0, -4)}AAAA` },
      },
      fps: 24,
      localStorageRoot,
      createdAt: '2026-07-17T21:07:00.000Z',
    }),
    /private recognized-response contract/,
  )
  await assert.rejects(
    () => processMotionStudioSpeechC2Response({
      request: fixture.request,
      capabilitySnapshot: fixture.capability,
      executionAuthority: fixture.authority,
      compiledRequest: compiled,
      transportPermit: permit,
      transportResult: { ...transportResult, compiledRequestDigest: 'f'.repeat(64) },
      fps: 24,
      localStorageRoot,
      createdAt: '2026-07-17T21:07:00.000Z',
    }),
    /transport result does not bind/,
  )

  console.log(JSON.stringify({
    ok: true,
    normalizedSpeechOperation: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    normalizedSpeechRecipeProfile:
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
    sourceMp3Bytes: mp3Bytes.byteLength,
    normalizedWaveBytes: evidence.normalizedArtifact.byteLength,
    wordTimingCount: evidence.alignment.wordTimings.length,
    qaPassed: 9,
    qaNotEvaluated: 4,
    privateArtifactPersisted: true,
    rawProviderPayloadPersisted: false,
    selectionEligible: false,
    finalAssetEligible: false,
    realExternalRequestCount: 0,
    realProviderCostMicros: 0,
  }))
} finally {
  await rm(mp3Path, { force: true })
  await rm(localStorageRoot, { recursive: true, force: true })
}
