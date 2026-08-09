import { z } from 'zod'

import { hashSkillValue } from './skill-capability-manifest-hash'
import {
  skillIdentitySchema,
  skillSemverSchema,
  skillSha256Schema,
} from './skill-capability-manifest-schema'
import { EDIT_SKILL_KEYS } from './edit-skill-ids'

export const skillGitCommitShaSchema = z.string().regex(/^[a-f0-9]{40}$/u)

export const skillQualificationDependencyAuthorityHashSchema = z.object({
  authorityKey: skillIdentitySchema,
  authorityHash: skillSha256Schema,
}).strict()

export type SkillQualificationDependencyAuthorityHash = z.infer<
  typeof skillQualificationDependencyAuthorityHashSchema
>

function assertUniqueDependencyAuthorities(
  values: readonly SkillQualificationDependencyAuthorityHash[],
  context: z.RefinementCtx,
): void {
  const keys = values.map((entry) => entry.authorityKey)
  if (new Set(keys).size !== keys.length) {
    context.addIssue({
      code: 'custom',
      message: 'Qualification dependency authorities must have unique keys.',
    })
  }
}

const skillQualificationFixtureEvidenceCoreSchema = z.object({
  schemaVersion: z.literal('skill-qualification-fixture-evidence-v1'),
  skillKey: z.enum(EDIT_SKILL_KEYS),
  skillVersion: skillSemverSchema,
  contractVersion: skillIdentitySchema,
  manifestHash: skillSha256Schema,
  fixtureKey: skillIdentitySchema,
  commandId: skillIdentitySchema,
  testedCommitSha: skillGitCommitShaSchema,
  relevantSourceTreeHash: skillSha256Schema,
  dependencyAuthorityHashes: z.array(skillQualificationDependencyAuthorityHashSchema)
    .min(1).max(100),
  startedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }),
  exitStatus: z.number().int().min(0).max(255),
  passed: z.boolean(),
  evidenceArtifactHashes: z.array(skillSha256Schema).min(1).max(100),
  stdoutDigest: skillSha256Schema,
  stderrDigest: skillSha256Schema,
  environmentClass: z.enum([
    'local_internal_qualification',
    'github_actions_internal_qualification',
    'private_injected_provider_fixture',
    'production_private_canary',
  ]),
  providerRequestCount: z.number().int().nonnegative().max(100_000),
  publicArtifactCount: z.number().int().nonnegative().max(100_000),
  productionMutationCount: z.number().int().nonnegative().max(100_000),
}).strict().superRefine((value, context) => {
  if (Date.parse(value.completedAt) < Date.parse(value.startedAt)) {
    context.addIssue({ code: 'custom', message: 'Qualification fixture completed before it started.' })
  }
  if (value.passed !== (value.exitStatus === 0)) {
    context.addIssue({ code: 'custom', message: 'Qualification fixture pass state contradicts its exit status.' })
  }
  if (new Set(value.evidenceArtifactHashes).size !== value.evidenceArtifactHashes.length) {
    context.addIssue({ code: 'custom', message: 'Qualification fixture evidence hashes must be unique.' })
  }
  assertUniqueDependencyAuthorities(value.dependencyAuthorityHashes, context)
})

export const skillQualificationFixtureEvidenceSchema =
  skillQualificationFixtureEvidenceCoreSchema.extend({
    evidenceHash: skillSha256Schema,
  }).strict().superRefine((value, context) => {
    const { evidenceHash, ...core } = value
    if (hashSkillValue(core) !== evidenceHash) {
      context.addIssue({ code: 'custom', message: 'Qualification fixture evidence hash is stale or forged.' })
    }
  })

export type SkillQualificationFixtureEvidence = z.infer<
  typeof skillQualificationFixtureEvidenceSchema
>

export function createSkillQualificationFixtureEvidence(
  input: z.input<typeof skillQualificationFixtureEvidenceCoreSchema>,
): SkillQualificationFixtureEvidence {
  const core = skillQualificationFixtureEvidenceCoreSchema.parse(input)
  return skillQualificationFixtureEvidenceSchema.parse({
    ...core,
    evidenceHash: hashSkillValue(core),
  })
}
