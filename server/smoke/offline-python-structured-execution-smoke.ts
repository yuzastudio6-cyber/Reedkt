import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  OFFLINE_PYTHON_AUDIO_TOOL_IDS,
  OFFLINE_PYTHON_AUDIO_WAV_TOOL_IDS,
  OFFLINE_PYTHON_MEDIA_TOOL_IDS,
  OFFLINE_PYTHON_SOURCE_TOOL_IDS,
  OFFLINE_PYTHON_STRUCTURED_JSON_TOOL_IDS,
  OFFLINE_PYTHON_STRUCTURED_TOOL_IDS,
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
  OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
  createPrivateOfflinePythonStructuredExecutionRuntime,
  openPersistedPrivateOfflinePythonStructuredExecutionRuntime,
  readPersistedOfflinePythonStructuredExecutionAttestation,
  readPersistedOfflinePythonStructuredRuntimeAuthority,
} from '../tool-execution/python-runner-execution'

const execFileAsync = promisify(execFile)
await rm(OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT, { recursive: true, force: true })
const runtime = await createPrivateOfflinePythonStructuredExecutionRuntime()
const authority = await readPersistedOfflinePythonStructuredRuntimeAuthority()
assert.ok(authority)
assert.equal(authority.image.imageIdentityHash, runtime.image.imageIdentityHash)
assert.equal(authority.supportedOperations.length, 19)
assert.deepEqual(authority.supportedOperations.map((operation) => operation.toolId), [
  ...OFFLINE_PYTHON_STRUCTURED_TOOL_IDS,
])
assert.deepEqual(OFFLINE_PYTHON_SOURCE_TOOL_IDS, [
  ...OFFLINE_PYTHON_MEDIA_TOOL_IDS, ...OFFLINE_PYTHON_AUDIO_TOOL_IDS,
])
assert.deepEqual(OFFLINE_PYTHON_AUDIO_WAV_TOOL_IDS, [
  'pydub', 'pydub_effects', 'resampy', 'pedalboard', 'noisereduce',
])
assert.deepEqual([
  ...OFFLINE_PYTHON_STRUCTURED_JSON_TOOL_IDS,
  ...OFFLINE_PYTHON_AUDIO_WAV_TOOL_IDS,
].sort(), [...OFFLINE_PYTHON_STRUCTURED_TOOL_IDS].sort())
assert.equal(authority.readiness.privateInternalExecutionReady, true)
assert.equal(authority.readiness.productReady, false)
assert.equal(authority.readiness.externalBetaReady, false)
assert.equal(authority.readiness.productionReady, false)

const tableRows = [
  { rowId: 'row_one', category: 'captions', status: 'passed', startFrame: 0, endFrame: 30, value: 0.9 },
  { rowId: 'row_two', category: 'captions', status: 'warning', startFrame: 30, endFrame: 60, value: 0.7 },
] as const
const duckdb = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'duckdb',
  operationId: 'tool.duckdb.query_approved_artifact_tables.v1',
  payload: { queryProfileId: 'approved_qa_aggregate_v1', maximumRows: 10, rows: tableRows },
})
const polars = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'polars',
  operationId: 'tool.polars.transform_approved_artifact_tables.v1',
  payload: {
    transformProfileId: 'approved_timing_table_v1',
    maximumRows: 10,
    deterministicOrdering: true,
    rows: [...tableRows].reverse(),
  },
})
const otio = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'opentimelineio',
  operationId: 'tool.opentimelineio.interchange_approved_timeline.v1',
  payload: {
    interchangeProfileId: 'approved_plan_to_otio_v1',
    frameRate: 30,
    strictRangeValidation: true,
    preserveApprovedSourceOrder: true,
    timelineName: 'Approved Timeline',
    clips: [
      { clipId: 'clip_one', name: 'Opening', mediaReferenceId: 'media_one', sourceStartFrame: 10, durationFrames: 30, timelineStartFrame: 0 },
      { clipId: 'clip_two', name: 'Proof', mediaReferenceId: 'media_two', sourceStartFrame: 5, durationFrames: 45, timelineStartFrame: 45 },
    ],
  },
})
const fixtureDirectory = await mkdtemp(join(tmpdir(), 'reeditpro-python-media-smoke-'))
const fixturePath = join(fixtureDirectory, 'approved-source.mp4')
await execFileAsync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error',
  '-f', 'lavfi', '-i', 'color=c=red:s=160x90:d=1:r=10',
  '-f', 'lavfi', '-i', 'color=c=blue:s=160x90:d=1:r=10',
  '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=2',
  '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v];[2:a]asetpts=PTS-STARTPTS[a]',
  '-map', '[v]', '-map', '[a]',
  '-c:v', 'mpeg4', '-q:v', '5', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-y', fixturePath,
])
const sourceBytes = await readFile(fixturePath)
const sourceAuthority = {
  mimeType: 'video/mp4' as const,
  sourceByteLength: sourceBytes.byteLength,
  sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
  sourceBytesBase64: sourceBytes.toString('base64'),
}
const pyav = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pyav',
  operationId: 'tool.pyav.decode_approved_media.v1',
  payload: {
    decodeProfileId: 'timestamp_safe_sample_v1', frameStride: 5,
    maximumSamples: 10, preserveSourceTimestamps: true, ...sourceAuthority,
  },
})
const opencv = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'opencv',
  operationId: 'tool.opencv.analyze_approved_visual_artifacts.v1',
  payload: {
    analysisProfileId: 'approved_blur_check_v1', frameStride: 5,
    maximumFrames: 10, emitDerivedPixels: false, ...sourceAuthority,
  },
})
const scenes = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pyscenedetect',
  operationId: 'tool.pyscenedetect.detect_scene_boundaries.v1',
  payload: {
    detectorProfileId: 'content_detector_v1', contentThreshold: 20,
    minimumSceneFrames: 2, downscaleFactor: 1, ...sourceAuthority,
  },
})
const scipy = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'scipy',
  operationId: 'tool.scipy.analyze_signal.v1',
  payload: {
    sampleRate: 48_000, channelMode: 'mono', analysisProfileId: 'approved_spectral_summary_v1',
    confidenceThreshold: 0.8, ...sourceAuthority,
  },
})
const loudness = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pyloudnorm',
  operationId: 'tool.pyloudnorm.measure_loudness.v1',
  payload: {
    targetLufs: -16, truePeakDbtp: -1, channelMode: 'mono',
    measurementProfileId: 'ebu_r128_integrated_v1', ...sourceAuthority,
  },
})
const pydub = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pydub',
  operationId: 'tool.pydub.process_audio_segments.v1',
  payload: {
    sampleRate: 48_000, channelMode: 'mono', processingProfileId: 'approved_voice_polish_v1',
    strength: 0.5, preserveVoice: true, ...sourceAuthority,
  },
})
const pydubEffects = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pydub_effects',
  operationId: 'tool.pydub_effects.apply_approved_audio_recipe.v1',
  payload: {
    sampleRate: 48_000, channelMode: 'mono', processingProfileId: 'approved_voice_polish_v1',
    strength: 0.5, preserveVoice: true, ...sourceAuthority,
  },
})
const ebuR128 = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'ebu_r128_pyloudnorm',
  operationId: 'tool.ebu_r128_pyloudnorm.measure_ebu_r128_loudness.v1',
  payload: {
    targetLufs: -16, truePeakDbtp: -1, channelMode: 'mono',
    measurementProfileId: 'ebu_r128_integrated_v1', ...sourceAuthority,
  },
})
const audioDecode = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'audioread', operationId: 'tool.audioread.verify_audio_decode.v1',
  payload: {
    decodeProfileId: 'approved_pcm_decode_v1', maximumChannels: 2,
    maximumSampleRate: 48_000, ...sourceAuthority,
  },
})
const resampled = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'resampy', operationId: 'tool.resampy.resample_audio.v1',
  payload: {
    sampleRate: 22_050, channelMode: 'mono', processingProfileId: 'approved_resample_v1',
    strength: 1, preserveVoice: true, ...sourceAuthority,
  },
})
const pedalboard = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pedalboard', operationId: 'tool.pedalboard.apply_audio_effect_chain.v1',
  payload: {
    sampleRate: 48_000, channelMode: 'mono', processingProfileId: 'approved_voice_effect_chain_v1',
    strength: 0.5, preserveVoice: true, ...sourceAuthority,
  },
})
const timingScore = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'mir_eval', operationId: 'tool.mir_eval.score_music_timing.v1',
  payload: {
    sampleRate: 48_000, channelMode: 'mono', analysisProfileId: 'approved_music_timing_score_v1',
    confidenceThreshold: 0.8, ...sourceAuthority,
  },
})
const midiValidation = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'mido', operationId: 'tool.mido.validate_midi_events.v1',
  payload: {
    timingResolutionPpq: 480, tempoPolicy: 'approved_map',
    timingProfileId: 'approved_midi_validation_v1', ...sourceAuthority,
  },
})
const prettyMidiTiming = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pretty_midi', operationId: 'tool.pretty_midi.analyze_midi_timing.v1',
  payload: {
    timingResolutionPpq: 480, tempoPolicy: 'approved_map',
    timingProfileId: 'approved_pretty_midi_timing_v1', ...sourceAuthority,
  },
})
const reducedNoise = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'noisereduce', operationId: 'tool.noisereduce.reduce_noise.v1',
  payload: {
    sampleRate: 48_000, channelMode: 'mono', processingProfileId: 'approved_noise_reduction_v1',
    strength: 0.35, preserveVoice: true, ...sourceAuthority,
  },
})
const librosaFeatures = await runtime.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'librosa', operationId: 'tool.librosa.analyze_audio_features.v1',
  payload: {
    sampleRate: 48_000, channelMode: 'mono',
    analysisProfileId: 'approved_rhythm_timing_cues_v1',
    confidenceThreshold: 0.6, ...sourceAuthority,
  },
})

for (const result of [
  duckdb, polars, otio, pyav, opencv, scenes, scipy, loudness, pydub, pydubEffects,
  ebuR128, audioDecode, resampled, pedalboard, timingScore, midiValidation,
  reducedNoise,
  prettyMidiTiming,
  librosaFeatures,
]) {
  assert.equal(result.evidence.containerExitCode, 0)
  assert.equal(result.evidence.oomKilled, false)
  assert.equal(result.evidence.confinement.networkMode, 'none')
  assert.equal(result.evidence.confinement.readOnlyRootFilesystem, true)
  assert.equal(result.evidence.confinement.noNewPrivileges, true)
  assert.equal(result.evidence.confinement.user, '10001:10001')
  assert.equal(result.resultJson.mimeType, 'application/json')
  assert.equal(result.resultJson.bytes.byteLength, result.resultJson.byteLength)
  assert.equal(result.attestation.readiness.privateInternalOnly, true)
  assert.equal(result.attestation.readiness.productReady, false)
  const persisted = await readPersistedOfflinePythonStructuredExecutionAttestation(
    result.attestation.recordId,
  )
  assert.equal(persisted?.attestationHash, result.attestation.attestationHash)
}
assert.equal(duckdb.evidence.packageName, 'duckdb')
assert.equal(duckdb.evidence.packageVersion, '1.5.4')
assert.deepEqual(duckdb.resultJson.document, {
  columns: ['category', 'status', 'row_count', 'average_value'],
  profileId: 'approved_qa_aggregate_v1',
  rows: [
    { average_value: 0.9, category: 'captions', row_count: 1, status: 'passed' },
    { average_value: 0.7, category: 'captions', row_count: 1, status: 'warning' },
  ],
})
assert.equal(polars.evidence.packageVersion, '1.42.1')
assert.deepEqual((polars.resultJson.document.rows as Array<Record<string, unknown>>).map((row) => row.rowId), [
  'row_one', 'row_two',
])
assert.equal(otio.evidence.packageVersion, '0.18.1')
assert.deepEqual(otio.resultJson.document.summary, {
  clipCount: 2,
  durationFrames: 90,
  frameRate: 30,
  trackCount: 1,
})
assert.equal(pyav.evidence.packageName, 'pyav')
assert.equal(pyav.evidence.packageVersion, '18.0.0')
assert.ok((pyav.resultJson.document.samples as unknown[]).length >= 2)
assert.equal(opencv.evidence.packageName, 'opencv-python-headless')
assert.equal(opencv.evidence.packageVersion, '5.0.0')
assert.ok((opencv.resultJson.document.samples as unknown[]).length >= 2)
assert.equal(scenes.evidence.packageName, 'scenedetect')
assert.equal(scenes.evidence.packageVersion, '0.7')
assert.ok((scenes.resultJson.document.scenes as unknown[]).length >= 2)
assert.equal(scipy.evidence.packageName, 'scipy')
assert.equal(scipy.evidence.packageVersion, '1.18.0')
assert.ok(Number((scipy.resultJson.document.measurements as Record<string, unknown>).dominantFrequencyHz) > 430)
assert.ok(Number((scipy.resultJson.document.measurements as Record<string, unknown>).dominantFrequencyHz) < 450)
assert.equal(loudness.evidence.packageName, 'pyloudnorm')
assert.equal(loudness.evidence.packageVersion, '0.2.0')
assert.ok(Number((loudness.resultJson.document.measurement as Record<string, unknown>).integratedLufs) < -10)
assert.equal(pydub.evidence.packageName, 'pydub')
assert.equal(pydub.evidence.packageVersion, '0.25.1')
const pydubAudio = pydub.resultJson.document.audioArtifact as Record<string, unknown>
const pydubWav = Buffer.from(String(pydubAudio.bytesBase64), 'base64')
assert.equal(pydubAudio.mimeType, 'audio/wav')
assert.equal(pydubWav.subarray(0, 4).toString('ascii'), 'RIFF')
assert.equal(createHash('sha256').update(pydubWav).digest('hex'), pydubAudio.sha256)
assert.equal(pydubEffects.evidence.packageName, 'pydub')
assert.equal(pydubEffects.evidence.semanticEvidence.fixedPydubEffectsRecipeExecuted, true)
const effectsAudio = pydubEffects.resultJson.document.audioArtifact as Record<string, unknown>
assert.equal(Buffer.from(String(effectsAudio.bytesBase64), 'base64').subarray(8, 12).toString('ascii'), 'WAVE')
assert.equal(ebuR128.evidence.packageName, 'pyloudnorm')
assert.equal(ebuR128.evidence.semanticEvidence.explicitEbuR128GateExecuted, true)
assert.equal(audioDecode.evidence.packageName, 'audioread')
assert.equal(audioDecode.evidence.semanticEvidence.audioreadAudioOpenExecuted, true)
assert.ok(Number((audioDecode.resultJson.document.decode as Record<string, unknown>).decodedPcmByteCount) > 1_000)
assert.equal(resampled.evidence.packageName, 'resampy')
assert.equal(resampled.evidence.semanticEvidence.resampyKaiserBestExecuted, true)
assert.equal((resampled.resultJson.document.outputAudio as Record<string, unknown>).sampleRate, 22_050)
assert.equal(pedalboard.evidence.packageName, 'pedalboard')
assert.equal(pedalboard.evidence.semanticEvidence.fixedPedalboardChainExecuted, true)
assert.equal((pedalboard.resultJson.document.processing as Record<string, unknown>).pluginCount, 3)
assert.equal(timingScore.evidence.packageName, 'mir_eval')
assert.equal(timingScore.evidence.semanticEvidence.mirEvalBeatEvaluateExecuted, true)
assert.ok(Object.keys(timingScore.resultJson.document.scores as object).length >= 5)
assert.equal(midiValidation.evidence.packageName, 'mido')
assert.equal(midiValidation.evidence.semanticEvidence.midoRoundtripExecuted, true)
assert.equal((midiValidation.resultJson.document.midi as Record<string, unknown>).ticksPerBeat, 480)
assert.equal(prettyMidiTiming.evidence.packageName, 'pretty_midi')
assert.equal(prettyMidiTiming.evidence.packageVersion, '0.2.11')
assert.equal(prettyMidiTiming.evidence.semanticEvidence.prettyMidiRoundtripExecuted, true)
assert.ok(Number((prettyMidiTiming.resultJson.document.timing as Record<string, unknown>).noteCount) >= 4)
assert.equal(reducedNoise.evidence.packageName, 'noisereduce')
assert.equal(reducedNoise.evidence.packageVersion, '3.0.3')
assert.equal(reducedNoise.evidence.semanticEvidence.noisereduceStationarySpectralGateExecuted, true)
const reducedNoiseAudio = reducedNoise.resultJson.document.audioArtifact as Record<string, unknown>
assert.equal(reducedNoiseAudio.mimeType, 'audio/wav')
assert.equal(Buffer.from(String(reducedNoiseAudio.bytesBase64), 'base64').subarray(8, 12).toString('ascii'), 'WAVE')
assert.equal(librosaFeatures.evidence.packageName, 'librosa')
assert.equal(librosaFeatures.evidence.packageVersion, '0.11.0')
assert.equal(librosaFeatures.evidence.semanticEvidence.librosaOnsetBeatEnergyExecuted, true)
assert.ok(Number((librosaFeatures.resultJson.document.timing as Record<string, unknown>).analysisFrameCount) > 0)
assert.ok((librosaFeatures.resultJson.document.features as Record<string, unknown>).rmsEnergyCurve instanceof Array)

const reopened = await openPersistedPrivateOfflinePythonStructuredExecutionRuntime()
assert.equal(reopened.image.imageIdentityHash, runtime.image.imageIdentityHash)
await expectRejected(() => reopened.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'duckdb',
  operationId: 'tool.duckdb.query_approved_artifact_tables.v1',
  payload: { queryProfileId: 'approved_qa_aggregate_v1', maximumRows: 10, rows: tableRows, sql: 'DROP TABLE x' },
}))
await expectRejected(() => reopened.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'pyav',
  operationId: 'tool.pyav.decode_approved_media.v1',
  payload: {
    decodeProfileId: 'timestamp_safe_sample_v1', frameStride: 5,
    maximumSamples: 10, preserveSourceTimestamps: true,
    ...sourceAuthority, sourceSha256: '0'.repeat(64),
  },
}))
await expectRejected(() => reopened.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'polars',
  operationId: 'tool.polars.transform_approved_artifact_tables.v1',
  payload: {
    transformProfileId: 'approved_timing_table_v1', maximumRows: 10,
    deterministicOrdering: true, rows: [{ ...tableRows[0], category: 'https://example.invalid' }],
  },
}))
await expectRejected(() => reopened.execute({
  schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  toolId: 'opentimelineio',
  operationId: 'tool.opentimelineio.interchange_approved_timeline.v1',
  payload: {
    interchangeProfileId: 'approved_plan_to_otio_v1', frameRate: 30,
    strictRangeValidation: true, preserveApprovedSourceOrder: true, timelineName: 'Approved Timeline',
    clips: [
      { clipId: 'clip_one', name: 'Opening', mediaReferenceId: 'media_one', sourceStartFrame: 0, durationFrames: 30, timelineStartFrame: 10 },
      { clipId: 'clip_two', name: 'Overlap', mediaReferenceId: 'media_two', sourceStartFrame: 0, durationFrames: 30, timelineStartFrame: 20 },
    ],
  },
}))

const authorityPath = join(
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_STORAGE_ROOT,
  OFFLINE_PYTHON_STRUCTURED_RUNTIME_AUTHORITY_RELATIVE_PATH,
)
const originalAuthority = await readFile(authorityPath, 'utf8')
const tampered = JSON.parse(originalAuthority) as { checksumSha256: string }
tampered.checksumSha256 = 'f'.repeat(64)
await writeFile(authorityPath, `${JSON.stringify(tampered)}\n`)
await assert.rejects(() => readPersistedOfflinePythonStructuredRuntimeAuthority(), ApiError)
await writeFile(authorityPath, originalAuthority)
assert.ok(await readPersistedOfflinePythonStructuredRuntimeAuthority())
await rm(fixtureDirectory, { recursive: true, force: true })

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pinned_hash_locked_multiarch_python_image',
    'duckdb_fixed_in_memory_query_profile_actual_execution',
    'polars_fixed_deterministic_transform_actual_execution',
    'opentimelineio_approved_order_roundtrip_actual_execution',
    'pyav_approved_source_bytes_decode_and_timestamp_sampling',
    'opencv_approved_source_visual_analysis_without_derived_pixels',
    'pyscenedetect_fixed_content_detector_scene_boundaries',
    'scipy_fixed_welch_signal_analysis_over_approved_audio',
    'pyloudnorm_ebu_r128_measurement_over_approved_audio',
    'pydub_fixed_voice_preserving_wav_processing_over_approved_audio',
    'pydub_effects_fixed_normalize_recipe_over_approved_audio',
    'explicit_ebu_r128_pyloudnorm_gate_over_approved_audio',
    'audioread_fixed_pcm_decode_verification_over_approved_audio',
    'resampy_fixed_kaiser_best_resample_to_private_wav',
    'pedalboard_fixed_voice_preserving_effect_chain_to_private_wav',
    'mir_eval_approved_audio_timing_grid_score',
    'mido_approved_audio_duration_to_midi_roundtrip_validation',
    'pretty_midi_approved_symbolic_timing_analysis_and_roundtrip',
    'noisereduce_stationary_voice_preserving_spectral_gate_to_private_wav',
    'librosa_bounded_onset_beat_energy_and_spectral_timing_analysis',
    'networkless_readonly_nonroot_capability_dropped_confinement',
    'no_caller_sql_path_url_command_environment_or_general_python',
    'checksum_protected_runtime_authority_and_execution_attestations',
    'private_internal_only_without_product_beta_or_production_promotion',
  ],
}))

async function expectRejected(action: () => Promise<unknown>): Promise<void> {
  try {
    await action()
    assert.fail('Expected structured Python request rejection.')
  } catch (error) {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, 'VALIDATION_FAILED')
  }
}
