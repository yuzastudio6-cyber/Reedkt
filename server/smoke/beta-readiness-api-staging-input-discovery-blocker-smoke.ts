import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const jsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-input-discovery-iam-blocker.json'
const markdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-input-discovery-iam-blocker.md'

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const report = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
  decision: string
  productReadyLocalOssCount: number
  externalBetaEnabled: boolean
  productionEnabled: boolean
  defaultBranchWorkflow: {
    path: string
    branch: string
    workflowDispatchOnly: boolean
    confirmationPhrase: string
    latestRun: {
      runId: number
      url: string
      headSha: string
      conclusion: string
    }
  }
  readOnlyPreflight: {
    wifAuthSucceeded: boolean
    setupGcloudSucceeded: boolean
    projectId: string
    region: string
    probeFailures: string[]
    probes: Record<string, { ok: boolean; permission?: string; resource?: string; reason?: string }>
  }
  blockedAction: string
  blockedScopes: string[]
  safeForwardProgress: string[]
  nextSafeActions: string[]
  supabase: {
    write: string
    environment: string
    sql: string
    migration: string
  }
}
const markdown = readFileSync(markdownPath, 'utf8')

assert.equal(
  packageJson.scripts['smoke:beta-readiness-api-staging-input-discovery-blocker'],
  'tsx server/smoke/beta-readiness-api-staging-input-discovery-blocker-smoke.ts',
  'package script should expose the input discovery blocker smoke',
)

assert.equal(report.decision, 'beta_readiness_api_staging_input_discovery_blocked_by_wif_read_only_iam')
assert.equal(report.defaultBranchWorkflow.path, '.github/workflows/beta-readiness-api-staging-input-discovery.yml')
assert.equal(report.defaultBranchWorkflow.branch, 'codex/reeditpro-web-ui-shell')
assert.equal(report.defaultBranchWorkflow.workflowDispatchOnly, true)
assert.equal(report.defaultBranchWorkflow.confirmationPhrase, 'READ_STAGING_BETA_API_DEPLOY_INPUTS')
assert.equal(report.defaultBranchWorkflow.latestRun.runId, 28309436736)
assert.equal(report.defaultBranchWorkflow.latestRun.conclusion, 'failure')
assert.equal(report.readOnlyPreflight.wifAuthSucceeded, true)
assert.equal(report.readOnlyPreflight.setupGcloudSucceeded, true)
assert.equal(report.readOnlyPreflight.projectId, 'reeditpro')
assert.equal(report.readOnlyPreflight.region, 'us-east1')

assert.deepEqual(report.readOnlyPreflight.probeFailures, [
  'artifactRepositoriesUsCentral1',
  'artifactRepositoriesUsEast1',
  'serviceAccounts',
])
assert.equal(report.readOnlyPreflight.probes.artifactRepositoriesUsCentral1?.permission, 'artifactregistry.repositories.list')
assert.equal(report.readOnlyPreflight.probes.artifactRepositoriesUsCentral1?.resource, 'projects/reeditpro/locations/us-central1')
assert.equal(report.readOnlyPreflight.probes.artifactRepositoriesUsEast1?.permission, 'artifactregistry.repositories.list')
assert.equal(report.readOnlyPreflight.probes.artifactRepositoriesUsEast1?.resource, 'projects/reeditpro/locations/us-east1')
assert.equal(report.readOnlyPreflight.probes.serviceAccounts?.permission, 'iam.serviceAccounts.list')
assert.equal(report.readOnlyPreflight.probes.serviceAccounts?.resource, 'projects/reeditpro')
assert.equal(report.readOnlyPreflight.probes.cloudRunServices?.ok, true)

assert.equal(report.blockedAction, 'staging_api_deploy_until_owner_approved_artifact_registry_and_service_account_inputs_are_proven')
assert.ok(report.safeForwardProgress.includes('owner_iam_read_permission_remediation'))
assert.ok(report.safeForwardProgress.includes('rerun_read_only_input_discovery'))
assert.ok(report.nextSafeActions.some((action) => action.includes('READ_STAGING_BETA_API_DEPLOY_INPUTS')))
assert.ok(report.nextSafeActions.some((action) => action.includes('beta-readiness-api-staging-deploy.yml')))
assert.ok(report.blockedScopes.includes('cloud_run_deploy_not_run'))
assert.ok(report.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(report.productReadyLocalOssCount, 0)
assert.equal(report.externalBetaEnabled, false)
assert.equal(report.productionEnabled, false)
assert.deepEqual(report.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})

assert.ok(markdown.includes('This is not a blanket blocker.'), 'markdown should preserve scoped blocker rule')
assert.ok(markdown.includes('missing `artifactregistry.repositories.list`'), 'markdown should name Artifact Registry permission')
assert.ok(markdown.includes('missing `iam.serviceAccounts.list`'), 'markdown should name service account permission')
assert.ok(markdown.includes('Supabase classification remains `no write / environment none / SQL none / migration no`'))
assert.equal(markdown.includes('DEPLOY_STAGING_BETA_READINESS_API'), false, 'input discovery packet should not instruct deploy confirmation directly')
assert.equal(JSON.stringify(report).includes('SERVICE_ROLE_KEY'), false, 'report must not include secret names or values')
assert.equal(JSON.stringify(report).includes('gha-creds'), false, 'report must not include credential-file paths')

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  runId: report.defaultBranchWorkflow.latestRun.runId,
  probeFailures: report.readOnlyPreflight.probeFailures,
  blockedAction: report.blockedAction,
}, null, 2))
