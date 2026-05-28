import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildStagingCloudRunJobPlans,
  buildStagingDeployCommandPlans,
  buildStagingDeployImageRefs,
  buildStagingDeployReport,
  buildStagingHealthcheckSummary,
  buildStagingApiServicePlan,
  parseImageArchitectureEvidence,
  parseStagingDeployConfig,
  validateStagingDeployPlan,
} from '../activation'

const config = parseStagingDeployConfig({
  projectId: 'reeditpro',
  region: 'us-central1',
  imageTag: 'staging-local-001',
  confirmDeploy: true,
})
const imageRefs = buildStagingDeployImageRefs(config)
assert.equal(imageRefs.length, 5, 'Phase 24B deploy image refs must include five non-GPU images only.')
assert.ok(!JSON.stringify(imageRefs).includes('gpu'), 'Phase 24B image refs must not include GPU.')

const amd64Config = parseStagingDeployConfig({
  projectId: 'reeditpro',
  region: 'us-central1',
  imageTag: 'staging-amd64-001',
  confirmDeploy: true,
})
const amd64ImageRefs = buildStagingDeployImageRefs(amd64Config)
assert.equal(amd64ImageRefs.length, 5, 'Phase 24B retry image refs must include five non-GPU images only.')
assert.ok(
  amd64ImageRefs.every((imageRef) => imageRef.digest.startsWith('sha256:')),
  'Phase 24B retry image refs must use pushed amd64 digest references.',
)
assert.ok(
  amd64ImageRefs.some((imageRef) => imageRef.digest === 'sha256:ddb5c6d31fe738ab56291806527e1a5638d1fbfd2b08e05fafb492dc78cb05ac'),
  'Phase 24B retry must expose the amd64 API digest.',
)

const apiRef = imageRefs.find((imageRef) => imageRef.targetId === 'api')
assert.ok(apiRef?.fullImageRef.includes('@sha256:'), 'API image must use digest reference.')
const servicePlan = buildStagingApiServicePlan(config, apiRef ?? imageRefs[0])
assert.equal(servicePlan.serviceName, 'reeditpro-staging-api')
assert.equal(servicePlan.serviceAccountEmail, 'reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com')
assert.equal(servicePlan.allowUnauthenticated, false, 'API must be private by default.')
assert.equal(servicePlan.secretsMounted, false, 'API must not mount zero-version secrets.')
assert.equal(servicePlan.envVars.API_ALLOW_MOCK_WITHOUT_SUPABASE, 'true')

const jobPlans = buildStagingCloudRunJobPlans(config, imageRefs)
assert.deepEqual(jobPlans.map((plan) => plan.jobName), [
  'reeditpro-staging-tool-readiness-job',
  'reeditpro-staging-cpu-analysis-job',
  'reeditpro-staging-qa-job',
  'reeditpro-staging-render-job',
])
assert.ok(jobPlans.every((plan) => !plan.secretsMounted), 'jobs must not mount secrets.')
assert.ok(jobPlans.every((plan) => !plan.serviceAccountEmail.includes('reeditpro-staging-api-sa')), 'old long service account must not be used.')

const commandPlans = buildStagingDeployCommandPlans(servicePlan, jobPlans)
const commandText = commandPlans.map((plan) => plan.commandString).join('\n')
assert.ok(commandText.includes('gcloud run deploy reeditpro-staging-api'), 'command plan must include API deploy text.')
assert.ok(commandText.includes('gcloud run jobs deploy reeditpro-staging-tool-readiness-job'), 'command plan must include tool-readiness job deploy text.')
assert.ok(!/gpu-ai|gpu-worker|--gpu|--allow-unauthenticated|--set-secrets|SECRET_VALUE|provider\s+call|huggingface-cli|\/uploads\//i.test(commandText), 'command plan must exclude forbidden behavior.')

const arm64Only = parseImageArchitectureEvidence({
  targetId: 'api',
  imageRef: apiRef?.fullImageRef ?? 'api',
  evidenceText: 'Platform:    linux/arm64\nPlatform:    unknown/unknown',
})
assert.equal(arm64Only.compatibleWithCloudRun, false, 'arm64-only image must block Cloud Run deploy.')
assert.ok(arm64Only.blockers.some((blocker) => blocker.includes('linux/amd64')))
const amd64 = parseImageArchitectureEvidence({
  targetId: 'api',
  imageRef: apiRef?.fullImageRef ?? 'api',
  evidenceText: 'Platform:    linux/amd64\nPlatform:    linux/arm64',
})
assert.equal(amd64.compatibleWithCloudRun, true, 'multi-arch with linux/amd64 should pass architecture check.')

assert.ok(validateStagingDeployPlan({
  config,
  servicePlan,
  jobPlans,
  commandPlans,
  architectureResults: [arm64Only],
}).some((blocker) => blocker.includes('linux/amd64')), 'deploy policy must block incompatible architecture.')

const report = buildStagingDeployReport({
  projectId: 'reeditpro',
  region: 'us-central1',
  imageTag: 'staging-local-001',
  confirmDeploy: true,
  architectureResults: imageRefs.map((imageRef) => parseImageArchitectureEvidence({
    targetId: imageRef.targetId,
    imageRef: imageRef.fullImageRef,
    evidenceText: 'Platform:    linux/arm64\nPlatform:    unknown/unknown',
  })),
})
assert.equal(report.mode, 'architecture_blocked')
assert.equal(report.deploymentExecuted, false)
assert.equal(report.cloudRunJobsExecuted, false)
assert.equal(report.gpuDeployed, false)
assert.equal(report.phase25Readiness.readyForGeneratedFixtureE2E, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.realUserMediaTestingAllowed, false)

const health = buildStagingHealthcheckSummary({ projectId: 'reeditpro', region: 'us-central1' })
assert.equal(health.apiServiceReady, false)
assert.equal(health.jobsReady, false)
assert.equal(health.productionReadyAllowed, false)

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.ok(packageJson.scripts['activation:staging:deploy-plan'])
assert.ok(packageJson.scripts['activation:staging:deploy-report'])
assert.ok(packageJson.scripts['activation:staging:healthcheck:summary'])
assert.ok(packageJson.scripts['smoke:activation-staging-deploy-config'])
const scriptText = [
  packageJson.scripts['activation:staging:deploy-plan'],
  packageJson.scripts['activation:staging:deploy-report'],
  packageJson.scripts['activation:staging:healthcheck:summary'],
  packageJson.scripts['smoke:activation-staging-deploy-config'],
].join('\n')
assert.ok(!/\bgcloud\b|\bdocker\b|provider\s+call|huggingface-cli|snapshot_download/i.test(scriptText), 'npm scripts must be static/report-only.')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'non_gpu_targets_only',
    'patched_service_accounts',
    'mock_safe_env',
    'no_secret_mounts',
    'no_public_access',
    'architecture_blocks_arm64_only',
    'phase25_blocked',
    'false_launch_gates',
    'package_scripts_static',
  ],
}))
