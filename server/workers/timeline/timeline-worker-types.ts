import type { JSONObject } from '../../../src/types/shared'
import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { TimelineManifest } from '../../../src/backend/contracts/timeline-manifest-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { ProductionWorkerJobPayload } from '../production/production-worker-types'
import type { SmartCutPlan } from '../smart-cut'

export type TimelineFoundationRunMode = 'dry_run' | 'local_dev' | 'production_blocked'

export interface TimelineBuildInput {
  mode: TimelineFoundationRunMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  editPlanId: string
  approvedSnapshotId: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  workerPayload?: ProductionWorkerJobPayload
  smartCutPlan: SmartCutPlan
  sourceStorageObjectPath?: string
  sourceStorageObjectId?: string
  transcriptArtifactId?: string
  wordTimestampArtifactId?: string
  captionArtifactIds?: string[]
  outputRoot?: string
  fps?: number
  canvas?: {
    width: number
    height: number
  }
}

export interface OpenTimelineIOStyleManifest {
  OTIO_SCHEMA: 'Timeline.1'
  name: string
  tracks: Array<{
    kind: 'Video' | 'Audio'
    children: Array<{
      OTIO_SCHEMA: 'Clip.2'
      name: string
      source_range: {
        start_time: { value: number; rate: number }
        duration: { value: number; rate: number }
      }
      media_reference: {
        OTIO_SCHEMA: 'ExternalReference.1'
        target_url: string
      }
      metadata: JSONObject
    }>
  }>
  metadata: JSONObject
}

export interface HyperframeTimelineBridge {
  bridgeType: 'hyperframe_timeline_bridge'
  timelineId: string
  clips: Array<{
    clipId: string
    label: string
    sourceRangeSeconds: [number, number]
    timelineRangeSeconds: [number, number]
    reviewNotes: string[]
  }>
  editDecisions: JSONObject[]
  reviewNotes: string[]
}

export interface RemotionCompositionManifest {
  manifestType: 'remotion_composition_manifest'
  compositionId: string
  durationInFrames: number
  fps: number
  canvas: {
    width: number
    height: number
  }
  clips: JSONObject[]
  captionArtifactIds: string[]
  renderNotes: string[]
}

export interface TimelineBuildResult {
  mode: TimelineFoundationRunMode
  status: 'dry_run' | 'partial' | 'blocked' | 'failed'
  timelineManifest?: TimelineManifest
  opentimelineioManifest?: OpenTimelineIOStyleManifest
  hyperframeBridge?: HyperframeTimelineBridge
  remotionManifest?: RemotionCompositionManifest
  artifacts: ToolArtifact[]
  qualityGateResults: QualityGateResult[]
  warnings: string[]
  skipReasons: string[]
}
