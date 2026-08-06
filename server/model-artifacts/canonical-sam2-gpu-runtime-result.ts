import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalSam2GpuRuntimeRequestCandidate,
} from './canonical-sam2-gpu-runtime-request'
import type {
  CanonicalSam2GpuRuntimeRunnerRequest,
} from './canonical-sam2-gpu-runtime-request-types'
import {
  CANONICAL_SAM2_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
  type CanonicalSam2GpuRuntimeResultCandidate,
  type CanonicalSam2GpuRuntimeResultCandidateAssertionInput,
  type CanonicalSam2GpuRuntimeResultCandidateInput,
  type CanonicalSam2GpuRuntimeSuccessWireResponse,
} from './canonical-sam2-gpu-runtime-result-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_MASK_OUTPUT_BYTES = 4_294_901_760
const MAXIMUM_JSON_OUTPUT_BYTES = 1_048_576
const MAXIMUM_SOURCE_PIXELS = 67_108_864

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))
const ppmSchema = z.number().int().min(0).max(1_000_000)

const maskOutputSchema = z.object({
  canonicalOrder: z.literal(0),
  artifactKind: z.literal('mask_sequence'),
  fileName: z.literal('mask-sequence.mkv'),
  contentType: z.literal('video/x-matroska'),
  encodingProfile: z.literal(
    'gray8_ffv1_matroska_mask_sequence_v1',
  ),
  byteLength: z.number().int().positive()
    .max(MAXIMUM_MASK_OUTPUT_BYTES),
  contentSha256: digestSchema,
  width: z.number().int().min(16).max(8_192),
  height: z.number().int().min(16).max(8_192),
  frameCount: z.number().int().min(2).max(18_000),
  fpsNumerator: z.number().int().positive().max(240_000),
  fpsDenominator: z.number().int().positive().max(10_000),
  activeFrameCount: z.number().int().min(1).max(18_000),
  minimumCoveragePpm: ppmSchema,
  maximumCoveragePpm: ppmSchema,
  meanCoveragePpm: ppmSchema,
  meanTemporalIouPpm: ppmSchema,
  centroidMotionPpm: z.number().int().nonnegative()
    .max(18_000_000_000),
}).strict()

const analysisOutputSchema = z.object({
  canonicalOrder: z.literal(1),
  artifactKind: z.literal('analysis_report'),
  fileName: z.literal('tracking-analysis.json'),
  contentType: z.literal('application/json'),
  encodingProfile: z.literal(
    'sam2_tracking_analysis_report_json_v1',
  ),
  byteLength: z.number().int().min(2)
    .max(MAXIMUM_JSON_OUTPUT_BYTES),
  contentSha256: digestSchema,
}).strict()

const qaOutputSchema = z.object({
  canonicalOrder: z.literal(2),
  artifactKind: z.literal('qa_report'),
  fileName: z.literal('mask-qa-measurement.json'),
  contentType: z.literal('application/json'),
  encodingProfile: z.literal(
    'sam2_mask_qa_measurement_report_json_v1',
  ),
  byteLength: z.number().int().min(2)
    .max(MAXIMUM_JSON_OUTPUT_BYTES),
  contentSha256: digestSchema,
}).strict()

const runtimeWireResponseSchema = z.object({
  schemaVersion: z.literal(
    'canonical-sam2-gpu-runtime-response-v1',
  ),
  ok: z.literal(true),
  status: z.literal('controlled_sam2_gpu_inference_completed'),
  operationId: z.literal(
    'tool.sam2.segment_and_track_subject.v1',
  ),
  admissionDigestSha256: digestSchema,
  requestBindingSha256: digestSchema,
  dispatchIntentId: safeIdSchema,
  runtimeIdentity: z.object({
    sam2DistributionVersion: z.literal('1.0'),
    sam2SourceRevision: z.literal(
      '2b90b9f5ceec907a1c18123530e92e794ad901a4',
    ),
    sam2ConfigSha256: z.literal(
      '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55',
    ),
    torchVersion: z.literal('2.5.1+cu124'),
    torchvisionVersion: z.literal('0.20.1+cu124'),
    cudaBuild: z.literal('12.4'),
    cudaDeviceCount: z.literal(1),
    accelerator: z.literal('nvidia_l4'),
    device: z.literal('cuda'),
    runtimeRegion: z.literal('europe-west1'),
    checkpointLoaded: z.literal(true),
    cpuFallbackDisabled: z.literal(true),
  }).strict(),
  outputs: z.tuple([
    maskOutputSchema,
    analysisOutputSchema,
    qaOutputSchema,
  ]),
  receiptBoundaries: z.object({
    outputBytesIncluded: z.literal(false),
    sourceBytesIncluded: z.literal(false),
    modelBytesIncluded: z.literal(false),
    promptCoordinatesIncluded: z.literal(false),
    pathsIncluded: z.literal(false),
    urlsIncluded: z.literal(false),
    credentialsIncluded: z.literal(false),
    cpuFallbackAllowed: z.literal(false),
    runtimeDownloadAllowed: z.literal(false),
    networkFetchAllowed: z.literal(false),
    artifactCommitAuthority: z.literal(false),
    qaPassAuthority: z.literal(false),
    customerCostAuthority: z.literal(false),
    productionReady: z.literal(false),
  }).strict(),
}).strict()

const BLOCKERS = [
  'canonical_cloud_dispatch_worker_and_completion_receipts_required',
  'signed_runtime_image_and_checkpoint_mount_reread_required',
  'output_bytes_private_reread_and_artifact_commit_required',
  'mask_edge_temporal_coverage_qa_and_private_review_required',
  'official_l4_attempt_resource_cost_evidence_required',
] as const

export function assertCanonicalSam2GpuRuntimeWireResponse(
  input: {
    value: unknown
    request: CanonicalSam2GpuRuntimeRunnerRequest
  },
): CanonicalSam2GpuRuntimeSuccessWireResponse {
  const parsed = runtimeWireResponseSchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalid('sam2_gpu_runtime_result_wire_invalid')
  }
  const response =
    parsed.data as CanonicalSam2GpuRuntimeSuccessWireResponse
  const mask = response.outputs[0]
  const source = input.request.source
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
    || mask.width !== source.width
    || mask.height !== source.height
    || mask.frameCount !== source.frameCount
    || mask.fpsNumerator !== source.fpsNumerator
    || mask.fpsDenominator !== source.fpsDenominator
    || mask.activeFrameCount > mask.frameCount
    || mask.minimumCoveragePpm > mask.meanCoveragePpm
    || mask.meanCoveragePpm > mask.maximumCoveragePpm
    || mask.width * mask.height > MAXIMUM_SOURCE_PIXELS
  ) {
    throw blocked(
      'sam2_gpu_runtime_result_request_lineage_mismatch',
    )
  }
  return deepFreeze(response)
}

export async function createCanonicalSam2GpuRuntimeResultCandidate(
  input: CanonicalSam2GpuRuntimeResultCandidateInput,
): Promise<CanonicalSam2GpuRuntimeResultCandidate> {
  const requestCandidate =
    await assertCanonicalSam2GpuRuntimeRequestCandidate({
      ...input,
      candidate: input.runtimeRequestCandidate,
    })
  const response = assertCanonicalSam2GpuRuntimeWireResponse({
    value: input.runtimeWireResponse,
    request: requestCandidate.runnerRequest,
  })
  const outputs = response.outputs
  const combinedOutputByteLength = outputs.reduce(
    (total, output) => total + output.byteLength,
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
    sourceExpectationDigestSha256:
      requestCandidate.identity.sourceExpectationDigestSha256,
    subjectPromptDigestSha256:
      requestCandidate.identity.subjectPromptDigestSha256,
  }
  const outputCandidates = [
    {
      ...outputs[0],
      requiredQaGates: [
        'mask_edge_quality',
        'mask_temporal_stability',
        'mask_subject_coverage',
      ] as const,
      privateArtifactCommitRequired: true as const,
    },
    {
      ...outputs[1],
      customerAsset: false as const,
      immutableAttemptEvidenceRequired: true as const,
    },
    {
      ...outputs[2],
      customerAsset: false as const,
      immutableAttemptEvidenceRequired: true as const,
    },
  ] as const
  const draft = {
    resultCandidateVersion:
      CANONICAL_SAM2_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
    resultCandidateClass:
      'untrusted_wire_structurally_verified_non_authoritative_sam2_gpu_result_candidate' as const,
    identity,
    runtimeWireReceipt: {
      responseDigestSha256: sha256AuthorityValue(response),
      ...response.runtimeIdentity,
      outputCount: 3 as const,
      combinedOutputByteLength,
    },
    outputCandidates,
    costEvidenceRequirements: {
      evidenceVersion:
        'private-worker-resource-usage-cost-evidence-v1' as const,
      boundary: 'internal_production_cost_only' as const,
      allocatedGpuCount: 1 as const,
      gpuActiveMeasurementRequired: true as const,
      attemptInternalCostEvidenceRequired: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    summary: {
      exactAdmissionReread: true as const,
      exactRuntimeRequestReread: true as const,
      exactRequestBindingMatched: true as const,
      exactCudaL4RuntimeShapeMatched: true as const,
      exactMaskSequenceShapeMatched: true as const,
      sourceDimensionsAndTimingPreserved: true as const,
      temporalMeasurementsPresent: true as const,
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
      checkpointMountRereadVerified: false as const,
      outputBytesRereadVerified: false as const,
      outputArtifactCommitAuthority: false as const,
      maskEdgeQualityQaAuthority: false as const,
      maskTemporalStabilityQaAuthority: false as const,
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
    resultCandidateDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function assertCanonicalSam2GpuRuntimeResultCandidate(
  input: CanonicalSam2GpuRuntimeResultCandidateAssertionInput,
): Promise<CanonicalSam2GpuRuntimeResultCandidate> {
  const expected =
    await createCanonicalSam2GpuRuntimeResultCandidate(input)
  if (
    stableAuthorityStringify(input.resultCandidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('sam2_gpu_runtime_result_candidate_mismatch')
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
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate: 'canonical_sam2_gpu_runtime_result',
  })
}
