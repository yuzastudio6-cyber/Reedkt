import type { GcsBucketPurpose } from './gcs-storage-contracts'
import type { ProviderRoute } from './provider-gateway-contracts'
import type { CloudWorkerType } from './worker-job-contracts'

export type ReeditProRuntimeEnvironment = 'production'
export type ReeditProRuntimeRegion = 'us-east1' | 'europe-west1'
export type ReeditProCloudTaskQueueName =
  | 'reeditpro-provider-calls'
  | 'reeditpro-worker-dispatch'
  | 'reeditpro-render-dispatch'
  | 'reeditpro-webhooks'
  | 'reeditpro-status-sync'

export type ReeditProPubSubTopicName =
  | 'reeditpro-job-events'
  | 'reeditpro-worker-events'
  | 'reeditpro-provider-events'
  | 'reeditpro-render-events'
  | 'reeditpro-qa-events'
  | 'reeditpro-dead-letter'

export type ReeditProSecretName =
  | 'reeditpro-prod-supabase-url'
  | 'reeditpro-prod-supabase-service-role-key'
  | 'reeditpro-prod-openai-api-key'
  | 'reeditpro-prod-wan-api-key'
  | 'reeditpro-prod-hailuo-api-key'
  | 'reeditpro-prod-veo-vertex-config'
  | 'reeditpro-prod-lyria-api-key'
  | 'reeditpro-prod-mirelo-api-key'
  | 'reeditpro-prod-mmaudio-api-key'
  | 'reeditpro-prod-provider-webhook-signing-secret'
  | 'reeditpro-prod-stripe-webhook-secret'

export type ReeditProServiceAccountKey =
  | 'apiOrchestrator'
  | 'providerGateway'
  | 'signedUrlService'
  | 'mediaAnalysisWorker'
  | 'ffmpegMediaWorker'
  | 'audioSoundSyncWorker'
  | 'browserCaptureWorker'
  | 'imageAssetWorker'
  | 'aiVideoAssetWorker'
  | 'remotionRenderWorker'
  | 'qaWorker'
  | 'exportWorker'

export interface ReeditProRuntimeRegionConfig {
  region: ReeditProRuntimeRegion
  artifactRegistryRepository: string
  cloudTasksQueues: Record<ReeditProCloudTaskQueueName, string>
  buckets: Record<GcsBucketPurpose, string>
}

export interface ReeditProLiveGcpResourceMap {
  projectId: 'reeditpro'
  projectNumber: '390722338345'
  environment: ReeditProRuntimeEnvironment
  defaultRegion: ReeditProRuntimeRegion
  regions: Record<ReeditProRuntimeRegion, ReeditProRuntimeRegionConfig>
  pubSubTopics: Record<ReeditProPubSubTopicName, string>
  secretNames: Record<ReeditProSecretName, ReeditProSecretName>
  serviceAccounts: Record<ReeditProServiceAccountKey, string>
  providerSecretByRoute: Partial<Record<ProviderRoute, ReeditProSecretName>>
  workerServiceAccountByType: Record<CloudWorkerType, ReeditProServiceAccountKey>
}

const cloudTasksQueues: Record<ReeditProCloudTaskQueueName, string> = {
  'reeditpro-provider-calls': 'reeditpro-provider-calls',
  'reeditpro-worker-dispatch': 'reeditpro-worker-dispatch',
  'reeditpro-render-dispatch': 'reeditpro-render-dispatch',
  'reeditpro-webhooks': 'reeditpro-webhooks',
  'reeditpro-status-sync': 'reeditpro-status-sync',
}

export const REEDITPRO_LIVE_GCP_RESOURCE_MAP: ReeditProLiveGcpResourceMap = {
  projectId: 'reeditpro',
  projectNumber: '390722338345',
  environment: 'production',
  defaultRegion: 'us-east1',
  regions: {
    'us-east1': {
      region: 'us-east1',
      artifactRegistryRepository: 'reeditpro-runtime',
      cloudTasksQueues,
      buckets: {
        source_media: 'reeditpro-prod-reeditpro-us-east1-source-media',
        generated_assets: 'reeditpro-prod-reeditpro-us-east1-generated-assets',
        processed_media: 'reeditpro-prod-reeditpro-us-east1-processed-media',
        previews: 'reeditpro-prod-reeditpro-us-east1-previews',
        exports: 'reeditpro-prod-reeditpro-us-east1-exports',
        thumbnails: 'reeditpro-prod-reeditpro-us-east1-thumbnails',
        qa_artifacts: 'reeditpro-prod-reeditpro-us-east1-qa-artifacts',
        worker_temp: 'reeditpro-prod-reeditpro-us-east1-worker-temp',
      },
    },
    'europe-west1': {
      region: 'europe-west1',
      artifactRegistryRepository: 'reeditpro-runtime',
      cloudTasksQueues,
      buckets: {
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
  },
  pubSubTopics: {
    'reeditpro-job-events': 'projects/reeditpro/topics/reeditpro-job-events',
    'reeditpro-worker-events': 'projects/reeditpro/topics/reeditpro-worker-events',
    'reeditpro-provider-events': 'projects/reeditpro/topics/reeditpro-provider-events',
    'reeditpro-render-events': 'projects/reeditpro/topics/reeditpro-render-events',
    'reeditpro-qa-events': 'projects/reeditpro/topics/reeditpro-qa-events',
    'reeditpro-dead-letter': 'projects/reeditpro/topics/reeditpro-dead-letter',
  },
  secretNames: {
    'reeditpro-prod-supabase-url': 'reeditpro-prod-supabase-url',
    'reeditpro-prod-supabase-service-role-key': 'reeditpro-prod-supabase-service-role-key',
    'reeditpro-prod-openai-api-key': 'reeditpro-prod-openai-api-key',
    'reeditpro-prod-wan-api-key': 'reeditpro-prod-wan-api-key',
    'reeditpro-prod-hailuo-api-key': 'reeditpro-prod-hailuo-api-key',
    'reeditpro-prod-veo-vertex-config': 'reeditpro-prod-veo-vertex-config',
    'reeditpro-prod-lyria-api-key': 'reeditpro-prod-lyria-api-key',
    'reeditpro-prod-mirelo-api-key': 'reeditpro-prod-mirelo-api-key',
    'reeditpro-prod-mmaudio-api-key': 'reeditpro-prod-mmaudio-api-key',
    'reeditpro-prod-provider-webhook-signing-secret': 'reeditpro-prod-provider-webhook-signing-secret',
    'reeditpro-prod-stripe-webhook-secret': 'reeditpro-prod-stripe-webhook-secret',
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
  providerSecretByRoute: {
    gpt_image_2: 'reeditpro-prod-openai-api-key',
    wan: 'reeditpro-prod-wan-api-key',
    hailuo: 'reeditpro-prod-hailuo-api-key',
    veo: 'reeditpro-prod-veo-vertex-config',
    mirelo_sfx_v1_5: 'reeditpro-prod-mirelo-api-key',
    mmaudio_v2: 'reeditpro-prod-mmaudio-api-key',
  },
  workerServiceAccountByType: {
    media_analysis_worker: 'mediaAnalysisWorker',
    ffmpeg_media_worker: 'ffmpegMediaWorker',
    audio_soundsync_worker: 'audioSoundSyncWorker',
    browser_capture_worker: 'browserCaptureWorker',
    image_asset_worker: 'imageAssetWorker',
    ai_video_asset_worker: 'aiVideoAssetWorker',
    remotion_render_worker: 'remotionRenderWorker',
    qa_worker: 'qaWorker',
    export_worker: 'exportWorker',
  },
} as const

export function getReeditProRuntimeRegionConfig(
  region: ReeditProRuntimeRegion = REEDITPRO_LIVE_GCP_RESOURCE_MAP.defaultRegion,
): ReeditProRuntimeRegionConfig {
  return REEDITPRO_LIVE_GCP_RESOURCE_MAP.regions[region]
}

export function getReeditProBucketName(
  bucketPurpose: GcsBucketPurpose,
  region: ReeditProRuntimeRegion = REEDITPRO_LIVE_GCP_RESOURCE_MAP.defaultRegion,
): string {
  return getReeditProRuntimeRegionConfig(region).buckets[bucketPurpose]
}

export function getReeditProCloudTasksQueueName(queueName: ReeditProCloudTaskQueueName): string {
  return cloudTasksQueues[queueName]
}

export const LIVE_GCP_RESOURCE_MAP_RULES = [
  'This file stores resource names only, not secret values.',
  'Do not add API keys, signed URLs, service-role values, or provider credentials here.',
  'Frontend code must not import server-only runtime secrets or worker credentials.',
  'Workers execute approved snapshots, not raw chat.',
] as const
