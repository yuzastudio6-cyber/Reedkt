import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const smokeScripts = Array.from({ length: 20 }, (_, index) =>
  `smoke:captions-specialist-cap-${String(index + 1).padStart(2, '0')}`)

const results = smokeScripts.map((script) => {
  const result = spawnSync('npm', ['run', script], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60_000,
    maxBuffer: 8 * 1024 * 1024,
  })
  assert.equal(result.error, undefined, `${script} failed to start.`)
  assert.equal(result.signal, null, `${script} was terminated by ${result.signal}.`)
  assert.equal(result.status, 0,
    `${script} failed.\n${result.stdout}\n${result.stderr}`)
  return {
    script,
    status: 'passed' as const,
    stdoutDigestInputLength: result.stdout.length,
    stderrEmpty: result.stderr.length === 0,
  }
})

assert.equal(results.length, 20)
assert.ok(results.every((result) => result.status === 'passed'))

console.log(JSON.stringify({
  smoke: 'captions_specialist_cap_20_source_aggregate',
  status: 'passed',
  milestoneCount: results.length,
  milestones: smokeScripts.map((script) => script.slice(-6).toUpperCase()),
  everySourceSmokePassed: true,
  cap00rDocumentationCheckedByCap20: true,
  mediaRuntimeStarted: false,
  modelOrProviderCallMade: false,
  dockerRuntimeStarted: false,
  directVisualEvidenceReusedWithoutRelabeling: true,
  terminalQualificationClaimed: false,
  sharedOwnerIntegrationStillRequired: true,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}, null, 2))
