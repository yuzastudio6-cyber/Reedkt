import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalComfyUiGpuRuntimeRequestCandidate,
} from './canonical-comfyui-gpu-runtime-request'
import type {
  CanonicalComfyUiGpuRuntimeRunnerRequest,
} from './canonical-comfyui-gpu-runtime-request-types'
import {
  CANONICAL_COMFYUI_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
  type CanonicalComfyUiGpuRuntimeResultCandidate,
  type CanonicalComfyUiGpuRuntimeResultCandidateAssertionInput,
  type CanonicalComfyUiGpuRuntimeResultCandidateInput,
  type CanonicalComfyUiGpuRuntimeSuccessWireResponse,
} from './canonical-comfyui-gpu-runtime-result-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const digestSchema = z.string().regex(DIGEST_PATTERN)
const safeIdSchema = z.string().regex(SAFE_ID_PATTERN)
  .refine((value) => !value.includes('..'))

const runtimeWireResponseSchema = z.object({
  schemaVersion: z.literal(
    'canonical-comfyui-gpu-runtime-response-v1',
  ),
  ok: z.literal(true),
  status: z.literal(
    'controlled_comfyui_gpu_generation_completed',
  ),
  operationId: z.literal(
    'tool.comfyui.generate_controlled_image.v1',
  ),
  admissionDigestSha256: digestSchema,
  requestBindingSha256: digestSchema,
  dispatchIntentId: safeIdSchema,
  runtimeIdentity: z.object({
    comfyUiSourceRevision: z.literal(
      '093d571b83e7a79833200e199b46b9f5a62217f9',
    ),
    ipAdapterSourceRevision: z.literal(
      'b188a6cb39b512a9c6da7235b880af42c78ccd0d',
    ),
    controlNetAuxSourceRevision: z.literal(
      'e8b689a513c3e6b63edc44066560ca5919c0576e',
    ),
    wheelManifestSha256: z.literal(
      'cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9',
    ),
    torchVersion: z.literal('2.5.1+cu124'),
    cudaBuild: z.literal('12.4'),
    cudaDeviceCount: z.literal(1),
    cudaDeviceName: z.literal('NVIDIA L4'),
    accelerator: z.literal('nvidia_l4'),
    device: z.literal('cuda'),
    runtimeRegion: z.literal('europe-west1'),
    modelArtifactCount: z.literal(5),
    modelArtifactByteLength: z.literal(11_700_367_157),
    allModelsVerifiedBeforeAndAfterInference: z.literal(true),
    sam2ImportDenied: z.literal(true),
    cpuFallbackDisabled: z.literal(true),
  }).strict(),
  outputs: z.tuple([
    z.object({
      canonicalOrder: z.literal(0),
      artifactKind: z.literal('generated_opaque_png'),
      fileName: z.literal('generated.png'),
      contentType: z.literal('image/png'),
      encodingProfile: z.literal(
        'opaque_rgb_or_rgba_png_v1',
      ),
      width: z.number().int().min(256).max(4_096),
      height: z.number().int().min(256).max(4_096),
      byteLength: z.number().int().min(33).max(67_108_864),
      contentSha256: digestSchema,
      decodedRgbaSha256: digestSchema,
      opaquePixelCount: z.number().int().positive()
        .max(8_294_400),
    }).strict(),
  ]),
  processEvidence: z.tuple([
    z.object({
      canonicalOrder: z.literal(0),
      processClass: z.literal(
        'fixed_supervised_comfyui_host',
      ),
      startedAtUnixMilliseconds:
        z.number().int().nonnegative(),
      finishedAtUnixMilliseconds:
        z.number().int().nonnegative(),
      promptIdSha256: digestSchema,
      stdoutByteLength:
        z.number().int().nonnegative().max(262_144),
      stdoutSha256: digestSchema,
      stderrByteLength:
        z.number().int().nonnegative().max(262_144),
      stderrSha256: digestSchema,
      gracefulShutdownObserved: z.literal(true),
      stopEscalationRequired: z.literal(false),
    }).strict(),
  ]),
  receiptBoundaries: z.object({
    outputBytesIncluded: z.literal(false),
    promptTextIncluded: z.literal(false),
    modelBytesIncluded: z.literal(false),
    inputImageBytesIncluded: z.literal(false),
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
  'signed_runtime_image_and_exact_five_model_mount_reread_required',
  'output_bytes_private_reread_and_artifact_commit_required',
  'alpha_continuity_fact_composite_qa_and_private_review_required',
  'official_l4_attempt_resource_cost_evidence_required',
] as const

export function assertCanonicalComfyUiGpuRuntimeWireResponse(
  input: {
    value: unknown
    request: CanonicalComfyUiGpuRuntimeRunnerRequest
  },
): CanonicalComfyUiGpuRuntimeSuccessWireResponse {
  const parsed = runtimeWireResponseSchema.safeParse(input.value)
  if (!parsed.success) {
    throw invalid('comfyui_gpu_runtime_result_wire_invalid')
  }
  const response =
    parsed.data as CanonicalComfyUiGpuRuntimeSuccessWireResponse
  const output = response.outputs[0]
  const process = response.processEvidence[0]
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
    || output.width !== input.request.output.width
    || output.height !== input.request.output.height
    || output.opaquePixelCount !== output.width * output.height
    || process.finishedAtUnixMilliseconds
      < process.startedAtUnixMilliseconds
    || process.finishedAtUnixMilliseconds
      - process.startedAtUnixMilliseconds > 2 * 60 * 60 * 1_000
  ) {
    throw blocked(
      'comfyui_gpu_runtime_result_request_lineage_mismatch',
    )
  }
  return deepFreeze(response)
}

export async function createCanonicalComfyUiGpuRuntimeResultCandidate(
  input: CanonicalComfyUiGpuRuntimeResultCandidateInput,
): Promise<CanonicalComfyUiGpuRuntimeResultCandidate> {
  const requestCandidate =
    await assertCanonicalComfyUiGpuRuntimeRequestCandidate({
      ...input,
      candidate: input.runtimeRequestCandidate,
    })
  const response = assertCanonicalComfyUiGpuRuntimeWireResponse({
    value: input.runtimeWireResponse,
    request: requestCandidate.runnerRequest,
  })
  const output = response.outputs[0]
  const identity = {
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
    dispatchIntentId:
      requestCandidate.identity.dispatchIntentId,
    dispatchBindingHash:
      requestCandidate.identity.dispatchBindingHash,
    attemptPlanHash:
      requestCandidate.identity.attemptPlanHash,
    requestBindingId:
      requestCandidate.identity.requestBindingId,
    requestBindingDigestSha256:
      requestCandidate.identity.requestBindingDigestSha256,
    approvedSnapshotId:
      requestCandidate.identity.approvedSnapshotId,
    approvedSnapshotHash:
      requestCandidate.identity.approvedSnapshotHash,
    workItemId: requestCandidate.identity.workItemId,
    workItemHash: requestCandidate.identity.workItemHash,
    outputKey: requestCandidate.identity.outputKey,
    plannedAssetManifestEntryId:
      requestCandidate.identity.plannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      requestCandidate.identity
        .confirmedOutputFrameExpectationDigestSha256,
  }
  const draft = {
    resultCandidateVersion:
      CANONICAL_COMFYUI_GPU_RUNTIME_RESULT_CANDIDATE_VERSION,
    resultCandidateClass:
      'untrusted_wire_structurally_verified_non_authoritative_comfyui_gpu_result_candidate' as const,
    identity,
    runtimeWireReceipt: {
      responseDigestSha256: sha256AuthorityValue(response),
      comfyUiSourceRevision:
        response.runtimeIdentity.comfyUiSourceRevision,
      ipAdapterSourceRevision:
        response.runtimeIdentity.ipAdapterSourceRevision,
      controlNetAuxSourceRevision:
        response.runtimeIdentity.controlNetAuxSourceRevision,
      wheelManifestSha256:
        response.runtimeIdentity.wheelManifestSha256,
      torchVersion: response.runtimeIdentity.torchVersion,
      cudaBuild: response.runtimeIdentity.cudaBuild,
      cudaDeviceName:
        response.runtimeIdentity.cudaDeviceName,
      outputCount: 1 as const,
      processEvidenceCount: 1 as const,
    },
    outputCandidate: {
      ...output,
      privateArtifactCommitRequired: true as const,
      alphaDisposition:
        'opaque_output_requires_exact_downstream_alpha_or_full_frame_qa' as const,
      remotionFinalCanvasRequired: true as const,
    },
    costEvidenceRequirements: {
      evidenceVersion:
        'private-worker-resource-usage-cost-evidence-v1' as const,
      boundary: 'internal_production_cost_only' as const,
      allocatedGpuCount: 1 as const,
      sharedCapabilityCount: 5 as const,
      representedGpuCapabilitiesShareOneAttempt:
        true as const,
      gpuActiveMeasurementRequired: true as const,
      attemptInternalCostEvidenceRequired: true as const,
      customerPriceIncluded: false as const,
      customerCreditsIncluded: false as const,
      serviceFeeIncluded: false as const,
    },
    summary: {
      exactRuntimeRequestReread: true as const,
      exactRequestBindingMatched: true as const,
      exactSelectedSceneLineageMatched: true as const,
      exactCudaL4RuntimeShapeMatched: true as const,
      exactFiveModelBeforeAfterVerificationClaimed:
        true as const,
      exactOpaquePngShapeMatched: true as const,
      exactSupervisedProcessShapeMatched: true as const,
      outputBytesIncluded: false as const,
      promptTextIncluded: false as const,
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
      modelMountRereadVerified: false as const,
      outputBytesRereadVerified: false as const,
      outputArtifactCommitAuthority: false as const,
      outputQaAndPrivateReviewAuthority: false as const,
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

export async function assertCanonicalComfyUiGpuRuntimeResultCandidate(
  input: CanonicalComfyUiGpuRuntimeResultCandidateAssertionInput,
): Promise<CanonicalComfyUiGpuRuntimeResultCandidate> {
  const expected =
    await createCanonicalComfyUiGpuRuntimeResultCandidate(input)
  if (
    stableAuthorityStringify(input.resultCandidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('comfyui_gpu_runtime_result_candidate_mismatch')
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
    requiredGate:
      'canonical_comfyui_gpu_runtime_result_candidate',
  })
}
