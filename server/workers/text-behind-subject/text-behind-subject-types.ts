import type { QualityGateResult } from '../../../src/backend/contracts/quality-gate-contracts'
import type { ToolArtifact } from '../../../src/backend/contracts/tool-artifact-contracts'
import type { MaskExecutionMode } from '../masks/mask-execution-types'

export interface TextBehindSubjectExecutionInput {
  mode: MaskExecutionMode
  workspaceId: string
  projectId: string
  mediaAssetId: string
  approvedSnapshotId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  foregroundMaskArtifactId?: string
  maskSequenceArtifactId?: string
  sourceVideoArtifactId?: string
  proxyVideoArtifactId?: string
  textContent: string
  textStylePreset: 'clean_title' | 'bold_social' | 'lower_third' | 'side_panel' | 'minimal_label' | 'custom'
  placementPolicy: 'behind_subject_center' | 'behind_subject_upper' | 'behind_subject_lower' | 'side_panel' | 'lower_third' | 'foreground_safe'
  motionPolicy?: 'static' | 'subtle_follow' | 'frame_locked'
  durationSeconds?: number
  safeZones?: Array<{ x: number; y: number; width: number; height: number; reason: string }>
  outputDirectory?: string
  maskConfidence?: number
  enablePreview?: boolean
  allowFinalRender?: boolean
  rawPrompt?: unknown
  signedUrl?: unknown
}

export interface TextLayerPlan {
  textLayerId: string
  textContent: string
  textStylePreset: TextBehindSubjectExecutionInput['textStylePreset']
  placement: TextBehindSubjectExecutionInput['placementPolicy']
  motionPolicy: NonNullable<TextBehindSubjectExecutionInput['motionPolicy']>
  safeZoneRules: string[]
  behindSubject: true
  fallbackPlacement: 'foreground_safe' | 'side_panel' | 'lower_third'
  expectedRenderLayerMetadata: {
    layerOrder: 'between_background_and_foreground_mask'
    requiresMask: true
    requiresFinalRender: false
    noRevideo: true
  }
  warnings: string[]
}

export interface DepthCompositionManifest {
  id: string
  manifestKind: 'depth_composition_manifest'
  sourceMediaRefs: string[]
  foregroundMaskRefs: string[]
  backgroundLayerRefs: string[]
  textLayerRefs: string[]
  subjectLayerOrdering: Array<'base_video' | 'text_layer' | 'foreground_mask' | 'captions'>
  timing: { durationSeconds?: number }
  safeZones: TextBehindSubjectExecutionInput['safeZones']
  renderEngineHandoff: {
    remotionMetadataOnly: true
    hyperframeMetadataOnly: true
    revideoUsed: false
    finalRenderAllowed: false
  }
  qaGateRefs: Array<Extract<QualityGateResult['gateType'], 'mask_edge_quality' | 'mask_temporal_stability' | 'mask_subject_coverage' | 'render_asset_integrity' | 'caption_safe_zone' | 'caption_readability'>>
}

export interface TextBehindSubjectPreviewCommandPlan {
  command?: string
  args: string[]
  executes: false
  previewOnly: true
  summary: string
}

export interface TextBehindSubjectResult {
  textLayerPlan?: TextLayerPlan
  depthCompositionManifest?: DepthCompositionManifest
  manifestArtifact?: ToolArtifact
  qaResults: QualityGateResult[]
  warnings: string[]
  blocksPreview: boolean
}
