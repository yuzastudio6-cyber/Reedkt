import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  openPrivateOfflineMediaBinaryRuntime,
  readPersistedOfflineMediaBinaryRuntimeAuthority,
  validateOfflineFfprobeExecutionRequest,
  validateOfflineStorytellingAudioMeasureExecutionRequest,
  validateOfflineStorytellingAudioNormalizeExecutionRequest,
} from '../../tool-execution/media-binary-execution'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  mixMotionStudioPcmWave,
  MOTION_STUDIO_AUDIO_MIX_PROFILE,
  parseMotionStudioPcmWave,
} from './pcm-wave'
import type { VerifiedMotionStudioUploadedAudioInput } from './private-upload-input'

export interface MotionStudioPrivateMixQualityReport {
  schemaVersion: 'motion-studio.private-audio-mix-quality-report.v1'
  profileId: typeof MOTION_STUDIO_AUDIO_MIX_PROFILE.profileId
  integratedLufs: number
  loudnessRangeLu: number
  truePeakDbfs: number
  samplePeakDbfs: number
  sampleRateHertz: 48_000
  channelCount: 2
  sampleCountPerChannel: number
  durationFrames: number
  fps: 24 | 30
  speechPriorityRatio: number
  gateResults: readonly {
    gate: 'file_integrity' | 'format' | 'duration_sync' | 'integrated_loudness' |
      'true_peak' | 'sample_clipping' | 'cue_timing' | 'speech_priority' | 'rights_provenance'
    result: 'passed'
    blocking: true
  }[]
  qaEvidenceDigest: string
}

export interface MotionStudioPrivateMixRuntimeResult {
  artifact: {
    bytes: Buffer
    sha256: string
    byteLength: number
    mimeType: 'audio/wav'
    codec: 'pcm_s16le'
    sampleRateHertz: 48_000
    channelCount: 2
    sampleCountPerChannel: number
  }
  quality: MotionStudioPrivateMixQualityReport
  evidence: {
    profileId: typeof MOTION_STUDIO_AUDIO_MIX_PROFILE.profileId
    inputDigest: string
    pcmMixDigest: string
    runtimeIdentityDigest: string
    normalizationAttestationDigest: string
    measurementAttestationDigest: string
    probeAttestationDigest: string
    inputEvidenceDigest: string
    providerCallMade: false
    providerCostMicros: 0
    customerPricingIncluded: false
    customerCreditsIncluded: false
  }
}

export async function executeMotionStudioPrivateAudioMix(input: {
  fps: 24 | 30
  durationFrames: number
  inputs: readonly VerifiedMotionStudioUploadedAudioInput[]
}): Promise<MotionStudioPrivateMixRuntimeResult> {
  if (input.inputs.length !== 4) blocked('Private audio mix requires four exact verified inputs.')
  const pcm = mixMotionStudioPcmWave({
    fps: input.fps,
    durationFrames: input.durationFrames,
    stems: input.inputs.map((entry) => ({
      role: entry.role,
      startFrame: entry.startFrame,
      endFrame: entry.endFrame,
      cueReason: entry.cueReason,
      sourceSha256: entry.checksumSha256,
      bytes: entry.bytes,
    })),
  })
  const runtimeAuthority = await readPersistedOfflineMediaBinaryRuntimeAuthority()
  const requiredOperations = [
    OFFLINE_MEDIA_BINARY_OPERATIONS.normalizeStorytellingAudioMix,
    OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix,
    OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
  ]
  if (
    !runtimeAuthority || !runtimeAuthority.readiness.privateInternalExecutionReady ||
    runtimeAuthority.readiness.productReady || runtimeAuthority.readiness.finalExportReady ||
    !requiredOperations.every((operationId) =>
      runtimeAuthority.supportedOperations.some((entry) => entry.operationId === operationId))
  ) blocked('Pinned private media runtime authority is unavailable for Storytelling audio.')
  const runtime = await openPrivateOfflineMediaBinaryRuntime()
  if (runtime.image.imageIdentityHash !== runtimeAuthority.image.imageIdentityHash) {
    blocked('Pinned media runtime identity changed after audio authorization.')
  }
  const normalized = await runtime.execute(validateOfflineStorytellingAudioNormalizeExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.normalizeStorytellingAudioMix,
    payload: {
      recipeProfileId: 'motion_studio_storytelling_loudness_normalize_v1',
      targetIntegratedLufs: -16,
      targetTruePeakDb: -1,
      targetLoudnessRangeLu: 7,
      outputSampleRateHertz: 48_000,
      outputChannelCount: 2,
      expectedSampleCountPerChannel: pcm.sampleCountPerChannel,
      mimeType: 'audio/wav',
      sourceByteLength: pcm.byteLength,
      sourceSha256: pcm.sha256,
      sourceBytesBase64: pcm.bytes.toString('base64'),
    },
  }))
  const output = parseMotionStudioPcmWave(normalized.resultArtifact.bytes)
  if (
    output.channelCount !== 2 || output.sampleRateHertz !== 48_000 ||
    output.sampleCountPerChannel !== pcm.sampleCountPerChannel
  ) blocked('Normalized private audio changed exact format or duration authority.')
  const measurement = await runtime.execute(validateOfflineStorytellingAudioMeasureExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix,
    payload: {
      measurementProfileId: 'motion_studio_storytelling_ebur128_v1',
      expectedSampleRateHertz: 48_000,
      expectedChannelCount: 2,
      emitMachineJsonOnly: true,
      expectedSampleCountPerChannel: output.sampleCountPerChannel,
      mimeType: 'audio/wav',
      sourceByteLength: normalized.resultArtifact.byteLength,
      sourceSha256: normalized.resultArtifact.sha256,
      sourceBytesBase64: normalized.resultArtifact.bytes.toString('base64'),
    },
  }))
  const probe = await runtime.execute(validateOfflineFfprobeExecutionRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      inspectionProfileId: 'motion_studio_audio_mix_v1',
      countFrames: false,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
      mimeType: 'audio/wav',
      sourceByteLength: normalized.resultArtifact.byteLength,
      sourceSha256: normalized.resultArtifact.sha256,
      sourceBytesBase64: normalized.resultArtifact.bytes.toString('base64'),
    },
  }))
  const metrics = measurement.resultJson.document
  const samplePeakDbfs = peakDbfs(output.interleavedSamples)
  const speechPriorityRatio = calculateSpeechPriorityRatio(input.inputs)
  const durationSeconds = input.durationFrames / input.fps
  if (
    Math.abs(metrics.integratedLufs - MOTION_STUDIO_AUDIO_MIX_PROFILE.targetIntegratedLufs) > 1 ||
    metrics.truePeakDbfs > MOTION_STUDIO_AUDIO_MIX_PROFILE.maximumPeakDb + 0.1 ||
    samplePeakDbfs > MOTION_STUDIO_AUDIO_MIX_PROFILE.maximumPeakDb + 0.1 ||
    speechPriorityRatio < 1.25 ||
    Number(probe.resultJson.document.durationSeconds) !== Number(durationSeconds.toFixed(6)) ||
    Number(probe.resultJson.document.streamCount) !== 1 ||
    input.inputs.some((entry) => !entry.rightsEvidenceId || !entry.cueAuthorityId)
  ) blocked('Private Storytelling audio mix failed a blocking speech-safe QA gate.')
  const gateResults = [
    'file_integrity', 'format', 'duration_sync', 'integrated_loudness', 'true_peak',
    'sample_clipping', 'cue_timing', 'speech_priority', 'rights_provenance',
  ].map((gate) => ({ gate, result: 'passed' as const, blocking: true as const })) as MotionStudioPrivateMixQualityReport['gateResults']
  const qaWithoutDigest = {
    schemaVersion: 'motion-studio.private-audio-mix-quality-report.v1' as const,
    profileId: MOTION_STUDIO_AUDIO_MIX_PROFILE.profileId,
    integratedLufs: metrics.integratedLufs,
    loudnessRangeLu: metrics.loudnessRangeLu,
    truePeakDbfs: metrics.truePeakDbfs,
    samplePeakDbfs,
    sampleRateHertz: 48_000 as const,
    channelCount: 2 as const,
    sampleCountPerChannel: output.sampleCountPerChannel,
    durationFrames: input.durationFrames,
    fps: input.fps,
    speechPriorityRatio,
    gateResults,
  }
  const inputEvidenceDigest = sha256CanonicalJson(input.inputs.map((entry) => ({
    role: entry.role,
    stemId: entry.stemId,
    mediaAssetId: entry.mediaAssetId,
    checksumSha256: entry.checksumSha256,
    bindingHash: entry.bindingHash,
    startFrame: entry.startFrame,
    endFrame: entry.endFrame,
    cueAuthorityId: entry.cueAuthorityId,
    rightsEvidenceId: entry.rightsEvidenceId,
  })))
  return {
    artifact: {
      bytes: normalized.resultArtifact.bytes,
      sha256: normalized.resultArtifact.sha256,
      byteLength: normalized.resultArtifact.byteLength,
      mimeType: 'audio/wav',
      codec: 'pcm_s16le',
      sampleRateHertz: 48_000,
      channelCount: 2,
      sampleCountPerChannel: output.sampleCountPerChannel,
    },
    quality: {
      ...qaWithoutDigest,
      qaEvidenceDigest: sha256CanonicalJson(qaWithoutDigest),
    },
    evidence: {
      profileId: MOTION_STUDIO_AUDIO_MIX_PROFILE.profileId,
      inputDigest: sha256CanonicalJson({
        fps: input.fps,
        durationFrames: input.durationFrames,
        inputEvidenceDigest,
      }),
      pcmMixDigest: pcm.sha256,
      runtimeIdentityDigest: runtime.image.imageIdentityHash,
      normalizationAttestationDigest: normalized.attestation.attestationHash,
      measurementAttestationDigest: measurement.attestation.attestationHash,
      probeAttestationDigest: probe.attestation.attestationHash,
      inputEvidenceDigest,
      providerCallMade: false,
      providerCostMicros: 0,
      customerPricingIncluded: false,
      customerCreditsIncluded: false,
    },
  }
}

function calculateSpeechPriorityRatio(inputs: readonly VerifiedMotionStudioUploadedAudioInput[]): number {
  const byRole = new Map(inputs.map((entry) => [entry.role, entry]))
  const narration = byRole.get('narration')
  if (!narration) return 0
  const speech = rms(parseMotionStudioPcmWave(narration.bytes).interleavedSamples)
  const nonSpeechSquared = (['music', 'foley', 'exact_sfx'] as const).reduce((sum, role) => {
    const entry = byRole.get(role)
    if (!entry) return sum
    const weighted = rms(parseMotionStudioPcmWave(entry.bytes).interleavedSamples) *
      MOTION_STUDIO_AUDIO_MIX_PROFILE.gains[role]
    return sum + weighted ** 2
  }, 0)
  return rounded(speech / Math.max(Math.sqrt(nonSpeechSquared), Number.EPSILON))
}

function rms(samples: Int16Array): number {
  let sum = 0
  for (const sample of samples) sum += (sample / 32_768) ** 2
  return Math.sqrt(sum / samples.length)
}

function peakDbfs(samples: Int16Array): number {
  let peak = 0
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample / 32_768))
  return rounded(20 * Math.log10(Math.max(peak, Number.EPSILON)))
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
}

export function sha256AudioBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_private_audio_mix_quality',
  })
}
