import type { ID, ISODateString, JSONObject } from '../../types/shared'
import type {
  ProductionStorageBucketPurpose,
  ProductionWorkerType,
  QualityGateType,
  ToolArtifactType,
} from './production-tool-runtime-contracts'
import { assertNoRawPromptExecutionPayload } from './production-tool-runtime-validation'

export const TRACKB_MEDIA_OSS_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'sharp_libvips',
  'duckdb',
  'polars_nodejs_polars',
  'exiftool',
  'mediainfo',
  'tesseract',
  'imagemagick',
  'opencv',
  'pyav',
  'pyscenedetect',
  'paddlepaddle',
  'paddleocr',
  'opencolorio',
  'openimageio',
] as const

export type TrackBMediaOssToolId = typeof TRACKB_MEDIA_OSS_TOOL_IDS[number]

export type TrackBToolCallContractStatus =
  | 'contract_metadata_ready'
  | 'disabled_until_beta_gate'

export type TrackBToolCallRoutingClass =
  | 'source_introspection'
  | 'structured_metadata_analysis'
  | 'image_color_analysis'
  | 'image_processing_fallback'
  | 'video_frame_analysis'
  | 'ocr_text_analysis'
  | 'media_transform_high_risk'

export type TrackBToolCallCostTier =
  | 'metadata_low'
  | 'cpu_medium'
  | 'cpu_heavy'
  | 'transform_high'

export interface TrackBMediaOssToolCallRankingEntry {
  toolId: TrackBMediaOssToolId
  defaultRank: number
  routingClass: TrackBToolCallRoutingClass
  costTier: TrackBToolCallCostTier
  preferredWhen: string
  deferWhen: string
  betaDryRunOnly: true
  executionEnabled: false
}

export interface TrackBPrivateArtifactReference {
  artifactId: ID
  artifactType: ToolArtifactType
  storageBucketPurpose: ProductionStorageBucketPurpose
  storageObjectPath: string
  checksum?: string
  sizeBytes?: number
  isPrivate: true
  sourceOfTruth: true
}

export interface TrackBToolCallResultSchema {
  schemaVersion: 'trackb-media-oss-tool-call-result.v1'
  statusValues: readonly ['blocked', 'queued', 'running', 'succeeded', 'failed', 'cancelled']
  requiredFields: readonly string[]
  forbiddenFields: readonly string[]
}

export interface TrackBMediaOssCallableWorkerContract {
  toolId: TrackBMediaOssToolId
  workerType: ProductionWorkerType
  status: TrackBToolCallContractStatus
  requiresApprovedSnapshotId: true
  requiresEditPlanId: true
  requiresIdempotencyKey: true
  requiresPrivateArtifactReferences: true
  requiresCreditReservationId: true
  requiredQualityGates: QualityGateType[]
  fallbackPolicy: {
    allowedActions: readonly ['block_preview', 'block_final_export', 'request_user_review']
    maxAttemptsBeforeUserReview: number
  }
  resultSchema: TrackBToolCallResultSchema
  sanitizedLoggingOnly: true
  executionEnabled: false
  notes: string[]
}

export interface TrackBMediaOssToolCallPayload {
  toolId: TrackBMediaOssToolId
  workspaceId: ID
  projectId: ID
  mediaAssetId: ID
  approvedSnapshotId: ID
  editPlanId: ID
  idempotencyKey: string
  creditReservationId: ID
  privateInputArtifacts: TrackBPrivateArtifactReference[]
  requestedRecipeId: ID
  requiredQualityGateIds: ID[]
  fallbackPolicyId: ID
  resultSchemaVersion: TrackBToolCallResultSchema['schemaVersion']
  dryRunOnly: true
  executionEnabled: false
  requestedAt: ISODateString
  metadata?: JSONObject
}

export interface TrackBMediaOssFailClosedResponse {
  ok: false
  statusCode: 423
  code: 'trackb_media_oss_tool_calls_disabled_until_beta_gate'
  message: string
  decision: 'trackb_media_oss_callable_worker_contracts_passed_ready_for_tool_call_beta_readiness_rerun'
  nextPrompt: 'TRACKB_MEDIA_OSS_TOOL_CALL_BETA_READINESS_RERUN'
  toolId?: TrackBMediaOssToolId
  warnings: string[]
}

const resultSchema: TrackBToolCallResultSchema = {
  schemaVersion: 'trackb-media-oss-tool-call-result.v1',
  statusValues: ['blocked', 'queued', 'running', 'succeeded', 'failed', 'cancelled'],
  requiredFields: [
    'toolId',
    'status',
    'approvedSnapshotId',
    'editPlanId',
    'idempotencyKey',
    'inputArtifactIds',
    'outputArtifactIds',
    'qaGateIds',
    'fallbackPolicyId',
    'sanitizedLogsSummary',
  ],
  forbiddenFields: ['signedUrl', 'signed_url', 'publicUrl', 'rawPrompt', 'rawChat', 'providerPrompt'],
}

export const TRACKB_MEDIA_OSS_TOOL_CALL_RANKING: readonly TrackBMediaOssToolCallRankingEntry[] = [
  {
    toolId: 'ffprobe',
    defaultRank: 10,
    routingClass: 'source_introspection',
    costTier: 'metadata_low',
    preferredWhen: 'A future approved recipe needs container/stream metadata before selecting any heavier media tool.',
    deferWhen: 'The request needs mutation, rendering, OCR, image transforms, or non-media structured analytics.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'mediainfo',
    defaultRank: 20,
    routingClass: 'source_introspection',
    costTier: 'metadata_low',
    preferredWhen: 'A future approved recipe needs a secondary media metadata view after or alongside FFprobe.',
    deferWhen: 'The request needs byte-level EXIF tags, image transforms, OCR, or frame analysis.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'exiftool',
    defaultRank: 30,
    routingClass: 'source_introspection',
    costTier: 'metadata_low',
    preferredWhen: 'A future approved recipe needs file, camera, image, or document metadata without media decoding.',
    deferWhen: 'The request needs stream-level media metadata, visual analysis, OCR, or mutation.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'duckdb',
    defaultRank: 40,
    routingClass: 'structured_metadata_analysis',
    costTier: 'metadata_low',
    preferredWhen: 'A future approved recipe needs deterministic local SQL over bounded manifest or report rows.',
    deferWhen: 'The request needs media parsing, image buffers, OCR, or transforms rather than structured data summarization.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'polars_nodejs_polars',
    defaultRank: 50,
    routingClass: 'structured_metadata_analysis',
    costTier: 'metadata_low',
    preferredWhen: 'A future approved recipe needs dataframe-style manifest/report shaping after source metadata is collected.',
    deferWhen: 'The request needs SQL joins best handled by DuckDB or direct media/image/OCR work.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'sharp_libvips',
    defaultRank: 60,
    routingClass: 'image_color_analysis',
    costTier: 'cpu_medium',
    preferredWhen: 'A future approved image recipe needs low-cost image metadata or bounded image transforms before heavier CV paths.',
    deferWhen: 'The request requires color-management API proof, OpenImageIO-specific image specs, or OCR.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'opencolorio',
    defaultRank: 70,
    routingClass: 'image_color_analysis',
    costTier: 'cpu_medium',
    preferredWhen: 'A future approved color pipeline needs color configuration or transform planning before image-buffer handling.',
    deferWhen: 'The request needs file format/image-buffer API work that belongs to OpenImageIO after color intent is known.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'openimageio',
    defaultRank: 80,
    routingClass: 'image_color_analysis',
    costTier: 'cpu_medium',
    preferredWhen: 'A future approved image pipeline needs ImageSpec/ImageBuf-style API handling after color intent is established.',
    deferWhen: 'The request only needs lightweight metadata or color config review without image-buffer API work.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'imagemagick',
    defaultRank: 90,
    routingClass: 'image_processing_fallback',
    costTier: 'cpu_medium',
    preferredWhen: 'A future approved recipe needs command-style image inspection or fallback processing after safer library routes are ruled out.',
    deferWhen: 'The request can be satisfied by Sharp/libvips, OpenColorIO, OpenImageIO, or metadata-only tooling.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'opencv',
    defaultRank: 100,
    routingClass: 'video_frame_analysis',
    costTier: 'cpu_heavy',
    preferredWhen: 'A future approved recipe needs computer-vision API shape or bounded frame/image analysis.',
    deferWhen: 'The request needs simple metadata, OCR text extraction, or media container probing first.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'pyav',
    defaultRank: 110,
    routingClass: 'video_frame_analysis',
    costTier: 'cpu_heavy',
    preferredWhen: 'A future approved recipe needs Python container/frame access after metadata probing selects the lane.',
    deferWhen: 'The request only needs stream metadata, structured reporting, image-only work, or OCR.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'pyscenedetect',
    defaultRank: 120,
    routingClass: 'video_frame_analysis',
    costTier: 'cpu_heavy',
    preferredWhen: 'A future approved recipe needs scene-boundary analysis after a frame-access strategy is approved.',
    deferWhen: 'The request needs source metadata, OCR, image color analysis, or direct transforms.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'tesseract',
    defaultRank: 130,
    routingClass: 'ocr_text_analysis',
    costTier: 'cpu_medium',
    preferredWhen: 'A future approved OCR recipe needs deterministic system OCR before heavier ML OCR paths.',
    deferWhen: 'The request needs ML OCR API-shape proof, non-text image analysis, or media metadata.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'paddlepaddle',
    defaultRank: 140,
    routingClass: 'ocr_text_analysis',
    costTier: 'cpu_heavy',
    preferredWhen: 'A future approved ML OCR recipe needs PaddlePaddle runtime gating before PaddleOCR.',
    deferWhen: 'The request can use Tesseract or metadata-only paths, or would require model/asset work not yet approved.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'paddleocr',
    defaultRank: 150,
    routingClass: 'ocr_text_analysis',
    costTier: 'cpu_heavy',
    preferredWhen: 'A future approved OCR recipe needs PaddleOCR API-shape handling after PaddlePaddle and font gates pass.',
    deferWhen: 'The request would instantiate OCR models, fetch assets, run OCR inference, or can use Tesseract.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
  {
    toolId: 'ffmpeg',
    defaultRank: 160,
    routingClass: 'media_transform_high_risk',
    costTier: 'transform_high',
    preferredWhen: 'A future approved recipe explicitly needs bounded media transform behavior after probe, QA, and artifact gates.',
    deferWhen: 'The request can be satisfied by metadata probes, analysis-only tools, OCR, or image-specific libraries.',
    betaDryRunOnly: true,
    executionEnabled: false,
  },
] as const

export const TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS: TrackBMediaOssCallableWorkerContract[] =
  TRACKB_MEDIA_OSS_TOOL_IDS.map((toolId) => ({
    toolId,
    workerType: toolId === 'paddleocr' || toolId === 'paddlepaddle'
      ? 'cpu_analysis_worker'
      : toolId === 'opencolorio' || toolId === 'openimageio'
        ? 'cpu_analysis_worker'
        : 'cpu_analysis_worker',
    status: 'disabled_until_beta_gate',
    requiresApprovedSnapshotId: true,
    requiresEditPlanId: true,
    requiresIdempotencyKey: true,
    requiresPrivateArtifactReferences: true,
    requiresCreditReservationId: true,
    requiredQualityGates: [
      'render_asset_integrity',
      'render_timeline_integrity',
      'final_delivery',
    ],
    fallbackPolicy: {
      allowedActions: ['block_preview', 'block_final_export', 'request_user_review'],
      maxAttemptsBeforeUserReview: 0,
    },
    resultSchema,
    sanitizedLoggingOnly: true,
    executionEnabled: false,
    notes: [
      'Track B bounded install/proof coverage is complete, but this contract does not execute tools.',
      'Direct calls remain disabled until the beta-readiness rerun accepts route, worker, artifact, QA, fallback, and observability gates.',
    ],
  }))

export function isTrackBMediaOssToolId(value: string): value is TrackBMediaOssToolId {
  return (TRACKB_MEDIA_OSS_TOOL_IDS as readonly string[]).includes(value)
}

export function getTrackBMediaOssCallableWorkerContract(
  toolId: TrackBMediaOssToolId,
): TrackBMediaOssCallableWorkerContract {
  const contract = TRACKB_MEDIA_OSS_CALLABLE_WORKER_CONTRACTS.find((entry) => entry.toolId === toolId)
  if (!contract) throw new Error(`Missing Track B callable worker contract for ${toolId}.`)
  return contract
}

export function getTrackBMediaOssToolCallRankingEntry(
  toolId: TrackBMediaOssToolId,
): TrackBMediaOssToolCallRankingEntry {
  const entry = TRACKB_MEDIA_OSS_TOOL_CALL_RANKING.find((candidate) => candidate.toolId === toolId)
  if (!entry) throw new Error(`Missing Track B tool-call ranking entry for ${toolId}.`)
  return entry
}

export function assertTrackBMediaOssToolCallPayloadIsGated(
  payload: TrackBMediaOssToolCallPayload,
): void {
  assertNoRawPromptExecutionPayload(payload)

  if (!isTrackBMediaOssToolId(payload.toolId)) {
    throw new Error(`Unsupported Track B media OSS tool id: ${payload.toolId}.`)
  }

  const requiredStringFields: Array<keyof Pick<
    TrackBMediaOssToolCallPayload,
    | 'workspaceId'
    | 'projectId'
    | 'mediaAssetId'
    | 'approvedSnapshotId'
    | 'editPlanId'
    | 'idempotencyKey'
    | 'creditReservationId'
    | 'requestedRecipeId'
    | 'fallbackPolicyId'
  >> = [
    'workspaceId',
    'projectId',
    'mediaAssetId',
    'approvedSnapshotId',
    'editPlanId',
    'idempotencyKey',
    'creditReservationId',
    'requestedRecipeId',
    'fallbackPolicyId',
  ]

  for (const field of requiredStringFields) {
    if (!payload[field]) throw new Error(`Track B tool-call payload missing ${field}.`)
  }

  if (payload.resultSchemaVersion !== resultSchema.schemaVersion) {
    throw new Error(`Track B tool-call result schema drift: ${payload.resultSchemaVersion}.`)
  }

  if (payload.dryRunOnly !== true || payload.executionEnabled !== false) {
    throw new Error('Track B tool-call payload must remain dry-run-only and execution-disabled before beta gate approval.')
  }

  if (!Array.isArray(payload.privateInputArtifacts) || payload.privateInputArtifacts.length === 0) {
    throw new Error('Track B tool-call payload requires private input artifact references.')
  }

  for (const artifact of payload.privateInputArtifacts) {
    if (artifact.isPrivate !== true || artifact.sourceOfTruth !== true) {
      throw new Error(`Track B artifact ${artifact.artifactId} must be private source-of-truth storage metadata.`)
    }
    if (!artifact.storageBucketPurpose || !artifact.storageObjectPath) {
      throw new Error(`Track B artifact ${artifact.artifactId} requires storage bucket purpose and object path.`)
    }
    if (hasUrlLikeValue(artifact.storageObjectPath)) {
      throw new Error(`Track B artifact ${artifact.artifactId} must not use public or signed URLs.`)
    }
  }

  if (!Array.isArray(payload.requiredQualityGateIds) || payload.requiredQualityGateIds.length === 0) {
    throw new Error('Track B tool-call payload requires QA gate linkage.')
  }
}

export function buildTrackBMediaOssFailClosedResponse(
  toolId?: TrackBMediaOssToolId,
): TrackBMediaOssFailClosedResponse {
  return {
    ok: false,
    statusCode: 423,
    code: 'trackb_media_oss_tool_calls_disabled_until_beta_gate',
    message: 'Track B media OSS direct tool calls remain disabled until the beta-readiness rerun approves callable worker contracts.',
    decision: 'trackb_media_oss_callable_worker_contracts_passed_ready_for_tool_call_beta_readiness_rerun',
    nextPrompt: 'TRACKB_MEDIA_OSS_TOOL_CALL_BETA_READINESS_RERUN',
    toolId,
    warnings: [
      'No Docker, tool execution, media processing, worker dispatch, Supabase/GCS write, beta, or production scope is opened by this contract.',
      'Payloads must carry approved snapshot, edit plan, idempotency, credit, private artifact, QA, fallback, and sanitized result-schema links.',
    ],
  }
}

function hasUrlLikeValue(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('http://')
    || normalized.startsWith('https://')
    || normalized.startsWith('signed://')
    || normalized.includes('x-amz-signature=')
    || normalized.includes('x-goog-signature=')
    || normalized.includes('signature=')
    || normalized.includes('signedurl')
    || normalized.includes('signed_url')
}
