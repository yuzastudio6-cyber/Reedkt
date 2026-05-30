import { filmSlowmotionApprovalPolicy } from './film-slowmotion-approval-policy'
import type { FilmModelEvidence } from './film-slowmotion-approval-types'

export const filmModelEvidence: FilmModelEvidence = {
  toolFamily: 'FILM / frame interpolation / slow motion',
  intendedCapability: 'selected-clip slow-motion / intermediate frame synthesis',
  upstreamRepo: filmSlowmotionApprovalPolicy.officialRepoUrl,
  projectPage: filmSlowmotionApprovalPolicy.officialProjectPageUrl,
  paperTitle: 'FILM: Frame Interpolation for Large Motion',
  repoArchivedReadOnly: true,
  sourceEvidence: [
    {
      evidenceId: 'film-official-github-repo',
      sourceName: 'GitHub repository: google-research/frame-interpolation',
      sourceUrl: filmSlowmotionApprovalPolicy.officialRepoUrl,
      sourceType: 'github',
      evidenceSummary: 'Official Google Research repository for the TensorFlow 2 FILM implementation. GitHub currently marks the repository archived/read-only.',
      confidence: 'high',
      notes: [
        'Repository describes FILM as frame interpolation for large motion.',
        'Repository includes code, README, LICENSE, and model usage instructions.',
        'Archive status does not itself block staging planning, but it is recorded as a maintenance/runtime risk.',
      ],
    },
    {
      evidenceId: 'film-official-project-page',
      sourceName: 'FILM project page',
      sourceUrl: filmSlowmotionApprovalPolicy.officialProjectPageUrl,
      sourceType: 'project_page',
      evidenceSummary: 'Project page and paper references identify FILM: Frame Interpolation for Large Motion.',
      confidence: 'high',
      notes: [
        'Project page links to paper and official code/model references.',
        'This evidence supports selected-clip interpolation planning only.',
      ],
    },
    {
      evidenceId: 'film-apache-2-license',
      sourceName: 'FILM repository LICENSE',
      sourceUrl: filmSlowmotionApprovalPolicy.officialLicenseUrl,
      sourceType: 'license',
      evidenceSummary: 'Official repository LICENSE is Apache-2.0.',
      confidence: 'high',
      notes: [
        'Apache-2.0 evidence is sufficient for Track A staging planning.',
        'Phase 38B must still preserve license/provenance records with checksums.',
      ],
    },
    {
      evidenceId: 'film-readme-pretrained-tf2-saved-models',
      sourceName: 'FILM README pre-trained model instructions',
      sourceUrl: filmSlowmotionApprovalPolicy.officialReadmeUrl,
      sourceType: 'checkpoint_readme',
      evidenceSummary: 'Official README documents pre-trained TF2 Saved Models from Google Drive and the expected film_net/L1, film_net/Style, film_net/VGG, and vgg folders.',
      confidence: 'high',
      notes: [
        'Phase 38A does not download the Google Drive model folder.',
        'Phase 38B should choose only the official model tree and compute checksums after download.',
      ],
    },
  ],
  checkpointCandidates: [
    {
      candidateId: 'film_net_style_saved_model',
      displayName: 'FILM film_net/Style/saved_model',
      sourceUrl: filmSlowmotionApprovalPolicy.officialCheckpointSourceUrl,
      sourceDescription: 'Official README Google Drive TF2 Saved Models folder.',
      modelPath: 'film_net/Style/saved_model',
      checksumStatus: 'unavailable_until_phase38b',
      currentStatus: 'recommended_phase38b_candidate',
      notes: [
        'Recommended first candidate because README examples use film_net/Style/saved_model for interpolation.',
        'No checksum is recorded until Phase 38B downloads the approved artifact tree into temp storage outside the repo.',
      ],
    },
    {
      candidateId: 'film_net_l1_saved_model',
      displayName: 'FILM film_net/L1/saved_model',
      sourceUrl: filmSlowmotionApprovalPolicy.officialCheckpointSourceUrl,
      sourceDescription: 'Official README Google Drive TF2 Saved Models folder.',
      modelPath: 'film_net/L1/saved_model',
      checksumStatus: 'unavailable_until_phase38b',
      currentStatus: 'evaluated_candidate',
      notes: ['Recorded for Phase 38B comparison, not selected as the first recommended candidate.'],
    },
    {
      candidateId: 'film_net_vgg_saved_model',
      displayName: 'FILM film_net/VGG/saved_model',
      sourceUrl: filmSlowmotionApprovalPolicy.officialCheckpointSourceUrl,
      sourceDescription: 'Official README Google Drive TF2 Saved Models folder.',
      modelPath: 'film_net/VGG/saved_model',
      checksumStatus: 'unavailable_until_phase38b',
      currentStatus: 'evaluated_candidate',
      notes: ['Recorded as an official README-listed candidate, not selected for first download planning.'],
    },
  ],
  noWeightsDownloaded: true,
  noRuntimeExecuted: true,
  noMediaProcessed: true,
}

export function getRecommendedFilmPhase38BArtifact() {
  return filmModelEvidence.checkpointCandidates[0]
}
