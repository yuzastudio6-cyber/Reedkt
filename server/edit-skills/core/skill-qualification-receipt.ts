import { z } from 'zod'

import { ACTIVE_QUALIFICATION_RANK, SKILL_QUALIFICATION_STATUSES } from './edit-skill-ids'
import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import type { SkillManifestReference } from './skill-capability-manifest-types'
import { skillGitCommitShaSchema } from './skill-qualification-evidence'

const fixtureResultSchema = z.object({
  fixtureKey: z.string().trim().min(1).max(180),
  status: z.enum(['passed', 'failed', 'blocked', 'not_run']),
  evidenceHash: skillSha256Schema,
  summary: z.string().trim().min(1).max(2_000),
}).strict()

const qualificationReceiptV1CoreSchema = z.object({
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

export const skillQualificationReceiptV1Schema = qualificationReceiptV1CoreSchema.extend({
  receiptHash: skillSha256Schema,
}).strict()

const fixtureEvidenceRefSchema = z.object({
  fixtureKey: z.string().trim().min(1).max(180),
  commandId: z.string().trim().min(1).max(180),
  evidenceHash: skillSha256Schema,
}).strict()

const qualificationReceiptV2CoreSchema = z.object({
  schemaVersion: z.literal('skill-qualification-receipt-v2'),
  manifestRef: skillManifestReferenceSchema,
  qualificationStatus: z.enum(SKILL_QUALIFICATION_STATUSES),
  testedCommitSha: skillGitCommitShaSchema,
  relevantSourceTreeHash: skillSha256Schema,
  fixtureResults: z.array(fixtureResultSchema).min(1).max(500),
  fixtureEvidenceRefs: z.array(fixtureEvidenceRefSchema).min(1).max(500),
  buildEvidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  testEvidenceHashes: z.array(skillSha256Schema).min(1).max(500),
  securityEvidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  providerEvidenceHashes: z.array(skillSha256Schema).min(1).max(100),
  startedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }),
  issuedAt: z.string().datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  if (
    Date.parse(value.completedAt) < Date.parse(value.startedAt) ||
    Date.parse(value.issuedAt) < Date.parse(value.completedAt)
  ) context.addIssue({ code: 'custom', message: 'Qualification receipt timestamps are out of order.' })
  const resultKeys = value.fixtureResults.map((entry) => entry.fixtureKey)
  const refKeys = value.fixtureEvidenceRefs.map((entry) => entry.fixtureKey)
  if (
    new Set(resultKeys).size !== resultKeys.length ||
    new Set(refKeys).size !== refKeys.length ||
    hashSkillValue(resultKeys) !== hashSkillValue(refKeys)
  ) context.addIssue({ code: 'custom', message: 'Qualification receipt fixture results and evidence refs must match exactly.' })
  for (let index = 0; index < value.fixtureResults.length; index += 1) {
    if (value.fixtureResults[index]?.evidenceHash !== value.fixtureEvidenceRefs[index]?.evidenceHash) {
      context.addIssue({ code: 'custom', message: 'Qualification fixture result is not bound to its evidence reference.' })
    }
  }
})

export const skillQualificationReceiptV2Schema = qualificationReceiptV2CoreSchema.extend({
  receiptHash: skillSha256Schema,
}).strict()

export const skillQualificationReceiptSchema = z.union([
  skillQualificationReceiptV1Schema,
  skillQualificationReceiptV2Schema,
])

export type SkillQualificationReceipt = z.infer<typeof skillQualificationReceiptSchema>

export function createSkillQualificationReceipt(
  input: z.input<typeof qualificationReceiptV1CoreSchema>,
): SkillQualificationReceipt {
  const core = qualificationReceiptV1CoreSchema.parse(input)
  return skillQualificationReceiptV1Schema.parse({
    ...core,
    receiptHash: hashSkillValue(core),
  })
}

export function createSkillQualificationReceiptV2(
  input: z.input<typeof qualificationReceiptV2CoreSchema>,
): SkillQualificationReceipt {
  const core = qualificationReceiptV2CoreSchema.parse(input)
  return skillQualificationReceiptV2Schema.parse({
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
