import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildGcpStagingCommandPlans,
  buildGcpStagingFoundationReport,
  buildGcpStagingResourceMap,
  parseGcpStagingConfig,
  validateGcpStagingCommandPlan,
  validateGcpStagingConfig,
  validateGcpStagingEnvExampleText,
  validateGcpStagingIamPlan,
  validateGcpStagingResourceMap,
  validateGcpStagingSecretPlan,
} from '../activation'
import { buildGcpStagingIamPlan } from '../activation/gcp-staging'

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

const envPath = new URL('../../.env.gcp.staging.example', import.meta.url)
assert.equal(existsSync(envPath), true, '.env.gcp.staging.example must exist.')
const envExample = readRepoFile('.env.gcp.staging.example')
assert.ok(envExample.includes('REEDITPRO_ENV=staging'), 'staging example must use REEDITPRO_ENV=staging.')
assert.ok(!envExample.includes('REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'), 'staging example must not enable setup confirmation.')
assert.equal(validateGcpStagingEnvExampleText(envExample).allowed, true, 'staging env example must not contain secret values.')

assert.equal(validateGcpStagingConfig({
  projectId: 'reeditpro-staging-test',
  environment: 'production',
}).allowed, false, 'config parser must reject production env.')
assert.equal(validateGcpStagingConfig({
  environment: 'staging',
}).allowed, false, 'config parser must reject missing GCP_PROJECT_ID.')
assert.equal(validateGcpStagingConfig({
  projectId: 'reeditpro-staging-test',
  environment: 'staging',
  imageTag: 'staging-test-001',
}).allowed, true, 'config parser must accept valid staging config.')

const config = parseGcpStagingConfig({
  projectId: 'reeditpro-staging-test',
  environment: 'staging',
  imageTag: 'staging-test-001',
})
const resourceMap = buildGcpStagingResourceMap(config)
assert.equal(resourceMap.artifactRegistry.repository, 'reeditpro-staging-workers', 'resource map must include staging Artifact Registry repo.')
assert.equal(resourceMap.buckets.length, 10, 'resource map must include all 10 bucket purposes.')
for (const bucket of resourceMap.buckets) {
  assert.ok(bucket.bucketName.includes('staging'), `${bucket.bucketName} must include staging.`)
  assert.equal(bucket.privateByDefault, true, `${bucket.bucketName} must be private by default.`)
  assert.equal(bucket.uniformBucketLevelAccess, true, `${bucket.bucketName} must use uniform access.`)
  assert.equal(bucket.publicAccessPrevention, true, `${bucket.bucketName} must prevent public access.`)
  assert.equal(bucket.signedUrlPersistenceAllowed, false, `${bucket.bucketName} must not persist signed URLs.`)
}
assert.equal(validateGcpStagingResourceMap(resourceMap).allowed, true, 'resource map must pass staging policy.')

const serviceAccountIds = resourceMap.serviceAccounts.map((account) => account.accountId)
for (const expected of [
  'reeditpro-staging-api-sa',
  'reeditpro-staging-cpu-worker-sa',
  'reeditpro-staging-gpu-worker-sa',
  'reeditpro-staging-render-worker-sa',
  'reeditpro-staging-qa-worker-sa',
  'reeditpro-staging-tool-readiness-sa',
]) {
  assert.ok(serviceAccountIds.includes(expected), `service account plan must include ${expected}.`)
}

const iamPlan = buildGcpStagingIamPlan(config, resourceMap)
assert.equal(validateGcpStagingIamPlan(iamPlan).allowed, true, 'IAM plan must pass policy.')
assert.ok(!iamPlan.some((binding) => /roles\/(owner|editor)\b/i.test(binding.role)), 'IAM plan must not include owner/editor.')
assert.ok(!JSON.stringify(iamPlan).match(/allUsers|allAuthenticatedUsers/), 'IAM plan must not include public principals.')

assert.equal(validateGcpStagingSecretPlan(resourceMap.secretPlaceholders).allowed, true, 'secret plan must pass policy.')
assert.ok(resourceMap.secretPlaceholders.every((secret) => secret.placeholderOnly && !secret.payloadCreated), 'secret plan must create names only.')

const commandPlans = buildGcpStagingCommandPlans(config, resourceMap)
assert.ok(commandPlans.some((plan) => plan.phase === 'enable_apis'), 'command plan must include enable APIs.')
assert.ok(commandPlans.some((plan) => plan.phase === 'artifact_registry'), 'command plan must include create Artifact Registry.')
assert.ok(commandPlans.some((plan) => plan.phase === 'gcs_buckets'), 'command plan must include create buckets.')
assert.ok(commandPlans.some((plan) => plan.phase === 'service_accounts'), 'command plan must include create service accounts.')
assert.ok(commandPlans.some((plan) => plan.phase === 'secret_placeholders'), 'command plan must include create secret placeholders.')
assert.ok(commandPlans.some((plan) => plan.phase === 'iam'), 'command plan must include configure IAM.')
assert.ok(commandPlans.some((plan) => plan.phase === 'image_names'), 'command plan must include image names.')
for (const plan of commandPlans.filter((candidate) => !['print_config', 'image_names', 'later_runtime'].includes(candidate.phase))) {
  assert.equal(plan.requiresConfirmation, true, `${plan.commandId} must require confirmation.`)
  assert.ok(plan.requiredEnvVars.includes('REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'), `${plan.commandId} must require staging confirmation env.`)
}
assert.equal(validateGcpStagingCommandPlan(commandPlans).allowed, true, 'command plan must pass policy.')
const commandText = commandPlans.map((plan) => plan.commandString).join('\n')
assert.ok(!/\bgcloud\s+run\s+(?:deploy|jobs\s+deploy)\b/i.test(commandText), 'Phase 22 command plan must not include Cloud Run deployment.')
assert.ok(!/\bdocker\s+push\b|\bgcloud\s+builds\s+submit\b/i.test(commandText), 'Phase 22 command plan must not include Docker push/image build.')
assert.ok(!/provider\s+call|runway\s+api\s+request|replicate\s+api\s+request|openai\s+api\s+request|gemini\s+api\s+request|stripe\s+charge/i.test(commandText), 'Phase 22 command plan must not include provider calls.')
assert.ok(!/huggingface-cli|snapshot_download|from_pretrained|download\s+model|model\s+download/i.test(commandText), 'Phase 22 command plan must not include model downloads.')
assert.ok(!/\/uploads\/|user[-_\s]?media|\.mp4\b|\.mov\b|\.mkv\b|\.wav\b/i.test(commandText), 'Phase 22 command plan must not include media processing.')
assert.ok(!/versions\s+add|--data-file|SECRET_VALUE|REAL_SECRET|paste secret/i.test(commandText), 'Phase 22 command plan must not include secret payload creation.')

const report = buildGcpStagingFoundationReport({
  configInput: {
    projectId: 'reeditpro-staging-test',
    environment: 'staging',
    imageTag: 'staging-test-001',
  },
  createdAt: '2026-05-27T00:00:00.000Z',
})
assert.equal(report.gcloudExecuted, false, 'report must not mark gcloud executed.')
assert.equal(report.resourcesCreated, false, 'report must not mark resources created.')
assert.equal(report.secretValuesCreated, false, 'report must not mark secret values created.')
assert.equal(report.deploymentExecuted, false, 'report must not mark runtime rollout executed.')
assert.equal(report.productionReadyAllowed, false, 'report must not allow production readiness.')
assert.equal(report.externalBetaAllowed, false, 'report must not allow external beta.')
assert.equal(report.realUserMediaTestingAllowed, false, 'report must not allow real user media testing.')
assert.equal(report.phase23Readiness.ready, true, 'Phase 23 preparation can be ready with valid staging plan.')
assert.equal(report.phase24Readiness.ready, false, 'Phase 24 must remain blocked until resources/images/IAM/secrets/readiness are verified.')
assert.ok(!/revideo/i.test(JSON.stringify(report.resourceMap)), 'Revideo must not appear as a production cloud resource.')

const packageJson = JSON.parse(readRepoFile('package.json')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:gcp-staging:plan'], 'package.json must include activation:gcp-staging:plan.')
assert.ok(packageJson.scripts['activation:gcp-staging:report'], 'package.json must include activation:gcp-staging:report.')
assert.ok(packageJson.scripts['smoke:activation-gcp-staging-config'], 'package.json must include smoke:activation-gcp-staging-config.')
const phase22Scripts = [
  packageJson.scripts['activation:gcp-staging:plan'],
  packageJson.scripts['activation:gcp-staging:report'],
  packageJson.scripts['smoke:activation-gcp-staging-config'],
].join('\n')
assert.ok(!/\bgcloud\b|\bdocker\b|provider\s+call|huggingface-cli|snapshot_download|from_pretrained/i.test(phase22Scripts), 'Phase 22 npm scripts must not run GCP/Docker/provider/model commands.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'staging_env_example_safe',
    'config_validation',
    'artifact_registry_plan',
    'ten_private_buckets',
    'service_accounts',
    'least_privilege_iam',
    'secret_placeholders_only',
    'command_plan_static_guarded',
    'report_false_execution_flags',
    'phase23_preparation_ready',
    'phase24_blocked',
    'package_scripts_static_only',
  ],
}))
