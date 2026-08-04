import { createHash } from 'node:crypto'

import {
  motionStudioNarrationAssemblyManifestV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioNarrationAssemblyArtifactV1,
  MotionStudioNarrationAssemblyManifestV1,
  MotionStudioNarrationAssemblyQualityReportV1,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_NARRATION_ASSEMBLY_ARTIFACT_VERSION,
  MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES,
  MOTION_STUDIO_NARRATION_ASSEMBLY_QUALITY_VERSION,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { encodeMotionStudioPcmWave, parseMotionStudioPcmWave } from './pcm-wave'

const PROFILE_BODY = Object.freeze({
  profileId: 'motion_studio_storytelling_narration_assembly_v1' as const,
  profileVersion: '1.0.0' as const,
  sampleRateHertz: 48_000 as const,
  outputChannelCount: 1 as const,
  bitsPerSample: 16 as const,
  maximumDurationSeconds: 120 as const,
  preserveApprovedSilence: true as const,
  timeScaleAllowed: false as const,
  hiddenCrossfadeAllowed: false as const,
  overlappingNarrationAllowed: false as const,
})

export const MOTION_STUDIO_NARRATION_ASSEMBLY_PROFILE = Object.freeze({
  ...PROFILE_BODY,
  profileDigest: sha256CanonicalJson(PROFILE_BODY),
})

export interface MotionStudioNarrationTakePrivateInputV1 {
  selectedTakeId: string
  assetVersionId: string
  checksumSha256: string
  byteLength: number
  bytes: Buffer
}

export interface MotionStudioNarrationAssemblyCandidateV1 {
  schemaVersion: 'motion-studio.narration-assembly-candidate.v1'
  narrationAssemblyManifestId: string
  narrationAssemblyManifestDigest: string
  selectionManifestId: string
  selectionManifestDigest: string
  profileId: typeof PROFILE_BODY.profileId
  profileDigest: string
  segmentMapDigest: string
  inputEvidenceDigest: string
  bytes: Buffer
  checksumSha256: string
  byteLength: number
  sampleCountPerChannel: number
  durationFrames: number
  frameRate: 24 | 30
  samplePeakDbfs: number
  rmsDbfs: number
  approvedSilenceSampleCount: number
  providerCallMade: false
  timelineMutationPerformed: false
  renderPerformed: false
  exportPerformed: false
}

export interface FinalizeMotionStudioNarrationAssemblyInputV1 {
  manifest: MotionStudioNarrationAssemblyManifestV1
  candidate: MotionStudioNarrationAssemblyCandidateV1
  privateReadbackBytes: Buffer
  artifactId: string
  artifactVersionId: string
  qualityReportId: string
  executionAttemptId: string
  createdAt: string
}

export interface FinalizedMotionStudioNarrationAssemblyV1 {
  artifact: MotionStudioNarrationAssemblyArtifactV1
  qualityReport: MotionStudioNarrationAssemblyQualityReportV1
  privateBytes: Buffer
  evidence: {
    candidateDigest: string
    privateReadbackDigest: string
    qaEvidenceDigest: string
    providerCallMade: false
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    walletMutationPerformed: false
    billingMutationPerformed: false
  }
}

export function assembleMotionStudioNarrationV1(input: {
  manifest: unknown
  selectedTakes: readonly MotionStudioNarrationTakePrivateInputV1[]
}): MotionStudioNarrationAssemblyCandidateV1 {
  const manifest = parseManifest(input.manifest)
  if (manifest.profileDigest !== MOTION_STUDIO_NARRATION_ASSEMBLY_PROFILE.profileDigest) {
    blocked('Narration assembly profile identity does not match the registered deterministic profile.')
  }
  if (![24, 30].includes(manifest.timingAuthority.frameRate)) {
    blocked('Narration assembly requires the registered 24 or 30 fps timing authority.')
  }
  if (manifest.durationFrames > manifest.timingAuthority.frameRate * PROFILE_BODY.maximumDurationSeconds) {
    blocked('Narration assembly exceeds the registered private profile duration.')
  }
  const byTakeId = new Map<string, MotionStudioNarrationTakePrivateInputV1>()
  for (const source of input.selectedTakes) {
    if (byTakeId.has(source.selectedTakeId)) blocked('Narration source take identities must be unique.')
    byTakeId.set(source.selectedTakeId, source)
  }
  if (byTakeId.size !== manifest.segments.length ||
    manifest.segments.some((segment) => !byTakeId.has(segment.selectedTakeId))) {
    blocked('Narration source bytes must exactly cover the approved assembly segments.')
  }

  const totalSamples = manifest.sampleCountPerChannel
  const output = new Int16Array(totalSamples)
  const occupied = new Uint8Array(totalSamples)
  const inputEvidence: Array<Record<string, unknown>> = []

  for (const segment of manifest.segments) {
    const sourceAuthority = byTakeId.get(segment.selectedTakeId)
    if (!sourceAuthority) blocked('An approved narration take is unavailable.')
    const source = parseAndVerifySource(sourceAuthority, segment)
    const sourceStart = segment.sourceSampleRange.startSampleInclusive
    const sourceEnd = segment.sourceSampleRange.endSampleExclusive
    const destinationStart = segment.destination.startSampleInclusive
    const destinationEnd = segment.destination.endSampleExclusive
    if (sourceEnd - sourceStart !== destinationEnd - destinationStart) {
      blocked('Narration assembly cannot time-scale, truncate, or stretch approved speech.')
    }
    for (let offset = 0; offset < destinationEnd - destinationStart; offset += 1) {
      const destinationIndex = destinationStart + offset
      if (occupied[destinationIndex]) blocked('Narration assembly cannot overlap approved speech segments.')
      occupied[destinationIndex] = 1
      const sourceIndex = (sourceStart + offset) * source.channelCount
      const mono = source.channelCount === 1
        ? source.interleavedSamples[sourceIndex]!
        : Math.round((source.interleavedSamples[sourceIndex]! + source.interleavedSamples[sourceIndex + 1]!) / 2)
      output[destinationIndex] = clampInt16(mono)
    }
    inputEvidence.push({
      selectedTakeId: segment.selectedTakeId,
      sourceAssetVersionId: segment.sourceAssetVersionId,
      sourceChecksumSha256: segment.sourceChecksumSha256,
      sourceSampleRange: segment.sourceSampleRange,
      destination: segment.destination,
      spokenTextDigest: segment.spokenTextDigest,
      alignmentEvidenceId: segment.alignmentEvidenceId,
      alignmentEvidenceDigest: segment.alignmentEvidenceDigest,
    })
  }

  const bytes = encodeMotionStudioPcmWave({ channelCount: 1, interleavedSamples: output })
  const checksumSha256 = sha256(bytes)
  const samplePeakDbfs = peakDbfs(output)
  const rmsDbfs = rootMeanSquareDbfs(output)
  if (!Number.isFinite(rmsDbfs) || rmsDbfs < -70 || samplePeakDbfs > -0.0001) {
    blocked('Narration assembly failed the local silence or clipping preflight.')
  }
  const narrationAssemblyManifestDigest = sha256CanonicalJson(manifest)
  const candidateWithoutBytes = {
    schemaVersion: 'motion-studio.narration-assembly-candidate.v1' as const,
    narrationAssemblyManifestId: manifest.narrationAssemblyManifestId,
    narrationAssemblyManifestDigest,
    selectionManifestId: manifest.selectionManifestId,
    selectionManifestDigest: manifest.selectionManifestDigest,
    profileId: MOTION_STUDIO_NARRATION_ASSEMBLY_PROFILE.profileId,
    profileDigest: MOTION_STUDIO_NARRATION_ASSEMBLY_PROFILE.profileDigest,
    segmentMapDigest: sha256CanonicalJson(manifest.segments),
    inputEvidenceDigest: sha256CanonicalJson(inputEvidence),
    checksumSha256,
    byteLength: bytes.byteLength,
    sampleCountPerChannel: totalSamples,
    durationFrames: manifest.durationFrames,
    frameRate: manifest.timingAuthority.frameRate as 24 | 30,
    samplePeakDbfs,
    rmsDbfs,
    approvedSilenceSampleCount: occupied.reduce((count, entry) => count + (entry === 0 ? 1 : 0), 0),
    providerCallMade: false as const,
    timelineMutationPerformed: false as const,
    renderPerformed: false as const,
    exportPerformed: false as const,
  }
  return { ...candidateWithoutBytes, bytes }
}

export function finalizeMotionStudioNarrationAssemblyV1(
  input: FinalizeMotionStudioNarrationAssemblyInputV1,
): FinalizedMotionStudioNarrationAssemblyV1 {
  const manifest = parseManifest(input.manifest)
  const candidate = input.candidate
  if (
    candidate.narrationAssemblyManifestId !== manifest.narrationAssemblyManifestId ||
    candidate.narrationAssemblyManifestDigest !== sha256CanonicalJson(manifest) ||
    candidate.selectionManifestId !== manifest.selectionManifestId ||
    candidate.selectionManifestDigest !== manifest.selectionManifestDigest ||
    candidate.profileId !== manifest.profileId || candidate.profileDigest !== manifest.profileDigest ||
    candidate.segmentMapDigest !== sha256CanonicalJson(manifest.segments) ||
    candidate.checksumSha256 !== sha256(candidate.bytes) ||
    candidate.byteLength !== candidate.bytes.byteLength ||
    input.privateReadbackBytes.byteLength !== candidate.byteLength ||
    sha256(input.privateReadbackBytes) !== candidate.checksumSha256 ||
    !input.privateReadbackBytes.equals(candidate.bytes)
  ) blocked('Narration assembly private readback does not match exact candidate authority.')

  const parsedReadback = parseMotionStudioPcmWave(input.privateReadbackBytes)
  if (
    parsedReadback.channelCount !== 1 || parsedReadback.sampleRateHertz !== 48_000 ||
    parsedReadback.sampleCountPerChannel !== manifest.sampleCountPerChannel ||
    candidate.durationFrames !== manifest.durationFrames ||
    candidate.frameRate !== manifest.timingAuthority.frameRate
  ) blocked('Narration assembly readback media facts changed after deterministic execution.')

  const artifact: MotionStudioNarrationAssemblyArtifactV1 = {
    workspaceId: manifest.workspaceId,
    projectId: manifest.projectId,
    editSessionId: manifest.editSessionId,
    schemaVersion: MOTION_STUDIO_NARRATION_ASSEMBLY_ARTIFACT_VERSION,
    moduleId: 'storytelling',
    productionId: manifest.productionId,
    artifactId: input.artifactId,
    artifactVersionId: input.artifactVersionId,
    narrationAssemblyManifestId: manifest.narrationAssemblyManifestId,
    narrationAssemblyManifestDigest: candidate.narrationAssemblyManifestDigest,
    selectionManifestId: manifest.selectionManifestId,
    selectionManifestVersion: manifest.selectionManifestVersion,
    selectionManifestDigest: manifest.selectionManifestDigest,
    approvedSnapshotId: manifest.approvedSnapshotId,
    approvedSnapshotDigest: manifest.approvedSnapshotDigest,
    executionAttemptId: input.executionAttemptId,
    profileId: manifest.profileId,
    profileDigest: manifest.profileDigest,
    segmentMapDigest: candidate.segmentMapDigest,
    contentDigest: sha256CanonicalJson({
      candidateDigest: candidateDigest(candidate),
      privateReadbackChecksumSha256: candidate.checksumSha256,
    }),
    checksumSha256: candidate.checksumSha256,
    byteLength: candidate.byteLength,
    mimeType: 'audio/wav',
    codec: 'pcm_s16le',
    sampleRateHertz: 48_000,
    channelCount: 1,
    sampleCountPerChannel: candidate.sampleCountPerChannel,
    durationFrames: candidate.durationFrames,
    frameRate: candidate.frameRate,
    timingAuthorityDigest: manifest.timingAuthority.timingAuthorityDigest,
    privateAsset: true,
    createOnly: true,
    checksumVerified: true,
    privateReadbackVerified: true,
    providerUrlPersisted: false,
    localPathProjected: false,
    qaStatus: 'pending_independent_qa',
    integratedMixInputEligible: false,
    timelineReady: false,
    renderReady: false,
    exportReady: false,
    productReady: false,
    createdAt: input.createdAt,
    immutable: true,
  }

  const gateResults = MOTION_STUDIO_NARRATION_ASSEMBLY_QA_GATES.map((gate) => {
    const evidenceDigest = sha256CanonicalJson({
      gate,
      narrationAssemblyManifestDigest: candidate.narrationAssemblyManifestDigest,
      artifactChecksumSha256: artifact.checksumSha256,
      segmentMapDigest: artifact.segmentMapDigest,
      inputEvidenceDigest: candidate.inputEvidenceDigest,
      samplePeakDbfs: candidate.samplePeakDbfs,
      rmsDbfs: candidate.rmsDbfs,
      approvedSilenceSampleCount: candidate.approvedSilenceSampleCount,
    })
    return {
      gate,
      result: 'passed' as const,
      blocking: true as const,
      evidenceId: `narration-qa-${gate}-${evidenceDigest.slice(0, 12)}`,
      evidenceDigest,
      note: `Private narration ${gate} evidence passed.`,
    }
  })
  const qualityReport: MotionStudioNarrationAssemblyQualityReportV1 = {
    workspaceId: manifest.workspaceId,
    projectId: manifest.projectId,
    editSessionId: manifest.editSessionId,
    schemaVersion: MOTION_STUDIO_NARRATION_ASSEMBLY_QUALITY_VERSION,
    moduleId: 'storytelling',
    productionId: manifest.productionId,
    qualityReportId: input.qualityReportId,
    narrationAssemblyManifestId: manifest.narrationAssemblyManifestId,
    narrationAssemblyManifestDigest: candidate.narrationAssemblyManifestDigest,
    narrationAssemblyArtifactId: artifact.artifactId,
    narrationAssemblyArtifactVersionId: artifact.artifactVersionId,
    narrationAssemblyChecksumSha256: artifact.checksumSha256,
    selectionManifestId: manifest.selectionManifestId,
    approvedSnapshotId: manifest.approvedSnapshotId,
    approvedSnapshotDigest: manifest.approvedSnapshotDigest,
    timingAuthorityDigest: manifest.timingAuthority.timingAuthorityDigest,
    gateResults,
    allBlockingGatesPassed: true,
    integratedMixInputEligible: true,
    manualOverrideAllowed: false,
    timelineReady: false,
    renderReady: false,
    exportReady: false,
    productReady: false,
    reviewedAt: input.createdAt,
    immutable: true,
  }
  return {
    artifact,
    qualityReport,
    privateBytes: Buffer.from(input.privateReadbackBytes),
    evidence: {
      candidateDigest: candidateDigest(candidate),
      privateReadbackDigest: sha256CanonicalJson({
        checksumSha256: artifact.checksumSha256,
        byteLength: artifact.byteLength,
        sampleCountPerChannel: artifact.sampleCountPerChannel,
      }),
      qaEvidenceDigest: sha256CanonicalJson(qualityReport),
      providerCallMade: false,
      customerPriceIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
      walletMutationPerformed: false,
      billingMutationPerformed: false,
    },
  }
}

function parseManifest(value: unknown): MotionStudioNarrationAssemblyManifestV1 {
  const parsed = motionStudioNarrationAssemblyManifestV1Schema.safeParse(value)
  if (!parsed.success) blocked('Narration assembly manifest is invalid or incomplete.')
  return parsed.data
}

function parseAndVerifySource(
  authority: MotionStudioNarrationTakePrivateInputV1,
  segment: MotionStudioNarrationAssemblyManifestV1['segments'][number],
) {
  if (
    authority.assetVersionId !== segment.sourceAssetVersionId ||
    authority.checksumSha256 !== segment.sourceChecksumSha256 ||
    authority.byteLength !== authority.bytes.byteLength ||
    sha256(authority.bytes) !== authority.checksumSha256
  ) blocked('Narration take bytes do not match the approved private asset version.')
  const source = parseMotionStudioPcmWave(authority.bytes)
  if (segment.sourceSampleRange.endSampleExclusive > source.sampleCountPerChannel) {
    blocked('Narration take source range exceeds the exact private PCM asset.')
  }
  return source
}

function candidateDigest(candidate: MotionStudioNarrationAssemblyCandidateV1): string {
  const { bytes, ...evidence } = candidate
  void bytes
  return sha256CanonicalJson(evidence)
}

function clampInt16(value: number): number {
  return Math.max(-32_768, Math.min(32_767, value))
}

function peakDbfs(samples: Int16Array): number {
  let peak = 0
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample / 32_768))
  return rounded(20 * Math.log10(Math.max(peak, Number.EPSILON)))
}

function rootMeanSquareDbfs(samples: Int16Array): number {
  let sum = 0
  for (const sample of samples) sum += (sample / 32_768) ** 2
  const rms = Math.sqrt(sum / samples.length)
  return rounded(20 * Math.log10(Math.max(rms, Number.EPSILON)))
}

function rounded(value: number): number {
  return Number(value.toFixed(6))
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_storytelling_narration_assembly_v1',
  })
}
