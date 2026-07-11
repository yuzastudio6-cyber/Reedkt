import type { ProductionToolId } from '../../tool-registry/production-tool-types'

export const OFFLINE_NODE_RUNNER_PROTOCOL = 'offline-node-runner-v1' as const

export type OfflineNodeRunnerToolId = Extract<
  ProductionToolId,
  'd3' | 'echarts' | 'vega_lite' | 'vega' | 'satori' | 'sharp' | 'svg_js' | 'viz_js' |
  'animejs'
  | 'three_js'
>

export interface OfflineNodeRunnerInvocationBase {
  protocol: typeof OFFLINE_NODE_RUNNER_PROTOCOL
  source: 'server_resolved_in_memory'
}

export interface OfflineStructuredChartDatum {
  label: string
  value: number
}

export interface OfflineStructuredChartInput extends OfflineNodeRunnerInvocationBase {
  width: number
  height: number
  title: string
  xAxisLabel: string
  yAxisLabel: string
  theme: 'light' | 'dark'
  data: OfflineStructuredChartDatum[]
}

export interface OfflineSatoriCardInput extends OfflineNodeRunnerInvocationBase {
  width: number
  height: number
  theme: 'light' | 'dark'
  eyebrow: string
  title: string
  body: string
  callout: string
  font: {
    family: 'ReeditProSans'
    sha256: string
    bytes: Uint8Array
  }
}

export interface OfflineSvgCardInput extends OfflineNodeRunnerInvocationBase {
  width: number
  height: number
  theme: 'light' | 'dark'
  eyebrow: string
  title: string
  body: string
  callout: string
}

export interface OfflineAnimeMotionInput extends OfflineNodeRunnerInvocationBase {
  width: number
  height: number
  fps: 12 | 24 | 25 | 30 | 50 | 60
  durationFrames: number
  motionProfileId: 'approved_card_reveal_v1'
  backgroundMode: 'opaque_panel' | 'transparent_overlay'
  title: string
}

export interface OfflineThreeSceneInput extends OfflineNodeRunnerInvocationBase {
  width: number
  height: number
  fps: 12 | 24 | 25 | 30 | 50 | 60
  durationFrames: number
  sceneProfileId: 'approved_product_cube_v1'
  cameraProfileId: 'approved_perspective_v1'
  lightingProfileId: 'approved_studio_v1'
  title: string
}

export interface OfflineVizGraphNode {
  id: string
  label: string
}

export interface OfflineVizGraphEdge {
  from: string
  to: string
  label?: string
}

export interface OfflineVizGraphInput extends OfflineNodeRunnerInvocationBase {
  direction: 'left_to_right' | 'top_to_bottom'
  theme: 'light' | 'dark'
  title: string
  nodes: OfflineVizGraphNode[]
  edges: OfflineVizGraphEdge[]
}

export interface OfflineSharpImageInput extends OfflineNodeRunnerInvocationBase {
  imageRecipeId: 'approved_thumbnail_v1' | 'approved_panel_asset_v1' | 'approved_overlay_asset_v1'
  outputFormat: 'png' | 'jpeg' | 'webp'
  outputWidth: number
  outputHeight: number
  preserveMetadata: false
  allowUpscale: false
  sourceMimeType: 'image/svg+xml'
  sourceByteLength: number
  sourceSha256: string
  sourceBytes: Uint8Array
}

export interface OfflineNodeRunnerArtifact {
  artifactKind: 'svg' | 'image' | 'verification_json'
  mimeType: 'image/svg+xml' | 'image/png' | 'image/jpeg' | 'image/webp' | 'application/json'
  bytes: Buffer
  sha256: string
  byteLength: number
  privateArtifactRequired: true
  publicUrl: null
}

export interface OfflineNodeRunnerImageSemanticEvidence {
  sourceBytesVerified: true
  sourceMimeType: 'image/svg+xml'
  outputFormat: 'png' | 'jpeg' | 'webp'
  outputWidth: number
  outputHeight: number
  outputChannels: number
  metadataStripped: true
  upscaleForbidden: true
  alphaPreserved: boolean
  actualSharpOperationCompleted: true
}

export interface OfflineNodeRunnerSvgSemanticEvidence {
  svgRootCount: 1
  elementCount: number
  textElementCount: number
  pathElementCount: number
  rectElementCount: number
  groupElementCount: number
  declaredWidth?: number
  declaredHeight?: number
  viewBox?: string
  unsafeMarkupRejected: true
  externalReferencesRejected: true
  finiteNumericOutputVerified: true
}

export interface OfflineNodeRunnerResult {
  protocol: typeof OFFLINE_NODE_RUNNER_PROTOCOL
  toolId: OfflineNodeRunnerToolId
  operationId: string
  status: 'actual_library_operation_completed'
  source: 'server_resolved_in_memory'
  actualToolPackageExecuted: true
  packageName: string
  invokedEntrypoints: readonly string[]
  normalizedForDeterminism: boolean
  inputSha256: string
  elapsedMilliseconds: number
  timeoutCeilingMilliseconds: number
  outputByteCeiling: number
  artifacts: readonly [OfflineNodeRunnerArtifact, OfflineNodeRunnerArtifact]
  semanticEvidence: OfflineNodeRunnerSvgSemanticEvidence | OfflineNodeRunnerImageSemanticEvidence
  networkPolicy: 'offline_no_caller_targets_no_provider_calls'
  frontendExecutionAllowed: false
  readinessScope: 'tool_specific_operation_evidence_only'
}

export interface OfflineNodeRunnerLimits {
  timeoutMilliseconds: number
  maximumInputJsonBytes: number
  maximumSvgBytes: number
  maximumVerificationJsonBytes: number
  maximumImageBytes: number
  minimumWidth: number
  maximumWidth: number
  minimumHeight: number
  maximumHeight: number
  maximumChartDataItems: number
  maximumGraphNodes: number
  maximumGraphEdges: number
  maximumFontBytes: number
  maximumSvgElements: number
}

export const OFFLINE_NODE_RUNNER_LIMITS: OfflineNodeRunnerLimits = Object.freeze({
  timeoutMilliseconds: 10_000,
  maximumInputJsonBytes: 3 * 1024 * 1024,
  maximumSvgBytes: 2 * 1024 * 1024,
  maximumVerificationJsonBytes: 32 * 1024,
  maximumImageBytes: 16 * 1024 * 1024,
  minimumWidth: 320,
  maximumWidth: 1_920,
  minimumHeight: 180,
  maximumHeight: 1_080,
  maximumChartDataItems: 64,
  maximumGraphNodes: 64,
  maximumGraphEdges: 128,
  maximumFontBytes: 2 * 1024 * 1024,
  maximumSvgElements: 20_000,
})
