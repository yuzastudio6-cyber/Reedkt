import type { ID, ISODateString, JSONObject, Seconds } from '../../types/shared'
import type { ProductionStorageReference, RenderEngine, RenderMode } from './production-tool-runtime-contracts'

export interface RenderCanvas {
  width: number
  height: number
  aspectRatio: string
  backgroundColor?: string
}

export interface RenderLayer {
  id: ID
  layerType: string
  startFrame: number
  endFrame: number
  zIndex: number
  assetIds: ID[]
  settings: JSONObject
}

export interface RenderCaptionTrack {
  id: ID
  captionArtifactId?: ID
  style: JSONObject
  burnInRequired: boolean
}

export interface RenderAudioPlan {
  sourceArtifactIds: ID[]
  mixSettings: JSONObject
  loudnessTarget?: number
}

export interface RenderColorPlan {
  operations: JSONObject[]
  outputColorSpace?: string
}

export interface RenderExportSettings {
  container: string
  videoCodec: string
  audioCodec: string
  bitrate?: string
  crf?: number
  pixelFormat?: string
}

export interface RenderManifest {
  id: ID
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  approvedSnapshotId: ID
  timelineManifestId: ID
  renderEngine: RenderEngine
  renderMode: RenderMode
  canvas: RenderCanvas
  fps: number
  durationSeconds: Seconds
  layers: RenderLayer[]
  assets: ProductionStorageReference[]
  captions: RenderCaptionTrack[]
  audio: RenderAudioPlan
  color: RenderColorPlan
  exportSettings: RenderExportSettings
  requiredQualityGateIds: ID[]
  status: 'draft' | 'ready' | 'rendering' | 'qa_blocked' | 'completed' | 'failed' | 'cancelled'
  createdAt: ISODateString
  updatedAt: ISODateString
}
