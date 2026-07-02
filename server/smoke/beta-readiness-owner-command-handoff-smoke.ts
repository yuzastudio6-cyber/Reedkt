import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { buildBetaReadinessOwnerCommandHandoffReport } from '../cli/beta-readiness-owner-command-handoff'

const handoffJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-29-current-api-staging-owner-command-handoff.json'
const handoffMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-29-current-api-staging-owner-command-handoff.md'
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
const handoffDoc = JSON.parse(readFileSync(handoffJsonPath, 'utf8')) as {
  decision: string
  toolsSourceSha: string
  toolsSourceShaRole: string
  toolsSourceShaPolicy: string
  sourceTruth: {
    latestRefreshReason: string
    dynamicCliSourceShaPolicy: string
  }
  ownerHandoffCommand: string
  intendedExecutor: string
  requiredOwnerEnvironment: string[]
  commandIds: string[]
  blockedAlternatives: string[]
  blockedScopes: string[]
  productReadyLocalOssCount: number
  externalBetaEnabled: boolean
  realUserMediaBetaEnabled: boolean
  productionEnabled: boolean
  supabase: {
    write: string
    environment: string
    sql: string
    migration: string
  }
}
const handoffMarkdown = readFileSync(handoffMarkdownPath, 'utf8')

assert.equal(
  packageJson.scripts['beta:readiness:owner-command-handoff'],
  'node --experimental-strip-types --import ./server/cli/beta-readiness-node-ts-register.mjs server/cli/beta-readiness-owner-command-handoff.ts',
  'package script should expose the owner command handoff CLI',
)
assert.equal(
  packageJson.scripts['smoke:beta-readiness-owner-command-handoff'],
  'node --experimental-strip-types --import ./server/cli/beta-readiness-node-ts-register.mjs server/smoke/beta-readiness-owner-command-handoff-smoke.ts',
  'package script should expose the owner command handoff smoke',
)

const currentSourceSha = resolveCurrentSourceSha()
const defaultReport = buildBetaReadinessOwnerCommandHandoffReport()
const report = buildBetaReadinessOwnerCommandHandoffReport(handoffDoc.toolsSourceSha)
const serialized = JSON.stringify(report)

assert.equal(defaultReport.sourceTruth.latestMergedSourceSha, currentSourceSha)
assert.match(handoffDoc.toolsSourceSha, /^[0-9a-f]{40}$/)
assert.notEqual(
  handoffDoc.toolsSourceSha,
  '367897d909b901f517177ac697c51680448375b1',
  'packet refresh context should not remain pinned to the PR #1666 source SHA',
)
assert.equal(report.ok, true)
assert.equal(report.decision, 'beta_readiness_api_staging_owner_command_handoff_passed_ready_for_higher_privilege_owner_application')
assert.equal(report.sourceTruth.toolsBranch, 'codex/sound-music-audio-1abc-checkpoint')
assert.equal(report.sourceTruth.latestMergedSourceSha, handoffDoc.toolsSourceSha)
assert.equal(report.sourceTruth.currentWorkflowScopeFixPr, 1441)
assert.equal(report.sourceTruth.currentWorkflowScopeFixRunId, 28321557589)
assert.equal(report.sourceTruth.currentOwnerCommandPacket, 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-command-packet.md')
assert.equal(report.lockedInputs.projectId, 'reeditpro')
assert.equal(report.lockedInputs.artifactRegion, 'us-central1')
assert.equal(report.lockedInputs.artifactRepository, 'reeditpro-staging-workers')
assert.equal(report.lockedInputs.deployerServiceAccount, 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com')
assert.equal(report.lockedInputs.runtimeServiceAccount, 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com')
assert.equal(report.lockedInputs.serviceName, 'reeditpro-api-staging')
assert.equal(report.ownerExecution.intendedExecutor, 'higher_privilege_gcp_owner_or_resource_admin')
assert.equal(report.ownerExecution.secretValuesRequiredByHandoff, false)
assert.equal(report.ownerExecution.secretNamesPrintedByDefault, false)
assert.deepEqual(report.ownerExecution.requiredOwnerEnvironment, ['REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV'])
assert.deepEqual(report.commandPlan.map((command) => command.id), [
  'artifact_registry_writer_on_staging_repository',
  'runtime_service_account_create_or_confirm',
  'deployer_act_as_runtime_service_account',
  'deployer_fixed_secret_metadata_describe',
  'runtime_fixed_secret_payload_access',
])
assert.ok(report.commandPlan.some((command) => command.command.includes('roles/artifactregistry.writer')))
assert.ok(report.commandPlan.some((command) => command.command.includes('roles/iam.serviceAccountUser')))
assert.ok(report.commandPlan.some((command) => command.command.includes('roles/secretmanager.viewer')))
assert.ok(report.commandPlan.some((command) => command.command.includes('roles/secretmanager.secretAccessor')))
assert.ok(report.commandPlan.every((command) => command.expectedReadOnlyAuditProof.length > 0))
assert.ok(report.shellScript.includes('set -euo pipefail'))
assert.ok(report.shellScript.includes('REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV'))
assert.ok(report.shellScript.includes('Expected exactly four fixed staging API Secret Manager names.'))
assert.ok(report.shellScript.includes('gcloud artifacts repositories add-iam-policy-binding reeditpro-staging-workers'))
assert.ok(report.shellScript.includes('gcloud iam service-accounts describe reeditpro-api-staging@reeditpro.iam.gserviceaccount.com'))
assert.ok(report.shellScript.includes('gcloud iam service-accounts create reeditpro-api-staging'))
assert.ok(report.postOwnerValidation.some((command) => command.includes('AUDIT_STAGING_BETA_API_OWNER_PREREQUISITES')))
assert.ok(report.postOwnerValidation.some((command) => command.includes('READ_STAGING_BETA_API_DEPLOY_INPUTS')))
assert.ok(report.blockedAlternatives.includes('roles/run.admin mutation from the owner-remediation handoff'))
assert.ok(report.blockedAlternatives.includes('granting secret payload access to the deployer'))
assert.ok(report.blockedScopes.includes('cloud_run_deploy_not_run'))
assert.ok(report.blockedScopes.includes('cloud_run_role_mutation_not_run'))
assert.ok(report.blockedScopes.includes('docker_build_not_run'))
assert.ok(report.blockedScopes.includes('secret_values_not_read'))
assert.ok(report.blockedScopes.includes('secret_names_not_committed'))
assert.deepEqual(report.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.equal(report.productReadyLocalOssCount, 0)
assert.equal(report.externalBetaEnabled, false)
assert.equal(report.realUserMediaBetaEnabled, false)
assert.equal(report.productionEnabled, false)
assert.equal(handoffDoc.decision, report.decision)
assert.equal(handoffDoc.toolsSourceShaRole, 'packet_refresh_context_only_not_operator_input')
assert.equal(
  handoffDoc.toolsSourceShaPolicy,
  'run npm run beta:readiness:owner-command-handoff in a fresh current checkout before owner action; the CLI resolves current HEAD by default',
)
assert.equal(handoffDoc.sourceTruth.latestRefreshReason, 'post_pr_1673_external_operator_tool_evidence_source_refresh')
assert.equal(
  handoffDoc.sourceTruth.dynamicCliSourceShaPolicy,
  'npm run beta:readiness:owner-command-handoff resolves the current checkout HEAD by default',
)
assert.equal(handoffDoc.toolsSourceSha, report.sourceTruth.latestMergedSourceSha)
assert.equal(handoffDoc.ownerHandoffCommand, 'npm run beta:readiness:owner-command-handoff')
assert.equal(handoffDoc.intendedExecutor, report.ownerExecution.intendedExecutor)
assert.deepEqual(handoffDoc.requiredOwnerEnvironment, report.ownerExecution.requiredOwnerEnvironment)
assert.deepEqual(handoffDoc.commandIds, report.commandPlan.map((command) => command.id))
assert.ok(handoffDoc.blockedAlternatives.includes('roles/run.admin mutation from the owner-remediation handoff'))
assert.ok(handoffDoc.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(handoffDoc.productReadyLocalOssCount, 0)
assert.equal(handoffDoc.externalBetaEnabled, false)
assert.equal(handoffDoc.realUserMediaBetaEnabled, false)
assert.equal(handoffDoc.productionEnabled, false)
assert.deepEqual(handoffDoc.supabase, report.supabase)
assert.ok(handoffMarkdown.includes('npm run beta:readiness:owner-command-handoff'))
assert.ok(handoffMarkdown.includes('REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV'))
assert.ok(handoffMarkdown.includes('resolves current checkout `HEAD` by default'))
assert.ok(handoffMarkdown.includes('packet refresh context only, not an operator deploy input'))
assert.ok(handoffMarkdown.includes('Do not copy the static packet-refresh SHA into the guarded deploy workflow'))
assert.ok(handoffMarkdown.includes('Workflow scope fix PR: `#1441`'))
assert.ok(handoffMarkdown.includes('Product-ready local OSS count remains `0`'))
assert.equal(JSON.stringify(handoffDoc).includes('SERVICE_ROLE_KEY'), false, 'handoff doc must not print secret names or values')
assert.equal(handoffMarkdown.includes('SUPABASE_SERVICE_ROLE_KEY'), false, 'handoff markdown must not print fixed secret names')
assert.equal(serialized.includes('roles/run.admin --'), false, 'handoff must not include a Cloud Run admin grant command')
assert.equal(serialized.includes('gcloud run deploy'), false, 'handoff must not deploy Cloud Run')
assert.equal(serialized.includes('docker '), false, 'handoff must not run Docker')
assert.equal(serialized.includes('apt-get'), false, 'handoff must not run package installs')
assert.equal(serialized.includes('SERVICE_ROLE_KEY'), false, 'handoff must not print secret names or values')
assert.equal(serialized.includes('gha-creds'), false, 'handoff must not include credential-file paths')
assert.equal(serialized.includes('owner/editor'), true, 'handoff should explicitly block broad owner/editor alternatives')

console.log(JSON.stringify({
  ok: true,
  decision: report.decision,
  defaultSourceSha: defaultReport.sourceTruth.latestMergedSourceSha,
  currentWorkflowScopeFixRunId: report.sourceTruth.currentWorkflowScopeFixRunId,
  commandIds: report.commandPlan.map((command) => command.id),
  blockedScopes: report.blockedScopes,
}, null, 2))

function resolveCurrentSourceSha(): string {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
    env: gitExecEnv(),
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

function gitExecEnv() {
  if (process.platform !== 'darwin') return process.env
  if (process.env.DEVELOPER_DIR && existsSync(process.env.DEVELOPER_DIR)) return process.env
  return {
    ...process.env,
    DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  }
}
