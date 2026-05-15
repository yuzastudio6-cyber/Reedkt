import type { ID, JSONObject } from './shared'
import type { JobType } from './jobs'

export type GoogleCloudRegion = string

export type WorkerRuntimeType =
  | 'frontend_mock'
  | 'backend_api'
  | 'supabase_edge_function'
  | 'cloud_run_service'
  | 'cloud_run_job'
  | 'gpu_worker'
  | 'google_cloud_shell_manual'
  | 'external_ai_provider'
  | 'human'
  | 'unknown'

export type EstimatedComputeClass = 'cpu_light' | 'cpu_standard' | 'gpu_light' | 'gpu_heavy' | 'render_heavy'

export interface GoogleCloudWorkerTarget {
  id: ID
  projectIdPlaceholder: string
  region: GoogleCloudRegion
  serviceName?: string
  jobName?: string
  workerRuntimeType: WorkerRuntimeType
  supportedJobTypes: JobType[]
  gpuRequired: boolean
  estimatedComputeClass: EstimatedComputeClass
  secretReferenceIds: ID[]
  artifactImageReference?: string
}

export interface CloudStorageAssetLocation {
  bucketName: string
  objectPath: string
  generation?: string
  contentType?: string
  signedUrlRequired: boolean
  publicUrlAllowed: boolean
}

export interface PubSubJobMessage {
  messageId?: string
  topicName: string
  jobId: ID
  projectId: ID
  editPlanId?: ID
  jobType: JobType
  idempotencyKey: string
  payload: JSONObject
}

export interface SecretReference {
  id: ID
  secretName: string
  secretVersion: string
  purpose: string
  providerType?: string
  neverExposeToClient: true
}

export interface CloudRunJobReference {
  projectIdPlaceholder: string
  region: GoogleCloudRegion
  jobName: string
  serviceAccountName?: string
  artifactImageReference: string
  envSecretReferenceIds: ID[]
}

export interface WorkerRuntimeConfig {
  workerTargetId: ID
  runtimeType: WorkerRuntimeType
  region: GoogleCloudRegion
  queueOrTopicName: string
  maxAttempts: number
  timeoutSeconds: number
  gpuRequired: boolean
  estimatedComputeClass: EstimatedComputeClass
  environment: 'development' | 'staging' | 'production'
}

export const GOOGLE_CLOUD_CONTRACT_RULE =
  'Google Cloud types store references only. Do not commit credentials, API keys, service account keys, or raw secrets.'
