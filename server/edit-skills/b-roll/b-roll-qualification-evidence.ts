import { z } from 'zod'

import { hashSkillValue, skillManifestReference } from '../core/skill-capability-manifest-hash'
import { skillManifestReferenceSchema, skillSha256Schema } from '../core/skill-capability-manifest-schema'
import type { SkillCapabilityManifest } from '../core/skill-capability-manifest-types'
import {
  skillGitCommitShaSchema,
  skillQualificationFixtureEvidenceSchema,
  type SkillQualificationFixtureEvidence,
} from '../core/skill-qualification-evidence'
import {
  assertSkillQualificationReceipt,
  createSkillQualificationReceiptV2,
  skillQualificationReceiptV2Schema,
} from '../core/skill-qualification-receipt'
import {
  BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS,
  BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
  BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS,
} from './b-roll-qualification'
import { GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT } from './generated/b-roll-internal-qualification.generated'
import { computeBrollRelevantSourceTreeHash } from './b-roll-qualification-source-hash'

const REQUIRED_INTERNAL_FIXTURE_KEYS = [
  ...BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
  ...BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS,
] as const

type BrollGeneratedQualificationStatus =
  | 'planning_qualified'
  | 'internal_execution_qualified'

const BUILD_COMMAND_IDS = [
  'npm.build',
  'npm.typecheck:server',
  'npm.lint',
  'npm.check:frontend-boundary',
] as const

const SECURITY_COMMAND_IDS = [
  'npm.smoke:runtime-api-security',
  'npm.smoke:edit-execution-security-boundary',
  'npm.smoke:idempotency-boundary',
  'npm.smoke:b-roll-provider-authority',
] as const

const PROVIDER_COMMAND_IDS = [
  'npm.smoke:b-roll-provider-authority',
  'npm.smoke:b-roll-provider-lifecycle',
  'npm.smoke:b-roll-candidate-qa',
  'npm.smoke:b-roll-end-to-end',
] as const

const generatedArtifactCoreSchema = z.object({
  schemaVersion: z.literal('b_roll_generated_qualification_artifact_v1'),
  generatedBy: z.literal('npm.qualify:b-roll:internal.v1'),
  manifestRef: skillManifestReferenceSchema,
  testedCommitSha: skillGitCommitShaSchema,
  relevantSourceTreeHash: skillSha256Schema,
  fixtureEvidence: z.array(skillQualificationFixtureEvidenceSchema)
    .min(BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS.length)
    .max(REQUIRED_INTERNAL_FIXTURE_KEYS.length),
  commandEvidence: z.array(skillQualificationFixtureEvidenceSchema).min(1).max(100),
  receipt: skillQualificationReceiptV2Schema,
}).strict()

export const brollGeneratedQualificationArtifactSchema = generatedArtifactCoreSchema.extend({
  artifactHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { artifactHash, ...core } = value
  if (hashSkillValue(core) !== artifactHash) {
    context.addIssue({ code: 'custom', message: 'Generated B-roll qualification artifact hash is stale or forged.' })
  }
})

export type BrollGeneratedQualificationArtifact = z.infer<
  typeof brollGeneratedQualificationArtifactSchema
>

function commandEvidenceHashes(
  commandEvidence: readonly SkillQualificationFixtureEvidence[],
  commandIds: readonly string[],
): string[] {
  const byCommand = new Map(commandEvidence.map((entry) => [entry.commandId, entry]))
  return commandIds.map((commandId) => {
    const evidence = byCommand.get(commandId)
    if (!evidence) throw new Error(`Required qualification command evidence is missing: ${commandId}.`)
    return evidence.evidenceHash
  })
}

export function issueBrollGeneratedQualificationArtifact(input: {
  manifest: Readonly<SkillCapabilityManifest>
  qualificationStatus: BrollGeneratedQualificationStatus
  testedCommitSha: string
  relevantSourceTreeHash: string
  fixtureEvidence: readonly SkillQualificationFixtureEvidence[]
  commandEvidence: readonly SkillQualificationFixtureEvidence[]
}): BrollGeneratedQualificationArtifact {
  const manifestRef = skillManifestReference(input.manifest)
  const fixtureEvidence = input.fixtureEvidence.map((entry) =>
    skillQualificationFixtureEvidenceSchema.parse(entry))
  const commandEvidence = input.commandEvidence.map((entry) =>
    skillQualificationFixtureEvidenceSchema.parse(entry))
  const expectedFixtureKeys = input.qualificationStatus === 'planning_qualified'
    ? [...BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS]
    : [...REQUIRED_INTERNAL_FIXTURE_KEYS]
  const actualFixtureKeys = fixtureEvidence.map((entry) => entry.fixtureKey)
  const commandIds = commandEvidence.map((entry) => entry.commandId)
  if (
    new Set(actualFixtureKeys).size !== actualFixtureKeys.length ||
    new Set(commandIds).size !== commandIds.length ||
    hashSkillValue(actualFixtureKeys) !== hashSkillValue(expectedFixtureKeys)
  ) throw new Error('B-roll qualification evidence is missing, duplicate, or out of canonical order.')
  const commandById = new Map(commandEvidence.map((entry) => [entry.commandId, entry]))
  for (const evidence of [...fixtureEvidence, ...commandEvidence]) {
    if (
      evidence.skillKey !== input.manifest.skillKey ||
      evidence.skillVersion !== input.manifest.skillVersion ||
      evidence.contractVersion !== input.manifest.contractVersion ||
      evidence.manifestHash !== input.manifest.manifestHash ||
      evidence.testedCommitSha !== input.testedCommitSha ||
      evidence.relevantSourceTreeHash !== input.relevantSourceTreeHash
    ) throw new Error('B-roll qualification evidence belongs to another commit, source tree, or manifest.')
    if (!evidence.passed || evidence.exitStatus !== 0) {
      throw new Error(`B-roll qualification evidence failed: ${evidence.fixtureKey}.`)
    }
    if (
      evidence.providerRequestCount !== 0 ||
      evidence.publicArtifactCount !== 0 ||
      evidence.productionMutationCount !== 0
    ) throw new Error('Internal B-roll qualification evidence performed an external or production mutation.')
  }
  for (const evidence of fixtureEvidence) {
    const command = commandById.get(evidence.commandId)
    if (!command || !evidence.evidenceArtifactHashes.includes(command.evidenceHash)) {
      throw new Error(`Fixture ${evidence.fixtureKey} is not bound to its actual command evidence.`)
    }
  }
  const startedAt = [...fixtureEvidence, ...commandEvidence]
    .map((entry) => entry.startedAt).sort()[0]!
  const completedAt = [...fixtureEvidence, ...commandEvidence]
    .map((entry) => entry.completedAt).sort().at(-1)!
  const fixtureEvidenceRefs = fixtureEvidence.map((entry) => ({
    fixtureKey: entry.fixtureKey,
    commandId: entry.commandId,
    evidenceHash: entry.evidenceHash,
  }))
  const planningOnly = input.qualificationStatus === 'planning_qualified'
  const receipt = createSkillQualificationReceiptV2({
    schemaVersion: 'skill-qualification-receipt-v2',
    manifestRef,
    qualificationStatus: input.qualificationStatus,
    testedCommitSha: input.testedCommitSha,
    relevantSourceTreeHash: input.relevantSourceTreeHash,
    fixtureResults: fixtureEvidence.map((entry) => ({
      fixtureKey: entry.fixtureKey,
      status: 'passed' as const,
      evidenceHash: entry.evidenceHash,
      summary: `${entry.fixtureKey.replaceAll('_', ' ')} passed via ${entry.commandId}.`,
    })),
    fixtureEvidenceRefs,
    buildEvidenceHashes: commandEvidenceHashes(commandEvidence, BUILD_COMMAND_IDS),
    testEvidenceHashes: commandEvidence.map((entry) => entry.evidenceHash),
    securityEvidenceHashes: planningOnly
      ? commandEvidenceHashes(commandEvidence, ['npm.test:edit-skill-capability-kernel'])
      : commandEvidenceHashes(commandEvidence, SECURITY_COMMAND_IDS),
    providerEvidenceHashes: planningOnly
      ? commandEvidenceHashes(commandEvidence, ['npm.test:b-roll-planning'])
      : commandEvidenceHashes(commandEvidence, PROVIDER_COMMAND_IDS),
    startedAt,
    completedAt,
    issuedAt: completedAt,
  })
  assertSkillQualificationReceipt(receipt)
  const core = generatedArtifactCoreSchema.parse({
    schemaVersion: 'b_roll_generated_qualification_artifact_v1',
    generatedBy: 'npm.qualify:b-roll:internal.v1',
    manifestRef,
    testedCommitSha: input.testedCommitSha,
    relevantSourceTreeHash: input.relevantSourceTreeHash,
    fixtureEvidence,
    commandEvidence,
    receipt,
  })
  return brollGeneratedQualificationArtifactSchema.parse({
    ...core,
    artifactHash: hashSkillValue(core),
  })
}

export function assertBrollGeneratedQualificationArtifact(input: {
  artifact: unknown
  manifest: Readonly<SkillCapabilityManifest>
  expectedRelevantSourceTreeHash: string
}): BrollGeneratedQualificationArtifact {
  const artifact = brollGeneratedQualificationArtifactSchema.parse(input.artifact)
  if (
    hashSkillValue(artifact.manifestRef) !== hashSkillValue(skillManifestReference(input.manifest)) ||
    artifact.relevantSourceTreeHash !== input.expectedRelevantSourceTreeHash ||
    artifact.receipt.schemaVersion !== 'skill-qualification-receipt-v2' ||
    artifact.receipt.testedCommitSha !== artifact.testedCommitSha ||
    artifact.receipt.relevantSourceTreeHash !== artifact.relevantSourceTreeHash ||
    !['planning_qualified', 'internal_execution_qualified'].includes(
      artifact.receipt.qualificationStatus,
    )
  ) throw new Error('Generated B-roll qualification artifact is stale or overclaims its authority.')
  const expectedFixtureKeys = artifact.receipt.qualificationStatus === 'planning_qualified'
    ? [...BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS]
    : [...REQUIRED_INTERNAL_FIXTURE_KEYS]
  const fixtureKeys = artifact.fixtureEvidence.map((entry) => entry.fixtureKey)
  if (hashSkillValue(fixtureKeys) !== hashSkillValue(expectedFixtureKeys)) {
    throw new Error('Generated B-roll qualification artifact has missing or duplicate fixtures.')
  }
  const commandById = new Map(artifact.commandEvidence.map((entry) => [entry.commandId, entry]))
  if (commandById.size !== artifact.commandEvidence.length) {
    throw new Error('Generated B-roll qualification artifact has duplicate command evidence.')
  }
  for (const evidence of [...artifact.fixtureEvidence, ...artifact.commandEvidence]) {
    if (
      evidence.testedCommitSha !== artifact.testedCommitSha ||
      evidence.relevantSourceTreeHash !== artifact.relevantSourceTreeHash ||
      evidence.manifestHash !== artifact.manifestRef.manifestHash ||
      !evidence.passed || evidence.exitStatus !== 0
    ) throw new Error('Generated B-roll qualification evidence is failed, stale, or forged.')
  }
  for (const ref of artifact.receipt.fixtureEvidenceRefs) {
    const fixture = artifact.fixtureEvidence.find((entry) => entry.fixtureKey === ref.fixtureKey)
    const command = commandById.get(ref.commandId)
    if (
      !fixture || !command || fixture.evidenceHash !== ref.evidenceHash ||
      fixture.commandId !== ref.commandId ||
      !fixture.evidenceArtifactHashes.includes(command.evidenceHash)
    ) throw new Error('Generated B-roll receipt lost actual fixture command lineage.')
  }
  if (artifact.receipt.fixtureResults.some((entry) =>
    BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS.includes(
      entry.fixtureKey as (typeof BROLL_PRODUCTION_QUALIFICATION_FIXTURE_KEYS)[number],
    ))) throw new Error('Internal B-roll qualification cannot include production fixture claims.')
  assertSkillQualificationReceipt(artifact.receipt)
  return artifact
}

export function tryLoadBrollGeneratedQualificationArtifact(input: {
  manifest: Readonly<SkillCapabilityManifest>
  expectedRelevantSourceTreeHash: string
}): BrollGeneratedQualificationArtifact | undefined {
  if (GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT === undefined) return undefined
  return assertBrollGeneratedQualificationArtifact({
    artifact: GENERATED_BROLL_INTERNAL_QUALIFICATION_ARTIFACT,
    ...input,
  })
}

export function loadBrollGeneratedQualificationReceipt(input: {
  manifest: Readonly<SkillCapabilityManifest>
  expectedRelevantSourceTreeHash: string
}) {
  const artifact = tryLoadBrollGeneratedQualificationArtifact(input)
  if (!artifact) {
    throw new Error('B-roll runtime is unqualified: generated qualification evidence is unavailable.')
  }
  return artifact.receipt
}

export function loadBrollGeneratedQualificationReceiptForCurrentSource(
  manifest: Readonly<SkillCapabilityManifest>,
) {
  return loadBrollGeneratedQualificationReceipt({
    manifest,
    expectedRelevantSourceTreeHash: computeBrollRelevantSourceTreeHash(),
  })
}
