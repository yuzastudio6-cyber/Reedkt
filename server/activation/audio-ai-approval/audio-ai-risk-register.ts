import type { AudioAiRiskRegisterItem } from './audio-ai-approval-types'

export const audioAiRiskRegister: AudioAiRiskRegisterItem[] = [
  blocker('license-provenance-incomplete', 'At least one reviewed tool has incomplete model/artifact provenance before download/runtime.', 'Require exact artifact source and license review before Phase 36B.', 'Approved source/license artifact evidence.'),
  blocker('model-checksum-unavailable', 'No DeepFilterNet, RNNoise, or Demucs model/tool artifact checksum is approved.', 'Compute and record checksums only in the approved download/load phase.', 'Checksum manifest for the selected artifact.'),
  blocker('runtime-model-download-risk', 'DeepFilterNet/RNNoise/Demucs runtimes may attempt implicit model downloads unless explicitly pinned.', 'Require private model storage and network-download-blocked runtime plans.', 'Runtime plan proving no external model download.'),
  blocker('dependency-license-risk', 'Audio AI dependencies and optional model packages need separate review before runtime.', 'Inventory runtime dependencies in Phase 36B/36C before execution.', 'Dependency/license manifest.'),
  blocker('speech-intelligibility-degradation', 'AI cleanup can remove consonants, fricatives, breath cues, or quiet words.', 'Use speech intelligibility QA and human listening review before broader scope.', 'Listening QA showing preserved speech meaning and clarity.'),
  blocker('musical-noise-robotic-artifacts', 'Denoisers can introduce musical noise or robotic voice artifacts.', 'Require generated-audio runtime QA and controlled real-video sample QA.', 'Artifact/naturalness QA report.'),
  blocker('ambience-over-suppression', 'Audio AI may over-suppress room tone or natural ambience.', 'Preserve naturalness targets and compare before/after levels.', 'Naturalness QA and ambience preservation notes.'),
  blocker('lip-audio-mismatch', 'Cleanup or separation can introduce latency or alignment shifts.', 'Measure latency and preserve audio/video sync in future samples.', 'Sync QA with timing delta.'),
  blocker('loudness-true-peak-regression', 'AI cleanup can alter loudness and true peak after Phase 31 normalization.', 'Run loudness and true-peak checks after any future cleanup.', 'LUFS and true-peak QA report.'),
  blocker('stereo-channel-issues', 'Audio AI can collapse, invert, or imbalance channels.', 'Require channel layout and phase QA.', 'Channel integrity QA evidence.'),
  blocker('demucs-leakage-balance-risk', 'Demucs separation can leak vocals/music across stems or alter balance.', 'Keep Demucs restricted and require source-separation-specific QA.', 'Stem leakage and balance QA.'),
  blocker('compute-cost-risk', 'Audio AI runtimes may increase CPU/GPU time and storage cost.', 'Benchmark generated audio before controlled real-video samples.', 'Runtime timing and cost evidence.'),
  blocker('broad-real-media-safety-risk', 'Arbitrary real-user audio has not been approved for AI cleanup.', 'Limit future real media to the approved controlled chain until later gates pass.', 'Controlled-media approval and QA evidence.'),
  blocker('no-controlled-real-video-ai-audio-qa', 'No AI audio cleanup has been tested on the controlled real-video chain.', 'Require generated-audio runtime first, then one controlled real-video sample.', 'Phase 36C/36D QA evidence.'),
  warning('subjective-preference', 'Listeners may disagree about cleanup naturalness and ambience.', 'Use before/after review and conservative defaults.', 'Human listening review notes.'),
  warning('clip-variability', 'Noise profiles and speech quality vary by source clip.', 'Start with bounded samples and document selection criteria.', 'Sample selection rationale.'),
  warning('human-listening-review-burden', 'Audio QA requires careful listening, not only metrics.', 'Keep review clips short and checklist-driven.', 'Human listening QA checklist.'),
  warning('sample-selection-bias', 'One sample may overstate quality for broader content.', 'Require additional representative samples before wider scope.', 'Representative sample plan.'),
]

function blocker(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): AudioAiRiskRegisterItem {
  return {
    riskId,
    severity: 'blocker',
    currentStatus,
    mitigation,
    evidenceRequiredToClear,
  }
}

function warning(
  riskId: string,
  currentStatus: string,
  mitigation: string,
  evidenceRequiredToClear: string,
): AudioAiRiskRegisterItem {
  return {
    riskId,
    severity: 'warning',
    currentStatus,
    mitigation,
    evidenceRequiredToClear,
  }
}
