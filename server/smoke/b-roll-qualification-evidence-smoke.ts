import assert from 'node:assert/strict'

import { BROLL_CAPABILITY_MANIFEST } from '../edit-skills/b-roll/b-roll-capability-manifest'
import {
  assertBrollGeneratedQualificationArtifact,
  issueBrollGeneratedQualificationArtifact,
} from '../edit-skills/b-roll/b-roll-qualification-evidence'
import {
  assertBrollQualificationDependencyAuthorityHashes,
  computeBrollQualificationDependencyAuthorityHashes,
} from '../edit-skills/b-roll/b-roll-qualification-dependency-authorities'
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
const dependencyAuthorityHashes = computeBrollQualificationDependencyAuthorityHashes()
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
  'npm.test:b-roll-canonical-private-runtime',
  'npm.smoke:b-roll-existing-source',
  'npm.test:b-roll-canonical-integration',
  'npm.smoke:b-roll-remotion-integration',
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
    dependencyAuthorityHashes: [...dependencyAuthorityHashes],
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
    dependencyAuthorityHashes: command.dependencyAuthorityHashes,
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
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures,
  commandEvidence: commands,
})

assert.equal(
  assertBrollGeneratedQualificationArtifact({
    artifact,
    manifest: BROLL_CAPABILITY_MANIFEST,
    expectedRelevantSourceTreeHash: relevantSourceTreeHash,
    expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
  }).artifactHash,
  artifact.artifactHash,
)
assert.equal(artifact.receipt.qualificationStatus, 'internal_execution_qualified')
assert.equal(artifact.receipt.testedCommitSha, testedCommitSha)
assert.equal(artifact.receipt.fixtureEvidenceRefs.length, requiredFixtureKeys.length)
assert.equal(
  artifact.receipt.dependencyAuthorityHashes.length,
  dependencyAuthorityHashes.length,
)
assert.equal(artifact.receipt.providerEvidenceHashes.length, 4)
assert.equal(artifact.receipt.mediaEvidenceHashes.length, 3)
assert.equal(artifact.receipt.remotionEvidenceHashes.length, 4)

assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: BROLL_CAPABILITY_MANIFEST,
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures.slice(0, -1),
  commandEvidence: commands,
}), /missing, duplicate, or out of canonical order/u)

assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: BROLL_CAPABILITY_MANIFEST,
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  dependencyAuthorityHashes,
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
  dependencyAuthorityHashes,
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
  dependencyAuthorityHashes,
  ...mismatch,
}), /another commit, source tree, or manifest/u)

assert.throws(() => issueBrollGeneratedQualificationArtifact({
  manifest: { ...BROLL_CAPABILITY_MANIFEST, manifestHash: 'e'.repeat(64) },
  qualificationStatus: 'internal_execution_qualified',
  testedCommitSha,
  relevantSourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures,
  commandEvidence: commands,
}), /another commit, source tree, or manifest/u)

assert.throws(() => assertBrollGeneratedQualificationArtifact({
  artifact: { ...artifact, artifactHash: 'f'.repeat(64) },
  manifest: BROLL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: relevantSourceTreeHash,
  expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
}), /hash is stale or forged/u)

assert.throws(() => assertBrollGeneratedQualificationArtifact({
  artifact,
  manifest: BROLL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: '0'.repeat(64),
  expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
}), /stale or overclaims/u)

for (let index = 0; index < dependencyAuthorityHashes.length; index += 1) {
  const changed = dependencyAuthorityHashes.map((entry, entryIndex) =>
    entryIndex === index ? { ...entry, authorityHash: '0'.repeat(64) } : entry)
  assert.throws(() => assertBrollGeneratedQualificationArtifact({
    artifact,
    manifest: BROLL_CAPABILITY_MANIFEST,
    expectedRelevantSourceTreeHash: relevantSourceTreeHash,
    expectedDependencyAuthorityHashes: changed,
  }), /changed or is forged/iu)
}

assert.throws(() => assertBrollQualificationDependencyAuthorityHashes({
  actual: dependencyAuthorityHashes.slice(0, -1),
  expected: dependencyAuthorityHashes,
}), /missing, duplicate, unknown/iu)
assert.throws(() => assertBrollQualificationDependencyAuthorityHashes({
  actual: [...dependencyAuthorityHashes.slice(0, -1), dependencyAuthorityHashes[0]!],
  expected: dependencyAuthorityHashes,
}), /missing, duplicate, unknown/iu)
assert.throws(() => assertBrollQualificationDependencyAuthorityHashes({
  actual: dependencyAuthorityHashes.map((entry, index) => index === 0
    ? { ...entry, authorityKey: 'unknown_shared_execution_authority' }
    : entry),
  expected: dependencyAuthorityHashes,
}), /missing, duplicate, unknown/iu)

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
  dependencyAuthorityCount: dependencyAuthorityHashes.length,
  independentlyChangedAuthorityCases: dependencyAuthorityHashes.length,
}, null, 2))
