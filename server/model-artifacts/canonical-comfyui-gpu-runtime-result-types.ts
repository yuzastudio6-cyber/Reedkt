import type {
  CanonicalComfyUiGpuRuntimeRequestCandidateInput,
} from './canonical-comfyui-gpu-runtime-request-types'

export const CANONICAL_COMFYUI_GPU_RUNTIME_RESULT_CANDIDATE_VERSION =
  'canonical-comfyui-gpu-runtime-result-candidate-v1' as const

export interface CanonicalComfyUiGpuRuntimeSuccessWireResponse {
  readonly schemaVersion:
    'canonical-comfyui-gpu-runtime-response-v1'
  readonly ok: true
  readonly status:
    'controlled_comfyui_gpu_generation_completed'
  readonly operationId:
    'tool.comfyui.generate_controlled_image.v1'
  readonly admissionDigestSha256: string
  readonly requestBindingSha256: string
  readonly dispatchIntentId: string
  readonly runtimeIdentity: {
    readonly comfyUiSourceRevision:
      '093d571b83e7a79833200e199b46b9f5a62217f9'
    readonly ipAdapterSourceRevision:
      'b188a6cb39b512a9c6da7235b880af42c78ccd0d'
    readonly controlNetAuxSourceRevision:
      'e8b689a513c3e6b63edc44066560ca5919c0576e'
    readonly wheelManifestSha256:
      'cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9'
    readonly torchVersion: '2.5.1+cu124'
    readonly cudaBuild: '12.4'
    readonly cudaDeviceCount: 1
    readonly cudaDeviceName: 'NVIDIA L4'
    readonly accelerator: 'nvidia_l4'
    readonly device: 'cuda'
    readonly runtimeRegion: 'europe-west1'
    readonly modelArtifactCount: 5
    readonly modelArtifactByteLength: 11_700_367_157
    readonly allModelsVerifiedBeforeAndAfterInference: true
    readonly sam2ImportDenied: true
    readonly cpuFallbackDisabled: true
  }
  readonly outputs: readonly [
    {
      readonly canonicalOrder: 0
      readonly artifactKind: 'generated_opaque_png'
      readonly fileName: 'generated.png'
      readonly contentType: 'image/png'
      readonly encodingProfile:
        'opaque_rgb_or_rgba_png_v1'
      readonly width: number
      readonly height: number
      readonly byteLength: number
      readonly contentSha256: string
      readonly decodedRgbaSha256: string
      readonly opaquePixelCount: number
    },
  ]
  readonly processEvidence: readonly [
    {
      readonly canonicalOrder: 0
      readonly processClass: 'fixed_supervised_comfyui_host'
      readonly startedAtUnixMilliseconds: number
      readonly finishedAtUnixMilliseconds: number
      readonly promptIdSha256: string
      readonly stdoutByteLength: number
      readonly stdoutSha256: string
      readonly stderrByteLength: number
      readonly stderrSha256: string
      readonly gracefulShutdownObserved: true
      readonly stopEscalationRequired: false
    },
  ]
  readonly receiptBoundaries: {
    readonly outputBytesIncluded: false
    readonly promptTextIncluded: false
    readonly modelBytesIncluded: false
    readonly inputImageBytesIncluded: false
    readonly pathsIncluded: false
    readonly urlsIncluded: false
    readonly credentialsIncluded: false
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly artifactCommitAuthority: false
    readonly qaPassAuthority: false
    readonly customerCostAuthority: false
    readonly productionReady: false
  }
}

export interface CanonicalComfyUiGpuRuntimeResultCandidate {
  readonly resultCandidateVersion:
    typeof CANONICAL_COMFYUI_GPU_RUNTIME_RESULT_CANDIDATE_VERSION
  readonly resultCandidateClass:
    'untrusted_wire_structurally_verified_non_authoritative_comfyui_gpu_result_candidate'
  readonly identity: {
    readonly admissionDigestSha256: string
    readonly runtimeRequestCandidateDigestSha256: string
    readonly runtimeRequestBindingSha256: string
    readonly runtimeContractDigestSha256: string
    readonly runtimeSourceDigestSha256: string
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly requestBindingId: string
    readonly requestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHash: string
    readonly workItemId: string
    readonly workItemHash: string
    readonly outputKey: string
    readonly plannedAssetManifestEntryId: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
  }
  readonly runtimeWireReceipt: {
    readonly responseDigestSha256: string
    readonly comfyUiSourceRevision:
      '093d571b83e7a79833200e199b46b9f5a62217f9'
    readonly ipAdapterSourceRevision:
      'b188a6cb39b512a9c6da7235b880af42c78ccd0d'
    readonly controlNetAuxSourceRevision:
      'e8b689a513c3e6b63edc44066560ca5919c0576e'
    readonly wheelManifestSha256:
      'cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9'
    readonly torchVersion: '2.5.1+cu124'
    readonly cudaBuild: '12.4'
    readonly cudaDeviceName: 'NVIDIA L4'
    readonly outputCount: 1
    readonly processEvidenceCount: 1
  }
  readonly outputCandidate: {
    readonly canonicalOrder: 0
    readonly artifactKind: 'generated_opaque_png'
    readonly fileName: 'generated.png'
    readonly contentType: 'image/png'
    readonly encodingProfile:
      'opaque_rgb_or_rgba_png_v1'
    readonly width: number
    readonly height: number
    readonly byteLength: number
    readonly contentSha256: string
    readonly decodedRgbaSha256: string
    readonly opaquePixelCount: number
    readonly privateArtifactCommitRequired: true
    readonly alphaDisposition:
      'opaque_output_requires_exact_downstream_alpha_or_full_frame_qa'
    readonly remotionFinalCanvasRequired: true
  }
  readonly costEvidenceRequirements: {
    readonly evidenceVersion:
      'private-worker-resource-usage-cost-evidence-v1'
    readonly boundary: 'internal_production_cost_only'
    readonly allocatedGpuCount: 1
    readonly sharedCapabilityCount: 5
    readonly representedGpuCapabilitiesShareOneAttempt: true
    readonly gpuActiveMeasurementRequired: true
    readonly attemptInternalCostEvidenceRequired: true
    readonly customerPriceIncluded: false
    readonly customerCreditsIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly summary: {
    readonly exactRuntimeRequestReread: true
    readonly exactRequestBindingMatched: true
    readonly exactSelectedSceneLineageMatched: true
    readonly exactCudaL4RuntimeShapeMatched: true
    readonly exactFiveModelBeforeAfterVerificationClaimed: true
    readonly exactOpaquePngShapeMatched: true
    readonly exactSupervisedProcessShapeMatched: true
    readonly outputBytesIncluded: false
    readonly promptTextIncluded: false
    readonly callerPathsIncluded: false
    readonly callerUrlsIncluded: false
    readonly credentialsIncluded: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly untrustedWireOnly: true
    readonly structuralResultVerificationOnly: true
    readonly canonicalWorkerReceiptVerified: false
    readonly canonicalCompletionReceiptVerified: false
    readonly actualCloudRunExecutionVerified: false
    readonly runtimeImageIdentityVerified: false
    readonly modelMountRereadVerified: false
    readonly outputBytesRereadVerified: false
    readonly outputArtifactCommitAuthority: false
    readonly outputQaAndPrivateReviewAuthority: false
    readonly attemptInternalCostEvidenceVerified: false
    readonly customerCostAuthority: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly resultCandidateDigestSha256: string
}

export interface CanonicalComfyUiGpuRuntimeResultCandidateInput
  extends CanonicalComfyUiGpuRuntimeRequestCandidateInput {
  readonly runtimeRequestCandidate: unknown
  readonly runtimeWireResponse: unknown
}

export interface CanonicalComfyUiGpuRuntimeResultCandidateAssertionInput
  extends CanonicalComfyUiGpuRuntimeResultCandidateInput {
  readonly resultCandidate: unknown
}
