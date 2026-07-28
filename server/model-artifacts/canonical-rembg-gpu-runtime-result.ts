import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalRembgGpuRuntimeRequestCandidate,
} from './canonical-rembg-gpu-runtime-request'
import type {
  CanonicalRembgGpuRuntimeRunnerRequest,
} from './canonical-rembg-gpu-runtime-request-types'
import {
  CANONICAL_REMBG_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
  type CanonicalRembgGpuRuntimeResultCandidate,
  type CanonicalRembgGpuRuntimeResultCandidateAssertionInput,
  type CanonicalRembgGpuRuntimeResultCandidateInput,
  type CanonicalRembgGpuRuntimeSuccessWireResponse,
} from './canonical-rembg-gpu-runtime-result-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_MASK_OUTPUT_BYTES = 16_777_216
const MAXIMUM_PROCESS_EVIDENCE_BYTES = 65_536
const MAXIMUM_SOURCE_PIXELS = 16_777_216

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const maskOutputSchema = z.object({
  canonicalOrder: z.literal(0),
  artifactKind: z.literal('mask_image'),
  fileName: z.literal('mask.png'),
  contentType: z.literal('image/png'),
  encodingProfile: z.literal('gray8_mask_png_v1'),
  byteLength: z.number().int().min(67)
    .max(MAXIMUM_MASK_OUTPUT_BYTES),
  contentSha256: digestSchema,
  width: z.number().int().min(1).max(4_096),
  height: z.number().int().min(1).max(4_096),
  minimumMaskValue: z.number().int().min(0).max(254),
  maximumMaskValue: z.number().int().min(1).max(255),
  uniqueMaskValueCount: z.number().int().min(2).max(256),
  transparentPixelCount: z.number().int().min(0)
    .max(MAXIMUM_SOURCE_PIXELS),
  partialPixelCount: z.number().int().min(1)
    .max(MAXIMUM_SOURCE_PIXELS),
  opaquePixelCount: z.number().int().min(0)
    .max(MAXIMUM_SOURCE_PIXELS),
}).strict()

const processEvidenceSchemas = [
  z.object({
    canonicalOrder: z.literal(0),
    evidenceKind: z.literal('mask_analysis_receipt'),
    fileName: z.literal('mask-analysis.json'),
    byteLength: z.number().int().min(2)
      .max(MAXIMUM_PROCESS_EVIDENCE_BYTES),
    contentSha256: digestSchema,
  }).strict(),
  z.object({
    canonicalOrder: z.literal(1),
    evidenceKind: z.literal('mask_qa_measurement_receipt'),
    fileName: z.literal('mask-qa-measurement.json'),
    byteLength: z.number().int().min(2)
      .max(MAXIMUM_PROCESS_EVIDENCE_BYTES),
    contentSha256: digestSchema,
  }).strict(),
] as const

const runtimeWireResponseSchema = z.object({
  schemaVersion: z.literal(
    'canonical-rembg-gpu-runtime-response-v1',
  ),
  ok: z.literal(true),
  status: z.literal(
    'controlled_rembg_gpu_inference_completed',
  ),
  operationId: z.literal(
    'tool.rembg.remove_image_background.v1',
  ),
  admissionDigestSha256: digestSchema,
  requestBindingSha256: digestSchema,
  dispatchIntentId: safeIdSchema,
  runtimeIdentity: z.object({
    rembgVersion: z.literal('2.0.76'),
    onnxRuntimeGpuVersion: z.literal('1.27.0'),
    executionProvider: z.literal('CUDAExecutionProvider'),
    providerCount: z.number().int().min(1).max(8),
    device: z.literal('cuda'),
    runtimeRegion: z.literal('europe-west1'),
    cpuFallbackDisabled: z.literal(true),
  }).strict(),
  outputs: z.tuple([maskOutputSchema]),
  processEvidence: z.tuple(processEvidenceSchemas),
  receiptBoundaries: z.object({
    outputBytesIncluded: z.literal(false),
    sourceBytesIncluded: z.literal(false),
    modelBytesIncluded: z.literal(false),
    pathsIncluded: z.literal(false),
    urlsIncluded: z.literal(false),
    credentialsIncluded: z.literal(false),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
    artifactCommitAuthority: z.literal(false),
    qaPassAuthority: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict()

const BLOCKERS = [
  'canonical_cloud_dispatch_completion_receipt_required',
  'canonical_cloud_dispatch_worker_receipt_required',
  'canonical_gpu_runtime_image_identity_required',
  'canonical_mask_artifact_commit_qa_reconciliation_required',
  'live_service_identity_and_iam_required',
  'official_cloud_gpu_rate_and_attempt_cost_evidence_required',
  'output_bytes_private_reread_required',
] as const

export function assertCanonicalRembgGpuRuntimeWireResponse(
  input: {
    value: unknown
    request: CanonicalRembgGpuRuntimeRunnerRequest
  },
): CanonicalRembgGpuRuntimeSuccessWireResponse {
  const parsed = runtimeWireResponseSchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalid('rembg_gpu_runtime_result_wire_invalid')
  }
  const response =
    parsed.data as CanonicalRembgGpuRuntimeSuccessWireResponse
  const mask = response.outputs[0]
  const pixelCount = mask.width * mask.height
  if (
    response.operationId !== input.request.operationId
    || response.admissionDigestSha256
      !== input.request.admissionDigestSha256
    || response.requestBindingSha256
      !== input.request.requestBindingSha256
    || response.dispatchIntentId
      !== input.request.dispatch.dispatchIntentId
    || response.runtimeIdentity.runtimeRegion
      !== input.request.dispatch.runtimeRegion
    || response.runtimeIdentity.device
      !== input.request.settings.device
    || mask.width !== input.request.source.width
    || mask.height !== input.request.source.height
    || pixelCount > MAXIMUM_SOURCE_PIXELS
    || mask.transparentPixelCount
      + mask.partialPixelCount
      + mask.opaquePixelCount !== pixelCount
    || mask.minimumMaskValue >= mask.maximumMaskValue
  ) {
    throw blocked(
      'rembg_gpu_runtime_result_request_lineage_mismatch',
    )
  }
  return deepFreeze(response)
}

export async function createCanonicalRembgGpuRuntimeResultCandidate(
  input: CanonicalRembgGpuRuntimeResultCandidateInput,
): Promise<CanonicalRembgGpuRuntimeResultCandidate> {
  const requestCandidate =
    await assertCanonicalRembgGpuRuntimeRequestCandidate({
      ...input,
      candidate: input.runtimeRequestCandidate,
    })
  const response = assertCanonicalRembgGpuRuntimeWireResponse({
    value: input.runtimeWireResponse,
    request: requestCandidate.runnerRequest,
  })
  const mask = response.outputs[0]
  const processEvidence = response.processEvidence
  const combinedOutputByteLength =
    mask.byteLength
    + processEvidence.reduce(
      (total, evidence) => total + evidence.byteLength,
      0,
    )
  const identity = {
    admissionId: requestCandidate.identity.admissionId,
    admissionDigestSha256:
      requestCandidate.identity.admissionDigestSha256,
    runtimeRequestCandidateDigestSha256:
      requestCandidate.requestCandidateDigestSha256,
    runtimeRequestBindingSha256:
      requestCandidate.runnerRequest.requestBindingSha256,
    runtimeContractDigestSha256:
      requestCandidate.identity.runtimeContractDigestSha256,
    runtimeSourceDigestSha256:
      requestCandidate.identity.runtimeSourceDigestSha256,
    dispatchIntentId: requestCandidate.identity.dispatchIntentId,
    dispatchBindingHash:
      requestCandidate.identity.dispatchBindingHash,
    attemptPlanHash: requestCandidate.identity.attemptPlanHash,
    approvedSnapshotId:
      requestCandidate.identity.approvedSnapshotId,
    approvedSnapshotHash:
      requestCandidate.identity.approvedSnapshotHash,
    workItemId: requestCandidate.identity.workItemId,
    workItemHash: requestCandidate.identity.workItemHash,
    creditEstimateId: requestCandidate.identity.creditEstimateId,
    creditReservationId:
      requestCandidate.identity.creditReservationId,
    workerLeaseId: requestCandidate.identity.workerLeaseId,
    idempotencyKey: requestCandidate.identity.idempotencyKey,
    sourceFrameArtifactBindingDigestSha256:
      requestCandidate.identity
        .sourceFrameArtifactBindingDigestSha256,
  }
  const outputCandidates = [{
    ...mask,
    requiredQaGates: [
      'mask_edge_quality',
      'mask_subject_coverage',
    ] as const,
    privateArtifactCommitRequired: true as const,
  }] as const
  const processEvidenceCandidates = [
    {
      canonicalOrder: 0 as const,
      evidenceKind: 'mask_analysis_receipt' as const,
      fileName: 'mask-analysis.json' as const,
      byteLength: processEvidence[0].byteLength,
      contentSha256: processEvidence[0].contentSha256,
      customerAsset: false as const,
      immutableAttemptEvidenceRequired: true as const,
    },
    {
      canonicalOrder: 1 as const,
      evidenceKind:
        'mask_qa_measurement_receipt' as const,
      fileName: 'mask-qa-measurement.json' as const,
      byteLength: processEvidence[1].byteLength,
      contentSha256: processEvidence[1].contentSha256,
      customerAsset: false as const,
      immutableAttemptEvidenceRequired: true as const,
    },
  ] as const
  const draft = {
    resultCandidateVersion:
      CANONICAL_REMBG_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
    resultCandidateClass:
      'untrusted_wire_structurally_verified_non_authoritative_gpu_result_candidate' as const,
    identity,
    runtimeWireReceipt: {
      responseDigestSha256: sha256AuthorityValue(response),
      ...response.runtimeIdentity,
      outputCount: 1 as const,
      processEvidenceCount: 2 as const,
      combinedOutputByteLength,
    },
    outputCandidates,
    processEvidenceCandidates,
    canonicalCompletionRequirements: {
      workerReceiptVersion:
        'canonical-cloud-dispatch-worker-receipt-v1' as const,
      completionEvidenceVersion:
        'canonical-cloud-dispatch-worker-completion-evidence-v1' as const,
      completionReceiptVersion:
        'canonical-cloud-dispatch-worker-completion-receipt-v1' as const,
      exactRequestBindingRequired: true as const,
      immutablePrivateArtifactManifestRequired: true as const,
      artifactQaAndReconciliationRequired: true as const,
      downstreamLeaseVerificationRequired: true as const,
    },
    costEvidenceRequirements: {
      evidenceVersion:
        'private-worker-resource-usage-cost-evidence-v1' as const,
      boundary: 'internal_production_cost_only' as const,
      allocatedGpuCount: 1 as const,
      gpuActiveMeasurementRequired: true as const,
      attemptInternalCostEvidenceRequired: true as const,
      officialCloudRateRequiredBeforeProduction: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    summary: {
      exactAdmissionReread: true as const,
      exactRuntimeRequestReread: true as const,
      exactRequestBindingMatched: true as const,
      exactCudaRuntimeShapeMatched: true as const,
      exactMaskOutputShapeMatched: true as const,
      exactProcessEvidenceShapeMatched: true as const,
      sourceDimensionsPreserved: true as const,
      maskPopulationAccountingMatched: true as const,
      maskVariationObserved: true as const,
      outputByteCeilingsMatched: true as const,
      outputBytesIncluded: false as const,
      callerPathsIncluded: false as const,
      callerUrlsIncluded: false as const,
      credentialsIncluded: false as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      candidateOnly: true as const,
      untrustedWireOnly: true as const,
      structuralResultVerificationOnly: true as const,
      canonicalWorkerReceiptVerified: false as const,
      canonicalCompletionReceiptVerified: false as const,
      actualCloudRunExecutionVerified: false as const,
      runtimeImageIdentityVerified: false as const,
      liveServiceIdentityAndIamVerified: false as const,
      outputBytesRereadVerified: false as const,
      outputArtifactCommitAuthority: false as const,
      maskEdgeQualityQaAuthority: false as const,
      maskSubjectCoverageQaAuthority: false as const,
      attemptInternalCostEvidenceVerified: false as const,
      customerCostAuthority: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionReady: false as const,
    },
  }
  return deepFreeze({
    ...draft,
    resultCandidateDigestSha256: sha256AuthorityValue(draft),
  })
}

export async function assertCanonicalRembgGpuRuntimeResultCandidate(
  input: CanonicalRembgGpuRuntimeResultCandidateAssertionInput,
): Promise<CanonicalRembgGpuRuntimeResultCandidate> {
  const expected =
    await createCanonicalRembgGpuRuntimeResultCandidate(input)
  if (
    stableAuthorityStringify(input.resultCandidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('rembg_gpu_runtime_result_candidate_mismatch')
  }
  return expected
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 400)
}

function blocked(code: string): ApiError {
  return new ApiError('VALIDATION_FAILED', code, 409)
}
