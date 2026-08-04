import assert from 'node:assert/strict'

import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import {
  assertBrollGeneratedQualificationArtifact,
  issueBrollGeneratedQualificationArtifact,
} from '../edit-skills/b-roll/b-roll-qualification-evidence'
import {
  BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS,
  BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
} from '../edit-skills/b-roll/b-roll-qualification'
import { hashSkillValue, skillManifestReference } from '../edit-skills/core/skill-capability-manifest-hash'
import {
  createSkillQualificationFixtureEvidence,
  type SkillQualificationFixtureEvidence,
} from '../edit-skills/core/skill-qualification-evidence'
import { SkillQualificationRegistry } from '../edit-skills/core/skill-qualification-registry'

const testedCommitSha = 'a'.repeat(40)
const relevantSourceTreeHash = 'b'.repeat(64)
const startedAt = '2026-08-03T12:00:00.000Z'
const completedAt = '2026-08-03T12:00:01.000Z'
const commandIds = [
  'npm.test:b-roll-planning',
  'npm.build',
  'npm.typecheck:server',
  'npm.lint',
  'npm.check:frontend-boundary',
  'npm.smoke:runtime-api-security',
  'npm.smoke:edit-execution-security-boundary',
  'npm.smoke:idempotency-boundary',
  'npm.smoke:b-roll-provider-authority',
  'npm.smoke:b-roll-provider-lifecycle',
  'npm.smoke:b-roll-candidate-qa',
  'npm.smoke:b-roll-end-to-end',
] as const

function commandEvidence(
  commandId: string,
  overrides: Partial<SkillQualificationFixtureEvidence> = {},
): SkillQualificationFixtureEvidence {
  const stdoutDigest = hashSkillValue({ commandId, stream: 'stdout' })
  const stderrDigest = hashSkillValue({ commandId, stream: 'stderr' })
  return createSkillQualificationFixtureEvidence({
    schemaVersion: 'skill-qualification-fixture-evidence-v1',
    skillKey: 'b_roll',
    skillVersion: BROLL_CAPABILITY_MANIFEST.skillVersion,
    contractVersion: BROLL_CAPABILITY_MANIFEST.contractVersion,
    manifestHash: BROLL_CAPABILITY_MANIFEST.manifestHash,
    fixtureKey: `command.${commandId.slice(4)}`,
    commandId,
    testedCommitSha,
    relevantSourceTreeHash,
    startedAt,
    completedAt,
    exitStatus: 0,
    passed: true,
    evidenceArtifactHashes: [hashSkillValue({ commandId, artifact: 'run' })],
    stdoutDigest,
    stderrDigest,
    environmentClass: 'local_internal_qualification',
    providerRequestCount: 0,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    ...overrides,
  })
}

const commands = commandIds.map((commandId) => commandEvidence(commandId))
const planningCommand = commands[0]!
const requiredFixtureKeys = [
  ...BROLL_PLANNING_QUALIFICATION_FIXTURE_KEYS,
  ...BROLL_INTERNAL_EXECUTION_QUALIFICATION_FIXTURE_KEYS,
]

function fixtureEvidence(
  fixtureKey: string,
  command = planningCommand,
): SkillQualificationFixtureEvidence {
  return createSkillQualificationFixtureEvidence({
    schemaVersion: 'skill-qualification-fixture-evidence-v1',
    skillKey: command.skillKey,
    skillVersion: command.skillVersion,
    contractVersion: command.contractVersion,
    manifestHash: command.manifestHash,
    fixtureKey,
    commandId: command.commandId,
    testedCommitSha: command.testedCommitSha,
    relevantSourceTreeHash: command.relevantSourceTreeHash,
    startedAt: command.startedAt,
    completedAt: command.completedAt,
    exitStatus: command.exitStatus,
    passed: command.passed,
    evidenceArtifactHashes: [command.evidenceHash],
    stdoutDigest: command.stdoutDigest,
    stderrDigest: command.stderrDigest,
    environmentClass: command.environmentClass,
    providerRequestCount: command.providerRequestCount,
    publicArtifactCount: command.publicArtifactCount,
    productionMutationCount: command.productionMutationCount,
  })
}

const fixtures = requiredFixtureKeys.map((fixtureKey) => fixtureEvidence(fixtureKey))
const artifact = issueBrollGeneratedQualificationArtifact({
  manifest: BROLL_CAPABILITY_MANIFEST,
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  fixtureEvidence: fixtures,
  commandEvidence: commands,
})

assert.equal(
  assertBrollGeneratedQualificationArtifact({
    artifact,
    manifest: BROLL_CAPABILITY_MANIFEST,
    expectedRelevantSourceTreeHash: relevantSourceTreeHash,
  }).artifactHash,
  artifact.artifactHash,
)
assert.equal(artifact.receipt.qualificationStatus, 'internal_execution_qualified')
assert.equal(artifact.receipt.testedCommitSha, testedCommitSha)
assert.equal(artifact.receipt.fixtureEvidenceRefs.length, requiredFixtureKeys.length)

assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: BROLL_CAPABILITY_MANIFEST,
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  fixtureEvidence: fixtures.slice(0, -1),
  commandEvidence: commands,
}), /missing, duplicate, or out of canonical order/u)

assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: BROLL_CAPABILITY_MANIFEST,
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  fixtureEvidence: [...fixtures.slice(0, -1), fixtures[0]!],
  commandEvidence: commands,
}), /missing, duplicate, or out of canonical order/u)

const failedCommand = commandEvidence('npm.test:b-roll-planning', {
  exitStatus: 1,
  passed: false,
})
assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: BROLL_CAPABILITY_MANIFEST,
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  fixtureEvidence: requiredFixtureKeys.map((fixtureKey) => fixtureEvidence(fixtureKey, failedCommand)),
  commandEvidence: [failedCommand, ...commands.slice(1)],
}), /evidence failed/u)

for (const mismatch of [
  { testedCommitSha: 'c'.repeat(40), relevantSourceTreeHash },
  { testedCommitSha, relevantSourceTreeHash: 'd'.repeat(64) },
]) assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: BROLL_CAPABILITY_MANIFEST,
  qualificationStatus: 'internal_execution_qualified',
  fixtureEvidence: fixtures,
  commandEvidence: commands,
  ...mismatch,
}), /another commit, source tree, or manifest/u)

assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: { ...BROLL_CAPABILITY_MANIFEST, manifestHash: 'e'.repeat(64) },
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  fixtureEvidence: fixtures,
  commandEvidence: commands,
}), /another commit, source tree, or manifest/u)

assert.throws(() => assertBrollGeneratedQualificationArtifact({
  artifact: { ...artifact, artifactHash: 'f'.repeat(64) },
  manifest: BROLL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: relevantSourceTreeHash,
}), /hash is stale or forged/u)

assert.throws(() => assertBrollGeneratedQualificationArtifact({
  artifact,
  manifest: BROLL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: '0'.repeat(64),
}), /stale or overclaims/u)

const qualificationRegistry = new SkillQualificationRegistry()
qualificationRegistry.register(artifact.receipt)
qualificationRegistry.assertClaim(skillManifestReference(BROLL_CAPABILITY_MANIFEST), 'internal_execution_qualified')
assert.throws(() => qualificationRegistry.assertClaim(
  skillManifestReference(BROLL_CAPABILITY_MANIFEST),
  'production_qualified',
), /exceeds/u)

console.log(JSON.stringify({
  status: 'ok',
  artifactHash: artifact.artifactHash,
  receiptHash: artifact.receipt.receiptHash,
  fixtureEvidenceCount: artifact.fixtureEvidence.length,
  commandEvidenceCount: artifact.commandEvidence.length,
}, null, 2))
