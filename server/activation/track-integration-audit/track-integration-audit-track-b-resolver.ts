import { buildAudioStackDemucsReport } from '../audio-stack-demucs'
import { buildAudioSystemReadinessReport } from '../audio-system-readiness'
import { buildOcrCaptionRenderQaEvidenceReport } from '../ocr-caption-render-qa'
import { getApprovedVlmRuntimeEvidence } from '../vlm-runtime'
import type { TrackIntegrationEvidenceItem, TrackIntegrationTrackSummary } from './track-integration-audit-types'

export function buildTrackIntegrationTrackBSummary(): TrackIntegrationTrackSummary {
  const audio = buildAudioSystemReadinessReport()
  const demucs = buildAudioStackDemucsReport()
  const ocr = buildOcrCaptionRenderQaEvidenceReport()
  const vlm = getApprovedVlmRuntimeEvidence()

  const audioReady = audio.status === 'ready' && audio.audioSystemInternalFeatureTestingReady && audio.blockers.length === 0
  const demucsIntentionallyBlocked = demucs.status === 'closed_with_demucs_blocked'
    && demucs.rnnoiseActiveProductFlowAllowed === false
    && demucs.demucsDownloadAllowed === false
    && demucs.demucsRuntimeAllowed === false
    && demucs.blockers.some((blocker) => /license|provenance/i.test(blocker))
  const ocrReady = ocr.status === 'passed'
    && ocr.phase37FReadiness.readyForCaptionRenderRuntimeHookPlanning
    && ocr.phase37E.blockers.length === 0
  const vlmBlockedWithReason = vlm.status === 'blocked'
    && vlm.phase39DReadiness.readyForControlledRealFrameVlm === false
    && [...vlm.blockers, ...vlm.warnings].some((entry) => /oom|vllm|cuda|l4/i.test(entry))

  const evidence: TrackIntegrationEvidenceItem[] = [
    {
      track: 'B',
      phase: '36F',
      label: 'Audio system internal readiness',
      status: audioReady ? 'ready' : 'blocked',
      runId: audio.approvedEvidence.runId,
      reportScript: 'activation:audio-system-readiness:report',
      artifactUris: [audio.approvedEvidence.betaScopeManifestUri, audio.approvedEvidence.qaReportUri].filter((uri): uri is string => Boolean(uri)),
      blockers: audio.blockers,
      warnings: audio.warnings,
      summary: audioReady
        ? 'DeepFilterNet and FFmpeg loudness scope are ready for internal audio feature testing only.'
        : 'Audio system readiness evidence is blocked or incomplete.',
    },
    {
      track: 'B',
      phase: '36G',
      label: 'Audio stack Demucs decision',
      status: demucsIntentionallyBlocked ? 'blocked' : 'partial',
      runId: demucs.approvedEvidence.runId,
      reportScript: 'activation:audio-stack-demucs:report',
      artifactUris: [],
      blockers: demucs.blockers,
      warnings: demucs.warnings,
      summary: demucsIntentionallyBlocked
        ? 'RNNoise is removed from active routing; Demucs remains blocked pending pretrained-model license/provenance evidence.'
        : 'Demucs/RNNoise audio-stack state is ambiguous and needs correction.',
    },
    {
      track: 'B',
      phase: '37E',
      label: 'OCR safe-zone caption/render QA metadata integration',
      status: ocrReady ? 'ready' : 'blocked',
      runId: ocr.phase37E.runId,
      reportScript: 'activation:ocr-caption-render-qa:report',
      artifactUris: [ocr.phase37E.artifactPrefix].filter((uri): uri is string => Boolean(uri)),
      blockers: ocr.phase37E.blockers,
      warnings: ocr.phase37E.warnings,
      summary: ocrReady
        ? 'OCR metadata integration is ready only for Track B caption/render hook planning.'
        : 'OCR caption/render QA evidence is blocked or incomplete.',
    },
    {
      track: 'B',
      phase: '39C',
      label: 'Generated VLM runtime verification',
      status: vlmBlockedWithReason ? 'blocked' : 'partial',
      runId: vlm.runId,
      reportScript: 'activation:vlm-runtime:report',
      artifactUris: [vlm.qaReportUri, vlm.artifactPrefix].filter((uri): uri is string => Boolean(uri)),
      blockers: vlm.blockers,
      warnings: vlm.warnings,
      summary: vlmBlockedWithReason
        ? 'Qwen3-VL/vLLM generated runtime verification is blocked on L4 CUDA OOM during vLLM engine initialization before fixture inference.'
        : 'VLM runtime status is not resolved with an explicit blocking reason.',
    },
  ]

  const unresolvedBlockers = [
    ...(!audioReady ? ['Track B audio system readiness is not ready.'] : []),
    ...(!demucsIntentionallyBlocked ? ['Demucs/RNNoise decision is not explicit.'] : []),
    ...(!ocrReady ? ['Track B OCR caption/render QA is not ready.'] : []),
    ...(!vlmBlockedWithReason ? ['Track B VLM Phase 39C blocker is not explicit.'] : []),
  ]
  const status = unresolvedBlockers.length > 0 ? 'blocked' : 'partial'
  const blockers = status === 'blocked'
    ? unresolvedBlockers
    : [
        demucs.approvedEvidence.demucsBlocker,
        'Phase 39C VLM generated runtime verification remains blocked on L4/vLLM CUDA OOM; Phase 39D controlled real-frame VLM remains blocked.',
      ]

  return {
    track: 'B',
    status,
    readyEvidenceCount: evidence.filter((item) => item.status === 'ready').length,
    blockedEvidenceCount: evidence.filter((item) => item.status === 'blocked').length,
    evidence,
    blockers,
    warnings: Array.from(new Set(evidence.flatMap((item) => item.warnings))),
    summary: status === 'partial'
      ? 'Track B is partial: audio and OCR have internal evidence, Demucs is intentionally blocked, and VLM remains blocked on Phase 39C L4/vLLM CUDA OOM.'
      : `Track B is blocked by unresolved audit issues: ${unresolvedBlockers.join('; ')}`,
  }
}
