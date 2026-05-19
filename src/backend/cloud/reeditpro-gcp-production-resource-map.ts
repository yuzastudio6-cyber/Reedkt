import type { GcsBucketPurpose } from './gcs-storage-contracts'

export type ReeditProRuntimeRegion = 'us-east1' | 'europe-west1'

export type ReeditProRuntimeEnvironment = 'production'

export type ReeditProRegionalBucketMap = Record<GcsBucketPurpose, string>

export interface ReeditProRegionalCloudTasksQueues {
  providerCalls: string
  workerDispatch: string
  renderDispatch: string
  webhooks: string
  statusSync: string
}

export interface ReeditProServiceAccountMap {
  apiOrchestrator: string
  providerGateway: string
  signedUrlService: string
  mediaAnalysisWorker: string
  ffmpegMediaWorker: string
  audioSoundSyncWorker: string
  browserCaptureWorker: string
  imageAssetWorker: string
  aiVideoAssetWorker: string
  remotionRenderWorker: string
  qaWorker: string
  exportWorker: string
}

export interface ReeditProSecretReferenceMap {
  supabaseUrl: string
  supabaseServiceRoleKey: string
  openaiApiKey: string
  wanApiKey: string
  hailuoApiKey: string
  veoVertexConfig: string
  lyriaApiKey: string
  providerWebhookSigningSecret: string
  stripeWebhookSecret: string
}

export interface ReeditProPubSubTopicMap {
  jobEvents: string
  workerEvents: string
  providerEvents: string
  renderEvents: string
  qaEvents: string
  deadLetter: string
}

export interface ReeditProGcpProductionResourceMap {
  environment: ReeditProRuntimeEnvironment
  projectId: string
  primaryRegion: ReeditProRuntimeRegion
  secondaryRegion: ReeditProRuntimeRegion
  regions: ReeditProRuntimeRegion[]
  artifactRepository: string
  bucketsByRegion: Record<ReeditProRuntimeRegion, ReeditProRegionalBucketMap>
  cloudTasksQueuesByRegion: Record<ReeditProRuntimeRegion, ReeditProRegionalCloudTasksQueues>
  pubSubTopics: ReeditProPubSubTopicMap
  secretReferences: ReeditProSecretReferenceMap
  serviceAccounts: ReeditProServiceAccountMap
}

export const REEDITPRO_GCP_RESOURCE_MAP_RULES = [
  'This file stores non-secret Google Cloud resource names only.',
  'Do not add provider API keys, Supabase service-role values, signed URLs, or webhook secrets here.',
  'Workers execute approved snapshots and load secrets from Secret Manager at runtime.',
  'Frontend code must not import server-only runtime secrets or call Google Cloud/provider services directly.',
] as const

export const REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP: ReeditProGcpProductionResourceMap = {
  environment: 'production',
  projectId: 'reeditpro',
  primaryRegion: 'us-east1',
  secondaryRegion: 'europe-west1',
  regions: ['us-east1', 'europe-west1'],
  artifactRepository: 'reeditpro-runtime',
  bucketsByRegion: {
    'us-east1': {
      source_media: 'reeditpro-prod-reeditpro-us-east1-source-media',
      generated_assets: 'reeditpro-prod-reeditpro-us-east1-generated-assets',
      processed_media: 'reeditpro-prod-reeditpro-us-east1-processed-media',
      previews: 'reeditpro-prod-reeditpro-us-east1-previews',
      exports: 'reeditpro-prod-reeditpro-us-east1-exports',
      thumbnails: 'reeditpro-prod-reeditpro-us-east1-thumbnails',
      qa_artifacts: 'reeditpro-prod-reeditpro-us-east1-qa-artifacts',
      worker_temp: 'reeditpro-prod-reeditpro-us-east1-worker-temp',
    },
    'europe-west1': {
      source_media: 'reeditpro-prod-reeditpro-europe-west1-source-media',
      generated_assets: 'reeditpro-prod-reeditpro-europe-west1-generated-assets',
      processed_media: 'reeditpro-prod-reeditpro-europe-west1-processed-media',
      previews: 'reeditpro-prod-reeditpro-europe-west1-previews',
      exports: 'reeditpro-prod-reeditpro-europe-west1-exports',
      thumbnails: 'reeditpro-prod-reeditpro-europe-west1-thumbnails',
      qa_artifacts: 'reeditpro-prod-reeditpro-europe-west1-qa-artifacts',
      worker_temp: 'reeditpro-prod-reeditpro-europe-west1-worker-temp',
    },
  },
  cloudTasksQueuesByRegion: {
    'us-east1': {
      providerCalls: 'reeditpro-provider-calls',
      workerDispatch: 'reeditpro-worker-dispatch',
      renderDispatch: 'reeditpro-render-dispatch',
      webhooks: 'reeditpro-webhooks',
      statusSync: 'reeditpro-status-sync',
    },
    'europe-west1': {
      providerCalls: 'reeditpro-provider-calls',
      workerDispatch: 'reeditpro-worker-dispatch',
      renderDispatch: 'reeditpro-render-dispatch',
      webhooks: 'reeditpro-webhooks',
      statusSync: 'reeditpro-status-sync',
    },
  },
  pubSubTopics: {
    jobEvents: 'projects/reeditpro/topics/reeditpro-job-events',
    workerEvents: 'projects/reeditpro/topics/reeditpro-worker-events',
    providerEvents: 'projects/reeditpro/topics/reeditpro-provider-events',
    renderEvents: 'projects/reeditpro/topics/reeditpro-render-events',
    qaEvents: 'projects/reeditpro/topics/reeditpro-qa-events',
    deadLetter: 'projects/reeditpro/topics/reeditpro-dead-letter',
  },
  secretReferences: {
    supabaseUrl: 'reeditpro-prod-supabase-url',
    supabaseServiceRoleKey: 'reeditpro-prod-supabase-service-role-key',
    openaiApiKey: 'reeditpro-prod-openai-api-key',
    wanApiKey: 'reeditpro-prod-wan-api-key',
    hailuoApiKey: 'reeditpro-prod-hailuo-api-key',
    veoVertexConfig: 'reeditpro-prod-veo-vertex-config',
    lyriaApiKey: 'reeditpro-prod-lyria-api-key',
    providerWebhookSigningSecret: 'reeditpro-prod-provider-webhook-signing-secret',
    stripeWebhookSecret: 'reeditpro-prod-stripe-webhook-secret',
  },
  serviceAccounts: {
    apiOrchestrator: 'sa-api-orchestrator@reeditpro.iam.gserviceaccount.com',
    providerGateway: 'sa-provider-gateway@reeditpro.iam.gserviceaccount.com',
    signedUrlService: 'sa-signed-url-service@reeditpro.iam.gserviceaccount.com',
    mediaAnalysisWorker: 'sa-media-analysis-worker@reeditpro.iam.gserviceaccount.com',
    ffmpegMediaWorker: 'sa-ffmpeg-media-worker@reeditpro.iam.gserviceaccount.com',
    audioSoundSyncWorker: 'sa-audio-soundsync-worker@reeditpro.iam.gserviceaccount.com',
    browserCaptureWorker: 'sa-browser-capture-worker@reeditpro.iam.gserviceaccount.com',
    imageAssetWorker: 'sa-image-asset-worker@reeditpro.iam.gserviceaccount.com',
    aiVideoAssetWorker: 'sa-ai-video-asset-worker@reeditpro.iam.gserviceaccount.com',
    remotionRenderWorker: 'sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com',
    qaWorker: 'sa-qa-worker@reeditpro.iam.gserviceaccount.com',
    exportWorker: 'sa-export-worker@reeditpro.iam.gserviceaccount.com',
  },
}

export const EU_COUNTRY_CODES = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'GB',
  'UK',
  'NO',
  'CH',
  'IS',
] as const

export interface ResolveReeditProRuntimeRegionInput {
  requestedRegion?: string
  countryCode?: string
  timezone?: string
}

export function isReeditProRuntimeRegion(region: string): region is ReeditProRuntimeRegion {
  return REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.regions.includes(region as ReeditProRuntimeRegion)
}

export function resolveReeditProRuntimeRegion(
  input: ResolveReeditProRuntimeRegionInput = {},
): ReeditProRuntimeRegion {
  if (input.requestedRegion && isReeditProRuntimeRegion(input.requestedRegion)) {
    return input.requestedRegion
  }

  const countryCode = input.countryCode?.trim().toUpperCase()
  if (countryCode && EU_COUNTRY_CODES.includes(countryCode as (typeof EU_COUNTRY_CODES)[number])) {
    return 'europe-west1'
  }

  if (input.timezone?.toLowerCase().startsWith('europe/')) {
    return 'europe-west1'
  }

  return REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.primaryRegion
}

export function getReeditProBucketsForRegion(region: ReeditProRuntimeRegion): ReeditProRegionalBucketMap {
  return REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.bucketsByRegion[region]
}

export function getReeditProCloudTasksQueuesForRegion(
  region: ReeditProRuntimeRegion,
): ReeditProRegionalCloudTasksQueues {
  return REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.cloudTasksQueuesByRegion[region]
}

export function getReeditProArtifactRepositoryPath(region: ReeditProRuntimeRegion): string {
  return `${region}-docker.pkg.dev/${REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.projectId}/${REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP.artifactRepository}`
}

export function validateReeditProProductionResourceMap(
  resourceMap: ReeditProGcpProductionResourceMap = REEDITPRO_GCP_PRODUCTION_RESOURCE_MAP,
): { ok: boolean; warnings: string[]; errors: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (resourceMap.projectId !== 'reeditpro') {
    errors.push('Production resource map projectId must remain reeditpro unless a migration plan updates all resources.')
  }

  resourceMap.regions.forEach((region) => {
    if (!resourceMap.bucketsByRegion[region]) {
      errors.push(`Missing bucket map for ${region}.`)
    }

    if (!resourceMap.cloudTasksQueuesByRegion[region]) {
      errors.push(`Missing Cloud Tasks queue map for ${region}.`)
    }
  })

  Object.entries(resourceMap.secretReferences).forEach(([key, secretName]) => {
    if (!secretName.startsWith('reeditpro-prod-')) {
      warnings.push(`Secret reference ${key} does not use the reeditpro-prod- prefix.`)
    }
  })

  Object.entries(resourceMap.serviceAccounts).forEach(([key, email]) => {
    if (!email.endsWith('@reeditpro.iam.gserviceaccount.com')) {
      errors.push(`Service account ${key} must belong to the reeditpro project.`)
    }
  })

  return {
    ok: errors.length === 0,
    warnings,
    errors,
  }
}
