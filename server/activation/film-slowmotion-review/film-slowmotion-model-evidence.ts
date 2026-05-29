import type { FilmSlowMotionModelEvidence } from './film-slowmotion-review-types'

export const FILM_SLOWMOTION_MODEL_EVIDENCE: FilmSlowMotionModelEvidence = {
  toolName: 'FILM / frame interpolation',
  likelyUpstream: 'google-research/frame-interpolation',
  intendedCapability: 'selected-clip frame interpolation / slow-motion',
  currentStatus: 'evaluated-only',
  filmApproved: false,
  checkpointApproved: false,
  approvedChecksumRecorded: false,
  approvedStoragePathRecorded: false,
  approvedRuntimeImageOrJob: false,
  downloadAllowed: false,
  runtimeAllowed: false,
  slowMotionAllowed: false,
  productionAllowed: false,
  externalBetaAllowed: false,
  broadRealMediaAllowed: false,
  blockers: [
    'FILM is not approved for ReeditPro execution.',
    'No FILM checkpoint is approved.',
    'No FILM checksum is recorded as approved.',
    'No private model storage path is approved.',
    'No runtime image or Cloud Run job is approved for FILM.',
  ],
  futureApprovalRequirements: [
    'Human approval that slow motion is needed for a bounded test.',
    'Exact FILM source and checkpoint selection.',
    'License and provenance review for the selected source and checkpoint.',
    'Known checksum recorded before storage or runtime use.',
    'Private model storage path plan.',
    'Runtime constraints that forbid external model download.',
    'One short approved clip or segment test scope.',
    'QA gates for ghosting, warping, flicker, sync, and misleading generated frames.',
  ],
}

export function getFilmSlowMotionModelEvidence(): FilmSlowMotionModelEvidence {
  return {
    ...FILM_SLOWMOTION_MODEL_EVIDENCE,
    blockers: [...FILM_SLOWMOTION_MODEL_EVIDENCE.blockers],
    futureApprovalRequirements: [...FILM_SLOWMOTION_MODEL_EVIDENCE.futureApprovalRequirements],
  }
}
