import { filmSlowmotionApprovalPolicy } from './film-slowmotion-approval-policy'
import type { FilmLicenseReview } from './film-slowmotion-approval-types'

export const filmLicenseReview: FilmLicenseReview = {
  licenseIdentified: true,
  licenseName: 'Apache-2.0',
  officialSourceUrl: filmSlowmotionApprovalPolicy.officialLicenseUrl,
  checkpointSourceUrl: filmSlowmotionApprovalPolicy.officialCheckpointSourceUrl,
  commercialUseAllowed: true,
  redistributionAllowed: true,
  checkpointUseAllowed: true,
  requiresHumanLegalReview: false,
  codexDecision: 'staging_planning_approved',
  decisionReason: 'Official Google Research FILM repository evidence identifies Apache-2.0 licensing, and the official README documents the pre-trained TF2 Saved Models source. Phase 38A approves staging planning only; download, runtime, media processing, and slow-motion execution remain blocked.',
}
