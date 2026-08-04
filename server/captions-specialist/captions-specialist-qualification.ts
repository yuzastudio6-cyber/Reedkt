import { createHash } from 'node:crypto'
import {
  CAPTIONS_SPECIALIST_CONTRACT_VERSION,
  CAPTIONS_SPECIALIST_SKILL_KEY,
  CAPTIONS_SPECIALIST_VERSION,
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
import { CAPTIONS_SPECIALIST_MANIFEST } from './captions-specialist-manifest'

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

const manifestRef = {
  id: CAPTIONS_SPECIALIST_MANIFEST.manifestId,
  version: CAPTIONS_SPECIALIST_MANIFEST.manifestSchemaVersion,
  contentHash: CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
}

const snapshotWithoutDigest: Omit<
  SkillQualificationSnapshot,
  'snapshotDigestSha256'
> = {
  schemaVersion: SKILL_QUALIFICATION_SNAPSHOT_VERSION,
  snapshotId: 'captions.specialist.qualification.cap01',
  skillKey: CAPTIONS_SPECIALIST_SKILL_KEY,
  manifestRef,
  observedAt: '2026-08-04T00:00:00.000Z',
  releaseRef: {
    id: 'captions.specialist.release.cap01',
    version: CAPTIONS_SPECIALIST_VERSION,
    contentHash: sha256(`${CAPTIONS_SPECIALIST_VERSION}:cap01`),
  },
  jobEntries: CAPTIONS_SUPPORTED_JOB_TYPES.map((jobType) => ({
    jobType,
    status: 'qualified' as const,
    qualifiedModes: ['planning'] as const,
    blockerCodes: [],
    routeRefs: [{
      id: 'captions.planning.no-output',
      version: 'captions-planning-route-v1',
      contentHash: sha256(`captions.planning.no-output:${jobType}`),
    }],
    evidenceRefs: [{
      id: 'captions.cap01.contract-routing',
      version: 'captions-cap01-evidence-v1',
      contentHash: sha256(`captions.cap01.contract-routing:${jobType}`),
    }],
    requiredEvidenceTypes:
      CAPTIONS_SPECIALIST_MANIFEST.capabilityEntries.find(
        (entry) => entry.supportedJobType === jobType,
      )?.requiredEvidence ?? [],
    contractDigestSha256: sha256(
      `${CAPTIONS_SPECIALIST_CONTRACT_VERSION}:${jobType}:planning`,
    ),
    manifestDigestSha256: CAPTIONS_SPECIALIST_MANIFEST.manifestHash,
  })),
  wholeSkillQualificationClaimed: false,
  productionQualificationClaimed: false,
}

const candidate: SkillQualificationSnapshot = {
  ...snapshotWithoutDigest,
  snapshotDigestSha256: calculateSkillContractDigest(
    { ...snapshotWithoutDigest, snapshotDigestSha256: '' },
    'snapshotDigestSha256',
  ),
}

export const CAPTIONS_SPECIALIST_QUALIFICATION_SNAPSHOT =
  parseSkillQualificationSnapshot(candidate)
