import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const jsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-input-discovery-iam-blocker.json'
const markdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-input-discovery-iam-blocker.md'
const exactJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-exact-input-validation-blocker.json'
const exactMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-exact-input-validation-blocker.md'
const remediationJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-request.json'
const remediationMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-request.md'
const workflowReadyJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-workflow-ready.json'
const workflowReadyMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-workflow-ready.md'

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
const exactReport = JSON.parse(readFileSync(exactJsonPath, 'utf8')) as {
  decision: string
  productReadyLocalOssCount: number
  externalBetaEnabled: boolean
  productionEnabled: boolean
  defaultBranchWorkflow: {
    exactInputWorkflowPr: number
    exactInputWorkflowMergeSha: string
    latestRun: {
      runId: number
      headSha: string
      conclusion: string
    }
  }
  readOnlyPreflight: {
    mode: string
    exactInputsProvided: boolean
    probeFailures: string[]
    broadProbeFailures: string[]
    ownerSuppliedInputs: {
      artifactRegion: string
      artifactRepository: string
      deployerServiceAccount: string
      runtimeServiceAccount: string
      serviceName: string
    }
    probes: Record<string, { ok: boolean; permission?: string; resource?: string; reason?: string; requiredForInputValidation?: boolean }>
  }
  blockedAction: string
  safeForwardProgress: string[]
  supabase: {
    write: string
    environment: string
    sql: string
    migration: string
  }
}
const exactMarkdown = readFileSync(exactMarkdownPath, 'utf8')
const remediationReport = JSON.parse(readFileSync(remediationJsonPath, 'utf8')) as {
  decision: string
  requiredOwnerActions: Array<{ id: string; commandTemplate?: string; roleCandidate?: string; deploymentRoleCandidate?: string }>
  postRemediationValidation: string[]
  blockedScopes: string[]
  productReadyLocalOssCount: number
  externalBetaEnabled: boolean
  productionEnabled: boolean
  supabase: {
    write: string
    environment: string
    sql: string
    migration: string
  }
}
const remediationMarkdown = readFileSync(remediationMarkdownPath, 'utf8')
const workflowReadyReport = JSON.parse(readFileSync(workflowReadyJsonPath, 'utf8')) as {
  decision: string
  defaultBranchWorkflow: {
    path: string
    workflowPr: number
    workflowMergeSha: string
    workflowDispatchOnly: boolean
    dispatchedInThisPhase: boolean
    requiredConfirmations: string[]
  }
  recommendedCommandTemplate: string
  plannedOwnerActions: string[]
  blockedScopes: string[]
  productReadyLocalOssCount: number
  externalBetaEnabled: boolean
  productionEnabled: boolean
}
const workflowReadyMarkdown = readFileSync(workflowReadyMarkdownPath, 'utf8')

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

assert.equal(exactReport.decision, 'beta_readiness_api_staging_exact_input_validation_blocked_by_artifact_registry_get_and_runtime_service_account')
assert.equal(exactReport.defaultBranchWorkflow.exactInputWorkflowPr, 1374)
assert.equal(exactReport.defaultBranchWorkflow.exactInputWorkflowMergeSha, '02e1b325f4c62c0e0d92d95d948aaab2052a57e6')
assert.equal(exactReport.defaultBranchWorkflow.latestRun.runId, 28309751101)
assert.equal(exactReport.defaultBranchWorkflow.latestRun.conclusion, 'failure')
assert.equal(exactReport.readOnlyPreflight.mode, 'read_only_staging_api_exact_input_validation')
assert.equal(exactReport.readOnlyPreflight.exactInputsProvided, true)
assert.deepEqual(exactReport.readOnlyPreflight.probeFailures, [
  'exactArtifactRepository',
  'exactRuntimeServiceAccount',
])
assert.equal(exactReport.readOnlyPreflight.ownerSuppliedInputs.artifactRegion, 'us-central1')
assert.equal(exactReport.readOnlyPreflight.ownerSuppliedInputs.artifactRepository, 'reeditpro-staging-workers')
assert.equal(exactReport.readOnlyPreflight.ownerSuppliedInputs.runtimeServiceAccount, 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com')
assert.equal(exactReport.readOnlyPreflight.ownerSuppliedInputs.serviceName, 'reeditpro-api-staging')
assert.equal(exactReport.readOnlyPreflight.probes.exactArtifactRepository?.permission, 'artifactregistry.repositories.get')
assert.equal(exactReport.readOnlyPreflight.probes.exactArtifactRepository?.resource, 'projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers')
assert.equal(exactReport.readOnlyPreflight.probes.exactArtifactRepository?.reason, 'IAM_PERMISSION_DENIED')
assert.equal(exactReport.readOnlyPreflight.probes.exactDeployerServiceAccount?.ok, true)
assert.equal(exactReport.readOnlyPreflight.probes.exactRuntimeServiceAccount?.reason, 'NOT_FOUND')
assert.equal(exactReport.readOnlyPreflight.probes.exactCloudRunService?.requiredForInputValidation, false)
assert.equal(exactReport.blockedAction, 'staging_api_deploy_until_artifact_registry_repository_access_and_runtime_service_account_are_proven')
assert.ok(exactReport.safeForwardProgress.includes('owner_grants_or_confirms_artifact_registry_repository_access'))
assert.ok(exactReport.safeForwardProgress.includes('owner_creates_or_selects_staging_api_runtime_service_account'))
assert.equal(exactReport.productReadyLocalOssCount, 0)
assert.equal(exactReport.externalBetaEnabled, false)
assert.equal(exactReport.productionEnabled, false)
assert.deepEqual(exactReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(exactMarkdown.includes('This is not a blanket beta-readiness blocker.'))
assert.ok(exactMarkdown.includes('artifactregistry.repositories.get'))
assert.ok(exactMarkdown.includes('reeditpro-api-staging@reeditpro.iam.gserviceaccount.com'))
assert.equal(JSON.stringify(exactReport).includes('gha-creds'), false, 'exact report must not include credential-file paths')
assert.equal(JSON.stringify(exactReport).includes('SERVICE_ROLE_KEY'), false, 'exact report must not include secret names or values')

assert.equal(remediationReport.decision, 'beta_readiness_api_staging_owner_remediation_request_passed_ready_for_owner_iam_runtime_service_account_action')
assert.deepEqual(remediationReport.requiredOwnerActions.map((action) => action.id), [
  'artifact_registry_repository_access',
  'runtime_service_account',
  'deployer_act_as_runtime',
  'cloud_run_deploy_permission',
  'runtime_secret_access',
])
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.deploymentRoleCandidate === 'roles/artifactregistry.writer'))
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.roleCandidate === 'roles/iam.serviceAccountUser'))
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.roleCandidate === 'roles/run.admin'))
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.roleCandidate === 'roles/secretmanager.secretAccessor'))
assert.ok(remediationReport.postRemediationValidation.some((command) => command.includes('beta-readiness-api-staging-input-discovery.yml')))
assert.ok(remediationReport.postRemediationValidation.some((command) => command.includes('beta-readiness-api-staging-deploy.yml')))
assert.ok(remediationReport.blockedScopes.includes('iam_mutation_not_run'))
assert.ok(remediationReport.blockedScopes.includes('service_account_creation_not_run'))
assert.equal(remediationReport.productReadyLocalOssCount, 0)
assert.equal(remediationReport.externalBetaEnabled, false)
assert.equal(remediationReport.productionEnabled, false)
assert.deepEqual(remediationReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(remediationMarkdown.includes('metadata only'))
assert.ok(remediationMarkdown.includes('roles/artifactregistry.writer'))
assert.ok(remediationMarkdown.includes('roles/iam.serviceAccountUser'))
assert.ok(remediationMarkdown.includes('roles/secretmanager.secretAccessor'))
assert.ok(remediationMarkdown.includes('Only after exact validation passes'))
assert.equal(JSON.stringify(remediationReport).includes('gha-creds'), false, 'remediation report must not include credential-file paths')

assert.equal(workflowReadyReport.decision, 'beta_readiness_api_staging_owner_remediation_workflow_ready_for_owner_dispatch')
assert.equal(workflowReadyReport.defaultBranchWorkflow.path, '.github/workflows/beta-readiness-api-staging-owner-remediation.yml')
assert.equal(workflowReadyReport.defaultBranchWorkflow.workflowPr, 1382)
assert.equal(workflowReadyReport.defaultBranchWorkflow.workflowMergeSha, 'e818b5c6cdd200b6e6c06c517f5f2e3f557388f6')
assert.equal(workflowReadyReport.defaultBranchWorkflow.workflowDispatchOnly, true)
assert.equal(workflowReadyReport.defaultBranchWorkflow.dispatchedInThisPhase, false)
assert.deepEqual(workflowReadyReport.defaultBranchWorkflow.requiredConfirmations, [
  'APPLY_STAGING_BETA_API_OWNER_REMEDIATION',
  'MUTATE_STAGING_IAM_ONLY',
])
assert.ok(workflowReadyReport.recommendedCommandTemplate.includes('beta-readiness-api-staging-owner-remediation.yml'))
assert.ok(workflowReadyReport.plannedOwnerActions.some((action) => action.includes('Artifact Registry writer')))
assert.ok(workflowReadyReport.plannedOwnerActions.some((action) => action.includes('runtime service account')))
assert.ok(workflowReadyReport.blockedScopes.includes('owner_workflow_not_dispatched_by_codex'))
assert.equal(workflowReadyReport.productReadyLocalOssCount, 0)
assert.equal(workflowReadyReport.externalBetaEnabled, false)
assert.equal(workflowReadyReport.productionEnabled, false)
assert.ok(workflowReadyMarkdown.includes('Codex did not dispatch it in this phase'))
assert.ok(workflowReadyMarkdown.includes('APPLY_STAGING_BETA_API_OWNER_REMEDIATION'))
assert.ok(workflowReadyMarkdown.includes('MUTATE_STAGING_IAM_ONLY'))
assert.ok(workflowReadyMarkdown.includes('Product-ready local OSS count remains `0`'))

console.log(JSON.stringify({
  ok: true,
  decisions: [report.decision, exactReport.decision, remediationReport.decision, workflowReadyReport.decision],
  runId: report.defaultBranchWorkflow.latestRun.runId,
  exactRunId: exactReport.defaultBranchWorkflow.latestRun.runId,
  probeFailures: report.readOnlyPreflight.probeFailures,
  exactProbeFailures: exactReport.readOnlyPreflight.probeFailures,
  blockedAction: report.blockedAction,
  exactBlockedAction: exactReport.blockedAction,
  ownerActions: remediationReport.requiredOwnerActions.map((action) => action.id),
  ownerWorkflow: workflowReadyReport.defaultBranchWorkflow.path,
}, null, 2))
