import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflowPath = '.github/workflows/beta-readiness-api-staging-deploy.yml'
const workflow = readFileSync(workflowPath, 'utf8')

assert.match(workflow, /^name: Private Browser API Gateway Staging Activation$/m)
assert.match(workflow, /^on:\n {2}workflow_dispatch:/m)
assert.doesNotMatch(workflow, /^\s+(push|pull_request|schedule):/m)
assert.match(workflow, /environment: staging/)
assert.match(workflow, /cancel-in-progress: false/)
assert.match(workflow, /permissions:\n {2}contents: read\n {2}id-token: write/)

for (const exactBoundary of [
  'ACTIVATE_REEDITPRO_PRIVATE_BROWSER_STAGING',
  'ACCEPT_REEDITPRO_PRIVATE_STAGING_CLOUD_COST',
  'codex/backend-workflow-pipeline-continuation',
  'reeditpro-api-staging',
  'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com',
  'reeditpro-browser-staging',
  'reeditpro-api-gateway-staging@reeditpro.iam.gserviceaccount.com',
  'us-east1',
  'us-central1',
  'reeditpro-staging-workers',
] as const) {
  assert.equal(workflow.includes(exactBoundary), true, `Missing exact activation boundary: ${exactBoundary}`)
}

assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$\{SOURCE_SHA\}"/)
assert.match(workflow, /test -z "\$\(git status --porcelain\)"/)
assert.match(workflow, /npm ci --no-audit --no-fund --progress=false/)
for (const sourceProof of [
  'smoke:google-api-gateway-browser-transport',
  'smoke:google-api-gateway-readiness',
  'smoke:production-api-deployment-contract',
  'smoke:runtime-api-security',
  'typecheck:server',
  'check:frontend-boundary',
  'check:secrets',
] as const) {
  assert.equal(workflow.includes(`npm run ${sourceProof}`), true, `Missing source proof ${sourceProof}`)
}

assert.match(workflow, /Authenticate to Google Cloud with keyless OIDC/)
assert.match(workflow, /google-github-actions\/auth@v3/)
assert.match(workflow, /cleanup_credentials: true/)
assert.doesNotMatch(workflow, /service-accounts keys create|credentials-file-override|private_key/i)

const enableStep = between(
  workflow,
  '- name: Enable only the required API Gateway services',
  '- name: Capture existing gateway rollback target',
)
for (const api of [
  'apigateway.googleapis.com',
  'servicemanagement.googleapis.com',
  'servicecontrol.googleapis.com',
] as const) {
  assert.equal(enableStep.includes(api), true, `Missing API Gateway service ${api}`)
}
assert.doesNotMatch(enableStep, /run\.googleapis\.com|storage\.googleapis\.com|aiplatform\.googleapis\.com/)

assert.match(workflow, /gcloud projects get-iam-policy/)
assert.match(workflow, /Project-level roles\/run\.invoker is forbidden/)
assert.match(workflow, /Public Cloud Run invocation is forbidden/)
assert.match(workflow, /An unexpected service-level Cloud Run invoker exists/)
assert.doesNotMatch(workflow, /--member=["']?(allUsers|allAuthenticatedUsers)/)
assert.doesNotMatch(workflow, /roles\/(owner|editor)\b/)
assert.match(workflow, /--role=roles\/iam\.serviceAccountUser/)
assert.match(workflow, /--role=roles\/run\.invoker/)
assert.match(workflow, /--member="serviceAccount:\$\{API_GATEWAY_SERVICE_ACCOUNT\}"/)

assert.match(workflow, /auth\/v1\/\.well-known\/jwks\.json/)
assert.match(workflow, /key\.get\("alg"\) == "ES256"/)
assert.match(workflow, /key\.get\("alg"\) == "RS256"/)
assert.match(workflow, /private_fields = \{"d", "p", "q", "dp", "dq", "qi", "oth"\}/)
assert.doesNotMatch(workflow, /gcloud secrets versions access/)
assert.doesNotMatch(workflow, /supabase\s+(db|migration|link|push|reset)/i)

const deployStep = between(
  workflow,
  '- name: Deploy reviewed IAM-private Cloud Run browser API revision',
  '- name: Create immutable JWT gateway API config',
)
for (const deploymentBoundary of [
  '--image="${STAGING_API_IMAGE}"',
  '--service-account="${CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT}"',
  '--ingress=all',
  '--invoker-iam-check',
  '--no-allow-unauthenticated',
  'REEDITPRO_BROWSER_API_TRANSPORT=google_api_gateway',
  'API_ALLOWED_CORS_ORIGINS=${STAGING_APP_ORIGIN}',
  'E2E_RUNTIME_MODE=cloud_run',
  'WORKER_RUNTIME_MODE=disabled',
  'STORAGE_MODE=gcs_disabled',
  'REEDITPRO_DISABLE_DOTENV=true',
] as const) {
  assert.equal(deployStep.includes(deploymentBoundary), true, `Missing deployment boundary ${deploymentBoundary}`)
}
assert.doesNotMatch(deployStep, /--allow-unauthenticated|API_ALLOW_INTERNAL_TEST_EXECUTION_WITH_SUPABASE=true/)
assert.doesNotMatch(deployStep, /:latest/)

const setSecrets = deployStep.match(/--set-secrets="([^"]+)"/)?.[1]
assert.ok(setSecrets, 'Cloud Run deploy must bind the exact pinned secret set.')
assert.deepEqual(setSecrets.split(',').map((binding) => binding.split('=')[0]).sort(), [
  'REEDITPRO_INTERNAL_SERVICE_TOKEN',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_URL',
])
for (const forbiddenSecret of [
  'OPENAI_API_KEY',
  'PROVIDER_GATEWAY_SHARED_SECRET',
  'STRIPE_SECRET_KEY',
  'WORKER_WEBHOOK_SECRET',
] as const) {
  assert.equal(workflow.includes(forbiddenSecret), false, `Forbidden secret entered activation workflow: ${forbiddenSecret}`)
}

assert.match(workflow, /docker inspect --format='\{\{index \.RepoDigests 0\}\}'/)
assert.match(workflow, /@sha256:\[0-9a-f\]\{64\}/)
assert.match(workflow, /gcloud run revisions describe/)
assert.match(workflow, /test "\$\{revision_image\}" = "\$\{STAGING_API_IMAGE\}"/)

assert.match(workflow, /--format='value\(managedService\)'/)
assert.match(workflow, /staging:render-google-api-gateway-openapi/)
assert.match(workflow, /config_id="cfg-\$\{SOURCE_SHA:0:16\}"/)
assert.match(workflow, /--backend-auth-service-account="\$\{API_GATEWAY_SERVICE_ACCOUNT\}"/)
assert.match(workflow, /Existing immutable API config labels do not match source\/spec evidence/)
assert.match(workflow, /gcloud api-gateway gateways (create|update)/)
assert.match(workflow, /Gateway does not reference the target immutable API config/)

const routeProofStep = between(
  workflow,
  '- name: Verify public health private backend denial auth denial and exact CORS',
  '- name: Reconcile the exact legacy invoker only after gateway proof',
)
assert.match(routeProofStep, /test "\$\{health_status\}" = "200"/)
assert.match(routeProofStep, /test "\$\{direct_status\}" = "403"/)
assert.match(routeProofStep, /test "\$\{auth_status\}" = "401"/)
assert.match(routeProofStep, /test "\$\{cors_status\}" = "204"/)
assert.match(routeProofStep, /access-control-allow-origin/)
assert.match(routeProofStep, /access-control-allow-credentials: true/)

const routeProofIndex = workflow.indexOf('- name: Verify public health private backend denial auth denial and exact CORS')
const legacyCutoverIndex = workflow.indexOf('- name: Reconcile the exact legacy invoker only after gateway proof')
const strictReadinessIndex = workflow.indexOf('- name: Require strict sanitized deployed readiness')
assert.ok(routeProofIndex > 0 && legacyCutoverIndex > routeProofIndex && strictReadinessIndex > legacyCutoverIndex)
assert.match(workflow, /REEDITPRO_REQUIRE_GATEWAY_READY: "true"/)

const rollbackStep = between(
  workflow,
  '- name: Restore prior private access state after any activation failure',
  undefined,
)
assert.match(rollbackStep, /if: \$\{\{ failure\(\) \}\}/)
assert.match(rollbackStep, /ROLLBACK_STATE_CAPTURED:-false/)
assert.match(rollbackStep, /update-traffic/)
assert.match(rollbackStep, /PREVIOUS_CLOUD_RUN_REVISION/)
assert.match(rollbackStep, /PREVIOUS_GATEWAY_CONFIG/)
assert.match(rollbackStep, /LEGACY_WAS_INVOKER/)
assert.match(rollbackStep, /GATEWAY_WAS_INVOKER/)
assert.doesNotMatch(workflow, /\bgcloud\s+[^\n]*(?:delete|services disable)\b/)

assert.match(workflow, /no customer price, credit, wallet, or billing mutation occurred/i)
assert.match(workflow, /Providers, workers, GCS media execution, public rendering, customer billing, external beta, and production remain disabled/)
assert.match(workflow, /real Google user session and protected tenant route still require the separate interactive signed-in test gate/)

console.log('google-api-gateway-staging-activation-workflow-smoke passed')

function between(text: string, start: string, end: string | undefined): string {
  const startIndex = text.indexOf(start)
  assert.ok(startIndex >= 0, `Missing section start: ${start}`)
  if (!end) return text.slice(startIndex)
  const endIndex = text.indexOf(end, startIndex + start.length)
  assert.ok(endIndex > startIndex, `Missing section end: ${end}`)
  return text.slice(startIndex, endIndex)
}
