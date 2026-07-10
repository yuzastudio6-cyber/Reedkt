import type {
  ProductionStorageBucketPurpose,
  QualityGateType,
  ToolArtifactType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionWorkerRuntimeType } from '../workers/production/production-worker-types'
import {
  TRACK_B_ADAPTER_TOOL_IDS,
  type TrackBAdapterExecutionMode,
  type TrackBAdapterToolId,
} from './trackb-adapter-schemas'

export interface TrackBAdapterArtifactRequirement {
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  required: boolean
  description: string
}

export interface TrackBAdapterQAContract {
  checkId: string
  gateType?: QualityGateType
  required: boolean
  description: string
}

export interface TrackBAdapterContract {
  toolId: TrackBAdapterToolId
  displayName: string
  capability: string
  workerType: ProductionWorkerRuntimeType
  allowedExecutionModes: TrackBAdapterExecutionMode[]
  inputManifest: TrackBAdapterArtifactRequirement[]
  outputManifest: TrackBAdapterArtifactRequirement[]
  qaChecks: TrackBAdapterQAContract[]
  boundedExecutionScope: string
  implementationBoundary: string
}

const commonQA: TrackBAdapterQAContract[] = [
  {
    checkId: 'approved_snapshot_credit_gate',
    required: true,
    description: 'Approved snapshot, credit estimate, credit reservation, and idempotency must be present before any backend dispatch.',
  },
  {
    checkId: 'private_artifact_manifest',
    required: true,
    description: 'All inputs and planned outputs must use private source-of-truth artifact manifest paths, not signed URLs or raw URLs.',
  },
  {
    checkId: 'tool_result_schema',
    required: true,
    description: 'Adapter output must parse as a Track B tool result schema before dispatch is considered valid.',
  },
]

function contract(input: TrackBAdapterContract): TrackBAdapterContract {
  return input
}

export const TRACK_B_ADAPTER_CONTRACTS = {
  ffmpeg: contract({
    toolId: 'ffmpeg',
    displayName: 'FFmpeg',
    capability: 'Media proxy, transcode, mux, and export packaging boundary',
    workerType: 'render_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'source_media', storageBucketPurpose: 'source_media', required: true, description: 'Approved private source or proxy media reference.' },
      { artifactType: 'render_manifest', storageBucketPurpose: 'analysis_artifacts', required: false, description: 'Approved render/export manifest when mux/export is requested.' },
    ],
    outputManifest: [
      { artifactType: 'proxy_video', storageBucketPurpose: 'proxy_media', required: false, description: 'Private proxy/transcode output when requested by an approved recipe.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Technical command/result QA summary.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'ffmpeg_lgpl_build_boundary', gateType: 'export_codec_format', required: true, description: 'Bounded execution must preserve reviewed FFmpeg build/license assumptions and command allowlists.' },
    ],
    boundedExecutionScope: 'Approved backend media command only; no frontend execution, arbitrary shell, or unapproved codec/export path.',
    implementationBoundary: 'Adapter contract only. This milestone does not invoke ffmpeg or process media.',
  }),
  ffprobe: contract({
    toolId: 'ffprobe',
    displayName: 'ffprobe',
    capability: 'Technical media metadata and export inspection',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'source_media', storageBucketPurpose: 'source_media', required: true, description: 'Private source or proxy media reference.' },
    ],
    outputManifest: [
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Private technical probe report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'probe_metadata_only', gateType: 'render_asset_integrity', required: true, description: 'Probe output must be metadata/QA only and must not transform media.' },
    ],
    boundedExecutionScope: 'Approved metadata probe only against private artifacts.',
    implementationBoundary: 'Adapter contract only. This milestone does not invoke ffprobe.',
  }),
  pyav: contract({
    toolId: 'pyav',
    displayName: 'PyAV',
    capability: 'Frame/audio access for CPU analysis recipes',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'source_media', storageBucketPurpose: 'source_media', required: true, description: 'Private source/proxy media reference.' },
    ],
    outputManifest: [
      { artifactType: 'visual_analysis_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private frame/timestamp analysis report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'timestamp_stability', gateType: 'render_timeline_integrity', required: true, description: 'Frame/audio access must preserve timestamps for downstream approved timeline work.' },
    ],
    boundedExecutionScope: 'Bounded decode/sample recipe only; no final export or semantic edit decision.',
    implementationBoundary: 'Adapter contract only. This milestone does not import PyAV or decode media.',
  }),
  opentimelineio: contract({
    toolId: 'opentimelineio',
    displayName: 'OpenTimelineIO',
    capability: 'Approved edit-decision/timeline interchange',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'timeline_manifest', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Approved timeline/edit-decision manifest.' },
    ],
    outputManifest: [
      { artifactType: 'opentimelineio_manifest', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private OTIO interchange manifest.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Timeline integrity report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'timeline_integrity', gateType: 'render_timeline_integrity', required: true, description: 'OTIO output must preserve approved clip order, timing, and frame intent.' },
    ],
    boundedExecutionScope: 'Approved timeline manifest serialization/validation only.',
    implementationBoundary: 'Adapter contract only. This milestone does not run OpenTimelineIO.',
  }),
  remotion: contract({
    toolId: 'remotion',
    displayName: 'Remotion',
    capability: 'Deterministic render composition from approved manifests',
    workerType: 'render_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'render_manifest', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Approved render composition manifest.' },
      { artifactType: 'timeline_manifest', storageBucketPurpose: 'analysis_artifacts', required: false, description: 'Approved timeline handoff manifest.' },
    ],
    outputManifest: [
      { artifactType: 'render_manifest', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private renderer plan/result manifest.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Render layout/timing QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'render_manifest_integrity', gateType: 'render_timeline_integrity', required: true, description: 'Composition must derive from approved manifests, not raw chat or arbitrary props.' },
    ],
    boundedExecutionScope: 'Approved renderer manifest validation/planning only until render/export gates pass.',
    implementationBoundary: 'Adapter contract only. This milestone does not invoke Remotion render.',
  }),
  libass: contract({
    toolId: 'libass',
    displayName: 'libass',
    capability: 'ASS subtitle rendering boundary',
    workerType: 'render_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'caption_segments_json', storageBucketPurpose: 'transcripts', required: true, description: 'Approved caption segment/style manifest.' },
      { artifactType: 'source_media', storageBucketPurpose: 'source_media', required: false, description: 'Private media reference only when an approved burn-in recipe exists.' },
    ],
    outputManifest: [
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Caption style, safe-zone, and font QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'caption_safe_zone', gateType: 'caption_safe_zone', required: true, description: 'Captions must preserve safe zones and readability before preview/final use.' },
    ],
    boundedExecutionScope: 'Synthetic/private approved subtitle recipe only; no arbitrary ASS payload or frontend subtitle burn-in.',
    implementationBoundary: 'Adapter contract only. This milestone does not invoke libass or burn captions.',
  }),
  sharp: contract({
    toolId: 'sharp',
    displayName: 'Sharp + libvips',
    capability: 'Static image/render asset preparation',
    workerType: 'render_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'keyframe_image', storageBucketPurpose: 'generated_assets', required: true, description: 'Private approved image/render asset reference.' },
    ],
    outputManifest: [
      { artifactType: 'keyframe_image', storageBucketPurpose: 'generated_assets', required: true, description: 'Private resized/cropped/prepared image asset.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Image bounds/alpha/size QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'image_asset_integrity', gateType: 'render_asset_integrity', required: true, description: 'Prepared asset must match approved dimensions, alpha, and frame constraints.' },
    ],
    boundedExecutionScope: 'Approved static image asset operation only.',
    implementationBoundary: 'Adapter contract only. This milestone does not invoke Sharp/libvips.',
  }),
  paddleocr: contract({
    toolId: 'paddleocr',
    displayName: 'PaddleOCR',
    capability: 'OCR text-region candidate detection',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'representative_frame', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private approved frame/image set for OCR candidate checks.' },
    ],
    outputManifest: [
      { artifactType: 'ocr_report_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private OCR region/confidence report.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Private text/privacy/model-boundary QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'ocr_private_text_boundary', gateType: 'ocr_text_overlap', required: true, description: 'OCR output must remain private and model/font configuration must be approved for the selected recipe.' },
    ],
    boundedExecutionScope: 'Approved private frame OCR recipe only; no unreviewed model/font downloads or public text output.',
    implementationBoundary: 'Adapter contract only. This milestone does not instantiate PaddleOCR.',
  }),
  pyscenedetect: contract({
    toolId: 'pyscenedetect',
    displayName: 'PySceneDetect',
    capability: 'Scene boundary candidate generation',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'source_media', storageBucketPurpose: 'source_media', required: true, description: 'Private source/proxy video reference.' },
    ],
    outputManifest: [
      { artifactType: 'scene_report_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private scene boundary candidate report.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Cut candidate QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'meaning_preservation_required', gateType: 'cut_smoothness', required: true, description: 'Scene candidates must not become cuts without approved meaning-preservation validation.' },
    ],
    boundedExecutionScope: 'Candidate detection only; no automatic edit cuts.',
    implementationBoundary: 'Adapter contract only. This milestone does not run PySceneDetect.',
  }),
  opencv: contract({
    toolId: 'opencv',
    displayName: 'OpenCV',
    capability: 'CPU visual analysis and QA primitives',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'representative_frame', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private approved frame/image reference.' },
    ],
    outputManifest: [
      { artifactType: 'visual_analysis_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private visual analysis report.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Visual QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'visual_analysis_bounds', gateType: 'render_asset_integrity', required: true, description: 'Visual checks must report bounded metrics only and avoid semantic truth claims.' },
    ],
    boundedExecutionScope: 'Approved CPU visual metric/QA recipe only.',
    implementationBoundary: 'Adapter contract only. This milestone does not import OpenCV.',
  }),
  opencolorio: contract({
    toolId: 'opencolorio',
    displayName: 'OpenColorIO',
    capability: 'Color-management transform and color QA boundary',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'keyframe_image', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private approved image/frame or color-config artifact reference.' },
    ],
    outputManifest: [
      { artifactType: 'color_analysis_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private color transform/analysis report.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Color QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'color_config_traceability', gateType: 'color_export_space', required: true, description: 'Color config/LUT source must be traceable and approved before transform use.' },
    ],
    boundedExecutionScope: 'Approved color config/API-shape recipe only; no arbitrary LUT/config import.',
    implementationBoundary: 'Adapter contract only. This milestone does not run OpenColorIO.',
  }),
  openimageio: contract({
    toolId: 'openimageio',
    displayName: 'OpenImageIO',
    capability: 'Professional image IO and frame metadata support',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'keyframe_image', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private approved image/frame reference.' },
    ],
    outputManifest: [
      { artifactType: 'visual_analysis_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private image metadata/inspection report.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Image IO QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'image_metadata_integrity', gateType: 'render_asset_integrity', required: true, description: 'Image IO result must preserve private metadata and approved frame constraints.' },
    ],
    boundedExecutionScope: 'Approved image IO/metadata recipe only.',
    implementationBoundary: 'Adapter contract only. This milestone does not run OpenImageIO.',
  }),
  audioflux: contract({
    toolId: 'audioflux',
    displayName: 'AudioFlux',
    capability: 'Audio feature/onset/rhythm analysis',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'extracted_audio', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private approved audio artifact.' },
    ],
    outputManifest: [
      { artifactType: 'audio_analysis_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private feature/onset/rhythm analysis report.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Audio analysis QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'speech_clarity_boundary', gateType: 'audio_sync', required: true, description: 'Audio cues must not override speech clarity or approved timing policy.' },
    ],
    boundedExecutionScope: 'Approved audio feature extraction recipe only.',
    implementationBoundary: 'Adapter contract only. This milestone does not import AudioFlux.',
  }),
  signalsmith_stretch: contract({
    toolId: 'signalsmith_stretch',
    displayName: 'Signalsmith Stretch',
    capability: 'Music-bed stretch/pitch timing support',
    workerType: 'cpu_analysis_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'extracted_audio', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private approved music/audio artifact.' },
    ],
    outputManifest: [
      { artifactType: 'cleaned_audio', storageBucketPurpose: 'generated_assets', required: true, description: 'Private planned stretched audio artifact reference.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Stretch artifact and speech-safety QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'stretch_artifact_policy', gateType: 'audio_naturalness', required: true, description: 'Stretch/pitch changes must stay within approved timing and quality limits.' },
    ],
    boundedExecutionScope: 'Approved music-bed timing fit only; no voice cleanup or arbitrary audio processing.',
    implementationBoundary: 'Adapter contract only. This milestone does not run Signalsmith Stretch.',
  }),
  d3: contract({
    toolId: 'd3',
    displayName: 'D3',
    capability: 'Exact chart/diagram specification generation',
    workerType: 'render_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'visual_analysis_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Approved chart/data source manifest.' },
    ],
    outputManifest: [
      { artifactType: 'render_manifest', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private chart/diagram render manifest.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Chart label/source-truth QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'approved_data_source', gateType: 'render_asset_integrity', required: true, description: 'Charts must preserve approved data and exact labels; no invented metrics.' },
    ],
    boundedExecutionScope: 'Approved chart spec/render-manifest generation only.',
    implementationBoundary: 'Adapter contract only. This milestone does not execute D3 in a browser/runtime.',
  }),
  echarts: contract({
    toolId: 'echarts',
    displayName: 'ECharts',
    capability: 'Standard chart specification generation',
    workerType: 'render_worker',
    allowedExecutionModes: ['dry_run', 'bounded_execution'],
    inputManifest: [
      { artifactType: 'visual_analysis_json', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Approved chart/data source manifest.' },
    ],
    outputManifest: [
      { artifactType: 'render_manifest', storageBucketPurpose: 'analysis_artifacts', required: true, description: 'Private standard chart render manifest.' },
      { artifactType: 'qa_report', storageBucketPurpose: 'qa_artifacts', required: true, description: 'Chart label/source-truth QA report.' },
    ],
    qaChecks: [
      ...commonQA,
      { checkId: 'chart_label_integrity', gateType: 'render_asset_integrity', required: true, description: 'Chart labels, series, and units must trace to approved data.' },
    ],
    boundedExecutionScope: 'Approved chart spec/render-manifest generation only.',
    implementationBoundary: 'Adapter contract only. This milestone does not execute ECharts in a browser/runtime.',
  }),
} as const satisfies Record<TrackBAdapterToolId, TrackBAdapterContract>

export function getTrackBAdapterContract(toolId: TrackBAdapterToolId): TrackBAdapterContract {
  return TRACK_B_ADAPTER_CONTRACTS[toolId]
}

export function listTrackBAdapterContracts(): TrackBAdapterContract[] {
  return TRACK_B_ADAPTER_TOOL_IDS.map((toolId) => TRACK_B_ADAPTER_CONTRACTS[toolId])
}
