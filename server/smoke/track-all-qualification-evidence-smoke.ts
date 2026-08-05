import assert from 'node:assert/strict'

import { TRACK_ALL_CAPABILITY_MANIFEST } from '../edit-skills/track-all/track-all-capability-manifest'
import {
  TRACK_ALL_FIXTURE_COMMAND,
  TRACK_ALL_QUALIFICATION_COMMAND_IDS,
  TRACK_ALL_ROUTE_COMMANDS,
} from '../edit-skills/track-all/track-all-qualification-command-catalog'
import {
  assertTrackAllGeneratedQualificationArtifact,
  createTrackAllRouteQualificationEvidence,
  issueTrackAllGeneratedQualificationArtifact,
  type TrackAllRouteQualificationEvidence,
} from '../edit-skills/track-all/track-all-qualification-evidence'
import {
  TRACK_ALL_QUALIFICATION_FIXTURE_KEYS,
  TRACK_ALL_ROUTE_QUALIFICATION_KEYS,
  type TrackAllRouteQualificationKey,
} from '../edit-skills/track-all/track-all-qualification'
import { computeTrackAllQualificationDependencyAuthorityHashes } from '../edit-skills/track-all/track-all-qualification-dependency-authorities'
import { computeTrackAllRelevantSourceTreeHash } from '../edit-skills/track-all/track-all-qualification-source-hash'
import {
  createSkillQualificationFixtureEvidence,
  type SkillQualificationFixtureEvidence,
} from '../edit-skills/core/skill-qualification-evidence'
import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'
import { assertQualificationSupportsClaim } from '../edit-skills/core/skill-qualification-receipt'

const testedCommitSha = 'a'.repeat(40)
const sourceTreeHash = computeTrackAllRelevantSourceTreeHash()
const dependencyAuthorityHashes = computeTrackAllQualificationDependencyAuthorityHashes()
const startedAt = '2026-08-04T20:00:00.000Z'
const completedAt = '2026-08-04T20:00:01.000Z'

function commandEvidence(commandId: string): SkillQualificationFixtureEvidence {
  return createSkillQualificationFixtureEvidence({
    schemaVersion: 'skill-qualification-fixture-evidence-v1',
    skillKey: 'track_all',
    skillVersion: TRACK_ALL_CAPABILITY_MANIFEST.skillVersion,
    contractVersion: TRACK_ALL_CAPABILITY_MANIFEST.contractVersion,
    manifestHash: TRACK_ALL_CAPABILITY_MANIFEST.manifestHash,
    fixtureKey: `command.${commandId.slice(4)}`,
    commandId,
    testedCommitSha,
    relevantSourceTreeHash: sourceTreeHash,
    dependencyAuthorityHashes: [...dependencyAuthorityHashes],
    startedAt,
    completedAt,
    exitStatus: 0,
    passed: true,
    evidenceArtifactHashes: [hashSkillValue({ commandId, run: 'actual_exit_evidence' })],
    stdoutDigest: hashSkillValue({ commandId, stream: 'stdout' }),
    stderrDigest: hashSkillValue({ commandId, stream: 'stderr' }),
    environmentClass: 'local_internal_qualification',
    providerRequestCount: 0,
    publicArtifactCount: 0,
    productionMutationCount: 0,
  })
}

const commands = TRACK_ALL_QUALIFICATION_COMMAND_IDS.map(commandEvidence)
const commandById = new Map(commands.map((entry) => [entry.commandId, entry]))
function required(commandId: string) {
  const evidence = commandById.get(commandId)
  if (!evidence) throw new Error(`Test command is missing: ${commandId}.`)
  return evidence
}
const fixtures = TRACK_ALL_QUALIFICATION_FIXTURE_KEYS.map((fixtureKey) => {
  const command = required(TRACK_ALL_FIXTURE_COMMAND[fixtureKey])
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
    providerRequestCount: 0,
    publicArtifactCount: 0,
    productionMutationCount: 0,
  })
})

function routeEvidence(routeKey: TrackAllRouteQualificationKey): TrackAllRouteQualificationEvidence {
  const commandEvidenceHashes = TRACK_ALL_ROUTE_COMMANDS[routeKey].map((commandId) =>
    required(commandId).evidenceHash)
  if (routeKey === 'sam3_1_masklet_route') return createTrackAllRouteQualificationEvidence({
    routeKey,
    qualificationStatus: 'blocked',
    evidenceClass: 'missing_external_sam_evidence',
    commandEvidenceHashes,
    actualSamInferenceObserved: false,
    productionWorkerObserved: false,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    summary: 'Injected lifecycle is not actual SAM inference.',
  })
  if (routeKey === 'production_worker_route') return createTrackAllRouteQualificationEvidence({
    routeKey,
    qualificationStatus: 'blocked',
    evidenceClass: 'missing_production_evidence',
    commandEvidenceHashes,
    actualSamInferenceObserved: false,
    productionWorkerObserved: false,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    summary: 'No production worker evidence exists.',
  })
  const planning = routeKey === 'planning_core_route'
  return createTrackAllRouteQualificationEvidence({
    routeKey,
    qualificationStatus: planning ? 'planning_qualified' : 'internal_execution_qualified',
    evidenceClass: planning
      ? 'actual_planning_command_evidence'
      : routeKey === 'public_plugin_lifecycle_route'
        ? 'actual_injected_private_lifecycle_evidence'
        : 'actual_deterministic_private_fixture_evidence',
    commandEvidenceHashes,
    actualSamInferenceObserved: false,
    productionWorkerObserved: false,
    publicArtifactCount: 0,
    productionMutationCount: 0,
    summary: 'Actual fixture command passed without external execution.',
  })
}

const routes = TRACK_ALL_ROUTE_QUALIFICATION_KEYS.map(routeEvidence)
const artifact = issueTrackAllGeneratedQualificationArtifact({
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  testedCommitSha,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures,
  commandEvidence: commands,
  routeQualifications: routes,
})
assert.equal(assertTrackAllGeneratedQualificationArtifact({
  artifact,
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: sourceTreeHash,
  expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
}).artifactHash, artifact.artifactHash)
assert.equal(artifact.receipt.qualificationStatus, 'planning_qualified')
assert.equal(artifact.actualSamRequestCount, 0)
assert.equal(artifact.actualGpuExecutionCount, 0)
assert.equal(artifact.productionQualified, false)
assert.throws(() => assertQualificationSupportsClaim({
  manifestRef: artifact.manifestRef,
  claimedStatus: 'internal_execution_qualified',
  receipt: artifact.receipt,
}), /exceeds/iu)

const failedCommand = structuredClone(commands)
failedCommand[0]!.exitStatus = 1
failedCommand[0]!.passed = false
assert.throws(() => issueTrackAllGeneratedQualificationArtifact({
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  testedCommitSha,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures,
  commandEvidence: failedCommand,
  routeQualifications: routes,
}))

const duplicateFixtures = structuredClone(fixtures)
duplicateFixtures[1] = structuredClone(duplicateFixtures[0]!)
assert.throws(() => issueTrackAllGeneratedQualificationArtifact({
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  testedCommitSha,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: duplicateFixtures,
  commandEvidence: commands,
  routeQualifications: routes,
}), /fixture evidence/iu)

assert.throws(() => issueTrackAllGeneratedQualificationArtifact({
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  testedCommitSha,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures.slice(1),
  commandEvidence: commands,
  routeQualifications: routes,
}), /too_small|array must contain|fixture/iu)

const wrongCommitFixture = structuredClone(fixtures)
wrongCommitFixture[0]!.testedCommitSha = 'b'.repeat(40)
assert.throws(() => issueTrackAllGeneratedQualificationArtifact({
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  testedCommitSha,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: wrongCommitFixture,
  commandEvidence: commands,
  routeQualifications: routes,
}), /failed, stale|forged/iu)

assert.throws(() => assertTrackAllGeneratedQualificationArtifact({
  artifact,
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: hashSkillValue('changed-source'),
  expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
}), /stale|authority/iu)

const wrongAuthorities = structuredClone(dependencyAuthorityHashes)
wrongAuthorities[0]!.authorityHash = hashSkillValue('wrong-authority')
assert.throws(() => assertTrackAllGeneratedQualificationArtifact({
  artifact,
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: sourceTreeHash,
  expectedDependencyAuthorityHashes: wrongAuthorities,
}), /authority/iu)

const reorderedAuthorities = [...dependencyAuthorityHashes].reverse()
assert.throws(() => assertTrackAllGeneratedQualificationArtifact({
  artifact,
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: sourceTreeHash,
  expectedDependencyAuthorityHashes: reorderedAuthorities,
}), /authority|reordered/iu)

const wrongManifest = {
  ...TRACK_ALL_CAPABILITY_MANIFEST,
  manifestHash: hashSkillValue('wrong-manifest'),
}
assert.throws(() => assertTrackAllGeneratedQualificationArtifact({
  artifact,
  manifest: wrongManifest,
  expectedRelevantSourceTreeHash: sourceTreeHash,
  expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
}), /stale|authority/iu)

const forgedArtifact = structuredClone(artifact)
forgedArtifact.artifactHash = hashSkillValue('forged-artifact')
assert.throws(() => assertTrackAllGeneratedQualificationArtifact({
  artifact: forgedArtifact,
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  expectedRelevantSourceTreeHash: sourceTreeHash,
  expectedDependencyAuthorityHashes: dependencyAuthorityHashes,
}), /stale or forged/iu)

const samOverclaim = structuredClone(routes.find((route) =>
  route.routeKey === 'sam3_1_masklet_route')!)
samOverclaim.qualificationStatus = 'internal_execution_qualified'
samOverclaim.actualSamInferenceObserved = true
const { routeEvidenceHash: _oldRouteHash, ...samOverclaimCore } = samOverclaim
void _oldRouteHash
assert.throws(() => createTrackAllRouteQualificationEvidence(samOverclaimCore), /must remain blocked/iu)

const planningOverclaim = structuredClone(routes)
const planningRoute = planningOverclaim.find((route) =>
  route.routeKey === 'planning_core_route')!
planningRoute.qualificationStatus = 'internal_execution_qualified'
const { routeEvidenceHash: _planningHash, ...planningCore } = planningRoute
void _planningHash
planningOverclaim[planningOverclaim.indexOf(planningRoute)] =
  createTrackAllRouteQualificationEvidence(planningCore)
assert.throws(() => issueTrackAllGeneratedQualificationArtifact({
  manifest: TRACK_ALL_CAPABILITY_MANIFEST,
  testedCommitSha,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures,
  commandEvidence: commands,
  routeQualifications: planningOverclaim,
}), /overclaims or misclassifies/iu)

const manifestOverclaim = {
  ...structuredClone(TRACK_ALL_CAPABILITY_MANIFEST),
  qualificationStatus: 'internal_execution_qualified' as const,
}
assert.throws(() => issueTrackAllGeneratedQualificationArtifact({
  manifest: manifestOverclaim,
  testedCommitSha,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthorityHashes,
  fixtureEvidence: fixtures,
  commandEvidence: commands,
  routeQualifications: routes,
}), /overclaims/iu)

console.log(JSON.stringify({
  status: 'ok',
  manifestHash: artifact.manifestRef.manifestHash,
  relevantSourceTreeHash: sourceTreeHash,
  dependencyAuthoritySetHash: hashSkillValue(dependencyAuthorityHashes),
  fixtureCount: artifact.fixtureEvidence.length,
  commandCount: artifact.commandEvidence.length,
  routeCount: artifact.routeQualifications.length,
  receiptHash: artifact.receipt.receiptHash,
  artifactHash: artifact.artifactHash,
  missingFixtureRejected: true,
  duplicateFixtureRejected: true,
  failedCommandRejected: true,
  wrongCommitRejected: true,
  wrongSourceTreeRejected: true,
  wrongAuthorityRejected: true,
  reorderedAuthorityRejected: true,
  wrongManifestRejected: true,
  forgedHashRejected: true,
  samOverclaimRejected: true,
  planningRouteOverclaimRejected: true,
  productionOverclaimRejected: true,
  runtimeHigherStatusClaimRejected: true,
}))
