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
const ownerRemediationPermissionBlockerJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-permission-blocker.json'
const ownerRemediationPermissionBlockerMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-permission-blocker.md'
const ownerRemediationPartialResultsBlockerJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-partial-results-blocker.json'
const ownerRemediationPartialResultsBlockerMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-partial-results-blocker.md'
const ownerIdentityScanBlockerJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-identity-scan-blocker.json'
const ownerIdentityScanBlockerMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-identity-scan-blocker.md'
const ownerPrerequisiteAuditResultBlockerJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-prerequisite-audit-result-blocker.json'
const ownerPrerequisiteAuditResultBlockerMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-prerequisite-audit-result-blocker.md'
const currentSourceOwnerPrerequisiteAuditJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-post-current-source-bundle-owner-prerequisite-audit-rerun.json'
const currentSourceOwnerPrerequisiteAuditMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-post-current-source-bundle-owner-prerequisite-audit-rerun.md'
const ownerRemediationCommandPacketJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-command-packet.json'
const ownerRemediationCommandPacketMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-command-packet.md'
const ownerRemediationAfterWorkflowScopeFixJsonPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-after-workflow-scope-fix.json'
const ownerRemediationAfterWorkflowScopeFixMarkdownPath = 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-after-workflow-scope-fix.md'

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
const ownerRemediationPermissionBlockerReport = JSON.parse(readFileSync(ownerRemediationPermissionBlockerJsonPath, 'utf8')) as {
  decision: string
  defaultBranchWorkflow: {
    path: string
    workflowPr: number
    workflowMergeSha: string
    latestRun: {
      runId: number
      headSha: string
      conclusion: string
      failedStep: string
    }
    requiredConfirmations: string[]
  }
  lockedInputs: {
    artifactRegion: string
    artifactRepository: string
    deployerServiceAccount: string
    runtimeServiceAccount: string
    serviceName: string
  }
  observedResult: {
    wifAuthSucceeded: boolean
    setupGcloudSucceeded: boolean
    permissionDenied: string
    resource: string
    reason: string
    verificationStepRan: boolean
    runtimeServiceAccountCreatedByWorkflow: boolean
    artifactRegistryWriterGrantedByWorkflow: boolean
    runAdminGrantedByWorkflow: boolean
    secretAccessorGrantedByWorkflow: boolean
  }
  blockedAction: string
  notABlanketBlocker: boolean
  safeForwardProgress: string[]
  nextSafeActions: string[]
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
const ownerRemediationPermissionBlockerMarkdown = readFileSync(ownerRemediationPermissionBlockerMarkdownPath, 'utf8')
const ownerRemediationPartialResultsBlockerReport = JSON.parse(readFileSync(ownerRemediationPartialResultsBlockerJsonPath, 'utf8')) as {
  decision: string
  workflowImprovements: Array<{ pr: number; mergeSha: string }>
  latestRun: {
    runId: number
    headSha: string
    conclusion: string
    failedStep: string
  }
  prerequisiteResults: Array<{ id: string; status: string; permission?: string; reason: string }>
  verificationResults: Array<{ id: string; status: string; permission?: string; reason: string }>
  blockedAction: string
  notABlanketBlocker: boolean
  safeForwardProgress: string[]
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
const ownerRemediationPartialResultsBlockerMarkdown = readFileSync(ownerRemediationPartialResultsBlockerMarkdownPath, 'utf8')
const ownerIdentityScanBlockerReport = JSON.parse(readFileSync(ownerIdentityScanBlockerJsonPath, 'utf8')) as {
  decision: string
  repoVariablesObserved: string[]
  repoSecretsObservedByNameOnly: string[]
  stagingEnvironmentVariablesObserved: string[]
  stagingEnvironmentSecretsObservedByNameOnly: string[]
  configuredDeployerServiceAccount: string
  higherPrivilegeOwnerIdentityConfigured: boolean
  secretValuesRead: boolean
  blockedAction: string
  safeForwardProgress: string[]
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
const ownerIdentityScanBlockerMarkdown = readFileSync(ownerIdentityScanBlockerMarkdownPath, 'utf8')
const ownerPrerequisiteAuditResultBlockerReport = JSON.parse(readFileSync(ownerPrerequisiteAuditResultBlockerJsonPath, 'utf8')) as {
  decision: string
  defaultBranchWorkflow: {
    path: string
    workflowPr: number
    workflowMergeSha: string
    workflowDispatchOnly: boolean
    confirmationPhrase: string
    latestRun: {
      runId: number
      headSha: string
      conclusion: string
      failedStep: string
    }
  }
  auditResults: Array<{
    id: string
    status: string
    permission?: string
    missingPermission?: string
    resource: string
    reason: string
    allowedPermissions?: string[]
  }>
  secretValuesRead: boolean
  runtimeSecretAccessClaimed: boolean
  blockedAction: string
  notABlanketBlocker: boolean
  safeForwardProgress: string[]
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
const ownerPrerequisiteAuditResultBlockerMarkdown = readFileSync(ownerPrerequisiteAuditResultBlockerMarkdownPath, 'utf8')
const currentSourceOwnerPrerequisiteAuditReport = JSON.parse(readFileSync(currentSourceOwnerPrerequisiteAuditJsonPath, 'utf8')) as {
  decision: string
  toolsSourceSha: string
  currentSourceLocalAcceptedEvidenceDecision: string
  workflow: {
    path: string
    defaultBranch: string
    workflowHeadSha: string
    workflowDispatchOnly: boolean
    confirmationPhrase: string
    runId: number
    jobId: number
    conclusion: string
  }
  auditResults: Array<{
    id: string
    status: string
    permission?: string
    missingPermission?: string
    resource?: string
    reason: string
    allowedPermissions?: string[]
  }>
  secretValuesRead: boolean
  runtimeSecretAccessClaimed: boolean
  blockedAction: string
  notABlanketBlocker: boolean
  safeForwardProgress: string[]
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
const currentSourceOwnerPrerequisiteAuditMarkdown = readFileSync(currentSourceOwnerPrerequisiteAuditMarkdownPath, 'utf8')
const ownerRemediationCommandPacketReport = JSON.parse(readFileSync(ownerRemediationCommandPacketJsonPath, 'utf8')) as {
  decision: string
  sourceEvidence: {
    ownerPrerequisiteAuditWorkflowPr: number
    ownerPrerequisiteAuditRun: number
    ownerPrerequisiteAuditRecordPr: number
    ownerPrerequisiteAuditRecordMergeSha: string
  }
  alreadyProvenByAudit: Array<{
    id: string
    ownerCommandNeeded: boolean
    allowedPermissions: string[]
  }>
  remainingOwnerCommands: Array<{
    id: string
    roleCandidate?: string
    command?: string
    commandTemplate?: string
    target: string
    expectedAuditProof: string[]
  }>
  blockedAlternatives: string[]
  postOwnerValidation: string[]
  blockedAction: string
  notABlanketBlocker: boolean
  safeForwardProgress: string[]
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
const ownerRemediationCommandPacketMarkdown = readFileSync(ownerRemediationCommandPacketMarkdownPath, 'utf8')
const ownerRemediationAfterWorkflowScopeFixReport = JSON.parse(readFileSync(ownerRemediationAfterWorkflowScopeFixJsonPath, 'utf8')) as {
  decision: string
  toolsSourceSha: string
  defaultBranchWorkflow: {
    path: string
    branch: string
    workflowScopeFixPr: number
    workflowScopeFixMergeSha: string
    workflowDispatchOnly: boolean
    requiredConfirmations: string[]
    latestRun: {
      runId: number
      jobId: number
      url: string
      headSha: string
      conclusion: string
      failedStep: string
    }
  }
  workflowScopeFix: {
    removedStaleCloudRunRoleMutation: boolean
    removedRole: string
    addedDeployerMetadataOnlySecretViewer: boolean
    deployerSecretRole: string
    runtimeSecretRole: string
    cloudRunDeployPermissionAlreadyProvenByAudit: boolean
  }
  prerequisiteResults: Array<{
    id: string
    status: string
    permission?: string
    resource?: string
    reason: string
    detail?: string
  }>
  verificationResults: Array<{
    id: string
    status: string
    permission?: string
    resource?: string
    reason: string
    detail?: string
  }>
  notABlanketBlocker: boolean
  blockedAction: string
  safeForwardProgress: string[]
  blockedScopes: string[]
  nextSafeActions: string[]
  secretValuesRead: boolean
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
const ownerRemediationAfterWorkflowScopeFixMarkdown = readFileSync(ownerRemediationAfterWorkflowScopeFixMarkdownPath, 'utf8')

assert.equal(
  packageJson.scripts['smoke:beta-readiness-api-staging-input-discovery-blocker'],
  'node --experimental-strip-types --import ./server/cli/beta-readiness-node-ts-register.mjs server/smoke/beta-readiness-api-staging-input-discovery-blocker-smoke.ts',
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
  'deployer_fixed_secret_metadata_describe',
  'runtime_secret_access',
])
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.deploymentRoleCandidate === 'roles/artifactregistry.writer'))
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.roleCandidate === 'roles/iam.serviceAccountUser'))
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.roleCandidate === 'roles/secretmanager.viewer'))
assert.ok(remediationReport.requiredOwnerActions.some((action) => action.roleCandidate === 'roles/secretmanager.secretAccessor'))
assert.equal(
  remediationReport.requiredOwnerActions.some((action) => action.roleCandidate === 'roles/run.admin'),
  false,
  'active owner remediation request must not ask for stale Cloud Run admin role',
)
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
assert.ok(remediationMarkdown.includes('roles/secretmanager.viewer'))
assert.ok(remediationMarkdown.includes('roles/secretmanager.secretAccessor'))
assert.ok(remediationMarkdown.includes('Only after exact validation passes'))
assert.ok(remediationMarkdown.includes('Cloud Run role mutation is no longer part of the active remediation set'))
assert.equal(remediationMarkdown.includes('roles/run.admin'), false, 'active remediation markdown must not request roles/run.admin')
assert.equal(JSON.stringify(remediationReport).includes('gha-creds'), false, 'remediation report must not include credential-file paths')
assert.equal(JSON.stringify(remediationReport).includes('SERVICE_ROLE_KEY'), false, 'remediation report must not include secret names or values')

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

assert.equal(ownerRemediationPermissionBlockerReport.decision, 'beta_readiness_api_staging_owner_remediation_blocked_by_artifact_registry_iam_policy_permission')
assert.equal(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.path, '.github/workflows/beta-readiness-api-staging-owner-remediation.yml')
assert.equal(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.workflowPr, 1382)
assert.equal(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.workflowMergeSha, 'e818b5c6cdd200b6e6c06c517f5f2e3f557388f6')
assert.equal(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.latestRun.runId, 28310493040)
assert.equal(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.latestRun.headSha, 'e818b5c6cdd200b6e6c06c517f5f2e3f557388f6')
assert.equal(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.latestRun.conclusion, 'failure')
assert.equal(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.latestRun.failedStep, 'Apply staging API IAM and runtime account prerequisites')
assert.deepEqual(ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.requiredConfirmations, [
  'APPLY_STAGING_BETA_API_OWNER_REMEDIATION',
  'MUTATE_STAGING_IAM_ONLY',
])
assert.equal(ownerRemediationPermissionBlockerReport.lockedInputs.artifactRegion, 'us-central1')
assert.equal(ownerRemediationPermissionBlockerReport.lockedInputs.artifactRepository, 'reeditpro-staging-workers')
assert.equal(ownerRemediationPermissionBlockerReport.lockedInputs.deployerServiceAccount, 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com')
assert.equal(ownerRemediationPermissionBlockerReport.lockedInputs.runtimeServiceAccount, 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com')
assert.equal(ownerRemediationPermissionBlockerReport.lockedInputs.serviceName, 'reeditpro-api-staging')
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.wifAuthSucceeded, true)
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.setupGcloudSucceeded, true)
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.permissionDenied, 'artifactregistry.repositories.getIamPolicy')
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.resource, 'projects/reeditpro/locations/us-central1/repositories/reeditpro-staging-workers')
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.reason, 'IAM_PERMISSION_DENIED')
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.verificationStepRan, false)
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.runtimeServiceAccountCreatedByWorkflow, false)
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.artifactRegistryWriterGrantedByWorkflow, false)
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.runAdminGrantedByWorkflow, false)
assert.equal(ownerRemediationPermissionBlockerReport.observedResult.secretAccessorGrantedByWorkflow, false)
assert.equal(ownerRemediationPermissionBlockerReport.notABlanketBlocker, true)
assert.equal(ownerRemediationPermissionBlockerReport.blockedAction, 'staging_api_deploy_until_repository_iam_policy_admin_or_higher_privilege_owner_grants_exact_staging_permissions')
assert.ok(ownerRemediationPermissionBlockerReport.safeForwardProgress.includes('owner_or_repository_iam_admin_grants_deployer_artifact_registry_writer_on_us_central1_reeditpro_staging_workers'))
assert.ok(ownerRemediationPermissionBlockerReport.safeForwardProgress.includes('rerun_exact_input_validation_after_owner_side_iam_remediation'))
assert.ok(ownerRemediationPermissionBlockerReport.nextSafeActions.some((action) => action.includes('higher-privilege owner')))
assert.ok(ownerRemediationPermissionBlockerReport.nextSafeActions.some((action) => action.includes('exact validation passes')))
assert.ok(ownerRemediationPermissionBlockerReport.blockedScopes.includes('cloud_run_deploy_not_run'))
assert.ok(ownerRemediationPermissionBlockerReport.blockedScopes.includes('artifact_registry_writer_not_granted_by_workflow'))
assert.ok(ownerRemediationPermissionBlockerReport.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(ownerRemediationPermissionBlockerReport.productReadyLocalOssCount, 0)
assert.equal(ownerRemediationPermissionBlockerReport.externalBetaEnabled, false)
assert.equal(ownerRemediationPermissionBlockerReport.productionEnabled, false)
assert.deepEqual(ownerRemediationPermissionBlockerReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(ownerRemediationPermissionBlockerMarkdown.includes('artifactregistry.repositories.getIamPolicy'))
assert.ok(ownerRemediationPermissionBlockerMarkdown.includes('This is not a blanket blocker.'))
assert.ok(ownerRemediationPermissionBlockerMarkdown.includes('higher-privilege owner or repository IAM admin'))
assert.ok(ownerRemediationPermissionBlockerMarkdown.includes('Product-ready local OSS count remains `0`'))
assert.equal(JSON.stringify(ownerRemediationPermissionBlockerReport).includes('gha-creds'), false, 'owner remediation blocker report must not include credential-file paths')
assert.equal(JSON.stringify(ownerRemediationPermissionBlockerReport).includes('SERVICE_ROLE_KEY'), false, 'owner remediation blocker report must not include secret values')

assert.equal(ownerRemediationPartialResultsBlockerReport.decision, 'beta_readiness_api_staging_owner_remediation_blocked_by_owner_privilege_required')
assert.deepEqual(ownerRemediationPartialResultsBlockerReport.workflowImprovements.map((item) => item.pr), [1386, 1388])
assert.equal(ownerRemediationPartialResultsBlockerReport.latestRun.runId, 28310853041)
assert.equal(ownerRemediationPartialResultsBlockerReport.latestRun.headSha, '8a6c5764dabb8a048483895bd29eba265a53b3b7')
assert.equal(ownerRemediationPartialResultsBlockerReport.latestRun.conclusion, 'failure')
assert.equal(ownerRemediationPartialResultsBlockerReport.latestRun.failedStep, 'Verify exact staging API owner remediation inputs')
assert.deepEqual(ownerRemediationPartialResultsBlockerReport.prerequisiteResults.map((result) => result.id), [
  'artifact_registry_writer_binding',
  'runtime_service_account_create',
  'deployer_act_as_runtime_binding',
  'cloud_run_admin_binding',
  'runtime_secret_accessor_bindings',
])
assert.ok(ownerRemediationPartialResultsBlockerReport.prerequisiteResults.every((result) => result.status === 'failure'))
assert.ok(ownerRemediationPartialResultsBlockerReport.prerequisiteResults.some((result) => result.permission === 'artifactregistry.repositories.getIamPolicy'))
assert.ok(ownerRemediationPartialResultsBlockerReport.prerequisiteResults.some((result) => result.permission === 'iam.serviceAccounts.create'))
assert.ok(ownerRemediationPartialResultsBlockerReport.prerequisiteResults.some((result) => result.permission === 'secretmanager.secrets.getIamPolicy'))
assert.ok(ownerRemediationPartialResultsBlockerReport.prerequisiteResults.some((result) => result.reason === 'NOT_FOUND'))
assert.deepEqual(ownerRemediationPartialResultsBlockerReport.verificationResults.map((result) => result.id), [
  'artifact_registry_repository_describe',
  'runtime_service_account_describe',
])
assert.ok(ownerRemediationPartialResultsBlockerReport.verificationResults.some((result) => result.permission === 'artifactregistry.repositories.get'))
assert.ok(ownerRemediationPartialResultsBlockerReport.verificationResults.some((result) => result.reason === 'NOT_FOUND'))
assert.equal(ownerRemediationPartialResultsBlockerReport.blockedAction, 'staging_api_deploy_until_higher_privilege_owner_applies_exact_iam_and_runtime_account_prerequisites')
assert.equal(ownerRemediationPartialResultsBlockerReport.notABlanketBlocker, true)
assert.ok(ownerRemediationPartialResultsBlockerReport.safeForwardProgress.includes('higher_privilege_owner_applies_exact_staging_repository_iam_binding'))
assert.ok(ownerRemediationPartialResultsBlockerReport.safeForwardProgress.includes('rerun_exact_input_validation_after_owner_side_remediation'))
assert.ok(ownerRemediationPartialResultsBlockerReport.blockedScopes.includes('cloud_run_deploy_not_run'))
assert.ok(ownerRemediationPartialResultsBlockerReport.blockedScopes.includes('runtime_service_account_not_available'))
assert.ok(ownerRemediationPartialResultsBlockerReport.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(ownerRemediationPartialResultsBlockerReport.productReadyLocalOssCount, 0)
assert.equal(ownerRemediationPartialResultsBlockerReport.externalBetaEnabled, false)
assert.equal(ownerRemediationPartialResultsBlockerReport.productionEnabled, false)
assert.deepEqual(ownerRemediationPartialResultsBlockerReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(ownerRemediationPartialResultsBlockerMarkdown.includes('higher-privilege owner'))
assert.ok(ownerRemediationPartialResultsBlockerMarkdown.includes('artifactregistry.repositories.getIamPolicy'))
assert.ok(ownerRemediationPartialResultsBlockerMarkdown.includes('iam.serviceAccounts.create'))
assert.ok(ownerRemediationPartialResultsBlockerMarkdown.includes('secretmanager.secrets.getIamPolicy'))
assert.equal(JSON.stringify(ownerRemediationPartialResultsBlockerReport).includes('gha-creds'), false, 'partial remediation report must not include credential-file paths')
assert.equal(JSON.stringify(ownerRemediationPartialResultsBlockerReport).includes('SERVICE_ROLE_KEY'), false, 'partial remediation report must not include secret values')

assert.equal(ownerIdentityScanBlockerReport.decision, 'beta_readiness_api_staging_owner_identity_scan_blocked_no_higher_privilege_identity_configured')
assert.ok(ownerIdentityScanBlockerReport.repoVariablesObserved.includes('GCP_SERVICE_ACCOUNT'))
assert.ok(ownerIdentityScanBlockerReport.repoVariablesObserved.includes('GCP_WORKLOAD_IDENTITY_PROVIDER'))
assert.ok(ownerIdentityScanBlockerReport.repoSecretsObservedByNameOnly.includes('GCP_SERVICE_ACCOUNT'))
assert.deepEqual(ownerIdentityScanBlockerReport.stagingEnvironmentVariablesObserved, [])
assert.deepEqual(ownerIdentityScanBlockerReport.stagingEnvironmentSecretsObservedByNameOnly, [])
assert.equal(ownerIdentityScanBlockerReport.configuredDeployerServiceAccount, 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com')
assert.equal(ownerIdentityScanBlockerReport.higherPrivilegeOwnerIdentityConfigured, false)
assert.equal(ownerIdentityScanBlockerReport.secretValuesRead, false)
assert.equal(ownerIdentityScanBlockerReport.blockedAction, 'staging_api_owner_remediation_via_alternate_github_identity_until_owner_configures_or_runs_higher_privilege_path')
assert.ok(ownerIdentityScanBlockerReport.safeForwardProgress.includes('higher_privilege_gcp_owner_applies_exact_iam_prerequisites_outside_github_deployer_identity'))
assert.ok(ownerIdentityScanBlockerReport.safeForwardProgress.includes('rerun_exact_input_validation_after_owner_side_remediation'))
assert.ok(ownerIdentityScanBlockerReport.blockedScopes.includes('no_alternate_owner_service_account_configured'))
assert.ok(ownerIdentityScanBlockerReport.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(ownerIdentityScanBlockerReport.productReadyLocalOssCount, 0)
assert.equal(ownerIdentityScanBlockerReport.externalBetaEnabled, false)
assert.equal(ownerIdentityScanBlockerReport.productionEnabled, false)
assert.deepEqual(ownerIdentityScanBlockerReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(ownerIdentityScanBlockerMarkdown.includes('No `staging` environment variables or secrets'))
assert.ok(ownerIdentityScanBlockerMarkdown.includes('secret names only'))
assert.ok(ownerIdentityScanBlockerMarkdown.includes('higher-privilege GCP owner'))
assert.equal(JSON.stringify(ownerIdentityScanBlockerReport).includes('gha-creds'), false, 'identity scan report must not include credential-file paths')

assert.equal(ownerPrerequisiteAuditResultBlockerReport.decision, 'beta_readiness_api_staging_owner_prerequisite_audit_blocked_by_artifact_runtime_and_secret_describe_prerequisites')
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.path, '.github/workflows/beta-readiness-api-staging-owner-prerequisite-audit.yml')
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.workflowPr, 1398)
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.workflowMergeSha, 'bf663414d78f4612fb436037efa73fad23433a35')
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.workflowDispatchOnly, true)
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.confirmationPhrase, 'AUDIT_STAGING_BETA_API_OWNER_PREREQUISITES')
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.latestRun.runId, 28312122163)
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.latestRun.headSha, 'bf663414d78f4612fb436037efa73fad23433a35')
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.latestRun.conclusion, 'failure')
assert.equal(ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.latestRun.failedStep, 'Audit read-only staging API prerequisites')
assert.deepEqual(ownerPrerequisiteAuditResultBlockerReport.auditResults.map((result) => `${result.id}:${result.status}`), [
  'artifact_registry_repository_exists:failed',
  'artifact_registry_upload_permission:failed',
  'runtime_service_account_exists:failed',
  'deployer_can_act_as_runtime_service_account:failed',
  'cloud_run_deploy_permissions:passed',
  'fixed_staging_secret_entries_exist:failed',
])
assert.ok(ownerPrerequisiteAuditResultBlockerReport.auditResults.some((result) => result.permission === 'artifactregistry.repositories.get'))
assert.ok(ownerPrerequisiteAuditResultBlockerReport.auditResults.some((result) => result.missingPermission === 'artifactregistry.repositories.uploadArtifacts'))
assert.ok(ownerPrerequisiteAuditResultBlockerReport.auditResults.some((result) => result.reason === 'NOT_FOUND'))
assert.ok(ownerPrerequisiteAuditResultBlockerReport.auditResults.some((result) => result.permission === 'secretmanager.secrets.get'))
assert.ok(ownerPrerequisiteAuditResultBlockerReport.auditResults.some((result) => result.allowedPermissions?.includes('run.services.update')))
assert.equal(ownerPrerequisiteAuditResultBlockerReport.secretValuesRead, false)
assert.equal(ownerPrerequisiteAuditResultBlockerReport.runtimeSecretAccessClaimed, false)
assert.equal(ownerPrerequisiteAuditResultBlockerReport.blockedAction, 'staging_api_deploy_until_artifact_registry_runtime_service_account_and_secret_entry_prerequisites_are_proven')
assert.equal(ownerPrerequisiteAuditResultBlockerReport.notABlanketBlocker, true)
assert.ok(ownerPrerequisiteAuditResultBlockerReport.safeForwardProgress.includes('higher_privilege_owner_grants_exact_artifact_registry_get_and_upload_permissions'))
assert.ok(ownerPrerequisiteAuditResultBlockerReport.safeForwardProgress.includes('rerun_read_only_owner_prerequisite_audit_after_owner_side_remediation'))
assert.ok(ownerPrerequisiteAuditResultBlockerReport.blockedScopes.includes('runtime_secret_access_not_claimed'))
assert.ok(ownerPrerequisiteAuditResultBlockerReport.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(ownerPrerequisiteAuditResultBlockerReport.productReadyLocalOssCount, 0)
assert.equal(ownerPrerequisiteAuditResultBlockerReport.externalBetaEnabled, false)
assert.equal(ownerPrerequisiteAuditResultBlockerReport.productionEnabled, false)
assert.deepEqual(ownerPrerequisiteAuditResultBlockerReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(ownerPrerequisiteAuditResultBlockerMarkdown.includes('Cloud Run deploy permissions passed'))
assert.ok(ownerPrerequisiteAuditResultBlockerMarkdown.includes('This is not a blanket blocker.'))
assert.ok(ownerPrerequisiteAuditResultBlockerMarkdown.includes('Secret values were not read.'))
assert.equal(JSON.stringify(ownerPrerequisiteAuditResultBlockerReport).includes('gha-creds'), false, 'owner prerequisite audit report must not include credential-file paths')
assert.equal(JSON.stringify(ownerPrerequisiteAuditResultBlockerReport).includes('SERVICE_ROLE_KEY'), false, 'owner prerequisite audit report must not include secret names or values')

assert.equal(currentSourceOwnerPrerequisiteAuditReport.decision, 'beta_readiness_api_staging_owner_prerequisite_audit_rerun_after_current_source_local_bundle_blocked_by_same_owner_prerequisites')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.toolsSourceSha, '0f8e95cdd7d4c9b072bf1a75bd48131237f19363')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.currentSourceLocalAcceptedEvidenceDecision, 'beta_tools_current_source_local_accepted_evidence_bundle_passed_ready_for_deployed_staging_evidence_recording')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.path, '.github/workflows/beta-readiness-api-staging-owner-prerequisite-audit.yml')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.defaultBranch, 'codex/reeditpro-web-ui-shell')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.workflowHeadSha, 'bf663414d78f4612fb436037efa73fad23433a35')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.workflowDispatchOnly, true)
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.confirmationPhrase, 'AUDIT_STAGING_BETA_API_OWNER_PREREQUISITES')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.runId, 28321041675)
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.jobId, 83902913014)
assert.equal(currentSourceOwnerPrerequisiteAuditReport.workflow.conclusion, 'failure')
assert.deepEqual(currentSourceOwnerPrerequisiteAuditReport.auditResults.map((result) => `${result.id}:${result.status}`), [
  'artifact_registry_repository_exists:failed',
  'artifact_registry_upload_permission:failed',
  'runtime_service_account_exists:failed',
  'deployer_can_act_as_runtime_service_account:failed',
  'cloud_run_deploy_permissions:passed',
  'fixed_staging_secret_entries_exist:failed',
])
assert.ok(currentSourceOwnerPrerequisiteAuditReport.auditResults.some((result) => result.permission === 'artifactregistry.repositories.get'))
assert.ok(currentSourceOwnerPrerequisiteAuditReport.auditResults.some((result) => result.missingPermission === 'artifactregistry.repositories.uploadArtifacts'))
assert.ok(currentSourceOwnerPrerequisiteAuditReport.auditResults.some((result) => result.reason === 'NOT_FOUND'))
assert.ok(currentSourceOwnerPrerequisiteAuditReport.auditResults.some((result) => result.permission === 'secretmanager.secrets.get'))
assert.ok(currentSourceOwnerPrerequisiteAuditReport.auditResults.some((result) => result.allowedPermissions?.includes('run.services.update')))
assert.equal(currentSourceOwnerPrerequisiteAuditReport.secretValuesRead, false)
assert.equal(currentSourceOwnerPrerequisiteAuditReport.runtimeSecretAccessClaimed, false)
assert.equal(currentSourceOwnerPrerequisiteAuditReport.blockedAction, 'staging_api_deploy_until_artifact_registry_runtime_service_account_and_secret_entry_prerequisites_are_proven')
assert.equal(currentSourceOwnerPrerequisiteAuditReport.notABlanketBlocker, true)
assert.ok(currentSourceOwnerPrerequisiteAuditReport.safeForwardProgress.includes('higher_privilege_owner_grants_exact_artifact_registry_get_and_upload_permissions'))
assert.ok(currentSourceOwnerPrerequisiteAuditReport.safeForwardProgress.includes('rerun_read_only_owner_prerequisite_audit_after_owner_side_remediation'))
assert.ok(currentSourceOwnerPrerequisiteAuditReport.blockedScopes.includes('runtime_secret_access_not_claimed'))
assert.ok(currentSourceOwnerPrerequisiteAuditReport.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(currentSourceOwnerPrerequisiteAuditReport.productReadyLocalOssCount, 0)
assert.equal(currentSourceOwnerPrerequisiteAuditReport.externalBetaEnabled, false)
assert.equal(currentSourceOwnerPrerequisiteAuditReport.productionEnabled, false)
assert.deepEqual(currentSourceOwnerPrerequisiteAuditReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(currentSourceOwnerPrerequisiteAuditMarkdown.includes('28321041675'))
assert.ok(currentSourceOwnerPrerequisiteAuditMarkdown.includes('This is not a blanket blocker.'))
assert.ok(currentSourceOwnerPrerequisiteAuditMarkdown.includes('Secret values were not read.'))
assert.equal(JSON.stringify(currentSourceOwnerPrerequisiteAuditReport).includes('gha-creds'), false, 'current-source owner prerequisite audit report must not include credential-file paths')
assert.equal(JSON.stringify(currentSourceOwnerPrerequisiteAuditReport).includes('SERVICE_ROLE_KEY'), false, 'current-source owner prerequisite audit report must not include secret names or values')

assert.equal(ownerRemediationCommandPacketReport.decision, 'beta_readiness_api_staging_owner_remediation_command_packet_passed_ready_for_higher_privilege_owner_application')
assert.equal(ownerRemediationCommandPacketReport.sourceEvidence.ownerPrerequisiteAuditWorkflowPr, 1398)
assert.equal(ownerRemediationCommandPacketReport.sourceEvidence.ownerPrerequisiteAuditRun, 28312122163)
assert.equal(ownerRemediationCommandPacketReport.sourceEvidence.ownerPrerequisiteAuditRecordPr, 1402)
assert.equal(ownerRemediationCommandPacketReport.sourceEvidence.ownerPrerequisiteAuditRecordMergeSha, '1cae115558a33ea18e9dfd29693d4aa9176ed9d2')
assert.ok(ownerRemediationCommandPacketReport.alreadyProvenByAudit.some((item) => item.id === 'cloud_run_deploy_permissions' && item.ownerCommandNeeded === false))
assert.ok(ownerRemediationCommandPacketReport.alreadyProvenByAudit.some((item) => item.allowedPermissions.includes('run.services.update')))
assert.deepEqual(ownerRemediationCommandPacketReport.remainingOwnerCommands.map((command) => command.id), [
  'artifact_registry_writer_on_staging_repository',
  'runtime_service_account_create_or_confirm',
  'deployer_act_as_runtime_service_account',
  'deployer_fixed_secret_metadata_describe',
  'runtime_fixed_secret_payload_access',
])
assert.ok(ownerRemediationCommandPacketReport.remainingOwnerCommands.some((command) => command.command?.includes('roles/artifactregistry.writer')))
assert.ok(ownerRemediationCommandPacketReport.remainingOwnerCommands.some((command) => command.command?.includes('roles/iam.serviceAccountUser')))
assert.ok(ownerRemediationCommandPacketReport.remainingOwnerCommands.some((command) => command.commandTemplate?.includes('roles/secretmanager.viewer')))
assert.ok(ownerRemediationCommandPacketReport.remainingOwnerCommands.some((command) => command.commandTemplate?.includes('roles/secretmanager.secretAccessor')))
assert.ok(ownerRemediationCommandPacketReport.remainingOwnerCommands.every((command) => command.expectedAuditProof.length > 0))
assert.ok(ownerRemediationCommandPacketReport.blockedAlternatives.includes('granting secret payload access to the deployer'))
assert.ok(ownerRemediationCommandPacketReport.blockedAlternatives.includes('Cloud Run deploy before audit passes'))
assert.ok(ownerRemediationCommandPacketReport.postOwnerValidation.some((item) => item.includes('AUDIT_STAGING_BETA_API_OWNER_PREREQUISITES')))
assert.ok(ownerRemediationCommandPacketReport.postOwnerValidation.some((item) => item.includes('DEPLOY_STAGING_BETA_READINESS_API')))
assert.equal(ownerRemediationCommandPacketReport.blockedAction, 'staging_api_deploy_until_higher_privilege_owner_applies_exact_remaining_prerequisite_commands_and_audit_passes')
assert.equal(ownerRemediationCommandPacketReport.notABlanketBlocker, true)
assert.ok(ownerRemediationCommandPacketReport.safeForwardProgress.includes('higher_privilege_owner_applies_command_packet'))
assert.ok(ownerRemediationCommandPacketReport.safeForwardProgress.includes('rerun_read_only_owner_prerequisite_audit'))
assert.ok(ownerRemediationCommandPacketReport.blockedScopes.includes('secret_values_not_read'))
assert.ok(ownerRemediationCommandPacketReport.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(ownerRemediationCommandPacketReport.productReadyLocalOssCount, 0)
assert.equal(ownerRemediationCommandPacketReport.externalBetaEnabled, false)
assert.equal(ownerRemediationCommandPacketReport.productionEnabled, false)
assert.deepEqual(ownerRemediationCommandPacketReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(ownerRemediationCommandPacketMarkdown.includes('Cloud Run deploy permissions'))
assert.ok(ownerRemediationCommandPacketMarkdown.includes('roles/artifactregistry.writer'))
assert.ok(ownerRemediationCommandPacketMarkdown.includes('roles/secretmanager.viewer'))
assert.ok(ownerRemediationCommandPacketMarkdown.includes('roles/secretmanager.secretAccessor'))
assert.ok(ownerRemediationCommandPacketMarkdown.includes('This packet is not a blanket blocker'))
assert.equal(JSON.stringify(ownerRemediationCommandPacketReport).includes('gha-creds'), false, 'owner command packet must not include credential-file paths')
assert.equal(JSON.stringify(ownerRemediationCommandPacketReport).includes('SERVICE_ROLE_KEY'), false, 'owner command packet must not include secret names or values')

assert.equal(ownerRemediationAfterWorkflowScopeFixReport.decision, 'beta_readiness_api_staging_owner_remediation_after_workflow_scope_fix_blocked_by_higher_privilege_owner_permissions')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.toolsSourceSha, '22c9ee6277eaf0f4ff3f8bdb3d96990a78671579')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.path, '.github/workflows/beta-readiness-api-staging-owner-remediation.yml')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.branch, 'codex/reeditpro-web-ui-shell')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.workflowScopeFixPr, 1441)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.workflowScopeFixMergeSha, '1b08bb39378952ff0922e9c3535067a4fa583620')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.workflowDispatchOnly, true)
assert.deepEqual(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.requiredConfirmations, [
  'APPLY_STAGING_BETA_API_OWNER_REMEDIATION',
  'MUTATE_STAGING_IAM_ONLY',
])
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.latestRun.runId, 28321557589)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.latestRun.jobId, 83904265484)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.latestRun.headSha, '1b08bb39378952ff0922e9c3535067a4fa583620')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.latestRun.conclusion, 'failure')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.latestRun.failedStep, 'Verify exact staging API owner remediation inputs')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.workflowScopeFix.removedStaleCloudRunRoleMutation, true)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.workflowScopeFix.removedRole, 'roles/run.admin')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.workflowScopeFix.addedDeployerMetadataOnlySecretViewer, true)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.workflowScopeFix.deployerSecretRole, 'roles/secretmanager.viewer')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.workflowScopeFix.runtimeSecretRole, 'roles/secretmanager.secretAccessor')
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.workflowScopeFix.cloudRunDeployPermissionAlreadyProvenByAudit, true)
assert.deepEqual(ownerRemediationAfterWorkflowScopeFixReport.prerequisiteResults.map((result) => `${result.id}:${result.status}`), [
  'artifact_registry_writer_binding:failure',
  'runtime_service_account_create:failure',
  'deployer_act_as_runtime_binding:failure',
  'deployer_secret_metadata_viewer_fixed_entries:failure',
  'runtime_secret_accessor_fixed_entries:failure',
])
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.prerequisiteResults.some((result) => result.permission === 'artifactregistry.repositories.getIamPolicy'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.prerequisiteResults.some((result) => result.permission === 'iam.serviceAccounts.create'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.prerequisiteResults.some((result) => result.permission === 'secretmanager.secrets.getIamPolicy'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.prerequisiteResults.some((result) => result.reason === 'NOT_FOUND'))
assert.deepEqual(ownerRemediationAfterWorkflowScopeFixReport.verificationResults.map((result) => `${result.id}:${result.status}`), [
  'artifact_registry_repository_describe:failure',
  'runtime_service_account_describe:failure',
])
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.verificationResults.some((result) => result.permission === 'artifactregistry.repositories.get'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.verificationResults.some((result) => result.reason === 'NOT_FOUND'))
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.notABlanketBlocker, true)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.blockedAction, 'staging_api_deploy_until_higher_privilege_owner_applies_exact_iam_runtime_and_secret_policy_prerequisites')
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.safeForwardProgress.includes('higher_privilege_owner_applies_exact_owner_command_packet'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.safeForwardProgress.includes('rerun_read_only_owner_prerequisite_audit_after_owner_side_remediation'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.nextSafeActions.some((action) => action.includes('Artifact Registry writer')))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.nextSafeActions.some((action) => action.includes('metadata-only viewer')))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.blockedScopes.includes('cloud_run_deploy_not_run'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.blockedScopes.includes('cloud_run_role_mutation_not_run'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.blockedScopes.includes('docker_build_not_run'))
assert.ok(ownerRemediationAfterWorkflowScopeFixReport.blockedScopes.includes('external_beta_not_enabled'))
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.secretValuesRead, false)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.productReadyLocalOssCount, 0)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.externalBetaEnabled, false)
assert.equal(ownerRemediationAfterWorkflowScopeFixReport.productionEnabled, false)
assert.deepEqual(ownerRemediationAfterWorkflowScopeFixReport.supabase, {
  write: 'no write',
  environment: 'none',
  sql: 'none',
  migration: 'no',
})
assert.ok(ownerRemediationAfterWorkflowScopeFixMarkdown.includes('PR #1441'))
assert.ok(ownerRemediationAfterWorkflowScopeFixMarkdown.includes('removed stale Cloud Run role mutation'))
assert.ok(ownerRemediationAfterWorkflowScopeFixMarkdown.includes('This is not a blanket blocker.'))
assert.ok(ownerRemediationAfterWorkflowScopeFixMarkdown.includes('Product-ready local OSS count remains `0`'))
assert.equal(JSON.stringify(ownerRemediationAfterWorkflowScopeFixReport).includes('gha-creds'), false, 'workflow scope fix report must not include credential-file paths')
assert.equal(JSON.stringify(ownerRemediationAfterWorkflowScopeFixReport).includes('SERVICE_ROLE_KEY'), false, 'workflow scope fix report must not include secret names or values')

console.log(JSON.stringify({
  ok: true,
  decisions: [
    report.decision,
    exactReport.decision,
    remediationReport.decision,
    workflowReadyReport.decision,
    ownerRemediationPermissionBlockerReport.decision,
    ownerRemediationPartialResultsBlockerReport.decision,
    ownerIdentityScanBlockerReport.decision,
    ownerPrerequisiteAuditResultBlockerReport.decision,
    currentSourceOwnerPrerequisiteAuditReport.decision,
    ownerRemediationCommandPacketReport.decision,
    ownerRemediationAfterWorkflowScopeFixReport.decision,
  ],
  runId: report.defaultBranchWorkflow.latestRun.runId,
  exactRunId: exactReport.defaultBranchWorkflow.latestRun.runId,
  ownerRemediationRunId: ownerRemediationPermissionBlockerReport.defaultBranchWorkflow.latestRun.runId,
  ownerRemediationPartialRunId: ownerRemediationPartialResultsBlockerReport.latestRun.runId,
  ownerPrerequisiteAuditRunId: ownerPrerequisiteAuditResultBlockerReport.defaultBranchWorkflow.latestRun.runId,
  currentSourceOwnerPrerequisiteAuditRunId: currentSourceOwnerPrerequisiteAuditReport.workflow.runId,
  probeFailures: report.readOnlyPreflight.probeFailures,
  exactProbeFailures: exactReport.readOnlyPreflight.probeFailures,
  ownerRemediationPermissionDenied: ownerRemediationPermissionBlockerReport.observedResult.permissionDenied,
  ownerRemediationPrerequisites: ownerRemediationPartialResultsBlockerReport.prerequisiteResults.map((result) => `${result.id}:${result.status}`),
  higherPrivilegeOwnerIdentityConfigured: ownerIdentityScanBlockerReport.higherPrivilegeOwnerIdentityConfigured,
  blockedAction: report.blockedAction,
  exactBlockedAction: exactReport.blockedAction,
  ownerRemediationBlockedAction: ownerRemediationPermissionBlockerReport.blockedAction,
  ownerRemediationPartialBlockedAction: ownerRemediationPartialResultsBlockerReport.blockedAction,
  ownerPrerequisiteAuditBlockedAction: ownerPrerequisiteAuditResultBlockerReport.blockedAction,
  ownerRemediationCommandPacketBlockedAction: ownerRemediationCommandPacketReport.blockedAction,
  ownerRemediationAfterWorkflowScopeFixBlockedAction: ownerRemediationAfterWorkflowScopeFixReport.blockedAction,
  ownerActions: remediationReport.requiredOwnerActions.map((action) => action.id),
  remainingOwnerCommands: ownerRemediationCommandPacketReport.remainingOwnerCommands.map((command) => command.id),
  ownerRemediationAfterWorkflowScopeFixRunId: ownerRemediationAfterWorkflowScopeFixReport.defaultBranchWorkflow.latestRun.runId,
  ownerWorkflow: workflowReadyReport.defaultBranchWorkflow.path,
}, null, 2))
