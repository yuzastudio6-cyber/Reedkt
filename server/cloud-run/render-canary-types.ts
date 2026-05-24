import type { JSONObject } from '../../src/types'

export const RENDER_CANARY_MODE = 'staging_cloud_run_remotion_canary' as const
export const RENDER_CANARY_FIXTURE = 'tiny-muted-3s' as const
export const REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE = 'staging_real_video_upload_preview_canary' as const
export const REAL_VIDEO_UPLOAD_PREVIEW_CANARY_FIXTURE = 'tiny-upload-source-3s' as const
export const TIMELINE_COMPOSITION_CANARY_MODE = 'staging_timeline_composition_canary' as const

export type RenderCanaryConfigMode =
  | typeof RENDER_CANARY_MODE
  | typeof REAL_VIDEO_UPLOAD_PREVIEW_CANARY_MODE
  | typeof TIMELINE_COMPOSITION_CANARY_MODE

export type RenderCanaryGuardCode =
  | 'missing_staging_render_infrastructure_canary_path'
  | 'missing_gcp_oidc_auth'
  | 'missing_cloud_run_audience'
  | 'invalid_cloud_run_url'
  | 'production_like_cloud_run_url'
  | 'cloud_run_invocation_disabled'
  | 'remotion_invocation_disabled'
  | 'unsafe_timeout'
  | 'cleanup_required'
  | 'providers_must_be_disabled'
  | 'stripe_must_be_disabled'

export interface RenderCanaryLimits {
  maxWaitSeconds: number
  durationSeconds: number
  width: number
  height: number
  fps: number
  maxRetries: number
  concurrency: number
  timeoutSeconds: number
  memory: string
  cpu: number
  nodeOptions?: string
}

export interface RenderCanaryConfig {
  mode: RenderCanaryConfigMode
  cloudRunUrl?: string
  cloudRunAudience?: string
  remotionUrl?: string
  remotionAudience?: string
  idToken?: string
  outputBucketOrPrefix?: string
  gcpProjectId?: string
  gcpRegion?: string
  workloadIdentityProvider?: string
  serviceAccount?: string
  expectedHostSuffix: string
  durationSeconds: number
  width: number
  height: number
  fps: number
  maxRetries: number
  concurrency: number
  timeoutSeconds: number
  memory: string
  cpu: number
  nodeOptions?: string
}

export interface RenderCanaryConfigValidationIssue {
  code: RenderCanaryGuardCode
  message: string
}

export interface RenderCanaryInvocationConfig {
  cloudRunUrl: string
  audience: string
  idToken: string
  durationSeconds: number
  width: number
  height: number
  fps: number
  timeoutSeconds: number
}

export interface RenderCanaryInvocationResult {
  outputBucketName: string
  outputObjectPath: string
  durationSeconds: number
  width: number
  height: number
  fps: number
  frameCount: number
  sizeBytes: number
  checksumSha256: string
  commandSummary: JSONObject
  outputArtifactSummary: JSONObject
}

export interface RealVideoUploadPreviewCanaryInvocationConfig extends RenderCanaryInvocationConfig {
  source: {
    bucketName: string
    objectPath: string
    sizeBytes: number
    checksumSha256: string
  }
  preview: {
    bucketName: string
    objectPath: string
  }
}

export interface TimelineCompositionCanaryInvocationConfig extends RealVideoUploadPreviewCanaryInvocationConfig {
  analysis: JSONObject
  timeline: JSONObject
}
