export const
LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_VERSION =
  'living-frame-sam2-local-runtime-confinement-evidence-v1' as const

export const
LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_CLASS =
  'private_internal_model_free_sam2_source_config_and_runtime_confinement_observation' as const

export const
LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_STATE =
  'controlled_non_promotable_local_runtime_passed' as const

export const
LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_OPEN_GATES = [
  'clean_canonical_sam2_cuda_image_build_required',
  'canonical_image_signature_scan_and_attestation_required',
  'approved_checkpoint_repository_ingest_required',
  'approved_checkpoint_read_only_mount_required',
  'exact_source_config_checkpoint_load_fixture_required',
  'released_fixed_sam2_runner_required',
  'real_l4_cuda_inference_and_resource_evidence_required',
  'private_mask_output_persistence_and_qa_required',
  'canonical_operation_dispatch_and_private_review_required',
] as const

export type LivingFrameSam2LocalRuntimeConfinementOpenGate =
  (typeof
    LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_OPEN_GATES)[number]

export interface LivingFrameSam2LocalRuntimeConfinementAuthority {
  readonly localCandidateBuildObservationAuthority: true
  readonly localContainerStartupObservationAuthority: true
  readonly localSourceConfigRuntimeObservationAuthority: true
  readonly canonicalImageAuthority: false
  readonly canonicalArtifactRepositoryAuthority: false
  readonly checkpointIngestAuthority: false
  readonly checkpointMountAuthority: false
  readonly checkpointDeserializationAuthority: false
  readonly gpuExecutionAuthority: false
  readonly modelInferenceAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly maskQaAuthority: false
  readonly renderAuthority: false
  readonly runtimeReleaseAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameSam2LocalRuntimeConfinementObservation {
  readonly observationClass:
    'process_bound_local_sam2_runtime_confinement_observation_v1'
  readonly parentImageDigestSha256: string
  readonly derivedImageDigestSha256: string
  readonly entrypointSourceDigestSha256: string
  readonly fixedLaunchSpecDigestSha256: string
  readonly operatingSystem: 'linux'
  readonly architecture: 'amd64'
  readonly localArchitectureEmulationUsed: true
  readonly defaultUid: 65_532
  readonly defaultGid: 65_532
  readonly defaultEntrypointObserved: true
  readonly callerCommandOrArgumentsUsedForStartup: false
  readonly callerArgumentRejectionObserved: true
  readonly rootIdentityOverrideRejectionObserved: true
  readonly injectedCallerEnvironmentScrubbed: true
  readonly environmentDigestSha256: string
  readonly rootFilesystemReadOnlyObserved: true
  readonly allLinuxCapabilitiesDropped: true
  readonly noNewPrivilegesObserved: true
  readonly externalNetworkDisabled: true
  readonly runtimeDownloadsAllowed: false
  readonly ephemeralWriteRootOnly: true
  readonly processLimit: 256
  readonly cpuLimit: 1
  readonly memoryLimitBytes: 2_147_483_648
  readonly sourceRevision:
    '2b90b9f5ceec907a1c18123530e92e794ad901a4'
  readonly sourceLicenseDigestSha256:
    'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
  readonly selectedConfigDigestSha256:
    '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55'
  readonly directSourceRecordDigestSha256:
    'fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f'
  readonly sam2DistributionVersion: '1.0'
  readonly torchVersion: '2.5.1+cu124'
  readonly torchvisionVersion: '0.20.1+cu124'
  readonly cudaBuild: '12.4'
  readonly sam2PackageImportVerified: true
  readonly nativeVideoPredictorBuilderImportVerified: true
  readonly loopbackReady: true
  readonly fixedLoopbackPort: 8_190
  readonly cudaAvailable: false
  readonly cudaDeviceCount: 0
  readonly modelArtifactCount: 0
  readonly checkpointLoaded: false
  readonly modelInferenceExecuted: false
  readonly maskOutputCreated: false
  readonly startedAt: string
  readonly readyAt: string
  readonly stoppedAt: string
  readonly elapsedMilliseconds: number
  readonly exitCode: 0
  readonly stopGracePeriodSeconds: 5
  readonly stopEscalationRequired: false
  readonly rawLogPromptPathUrlCredentialCheckpointOrMediaBytesIncluded:
    false
}

export interface LivingFrameSam2LocalRuntimeConfinementEvidenceDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_CLASS
  readonly evidenceState:
    typeof
      LIVING_FRAME_SAM2_LOCAL_RUNTIME_CONFINEMENT_EVIDENCE_STATE
  readonly evidenceId: string
  readonly image: {
    readonly parentImageDigestSha256: string
    readonly derivedImageDigestSha256: string
    readonly entrypointSourceDigestSha256: string
    readonly fixedLaunchSpecDigestSha256: string
    readonly operatingSystem: 'linux'
    readonly architecture: 'amd64'
    readonly localImageOnly: true
    readonly canonicalImageRepositoryAdmissionPresent: false
    readonly imageSignatureVerified: false
    readonly vulnerabilityScanCompleted: false
    readonly provenanceAttestationVerified: false
  }
  readonly confinement: {
    readonly defaultUid: 65_532
    readonly defaultGid: 65_532
    readonly defaultEntrypointObserved: true
    readonly callerCommandOrArgumentsUsedForStartup: false
    readonly callerArgumentRejectionObserved: true
    readonly rootIdentityOverrideRejectionObserved: true
    readonly injectedCallerEnvironmentScrubbed: true
    readonly environmentDigestSha256: string
    readonly rootFilesystemReadOnlyObserved: true
    readonly allLinuxCapabilitiesDropped: true
    readonly noNewPrivilegesObserved: true
    readonly externalNetworkDisabled: true
    readonly runtimeDownloadsAllowed: false
    readonly ephemeralWriteRootOnly: true
    readonly processLimit: 256
    readonly cpuLimit: 1
    readonly memoryLimitBytes: 2_147_483_648
  }
  readonly runtime: {
    readonly sourceRevision:
      '2b90b9f5ceec907a1c18123530e92e794ad901a4'
    readonly sourceLicenseDigestSha256:
      'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    readonly selectedConfigDigestSha256:
      '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55'
    readonly directSourceRecordDigestSha256:
      'fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f'
    readonly sam2DistributionVersion: '1.0'
    readonly torchVersion: '2.5.1+cu124'
    readonly torchvisionVersion: '0.20.1+cu124'
    readonly cudaBuild: '12.4'
    readonly sam2PackageImportVerified: true
    readonly nativeVideoPredictorBuilderImportVerified: true
    readonly cpuEmulationOnly: true
    readonly localArchitectureEmulationUsed: true
    readonly loopbackReady: true
    readonly fixedLoopbackPort: 8_190
    readonly cudaAvailable: false
    readonly cudaDeviceCount: 0
    readonly modelArtifactCount: 0
    readonly checkpointLoaded: false
    readonly modelInferenceExecuted: false
    readonly maskOutputCreated: false
    readonly startedAt: string
    readonly readyAt: string
    readonly stoppedAt: string
    readonly elapsedMilliseconds: number
    readonly exitCode: 0
    readonly stopGracePeriodSeconds: 5
    readonly stopEscalationRequired: false
  }
  readonly authorityBoundary:
    LivingFrameSam2LocalRuntimeConfinementAuthority
  readonly openGateCodes:
    readonly LivingFrameSam2LocalRuntimeConfinementOpenGate[]
  readonly canonicalOperationDispatched: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly artifactPersisted: false
  readonly publicDeliveryCreated: false
  readonly productionReady: false
}

export interface LivingFrameSam2LocalRuntimeConfinementEvidence
  extends LivingFrameSam2LocalRuntimeConfinementEvidenceDraft {
  readonly evidenceDigestSha256: string
}

export interface LivingFrameSam2LocalRuntimeConfinementIssue {
  readonly code:
    | 'input_invalid'
    | 'observation_port_invalid'
    | 'observation_port_reused'
    | 'observation_failed'
    | 'observation_invalid'
    | 'evidence_semantics_invalid'
  readonly path: string
}
