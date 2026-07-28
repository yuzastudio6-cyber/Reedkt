import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate,
} from './canonical-faster-whisper-cloud-run-gpu-execution-admission'
import {
  getCanonicalFasterWhisperGpuRuntimeContract,
} from './canonical-faster-whisper-gpu-runtime-contract'
import {
  CANONICAL_FASTER_WHISPER_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
  type CanonicalFasterWhisperGpuRuntimeRequestCandidate,
  type CanonicalFasterWhisperGpuRuntimeRequestCandidateAssertionInput,
  type CanonicalFasterWhisperGpuRuntimeRequestCandidateInput,
  type CanonicalFasterWhisperGpuRuntimeRunnerRequest,
} from './canonical-faster-whisper-gpu-runtime-request-types'

const BLOCKERS = [
  'canonical_gpu_worker_operation_router_not_implemented',
  'cloud_run_runtime_image_not_qualified',
  'private_audio_mount_not_materialized',
  'read_only_model_mount_not_materialized',
  'runtime_output_artifact_sink_not_materialized',
  'worker_dispatch_not_authorized',
] as const

const EXPECTED_OUTPUTS = [
  {
    canonicalOrder: 0 as const,
    artifactKind: 'transcript_json' as const,
    fileName: 'transcript.json' as const,
    contentType: 'application/json' as const,
  },
  {
    canonicalOrder: 1 as const,
    artifactKind: 'caption_segments_json' as const,
    fileName: 'caption-segments.json' as const,
    contentType: 'application/json' as const,
  },
  {
    canonicalOrder: 2 as const,
    artifactKind: 'analysis_report' as const,
    fileName: 'analysis-report.json' as const,
    contentType: 'application/json' as const,
  },
] as const

export async function createCanonicalFasterWhisperGpuRuntimeRequestCandidate(
  input: CanonicalFasterWhisperGpuRuntimeRequestCandidateInput,
): Promise<CanonicalFasterWhisperGpuRuntimeRequestCandidate> {
  const admission =
    assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate(
      input,
    )
  const runtimeContract =
    await getCanonicalFasterWhisperGpuRuntimeContract()
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
    throw invalid(
      'faster_whisper_gpu_runtime_request_exceeds_ceiling',
    )
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
  }
  const draft = {
    requestCandidateVersion:
      CANONICAL_FASTER_WHISPER_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION,
    requestCandidateClass:
      'server_derived_non_dispatching_gpu_runtime_request_candidate' as const,
    identity,
    runnerRequest,
    serializedRunnerRequestByteLength:
      Buffer.byteLength(serializedRunnerRequest, 'utf8'),
    runnerRequestDigestSha256:
      sha256AuthorityValue(runnerRequest),
    expectedOutputs: EXPECTED_OUTPUTS,
    summary: {
      exactAdmissionReread: true as const,
      exactRuntimeSourceReread: true as const,
      exactModelArtifactSetMatched: true as const,
      exactPrivateAudioExpectationMatched: true as const,
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
      privateAudioArtifactRereadStillRequiredAtExecution:
        true as const,
      runnerInvoked: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      outputArtifactCommitAuthority: false as const,
      transcriptAlignmentQaAuthority: false as const,
      captionTimingQaAuthority: false as const,
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
    requestCandidateDigestSha256: sha256AuthorityValue(draft),
  })
}

export async function assertCanonicalFasterWhisperGpuRuntimeRequestCandidate(
  input: CanonicalFasterWhisperGpuRuntimeRequestCandidateAssertionInput,
): Promise<CanonicalFasterWhisperGpuRuntimeRequestCandidate> {
  const expected =
    await createCanonicalFasterWhisperGpuRuntimeRequestCandidate(
      input,
    )
  if (
    stableAuthorityStringify(input.candidate)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked(
      'faster_whisper_gpu_runtime_request_candidate_mismatch',
    )
  }
  return expected
}

function createRunnerRequest(input: {
  admission: ReturnType<
    typeof assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate
  >
  runtimeContract: Awaited<
    ReturnType<typeof getCanonicalFasterWhisperGpuRuntimeContract>
  >
}): CanonicalFasterWhisperGpuRuntimeRunnerRequest {
  const source = input.admission.source
  const requestWithoutBinding: Omit<
    CanonicalFasterWhisperGpuRuntimeRunnerRequest,
    'requestBindingSha256'
  > = {
    schemaVersion:
      'canonical-faster-whisper-gpu-runtime-request-v1',
    operationId:
      'tool.faster_whisper.transcribe_private_audio.v1',
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
      artifactId: source.artifactId,
      contentSha256: source.contentSha256,
      byteLength: source.byteLength,
      durationMilliseconds: source.durationMilliseconds,
      contentType: 'audio/wav',
      sampleRateHz: 16_000,
      channelCount: 1,
      sampleFormat: 'pcm_s16le',
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
    typeof assertCanonicalFasterWhisperCloudRunGpuExecutionAdmissionCandidate
  >
  runtimeContract: Awaited<
    ReturnType<typeof getCanonicalFasterWhisperGpuRuntimeContract>
  >
}): void {
  const admission = input.admission
  const runtime = input.runtimeContract
  const artifactMatches =
    admission.modelArtifactBinding.artifacts.every(
      (artifact, index) => {
        const expected =
          runtime.fixedFileLayout.modelFiles[index]
        return Boolean(
          expected
          && artifact.canonicalOrder === expected.canonicalOrder
          && artifact.slotId === expected.slotId
          && artifact.byteLength === expected.byteLength
          && artifact.contentSha256 === expected.contentSha256,
        )
      },
    )
  if (
    admission.identity.runtimeRegion
      !== runtime.cloudRunGpuPolicy.admittedExistingRegion
    || admission.settings.device !== runtime.runtimeProtocol.device
    || admission.settings.computeType
      !== runtime.runtimeProtocol.computeType
    || admission.modelArtifactBinding.artifactCount !== 4
    || !artifactMatches
  ) {
    throw blocked(
      'faster_whisper_gpu_admission_runtime_contract_mismatch',
    )
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
