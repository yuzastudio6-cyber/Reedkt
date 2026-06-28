import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflowPath = '.github/workflows/beta-readiness-api-staging-deploy.yml'
const apiDockerfilePath = 'docker/prod/api/Dockerfile'
const serverBuildConfigPath = 'vite.server.config.ts'
const workflow = readFileSync(workflowPath, 'utf8')
const apiDockerfile = readFileSync(apiDockerfilePath, 'utf8')
const serverBuildConfig = readFileSync(serverBuildConfigPath, 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const report = JSON.parse(readFileSync('docs/beta-readiness/api-staging-deploy-workflow/2026-06-28-api-staging-deploy-workflow.json', 'utf8')) as {
  decision: string
  workflowPath: string
  automaticTriggersAllowed: boolean
  externalBetaEnabled: boolean
  productionEnabled: boolean
  requiredInputs: string[]
  requiredGuards: string[]
}

assert.equal(
  packageJson.scripts['smoke:beta-readiness-api-staging-deploy-workflow'],
  'tsx server/smoke/beta-readiness-api-staging-deploy-workflow-smoke.ts',
  'package script should expose the workflow smoke',
)

assert.equal(report.workflowPath, workflowPath)
assert.equal(report.decision, 'beta_readiness_api_staging_deploy_workflow_passed_ready_for_manual_operator_dispatch')
assert.equal(report.automaticTriggersAllowed, false)
assert.equal(report.externalBetaEnabled, false)
assert.equal(report.productionEnabled, false)

for (const input of [
  'confirm_staging_api_deploy',
  'source_sha',
  'image_tag',
  'artifact_region',
  'artifact_repository',
  'deployer_service_account',
  'runtime_service_account',
  'service_name',
]) {
  assert.ok(report.requiredInputs.includes(input), `report should require ${input}`)
  assert.ok(workflow.includes(`${input}:`), `workflow should define ${input}`)
}

for (const guard of [
  'exact_confirmation_phrase',
  'source_sha_required',
  'immutable_image_tag_required',
  'staging_service_name_only',
  'workload_identity_required',
  'no_allow_unauthenticated',
  'secret_manager_names_only',
]) {
  assert.ok(report.requiredGuards.includes(guard), `report should require ${guard}`)
}

assert.ok(workflow.includes('workflow_dispatch:'), 'workflow must be manual dispatch only')
assert.equal(/(^|\n)\s+push:/.test(workflow), false, 'workflow must not run on push')
assert.equal(/(^|\n)\s+pull_request:/.test(workflow), false, 'workflow must not run on pull_request')
assert.ok(workflow.includes('DEPLOY_STAGING_BETA_READINESS_API'), 'workflow must require exact deploy confirmation phrase')
assert.ok(workflow.includes('test "${SERVICE_NAME}" = "reeditpro-api-staging"'), 'workflow must lock the service name to staging')
assert.ok(workflow.includes('[[ "${SOURCE_SHA}" =~ ^[0-9a-f]{40}$ ]]'), 'workflow must require exact commit SHA input')
assert.ok(workflow.includes('test "${IMAGE_TAG}" != "latest"'), 'workflow must reject latest image tags')
assert.ok(workflow.includes('environment: staging'), 'workflow must use the staging GitHub environment')
assert.ok(workflow.includes('REEDITPRO_ENV=staging'), 'workflow must deploy with staging runtime env')
assert.ok(workflow.includes('E2E_RUNTIME_MODE=cloud_run'), 'workflow must deploy the API in Cloud Run runtime mode')
assert.ok(workflow.includes('WORKER_RUNTIME_MODE=disabled'), 'workflow must keep worker dispatch disabled during API evidence deployment')
assert.ok(workflow.includes('STORAGE_MODE=gcs_disabled'), 'workflow must not enable GCS storage runtime in the API evidence deployment')
assert.ok(workflow.includes('GOOGLE_CLOUD_PROJECT_ID=${GCP_PROJECT_ID}'), 'workflow must pass the GCP project reference without hardcoding it')
assert.ok(workflow.includes('GOOGLE_CLOUD_REGION=${GCP_REGION}'), 'workflow must pass the GCP region reference without hardcoding it')
assert.ok(workflow.includes('SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest'), 'workflow must mount the Supabase anon key for server-side bearer token verification')
assert.ok(workflow.includes('SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest'), 'workflow must keep service-role mounted only as a server-side secret')
assert.equal(workflow.includes('REEDITPRO_ENV=production'), false, 'workflow must not deploy production runtime env')
assert.ok(workflow.includes('google-github-actions/auth@v2'), 'workflow must use Workload Identity auth')
assert.ok(workflow.includes('google-github-actions/setup-gcloud@v2'), 'workflow must install gcloud through the official action')
assert.ok(workflow.includes('docker/prod/api/Dockerfile'), 'workflow must build the reviewed API Dockerfile')
assert.ok(workflow.includes('--set-secrets='), 'workflow must bind Secret Manager names')
assert.ok(workflow.includes('SUPABASE_URL=SUPABASE_URL:latest'), 'workflow must bind Supabase URL by Secret Manager name')
assert.ok(workflow.includes('SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest'), 'workflow must bind service-role key by Secret Manager name')
assert.ok(workflow.includes('PROVIDER_GATEWAY_SHARED_SECRET=PROVIDER_GATEWAY_SHARED_SECRET:latest'), 'workflow must bind provider gateway secret by name')
assert.ok(workflow.includes('WORKER_WEBHOOK_SECRET=WORKER_WEBHOOK_SECRET:latest'), 'workflow must bind worker webhook secret by name')
assert.ok(workflow.includes('--no-allow-unauthenticated'), 'workflow must keep Cloud Run unauthenticated access closed')
assert.equal(workflow.includes(' --allow-unauthenticated'), false, 'workflow must not allow unauthenticated access')
assert.equal(workflow.includes('${{ secrets.'), false, 'workflow should not interpolate GitHub secret values into shell commands')
assert.equal(workflow.includes('npm run beta:readiness:external-beta-evidence-collector'), false, 'workflow must not run evidence collection')
assert.equal(workflow.includes('npm run beta:readiness:paid-production-evidence-collector'), false, 'workflow must not run paid production evidence collection')

assert.ok(apiDockerfile.includes('FROM base AS build'), 'API Dockerfile must keep a dedicated build stage')
assert.ok(apiDockerfile.includes('ENV NODE_ENV=development'), 'API Dockerfile build stage must allow dev build tools')
assert.ok(apiDockerfile.includes('RUN npm ci --include=dev'), 'API Dockerfile build stage must install TypeScript/Vite dev tools')
assert.ok(apiDockerfile.includes('FROM base AS runtime'), 'API Dockerfile must keep a dedicated runtime stage')
assert.ok(apiDockerfile.includes('COPY --from=deps /app/node_modules ./node_modules'), 'API runtime stage must still copy production deps from deps stage')
assert.equal(apiDockerfile.includes('RUN npm ci --omit=dev'), true, 'API deps stage must still install production dependencies only')
assert.ok(serverBuildConfig.includes("ssr: 'server/index.ts'"), 'API server build must use the real Express API entrypoint')
assert.equal(serverBuildConfig.includes("ssr: 'src/server/server.ts'"), false, 'API server build must not deploy the legacy mock runtime entrypoint')

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  workflowPath,
  requiredInputs: report.requiredInputs,
  requiredGuards: report.requiredGuards,
}, null, 2))
