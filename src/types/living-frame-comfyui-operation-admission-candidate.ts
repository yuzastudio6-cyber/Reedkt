export const
LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_VERSION =
  'living-frame-comfyui-operation-admission-candidate-v3' as const

export const
LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_CLASS =
  'controlled_non_executable_semantic_comfyui_registry_admission_candidate' as const

export const
LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_STATE =
  'semantic_registry_policy_recorded_release_evidence_pending' as const

export const
LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_OPEN_GATES = [
  'canonical_comfyui_identity_and_operation_promotion_decision_required',
  'shared_registry_count_guard_reconciliation_required',
  'canonical_operation_seed_and_request_schema_required',
  'fixed_supervised_process_entrypoint_support_required',
  'selected_scene_request_operation_binding_required',
  'signed_scanned_nonroot_gpu_image_required',
  'direct_vcs_dependency_disposition_required',
  'released_import_guard_and_confinement_observation_required',
  'exact_model_manifest_and_distributed_mount_required',
  'license_and_commercial_use_approval_required',
  'private_l4_dispatch_and_completion_evidence_required',
  'actual_worker_resource_cost_evidence_required',
  'generated_asset_qa_manifest_review_and_fallback_required',
] as const

export type LivingFrameComfyUiOperationAdmissionCandidateOpenGate =
  (typeof
    LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_OPEN_GATES)[number]

export const
LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_ISSUE_CODES = [
  'input_invalid',
  'source_contract_invalid',
  'current_registry_state_changed',
  'candidate_semantics_invalid',
  'unsafe_candidate_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameComfyUiOperationAdmissionCandidateIssueCode =
  (typeof
    LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_ISSUE_CODES)[number]

export interface LivingFrameComfyUiOperationAdmissionCandidateAuthority {
  readonly admissionCandidateCompilationAuthority: true
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly toolCountAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly modelArtifactAuthority: false
  readonly assetManifestAuthority: false
  readonly actualCostAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComfyUiOperationAdmissionCandidateDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_CLASS
  readonly candidateState:
    typeof LIVING_FRAME_COMFYUI_OPERATION_ADMISSION_CANDIDATE_STATE
  readonly candidateId: string
  readonly sourceBindings: {
    readonly offlinePackageSourceContractVersion:
      'living-frame-comfyui-offline-package-source-contract-v2'
    readonly offlinePackageSourceContractDigestSha256: string
    readonly offlinePackageSourceDigestSha256: string
    readonly fixedLaunchSpecDigestSha256: string
    readonly lockedWheelManifestDigestSha256: string
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly outOfScopeDirectVcsImportsAllowed: false
  }
  readonly currentRegistryObservation: {
    readonly productionToolIdentityCount: number
    readonly productionToolIdentityCountIsProductCap: false
    readonly catalogIdentity: 'comfyui'
    readonly catalogEntryPresent: true
    readonly catalogState: 'non_e2e_evaluation_only'
    readonly productionToolIdentityPresent: false
    readonly canonicalOperationPresent: false
    readonly requestedPostAdmissionToolCountAsserted: false
  }
  readonly admissionDecision: {
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly operationName: 'generate_controlled_image'
    readonly workItemType: 'generate_image_asset'
    readonly executableToolIdentityCountRequested: 1
    readonly representedCapabilityKeys: readonly [
      'comfyui',
      'comfyui_controlnet_aux',
      'controlnet',
      'ip_adapter',
      'peft_lora',
      'auraface',
    ]
    readonly sixCapabilityToolIdentityFanoutAllowed: false
    readonly fiveGpuCapabilityChargesAllowed: false
    readonly auraFaceExecutionPlacement: 'separate_optional_cpu_qa'
    readonly auraFaceMayUseDistinctReleasedCpuQaIdentity: true
    readonly registryExpansionPermitted: true
    readonly postAdmissionToolIdentityCountDerivedFromReleasedDistinctIdentities:
      true
    readonly postAdmissionToolIdentityCountAsserted: false
    readonly fakeIdentityForModelWeightAdapterOrLibraryAllowed:
      false
    readonly currentObservedToolCountIsNotAProductCap: true
    readonly registryMutationIncluded: false
  }
  readonly requestProjection: {
    readonly selectedSceneRequestProjectionContractVersion:
      'living-frame-controlled-image-selected-scene-request-v1'
    readonly callerRequestContainsRawPrompt: false
    readonly callerRequestContainsPathUrlCommandOrCredential: false
    readonly approvedSnapshotRequired: true
    readonly approvedWorkItemRequired: true
    readonly activeCreditReservationRequired: true
    readonly opaqueWorkerLeaseRequired: true
    readonly idempotencyKeyRequired: true
    readonly modelManifestRequired: true
    readonly exactModelRoleCount: 5
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly modelArtifactsTravelInOrdinaryArtifactBindings: false
    readonly privateInputArtifactMinimum: 0
    readonly privateInputArtifactMaximum: 2
    readonly privateInputArtifactKinds: readonly ['image']
    readonly settings: {
      readonly selectedSceneRequestBindingIdRequired: true
      readonly selectedSceneRequestBindingDigestSha256Required: true
      readonly outputFrameExpectationDigestSha256Required: true
      readonly workflowProfile:
        'living_frame_controlled_sdxl_component_v1'
      readonly outputWidthPixels: 1024
      readonly outputHeightPixels: 1024
      readonly outputImageCount: 1
      readonly outputContentType: 'image/png'
    }
    readonly benchmarkRequestMaySubstituteForSelectedSceneRequest: false
    readonly selectedSceneRequestProjectionImplemented: true
  }
  readonly workerRuntimeExpectation: {
    readonly workerType: 'gpu_ai_worker'
    readonly workerImageRole: 'gpu_worker'
    readonly runtimeClass: 'python3_cuda12_gpu_worker'
    readonly imageSourceRoot: 'docker/prod/gpu-worker/comfyui'
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly cpuFallbackAllowed: false
    readonly networkMode: 'offline_required'
    readonly runtimeDownloadAllowed: false
    readonly externalListenAllowed: false
    readonly readOnlyRootFilesystemRequired: true
    readonly unprivilegedUid: 65532
    readonly unprivilegedGid: 65532
    readonly capabilitiesDropped: true
    readonly noNewPrivileges: true
    readonly sourceAndModelArtifactsMountedReadOnly: true
    readonly privateInputMountedReadOnly: true
    readonly isolatedEphemeralWriteRootsRequired: true
    readonly processEntrypointKind: 'fixed_supervised_python_process'
    readonly genericEntrypointTypeCurrentlySupportsThisKind: false
    readonly callerExecutableArgumentsEnvironmentOrPathAllowed: false
  }
  readonly resourceCeilings: {
    readonly timeoutMilliseconds: 600_000
    readonly maximumAttemptsPerApprovedWorkItem: 3
    readonly vcpuLimit: 4
    readonly memoryMebibyteLimit: 16_384
    readonly gpuLimit: 1
    readonly temporaryStorageMebibyteLimit: 8_192
    readonly maximumPrivateInputBytes: 2_147_483_648
    readonly maximumOutputBytes: 4_294_967_296
    readonly maximumOutputArtifacts: 1
    readonly maximumNetworkRequests: 0
    readonly maximumNetworkResponseBytes: 0
    readonly terminateProcessTreeOnTimeout: true
    readonly outputVerificationBeforePromotion: true
  }
  readonly qaProjection: {
    readonly immediateOperationGateTypes:
      readonly ['render_asset_integrity']
    readonly requiredBeforePreview:
      readonly ['render_asset_integrity']
    readonly requiredBeforeFinalExport:
      readonly ['render_asset_integrity']
    readonly downstreamLivingFrameEvidenceRequired: readonly [
      'generated_source_integrity',
      'alpha_and_edge_quality_when_componentized',
      'visual_continuity_when_requested',
      'documentary_and_identity_safety',
      'destination_composite_legibility',
      'asset_manifest_reconciliation',
      'private_review',
      'remotion_final_composition',
    ]
    readonly operationOutputAloneMayReachFinalExport: false
  }
  readonly costProjection: {
    readonly estimateCostComponentId:
      'shared_controlled_illustration_gpu_host'
    readonly oneOperationRequestRepresentsOneGpuAttempt: true
    readonly firstFiveCapabilitiesShareAttemptLifetime: true
    readonly auraFaceCpuQaExcludedFromGpuAttempt: true
    readonly exactReuseCreatesNoGpuAttempt: true
    readonly failedOrUnknownAttemptCostRetentionRequired: true
    readonly actualInternalToolCostOnly: true
    readonly serviceFeeIncluded: false
    readonly workerMayMutateWalletOrSettle: false
    readonly requiredMeasurements: readonly [
      'startedAt',
      'completedAt',
      'wallTimeMilliseconds',
      'attemptNumber',
      'inputBytes',
      'outputBytes',
      'peakMemoryMiB',
      'vcpuMilliseconds',
      'gpuMilliseconds',
    ]
  }
  readonly fallbackProjection: {
    readonly fallbackToolIds: readonly []
    readonly fallbackMayUseAiVideo: false
    readonly simplerApprovedStillOrExistingAssetAllowed: true
    readonly providerStillFallbackRequiresSeparateApprovedRoute: true
    readonly fallbackMustExistInApprovedSnapshot: true
    readonly fallbackMayIncreaseCostWithoutNewApproval: false
    readonly unresolvedRequiredFailureBlocksFinalExport: true
    readonly independentWorkMayContinue: true
  }
  readonly openGateCodes:
    readonly LivingFrameComfyUiOperationAdmissionCandidateOpenGate[]
  readonly authorityBoundary:
    LivingFrameComfyUiOperationAdmissionCandidateAuthority
  readonly candidateOnly: true
  readonly registryMutated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiOperationAdmissionCandidate
  extends LivingFrameComfyUiOperationAdmissionCandidateDraft {
  readonly candidateDigestSha256: string
}

export interface LivingFrameComfyUiOperationAdmissionCandidateIssue {
  readonly code: LivingFrameComfyUiOperationAdmissionCandidateIssueCode
  readonly path: string
}
