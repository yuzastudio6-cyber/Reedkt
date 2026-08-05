import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

import { hashSkillValue } from '../edit-skills/core/skill-capability-manifest-hash'

const mode = process.env.REEDITPRO_TRACK_ALL_BROLL_ACCEPTANCE_MODE
if (mode !== 'bootstrap_prior_actual_acceptance' &&
  mode !== 'actual_current_source_acceptance') {
  throw new Error('Track All B-Roll consumer evidence requires an explicit qualification mode.')
}

if (mode === 'bootstrap_prior_actual_acceptance') {
  const priorActualAcceptance = {
    schemaVersion: 'track_all_b_roll_consumer_acceptance_bootstrap_v1' as const,
    testedSourceCommit: 'fa16c0135278eb8a867e2bd2385f9af463af58a7',
    trackAllQualificationReceiptHash:
      '70d3619d9b6044993416e53d9ac9703cab021967ea166829bf46d5e034cec9b3',
    supportRequestHash:
      '46771f5093ddce37e83e81601419ba7294aa2b58a26dfecbcd5a542de618b133',
    supportResultHash:
      '61c3ed1b121238c206791ebe008caa3ba0c87302fedc13a4c5c7d5d421907dfb',
    acceptanceHash:
      'aab7f8fe72724b2f33b9e045de620b049c8a7c14b1ba0a02abbdaed9597711c4',
    producerAssignmentId: 'track-25-owner-assignment',
    consumerAssignmentId: 'track-25-broll-consumer-assignment',
    publicArtifactCount: 0 as const,
    productionMutationCount: 0 as const,
    actualSamRequestCount: 0 as const,
    actualGpuExecutionCount: 0 as const,
    currentSourceAcceptance: false as const,
    qualificationBootstrapOnly: true as const,
  }
  console.log(JSON.stringify({
    status: 'bootstrap_passed',
    evidenceClass: mode,
    priorActualAcceptance,
    evidenceHash: hashSkillValue(priorActualAcceptance),
  }))
} else {
  const result = spawnSync('npm', ['run', 'test:b-roll-public-plugin'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 24 * 1024 * 1024,
  })
  const stdout = result.stdout ?? ''
  const stderr = result.stderr ?? ''
  assert.equal(result.status, 0, `${stdout}\n${stderr}`)
  assert.match(stdout, /"trackSupportIntegration"/u)
  assert.match(stdout, /"directUnauthenticatedTrackGraphRejected": true/u)
  assert.match(stdout, /"authenticatedOwnerEvidencePublished": false/u)
  console.log(stdout.trim())
  console.log(JSON.stringify({
    status: 'passed',
    evidenceClass: mode,
    nestedCommand: 'npm.test:b-roll-public-plugin',
    nestedStdoutDigest: hashSkillValue(stdout),
    nestedStderrDigest: hashSkillValue(stderr),
    publicArtifactCount: 0,
    productionMutationCount: 0,
  }))
}
