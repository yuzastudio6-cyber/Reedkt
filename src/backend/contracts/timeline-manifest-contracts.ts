import type { ID, ISODateString, JSONObject, Seconds } from '../../types/shared'
import type { ProductionStorageReference, ProductionTimeRange, TimelineFormat } from './production-tool-runtime-contracts'

export interface TimelineClip {
  id: ID
  sourceMediaAssetId: ID
  sourceRange: ProductionTimeRange
  timelineRange: ProductionTimeRange
  trackId: ID
  metadata?: JSONObject
}

export interface TimelineLayer {
  id: ID
  layerType: string
  timelineRange: ProductionTimeRange
  artifactIds: ID[]
  metadata: JSONObject
}

export interface TimelineColorOperation {
  id: ID
  targetClipId?: ID
  operationType: string
  settings: JSONObject
}

export interface TimelineManifest {
  id: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  approvedSnapshotId: ID
  mediaAssetId: ID
  version: string
  timelineFormat: TimelineFormat
  durationSeconds: Seconds
  clips: TimelineClip[]
  audioLayers: TimelineLayer[]
  captionLayers: TimelineLayer[]
  overlayLayers: TimelineLayer[]
  maskLayers: TimelineLayer[]
  colorOperations: TimelineColorOperation[]
  renderNotes: string[]
  sourceReferences: ProductionStorageReference[]
  createdAt: ISODateString
}
