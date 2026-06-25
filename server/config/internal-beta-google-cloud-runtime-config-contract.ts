import {
  GCP_PRODUCTION_API_SERVICE,
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
} from './gcp-production-config'
import {
  REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP,
  getReeditProArtifactRepositoryPath,
  getReeditProBucketsForRegion,
  getReeditProCloudTasksQueuesForRegion,
  type ReeditProRuntimeRegion,
} from '../../src/backend/cloud/reeditpro-gcp-production-resource-map'
import type { CloudValidationResult } from '../../src/backend/cloud/cloud-runtime-contracts'

export type InternalBetaGoogleCloudRuntimeConfigDecision =
  'completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution'

export type InternalBetaGoogleCloudRuntimeConfigExecution =
  'completed_server_config_contract_no_cloud_or_supabase_execution'

export type InternalBetaGoogleCloudRuntimeConfigReadiness =
  'ready_for_supabase_target_rls_storage_validation'

export type InternalBetaGoogleCloudRuntimeClass = 'google_cloud_managed_internal_beta'

export type InternalBetaRuntimeDisabledReason =
  | 'supabase_target_not_validated'
  | 'service_role_routes_not_implemented'
  | 'credit_ledger_not_implemented'
  | 'job_queue_not_implemented'
  | 'worker_dispatch_not_implemented'
  | 'private_artifact_access_not_implemented'
  | 'render_worker_not_enabled'
  | 'provider_model_calls_not_approved'
  | 'deployment_not_approved'

export interface InternalBetaGoogleCloudRuntimeConfigContract {
  packet: 'RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1'
  decision: InternalBetaGoogleCloudRuntimeConfigDecision
  execution: InternalBetaGoogleCloudRuntimeConfigExecution
  sourceMerge: '643589bb30fb43a91312b292cd751b31b1dea6e0'
  priorPacket: 'RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1'
  approvedRuntimeTarget: 'google_cloud_managed_runtime_target'
  environmentClass: InternalBetaGoogleCloudRuntimeClass
  readiness: InternalBetaGoogleCloudRuntimeConfigReadiness
  internalBetaEndToEndStatus: 'not_ready_pending_supabase_rls_storage_and_runtime_implementation'
  runtimeEnabled: false
  runtimeExecutionAllowed: false
  deploymentApproved: false
  productReadyEndToEndLocalOssTools: 0
  environment: {
    projectId: 'reeditpro'
    primaryRuntimeRegion: 'us-east1'
    secondaryRuntimeRegion: 'europe-west1'
    allowedRuntimeRegions: ReeditProRuntimeRegion[]
    stagingActivationRegion: 'us-central1'
    stagingEnvironment: 'staging'
  }
  cloudRun: {
    apiServices: string[]
    workerJobs: string[]
    stagingValidationService: string
  }
  artifactRegistry: {
    repositoriesByRegion: Record<ReeditProRuntimeRegion, string>
  }
  storage: {
    bucketsByRegion: Record<ReeditProRuntimeRegion, ReturnType<typeof getReeditProBucketsForRegion>>
    stagingBuckets: {
      generatedAssets: string
      qaArtifacts: string
    }
  }
  cloudTasks: {
    queuesByRegion: Record<ReeditProRuntimeRegion, ReturnType<typeof getReeditProCloudTasksQueuesForRegion>>
  }
  pubSubTopics: typeof REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.pubSubTopics
  serviceAccounts: typeof REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.serviceAccounts & {
    stagingCpuWorker: string
  }
  secretReferences: typeof REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.secretReferences & {
    logicalSupabaseUrl: 'SUPABASE_URL'
    logicalSupabaseServiceRoleKey: 'SUPABASE_SERVICE_ROLE_KEY'
    logicalProviderGatewaySharedSecret: 'PROVIDER_GATEWAY_SHARED_SECRET'
    logicalWorkerWebhookSecret: 'WORKER_WEBHOOK_SECRET'
  }
  supabase: {
    targetProject: 'source_reference_names_recorded_no_remote_target_selected'
    serviceRoleRuntime: 'blocked_pending_supabase_target_rls_storage_validation'
    remoteMutationAllowed: false
    sqlExecutionAllowed: false
    migrationDeploymentAllowed: false
  }
  safety: {
    googleCloudApiCallAllowed: false
    cloudRunServiceCreationAllowed: false
    cloudRunJobCreationAllowed: false
    cloudRunDeploymentAllowed: false
    iamMutationAllowed: false
    secretManagerPayloadAccessAllowed: false
    gcsBucketCreationAllowed: false
    gcsObjectAccessAllowed: false
    signedUrlCreationAllowed: false
    publicArtifactCreationAllowed: false
    providerModelCallAllowed: false
    workerDispatchAllowed: false
    workerExecutionAllowed: false
    remotionExecutionAllowed: false
    ffmpegExecutionAllowed: false
    ffprobeExecutionAllowed: false
    mediaProcessingAllowed: false
    creditMutationAllowed: false
    jobEnqueueAllowed: false
    internalBetaUnlockAllowed: false
    externalBetaUnlockAllowed: false
    productionUnlockAllowed: false
  }
  disabledReasons: InternalBetaRuntimeDisabledReason[]
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1'
}

export const INTERNAL_BETA_GOOGLE_CLOUD_RUNTIME_CONFIG_CONTRACT_RULES = [
  'This contract stores non-secret Google Cloud and Supabase reference names only.',
  'This contract must not import Google Cloud SDKs, Supabase clients, provider SDKs, or payment SDKs.',
  'This contract must not read Secret Manager payloads, environment secret values, service-role keys, or signed URLs.',
  'Runtime execution remains disabled until Supabase target/RLS/storage, service-role routes, credits, jobs, workers, artifacts, render, QA, observability, cleanup, and rollback gates pass.',
] as const

const resourceMap = REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP

const stagingPrivateSearxngReferences = {
  serviceName: 'reeditpro-staging-private-searxng',
  serviceAccountEmail: 'reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
  generatedAssetsBucket: 'reeditpro-staging-reeditpro-generated-assets',
  qaBucket: 'reeditpro-staging-reeditpro-qa-artifacts',
} as const

export const INTERNAL_BETA_GOOGLE_CLOUD_RUNTIME_CONFIG_CONTRACT: InternalBetaGoogleCloudRuntimeConfigContract = {
  packet: 'RP-INTERNAL-BETA-GOOGLE-CLOUD-RUNTIME-CONFIG-CONTRACT-1',
  decision: 'completed_backend_only_google_cloud_runtime_config_contract_no_runtime_execution',
  execution: 'completed_server_config_contract_no_cloud_or_supabase_execution',
  sourceMerge: '643589bb30fb43a91312b292cd751b31b1dea6e0',
  priorPacket: 'RP-INTERNAL-BETA-GOOGLE-CLOUD-ENVIRONMENT-OWNER-INPUT-1',
  approvedRuntimeTarget: 'google_cloud_managed_runtime_target',
  environmentClass: 'google_cloud_managed_internal_beta',
  readiness: 'ready_for_supabase_target_rls_storage_validation',
  internalBetaEndToEndStatus: 'not_ready_pending_supabase_rls_storage_and_runtime_implementation',
  runtimeEnabled: false,
  runtimeExecutionAllowed: false,
  deploymentApproved: false,
  productReadyEndToEndLocalOssTools: 0,
  environment: {
    projectId: 'reeditpro',
    primaryRuntimeRegion: 'us-east1',
    secondaryRuntimeRegion: 'europe-west1',
    allowedRuntimeRegions: resourceMap.regions,
    stagingActivationRegion: 'us-central1',
    stagingEnvironment: 'staging',
  },
  cloudRun: {
    apiServices: [
      GCP_PRODUCTION_API_SERVICE.name,
      'api-orchestrator-service',
      'provider-gateway-service',
      'signed-url-service',
      stagingPrivateSearxngReferences.serviceName,
    ],
    workerJobs: [
      ...GCP_PRODUCTION_CLOUD_RUN_JOBS.map((job) => job.name),
      'media-analysis-worker-job',
      'ffmpeg-media-worker-job',
      'audio-soundsync-worker-job',
      'browser-capture-worker-job',
      'image-asset-worker-job',
      'ai-video-asset-worker-job',
      'remotion-render-worker-job',
      'qa-worker-job',
      'export-worker-job',
    ],
    stagingValidationService: stagingPrivateSearxngReferences.serviceName,
  },
  artifactRegistry: {
    repositoriesByRegion: {
      'us-east1': getReeditProArtifactRepositoryPath('us-east1'),
      'europe-west1': getReeditProArtifactRepositoryPath('europe-west1'),
    },
  },
  storage: {
    bucketsByRegion: {
      'us-east1': getReeditProBucketsForRegion('us-east1'),
      'europe-west1': getReeditProBucketsForRegion('europe-west1'),
    },
    stagingBuckets: {
      generatedAssets: stagingPrivateSearxngReferences.generatedAssetsBucket,
      qaArtifacts: stagingPrivateSearxngReferences.qaBucket,
    },
  },
  cloudTasks: {
    queuesByRegion: {
      'us-east1': getReeditProCloudTasksQueuesForRegion('us-east1'),
      'europe-west1': getReeditProCloudTasksQueuesForRegion('europe-west1'),
    },
  },
  pubSubTopics: resourceMap.pubSubTopics,
  serviceAccounts: {
    ...resourceMap.serviceAccounts,
    stagingCpuWorker: stagingPrivateSearxngReferences.serviceAccountEmail,
  },
  secretReferences: {
    ...resourceMap.secretReferences,
    logicalSupabaseUrl: 'SUPABASE_URL',
    logicalSupabaseServiceRoleKey: 'SUPABASE_SERVICE_ROLE_KEY',
    logicalProviderGatewaySharedSecret: 'PROVIDER_GATEWAY_SHARED_SECRET',
    logicalWorkerWebhookSecret: 'WORKER_WEBHOOK_SECRET',
  },
  supabase: {
    targetProject: 'source_reference_names_recorded_no_remote_target_selected',
    serviceRoleRuntime: 'blocked_pending_supabase_target_rls_storage_validation',
    remoteMutationAllowed: false,
    sqlExecutionAllowed: false,
    migrationDeploymentAllowed: false,
  },
  safety: {
    googleCloudApiCallAllowed: false,
    cloudRunServiceCreationAllowed: false,
    cloudRunJobCreationAllowed: false,
    cloudRunDeploymentAllowed: false,
    iamMutationAllowed: false,
    secretManagerPayloadAccessAllowed: false,
    gcsBucketCreationAllowed: false,
    gcsObjectAccessAllowed: false,
    signedUrlCreationAllowed: false,
    publicArtifactCreationAllowed: false,
    providerModelCallAllowed: false,
    workerDispatchAllowed: false,
    workerExecutionAllowed: false,
    remotionExecutionAllowed: false,
    ffmpegExecutionAllowed: false,
    ffprobeExecutionAllowed: false,
    mediaProcessingAllowed: false,
    creditMutationAllowed: false,
    jobEnqueueAllowed: false,
    internalBetaUnlockAllowed: false,
    externalBetaUnlockAllowed: false,
    productionUnlockAllowed: false,
  },
  disabledReasons: [
    'supabase_target_not_validated',
    'service_role_routes_not_implemented',
    'credit_ledger_not_implemented',
    'job_queue_not_implemented',
    'worker_dispatch_not_implemented',
    'private_artifact_access_not_implemented',
    'render_worker_not_enabled',
    'provider_model_calls_not_approved',
    'deployment_not_approved',
  ],
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1',
}

export function getInternalBetaGoogleCloudRuntimeConfigContract(): InternalBetaGoogleCloudRuntimeConfigContract {
  return INTERNAL_BETA_GOOGLE_CLOUD_RUNTIME_CONFIG_CONTRACT
}

export function validateInternalBetaGoogleCloudRuntimeConfigContract(
  contract: InternalBetaGoogleCloudRuntimeConfigContract = INTERNAL_BETA_GOOGLE_CLOUD_RUNTIME_CONFIG_CONTRACT,
): CloudValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (contract.environment.projectId !== 'reeditpro') errors.push('Google Cloud project must remain reeditpro.')
  if (contract.environment.primaryRuntimeRegion !== 'us-east1') errors.push('Primary runtime region must remain us-east1.')
  if (contract.environment.secondaryRuntimeRegion !== 'europe-west1') errors.push('Secondary runtime region must remain europe-west1.')
  if (contract.environment.stagingActivationRegion !== 'us-central1') errors.push('Staging activation region must remain us-central1.')
  if (contract.runtimeEnabled) errors.push('Runtime must remain disabled by this contract.')
  if (contract.runtimeExecutionAllowed) errors.push('Runtime execution must remain false by this contract.')
  if (contract.deploymentApproved) errors.push('Deployment must remain unapproved by this contract.')
  if (contract.productReadyEndToEndLocalOssTools !== 0) errors.push('Product-ready end-to-end local OSS tools must remain 0.')
  if (contract.supabase.targetProject !== 'source_reference_names_recorded_no_remote_target_selected') {
    errors.push('Supabase target must remain unresolved until the Supabase validation packet.')
  }
  if (contract.supabase.remoteMutationAllowed) errors.push('Supabase remote mutation must remain blocked.')
  if (contract.supabase.sqlExecutionAllowed) errors.push('SQL execution must remain blocked.')
  if (contract.supabase.migrationDeploymentAllowed) errors.push('Migration deployment must remain blocked.')

  Object.entries(contract.safety).forEach(([key, value]) => {
    if (value !== false) errors.push(`Safety gate ${key} must remain false.`)
  })

  if (!contract.cloudRun.apiServices.includes('reeditpro-api')) errors.push('Missing reeditpro-api service name.')
  if (!contract.cloudRun.workerJobs.includes('reeditpro-render-worker')) errors.push('Missing reeditpro-render-worker job name.')
  if (!contract.serviceAccounts.remotionRenderWorker.endsWith('@reeditpro.iam.gserviceaccount.com')) {
    errors.push('Remotion render worker service account must belong to reeditpro.')
  }
  if (!contract.secretReferences.supabaseServiceRoleKey.startsWith('reeditpro-prod-')) {
    errors.push('Supabase service-role secret reference must use the reeditpro-prod prefix.')
  }

  Object.entries(contract.secretReferences).forEach(([key, referenceName]) => {
    const looksLikeReference = referenceName.startsWith('reeditpro-prod-') ||
      referenceName === 'SUPABASE_URL' ||
      referenceName === 'SUPABASE_SERVICE_ROLE_KEY' ||
      referenceName === 'PROVIDER_GATEWAY_SHARED_SECRET' ||
      referenceName === 'WORKER_WEBHOOK_SECRET'
    if (!looksLikeReference) errors.push(`Secret reference ${key} must be a reference name, not a payload.`)
  })

  return {
    ok: errors.length === 0,
    warnings,
    errors,
  }
}
