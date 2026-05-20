import type { ID, ISODateString, JSONObject } from '../../../types/shared'
import type { GcsObjectLocation } from '../../cloud/gcs-storage-contracts'
import type {
  RemotionRenderOutputFormat,
  RemotionRenderQualityLevel,
  RemotionRenderType,
  RemotionRenderWorkerRequest,
} from '../../cloud/remotion-render-contracts'
import type { ReeditProRuntimeRegion } from '../../cloud/live-gcp-resource-map'

export type RemotionWorkerMode = 'mock_only' | 'dry_run' | 'real_render_blocked'

export type RemotionWorkerPreflightStatus =
  | 'ready_for_mock'
  | 'blocked_missing_approval'
  | 'blocked_missing_credit_reservation'
  | 'blocked_missing_timeline'
  | 'blocked_missing_assets'
  | 'blocked_timing_validation'
  | 'blocked_qa_fallback'
  | 'blocked_real_render_disabled'

export type RemotionWorkerEventType =
  | 'render_worker_started'
  | 'render_preflight_checked'
  | 'render_manifest_created'
  | 'render_mock_completed'
  | 'render_worker_blocked'

export interface RemotionWorkerAssetDependency {
  id: ID
  role: 'source_media' | 'generated_asset' | 'caption_asset' | 'audio_asset' | 'qa_artifact' | 'placeholder'
  requiredForFinal: boolean
  placeholderAllowed: boolean
  status: 'ready' | 'pending' | 'missing' | 'placeholder_ready'
  storageLocation?: GcsObjectLocation
  notes: string[]
}

export interface RemotionWorkerLayerManifestItem {
  id: ID
  layerType: 'source_video' | 'generated_video' | 'image' | 'caption' | 'graphic' | 'audio' | 'sfx' | 'transition' | 'placeholder'
  startFrame: number
  endFrame: number
  zIndex: number
  assetDependencyIds: ID[]
  renderNotes: string[]
  metadata?: JSONObject
}

export interface RemotionWorkerTimingValidationRef {
  status: 'not_checked' | 'passed' | 'warning' | 'blocking' | 'failed'
  validationId?: ID
  warnings: string[]
  blockers: string[]
}

export interface RemotionWorkerQAFallbackRef {
  status: 'not_checked' | 'passed' | 'warning' | 'blocking' | 'failed'
  qaPlanId?: ID
  fallbackPlanId?: ID
  warnings: string[]
  blockers: string[]
}

export interface RemotionRenderManifest {
  id: ID
  renderJobId: ID
  jobId: ID
  workspaceId: ID
  projectId: ID
  approvedPlanSnapshotId: ID
  editPlanId: ID
  creditReservationId: ID
  runtimeRegion: ReeditProRuntimeRegion
  renderType: RemotionRenderType
  renderQualityLevel: RemotionRenderQualityLevel
  outputFormat: RemotionRenderOutputFormat
  width: number
  height: number
  frameRate: number
  durationSeconds?: number
  durationFrames?: number
  sourceAssetLocations: GcsObjectLocation[]
  generatedAssetLocations: GcsObjectLocation[]
  assetDependencies: RemotionWorkerAssetDependency[]
  layers: RemotionWorkerLayerManifestItem[]
  timingValidation: RemotionWorkerTimingValidationRef
  qaFallback: RemotionWorkerQAFallbackRef
  outputLocation: GcsObjectLocation
  idempotencyKey: string
  mockOnly: true
  createdAt: ISODateString
  metadata?: JSONObject
}

export interface RemotionWorkerPreflightResult {
  ok: boolean
  status: RemotionWorkerPreflightStatus
  errors: string[]
  warnings: string[]
  checkedAt: ISODateString
}

export interface RemotionWorkerEvent {
  eventType: RemotionWorkerEventType
  message: string
  createdAt: ISODateString
  visibleToUser: boolean
  metadata?: JSONObject
}

export interface RemotionWorkerMockResult {
  ok: boolean
  mode: RemotionWorkerMode
  preflight: RemotionWorkerPreflightResult
  manifest?: RemotionRenderManifest
  outputLocation?: GcsObjectLocation
  events: RemotionWorkerEvent[]
  summary: string
}

export interface RemotionWorkerSkeletonOptions {
  mode?: RemotionWorkerMode
  runtimeRegion?: ReeditProRuntimeRegion
}

export type RemotionWorkerRequest = RemotionRenderWorkerRequest

export const REMOTION_WORKER_SKELETON_RULES = [
  'RP-RENDER-01 is mock-only and must not import Remotion packages.',
  'Real render execution is blocked until a future render milestone.',
  'Render workers require approved snapshots and reserved credits.',
  'Preview renders are not final exports.',
  'Final exports require preview, QA, and export approval gates.',
] as const
