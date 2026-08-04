import assert from 'node:assert/strict'
import { StandaloneCanonicalMusicSkillService } from '../edit-skills/music/canonical-music-skill-service'
import { MUSIC_CAPABILITY_MODE_MATRIX, validateMusicCapabilityModeMatrix } from '../edit-skills/music/music-capability-mode-matrix'
import { MUSIC_JOB_TYPES } from '../music/music-contracts'
import { evaluateMusicScopeGuard } from '../music/music-scope-guard'
import { makeCanonicalMusicRequest, makeMusicCue } from './canonical-music-test-fixtures'

validateMusicCapabilityModeMatrix()
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

const evidenceSuites = new Set([
  'canonical-music-foundation-smoke', 'canonical-music-professional-scenarios-smoke',
  'canonical-music-source-sound-e2e-smoke', 'canonical-music-lyria-e2e-smoke',
  'canonical-music-rational-timing-smoke', 'canonical-music-localized-revision-smoke',
  'canonical-music-provider-reconciliation-smoke',
])
function evidenceSuite(jobType: string): string {
  if (jobType.includes('generate_music')) return 'canonical-music-lyria-e2e-smoke'
  if (jobType === 'revise_music') return 'canonical-music-localized-revision-smoke'
  if (jobType.includes('sync') || jobType.includes('fit_music')) return 'canonical-music-rational-timing-smoke'
  if (jobType.includes('sound') || jobType.includes('stem') || jobType.includes('mix')) return 'canonical-music-source-sound-e2e-smoke'
  if (jobType.includes('study') || jobType.includes('reference') || jobType.includes('search') || jobType.includes('select')) {
    return 'canonical-music-professional-scenarios-smoke'
  }
  return 'canonical-music-professional-scenarios-smoke'
}
for (const entry of MUSIC_CAPABILITY_MODE_MATRIX) {
  assert.ok(entry.acceptanceTestKey)
  if (entry.fixtureExecutionQualification !== 'blocked') {
    assert.ok(entry.fixtureExecutionTestKey)
    assert.ok(evidenceSuites.has(evidenceSuite(entry.jobType)))
  }
  if (entry.privateInternalQualification !== 'blocked') {
    assert.ok(entry.privateInternalExecutionTestKey)
    assert.ok(evidenceSuites.has(evidenceSuite(entry.jobType)))
  }
  assert.equal(entry.productionQualification, 'blocked')
  assert.equal(entry.productionExecutionTestKey, undefined)
}

console.log(JSON.stringify({ status: 'ok', supportedJobs: MUSIC_JOB_TYPES.length,
  planningJobsExercised: planningResults.length,
  fixtureQualifiedJobs: MUSIC_CAPABILITY_MODE_MATRIX.filter((entry) => entry.fixtureExecutionQualification !== 'blocked').length,
  privateQualifiedJobs: MUSIC_CAPABILITY_MODE_MATRIX.filter((entry) => entry.privateInternalQualification !== 'blocked').length,
  productionQualifiedJobs: 0 }, null, 2))
