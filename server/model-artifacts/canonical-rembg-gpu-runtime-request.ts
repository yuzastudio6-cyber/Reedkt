import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate,
} from './canonical-rembg-cloud-run-gpu-execution-admission'
import {
  getCanonicalRembgGpuRuntimeContract,
} from './canonical-rembg-gpu-runtime-contract'
import {
  CANONICAL_REMBG_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
  type CanonicalRembgGpuRuntimeRequestCandidate,
  type CanonicalRembgGpuRuntimeRequestCandidateAssertionInput,
  type CanonicalRembgGpuRuntimeRequestCandidateInput,
  type CanonicalRembgGpuRuntimeRunnerRequest,
} from './canonical-rembg-gpu-runtime-request-types'

const BLOCKERS = [
  'canonical_gpu_worker_operation_router_execution_required',
  'cloud_run_runtime_image_not_qualified',
  'private_source_frame_mount_not_materialized',
  'read_only_model_mount_not_materialized',
  'runtime_output_artifact_sink_not_materialized',
  'worker_dispatch_not_authorized',
] as const

const EXPECTED_OUTPUTS = [{
  canonicalOrder: 0 as const,
  artifactKind: 'mask_image' as const,
  fileName: 'mask.png' as const,
  contentType: 'image/png' as const,
  encodingProfile: 'gray8_mask_png_v1' as const,
}] as const

const PROCESS_EVIDENCE = [
  {
    canonicalOrder: 0 as const,
    evidenceKind: 'mask_analysis_receipt' as const,
    fileName: 'mask-analysis.json' as const,
    digestOnly: true as const,
  },
  {
    canonicalOrder: 1 as const,
    evidenceKind: 'mask_qa_measurement_receipt' as const,
    fileName: 'mask-qa-measurement.json' as const,
    digestOnly: true as const,
  },
] as const

export async function createCanonicalRembgGpuRuntimeRequestCandidate(
  input: CanonicalRembgGpuRuntimeRequestCandidateInput,
): Promise<CanonicalRembgGpuRuntimeRequestCandidate> {
  const admission =
    assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate(input)
  const runtimeContract =
    await getCanonicalRembgGpuRuntimeContract()
  assertAdmissionRuntimeCompatibility({
    admission,
    runtimeContract,
  })
  const runnerRequest = createRunnerRequest({
    admission,
    runtimeContract,
  })
  const serializedRunnerRequest =
    stableAuthorityStringify(runnerRequest)
  if (
    Buffer.byteLength(serializedRunnerRequest, 'utf8')
      > runtimeContract.runtimeProtocol.maximumRequestBytes
  ) {
    throw invalid('rembg_gpu_runtime_request_exceeds_ceiling')
  }
  const identity = {
    admissionId: admission.admissionId,
    admissionDigestSha256: admission.admissionDigestSha256,
    runtimeContractDigestSha256:
      runtimeContract.contractDigestSha256,
    runtimeSourceDigestSha256:
      runtimeContract.sourceDigestSha256,
    approvedSnapshotId: admission.identity.approvedSnapshotId,
    approvedSnapshotHash:
      admission.identity.approvedSnapshotHash,
    workItemId: admission.identity.workItemId,
    workItemHash: admission.identity.workItemHash,
    creditEstimateId: admission.identity.creditEstimateId,
    creditReservationId:
      admission.identity.creditReservationId,
    workerLeaseId: admission.identity.workerLeaseId,
    idempotencyKey: admission.identity.idempotencyKey,
    dispatchIntentId: admission.identity.dispatchIntentId,
    dispatchBindingHash:
      admission.identity.dispatchBindingHash,
    attemptPlanHash: admission.identity.attemptPlanHash,
    sourceFrameArtifactBindingDigestSha256:
      admission.identity
        .sourceFrameArtifactBindingDigestSha256,
  }
  const draft = {
    requestCandidateVersion:
      CANONICAL_REMBG_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
    requestCandidateClass:
      'server_derived_non_dispatching_gpu_runtime_request_candidate' as const,
    identity,
    runnerRequest,
    serializedRunnerRequestByteLength:
      Buffer.byteLength(serializedRunnerRequest, 'utf8'),
    runnerRequestDigestSha256:
      sha256AuthorityValue(runnerRequest),
    expectedOutputs: EXPECTED_OUTPUTS,
    processEvidence: PROCESS_EVIDENCE,
    summary: {
      exactAdmissionReread: true as const,
      exactRuntimeSourceReread: true as const,
      exactModelArtifactMatched: true as const,
      exactPrivateSourceFrameExpectationMatched: true as const,
      exactDecodedRgbaLineageMatched: true as const,
      exactCudaOnlySettingsMatched: true as const,
      exactL4RegionMatched: true as const,
      requestContainsCallerPaths: false as const,
      requestContainsCallerUrls: false as const,
      requestContainsCallerBytes: false as const,
      requestContainsCredentials: false as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      candidateOnly: true as const,
      serverDerived: true as const,
      approvedPackageRereadStillRequiredAtExecution: true as const,
      approvedSnapshotRereadStillRequiredAtExecution: true as const,
      workerLeaseRereadStillRequiredAtExecution: true as const,
      modelArtifactBundleRereadStillRequiredAtExecution:
        true as const,
      privateSourceFrameArtifactRereadStillRequiredAtExecution:
        true as const,
      runnerInvoked: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      outputArtifactCommitAuthority: false as const,
      maskEdgeQualityQaAuthority: false as const,
      maskSubjectCoverageQaAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      customerCostAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionReady: false as const,
    },
  }
  return deepFreeze({
    ...draft,
    requestCandidateDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function assertCanonicalRembgGpuRuntimeRequestCandidate(
  input: CanonicalRembgGpuRuntimeRequestCandidateAssertionInput,
): Promise<CanonicalRembgGpuRuntimeRequestCandidate> {
  const expected =
    await createCanonicalRembgGpuRuntimeRequestCandidate(input)
  if (
    stableAuthorityStringify(input.candidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('rembg_gpu_runtime_request_candidate_mismatch')
  }
  return expected
}

function createRunnerRequest(input: {
  admission: ReturnType<
    typeof assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate
  >
  runtimeContract: Awaited<
    ReturnType<typeof getCanonicalRembgGpuRuntimeContract>
  >
}): CanonicalRembgGpuRuntimeRunnerRequest {
  const source = input.admission.source
  const requestWithoutBinding: Omit<
    CanonicalRembgGpuRuntimeRunnerRequest,
    'requestBindingSha256'
  > = {
    schemaVersion: 'canonical-rembg-gpu-runtime-request-v1',
    operationId: 'tool.rembg.remove_image_background.v1',
    admissionDigestSha256:
      input.admission.admissionDigestSha256,
    dispatch: {
      dispatchIntentId:
        input.admission.identity.dispatchIntentId,
      dispatchBindingHash:
        input.admission.identity.dispatchBindingHash,
      attemptPlanHash:
        input.admission.identity.attemptPlanHash,
      runtimeRegion: 'europe-west1',
    },
    source: {
      artifactId: source.frameArtifactId,
      contentSha256: source.frameArtifactSha256,
      byteLength: source.frameArtifactByteLength,
      contentType: 'image/png',
      width: source.frameWidth,
      height: source.frameHeight,
      decodedRgbaSha256: source.frameDecodedRgbaSha256,
      opaquePixelCount: source.frameOpaquePixelCount,
    },
    modelArtifacts:
      input.runtimeContract.fixedFileLayout.modelFiles,
    settings: input.admission.settings,
  }
  return {
    ...requestWithoutBinding,
    requestBindingSha256:
      sha256AuthorityValue(requestWithoutBinding),
  }
}

function assertAdmissionRuntimeCompatibility(input: {
  admission: ReturnType<
    typeof assertCanonicalRembgCloudRunGpuExecutionAdmissionCandidate
  >
  runtimeContract: Awaited<
    ReturnType<typeof getCanonicalRembgGpuRuntimeContract>
  >
}): void {
  const admission = input.admission
  const runtime = input.runtimeContract
  const expectedModel = runtime.fixedFileLayout.modelFiles[0]
  const artifact = admission.modelArtifactBinding
  if (
    artifact.artifactCount !== 1
    || artifact.slotId !== expectedModel.slotId
    || artifact.byteLength !== expectedModel.byteLength
    || artifact.contentSha256 !== expectedModel.contentSha256
    || artifact.consumerScope !== 'rembg.private-inference'
    || artifact.executionTarget !== 'google_cloud_run_gpu'
    || artifact.modelAccelerator !== 'cuda'
    || artifact.cpuFallbackAllowed
    || admission.settings.device !== runtime.runtimeProtocol.device
    || admission.settings.runtimeDownloadAllowed
    || admission.settings.networkFetchAllowed
  ) {
    throw blocked('rembg_gpu_admission_runtime_contract_mismatch')
  }
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
