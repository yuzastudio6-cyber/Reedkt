import type { MediaProbeSummary } from '../media/ffprobe'
import type { AudioStreamSummary, FrameSampleArtifact, OptionalAnalysisReadiness } from '../media/media-analysis-contracts'

export const STAGING_TIMELINE_COMPOSITION_CANARY_MODE = 'staging_timeline_composition_canary' as const

export interface TimelineCompositionSafetyFlags {
  stagingOnly: true
  noProductionFlowsRan: true
  noStripePaymentFlowsRan: true
  noExternalProviderGenerationCallsRan: true
  noCustomerMediaUsed: true
  noBroadE2eSuiteRan: true
  noQueueDrainRan: true
  noServiceAccountJsonKeyUsed: true
  signedUrlsStoredAsCanonicalTruth: false
}

export interface TimelineSourceMediaRef {
  bucketName: string
  objectPath: string
  storageObjectId?: string
  mediaAssetId?: string
  mimeType: 'video/mp4'
  sizeBytes: number
  checksumSha256: string
  durationSeconds: number
  width: number
  height: number
  fps: number
}

export interface TimelineSegment {
  segmentId: string
  sourceStorageObjectId?: string
  sourceObjectPath: string
  sourceStartSeconds: number
  sourceEndSeconds: number
  timelineStartSeconds: number
  timelineEndSeconds: number
  startFrame: number
  endFrame: number
  fit: 'cover'
  reason: string
}

export interface TimelineMediaLayer {
  layerId: string
  layerType: 'source_video'
  segmentId: string
  zIndex: number
  objectFit: 'cover'
}

export interface TimelineCaptionPlaceholderLayer {
  layerId: string
  layerType: 'caption_placeholder'
  text: string
  startFrame: number
  endFrame: number
  zIndex: number
  safeZone: 'bottom_caption_safe_zone'
}

export interface TimelineOverlayLayer {
  layerId: string
  layerType: 'safe_zone_overlay' | 'lower_third_placeholder'
  text?: string
  startFrame: number
  endFrame: number
  zIndex: number
  safeZone: 'lower_third'
}

export interface TimelineTimingMap {
  fps: 15
  durationSeconds: 3
  totalFrames: 45
  ranges: Array<{
    rangeId: string
    startFrame: number
    endFrame: number
    purpose: 'source_segment' | 'caption_placeholder' | 'safe_zone_overlay'
  }>
}

export interface TimelineQaExpectations {
  sourceVideoVisible: true
  captionPlaceholderVisible: true
  safeZoneOverlayVisible: true
  outputStatus: 'preview_ready'
  canonicalStorageOnly: true
}

export interface TimelineCompositionSpec {
  mode: typeof STAGING_TIMELINE_COMPOSITION_CANARY_MODE
  smokeRunId: string
  durationSeconds: 3
  width: 160
  height: 90
  fps: 15
  totalFrames: 45
  source: TimelineSourceMediaRef
  segments: [TimelineSegment]
  layers: [TimelineMediaLayer, TimelineCaptionPlaceholderLayer, TimelineOverlayLayer]
  timingMap: TimelineTimingMap
  qaExpectations: TimelineQaExpectations
  safety: TimelineCompositionSafetyFlags
}

export interface TimelineAnalysisSummary {
  probe: MediaProbeSummary
  thumbnail: FrameSampleArtifact
  audio: AudioStreamSummary
  optionalReadiness: OptionalAnalysisReadiness[]
}

export interface TimelineCompositionCanaryRequest {
  canary: true
  mode: typeof STAGING_TIMELINE_COMPOSITION_CANARY_MODE
  smokeRunId: string
  stagingOnly: true
  allowCloudRun: true
  allowRemotion: true
  allowProviders: false
  allowStripe: false
  allowPaymentFlows: false
  allowQueueDrain: false
  allowUserMedia: false
  allowProduction: false
  cleanup: true
  maxWaitSeconds: number
  source: TimelineSourceMediaRef
  preview: {
    bucketName: string
    objectPath: string
    mimeType: 'video/mp4'
  }
  analysis: TimelineAnalysisSummary
  timeline: TimelineCompositionSpec
  render: {
    maxDurationSeconds: 3
    width: 160
    height: 90
    fps: 15
    maxFrames: 45
  }
}

export interface TimelineCompositionCanaryResult {
  ok: boolean
  status: 'passed' | 'failed' | 'skipped'
  smokeRunId?: string
  sourceArtifact?: {
    bucketName: string
    objectPath: string
    sizeBytes: number
    checksumSha256: string
  }
  mediaProbe?: MediaProbeSummary
  thumbnailArtifact?: FrameSampleArtifact
  timeline?: TimelineCompositionSpec
  previewArtifact?: {
    bucketName: string
    objectPath: string
  }
  optionalReadiness: OptionalAnalysisReadiness[]
  cleanup?: {
    attempted: boolean
    deleted: Array<{ table: string; id: string }>
    errors: string[]
    warnings?: string[]
  }
  gcsCleanup: {
    attempted: boolean
    deleted: Array<{ bucketName: string; objectPath: string }>
    errors: string[]
    warnings?: string[]
  }
  leftoverRecords?: Array<Record<string, unknown>>
  leftoverQueryErrors?: string[]
  strictValidation: {
    ok: boolean
    blockers: string[]
    renderExecutionMode?: string
    finalRenderStatus?: string
    outputArtifactSummary?: Record<string, unknown>
    jobStatusTransitionsObserved: unknown[]
    cleanupDeletedCount: number
    gcsCleanupDeletedCount: number
    noProductionFlowsRan: true
    noStripePaymentFlowsRan: true
    noExternalProviderGenerationCallsRan: true
    noBroadE2eSuiteRan: true
    noCustomerMediaUsed: true
    noQueueDrainRan: true
  }
  warnings: string[]
  error?: {
    code: string
    message: string
  }
}

export function createTimelineCompositionSafetyFlags(): TimelineCompositionSafetyFlags {
  return {
    stagingOnly: true,
    noProductionFlowsRan: true,
    noStripePaymentFlowsRan: true,
    noExternalProviderGenerationCallsRan: true,
    noCustomerMediaUsed: true,
    noBroadE2eSuiteRan: true,
    noQueueDrainRan: true,
    noServiceAccountJsonKeyUsed: true,
    signedUrlsStoredAsCanonicalTruth: false,
  }
}

export function buildFixedTimelineCompositionSpec(input: {
  smokeRunId: string
  source: TimelineSourceMediaRef
}): TimelineCompositionSpec {
  return {
    mode: STAGING_TIMELINE_COMPOSITION_CANARY_MODE,
    smokeRunId: input.smokeRunId,
    durationSeconds: 3,
    width: 160,
    height: 90,
    fps: 15,
    totalFrames: 45,
    source: input.source,
    segments: [{
      segmentId: 'rp-edit-01-segment-1',
      sourceStorageObjectId: input.source.storageObjectId,
      sourceObjectPath: input.source.objectPath,
      sourceStartSeconds: 0,
      sourceEndSeconds: 3,
      timelineStartSeconds: 0,
      timelineEndSeconds: 3,
      startFrame: 0,
      endFrame: 44,
      fit: 'cover',
      reason: 'RP-EDIT-01 keeps the full tiny staging fixture as one deterministic source segment.',
    }],
    layers: [
      {
        layerId: 'rp-edit-01-source-video-layer',
        layerType: 'source_video',
        segmentId: 'rp-edit-01-segment-1',
        zIndex: 1,
        objectFit: 'cover',
      },
      {
        layerId: 'rp-edit-01-caption-placeholder-layer',
        layerType: 'caption_placeholder',
        text: 'RP-EDIT-01 smoke caption',
        startFrame: 0,
        endFrame: 44,
        zIndex: 3,
        safeZone: 'bottom_caption_safe_zone',
      },
      {
        layerId: 'rp-edit-01-safe-zone-overlay-layer',
        layerType: 'lower_third_placeholder',
        text: 'Timeline canary',
        startFrame: 0,
        endFrame: 44,
        zIndex: 2,
        safeZone: 'lower_third',
      },
    ],
    timingMap: {
      fps: 15,
      durationSeconds: 3,
      totalFrames: 45,
      ranges: [
        { rangeId: 'source-full-range', startFrame: 0, endFrame: 44, purpose: 'source_segment' },
        { rangeId: 'caption-placeholder-range', startFrame: 0, endFrame: 44, purpose: 'caption_placeholder' },
        { rangeId: 'safe-zone-overlay-range', startFrame: 0, endFrame: 44, purpose: 'safe_zone_overlay' },
      ],
    },
    qaExpectations: {
      sourceVideoVisible: true,
      captionPlaceholderVisible: true,
      safeZoneOverlayVisible: true,
      outputStatus: 'preview_ready',
      canonicalStorageOnly: true,
    },
    safety: createTimelineCompositionSafetyFlags(),
  }
}
