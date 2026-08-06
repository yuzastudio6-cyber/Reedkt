import type {
  CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput,
} from './canonical-rembg-cloud-run-gpu-execution-admission-types'

export const CANONICAL_REMBG_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION =
  'canonical-rembg-gpu-runtime-request-candidate-v1' as const

export interface CanonicalRembgGpuRuntimeRunnerRequest {
  readonly schemaVersion:
    'canonical-rembg-gpu-runtime-request-v1'
  readonly operationId:
    'tool.rembg.remove_image_background.v1'
  readonly admissionDigestSha256: string
  readonly dispatch: {
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly runtimeRegion: 'europe-west1'
  }
  readonly source: {
    readonly artifactId: string
    readonly contentSha256: string
    readonly byteLength: number
    readonly contentType: 'image/png'
    readonly width: number
    readonly height: number
    readonly decodedRgbaSha256: string
    readonly opaquePixelCount: number
  }
  readonly modelArtifacts: readonly [
    {
      readonly canonicalOrder: 0
      readonly slotId: 'rembg_u2netp_onnx'
      readonly fileName: 'u2netp.onnx'
      readonly byteLength: 4_574_861
      readonly contentSha256:
        '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
    },
  ]
  readonly settings: {
    readonly device: 'cuda'
    readonly modelId: 'u2netp'
    readonly outputMode: 'mask_only_png'
    readonly confidenceThreshold: 0.5
    readonly alphaMatteMode: 'straight'
    readonly edgeRefinementProfileId:
      'approved_u2netp_default_v1'
    readonly maximumSubjects: 1
    readonly preserveSourceDimensions: true
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly requestBindingSha256: string
}

export interface CanonicalRembgGpuRuntimeRequestCandidate {
  readonly requestCandidateVersion:
    typeof CANONICAL_REMBG_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION
  readonly requestCandidateClass:
    'server_derived_non_dispatching_gpu_runtime_request_candidate'
  readonly identity: {
    readonly admissionId: string
    readonly admissionDigestSha256: string
    readonly runtimeContractDigestSha256: string
    readonly runtimeSourceDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHash: string
    readonly workItemId: string
    readonly workItemHash: string
    readonly creditEstimateId: string
    readonly creditReservationId: string
    readonly workerLeaseId: string
    readonly idempotencyKey: string
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly sourceFrameArtifactBindingDigestSha256: string
  }
  readonly runnerRequest: CanonicalRembgGpuRuntimeRunnerRequest
  readonly serializedRunnerRequestByteLength: number
  readonly runnerRequestDigestSha256: string
  readonly expectedOutputs: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'mask_image'
      readonly fileName: 'mask.png'
      readonly contentType: 'image/png'
      readonly encodingProfile: 'gray8_mask_png_v1'
    },
  ]
  readonly processEvidence: readonly [
    {
      readonly canonicalOrder: 0
      readonly evidenceKind: 'mask_analysis_receipt'
      readonly fileName: 'mask-analysis.json'
      readonly digestOnly: true
    },
    {
      readonly canonicalOrder: 1
      readonly evidenceKind: 'mask_qa_measurement_receipt'
      readonly fileName: 'mask-qa-measurement.json'
      readonly digestOnly: true
    },
  ]
  readonly summary: {
    readonly exactAdmissionReread: true
    readonly exactRuntimeSourceReread: true
    readonly exactModelArtifactMatched: true
    readonly exactPrivateSourceFrameExpectationMatched: true
    readonly exactDecodedRgbaLineageMatched: true
    readonly exactCudaOnlySettingsMatched: true
    readonly exactL4RegionMatched: true
    readonly requestContainsCallerPaths: false
    readonly requestContainsCallerUrls: false
    readonly requestContainsCallerBytes: false
    readonly requestContainsCredentials: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly serverDerived: true
    readonly approvedPackageRereadStillRequiredAtExecution: true
    readonly approvedSnapshotRereadStillRequiredAtExecution: true
    readonly workerLeaseRereadStillRequiredAtExecution: true
    readonly modelArtifactBundleRereadStillRequiredAtExecution: true
    readonly privateSourceFrameArtifactRereadStillRequiredAtExecution:
      true
    readonly runnerInvoked: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly outputArtifactCommitAuthority: false
    readonly maskEdgeQualityQaAuthority: false
    readonly maskSubjectCoverageQaAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly customerCostAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly requestCandidateDigestSha256: string
}

export type CanonicalRembgGpuRuntimeRequestCandidateInput =
  CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput

export interface CanonicalRembgGpuRuntimeRequestCandidateAssertionInput
  extends CanonicalRembgCloudRunGpuExecutionAdmissionAssertionInput {
  readonly candidate: unknown
}
