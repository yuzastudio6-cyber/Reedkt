import type { ID, ISODateString, JSONObject } from '../../types/shared'
import {
  TRACKB_MEDIA_OSS_TOOL_CALL_RANKING,
  assertTrackBMediaOssToolCallPayloadIsGated,
  getTrackBMediaOssCallableWorkerContract,
  getTrackBMediaOssToolCallRankingEntry,
  type TrackBMediaOssToolCallPayload,
  type TrackBMediaOssToolId,
} from '../contracts/trackb-media-oss-tool-call-contracts'

export const TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_DECISION =
  'trackb_media_oss_product_beta_runtime_product_route_enablement_execution_passed_ready_for_product_route_enablement_qa_review'

export const TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_NEXT_PROMPT =
  'TRACKB_MEDIA_OSS_PRODUCT_BETA_RUNTIME_PRODUCT_ROUTE_ENABLEMENT_QA_REVIEW'

export const TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_MODE = 'local_staging_dry_run'

export const TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_ROUTE_IDS = [
  'trackbMediaOss.toolCall.validate',
  'trackbMediaOss.toolCall.queue',
  'trackbMediaOss.toolCall.status',
] as const

export type TrackBProductRouteEnablementRouteId =
  typeof TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_ROUTE_IDS[number]

export type TrackBProductRouteEnablementUseCase =
  | 'metadata_probe'
  | 'video_analysis'
  | 'image_color_pipeline'
  | 'ocr_text_extraction'
  | 'high_risk_media_transform'

export interface TrackBProductRouteEnablementGateEvidence {
  approvedSnapshotState: 'approved'
  editPlanState: 'approved'
  creditReservationState: 'reserved'
  privateArtifactMetadataState: 'private_source_of_truth'
  qaGateState: 'passed'
  fallbackPolicyState: 'approved'
  rollbackState: 'armed_disabled_noop'
  monitoringState: 'sanitized_receipt_ready'
  workerDispatchEnabled: false
  realToolExecutionEnabled: false
  productReadyApproved: false
}

export interface TrackBProductRouteEnablementHarnessRequest {
  routeId: TrackBProductRouteEnablementRouteId
  useCase: TrackBProductRouteEnablementUseCase
  payload: TrackBMediaOssToolCallPayload
  gateEvidence: TrackBProductRouteEnablementGateEvidence
}

export interface TrackBProductRouteEnablementDryRunReceipt {
  schemaVersion: 'trackb-media-oss-product-route-enablements.v1'
  receiptId: ID
  routeId: TrackBProductRouteEnablementRouteId
  toolId: TrackBMediaOssToolId
  selectedToolRank: number
  useCase: TrackBProductRouteEnablementUseCase
  status: 'validated' | 'queued_dry_run' | 'status_dry_run'
  approvedSnapshotId: ID
  editPlanId: ID
  creditReservationId: ID
  idempotencyKey: string
  inputArtifactIds: ID[]
  qaGateIds: ID[]
  fallbackPolicyId: ID
  rollbackState: TrackBProductRouteEnablementGateEvidence['rollbackState']
  monitoringReceipt: {
    sanitized: true
    rawPayloadLogged: false
    signedUrlsCreated: false
    publicArtifactsCreated: false
    supabaseWriteAttempted: false
    gcsWriteAttempted: false
  }
  workerDispatchEnabled: false
  realToolExecutionEnabled: false
  productReadyApproved: false
  createdAt: ISODateString
  warnings: string[]
}

export interface TrackBProductRouteEnablementHarnessResponse {
  ok: boolean
  statusCode: 200 | 202 | 423
  code:
    | 'trackb_media_oss_product_route_enablement_validated'
    | 'trackb_media_oss_product_route_enablement_queued_dry_run'
    | 'trackb_media_oss_product_route_enablement_status_dry_run'
    | 'trackb_media_oss_product_route_enablement_fail_closed'
  decision: typeof TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_DECISION
  nextPrompt: typeof TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_NEXT_PROMPT
  receipt?: TrackBProductRouteEnablementDryRunReceipt
  errors: string[]
  warnings: string[]
}

export const TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_USE_CASE_ORDER:
  Record<TrackBProductRouteEnablementUseCase, readonly TrackBMediaOssToolId[]> = {
    metadata_probe: ['ffprobe', 'mediainfo', 'exiftool', 'duckdb', 'polars_nodejs_polars'],
    video_analysis: ['ffprobe', 'mediainfo', 'pyav', 'opencv', 'pyscenedetect'],
    image_color_pipeline: ['sharp_libvips', 'opencolorio', 'openimageio', 'imagemagick', 'opencv'],
    ocr_text_extraction: ['tesseract', 'paddlepaddle', 'paddleocr'],
    high_risk_media_transform: ['ffmpeg'],
  }

export function selectTrackBMediaOssToolForProductRouteUseCase(
  useCase: TrackBProductRouteEnablementUseCase,
  allowedToolIds: readonly TrackBMediaOssToolId[] = TRACKB_MEDIA_OSS_TOOL_CALL_RANKING.map((entry) => entry.toolId),
) {
  const rankedToolId = TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_USE_CASE_ORDER[useCase]
    .find((toolId) => allowedToolIds.includes(toolId))

  if (!rankedToolId) {
    throw new Error(`No Track B tool is ranked for product route use case: ${useCase}.`)
  }

  return getTrackBMediaOssToolCallRankingEntry(rankedToolId)
}

export function validateTrackBMediaOssProductRouteEnablementRequest(
  request: TrackBProductRouteEnablementHarnessRequest,
): TrackBProductRouteEnablementHarnessResponse {
  return buildTrackBMediaOssProductRouteEnablementResponse(request, 'validated')
}

export function queueTrackBMediaOssProductRouteEnablementDryRun(
  request: TrackBProductRouteEnablementHarnessRequest,
): TrackBProductRouteEnablementHarnessResponse {
  return buildTrackBMediaOssProductRouteEnablementResponse(request, 'queued_dry_run')
}

export function getTrackBMediaOssProductRouteEnablementDryRunStatus(
  receipt: TrackBProductRouteEnablementDryRunReceipt,
): TrackBProductRouteEnablementHarnessResponse {
  return {
    ok: true,
    statusCode: 200,
    code: 'trackb_media_oss_product_route_enablement_status_dry_run',
    decision: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_DECISION,
    nextPrompt: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_NEXT_PROMPT,
    receipt: {
      ...receipt,
      status: 'status_dry_run',
    },
    errors: [],
    warnings: [
      'Status receipt is local/staging dry-run metadata only.',
      'No worker dispatch, real tool execution, Supabase/GCS write, public artifact, signed URL, beta, production, or product-ready unlock occurred.',
    ],
  }
}

export function createTrackBMediaOssProductRouteEnablementHarnessProof() {
  const validRequest = createSampleTrackBMediaOssProductRouteEnablementRequest()
  const validationReceipt = validateTrackBMediaOssProductRouteEnablementRequest(validRequest)
  const queueReceipt = queueTrackBMediaOssProductRouteEnablementDryRun(validRequest)
  const statusReceipt = queueReceipt.receipt
    ? getTrackBMediaOssProductRouteEnablementDryRunStatus(queueReceipt.receipt)
    : undefined

  return {
    decision: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_DECISION,
    nextPrompt: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_NEXT_PROMPT,
    harnessMode: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_MODE,
    routeIds: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_ROUTE_IDS,
    validationReceipt,
    queueReceipt,
    statusReceipt,
    negativePathResults: [
      {
        caseId: 'missing_approved_snapshot',
        response: validateTrackBMediaOssProductRouteEnablementRequest({
          ...validRequest,
          payload: {
            ...validRequest.payload,
            approvedSnapshotId: '',
          },
        }),
      },
      {
        caseId: 'signed_url_artifact_rejected',
        response: validateTrackBMediaOssProductRouteEnablementRequest({
          ...validRequest,
          payload: {
            ...validRequest.payload,
            privateInputArtifacts: [
              {
                ...validRequest.payload.privateInputArtifacts[0],
                storageObjectPath: 'https://example.invalid/signed-url',
              },
            ],
          },
        }),
      },
      {
        caseId: 'worker_dispatch_true_rejected',
        response: validateTrackBMediaOssProductRouteEnablementRequest({
          ...validRequest,
          gateEvidence: {
            ...validRequest.gateEvidence,
            workerDispatchEnabled: true,
          } as TrackBProductRouteEnablementGateEvidence,
        }),
      },
    ],
    useCaseRankingResults: Object.keys(TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_USE_CASE_ORDER)
      .map((useCase) => {
        const selected = selectTrackBMediaOssToolForProductRouteUseCase(
          useCase as TrackBProductRouteEnablementUseCase,
        )
        return {
          useCase,
          selectedToolId: selected.toolId,
          rank: selected.defaultRank,
          routingClass: selected.routingClass,
          executionEnabled: selected.executionEnabled,
        }
      }),
    productReadyApproved: false,
    workerDispatchEnabled: false,
    realToolExecutionEnabled: false,
    supabaseWriteAttempted: false,
    gcsWriteAttempted: false,
  }
}

function buildTrackBMediaOssProductRouteEnablementResponse(
  request: TrackBProductRouteEnablementHarnessRequest,
  status: TrackBProductRouteEnablementDryRunReceipt['status'],
): TrackBProductRouteEnablementHarnessResponse {
  const errors = collectTrackBMediaOssProductRouteEnablementErrors(request)

  if (errors.length > 0) {
    return {
      ok: false,
      statusCode: 423,
      code: 'trackb_media_oss_product_route_enablement_fail_closed',
      decision: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_DECISION,
      nextPrompt: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_NEXT_PROMPT,
      errors,
      warnings: [
        'Fail-closed response returned before any worker dispatch or real tool execution.',
        'No Supabase/GCS write, public artifact, signed URL, external beta, production, or product-ready unlock occurred.',
      ],
    }
  }

  return {
    ok: true,
    statusCode: status === 'queued_dry_run' ? 202 : 200,
    code: status === 'queued_dry_run'
      ? 'trackb_media_oss_product_route_enablement_queued_dry_run'
      : 'trackb_media_oss_product_route_enablement_validated',
    decision: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_DECISION,
    nextPrompt: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_NEXT_PROMPT,
    receipt: buildTrackBMediaOssProductRouteEnablementReceipt(request, status),
    errors: [],
    warnings: [
      'Local/staging dry-run receipt only; real worker dispatch remains disabled.',
      'Product-ready local OSS count remains 0 until a later proof execution and QA gate accept real product-route evidence.',
    ],
  }
}

function collectTrackBMediaOssProductRouteEnablementErrors(
  request: TrackBProductRouteEnablementHarnessRequest,
): string[] {
  const errors: string[] = []

  if (!TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_ROUTE_IDS.includes(request.routeId)) {
    errors.push(`Unsupported Track B product route id: ${request.routeId}.`)
  }

  try {
    assertTrackBMediaOssToolCallPayloadIsGated(request.payload)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Track B gated payload validation failed.')
  }

  const contract = getTrackBMediaOssCallableWorkerContract(request.payload.toolId)
  const ranking = getTrackBMediaOssToolCallRankingEntry(request.payload.toolId)

  if (contract.executionEnabled !== false || contract.status !== 'disabled_until_beta_gate') {
    errors.push(`Track B contract for ${request.payload.toolId} is not still disabled until beta gate.`)
  }

  if (ranking.executionEnabled !== false || ranking.betaDryRunOnly !== true) {
    errors.push(`Track B ranking for ${request.payload.toolId} is not dry-run-only.`)
  }

  if (!TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_USE_CASE_ORDER[request.useCase]?.includes(request.payload.toolId)) {
    errors.push(`Tool ${request.payload.toolId} is not ranked for use case ${request.useCase}.`)
  }

  if (request.gateEvidence.approvedSnapshotState !== 'approved') {
    errors.push('Approved snapshot gate did not pass.')
  }
  if (request.gateEvidence.editPlanState !== 'approved') {
    errors.push('Edit plan gate did not pass.')
  }
  if (request.gateEvidence.creditReservationState !== 'reserved') {
    errors.push('Credit reservation gate did not pass.')
  }
  if (request.gateEvidence.privateArtifactMetadataState !== 'private_source_of_truth') {
    errors.push('Private artifact metadata gate did not pass.')
  }
  if (request.gateEvidence.qaGateState !== 'passed') {
    errors.push('QA gate did not pass.')
  }
  if (request.gateEvidence.fallbackPolicyState !== 'approved') {
    errors.push('Fallback policy gate did not pass.')
  }
  if (request.gateEvidence.rollbackState !== 'armed_disabled_noop') {
    errors.push('Rollback gate did not remain armed and disabled.')
  }
  if (request.gateEvidence.monitoringState !== 'sanitized_receipt_ready') {
    errors.push('Sanitized monitoring receipt gate did not pass.')
  }
  if (request.gateEvidence.workerDispatchEnabled !== false) {
    errors.push('Worker dispatch must remain disabled in route enablement execution.')
  }
  if (request.gateEvidence.realToolExecutionEnabled !== false) {
    errors.push('Real Track B tool execution must remain disabled in route enablement execution.')
  }
  if (request.gateEvidence.productReadyApproved !== false) {
    errors.push('Product-ready approval must remain false in route enablement execution.')
  }

  return errors
}

function buildTrackBMediaOssProductRouteEnablementReceipt(
  request: TrackBProductRouteEnablementHarnessRequest,
  status: TrackBProductRouteEnablementDryRunReceipt['status'],
): TrackBProductRouteEnablementDryRunReceipt {
  const ranking = getTrackBMediaOssToolCallRankingEntry(request.payload.toolId)

  return {
    schemaVersion: 'trackb-media-oss-product-route-enablements.v1',
    receiptId: buildTrackBMediaOssProductRouteEnablementReceiptId(request),
    routeId: request.routeId,
    toolId: request.payload.toolId,
    selectedToolRank: ranking.defaultRank,
    useCase: request.useCase,
    status,
    approvedSnapshotId: request.payload.approvedSnapshotId,
    editPlanId: request.payload.editPlanId,
    creditReservationId: request.payload.creditReservationId,
    idempotencyKey: request.payload.idempotencyKey,
    inputArtifactIds: request.payload.privateInputArtifacts.map((artifact) => artifact.artifactId),
    qaGateIds: request.payload.requiredQualityGateIds,
    fallbackPolicyId: request.payload.fallbackPolicyId,
    rollbackState: request.gateEvidence.rollbackState,
    monitoringReceipt: {
      sanitized: true,
      rawPayloadLogged: false,
      signedUrlsCreated: false,
      publicArtifactsCreated: false,
      supabaseWriteAttempted: false,
      gcsWriteAttempted: false,
    },
    workerDispatchEnabled: false,
    realToolExecutionEnabled: false,
    productReadyApproved: false,
    createdAt: request.payload.requestedAt,
    warnings: [
      'Sanitized dry-run receipt: storage paths, raw payloads, public URLs, signed URLs, and raw prompts are excluded.',
      'No route runtime, worker dispatch, real tool execution, media processing, Supabase/GCS write, beta, production, or product-ready unlock occurred.',
    ],
  }
}

function buildTrackBMediaOssProductRouteEnablementReceiptId(
  request: TrackBProductRouteEnablementHarnessRequest,
): ID {
  return [
    'trackb-route-dry-run',
    request.routeId,
    request.payload.toolId,
    request.payload.idempotencyKey,
  ].join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').slice(0, 120)
}

function createSampleTrackBMediaOssProductRouteEnablementRequest():
  TrackBProductRouteEnablementHarnessRequest {
  return {
    routeId: 'trackbMediaOss.toolCall.validate',
    useCase: 'metadata_probe',
    payload: {
      toolId: 'ffprobe',
      workspaceId: 'workspace_trackb_route_enablement',
      projectId: 'project_trackb_route_enablement',
      mediaAssetId: 'media_asset_trackb_route_enablement',
      approvedSnapshotId: 'approved_snapshot_trackb_route_enablement',
      editPlanId: 'edit_plan_trackb_route_enablement',
      idempotencyKey: 'trackb-route-enablement-dry-run-001',
      creditReservationId: 'credit_reservation_trackb_route_enablement',
      privateInputArtifacts: [
        {
          artifactId: 'artifact_trackb_private_source_metadata',
          artifactType: 'source_media',
          storageBucketPurpose: 'source_media',
          storageObjectPath: 'private/workspaces/workspace_trackb_route_enablement/source/asset.mov',
          checksum: 'sha256:trackb-route-enablement-synthetic-metadata-only',
          sizeBytes: 128,
          isPrivate: true,
          sourceOfTruth: true,
        },
      ],
      requestedRecipeId: 'recipe_trackb_metadata_probe',
      requiredQualityGateIds: [
        'qa_gate_render_asset_integrity',
        'qa_gate_render_timeline_integrity',
        'qa_gate_final_delivery',
      ],
      fallbackPolicyId: 'fallback_policy_block_preview_final_export_user_review',
      resultSchemaVersion: 'trackb-media-oss-tool-call-result.v1',
      dryRunOnly: true,
      executionEnabled: false,
      requestedAt: '2026-06-26T02:20:00Z',
      metadata: {
        harnessMode: TRACKB_MEDIA_OSS_PRODUCT_ROUTE_ENABLEMENT_MODE,
        rawPromptIncluded: false,
      } satisfies JSONObject,
    },
    gateEvidence: {
      approvedSnapshotState: 'approved',
      editPlanState: 'approved',
      creditReservationState: 'reserved',
      privateArtifactMetadataState: 'private_source_of_truth',
      qaGateState: 'passed',
      fallbackPolicyState: 'approved',
      rollbackState: 'armed_disabled_noop',
      monitoringState: 'sanitized_receipt_ready',
      workerDispatchEnabled: false,
      realToolExecutionEnabled: false,
      productReadyApproved: false,
    },
  }
}
