import { createHash } from 'node:crypto'

import {
  motionStudioAudioSelectionManifestV1Schema,
  motionStudioIntegratedMixArtifactV1Schema,
  motionStudioIntegratedMixQualityReportV1Schema,
  motionStudioIntegratedMixRequestV1Schema,
  motionStudioNarrationAssemblyArtifactV1Schema,
  motionStudioNarrationAssemblyManifestV1Schema,
  motionStudioNarrationAssemblyQualityReportV1Schema,
} from '../../../src/lib/motion-studio/contracts'
import type {
  MotionStudioAudioSelectionManifestV1,
  MotionStudioIntegratedMixArtifactV1,
  MotionStudioIntegratedMixQaGate,
  MotionStudioIntegratedMixQualityReportV1,
  MotionStudioIntegratedMixRequestV1,
  MotionStudioNarrationAssemblyArtifactV1,
  MotionStudioNarrationAssemblyManifestV1,
  MotionStudioNarrationAssemblyQualityReportV1,
  MotionStudioOptionalAudioRole,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_INTEGRATED_MIX_ARTIFACT_VERSION,
  MOTION_STUDIO_INTEGRATED_MIX_QA_GATES,
  MOTION_STUDIO_INTEGRATED_MIX_QUALITY_VERSION,
} from '../../../src/types/motion-studio'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import { parseMotionStudioPcmWave } from './pcm-wave'
import type { MotionStudioSelectedAudioMixRuntimeResultV1 } from './selected-audio-mix-runtime'

export interface FinalizeMotionStudioIntegratedMixInputV1 {
  selectionManifest: unknown
  narrationAssemblyManifest: unknown
  narrationAssemblyArtifact: unknown
  narrationAssemblyQualityReport: unknown
  integratedMixRequest: unknown
  runtimeResult: MotionStudioSelectedAudioMixRuntimeResultV1
  privateReadbackBytes: Buffer
  artifactId: string
  artifactVersionId: string
  qualityReportId: string
  createdAt: string
}

export interface FinalizedMotionStudioIntegratedMixV1 {
  artifact: MotionStudioIntegratedMixArtifactV1
  qualityReport: MotionStudioIntegratedMixQualityReportV1
  privateBytes: Buffer
  evidence: {
    selectionManifestDigest: string
    narrationAssemblyManifestDigest: string
    narrationAssemblyQualityReportDigest: string
    integratedMixRequestDigest: string
    runtimeEvidenceDigest: string
    privateReadbackDigest: string
    qualityReportDigest: string
    providerCallMade: false
    automaticRetryPerformed: false
    automaticFallbackPerformed: false
    automaticSubstitutionPerformed: false
    customerPriceIncluded: false
    customerCreditsIncluded: false
    serviceFeeIncluded: false
    walletMutationPerformed: false
    billingMutationPerformed: false
    timelineMutationPerformed: false
    videoMuxPerformed: false
    renderPerformed: false
    exportPerformed: false
  }
}

const LEGACY_RUNTIME_GATES = Object.freeze([
  'file_integrity',
  'format',
  'duration_sync',
  'integrated_loudness',
  'true_peak',
  'sample_clipping',
  'cue_timing',
  'speech_priority',
  'rights_provenance',
] as const)

export function finalizeMotionStudioIntegratedMixV1(
  input: FinalizeMotionStudioIntegratedMixInputV1,
): FinalizedMotionStudioIntegratedMixV1 {
  const selection = parseSelectionManifest(input.selectionManifest)
  const narrationManifest = parseNarrationManifest(input.narrationAssemblyManifest)
  const narrationArtifact = parseNarrationArtifact(input.narrationAssemblyArtifact)
  const narrationQuality = parseNarrationQuality(input.narrationAssemblyQualityReport)
  const request = parseIntegratedMixRequest(input.integratedMixRequest)
  const selectionManifestDigest = sha256CanonicalJson(selection)
  const narrationAssemblyManifestDigest = sha256CanonicalJson(narrationManifest)
  const narrationAssemblyQualityReportDigest = sha256CanonicalJson(narrationQuality)
  const integratedMixRequestDigest = sha256CanonicalJson(request)

  assertScopeAndLineage({
    selection,
    selectionManifestDigest,
    narrationManifest,
    narrationAssemblyManifestDigest,
    narrationArtifact,
    narrationQuality,
    narrationAssemblyQualityReportDigest,
    request,
  })
  assertSelectedInputs(selection, request)
  assertRuntimeResult(request, input.runtimeResult, input.privateReadbackBytes)

  const runtime = input.runtimeResult.result
  const privateReadback = parseMotionStudioPcmWave(input.privateReadbackBytes)
  const runtimeEvidenceDigest = sha256CanonicalJson({
    inputEvidenceDigest: input.runtimeResult.inputEvidenceDigest,
    optionalSilenceRoles: input.runtimeResult.optionalSilenceRoles,
    sourceInputCount: input.runtimeResult.sourceInputCount,
    collapsedRoleCount: input.runtimeResult.collapsedRoleCount,
    artifactSha256: runtime.artifact.sha256,
    artifactByteLength: runtime.artifact.byteLength,
    qualityEvidenceDigest: runtime.quality.qaEvidenceDigest,
    runtimeIdentityDigest: runtime.evidence.runtimeIdentityDigest,
    normalizationAttestationDigest: runtime.evidence.normalizationAttestationDigest,
    measurementAttestationDigest: runtime.evidence.measurementAttestationDigest,
    probeAttestationDigest: runtime.evidence.probeAttestationDigest,
  })
  const privateReadbackDigest = sha256CanonicalJson({
    checksumSha256: runtime.artifact.sha256,
    byteLength: runtime.artifact.byteLength,
    sampleRateHertz: privateReadback.sampleRateHertz,
    channelCount: privateReadback.channelCount,
    sampleCountPerChannel: privateReadback.sampleCountPerChannel,
  })

  const artifactCandidate: MotionStudioIntegratedMixArtifactV1 = {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    schemaVersion: MOTION_STUDIO_INTEGRATED_MIX_ARTIFACT_VERSION,
    moduleId: 'storytelling',
    productionId: request.productionId,
    artifactId: input.artifactId,
    artifactVersionId: input.artifactVersionId,
    integratedMixRequestId: request.integratedMixRequestId,
    approvedSnapshotId: request.approvedSnapshotId,
    approvedSnapshotDigest: request.approvedSnapshotDigest,
    selectionManifestId: request.selectionManifestId,
    selectionManifestDigest,
    narrationAssemblyArtifactId: narrationArtifact.artifactId,
    narrationAssemblyArtifactVersionId: narrationArtifact.artifactVersionId,
    narrationAssemblyArtifactChecksumSha256: narrationArtifact.checksumSha256,
    inputManifestDigest: integratedMixRequestDigest,
    executionAttemptId: request.execution.attemptId,
    profileId: request.profileId,
    profileDigest: request.profileDigest,
    contentDigest: sha256CanonicalJson({
      integratedMixRequestDigest,
      checksumSha256: runtime.artifact.sha256,
      byteLength: runtime.artifact.byteLength,
      sampleRateHertz: runtime.artifact.sampleRateHertz,
      channelCount: runtime.artifact.channelCount,
      sampleCountPerChannel: runtime.artifact.sampleCountPerChannel,
    }),
    checksumSha256: runtime.artifact.sha256,
    byteLength: runtime.artifact.byteLength,
    mimeType: 'audio/wav',
    codec: 'pcm_s16le',
    sampleRateHertz: 48_000,
    channelCount: 2,
    sampleCountPerChannel: runtime.artifact.sampleCountPerChannel,
    durationFrames: request.output.durationFrames,
    frameRate: request.timingAuthority.frameRate,
    timingAuthorityDigest: request.timingAuthority.timingAuthorityDigest,
    privateAsset: true,
    createOnly: true,
    checksumVerified: true,
    privateReadbackVerified: true,
    providerUrlPersisted: false,
    localPathProjected: false,
    privateReviewOnly: true,
    finalVideoReady: false,
    timelineReady: false,
    exportReady: false,
    productReady: false,
    createdAt: input.createdAt,
    immutable: true,
  }
  const artifact = parseIntegratedMixArtifact(artifactCandidate)
  const gateEvidence = buildGateEvidence({
    selection,
    narrationManifest,
    narrationArtifact,
    narrationQuality,
    request,
    artifact,
    runtimeResult: input.runtimeResult,
    selectionManifestDigest,
    narrationAssemblyManifestDigest,
    narrationAssemblyQualityReportDigest,
    integratedMixRequestDigest,
    runtimeEvidenceDigest,
    privateReadbackDigest,
  })
  const gateResults = MOTION_STUDIO_INTEGRATED_MIX_QA_GATES.map((gate) => {
    const evidenceDigest = sha256CanonicalJson(gateEvidence[gate])
    return {
      gate,
      result: 'passed' as const,
      blocking: true as const,
      evidenceId: `integrated-mix-qa-${gate}-${evidenceDigest.slice(0, 12)}`,
      evidenceDigest,
      note: `Private integrated mix ${gate} evidence passed.`,
    }
  })
  const qualityCandidate: MotionStudioIntegratedMixQualityReportV1 = {
    workspaceId: request.workspaceId,
    projectId: request.projectId,
    editSessionId: request.editSessionId,
    schemaVersion: MOTION_STUDIO_INTEGRATED_MIX_QUALITY_VERSION,
    moduleId: 'storytelling',
    productionId: request.productionId,
    qualityReportId: input.qualityReportId,
    integratedMixRequestId: request.integratedMixRequestId,
    approvedSnapshotId: request.approvedSnapshotId,
    approvedSnapshotDigest: request.approvedSnapshotDigest,
    integratedMixArtifactId: artifact.artifactId,
    integratedMixArtifactVersionId: artifact.artifactVersionId,
    integratedMixChecksumSha256: artifact.checksumSha256,
    selectionManifestId: selection.selectionManifestId,
    narrationAssemblyManifestId: narrationManifest.narrationAssemblyManifestId,
    timingAuthorityDigest: request.timingAuthority.timingAuthorityDigest,
    integratedLufs: runtime.quality.integratedLufs,
    truePeakDbtp: runtime.quality.truePeakDbfs,
    samplePeakDbfs: runtime.quality.samplePeakDbfs,
    speechPriorityRatio: runtime.quality.speechPriorityRatio,
    gateResults,
    allBlockingGatesPassed: true,
    readyForHumanReview: true,
    manualOverrideAllowed: false,
    timelineReady: false,
    finalVideoReady: false,
    exportReady: false,
    productReady: false,
    reviewedAt: input.createdAt,
    immutable: true,
  }
  const qualityReport = parseIntegratedMixQuality(qualityCandidate)

  return Object.freeze({
    artifact,
    qualityReport,
    privateBytes: Buffer.from(input.privateReadbackBytes),
    evidence: Object.freeze({
      selectionManifestDigest,
      narrationAssemblyManifestDigest,
      narrationAssemblyQualityReportDigest,
      integratedMixRequestDigest,
      runtimeEvidenceDigest,
      privateReadbackDigest,
      qualityReportDigest: sha256CanonicalJson(qualityReport),
      providerCallMade: false,
      automaticRetryPerformed: false,
      automaticFallbackPerformed: false,
      automaticSubstitutionPerformed: false,
      customerPriceIncluded: false,
      customerCreditsIncluded: false,
      serviceFeeIncluded: false,
      walletMutationPerformed: false,
      billingMutationPerformed: false,
      timelineMutationPerformed: false,
      videoMuxPerformed: false,
      renderPerformed: false,
      exportPerformed: false,
    }),
  })
}

function buildGateEvidence(input: {
  selection: MotionStudioAudioSelectionManifestV1
  narrationManifest: MotionStudioNarrationAssemblyManifestV1
  narrationArtifact: MotionStudioNarrationAssemblyArtifactV1
  narrationQuality: MotionStudioNarrationAssemblyQualityReportV1
  request: MotionStudioIntegratedMixRequestV1
  artifact: MotionStudioIntegratedMixArtifactV1
  runtimeResult: MotionStudioSelectedAudioMixRuntimeResultV1
  selectionManifestDigest: string
  narrationAssemblyManifestDigest: string
  narrationAssemblyQualityReportDigest: string
  integratedMixRequestDigest: string
  runtimeEvidenceDigest: string
  privateReadbackDigest: string
}): Record<MotionStudioIntegratedMixQaGate, unknown> {
  const selectedRecords = [
    ...input.selection.selectedNarration,
    ...input.selection.optionalRoleDecisions.flatMap((decision) => decision.selections),
  ]
  const candidateEvidence = selectedRecords.map((record) => ({
    candidateId: 'selectedTakeId' in record ? record.selectedTakeId : record.candidateId,
    candidateEvidence: record.candidateAuthority.candidateEvidence,
    reviewEvidence: record.candidateAuthority.reviewEvidence,
    qaEvidence: record.candidateAuthority.qaEvidence,
    rightsEvidence: record.candidateAuthority.rightsEvidence,
    consentEvidence: record.candidateAuthority.consentEvidence,
    disclosureEvidence: record.candidateAuthority.disclosureEvidence,
    provenanceEvidence: record.candidateAuthority.provenanceEvidence,
  }))
  const roleDecisions = Object.fromEntries(input.selection.optionalRoleDecisions.map((decision) => [
    decision.role,
    {
      decision: decision.decision,
      decisionEvidenceId: decision.decisionEvidenceId,
      selections: decision.selections.map((selection) => ({
        selectedStemId: selection.selectedStemId,
        candidateId: selection.candidateId,
        placement: selection.placement,
        cueAuthorityIds: selection.cueAuthorityIds,
        soundEventAuthorityIds: selection.soundEventAuthorityIds,
        reviewEvidence: selection.candidateAuthority.reviewEvidence,
        qaEvidence: selection.candidateAuthority.qaEvidence,
      })),
    },
  ])) as Record<MotionStudioOptionalAudioRole, unknown>
  const runtime = input.runtimeResult.result

  return {
    input_manifest_integrity: {
      selectionManifestDigest: input.selectionManifestDigest,
      integratedMixRequestDigest: input.integratedMixRequestDigest,
      selectedInputCount: input.request.inputs.length,
      runtimeInputEvidenceDigest: input.runtimeResult.inputEvidenceDigest,
      runtimeInputDigest: runtime.evidence.inputDigest,
    },
    narration_assembly_integrity: {
      narrationAssemblyManifestDigest: input.narrationAssemblyManifestDigest,
      narrationAssemblyArtifactId: input.narrationArtifact.artifactId,
      narrationAssemblyArtifactVersionId: input.narrationArtifact.artifactVersionId,
      narrationAssemblyChecksumSha256: input.narrationArtifact.checksumSha256,
      narrationAssemblyQualityReportDigest: input.narrationAssemblyQualityReportDigest,
      narrationAssemblyGateResults: input.narrationQuality.gateResults,
    },
    output_media_integrity: {
      checksumSha256: input.artifact.checksumSha256,
      byteLength: input.artifact.byteLength,
      sampleRateHertz: input.artifact.sampleRateHertz,
      channelCount: input.artifact.channelCount,
      probeAttestationDigest: runtime.evidence.probeAttestationDigest,
    },
    duration_sample_clock: {
      durationFrames: input.artifact.durationFrames,
      frameRate: input.artifact.frameRate,
      sampleCountPerChannel: input.artifact.sampleCountPerChannel,
      timingAuthorityDigest: input.artifact.timingAuthorityDigest,
      runtimeDurationGate: runtime.quality.gateResults.find((gate) => gate.gate === 'duration_sync'),
    },
    narration_completeness_alignment: {
      approvedVoiceSegmentIds: input.selection.approvedVoiceSegmentIds,
      narrationSegments: input.narrationManifest.segments,
      narrationQa: input.narrationQuality.gateResults.filter((gate) =>
        ['segment_order_coverage', 'alignment'].includes(gate.gate)),
    },
    pronunciation_voice_continuity: {
      narrationAuthorities: input.selection.selectedNarration.map((selection) => ({
        voiceSegmentId: selection.voiceSegmentId,
        pronunciationAuthorityDigest: selection.pronunciationAuthorityDigest,
        performanceAuthorityDigest: selection.performanceAuthorityDigest,
        reviewEvidence: selection.candidateAuthority.reviewEvidence,
        qaEvidence: selection.candidateAuthority.qaEvidence,
      })),
      narrationQa: input.narrationQuality.gateResults.find((gate) =>
        gate.gate === 'pronunciation_voice_continuity'),
    },
    speech_intelligibility_ducking: {
      speechPriorityRatio: runtime.quality.speechPriorityRatio,
      integratedLufs: runtime.quality.integratedLufs,
      truePeakDbfs: runtime.quality.truePeakDbfs,
      runtimeSpeechPriorityGate: runtime.quality.gateResults.find((gate) => gate.gate === 'speech_priority'),
      runtimeNormalizationAttestationDigest: runtime.evidence.normalizationAttestationDigest,
      runtimeMeasurementAttestationDigest: runtime.evidence.measurementAttestationDigest,
    },
    foley_ambience_sync_scope: {
      foley: roleDecisions.foley,
      ambience: roleDecisions.ambience,
      optionalSilenceRoles: input.runtimeResult.optionalSilenceRoles,
      runtimeCueTimingGate: runtime.quality.gateResults.find((gate) => gate.gate === 'cue_timing'),
    },
    exact_sfx_timing_rights: {
      exactSfx: roleDecisions.exact_sfx,
      approvedSoundEventIds: input.selection.soundEventAuthorityIds,
      runtimeCueTimingGate: runtime.quality.gateResults.find((gate) => gate.gate === 'cue_timing'),
      runtimeRightsGate: runtime.quality.gateResults.find((gate) => gate.gate === 'rights_provenance'),
    },
    loudness_true_peak: {
      integratedLufs: runtime.quality.integratedLufs,
      loudnessRangeLu: runtime.quality.loudnessRangeLu,
      truePeakDbfs: runtime.quality.truePeakDbfs,
      samplePeakDbfs: runtime.quality.samplePeakDbfs,
      runtimeLoudnessGate: runtime.quality.gateResults.find((gate) => gate.gate === 'integrated_loudness'),
      runtimeTruePeakGate: runtime.quality.gateResults.find((gate) => gate.gate === 'true_peak'),
      measurementAttestationDigest: runtime.evidence.measurementAttestationDigest,
    },
    clipping_silence_contamination: {
      samplePeakDbfs: runtime.quality.samplePeakDbfs,
      runtimeSampleClippingGate: runtime.quality.gateResults.find((gate) => gate.gate === 'sample_clipping'),
      optionalSilenceRoles: input.runtimeResult.optionalSilenceRoles,
      selectedCandidateQa: candidateEvidence.map((item) => ({
        candidateId: item.candidateId,
        qaEvidence: item.qaEvidence,
        reviewEvidence: item.reviewEvidence,
      })),
    },
    rights_consent_disclosure_provenance: {
      selectedCandidateEvidence: candidateEvidence,
      inputRightsEvidenceIds: input.request.inputs.flatMap((entry) => entry.rightsEvidenceIds),
      runtimeRightsGate: runtime.quality.gateResults.find((gate) => gate.gate === 'rights_provenance'),
    },
    picture_timing_compatibility: {
      pictureLockArtifactVersion: input.selection.pictureLockArtifactVersion,
      timingAuthority: input.selection.timingAuthority,
      requestTimingAuthority: input.request.timingAuthority,
      inputPlacements: input.request.inputs.map((entry) => ({
        sourceId: entry.sourceId,
        placement: entry.placement,
      })),
      candidateReviewEvidence: candidateEvidence.map((item) => item.reviewEvidence),
    },
    private_readback_identity: {
      checksumSha256: input.artifact.checksumSha256,
      byteLength: input.artifact.byteLength,
      privateReadbackDigest: input.privateReadbackDigest,
      runtimeEvidenceDigest: input.runtimeEvidenceDigest,
      providerUrlPersisted: false,
      localPathProjected: false,
    },
  }
}

function assertScopeAndLineage(input: {
  selection: MotionStudioAudioSelectionManifestV1
  selectionManifestDigest: string
  narrationManifest: MotionStudioNarrationAssemblyManifestV1
  narrationAssemblyManifestDigest: string
  narrationArtifact: MotionStudioNarrationAssemblyArtifactV1
  narrationQuality: MotionStudioNarrationAssemblyQualityReportV1
  narrationAssemblyQualityReportDigest: string
  request: MotionStudioIntegratedMixRequestV1
}): void {
  const records = [input.narrationManifest, input.narrationArtifact, input.narrationQuality, input.request]
  if (records.some((record) =>
    record.workspaceId !== input.selection.workspaceId || record.projectId !== input.selection.projectId ||
    record.editSessionId !== input.selection.editSessionId || record.productionId !== input.selection.productionId)) {
    blocked('Integrated audio finalization requires one exact Storytelling tenant and production scope.')
  }
  if (
    input.request.selectionManifestId !== input.selection.selectionManifestId ||
    input.request.selectionManifestVersion !== input.selection.selectionManifestVersion ||
    input.request.selectionManifestDigest !== input.selectionManifestDigest ||
    input.narrationManifest.selectionManifestId !== input.selection.selectionManifestId ||
    input.narrationManifest.selectionManifestDigest !== input.selectionManifestDigest ||
    input.narrationArtifact.selectionManifestId !== input.selection.selectionManifestId ||
    input.narrationArtifact.selectionManifestDigest !== input.selectionManifestDigest ||
    input.narrationQuality.selectionManifestId !== input.selection.selectionManifestId ||
    input.request.narrationAssemblyManifestId !== input.narrationManifest.narrationAssemblyManifestId ||
    input.request.narrationAssemblyManifestDigest !== input.narrationAssemblyManifestDigest ||
    input.narrationArtifact.narrationAssemblyManifestId !== input.narrationManifest.narrationAssemblyManifestId ||
    input.narrationArtifact.narrationAssemblyManifestDigest !== input.narrationAssemblyManifestDigest ||
    input.narrationQuality.narrationAssemblyManifestId !== input.narrationManifest.narrationAssemblyManifestId ||
    input.narrationQuality.narrationAssemblyManifestDigest !== input.narrationAssemblyManifestDigest ||
    input.request.narrationAssemblyArtifactId !== input.narrationArtifact.artifactId ||
    input.request.narrationAssemblyArtifactVersionId !== input.narrationArtifact.artifactVersionId ||
    input.request.narrationAssemblyArtifactChecksumSha256 !== input.narrationArtifact.checksumSha256 ||
    input.request.narrationAssemblyQualityReportId !== input.narrationQuality.qualityReportId ||
    input.request.narrationAssemblyQualityReportDigest !== input.narrationAssemblyQualityReportDigest ||
    !input.narrationQuality.allBlockingGatesPassed || !input.narrationQuality.integratedMixInputEligible ||
    input.selection.approvedSnapshotId !== input.request.approvedSnapshotId ||
    input.selection.approvedSnapshotDigest !== input.request.approvedSnapshotDigest ||
    input.selection.timingAuthority.timingAuthorityDigest !== input.request.timingAuthority.timingAuthorityDigest ||
    input.narrationArtifact.timingAuthorityDigest !== input.request.timingAuthority.timingAuthorityDigest
  ) blocked('Integrated audio finalization lineage does not match the exact selection, narration, snapshot, or timing authority.')
}

function assertSelectedInputs(
  selection: MotionStudioAudioSelectionManifestV1,
  request: MotionStudioIntegratedMixRequestV1,
): void {
  const narration = request.inputs.filter((entry) => entry.role === 'narration')
  if (narration.length !== 1) blocked('Integrated audio finalization requires exactly one narration assembly input.')
  const selectedStems = selection.optionalRoleDecisions.flatMap((decision) => decision.selections)
  const optionalInputs = request.inputs.filter((entry) => entry.role !== 'narration')
  if (selectedStems.length !== optionalInputs.length) {
    blocked('Integrated mix optional inputs do not exactly match selected audio stems.')
  }
  const bySource = new Map(optionalInputs.map((entry) => [entry.sourceId, entry]))
  for (const selected of selectedStems) {
    const authority = bySource.get(selected.selectedStemId)
    if (!authority || authority.role !== selected.role || authority.sourceKind !== 'selected_stem' ||
      authority.assetVersionId !== selected.assetVersion.assetVersionId ||
      authority.checksumSha256 !== selected.assetVersion.checksumSha256 ||
      sha256CanonicalJson(authority.placement) !== sha256CanonicalJson(selected.placement) ||
      !sameSet(authority.cueAuthorityIds, selected.cueAuthorityIds) ||
      !sameSet(authority.soundEventAuthorityIds, selected.soundEventAuthorityIds) ||
      !sameSet(authority.rightsEvidenceIds, selected.candidateAuthority.rightsEvidence.map((item) => item.evidenceId))) {
      blocked('An integrated mix input does not match its exact explicit stem selection.')
    }
  }
}

function assertRuntimeResult(
  request: MotionStudioIntegratedMixRequestV1,
  runtime: MotionStudioSelectedAudioMixRuntimeResultV1,
  privateReadbackBytes: Buffer,
): void {
  const result = runtime.result
  const runtimeGateNames = result.quality.gateResults.map((gate) => gate.gate)
  if (
    runtime.providerCallMade || runtime.automaticRetryPerformed || runtime.automaticFallbackPerformed ||
    runtime.automaticSubstitutionPerformed || runtime.timelineMutationPerformed || runtime.videoMuxPerformed ||
    runtime.renderPerformed || runtime.exportPerformed || runtime.customerPriceIncluded ||
    runtime.customerCreditsIncluded || runtime.serviceFeeIncluded || runtime.walletMutationPerformed ||
    runtime.billingMutationPerformed || result.evidence.providerCallMade || result.evidence.providerCostMicros !== 0 ||
    result.evidence.customerPricingIncluded || result.evidence.customerCreditsIncluded ||
    result.evidence.profileId !== request.profileId ||
    result.artifact.mimeType !== request.output.mimeType || result.artifact.codec !== request.output.codec ||
    result.artifact.sampleRateHertz !== request.output.sampleRateHertz ||
    result.artifact.channelCount !== request.output.channelCount ||
    result.artifact.sampleCountPerChannel !== request.output.sampleCountPerChannel ||
    result.quality.durationFrames !== request.output.durationFrames ||
    result.quality.fps !== request.timingAuthority.frameRate ||
    result.quality.sampleCountPerChannel !== request.output.sampleCountPerChannel ||
    !sameSet(runtimeGateNames, LEGACY_RUNTIME_GATES) ||
    result.quality.gateResults.some((gate) => gate.result !== 'passed' || !gate.blocking) ||
    privateReadbackBytes.byteLength !== result.artifact.byteLength ||
    sha256(privateReadbackBytes) !== result.artifact.sha256 ||
    !privateReadbackBytes.equals(result.artifact.bytes)
  ) blocked('Selected private mix runtime or readback evidence cannot satisfy integrated-audio finalization.')

  const parsed = parseMotionStudioPcmWave(privateReadbackBytes)
  if (parsed.sampleRateHertz !== 48_000 || parsed.channelCount !== 2 ||
    parsed.sampleCountPerChannel !== request.output.sampleCountPerChannel) {
    blocked('Integrated private mix readback media facts changed after deterministic execution.')
  }
}

function parseSelectionManifest(value: unknown): MotionStudioAudioSelectionManifestV1 {
  const parsed = motionStudioAudioSelectionManifestV1Schema.safeParse(value)
  if (!parsed.success) blocked('Audio selection manifest is invalid or not mix eligible.')
  return parsed.data
}

function parseNarrationManifest(value: unknown): MotionStudioNarrationAssemblyManifestV1 {
  const parsed = motionStudioNarrationAssemblyManifestV1Schema.safeParse(value)
  if (!parsed.success) blocked('Narration assembly manifest is invalid or incomplete.')
  return parsed.data
}

function parseNarrationArtifact(value: unknown): MotionStudioNarrationAssemblyArtifactV1 {
  const parsed = motionStudioNarrationAssemblyArtifactV1Schema.safeParse(value)
  if (!parsed.success) blocked('Narration assembly artifact authority is invalid.')
  return parsed.data
}

function parseNarrationQuality(value: unknown): MotionStudioNarrationAssemblyQualityReportV1 {
  const parsed = motionStudioNarrationAssemblyQualityReportV1Schema.safeParse(value)
  if (!parsed.success) blocked('Narration assembly quality authority is invalid.')
  return parsed.data
}

function parseIntegratedMixRequest(value: unknown): MotionStudioIntegratedMixRequestV1 {
  const parsed = motionStudioIntegratedMixRequestV1Schema.safeParse(value)
  if (!parsed.success) blocked('Integrated private mix request is invalid or incomplete.')
  return parsed.data
}

function parseIntegratedMixArtifact(value: unknown): MotionStudioIntegratedMixArtifactV1 {
  const parsed = motionStudioIntegratedMixArtifactV1Schema.safeParse(value)
  if (!parsed.success) blocked('Integrated private mix artifact authority is invalid.')
  return parsed.data
}

function parseIntegratedMixQuality(value: unknown): MotionStudioIntegratedMixQualityReportV1 {
  const parsed = motionStudioIntegratedMixQualityReportV1Schema.safeParse(value)
  if (!parsed.success) blocked('Integrated private mix quality authority is invalid.')
  return parsed.data
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return new Set(left).size === left.length && new Set(right).size === right.length &&
    left.length === right.length && left.every((entry) => right.includes(entry))
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function blocked(message: string): never {
  throw new ApiError('JOB_DEPENDENCY_NOT_READY', message, 409, {
    requiredGate: 'motion_studio_storytelling_integrated_audio_finalization_v1',
  })
}
