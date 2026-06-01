import { phase36EArtifactBlockers } from './audio-system-artifact-verifier'
import type { DeepFilterNetFeatureE2EExecutionReport } from '../deepfilternet-feature-e2e'
import type {
  AudioSystemArtifactVerification,
  AudioSystemEvidenceChainEntry,
  AudioSystemReadinessQaGate,
} from './audio-system-readiness-types'

export const audioSystemReadinessQaGateIds: AudioSystemReadinessQaGate['gateId'][] = [
  'evidence_chain',
  'artifact_integrity',
  'source_integrity',
  'plan_snapshot_integrity',
  'audio_metrics',
  'privacy_security',
  'operational_readiness',
  'beta_scope',
  'blocked_features',
]

export function buildAudioSystemReadinessQaSummary(input: {
  evidenceChain: AudioSystemEvidenceChainEntry[]
  artifactVerification: AudioSystemArtifactVerification[]
  phase36EReport?: DeepFilterNetFeatureE2EExecutionReport
  betaScopeExists: boolean
  publicAccessDetected: boolean
}): { status: 'passed' | 'warning' | 'blocked'; gates: AudioSystemReadinessQaGate[]; blockers: string[]; warnings: string[] } {
  const chainBlockers = input.evidenceChain.flatMap((entry) => entry.blockers)
  const artifactBlockers = phase36EArtifactBlockers(input.artifactVerification)
  const report = input.phase36EReport
  const blockers = [
    ...chainBlockers,
    ...artifactBlockers,
    ...(report?.ok === false ? ['Phase 36E report is not ok.'] : []),
    ...(report?.qa.blockers ?? []).map((blocker) => `Phase 36E QA blocker: ${blocker}`),
    ...(input.publicAccessDetected ? ['Public principal detected on a required bucket.'] : []),
    ...(!input.betaScopeExists ? ['Audio beta-scope manifest was not created.'] : []),
  ]
  const warnings = [
    'Subjective listening review is recommended before broader internal audio testing.',
    'Phase 36F readiness is limited to internal audio feature testing only.',
  ]
  const gates: AudioSystemReadinessQaGate[] = [
    gate('evidence_chain', chainBlockers.length === 0, 'Phase 31 and Phase 36A-36E evidence chain is present.'),
    gate('artifact_integrity', artifactBlockers.length === 0, 'Phase 36E cleaned WAV, review MP4, metrics, QA, manifest, and checksum artifacts exist and are private refs.'),
    gate('source_integrity', report?.source.inputVideo === undefined || report.source.inputVideo === 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4', 'Approved Phase 32 source only; no arbitrary media or IMG_6024.MOV.'),
    gate('plan_snapshot_integrity', report?.planSnapshot.rawPromptExecution === false, 'Phase 36E approved plan snapshot exists and raw prompt execution is false.'),
    gate('audio_metrics', Boolean(report?.cleanedAudio.comparisonMetrics) && Number(report?.cleanedAudio.comparisonMetrics?.outputClippingSampleCount ?? 0) === 0, 'Loudness/peak/duration/clipping metrics are present with no clipping blocker.'),
    gate('privacy_security', !input.publicAccessDetected && report?.safety.publicAccessEnabled === false && report?.safety.providerExecuted === false, 'Artifacts stay private; no public access, signed URL source of truth, secrets, or provider calls.'),
    gate('operational_readiness', Boolean(report?.jobName) && Boolean(report?.image?.image), 'Runtime job/image are recorded and rollback/fallback is documented.'),
    gate('beta_scope', input.betaScopeExists, 'Included/excluded audio beta scope is explicit.'),
    gate('blocked_features', Boolean(report && report.safety.rnnoiseUsed === false && report.safety.demucsUsed === false && report.safety.revideoUsed === false && report.safety.filmUsed === false && report.safety.slowMotionExecuted === false), 'RNNoise, Demucs, providers, Revideo, FILM, slow motion, arbitrary media, production, and external beta remain blocked.'),
  ]
  return {
    status: blockers.length > 0 ? 'blocked' : 'warning',
    gates,
    blockers,
    warnings,
  }
}

function gate(gateId: AudioSystemReadinessQaGate['gateId'], passed: boolean, summary: string): AudioSystemReadinessQaGate {
  return {
    gateId,
    status: passed ? 'passed' : 'blocked',
    summary,
  }
}
