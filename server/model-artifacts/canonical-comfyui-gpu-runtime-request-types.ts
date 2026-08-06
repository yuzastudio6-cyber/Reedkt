import type {
  CanonicalComfyUiGpuRuntimeModelRole,
  CanonicalComfyUiGpuRuntimeModelSlotId,
} from './canonical-comfyui-gpu-runtime-contract-types'

export const CANONICAL_COMFYUI_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION =
  'canonical-comfyui-gpu-runtime-request-candidate-v1' as const

export type CanonicalComfyUiGpuPromptNodeClass =
  | 'CheckpointLoaderSimple'
  | 'LoraLoader'
  | 'CLIPTextEncode'
  | 'ControlNetLoader'
  | 'LoadImage'
  | 'ControlNetApplyAdvanced'
  | 'EmptyLatentImage'
  | 'CLIPVisionLoader'
  | 'IPAdapterModelLoader'
  | 'IPAdapterAdvanced'
  | 'KSampler'
  | 'VAEDecode'
  | 'SaveImageWebsocket'

export type CanonicalComfyUiGpuPromptInputValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalComfyUiGpuPromptInputValue[]
  | {
    readonly [key: string]: CanonicalComfyUiGpuPromptInputValue
  }

export interface CanonicalComfyUiGpuPromptNode {
  readonly class_type: CanonicalComfyUiGpuPromptNodeClass
  readonly inputs: {
    readonly [key: string]: CanonicalComfyUiGpuPromptInputValue
  }
}

export type CanonicalComfyUiGpuPromptGraph =
  Readonly<Record<string, CanonicalComfyUiGpuPromptNode>>

export interface CanonicalComfyUiGpuRuntimeModelArtifact {
  readonly canonicalOrder: 0 | 1 | 2 | 3 | 4
  readonly role: CanonicalComfyUiGpuRuntimeModelRole
  readonly slotId: CanonicalComfyUiGpuRuntimeModelSlotId
  readonly fileName:
    | 'sd_xl_base_1.0.safetensors'
    | 'diffusion_pytorch_model.fp16.safetensors'
    | 'sd_xl_offset_example-lora_1.0.safetensors'
    | 'ip-adapter_sdxl.safetensors'
    | 'model.safetensors'
  readonly byteLength:
    | 6_938_078_334
    | 320_237_179
    | 49_553_604
    | 702_585_376
    | 3_689_912_664
  readonly contentSha256: string
  readonly sourceBindingDigestSha256: string
  readonly readOnlyMountRequired: true
}

export type CanonicalComfyUiGpuRuntimeModelArtifacts = readonly [
  CanonicalComfyUiGpuRuntimeModelArtifact,
  CanonicalComfyUiGpuRuntimeModelArtifact,
  CanonicalComfyUiGpuRuntimeModelArtifact,
  CanonicalComfyUiGpuRuntimeModelArtifact,
  CanonicalComfyUiGpuRuntimeModelArtifact,
]

export interface CanonicalComfyUiGpuRuntimeInputImage {
  readonly canonicalOrder: 0 | 1
  readonly slotId:
    | 'control_image_artifact'
    | 'reference_image_artifact'
  readonly fileName:
    | 'control-image.png'
    | 'reference-image.png'
  readonly artifactId: string
  readonly contentSha256: string
  readonly byteLength: number
  readonly width: number
  readonly height: number
  readonly sourceBindingDigestSha256: string
  readonly readOnlyMountRequired: true
}

export interface CanonicalComfyUiGpuRuntimeRunnerRequest {
  readonly schemaVersion:
    'canonical-comfyui-gpu-runtime-request-v1'
  readonly operationId:
    'tool.comfyui.generate_controlled_image.v1'
  readonly admissionDigestSha256: string
  readonly dispatch: {
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly runtimeRegion: 'europe-west1'
  }
  readonly selectedScene: {
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
  readonly prompt: {
    readonly graph: CanonicalComfyUiGpuPromptGraph
    readonly graphDigestSha256: string
    readonly outputNodeId: string
    readonly nodeCount: number
  }
  readonly modelArtifacts:
    CanonicalComfyUiGpuRuntimeModelArtifacts
  readonly inputImages:
    readonly CanonicalComfyUiGpuRuntimeInputImage[]
  readonly output: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly width: number
    readonly height: number
    readonly imageCount: 1
    readonly contentType: 'image/png'
    readonly transport: 'websocket_image_output'
    readonly opaqueGenerationOutputOnly: true
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly settings: {
    readonly device: 'cuda'
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly allFiveModelsMountedReadOnly: true
    readonly verifyModelsBeforeAndAfterInference: true
    readonly oneProcessPerAttempt: true
    readonly outputBatchingAllowed: false
  }
  readonly requestBindingSha256: string
}

export interface CanonicalComfyUiGpuRuntimeRequestCandidate {
  readonly requestCandidateVersion:
    typeof CANONICAL_COMFYUI_GPU_RUNTIME_REQUEST_CANDIDATE_VERSION
  readonly requestCandidateClass:
    'server_derived_non_dispatching_selected_scene_comfyui_gpu_runtime_request_candidate'
  readonly identity: {
    readonly admissionDigestSha256: string
    readonly runtimeContractDigestSha256: string
    readonly runtimeSourceDigestSha256: string
    readonly requestBindingId: string
    readonly requestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHash: string
    readonly workItemId: string
    readonly workItemHash: string
    readonly outputKey: string
    readonly plannedAssetManifestEntryId: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
  }
  readonly runnerRequest:
    CanonicalComfyUiGpuRuntimeRunnerRequest
  readonly serializedRunnerRequestByteLength: number
  readonly runnerRequestDigestSha256: string
  readonly expectedOutput: {
    readonly artifactKind: 'generated_opaque_png'
    readonly fileName: 'generated.png'
    readonly contentType: 'image/png'
    readonly encodingProfile:
      'opaque_rgb_or_rgba_png_v1'
    readonly width: number
    readonly height: number
    readonly privateCreateOnlyPersistenceRequired: true
    readonly remotionFinalCanvasRequired: true
  }
  readonly summary: {
    readonly exactCurrentRuntimeSourceReread: true
    readonly exactFiveModelSetBound: true
    readonly exactModelSourceBindingDigestsBound: true
    readonly selectedSceneLineageBound: true
    readonly selectedSceneDimensionsBound: true
    readonly allowlistedPromptGraphBound: true
    readonly exactInputImageSetBound: true
    readonly oneRequestOneProcessOneImageOneAttempt: true
    readonly representedGpuCapabilitiesShareOneAttempt: true
    readonly callerPathsIncluded: false
    readonly callerUrlsIncluded: false
    readonly callerBytesIncluded: false
    readonly credentialsIncluded: false
    readonly finalCanvasAuthorityIncluded: false
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly candidateOnly: true
    readonly serverDerived: true
    readonly runnerInvoked: false
    readonly exactModelBundleMounted: false
    readonly cloudRunL4ExecutionVerified: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly outputArtifactCommitAuthority: false
    readonly outputQaAndPrivateReviewAuthority: false
    readonly customerCostAuthority: false
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
  readonly requestCandidateDigestSha256: string
}

export interface CanonicalComfyUiGpuRuntimeRequestCandidateInput {
  readonly admissionDigestSha256: string
  readonly dispatch: {
    readonly dispatchIntentId: string
    readonly dispatchBindingHash: string
    readonly attemptPlanHash: string
    readonly runtimeRegion: 'europe-west1'
  }
  readonly selectedScene:
    CanonicalComfyUiGpuRuntimeRunnerRequest['selectedScene']
  readonly prompt: {
    readonly graph: CanonicalComfyUiGpuPromptGraph
    readonly outputNodeId: string
  }
  readonly modelSourceBindingDigests: readonly [
    string,
    string,
    string,
    string,
    string,
  ]
  readonly inputImages:
    readonly CanonicalComfyUiGpuRuntimeInputImage[]
  readonly output: Pick<
    CanonicalComfyUiGpuRuntimeRunnerRequest['output'],
    'canvasClass' | 'width' | 'height'
  >
}

export interface CanonicalComfyUiGpuRuntimeRequestCandidateAssertionInput
  extends CanonicalComfyUiGpuRuntimeRequestCandidateInput {
  readonly candidate: unknown
}
