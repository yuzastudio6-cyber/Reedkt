import { createHash } from 'node:crypto'

import {
  CAPTIONS_SPECIALIST_CONTRACT_VERSION,
  CAPTIONS_SPECIALIST_SKILL_KEY,
  CAPTIONS_SUPPORTED_JOB_TYPES,
} from '../../src/types/captions-specialist'
import {
  SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  type SkillQualificationSnapshot,
} from '../../src/types/orchestra-skill-contracts'
import {
  calculateSkillContractDigest,
  parseSkillQualificationSnapshot,
} from '../orchestra/orchestra-skill-contracts'
import { CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT } from
  './caption-goal-completion-audit'
import {
  CAPTIONS_SPECIALIST_INTEGRATION_EVIDENCE_ID,
  CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST,
  CAPTIONS_SPECIALIST_INTEGRATION_VERSION,
} from './captions-specialist-integration-manifest'

const manifestRef = {
  id: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestId,
  version: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestSchemaVersion,
  contentHash: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash,
}

const sourceAuditRef = {
  id: CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.auditId,
  version: CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.schemaVersion,
  contentHash: CAPTION_POST_CAP20_GOAL_COMPLETION_AUDIT.auditDigestSha256,
}

const snapshotWithoutDigest: Omit<SkillQualificationSnapshot,
  'snapshotDigestSha256'> = {
  schemaVersion: SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  snapshotId: 'captions.specialist.qualification.post-cap20-integration',
  skillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
  manifestRef,
  observedAt: '2026-08-04T00:00:00.000Z',
  releaseRef: sourceAuditRef,
  jobEntries: CAPTIONS_SUPPORTED_JOB_TYPES.map((jobType) => {
    const capability = CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST
      .capabilityEntries.find((entry) => entry.supportedJobType === jobType)!
    return {
      jobType,
      status: 'qualified' as const,
      qualifiedModes: ['planning'] as const,
      blockerCodes: [],
      routeRefs: [{
        id: 'captions.planning.no-output',
        version: 'captions-planning-route-v1',
        contentHash: hashText(
          `captions.planning.no-output:integration:${jobType}`),
      }],
      evidenceRefs: [{
        id: CAPTIONS_SPECIALIST_INTEGRATION_EVIDENCE_ID,
        version: CAPTIONS_SPECIALIST_INTEGRATION_VERSION,
        contentHash: sourceAuditRef.contentHash,
      }],
      requiredEvidenceTypes: [...capability.requiredEvidence],
      contractDigestSha256: hashText(
        `${CAPTIONS_SPECIALIST_CONTRACT_VERSION}:${jobType}:post-cap20-integration-planning`),
      manifestDigestSha256: CAPTIONS_SPECIALIST_INTEGRATION_MANIFEST.manifestHash,
    }
  }),
  wholeSkillQualificationClaimed: false,
  productionQualificationClaimed: false,
}

export const CAPTIONS_SPECIALIST_INTEGRATION_QUALIFICATION_SNAPSHOT =
parseSkillQualificationSnapshot({
  ...snapshotWithoutDigest,
  snapshotDigestSha256: calculateSkillContractDigest(
    { ...snapshotWithoutDigest, snapshotDigestSha256: '' },
    'snapshotDigestSha256'),
})

function hashText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
