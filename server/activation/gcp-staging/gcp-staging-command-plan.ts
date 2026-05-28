import {
  buildArtifactImageName,
  gcpStagingRequiredApis,
} from './gcp-staging-resource-map'
import {
  gcpStagingDoesNotDo,
  validateGcpStagingCommandPlan,
} from './gcp-staging-policy'
import type {
  GcpStagingCommandPhase,
  GcpStagingCommandPlan,
  GcpStagingConfig,
  GcpStagingResourceMap,
} from './gcp-staging-types'

export function buildGcpStagingCommandPlans(
  config: GcpStagingConfig,
  resourceMap: GcpStagingResourceMap,
): GcpStagingCommandPlan[] {
  const plans: GcpStagingCommandPlan[] = [
    commandPlan('print-config', 'print_config', [
      'printf "project=%s region=%s artifact_region=%s bucket_location=%s env=%s repo=%s image_tag=%s\\n"',
      '"${GCP_PROJECT_ID}" "${GCP_REGION}" "${GCP_ARTIFACT_REGION}" "${GCP_BUCKET_LOCATION}" "${REEDITPRO_ENV}" "${REEDITPRO_ARTIFACT_REPOSITORY}" "${REEDITPRO_IMAGE_TAG}"',
    ].join(' '), ['GCP_PROJECT_ID', 'GCP_REGION', 'GCP_ARTIFACT_REGION', 'GCP_BUCKET_LOCATION', 'REEDITPRO_ENV'], false, true),
    commandPlan('enable-apis', 'enable_apis', `gcloud services enable ${gcpStagingRequiredApis.join(' ')} --project "${config.projectId}"`, ['GCP_PROJECT_ID', 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'], true, true),
    commandPlan('create-artifact-registry', 'artifact_registry', `gcloud artifacts repositories create "${resourceMap.artifactRegistry.repository}" --repository-format=docker --location="${resourceMap.artifactRegistry.location}" --project="${config.projectId}" --description="ReeditPro staging worker images"`, ['GCP_PROJECT_ID', 'GCP_ARTIFACT_REGION', 'REEDITPRO_ARTIFACT_REPOSITORY', 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'], true, true),
    commandPlan('create-buckets', 'gcs_buckets', resourceMap.buckets.map((bucket) => `gcloud storage buckets create "gs://${bucket.bucketName}" --project="${config.projectId}" --location="${bucket.location}" --uniform-bucket-level-access --public-access-prevention`).join('\n'), ['GCP_PROJECT_ID', 'GCP_BUCKET_LOCATION', 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'], true, true),
    commandPlan('create-service-accounts', 'service_accounts', resourceMap.serviceAccounts.map((account) => `gcloud iam service-accounts create "${account.accountId}" --project="${config.projectId}" --display-name="${account.displayName}"`).join('\n'), ['GCP_PROJECT_ID', 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'], true, true),
    commandPlan('create-secret-placeholders', 'secret_placeholders', resourceMap.secretPlaceholders.map((secret) => `gcloud secrets create "reeditpro-staging-${secret.name.toLowerCase().replaceAll('_', '-')}" --project="${config.projectId}" --replication-policy=automatic`).join('\n'), ['GCP_PROJECT_ID', 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'], true, true),
    commandPlan('configure-iam', 'iam', [
      'Review the generated IAM plan, then apply only the listed least-privilege bindings with project, bucket, and secret scopes.',
      'No owner/editor, no public principals, and no project-wide storage admin are allowed.',
    ].join('\n'), ['GCP_PROJECT_ID', 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP=true'], true, true),
    commandPlan('print-image-names', 'image_names', [
      buildArtifactImageName(config, 'reeditpro-api'),
      buildArtifactImageName(config, 'reeditpro-tool-readiness-worker'),
      buildArtifactImageName(config, 'reeditpro-cpu-worker'),
      buildArtifactImageName(config, 'reeditpro-qa-worker'),
      buildArtifactImageName(config, 'reeditpro-render-worker'),
      buildArtifactImageName(config, 'reeditpro-gpu-worker'),
    ].join('\n'), ['GCP_PROJECT_ID', 'GCP_ARTIFACT_REGION', 'REEDITPRO_ARTIFACT_REPOSITORY', 'REEDITPRO_IMAGE_TAG'], false, true),
    commandPlan('later-runtime-rollout', 'later_runtime', 'No Phase 22 runtime rollout command is emitted. Phase 24 and Phase 27 own those later human-run steps.', [], false, false, [
      'Runtime rollout is intentionally omitted from Phase 22.',
    ]),
  ]

  const policyCheck = validateGcpStagingCommandPlan(plans)
  if (!policyCheck.allowed) {
    throw new Error(`Unsafe GCP staging command plan: ${policyCheck.blockers.join('; ')}`)
  }

  return plans
}

function commandPlan(
  commandId: string,
  phase: GcpStagingCommandPhase,
  commandString: string,
  requiredEnvVars: string[],
  requiresConfirmation: boolean,
  safeToRunManually: boolean,
  warnings: string[] = [],
): GcpStagingCommandPlan {
  return {
    commandId,
    phase,
    commandString,
    requiredEnvVars,
    requiresConfirmation,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_STAGING_GCP_SETUP',
    safeToRunManually,
    doesNotDo: [...gcpStagingDoesNotDo],
    warnings,
  }
}
