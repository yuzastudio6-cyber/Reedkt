import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = process.cwd()

function file(path: string): string {
  return join(root, path)
}

function read(path: string): string {
  return readFileSync(file(path), 'utf8')
}

function assertFile(path: string): void {
  assert.equal(existsSync(file(path)), true, `${path} should exist`)
}

function assertMentions(path: string, phrases: string[]): void {
  const text = read(path)
  for (const phrase of phrases) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${path} should mention ${phrase}`)
  }
}

function between(text: string, start: string, end: string): string {
  const startIndex = text.indexOf(start)
  assert.ok(startIndex >= 0, `Missing section start: ${start}`)
  const endIndex = text.indexOf(end, startIndex + start.length)
  assert.ok(endIndex > startIndex, `Missing section end: ${end}`)
  return text.slice(startIndex, endIndex)
}

function extractPythonHereDoc(step: string): string {
  const marker = "<<'PY'\n"
  const startIndex = step.indexOf(marker)
  assert.ok(startIndex >= 0, 'Workflow step should contain a quoted Python heredoc.')
  const contentStart = startIndex + marker.length
  const endIndex = step.indexOf('\n          PY', contentStart)
  assert.ok(endIndex > contentStart, 'Workflow Python heredoc should have a closing delimiter.')
  return `${step.slice(contentStart, endIndex)
    .split('\n')
    .map((line) => line.startsWith('          ') ? line.slice(10) : line)
    .join('\n')}\n`
}

const requiredFiles = [
  '.github/workflows/app-internal-testing-pages-deploy.yml',
  'src/main.tsx',
  'src/backend/supabase/supabase-config.ts',
  'docs/app-internal-testing-pages-deploy-readiness.md',
  'docs/app-internal-testing-pages-deploy-readiness.json',
  'server/smoke/app-internal-testing-pages-deploy-readiness-smoke.ts',
]

requiredFiles.forEach(assertFile)

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:app-internal-testing-pages-deploy-readiness'],
  'tsx server/smoke/app-internal-testing-pages-deploy-readiness-smoke.ts',
)

assertMentions('src/main.tsx', ['createBrowserRouter', 'appRouterBasename', 'import.meta.env.BASE_URL'])
assertMentions('src/backend/supabase/supabase-config.ts', [
  'import.meta.env?.VITE_SUPABASE_URL',
  'import.meta.env?.VITE_SUPABASE_ANON_KEY',
])
assert.doesNotMatch(
  read('src/backend/supabase/supabase-config.ts'),
  /import\.meta\.env\s*\[[^\]]+\]/,
  'Supabase public env values must use static Vite env access so Pages builds inline them.',
)

const workflow = read('.github/workflows/app-internal-testing-pages-deploy.yml')
const activationWorkflow = read('.github/workflows/beta-readiness-api-staging-deploy.yml')
assertMentions('.github/workflows/app-internal-testing-pages-deploy.yml', [
  'workflow_dispatch',
  'DEPLOY_REEDITPRO_SIGNED_IN_INTERNAL_TEST_APP',
  'source_sha',
  'gateway_activation_run_id',
  'Private Browser API Gateway Staging Activation',
  'actions/runs/',
  'actions/download-artifact@v8',
  'reeditpro-private-browser-staging-activation-',
  'gatewaySoleServiceLevelInvoker',
  'storageActivationRunId',
  'storageConfigurationEnabled',
  'largeMediaDistributedFinalizationVerified',
  'VERIFIED_API_GATEWAY_ORIGIN',
  '/Reedkt/',
  'STAGING_SUPABASE_URL',
  'STAGING_SUPABASE_ANON_KEY',
  'VITE_REEDITPRO_AUTH_MODE: supabase',
  'VITE_REEDITPRO_API_MODE: cloud_run',
  'VITE_REEDITPRO_API_TRANSPORT: google_api_gateway',
  'VITE_REEDITPRO_API_BASE_URL',
  'smoke:google-api-gateway-browser-transport',
  'smoke:canonical-product-ui-integration-readiness',
  'internal-testing:verify-canonical-product-ui-integration-readiness',
  'REEDITPRO_REQUIRE_CANONICAL_PRODUCT_UI_READY: "true"',
  'internal-testing:verify-hosted-sign-in-route',
  'npm run build -- --base=',
  '--strictPort',
  '--base="${VITE_BASE_PATH}"',
  'cp dist/index.html dist/404.html',
  'actions/deploy-pages',
])

assert.doesNotMatch(workflow, /secrets\.(?:STAGING_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|PROVIDER_GATEWAY_SHARED_SECRET|WORKER_WEBHOOK_SECRET)/)
assert.doesNotMatch(workflow, /VITE_(?:SUPABASE_SERVICE_ROLE_KEY|REEDITPRO_INTERNAL_SERVICE_TOKEN|STRIPE_SECRET_KEY)/)
assert.doesNotMatch(workflow, /gcloud|docker build|supabase db|supabase migration|apt-get|worker:run|tools:check|smoke:prod-real/i)
assert.doesNotMatch(workflow, /npm run build:server|npm run dev:api|npm run start:server/i)
assert.doesNotMatch(workflow, /^\s+api_gateway_origin:/m)
assert.match(workflow, /test "\$\{GITHUB_REF\}" = "refs\/heads\/\$\{SOURCE_REF\}"/)
assert.match(workflow, /test "\$\{GITHUB_SHA\}" = "\$\{SOURCE_SHA\}"/)
assert.match(workflow, /run\.get\("head_branch"\) != sys\.argv\[3\] or run\.get\("head_sha"\) != sys\.argv\[4\]/)
assert.match(workflow, /gateway_origin = evidence\.get\("gatewayOrigin"\)/)
assert.match(workflow, /export VITE_REEDITPRO_API_BASE_URL="\$\{VERIFIED_API_GATEWAY_ORIGIN\}"/)
assert.match(workflow, /test "\$\{auth_status\}" = "401"/)
assert.match(workflow, /test "\$\{cors_status\}" = "204"/)
assert.match(workflow, /access-control-allow-credentials: true/)

const canonicalProductUiGate = between(
  workflow,
  '- name: Require canonical product UI integration before signed-in app build',
  '- name: Build signed-in static app against verified gateway',
)
assert.match(canonicalProductUiGate, /REEDITPRO_REQUIRE_CANONICAL_PRODUCT_UI_READY: "true"/)
assert.match(canonicalProductUiGate, /npm run smoke:canonical-product-ui-integration-readiness/)
assert.match(canonicalProductUiGate, /npm run internal-testing:verify-canonical-product-ui-integration-readiness/)

const activationEvidencePython = extractPythonHereDoc(between(
  activationWorkflow,
  '- name: Create sanitized activation evidence for the hosted app handoff',
  '- name: Upload immutable sanitized activation evidence',
))
const activationBindingPython = extractPythonHereDoc(between(
  workflow,
  '- name: Bind the app to the exact activated gateway evidence',
  '- name: Reprove gateway health auth denial and exact Pages CORS',
))
const evidenceFixtureDirectory = mkdtempSync(join(tmpdir(), 'reeditpro-gateway-evidence-'))
try {
  const sourceSha = 'a'.repeat(40)
  const evidencePath = join(evidenceFixtureDirectory, 'reeditpro-private-browser-staging-activation.json')
  const environmentPath = join(evidenceFixtureDirectory, 'github-env.txt')
  const createResult = spawnSync('python3', [
    '-',
    evidencePath,
    'yuzastudio6-cyber/Reedkt',
    '123',
    '2',
    'codex/backend-workflow-pipeline-continuation',
    sourceSha,
    'reeditpro',
    'us-east1',
    'reeditpro-api-staging',
    'reeditpro-api-staging-fixture',
    'reeditpro-browser-staging',
    `cfg-${sourceSha.slice(0, 16)}`,
    'reeditpro-browser-staging',
    'https://reeditpro-browser-staging-fixture.gateway.dev',
    'https://yuzastudio6-cyber.github.io',
    '456',
    '1',
  ], {
    input: activationEvidencePython,
    encoding: 'utf8',
  })
  assert.equal(createResult.status, 0, createResult.stderr || 'Activation evidence producer should pass.')

  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8')) as Record<string, unknown>
  assert.equal(evidence.schemaVersion, 2)
  assert.equal(evidence.workflowRunId, 123)
  assert.equal(evidence.workflowRunAttempt, 2)
  assert.equal(evidence.sourceSha, sourceSha)
  assert.equal(evidence.gatewayOrigin, 'https://reeditpro-browser-staging-fixture.gateway.dev')
  assert.equal(evidence.gatewaySoleServiceLevelInvoker, true)
  assert.equal(evidence.storageActivationRunId, 456)
  assert.equal(evidence.storageActivationRunAttempt, 1)
  assert.equal(evidence.storageMode, 'gcs')
  assert.equal(evidence.storageConfigurationEnabled, true)
  assert.equal(evidence.storageExecutionEnabled, true)
  assert.equal(evidence.storageExecutionVerified, false)
  assert.equal(evidence.largeMediaFinalizationMode, 'disabled')
  assert.equal(evidence.largeMediaDistributedFinalizationVerified, false)
  assert.equal(evidence.customerBillingEnabled, false)

  const verifyArguments = [
    '-',
    evidencePath,
    'yuzastudio6-cyber/Reedkt',
    'codex/backend-workflow-pipeline-continuation',
    sourceSha,
    '123',
    '2',
    'https://yuzastudio6-cyber.github.io',
    environmentPath,
  ]
  const verifyResult = spawnSync('python3', verifyArguments, {
    input: activationBindingPython,
    encoding: 'utf8',
  })
  assert.equal(verifyResult.status, 0, verifyResult.stderr || 'Activation evidence consumer should pass.')
  assert.equal(
    readFileSync(environmentPath, 'utf8'),
    'VERIFIED_API_GATEWAY_ORIGIN=https://reeditpro-browser-staging-fixture.gateway.dev\n',
  )

  evidence.gatewaySoleServiceLevelInvoker = false
  const tamperedEvidencePath = join(evidenceFixtureDirectory, 'tampered-activation-evidence.json')
  const tamperedEnvironmentPath = join(evidenceFixtureDirectory, 'tampered-github-env.txt')
  writeFileSync(tamperedEvidencePath, `${JSON.stringify(evidence)}\n`, 'utf8')
  const tamperedResult = spawnSync('python3', [
    '-',
    tamperedEvidencePath,
    ...verifyArguments.slice(2, -1),
    tamperedEnvironmentPath,
  ], {
    input: activationBindingPython,
    encoding: 'utf8',
  })
  assert.notEqual(tamperedResult.status, 0, 'Tampered sole-invoker evidence must fail closed.')
  assert.equal(existsSync(tamperedEnvironmentPath), false)
} finally {
  rmSync(evidenceFixtureDirectory, { recursive: true, force: true })
}

const doc = JSON.parse(read('docs/app-internal-testing-pages-deploy-readiness.json')) as {
  decision?: string
  sourceRef?: string
  defaultBasePath?: string
  githubPagesSignInUrl?: string
  frontendAuthMode?: string
  currentImplementationBranch?: string
  currentSliceIntegratedIntoSourceRef?: boolean
  routerBasePathAware?: boolean
  spaFallbackIncluded?: boolean
  compiledSubpathPreviewVerified?: boolean
  compiledSubpathProviderHandoffVerified?: boolean
  googleOAuthCodeReady?: boolean
  googleOAuthProviderConfiguredRemotely?: boolean
  hostedCallbackVerified?: boolean
  hostedDeploymentVerified?: boolean
  existingLiveHostStatus?: string
  hostedApiMode?: string
  sourceWorkflowReady?: boolean
  sourceWorkflowPushed?: boolean
  gatewayActivationRunRequired?: boolean
  gatewayActivationEvidenceArtifactRequired?: boolean
  gatewayActivationEvidenceSchemaVersion?: number
  storageActivationRunRequired?: boolean
  storageActivationWorkflow?: string
  sameSourceShaAsStorageRequired?: boolean
  hostedStorageMode?: string
  hostedLargeMediaFinalizationMode?: string
  maximumHostedUploadBytesWithoutDistributedFinalization?: number
  gatewayOriginDerivedFromActivationEvidence?: boolean
  sameSourceShaAsGatewayRequired?: boolean
  gatewayHealthAuthAndCorsReproofRequired?: boolean
  compiledGatewayArtifactAuditRequired?: boolean
  compiledGatewayBuildVerified?: boolean
  postDeploySignInSurfaceVerificationRequired?: boolean
  blockedScope?: Record<string, boolean>
  blockedSecrets?: string[]
  nextGate?: string
}

assert.equal(doc.decision, 'app_signed_in_internal_testing_pages_gateway_workflow_source_ready_remote_activation_and_deploy_pending')
assert.equal(doc.sourceRef, 'codex/backend-workflow-pipeline-continuation')
assert.equal(doc.currentImplementationBranch, 'codex/backend-workflow-pipeline-continuation')
assert.equal(doc.currentSliceIntegratedIntoSourceRef, true)
assert.equal(doc.defaultBasePath, '/Reedkt/')
assert.equal(doc.githubPagesSignInUrl, 'https://yuzastudio6-cyber.github.io/Reedkt/sign-in')
assert.equal(doc.frontendAuthMode, 'supabase_anon_client_google_oauth_with_email_password_fallback')
assert.equal(doc.routerBasePathAware, true)
assert.equal(doc.spaFallbackIncluded, true)
assert.equal(doc.compiledSubpathPreviewVerified, true)
assert.equal(doc.compiledSubpathProviderHandoffVerified, true)
assert.equal(doc.googleOAuthCodeReady, true)
assert.equal(doc.googleOAuthProviderConfiguredRemotely, false)
assert.equal(doc.hostedCallbackVerified, false)
assert.equal(doc.hostedDeploymentVerified, false)
assert.equal(doc.existingLiveHostStatus, 'blocked_sign_in_surface_missing')
assert.equal(doc.hostedApiMode, 'cloud_run_google_api_gateway')
assert.equal(doc.sourceWorkflowReady, true)
assert.equal(doc.sourceWorkflowPushed, false)
assert.equal(doc.gatewayActivationRunRequired, true)
assert.equal(doc.gatewayActivationEvidenceArtifactRequired, true)
assert.equal(doc.gatewayActivationEvidenceSchemaVersion, 2)
assert.equal(doc.storageActivationRunRequired, true)
assert.equal(
  doc.storageActivationWorkflow,
  '.github/workflows/signed-in-private-media-storage-staging-activation.yml',
)
assert.equal(doc.sameSourceShaAsStorageRequired, true)
assert.equal(doc.hostedStorageMode, 'gcs')
assert.equal(doc.hostedLargeMediaFinalizationMode, 'disabled')
assert.equal(doc.maximumHostedUploadBytesWithoutDistributedFinalization, 16 * 1024 * 1024)
assert.equal(doc.gatewayOriginDerivedFromActivationEvidence, true)
assert.equal(doc.sameSourceShaAsGatewayRequired, true)
assert.equal(doc.gatewayHealthAuthAndCorsReproofRequired, true)
assert.equal(doc.compiledGatewayArtifactAuditRequired, true)
assert.equal(doc.compiledGatewayBuildVerified, true)
assert.equal(doc.postDeploySignInSurfaceVerificationRequired, true)
assert.ok(doc.blockedSecrets?.includes('STAGING_SUPABASE_SERVICE_ROLE_KEY'))
assert.ok(doc.blockedSecrets?.includes('GOOGLE_CLIENT_SECRET'))
assert.equal(
  doc.nextGate,
  'OWNER_AUTHORIZED_SAME_SHA_STORAGE_AND_GATEWAY_ACTIVATION_THEN_PAGES_DEPLOY_AND_INTERACTIVE_GOOGLE_SESSION',
)

for (const [scope, value] of Object.entries(doc.blockedScope ?? {})) {
  assert.equal(value, false, `${scope} should remain false`)
}

const combined = requiredFiles
  .filter((path) => path !== 'server/smoke/app-internal-testing-pages-deploy-readiness-smoke.ts')
  .map((path) => read(path))
  .join('\n')

assert.doesNotMatch(combined, /BEGIN PRIVATE KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]+/i)
assert.doesNotMatch(combined, /signedUrl\s*[:=]\s*['"]https?:\/\//i)

console.log(JSON.stringify({
  ok: true,
  smoke: 'app-internal-testing-pages-deploy-readiness',
  decision: doc.decision,
  sourceRef: doc.sourceRef,
  defaultBasePath: doc.defaultBasePath,
  githubPagesSignInUrl: doc.githubPagesSignInUrl,
  frontendAuthMode: doc.frontendAuthMode,
  googleOAuthCodeReady: doc.googleOAuthCodeReady,
  hostedDeploymentVerified: doc.hostedDeploymentVerified,
  nextGate: doc.nextGate,
  blockedScope: doc.blockedScope,
}, null, 2))
