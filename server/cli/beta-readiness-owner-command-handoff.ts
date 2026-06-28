export interface BetaReadinessOwnerCommandHandoffReport {
  ok: true
  decision: 'beta_readiness_api_staging_owner_command_handoff_passed_ready_for_higher_privilege_owner_application'
  sourceTruth: {
    toolsBranch: 'codex/sound-music-audio-1abc-checkpoint'
    latestMergedSourceSha: string
    currentOwnerCommandPacket: string
    currentWorkflowScopeFixPr: 1441
    currentWorkflowScopeFixRunId: 28321557589
    currentWorkflowScopeFixDecision: string
  }
  lockedInputs: {
    projectId: 'reeditpro'
    artifactRegion: 'us-central1'
    artifactRepository: 'reeditpro-staging-workers'
    deployerServiceAccount: 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com'
    runtimeServiceAccount: 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com'
    runtimeServiceAccountId: 'reeditpro-api-staging'
    serviceName: 'reeditpro-api-staging'
  }
  ownerExecution: {
    intendedExecutor: 'higher_privilege_gcp_owner_or_resource_admin'
    shellSafety: string[]
    requiredOwnerEnvironment: string[]
    secretValuesRequiredByHandoff: false
    secretNamesPrintedByDefault: false
  }
  commandPlan: Array<{
    id: string
    purpose: string
    command: string
    expectedReadOnlyAuditProof: string[]
  }>
  shellScript: string
  postOwnerValidation: string[]
  blockedAlternatives: string[]
  blockedScopes: string[]
  supabase: {
    write: 'no write'
    environment: 'none'
    sql: 'none'
    migration: 'no'
  }
  productReadyLocalOssCount: 0
  externalBetaEnabled: false
  realUserMediaBetaEnabled: false
  productionEnabled: false
  warnings: string[]
}

const lockedInputs = {
  projectId: 'reeditpro',
  artifactRegion: 'us-central1',
  artifactRepository: 'reeditpro-staging-workers',
  deployerServiceAccount: 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com',
  runtimeServiceAccount: 'reeditpro-api-staging@reeditpro.iam.gserviceaccount.com',
  runtimeServiceAccountId: 'reeditpro-api-staging',
  serviceName: 'reeditpro-api-staging',
} as const

export function buildBetaReadinessOwnerCommandHandoffReport(
  sourceSha = 'd7534c53649a1ddf4cf064854088a4fc92531adc',
): BetaReadinessOwnerCommandHandoffReport {
  const commandPlan: BetaReadinessOwnerCommandHandoffReport['commandPlan'] = [
    {
      id: 'artifact_registry_writer_on_staging_repository',
      purpose: 'Allow the deployer to read and upload only the staging API image repository.',
      command: `gcloud artifacts repositories add-iam-policy-binding ${lockedInputs.artifactRepository} --project=${lockedInputs.projectId} --location=${lockedInputs.artifactRegion} --member=serviceAccount:${lockedInputs.deployerServiceAccount} --role=roles/artifactregistry.writer`,
      expectedReadOnlyAuditProof: [
        'artifact_registry_repository_exists:passed',
        'artifact_registry_upload_permission:passed',
      ],
    },
    {
      id: 'runtime_service_account_create_or_confirm',
      purpose: 'Create the exact staging API runtime service account only if it does not already exist.',
      command: `gcloud iam service-accounts describe ${lockedInputs.runtimeServiceAccount} --project=${lockedInputs.projectId} >/dev/null 2>&1 || gcloud iam service-accounts create ${lockedInputs.runtimeServiceAccountId} --project=${lockedInputs.projectId} --display-name='ReEditPro API staging runtime'`,
      expectedReadOnlyAuditProof: [
        'runtime_service_account_exists:passed',
      ],
    },
    {
      id: 'deployer_act_as_runtime_service_account',
      purpose: 'Allow the deployer to deploy Cloud Run with only the exact staging API runtime service account.',
      command: `gcloud iam service-accounts add-iam-policy-binding ${lockedInputs.runtimeServiceAccount} --project=${lockedInputs.projectId} --member=serviceAccount:${lockedInputs.deployerServiceAccount} --role=roles/iam.serviceAccountUser`,
      expectedReadOnlyAuditProof: [
        'deployer_can_act_as_runtime_service_account:passed',
      ],
    },
    {
      id: 'deployer_fixed_secret_metadata_describe',
      purpose: 'Allow the deployer to describe only owner-supplied fixed staging API Secret Manager entries without payload access.',
      command: 'for secret in "${REEDITPRO_FIXED_STAGING_API_SECRET_NAMES[@]}"; do gcloud secrets add-iam-policy-binding "$secret" --project=reeditpro --member=serviceAccount:sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com --role=roles/secretmanager.viewer; done',
      expectedReadOnlyAuditProof: [
        'fixed_staging_secret_entries_exist:passed',
      ],
    },
    {
      id: 'runtime_fixed_secret_payload_access',
      purpose: 'Allow only the exact staging API runtime service account to read owner-supplied fixed staging API secret payloads.',
      command: 'for secret in "${REEDITPRO_FIXED_STAGING_API_SECRET_NAMES[@]}"; do gcloud secrets add-iam-policy-binding "$secret" --project=reeditpro --member=serviceAccount:reeditpro-api-staging@reeditpro.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor; done',
      expectedReadOnlyAuditProof: [
        'runtime secret access is proven by deploy/runtime evidence, not by the read-only prerequisite audit',
      ],
    },
  ]

  return {
    ok: true,
    decision: 'beta_readiness_api_staging_owner_command_handoff_passed_ready_for_higher_privilege_owner_application',
    sourceTruth: {
      toolsBranch: 'codex/sound-music-audio-1abc-checkpoint',
      latestMergedSourceSha: sourceSha,
      currentOwnerCommandPacket: 'docs/beta-readiness/api-staging-input-discovery/2026-06-28-api-staging-owner-remediation-command-packet.md',
      currentWorkflowScopeFixPr: 1441,
      currentWorkflowScopeFixRunId: 28321557589,
      currentWorkflowScopeFixDecision: 'beta_readiness_api_staging_owner_remediation_after_workflow_scope_fix_blocked_by_higher_privilege_owner_permissions',
    },
    lockedInputs,
    ownerExecution: {
      intendedExecutor: 'higher_privilege_gcp_owner_or_resource_admin',
      shellSafety: [
        'set -euo pipefail',
        'requires REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV to be set by the owner in their shell',
        'does not print secret values',
        'does not grant roles/run.admin',
        'does not deploy Cloud Run',
      ],
      requiredOwnerEnvironment: [
        'REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV',
      ],
      secretValuesRequiredByHandoff: false,
      secretNamesPrintedByDefault: false,
    },
    commandPlan,
    shellScript: buildShellScript(commandPlan),
    postOwnerValidation: [
      'gh workflow run beta-readiness-api-staging-owner-prerequisite-audit.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_owner_prerequisite_audit=AUDIT_STAGING_BETA_API_OWNER_PREREQUISITES --field artifact_region=us-central1 --field artifact_repository=reeditpro-staging-workers --field deployer_service_account=sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com --field runtime_service_account=reeditpro-api-staging@reeditpro.iam.gserviceaccount.com --field service_name=reeditpro-api-staging',
      'gh workflow run beta-readiness-api-staging-input-discovery.yml --repo yuzastudio6-cyber/Reedkt --ref codex/reeditpro-web-ui-shell --field confirm_staging_api_input_discovery=READ_STAGING_BETA_API_DEPLOY_INPUTS --field artifact_region=us-central1 --field artifact_repository=reeditpro-staging-workers --field deployer_service_account=sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com --field runtime_service_account=reeditpro-api-staging@reeditpro.iam.gserviceaccount.com --field service_name=reeditpro-api-staging',
    ],
    blockedAlternatives: [
      'project-wide owner/editor grants',
      'roles/run.admin mutation from the owner-remediation handoff',
      'granting secret payload access to the deployer',
      'broad wildcard secret access',
      'production service-account substitution',
      'Cloud Run deploy before read-only owner prerequisite audit passes',
      'Docker build or Artifact Registry push before read-only owner prerequisite audit passes',
    ],
    blockedScopes: [
      'cloud_run_deploy_not_run',
      'cloud_run_role_mutation_not_run',
      'docker_build_not_run',
      'artifact_registry_push_not_run',
      'secret_values_not_read',
      'secret_names_not_committed',
      'runtime_tool_execution_not_run',
      'media_processing_not_run',
      'external_beta_not_enabled',
      'real_user_media_beta_not_enabled',
      'paid_production_not_enabled',
    ],
    supabase: {
      write: 'no write',
      environment: 'none',
      sql: 'none',
      migration: 'no',
    },
    productReadyLocalOssCount: 0,
    externalBetaEnabled: false,
    realUserMediaBetaEnabled: false,
    productionEnabled: false,
    warnings: [
      'This CLI prints an owner handoff only; Codex must not run these gcloud commands with the current deployer identity.',
      'The owner must supply fixed staging API secret names in their own shell; the repo must not commit secret names or values.',
      'After owner-side remediation, rerun read-only audits before any staging deploy or evidence collector runs.',
    ],
  }
}

function buildShellScript(commandPlan: ReadonlyArray<{ id: string; purpose: string; command: string }>): string {
  const lines = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    '# Run this only as a higher-privilege GCP owner/resource admin.',
    '# This script intentionally does not deploy Cloud Run, build Docker images, push artifacts, or read secret values.',
    ': "${REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV:?Set comma-separated fixed staging API Secret Manager names in the owner shell.}"',
    'IFS="," read -r -a REEDITPRO_FIXED_STAGING_API_SECRET_NAMES <<< "${REEDITPRO_FIXED_STAGING_API_SECRET_NAMES_CSV}"',
    'if [ "${#REEDITPRO_FIXED_STAGING_API_SECRET_NAMES[@]}" -ne 4 ]; then',
    '  echo "Expected exactly four fixed staging API Secret Manager names." >&2',
    '  exit 1',
    'fi',
    '',
  ]

  for (const command of commandPlan) {
    lines.push(`# ${command.id}: ${command.purpose}`)
    lines.push(command.command)
    lines.push('')
  }

  lines.push('# After these commands, rerun the read-only owner prerequisite audit before deploy.')
  return lines.join('\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(buildBetaReadinessOwnerCommandHandoffReport(), null, 2))
}
