import assert from 'node:assert/strict'
import {
  buildBetaReadinessApiDeploymentPreflight,
  type BetaReadinessApiDeploymentPreflightEnv,
} from '../cli/beta-readiness-api-deployment-preflight'

const readyEnv: BetaReadinessApiDeploymentPreflightEnv = {
  GCP_PROJECT_ID: 'reeditpro',
  GCP_REGION: 'us-east1',
  GCP_ARTIFACT_REGION: 'us-central1',
  REEDITPRO_ENV: 'staging',
  REEDITPRO_ARTIFACT_REPOSITORY: 'reeditpro-staging-workers',
  REEDITPRO_IMAGE_TAG: 'beta-readiness-api-a63c6599',
  REEDITPRO_API_SERVICE_ACCOUNT: 'reeditpro-api-staging',
  REEDITPRO_BETA_API_DEPLOYMENT_SOURCE_SHA: 'a63c6599310cbcbd15746734924f1996d750997e',
  REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA: 'a63c6599310cbcbd15746734924f1996d750997e',
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL: 'https://reeditpro-staging-api-abc123-ue.a.run.app',
  REEDITPRO_BETA_API_DEPLOYMENT_SUPABASE_URL_BOUND: 'true',
  REEDITPRO_BETA_API_DEPLOYMENT_SUPABASE_SERVICE_ROLE_KEY_BOUND: 'true',
  REEDITPRO_BETA_API_DEPLOYMENT_PROVIDER_GATEWAY_SHARED_SECRET_BOUND: 'true',
  REEDITPRO_BETA_API_DEPLOYMENT_WORKER_WEBHOOK_SECRET_BOUND: 'true',
  REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_STAGING_ONLY: 'true',
  REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_NO_ALLOW_UNAUTHENTICATED: 'true',
  REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_SECRET_BINDINGS: 'true',
  REEDITPRO_BETA_API_DEPLOYMENT_CONFIRM_NO_RUNTIME_TOOL_EXECUTION: 'true',
}

const empty = buildBetaReadinessApiDeploymentPreflight({})
assert.equal(empty.readyForDeployedEvidenceCollectors, false, 'empty env must not be deploy/evidence ready')
assert.equal(empty.decision, 'beta_readiness_api_deployment_preflight_blocked_missing_staging_api_deployment_inputs')
assert.ok(empty.missingConfiguration.some((item) => item.includes('GCP_PROJECT_ID')))
assert.ok(empty.missingConfiguration.some((item) => item.includes('REEDITPRO_BETA_EXTERNAL_API_BASE_URL')))
assert.ok(empty.missingConfirmations.some((item) => item.includes('CONFIRM_STAGING_ONLY')))
assert.ok(empty.missingSecretBindings.some((item) => item.includes('SUPABASE_SERVICE_ROLE_KEY')))
assert.ok(empty.blockedScopes.includes('deployed_evidence_collectors_until_api_base_url_and_deployed_source_sha_are_verified'))

const ready = buildBetaReadinessApiDeploymentPreflight(readyEnv)
assert.equal(ready.readyToVerifyDeployedApi, true)
assert.equal(ready.readyForDeployedEvidenceCollectors, true)
assert.equal(ready.decision, 'beta_readiness_api_deployment_preflight_passed_ready_for_deployed_evidence_input_manifest')
assert.equal(ready.environment, 'staging')
assert.equal(ready.plannedService.serviceName, 'reeditpro-api')
assert.equal(ready.plannedService.region, 'us-east1')
assert.equal(ready.plannedService.serviceAccount, 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com')
assert.equal(ready.plannedService.image, 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-api:beta-readiness-api-a63c6599')
assert.ok(ready.recommendedCommands.some((command) => command.includes('gh workflow run beta-readiness-api-staging-deploy.yml')), 'ready report should name guarded GitHub Actions staging API deploy workflow')
assert.ok(ready.recommendedCommands.some((command) => command.includes('gh workflow run beta-readiness-api-staging-input-discovery.yml')), 'ready report should name read-only staging input discovery before deploy')
assert.ok(ready.recommendedCommands.some((command) => command.includes('--ref codex/reeditpro-web-ui-shell')), 'workflow command should run from the default branch')
assert.ok(ready.recommendedCommands.some((command) => command.includes('source_ref=codex/sound-music-audio-1abc-checkpoint')), 'workflow command should deploy the tools source branch')
assert.equal(ready.recommendedCommands.some((command) => command.includes('scripts/gcp/prod/08-deploy-api-service.example.sh')), false, 'ready report should not point at the older local gcloud template as the primary deploy path')
assert.ok(ready.warnings.some((warning) => warning.includes('Artifact Registry repository access')), 'ready report should warn that exact input discovery precedes deploy')
assert.ok(ready.warnings.some((warning) => warning.includes('workflow_dispatch-only')), 'ready report should describe the guarded workflow boundary')
assert.deepEqual(ready.missingConfiguration, [])
assert.deepEqual(ready.missingConfirmations, [])
assert.deepEqual(ready.missingSecretBindings, [])
assert.deepEqual(ready.valueGaps, [])
assert.deepEqual(ready.secretLikeInputPaths, [])
assert.equal(JSON.stringify(ready).includes('SERVICE_ROLE_KEY_BOUND'), true, 'report may name secret binding booleans')
assert.equal(JSON.stringify(ready).includes('secret-token'), false, 'report must not include secret values')

const production = buildBetaReadinessApiDeploymentPreflight({
  ...readyEnv,
  REEDITPRO_ENV: 'production',
})
assert.equal(production.readyForDeployedEvidenceCollectors, false, 'production env must not pass beta staging preflight')
assert.ok(production.valueGaps.some((gap) => gap.includes('REEDITPRO_ENV must be staging')))

const placeholderUrl = buildBetaReadinessApiDeploymentPreflight({
  ...readyEnv,
  REEDITPRO_BETA_EXTERNAL_API_BASE_URL: 'https://api.staging.reeditpro.example',
})
assert.equal(placeholderUrl.readyForDeployedEvidenceCollectors, false, 'placeholder URL must not pass')
assert.ok(placeholderUrl.valueGaps.some((gap) => gap.includes('HTTPS API base URL')))

const mismatchedSha = buildBetaReadinessApiDeploymentPreflight({
  ...readyEnv,
  REEDITPRO_BETA_DEPLOYED_EVIDENCE_SOURCE_SHA: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
})
assert.equal(mismatchedSha.readyForDeployedEvidenceCollectors, false, 'source SHA mismatch must not pass')
assert.ok(mismatchedSha.valueGaps.some((gap) => gap.includes('DEPLOYED_EVIDENCE_SOURCE_SHA')))

console.log(JSON.stringify({
  ok: true,
  emptyDecision: empty.decision,
  readyDecision: ready.decision,
  plannedService: ready.plannedService,
  blockedScopes: ready.blockedScopes,
}, null, 2))
