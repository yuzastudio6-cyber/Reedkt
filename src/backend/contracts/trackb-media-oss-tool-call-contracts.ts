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
