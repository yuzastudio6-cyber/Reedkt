import { sam2ModelEvidence } from './sam2-model-evidence'
import type { Sam2LicenseReview } from './sam2-model-approval-types'

const hasApacheEvidence = sam2ModelEvidence.candidates.some((candidate) =>
  candidate.sourceEvidence.some((evidence) => evidence.licenseClaim.toLowerCase() === 'apache-2.0'),
)

export const sam2LicenseReview: Sam2LicenseReview = {
  licenseIdentified: hasApacheEvidence,
  licenseName: hasApacheEvidence
    ? 'Apache-2.0 claims recorded from Phase 33A SAM2 evidence; final checkpoint use still requires human legal/model review.'
    : 'unknown',
  commercialUseAllowed: 'unknown',
  redistributionAllowed: 'unknown',
  checkpointUseAllowed: 'unknown',
  requiresHumanLegalReview: true,
  humanApprovalRecorded: false,
  approvalDecision: 'pending_human_review',
  currentStatus: 'SAM2 source/license evidence is recorded, but no human legal/model approval artifact exists for checkpoint download or execution.',
  evidenceRequired: [
    'Human legal/model approval for the exact SAM2 checkpoint candidate.',
    'Exact checkpoint source and revision selected for Phase 35B.',
    'Checksum plan for the selected checkpoint.',
    'Private staging model storage plan.',
    'Runtime constraint review confirming no external model download at execution time.',
  ],
}
