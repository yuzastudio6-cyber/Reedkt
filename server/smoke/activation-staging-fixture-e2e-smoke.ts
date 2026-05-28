import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildFixtureJobEnv,
  buildFixturePrefix,
  buildStagingFixtureE2EConfig,
  buildStagingFixtureE2EReport,
  expectedStagingFixtureArtifacts,
  stagingFixtureBuckets,
  validateStagingFixtureE2EConfig,
} from '../activation/staging-fixture-e2e'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }

const config = buildStagingFixtureE2EConfig({
  projectId: 'reeditpro',
  region: 'us-central1',
  imageTag: 'staging-fixture-001',
  mode: 'plan',
  runId: 'smoke-fixture',
  env: {
    REEDITPRO_ENV: 'staging',
    REEDITPRO_CONFIRM_STAGING_E2E: 'false',
  } as NodeJS.ProcessEnv,
})

assert.equal(config.projectId, 'reeditpro')
assert.equal(config.region, 'us-central1')
assert.equal(config.confirmE2E, false)
assert.deepEqual(validateStagingFixtureE2EConfig(config), [])

const executeConfig = { ...config, mode: 'execute' as const, confirmE2E: false }
assert.ok(validateStagingFixtureE2EConfig(executeConfig).some((blocker) => blocker.includes('REEDITPRO_CONFIRM_STAGING_E2E')))
assert.ok(validateStagingFixtureE2EConfig({ ...config, projectId: 'production' }).length > 0)

assert.equal(stagingFixtureBuckets.source, 'reeditpro-staging-reeditpro-source-media')
assert.equal(stagingFixtureBuckets.finalExports, 'reeditpro-staging-reeditpro-final-exports')

const prefix = buildFixturePrefix('smoke-fixture')
assert.equal(prefix, 'activation-fixtures/phase25/smoke-fixture')
assert.throws(() => buildFixturePrefix('../bad'))

const env = buildFixtureJobEnv({
  runId: 'smoke-fixture',
  sourceObject: 'activation-fixtures/phase25/smoke-fixture/fixture.mp4',
  projectId: 'reeditpro',
})
assert.equal(env.REEDITPRO_ENV, 'staging')
assert.equal(env.REEDITPRO_CONFIRM_STAGING_E2E, 'true')
assert.equal(env.PROVIDER_EXECUTION_ENABLED, 'false')
assert.equal(env.MODEL_DOWNLOADS_ENABLED, 'false')
assert.equal(env.STAGING_FIXTURE_SOURCE_BUCKET, stagingFixtureBuckets.source)
assert.ok(!Object.values(env).some((value) => /signedUrl|rawPrompt|allUsers|gpu-ai/i.test(value)))

const artifacts = expectedStagingFixtureArtifacts('smoke-fixture')
assert.ok(artifacts.some((artifact) => artifact.kind === 'source_fixture'))
assert.ok(artifacts.some((artifact) => artifact.kind === 'final_export'))
assert.ok(artifacts.every((artifact) => artifact.private))
assert.ok(artifacts.every((artifact) => artifact.object.startsWith('activation-fixtures/phase25/smoke-fixture/')))

const report = buildStagingFixtureE2EReport(config)
assert.equal(report.providerExecuted, false)
assert.equal(report.modelDownloadExecuted, false)
assert.equal(report.gpuExecuted, false)
assert.equal(report.realUserMediaUsed, false)
assert.equal(report.publicAccessGranted, false)
assert.equal(report.secretValuesCreated, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.realUserMediaTestingAllowed, false)
assert.equal(report.phase28Readiness.ready, false)

assert.ok(packageJson.scripts['activation:staging:fixture-e2e'])
assert.ok(packageJson.scripts['smoke:activation-staging-fixture-e2e'])
assert.ok(packageJson.scripts['build:staging-fixture-worker'])
assert.ok(!packageJson.scripts['activation:staging:fixture-e2e'].includes('gcloud'))
assert.ok(!packageJson.scripts['smoke:activation-staging-fixture-e2e'].includes('gcloud'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'config_guarded',
    'confirmation_required_for_execute',
    'staging_buckets',
    'fixture_prefix_safe',
    'job_env_safe',
    'private_artifacts',
    'false_launch_gates',
    'package_scripts_static',
  ],
}))
