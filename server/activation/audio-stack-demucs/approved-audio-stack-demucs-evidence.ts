import type { ApprovedAudioStackDemucsEvidence } from './audio-stack-demucs-types'

export const approvedAudioStackDemucsEvidence: ApprovedAudioStackDemucsEvidence = {
  phase: '36G',
  status: 'closed_with_manifest_gate',
  runId: 'phase36g-static-demucs-model-license-block',
  demucsBlocked: false,
  demucsBlocker: 'Official htdemucs auto-download remains blocked; Demucs product routing is allowed only with a company-controlled approved model artifact, approval.json, and checksum match.',
  rnnoiseRemovedFromActiveFlow: true,
  deepFilterNetInternalSpeechCleanupPreserved: true,
  demucsSeparationCandidateDocumented: true,
  demucsDownloadCompleted: false,
  demucsRuntimeCompleted: false,
  phase37AReadiness: {
    readyForOcrApprovalWorkflow: true,
    reason: 'The audio stack is no longer ambiguous: DeepFilterNet remains internal speech cleanup, RNNoise is removed from active flow, and Demucs owns separation behind a strict approved-model manifest gate.',
  },
  blockers: [],
  warnings: [
    'Demucs must not be described as general denoise; it is only a vocal/music/stem separation tool.',
    'Runtime auto-download of htdemucs remains blocked.',
    'Non-mock Demucs execution requires an approved company-controlled model artifact and matching checksum.',
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
