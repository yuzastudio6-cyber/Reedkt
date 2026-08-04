import { createHash } from 'node:crypto'

import {
  motionStudioIntegratedMixRequestV1Schema,
  motionStudioNarrationAssemblyArtifactV1Schema,
  motionStudioNarrationAssemblyQualityReportV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioIntegratedMixInputV1,
  MotionStudioIntegratedMixRequestV1,
  MotionStudioNarrationAssemblyArtifactV1,
  MotionStudioNarrationAssemblyQualityReportV1,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import {
  encodeMotionStudioPcmWave,
  MOTION_STUDIO_AUDIO_MIX_PROFILE,
  parseMotionStudioPcmWave,
} from './pcm-wave'
import {
  executeMotionStudioPrivateAudioMix,
  type MotionStudioPrivateMixRuntimeResult,
} from './private-mix-runtime'
import type { VerifiedMotionStudioUploadedAudioInput } from './private-upload-input'

export const MOTION_STUDIO_SELECTED_AUDIO_MIX_PROFILE_DIGEST =
  sha256CanonicalJson(MOTION_STUDIO_AUDIO_MIX_PROFILE)

export interface MotionStudioSelectedStemPrivateInputV1 {
  sourceId: string
  assetVersionId: string
  checksumSha256: string
  byteLength: number
  bytes: Buffer
}

export interface MotionStudioSelectedAudioMixRuntimeResultV1 {
  result: MotionStudioPrivateMixRuntimeResult
  inputEvidenceDigest: string
  optionalSilenceRoles: readonly ('music' | 'foley' | 'exact_sfx')[]
  sourceInputCount: number
  collapsedRoleCount: 4
  providerCallMade: false
  automaticRetryPerformed: false
  automaticFallbackPerformed: false
  automaticSubstitutionPerformed: false
  timelineMutationPerformed: false
  videoMuxPerformed: false
  renderPerformed: false
  exportPerformed: false
  customerPriceIncluded: false
  customerCreditsIncluded: false
  serviceFeeIncluded: false
  walletMutationPerformed: false
  billingMutationPerformed: false
}

export async function executeMotionStudioSelectedAudioMixV1(input: {
  request: unknown
  narrationArtifact: unknown
  narrationQualityReport: unknown
  narrationBytes: Buffer
  selectedStemInputs: readonly MotionStudioSelectedStemPrivateInputV1[]
}): Promise<MotionStudioSelectedAudioMixRuntimeResultV1> {
  const request = parseRequest(input.request)
  const narrationArtifact = parseNarrationArtifact(input.narrationArtifact)
  const narrationQa = parseNarrationQuality(input.narrationQualityReport)
  assertNarrationAuthority(request, narrationArtifact, narrationQa, input.narrationBytes)
  if (request.profileDigest !== MOTION_STUDIO_SELECTED_AUDIO_MIX_PROFILE_DIGEST) {
    blocked('Integrated audio request does not use the accepted deterministic mix profile digest.')
  }

  const optionalRequestInputs = request.inputs.filter((entry) => entry.role !== 'narration')
  const selectedById = new Map<string, MotionStudioSelectedStemPrivateInputV1>()
  for (const selected of input.selectedStemInputs) {
    if (selectedById.has(selected.sourceId)) blocked('Selected private audio source identities must be unique.')
    selectedById.set(selected.sourceId, selected)
  }
  if (selectedById.size !== optionalRequestInputs.length ||
    optionalRequestInputs.some((entry) => !selectedById.has(entry.sourceId))) {
    blocked('Private selected-stem bytes must exactly cover the integrated mix request.')
  }

  const inputEvidence = optionalRequestInputs.map((entry) => {
    const source = selectedById.get(entry.sourceId)
    if (!source) blocked('A selected private audio source is unavailable.')
    verifySelectedSource(entry, source)
    return {
      role: entry.role,
      sourceId: entry.sourceId,
      assetVersionId: entry.assetVersionId,
      checksumSha256: entry.checksumSha256,
      placement: entry.placement,
      cueAuthorityIds: entry.cueAuthorityIds,
      soundEventAuthorityIds: entry.soundEventAuthorityIds,
      rightsEvidenceIds: entry.rightsEvidenceIds,
    }
  })

  const verifiedInputs: VerifiedMotionStudioUploadedAudioInput[] = [
    narrationInput(request, narrationArtifact, input.narrationBytes),
    roleInput('music', request, optionalRequestInputs, selectedById),
    roleInput('foley', request, optionalRequestInputs, selectedById),
    roleInput('exact_sfx', request, optionalRequestInputs, selectedById),
  ]
  const result = await executeMotionStudioPrivateAudioMix({
    fps: request.timingAuthority.frameRate as 24 | 30,
    durationFrames: request.timingAuthority.durationFrames,
    inputs: verifiedInputs,
  })
  const optionalSilenceRoles = verifiedInputs
    .filter((entry) => entry.role !== 'narration' && entry.cueAuthorityId.includes('-silence-'))
    .map((entry) => entry.role) as Array<'music' | 'foley' | 'exact_sfx'>
  return {
    result,
    inputEvidenceDigest: sha256CanonicalJson({
      requestId: request.integratedMixRequestId,
      narrationArtifactVersionId: narrationArtifact.artifactVersionId,
      narrationChecksumSha256: narrationArtifact.checksumSha256,
      optionalInputs: inputEvidence,
      collapsedInputs: verifiedInputs.map(safeVerifiedInput),
    }),
    optionalSilenceRoles,
    sourceInputCount: request.inputs.length,
    collapsedRoleCount: 4,
    providerCallMade: false,
    automaticRetryPerformed: false,
    automaticFallbackPerformed: false,
    automaticSubstitutionPerformed: false,
    timelineMutationPerformed: false,
    videoMuxPerformed: false,
    renderPerformed: false,
    exportPerformed: false,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
  }
}

function roleInput(
  role: 'music' | 'foley' | 'exact_sfx',
  request: MotionStudioIntegratedMixRequestV1,
  optionalInputs: readonly MotionStudioIntegratedMixInputV1[],
  selectedById: ReadonlyMap<string, MotionStudioSelectedStemPrivateInputV1>,
): VerifiedMotionStudioUploadedAudioInput {
  const sourceRoles = role === 'foley' ? ['foley', 'ambience'] : [role]
  const selected = optionalInputs.filter((entry) => sourceRoles.includes(entry.role))
  const totalSamples = request.output.sampleCountPerChannel
  const output = new Int16Array(totalSamples * 2)
  const occupied = new Uint8Array(totalSamples)

  for (const authority of selected) {
    const sourceAuthority = selectedById.get(authority.sourceId)
    if (!sourceAuthority) blocked('Selected role source bytes are unavailable.')
    const source = parseMotionStudioPcmWave(sourceAuthority.bytes)
    const expectedSamples = authority.placement.endSampleExclusive - authority.placement.startSampleInclusive
    if (source.sampleCountPerChannel !== expectedSamples) {
      blocked('Selected role source length does not match its exact frame/sample placement.')
    }
    for (let offset = 0; offset < expectedSamples; offset += 1) {
      const target = authority.placement.startSampleInclusive + offset
      if (occupied[target]) blocked('The first selected-stem mix profile does not permit overlapping inputs within one role.')
      occupied[target] = 1
      const sourceIndex = offset * source.channelCount
      const left = source.interleavedSamples[sourceIndex]!
      const right = source.channelCount === 2 ? source.interleavedSamples[sourceIndex + 1]! : left
      output[target * 2] = left
      output[target * 2 + 1] = right
    }
  }

  const bytes = encodeMotionStudioPcmWave({ channelCount: 2, interleavedSamples: output })
  const checksumSha256 = sha256(bytes)
  const evidenceDigest = sha256CanonicalJson(selected.map((entry) => ({
    role: entry.role,
    sourceId: entry.sourceId,
    checksumSha256: entry.checksumSha256,
    placement: entry.placement,
    cueAuthorityIds: entry.cueAuthorityIds,
    soundEventAuthorityIds: entry.soundEventAuthorityIds,
    rightsEvidenceIds: entry.rightsEvidenceIds,
  })))
  const silence = selected.length === 0
  return verifiedInput({
    role,
    bytes,
    startFrame: 0,
    endFrame: request.timingAuthority.durationFrames,
    cueAuthorityId: silence ? `decision-${role}-silence-${evidenceDigest.slice(0, 12)}` : `cue-set-${role}-${evidenceDigest.slice(0, 12)}`,
    cueReason: silence
      ? `The explicit ${role} decision preserves silence for this approved mix.`
      : `Exact reviewed ${role} selections were collapsed without timing changes.`,
    rightsEvidenceId: silence
      ? `rights-${role}-silence-${evidenceDigest.slice(0, 12)}`
      : `rights-set-${role}-${evidenceDigest.slice(0, 12)}`,
    identitySuffix: `${role}-${evidenceDigest.slice(0, 16)}`,
    checksumSha256,
  })
}

function narrationInput(
  request: MotionStudioIntegratedMixRequestV1,
  artifact: MotionStudioNarrationAssemblyArtifactV1,
  bytes: Buffer,
): VerifiedMotionStudioUploadedAudioInput {
  return verifiedInput({
    role: 'narration',
    bytes,
    startFrame: 0,
    endFrame: request.timingAuthority.durationFrames,
    cueAuthorityId: `narration-assembly-${artifact.artifactVersionId}`,
    cueReason: 'The passed private narration assembly is the sole narration mix authority.',
    rightsEvidenceId: `narration-rights-${artifact.artifactVersionId}`,
    identitySuffix: `narration-${artifact.artifactVersionId}`,
    checksumSha256: artifact.checksumSha256,
  })
}

function verifiedInput(input: {
  role: VerifiedMotionStudioUploadedAudioInput['role']
  bytes: Buffer
  startFrame: number
  endFrame: number
  cueAuthorityId: string
  cueReason: string
  rightsEvidenceId: string
  identitySuffix: string
  checksumSha256: string
}): VerifiedMotionStudioUploadedAudioInput {
  const parsed = parseMotionStudioPcmWave(input.bytes)
  const identity = input.identitySuffix.replace(/[^A-Za-z0-9._:-]/gu, '-').slice(0, 120)
  const valueWithoutBinding = {
    role: input.role,
    stemId: `integrated-${identity}`,
    mediaAssetId: `private-${identity}`,
    uploadIntentId: `server-compiled-${identity}`,
    storageObjectRecordId: `private-readback-${identity}`,
    authorityRevision: 1,
    authorityChecksumSha256: sha256CanonicalJson({ identity, role: input.role, kind: 'compiled_input' }),
    storageIdentityHash: sha256CanonicalJson({ identity, checksumSha256: input.checksumSha256, private: true }),
    checksumSha256: input.checksumSha256,
    byteLength: input.bytes.byteLength,
    mimeType: 'audio/wav' as const,
    audioCodec: 'pcm_s16le' as const,
    sampleRateHertz: 48_000 as const,
    channelCount: parsed.channelCount,
    sampleCountPerChannel: parsed.sampleCountPerChannel,
    durationMilliseconds: parsed.durationMilliseconds,
    startFrame: input.startFrame,
    endFrame: input.endFrame,
    cueAuthorityId: input.cueAuthorityId,
    cueReason: input.cueReason,
    rightsEvidenceId: input.rightsEvidenceId,
  }
  return {
    ...valueWithoutBinding,
    bindingHash: sha256CanonicalJson(valueWithoutBinding),
    bytes: input.bytes,
  }
}

function assertNarrationAuthority(
  request: MotionStudioIntegratedMixRequestV1,
  artifact: MotionStudioNarrationAssemblyArtifactV1,
  quality: MotionStudioNarrationAssemblyQualityReportV1,
  bytes: Buffer,
): void {
  const narration = request.inputs.find((entry) => entry.role === 'narration')
  if (
    !narration || request.narrationAssemblyArtifactId !== artifact.artifactId ||
    request.narrationAssemblyArtifactVersionId !== artifact.artifactVersionId ||
    request.narrationAssemblyArtifactChecksumSha256 !== artifact.checksumSha256 ||
    request.narrationAssemblyQualityReportId !== quality.qualityReportId ||
    !request.narrationAssemblyAllBlockingGatesPassed || !quality.allBlockingGatesPassed ||
    !quality.integratedMixInputEligible || quality.narrationAssemblyArtifactId !== artifact.artifactId ||
    quality.narrationAssemblyArtifactVersionId !== artifact.artifactVersionId ||
    quality.narrationAssemblyChecksumSha256 !== artifact.checksumSha256 ||
    request.approvedSnapshotId !== artifact.approvedSnapshotId ||
    request.approvedSnapshotDigest !== artifact.approvedSnapshotDigest ||
    request.timingAuthority.timingAuthorityDigest !== artifact.timingAuthorityDigest ||
    narration.sourceId !== artifact.artifactVersionId || narration.assetVersionId !== artifact.artifactVersionId ||
    narration.checksumSha256 !== artifact.checksumSha256 || bytes.byteLength !== artifact.byteLength ||
    sha256(bytes) !== artifact.checksumSha256
  ) blocked('Integrated mix requires the exact passed private narration assembly authority.')
  const parsed = parseMotionStudioPcmWave(bytes)
  if (
    parsed.channelCount !== 1 || parsed.sampleCountPerChannel !== request.output.sampleCountPerChannel ||
    artifact.sampleCountPerChannel !== request.output.sampleCountPerChannel ||
    artifact.durationFrames !== request.output.durationFrames
  ) blocked('Narration assembly media facts do not match the integrated mix request.')
}

function verifySelectedSource(
  authority: MotionStudioIntegratedMixInputV1,
  source: MotionStudioSelectedStemPrivateInputV1,
): void {
  if (
    source.assetVersionId !== authority.assetVersionId ||
    source.checksumSha256 !== authority.checksumSha256 ||
    source.byteLength !== source.bytes.byteLength || sha256(source.bytes) !== source.checksumSha256
  ) blocked('Selected stem bytes do not match exact immutable input authority.')
  parseMotionStudioPcmWave(source.bytes)
}

function parseRequest(value: unknown): MotionStudioIntegratedMixRequestV1 {
  const parsed = motionStudioIntegratedMixRequestV1Schema.safeParse(value)
  if (!parsed.success) blocked('Integrated audio mix request is invalid or incomplete.')
  if (![24, 30].includes(parsed.data.timingAuthority.frameRate)) {
    blocked('Integrated audio mix requires the registered 24 or 30 fps timing authority.')
  }
  return parsed.data
}

function parseNarrationArtifact(value: unknown): MotionStudioNarrationAssemblyArtifactV1 {
  const parsed = motionStudioNarrationAssemblyArtifactV1Schema.safeParse(value)
  if (!parsed.success) blocked('Private narration assembly artifact authority is invalid.')
  return parsed.data
}

function parseNarrationQuality(value: unknown): MotionStudioNarrationAssemblyQualityReportV1 {
  const parsed = motionStudioNarrationAssemblyQualityReportV1Schema.safeParse(value)
  if (!parsed.success) blocked('Private narration assembly quality authority is invalid.')
  return parsed.data
}

function safeVerifiedInput(input: VerifiedMotionStudioUploadedAudioInput) {
  const { bytes, ...safe } = input
  void bytes
  return safe
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_storytelling_selected_audio_mix_v1',
  })
}
