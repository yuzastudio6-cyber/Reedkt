import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalFasterWhisperGpuRuntimeRequestCandidate,
} from './canonical-faster-whisper-gpu-runtime-request'
import type {
  CanonicalFasterWhisperGpuRuntimeRunnerRequest,
} from './canonical-faster-whisper-gpu-runtime-request-types'
import {
  CANONICAL_FASTER_WHISPER_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
  type CanonicalFasterWhisperGpuRuntimeResultCandidate,
  type CanonicalFasterWhisperGpuRuntimeResultCandidateAssertionInput,
  type CanonicalFasterWhisperGpuRuntimeResultCandidateInput,
  type CanonicalFasterWhisperGpuRuntimeSuccessWireResponse,
} from './canonical-faster-whisper-gpu-runtime-result-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAXIMUM_SINGLE_OUTPUT_BYTES = 33_554_432
const MAXIMUM_COMBINED_OUTPUT_BYTES = 67_108_864

const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const outputSchemas = [
  z.object({
    canonicalOrder: z.literal(0),
    artifactKind: z.literal('transcript_json'),
    fileName: z.literal('transcript.json'),
    byteLength: z.number().int().min(2)
      .max(MAXIMUM_SINGLE_OUTPUT_BYTES),
    contentSha256: digestSchema,
  }).strict(),
  z.object({
    canonicalOrder: z.literal(1),
    artifactKind: z.literal('caption_segments_json'),
    fileName: z.literal('caption-segments.json'),
    byteLength: z.number().int().min(2)
      .max(MAXIMUM_SINGLE_OUTPUT_BYTES),
    contentSha256: digestSchema,
  }).strict(),
  z.object({
    canonicalOrder: z.literal(2),
    artifactKind: z.literal('analysis_report'),
    fileName: z.literal('analysis-report.json'),
    byteLength: z.number().int().min(2)
      .max(MAXIMUM_SINGLE_OUTPUT_BYTES),
    contentSha256: digestSchema,
  }).strict(),
] as const

const runtimeWireResponseSchema = z.object({
  schemaVersion: z.literal(
    'canonical-faster-whisper-gpu-runtime-response-v1',
  ),
  ok: z.literal(true),
  status: z.literal(
    'controlled_faster_whisper_gpu_inference_completed',
  ),
  operationId: z.literal(
    'tool.faster_whisper.transcribe_private_audio.v1',
  ),
  admissionDigestSha256: digestSchema,
  requestBindingSha256: digestSchema,
  dispatchIntentId: safeIdSchema,
  runtimeIdentity: z.object({
    fasterWhisperVersion: z.literal('1.2.1'),
    ctranslate2Version: z.literal('4.6.2'),
    cudaDeviceCount: z.number().int().min(1).max(8),
    device: z.literal('cuda'),
    computeType: z.literal('float16'),
    runtimeRegion: z.literal('europe-west1'),
  }).strict(),
  outputs: z.tuple(outputSchemas),
  receiptBoundaries: z.object({
    outputBytesIncluded: z.literal(false),
    transcriptTextIncluded: z.literal(false),
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
  'canonical_output_artifact_commit_qa_reconciliation_required',
  'live_service_identity_and_iam_required',
  'official_cloud_gpu_rate_and_attempt_cost_evidence_required',
  'output_bytes_private_reread_required',
] as const

export function assertCanonicalFasterWhisperGpuRuntimeWireResponse(
  input: {
    value: unknown
    request: CanonicalFasterWhisperGpuRuntimeRunnerRequest
  },
): CanonicalFasterWhisperGpuRuntimeSuccessWireResponse {
  const parsed = runtimeWireResponseSchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalid(
      'faster_whisper_gpu_runtime_result_wire_invalid',
    )
  }
  const response =
    parsed.data as CanonicalFasterWhisperGpuRuntimeSuccessWireResponse
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
    || response.runtimeIdentity.computeType
      !== input.request.settings.computeType
  ) {
    throw blocked(
      'faster_whisper_gpu_runtime_result_request_lineage_mismatch',
    )
  }
  return deepFreeze(response)
}

export async function createCanonicalFasterWhisperGpuRuntimeResultCandidate(
  input: CanonicalFasterWhisperGpuRuntimeResultCandidateInput,
): Promise<CanonicalFasterWhisperGpuRuntimeResultCandidate> {
  const requestCandidate =
    await assertCanonicalFasterWhisperGpuRuntimeRequestCandidate({
      ...input,
      candidate: input.runtimeRequestCandidate,
    })
  const response =
    assertCanonicalFasterWhisperGpuRuntimeWireResponse({
      value: input.runtimeWireResponse,
      request: requestCandidate.runnerRequest,
    })
  const combinedOutputByteLength = response.outputs.reduce(
    (total, output) => total + output.byteLength,
    0,
  )
  if (combinedOutputByteLength > MAXIMUM_COMBINED_OUTPUT_BYTES) {
    throw invalid(
      'faster_whisper_gpu_runtime_result_combined_output_exceeds_ceiling',
    )
  }
  const outputCandidates = [
    {
      canonicalOrder: 0 as const,
      artifactKind: 'transcript_json' as const,
      fileName: 'transcript.json' as const,
      contentType: 'application/json' as const,
      encodingProfile:
        'faster_whisper_word_timed_transcript_json_v1' as const,
      byteLength: response.outputs[0].byteLength,
      contentSha256: response.outputs[0].contentSha256,
      requiredQaGates: ['transcript_alignment'] as const,
      privateArtifactCommitRequired: true as const,
    },
    {
      canonicalOrder: 1 as const,
      artifactKind: 'caption_segments_json' as const,
      fileName: 'caption-segments.json' as const,
      contentType: 'application/json' as const,
      encodingProfile:
        'faster_whisper_caption_segments_json_v1' as const,
      byteLength: response.outputs[1].byteLength,
      contentSha256: response.outputs[1].contentSha256,
      requiredQaGates: ['caption_timing'] as const,
      privateArtifactCommitRequired: true as const,
    },
    {
      canonicalOrder: 2 as const,
      artifactKind: 'analysis_report' as const,
      fileName: 'analysis-report.json' as const,
      contentType: 'application/json' as const,
      encodingProfile:
        'faster_whisper_transcription_analysis_report_json_v1' as const,
      byteLength: response.outputs[2].byteLength,
      contentSha256: response.outputs[2].contentSha256,
      requiredQaGates: [] as const,
      privateArtifactCommitRequired: true as const,
    },
  ] as const
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
  }
  const draft = {
    resultCandidateVersion:
      CANONICAL_FASTER_WHISPER_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
    resultCandidateClass:
      'untrusted_wire_structurally_verified_non_authoritative_gpu_result_candidate' as const,
    identity,
    runtimeWireReceipt: {
      responseDigestSha256: sha256AuthorityValue(response),
      ...response.runtimeIdentity,
      outputCount: 3 as const,
      combinedOutputByteLength,
    },
    outputCandidates,
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
      exactThreeOutputShapeMatched: true as const,
      outputByteCeilingsMatched: true as const,
      outputBytesIncluded: false as const,
      transcriptTextIncluded: false as const,
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
      transcriptAlignmentQaAuthority: false as const,
      captionTimingQaAuthority: false as const,
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

export async function assertCanonicalFasterWhisperGpuRuntimeResultCandidate(
  input: CanonicalFasterWhisperGpuRuntimeResultCandidateAssertionInput,
): Promise<CanonicalFasterWhisperGpuRuntimeResultCandidate> {
  const expected =
    await createCanonicalFasterWhisperGpuRuntimeResultCandidate(
      input,
    )
  if (
    stableAuthorityStringify(input.resultCandidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked(
      'faster_whisper_gpu_runtime_result_candidate_mismatch',
    )
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
