import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { StandaloneCanonicalMusicSkillService } from '../edit-skills/music/canonical-music-skill-service'
import { MUSIC_CAPABILITY_MODE_MATRIX, validateMusicCapabilityModeMatrix } from '../edit-skills/music/music-capability-mode-matrix'
import { MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY, resolveMusicAcceptanceEvidence,
  validateMusicAcceptanceEvidenceRegistry } from '../edit-skills/music/music-acceptance-evidence-registry'
import { MUSIC_JOB_TYPES } from '../music/music-contracts'
import { evaluateMusicScopeGuard } from '../music/music-scope-guard'
import { makeCanonicalMusicRequest, makeMusicCue } from './canonical-music-test-fixtures'

validateMusicCapabilityModeMatrix()
validateMusicAcceptanceEvidenceRegistry()
const service = new StandaloneCanonicalMusicSkillService({
  artifacts: { async resolve() { throw new Error('planning matrix') }, async privateOutputRoot() { throw new Error('planning matrix') } },
})
const planningResults: string[] = []
for (const jobType of MUSIC_JOB_TYPES) {
  const range = { rangeId: `matrix-range-${jobType}`, startFrame: 0, endFrameExclusive: 96 }
  const cue = makeMusicCue({ cueId: `matrix-cue-${jobType}`, range, acquisitionPreference: 'no_music' })
  const request = makeCanonicalMusicRequest({ requestId: `music-matrix-${jobType}`, mode: 'planning', jobType, cues: [cue] })
  const plan = await service.plan(request)
  assert.equal(plan.request.jobType, jobType)
  assert.ok(plan.routeBindings.length > 0)
  planningResults.push(jobType)

  const production = makeCanonicalMusicRequest({ requestId: `music-matrix-production-${jobType}`,
    mode: 'production', jobType, cues: [cue] })
  assert.equal(evaluateMusicScopeGuard(production).ok, false, `${jobType} must remain production blocked`)
}
assert.deepEqual(new Set(planningResults), new Set(MUSIC_JOB_TYPES))

const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as { scripts: Record<string, string> }
const aggregateCommand = packageJson.scripts['smoke:music'] ?? ''
for (const evidence of MUSIC_ACCEPTANCE_EVIDENCE_REGISTRY) {
  await access(evidence.sourceFile)
  const scriptStem = evidence.sourceFile.split('/').at(-1)!.replace(/-smoke\.ts$/, '')
  assert.ok(aggregateCommand.includes(scriptStem.replace('canonical-music-', 'music-')) ||
    Object.values(packageJson.scripts).some((command) => command.includes(evidence.sourceFile)),
  `${evidence.evidenceKey} must be executed by an aggregate Music acceptance script`)
}
for (const entry of MUSIC_CAPABILITY_MODE_MATRIX) {
  assert.equal(resolveMusicAcceptanceEvidence({ jobType: entry.jobType, mode: 'planning' })[0]?.evidenceKey,
    entry.acceptanceTestKey)
  if (entry.fixtureExecutionQualification !== 'blocked') {
    assert.equal(resolveMusicAcceptanceEvidence({ jobType: entry.jobType, mode: 'fixture' })[0]?.evidenceKey,
      entry.fixtureExecutionTestKey)
  }
  if (entry.privateInternalQualification !== 'blocked') {
    assert.equal(resolveMusicAcceptanceEvidence({ jobType: entry.jobType, mode: 'private_internal' })[0]?.evidenceKey,
      entry.privateInternalExecutionTestKey)
  }
  assert.equal(entry.productionQualification, 'blocked')
  assert.equal(entry.productionExecutionTestKey, undefined)
}

console.log(JSON.stringify({ status: 'ok', supportedJobs: MUSIC_JOB_TYPES.length,
  planningJobsExercised: planningResults.length,
  fixtureQualifiedJobs: MUSIC_CAPABILITY_MODE_MATRIX.filter((entry) => entry.fixtureExecutionQualification !== 'blocked').length,
  privateQualifiedJobs: MUSIC_CAPABILITY_MODE_MATRIX.filter((entry) => entry.privateInternalQualification !== 'blocked').length,
  productionQualifiedJobs: 0 }, null, 2))
