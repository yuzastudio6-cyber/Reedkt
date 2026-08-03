import { z } from 'zod'

import { ACTIVE_QUALIFICATION_RANK, SKILL_QUALIFICATION_STATUSES } from './edit-skill-ids'
import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import type { SkillManifestReference } from './skill-capability-manifest-types'

const fixtureResultSchema = z.object({
  fixtureKey: z.string().trim().min(1).max(180),
  status: z.enum(['passed', 'failed', 'blocked', 'not_run']),
  evidenceHash: skillSha256Schema,
  summary: z.string().trim().min(1).max(2_000),
}).strict()

const qualificationReceiptCoreSchema = z.object({
  schemaVersion: z.literal('skill-qualification-receipt-v1'),
  manifestRef: skillManifestReferenceSchema,
  qualificationStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
  fixtureResults: z.array(fixtureResultSchema).min(1).max(500),
  buildEvidenceHashes: z.array(skillSha256Schema).max(100),
  testEvidenceHashes: z.array(skillSha256Schema).min(1).max(500),
  securityEvidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  providerEvidenceHashes: z.array(skillSha256Schema).max(100),
  issuedAt: z.string().datetime({ offset: true }),
}).strict()

export const skillQualificationReceiptSchema = qualificationReceiptCoreSchema.extend({
  receiptHash: skillSha256Schema,
}).strict()

export type SkillQualificationReceipt = z.infer<typeof skillQualificationReceiptSchema>

export function createSkillQualificationReceipt(
  input: z.input<typeof qualificationReceiptCoreSchema>,
): SkillQualificationReceipt {
  const core = qualificationReceiptCoreSchema.parse(input)
  return skillQualificationReceiptSchema.parse({
    ...core,
    receiptHash: hashSkillValue(core),
  })
}

export function assertSkillQualificationReceipt(
  receipt: SkillQualificationReceipt,
): SkillQualificationReceipt {
  const parsed = skillQualificationReceiptSchema.parse(receipt)
  const { receiptHash, ...core } = parsed
  if (hashSkillValue(core) !== receiptHash) throw new Error('Skill qualification receipt hash is stale or forged.')
  if (
    !['blocked', 'retired'].includes(parsed.qualificationStatus) &&
    parsed.fixtureResults.some((fixture) => fixture.status !== 'passed')
  ) throw new Error('Active qualification receipt contains an unpassed required fixture.')
  return parsed
}

export function assertQualificationSupportsClaim(input: {
  manifestRef: SkillManifestReference
  claimedStatus: SkillQualificationReceipt['qualificationStatus']
  receipt: SkillQualificationReceipt
}): void {
  const receipt = assertSkillQualificationReceipt(input.receipt)
  if (hashSkillValue(receipt.manifestRef) !== hashSkillValue(input.manifestRef)) {
    throw new Error('Qualification receipt is bound to a different manifest.')
  }
  const claimedRank = ACTIVE_QUALIFICATION_RANK[input.claimedStatus]
  const receiptRank = ACTIVE_QUALIFICATION_RANK[receipt.qualificationStatus]
  if (claimedRank === undefined || receiptRank === undefined || claimedRank > receiptRank) {
    throw new Error('Skill qualification claim exceeds its receipt evidence.')
  }
}
