import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate,
} from './canonical-sam2-cloud-run-gpu-execution-admission'
import {
  getCanonicalSam2GpuRuntimeContract,
} from './canonical-sam2-gpu-runtime-contract'
import {
  CANONICAL_SAM2_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
  type CanonicalSam2GpuRuntimeRequestCandidate,
  type CanonicalSam2GpuRuntimeRequestCandidateAssertionInput,
  type CanonicalSam2GpuRuntimeRequestCandidateInput,
  type CanonicalSam2GpuRuntimeRunnerRequest,
} from './canonical-sam2-gpu-runtime-request-types'

const BLOCKERS = [
  'canonical_gpu_worker_operation_router_execution_required',
  'approved_checkpoint_ingest_and_read_only_mount_required',
  'current_runtime_image_build_scan_and_signature_required',
  'cloud_run_l4_inference_and_resource_receipt_required',
  'private_output_artifact_commit_and_temporal_qa_required',
] as const

const EXPECTED_OUTPUTS = [
  {
    canonicalOrder: 0 as const,
    artifactKind: 'mask_sequence' as const,
    fileName: 'mask-sequence.mkv' as const,
    contentType: 'video/x-matroska' as const,
    encodingProfile:
      'gray8_ffv1_matroska_mask_sequence_v1' as const,
  },
  {
    canonicalOrder: 1 as const,
    artifactKind: 'analysis_report' as const,
    fileName: 'tracking-analysis.json' as const,
    contentType: 'application/json' as const,
    encodingProfile:
      'sam2_tracking_analysis_report_json_v1' as const,
  },
  {
    canonicalOrder: 2 as const,
    artifactKind: 'qa_report' as const,
    fileName: 'mask-qa-measurement.json' as const,
    contentType: 'application/json' as const,
    encodingProfile:
      'sam2_mask_qa_measurement_report_json_v1' as const,
  },
] as const

export async function createCanonicalSam2GpuRuntimeRequestCandidate(
  input: CanonicalSam2GpuRuntimeRequestCandidateInput,
): Promise<CanonicalSam2GpuRuntimeRequestCandidate> {
  const admission =
    assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate(input)
  const runtimeContract =
    await getCanonicalSam2GpuRuntimeContract()
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
  const serializedRunnerRequestByteLength =
    Buffer.byteLength(serializedRunnerRequest, 'utf8')
  if (
    serializedRunnerRequestByteLength
      > runtimeContract.runtimeProtocol.maximumRequestBytes
  ) {
    throw invalid('sam2_gpu_runtime_request_exceeds_ceiling')
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
    sourceExpectationDigestSha256:
      admission.source.sourceExpectationDigestSha256,
    subjectPromptDigestSha256:
      admission.subjectPrompt.promptDigestSha256,
  }
  const draft = {
    requestCandidateVersion:
      CANONICAL_SAM2_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
    requestCandidateClass:
      'server_derived_non_dispatching_sam2_gpu_runtime_request_candidate' as const,
    identity,
    runnerRequest,
    serializedRunnerRequestByteLength,
    runnerRequestDigestSha256:
      sha256AuthorityValue(runnerRequest),
    expectedOutputs: EXPECTED_OUTPUTS,
    summary: {
      exactAdmissionReread: true as const,
      exactRuntimeSourceReread: true as const,
      exactCheckpointMatched: true as const,
      exactPrivateSourceExpectationMatched: true as const,
      exactStructuredPromptMatched: true as const,
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
      runnerInvoked: false as const,
      checkpointMounted: false as const,
      cloudRunL4ExecutionVerified: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      outputArtifactCommitAuthority: false as const,
      maskEdgeQualityQaAuthority: false as const,
      maskTemporalStabilityQaAuthority: false as const,
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

export async function assertCanonicalSam2GpuRuntimeRequestCandidate(
  input: CanonicalSam2GpuRuntimeRequestCandidateAssertionInput,
): Promise<CanonicalSam2GpuRuntimeRequestCandidate> {
  const expected =
    await createCanonicalSam2GpuRuntimeRequestCandidate(input)
  if (
    stableAuthorityStringify(input.candidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('sam2_gpu_runtime_request_candidate_mismatch')
  }
  return expected
}

function createRunnerRequest(input: {
  admission: ReturnType<
    typeof assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate
  >
  runtimeContract: Awaited<
    ReturnType<typeof getCanonicalSam2GpuRuntimeContract>
  >
}): CanonicalSam2GpuRuntimeRunnerRequest {
  const admission = input.admission
  const requestWithoutBinding: Omit<
    CanonicalSam2GpuRuntimeRunnerRequest,
    'requestBindingSha256'
  > = {
    schemaVersion: 'canonical-sam2-gpu-runtime-request-v1',
    operationId:
      'tool.sam2.segment_and_track_subject.v1',
    admissionDigestSha256: admission.admissionDigestSha256,
    dispatch: {
      dispatchIntentId: admission.identity.dispatchIntentId,
      dispatchBindingHash:
        admission.identity.dispatchBindingHash,
      attemptPlanHash: admission.identity.attemptPlanHash,
      runtimeRegion: 'europe-west1',
    },
    source: {
      artifactId: admission.source.artifactId,
      contentSha256: admission.source.contentSha256,
      byteLength: admission.source.byteLength,
      contentType: 'video/mp4',
      width: admission.source.width,
      height: admission.source.height,
      frameCount: admission.source.frameCount,
      fpsNumerator: admission.source.fpsNumerator,
      fpsDenominator: admission.source.fpsDenominator,
      durationMilliseconds:
        admission.source.durationMilliseconds,
      sourceExpectationDigestSha256:
        admission.source.sourceExpectationDigestSha256,
    },
    subjectPromptArtifact:
      admission.subjectPromptArtifactBinding,
    subjectPrompt: admission.subjectPrompt,
    modelArtifacts:
      input.runtimeContract.fixedFileLayout.modelFiles,
    settings: {
      device: 'cuda',
      modelConfigPath:
        'configs/sam2.1/sam2.1_hiera_s.yaml',
      confidenceThreshold:
        admission.settings.confidenceThreshold,
      maximumSubjects: 1,
      frameStride: 1,
      preserveContactObjects:
        admission.settings.preserveContactObjects,
      subjectPromptProfile:
        'normalized_box_or_points_v1',
      subjectPromptSha256:
        admission.settings.subjectPromptSha256,
      outputMode:
        'gray8_ffv1_matroska_mask_sequence_v1',
      runtimeDownloadAllowed: false,
      networkFetchAllowed: false,
    },
  }
  return {
    ...requestWithoutBinding,
    requestBindingSha256:
      sha256AuthorityValue(requestWithoutBinding),
  }
}

function assertAdmissionRuntimeCompatibility(input: {
  admission: ReturnType<
    typeof assertCanonicalSam2CloudRunGpuExecutionAdmissionCandidate
  >
  runtimeContract: Awaited<
    ReturnType<typeof getCanonicalSam2GpuRuntimeContract>
  >
}): void {
  const admission = input.admission
  const runtime = input.runtimeContract
  const expectedModel = runtime.fixedFileLayout.modelFiles[0]
  const artifact = admission.modelArtifactBinding
  const source = admission.source
  const rawMaskBytes =
    source.width * source.height * source.frameCount
  if (
    artifact.artifactCount !== 1
    || artifact.slotId !== expectedModel.slotId
    || artifact.artifactId !== expectedModel.artifactId
    || artifact.revision !== expectedModel.revision
    || artifact.modelFamily !== expectedModel.modelFamily
    || artifact.byteLength !== expectedModel.byteLength
    || artifact.contentSha256 !== expectedModel.contentSha256
    || artifact.consumerScope !== 'sam2.private-inference'
    || artifact.executionTarget !== 'google_cloud_run_gpu'
    || artifact.cloudRunAccelerator !== 'nvidia_l4'
    || artifact.modelAccelerator !== 'cuda'
    || artifact.cpuFallbackAllowed
    || artifact.runtimeDownloadAllowed
    || artifact.networkFetchAllowed
    || admission.settings.frameStride !== 1
    || admission.settings.confidenceThreshold < 0.01
    || admission.settings.confidenceThreshold > 0.99
    || rawMaskBytes
      > runtime.runtimeProtocol.maximumRawMaskSpoolBytes
  ) {
    throw blocked('sam2_gpu_admission_runtime_contract_mismatch')
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
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate: 'canonical_sam2_gpu_runtime_request',
  })
}
