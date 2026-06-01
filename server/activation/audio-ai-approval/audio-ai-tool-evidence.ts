import type {
  AudioAiEvidenceReview,
  AudioAiSourceEvidence,
  AudioAiToolEvidence,
} from './audio-ai-approval-types'

export const audioAiSourceEvidence: AudioAiSourceEvidence[] = [
  {
    evidenceId: 'deepfilternet-official-repo-license',
    toolId: 'deepfilternet',
    sourceName: 'DeepFilterNet official GitHub repository',
    sourceUrl: 'https://github.com/rikorose/deepfilternet',
    licenseClaim: 'MIT OR Apache-2.0',
    provenanceClaim: 'Official project repository for DeepFilterNet speech enhancement/noise suppression framework.',
    commercialUseClaim: true,
    redistributionClaim: true,
    confidence: 'high',
    notes: [
      'Repository license section identifies dual MIT/Apache-2.0 licensing.',
      'DeepFilterNet is the preferred first candidate for speech enhancement/noise suppression planning.',
      'Phase 36A does not select or download an exact model artifact.',
    ],
  },
  {
    evidenceId: 'rnnoise-official-repo-license',
    toolId: 'rnnoise',
    sourceName: 'RNNoise official Xiph GitHub mirror',
    sourceUrl: 'https://github.com/xiph/rnnoise',
    licenseClaim: 'BSD-3-Clause',
    provenanceClaim: 'Official Xiph RNNoise source repository for recurrent neural-network noise suppression.',
    commercialUseClaim: true,
    redistributionClaim: true,
    confidence: 'high',
    notes: [
      'Repository metadata identifies BSD-3-Clause licensing.',
      'Build instructions can download model files from Xiph servers, so future phases must pin artifact source and checksum before any build/runtime.',
      'RNNoise stays a lightweight fallback candidate, not the first DeepFilterNet staging path.',
    ],
  },
  {
    evidenceId: 'demucs-official-repo-license',
    toolId: 'demucs',
    sourceName: 'Demucs official GitHub repository',
    sourceUrl: 'https://github.com/facebookresearch/demucs',
    licenseClaim: 'MIT for repository code',
    provenanceClaim: 'Official archived Meta/Facebook Research Demucs source-separation repository.',
    commercialUseClaim: true,
    redistributionClaim: 'unknown',
    confidence: 'medium',
    notes: [
      'Repository code is MIT licensed.',
      'Pretrained model weight licensing/provenance is treated as incomplete for ReeditPro production or staging use.',
      'Demucs is restricted to future source-separation/stem workflows only, not default voice cleanup.',
    ],
  },
  {
    evidenceId: 'demucs-pretrained-model-license-ambiguity',
    toolId: 'demucs',
    sourceName: 'Demucs pretrained model license discussion',
    sourceUrl: 'https://github.com/facebookresearch/demucs/issues/327',
    licenseClaim: 'pretrained model license requires review',
    provenanceClaim: 'Public issue asks whether pretrained model weights share the repository MIT license.',
    commercialUseClaim: 'unknown',
    redistributionClaim: 'unknown',
    confidence: 'medium',
    notes: [
      'This evidence keeps Demucs model download/runtime blocked until exact pretrained artifact terms are reviewed.',
      'Phase 36A must not treat Demucs repository MIT code license as pretrained-model approval.',
    ],
  },
]

function sourceEvidenceFor(toolId: AudioAiToolEvidence['toolId']): AudioAiSourceEvidence[] {
  return audioAiSourceEvidence.filter((evidence) => evidence.toolId === toolId)
}

export const audioAiToolEvidence: AudioAiToolEvidence[] = [
  {
    toolId: 'deepfilternet',
    toolName: 'DeepFilterNet',
    role: 'primary_speech_enhancement_candidate',
    currentStatus: 'planning_recommended',
    intendedCapability: 'speech enhancement and noise suppression for future controlled audio cleanup.',
    officialRepoUrl: 'https://github.com/rikorose/deepfilternet',
    licenseName: 'MIT OR Apache-2.0',
    licenseEvidenceSummary: 'Official repository evidence identifies dual MIT/Apache-2.0 licensing.',
    modelOrArtifactEvidenceStatus: 'artifact_source_not_selected',
    approvedArtifactSource: null,
    approvedChecksum: null,
    approvedStoragePath: null,
    approvalBlockers: [
      'Exact DeepFilterNet model/tool artifact source is not selected for Phase 36B.',
      'No artifact checksum is recorded.',
      'No private staging model storage artifact exists.',
      'No runtime image/job has loaded DeepFilterNet.',
    ],
    sourceEvidence: sourceEvidenceFor('deepfilternet'),
  },
  {
    toolId: 'rnnoise',
    toolName: 'RNNoise',
    role: 'lightweight_fallback_candidate',
    currentStatus: 'fallback_planning_only',
    intendedCapability: 'lightweight noise suppression fallback or low-cost comparison candidate.',
    officialRepoUrl: 'https://github.com/xiph/rnnoise',
    licenseName: 'BSD-3-Clause',
    licenseEvidenceSummary: 'Official repository evidence identifies BSD-3-Clause licensing.',
    modelOrArtifactEvidenceStatus: 'build_time_model_download_risk',
    approvedArtifactSource: null,
    approvedChecksum: null,
    approvedStoragePath: null,
    approvalBlockers: [
      'RNNoise build path can fetch model files from Xiph servers and needs a pinned no-surprise artifact plan.',
      'No model file checksum is recorded.',
      'No private staging model storage artifact exists.',
      'No RNNoise runtime image/job is approved.',
    ],
    sourceEvidence: sourceEvidenceFor('rnnoise'),
  },
  {
    toolId: 'demucs',
    toolName: 'Demucs',
    role: 'restricted_source_separation_candidate',
    currentStatus: 'restricted_deferred',
    intendedCapability: 'music/speech source separation or stem workflows when specifically justified.',
    officialRepoUrl: 'https://github.com/facebookresearch/demucs',
    licenseName: 'MIT for code; pretrained model terms require review',
    licenseEvidenceSummary: 'Official repository code is MIT, but pretrained model weight provenance/licensing is not approved by Phase 36A.',
    modelOrArtifactEvidenceStatus: 'pretrained_model_provenance_needs_review',
    approvedArtifactSource: null,
    approvedChecksum: null,
    approvedStoragePath: null,
    approvalBlockers: [
      'Demucs pretrained model licensing/provenance is not approved.',
      'Demucs is not a default voice cleanup tool for ReeditPro.',
      'No Demucs model artifact source, checksum, or private storage path is approved.',
      'No Demucs runtime image/job is approved.',
    ],
    sourceEvidence: sourceEvidenceFor('demucs'),
  },
]

export const audioAiEvidenceReview: AudioAiEvidenceReview = {
  currentState: 'approval_review_only',
  tools: audioAiToolEvidence,
  noModelWeightsDownloaded: true,
  noRuntimeExecuted: true,
  noAudioProcessed: true,
  provenAudioBaseline: {
    phase: '31',
    runId: 'phase31-20260528T13060',
    summary: 'Phase 31 proved FFmpeg loudness-only cleanup on the controlled private real-video chain; no AI audio model/tool was used.',
    privateExportGcsUri: 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4',
  },
}

export function listAudioAiToolEvidence(): AudioAiToolEvidence[] {
  return [...audioAiToolEvidence]
}
