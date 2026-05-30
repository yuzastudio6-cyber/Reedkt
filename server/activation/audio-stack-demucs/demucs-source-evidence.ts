import { audioStackDemucsConfig } from './audio-stack-demucs-policy'
import type { DemucsLicenseReview, DemucsSourceEvidence } from './audio-stack-demucs-types'

export function buildDemucsSourceEvidence(): DemucsSourceEvidence[] {
  return [
    {
      sourceId: 'official-demucs-repo',
      sourceUrl: audioStackDemucsConfig.demucsRepoUrl,
      evidenceSummary: 'The official facebookresearch/demucs repository is archived/read-only and describes Demucs as music source separation for drums, bass, vocals, and accompaniment.',
      status: 'verified',
      blockers: [],
    },
    {
      sourceId: 'official-demucs-code-license',
      sourceUrl: `${audioStackDemucsConfig.demucsRepoUrl}/blob/main/LICENSE`,
      evidenceSummary: 'The repository code license is MIT.',
      status: 'verified',
      blockers: [],
    },
    {
      sourceId: 'official-demucs-readme-models',
      sourceUrl: `${audioStackDemucsConfig.demucsRepoUrl}#separating-tracks`,
      evidenceSummary: 'The README lists htdemucs as the default Hybrid Transformer Demucs model and documents --two-stems=vocals separation.',
      status: 'verified',
      blockers: [],
    },
    {
      sourceId: 'pretrained-model-license-issue',
      sourceUrl: audioStackDemucsConfig.demucsModelLicenseIssueUrl,
      evidenceSummary: 'The official repository has an open issue asking whether pretrained models are licensed under the same MIT license as the code; the issue remains unresolved in the archived repository.',
      status: 'blocked',
      blockers: ['Demucs pretrained-model license/provenance is ambiguous; Phase 36G must not download or run htdemucs.'],
    },
  ]
}

export function buildDemucsLicenseReview(): DemucsLicenseReview {
  return {
    codeLicense: 'MIT',
    pretrainedModelLicenseStatus: 'ambiguous_open_issue',
    commercialUseDecision: 'blocked_pending_model_license_clarity',
    humanLegalApprovalRequired: true,
    summary: 'Code license is permissive, but official pretrained-model licensing and redistribution/commercial-use provenance are not clear enough for staging download/runtime approval.',
  }
}

export function demucsEvidenceBlockers(evidence = buildDemucsSourceEvidence()): string[] {
  return evidence.flatMap((entry) => entry.blockers)
}
