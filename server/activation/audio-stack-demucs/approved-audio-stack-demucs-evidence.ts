import type { ApprovedAudioStackDemucsEvidence } from './audio-stack-demucs-types'

export const approvedAudioStackDemucsEvidence: ApprovedAudioStackDemucsEvidence = {
  phase: '36G',
  status: 'closed_with_demucs_blocked',
  runId: 'phase36g-static-demucs-model-license-block',
  demucsBlocked: true,
  demucsBlocker: 'Demucs code is MIT, but official pretrained-model license/provenance remains ambiguous in facebookresearch/demucs issue #327; no htdemucs artifact is approved for download/runtime.',
  rnnoiseRemovedFromActiveFlow: true,
  deepFilterNetInternalSpeechCleanupPreserved: true,
  demucsSeparationCandidateDocumented: true,
  demucsDownloadCompleted: false,
  demucsRuntimeCompleted: false,
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: true,
    reason: 'The audio stack is no longer ambiguous: DeepFilterNet remains internal speech cleanup, RNNoise is removed from active flow, and Demucs separation is blocked pending model-license clarity. Phase 37A OCR approval workflow may start without treating Demucs as approved.',
  },
  blockers: [
    'Demucs pretrained-model license/provenance is ambiguous; do not download htdemucs or run Demucs.',
  ],
  warnings: [
    'Demucs should not be described as general denoise; it is only a vocal/music/stem separation candidate.',
    'No Demucs generated-audio or controlled-video E2E execution was performed.',
    'External beta, paid production, broad real media, providers, Revideo, FILM, and slow motion remain blocked.',
  ],
}

export function getApprovedAudioStackDemucsEvidence(): ApprovedAudioStackDemucsEvidence {
  return {
    ...approvedAudioStackDemucsEvidence,
    phase37AReadiness: { ...approvedAudioStackDemucsEvidence.phase37AReadiness },
    blockers: [...approvedAudioStackDemucsEvidence.blockers],
    warnings: [...approvedAudioStackDemucsEvidence.warnings],
  }
}
