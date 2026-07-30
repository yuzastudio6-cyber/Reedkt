export const
LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_VERSION =
  'living-frame-comfyui-local-confinement-evidence-v1' as const

export const
LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_CLASS =
  'private_internal_model_free_cpu_startup_confinement_observation' as const

export const
LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_STATE =
  'controlled_non_promotable_local_startup_passed' as const

export const
LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_OPEN_GATES = [
  'clean_canonical_offline_image_build_required',
  'canonical_image_repository_signature_and_scan_required',
  'released_runner_override_enforcement_required',
  'released_process_shutdown_contract_required',
  'out_of_scope_vcs_distribution_disposition_required',
  'released_five_model_bundle_required',
  'real_l4_generation_and_resource_evidence_required',
  'canonical_operation_dispatch_asset_qa_and_private_review_required',
] as const

export type LivingFrameComfyUiLocalConfinementOpenGate =
  (typeof
    LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_OPEN_GATES)[number]

export interface LivingFrameComfyUiLocalConfinementAuthority {
  readonly localCandidateBuildObservationAuthority: true
  readonly localContainerStartupObservationAuthority: true
  readonly canonicalImageAuthority: false
  readonly canonicalArtifactRepositoryAuthority: false
  readonly vulnerabilityScanAuthority: false
  readonly signatureAuthority: false
  readonly provenanceAttestationAuthority: false
  readonly licenseApprovalAuthority: false
  readonly releasedRunnerAuthority: false
  readonly modelArtifactAuthority: false
  readonly gpuExecutionAuthority: false
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
  readonly alphaAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComfyUiLocalConfinementObservation {
  readonly observationClass:
    'process_bound_local_comfyui_confinement_startup_observation_v1'
  readonly parentImageDigestSha256: string
  readonly derivedImageDigestSha256: string
  readonly entrypointSourceDigestSha256: string
  readonly fixedLaunchSpecDigestSha256: string
  readonly operatingSystem: 'linux'
  readonly architecture: 'amd64'
  readonly localArchitectureEmulationUsed: true
  readonly derivedImageDefaultUid: 65_532
  readonly derivedImageDefaultGid: 65_532
  readonly defaultEntrypointObserved: true
  readonly callerCommandOrArgumentsUsedForMainStartup: false
  readonly callerArgumentRejectionObserved: true
  readonly injectedCallerEnvironmentScrubbed: true
  readonly environmentDigestSha256: string
  readonly rootFilesystemReadOnlyObserved: true
  readonly allLinuxCapabilitiesDropped: true
  readonly noNewPrivilegesObserved: true
  readonly externalNetworkDisabled: true
  readonly runtimeDownloadsAllowed: false
  readonly ephemeralWriteRootOnly: true
  readonly processLimit: 512
  readonly cpuLimit: 2
  readonly memoryLimitBytes: 4_294_967_296
  readonly sam2ImportBlockedBeforeComfyUiLoad: true
  readonly standardLibraryImportPreserved: true
  readonly reviewedCustomNodeCount: 2
  readonly loopbackReady: true
  readonly fixedLoopbackPort: 8_188
  readonly modelArtifactCount: 0
  readonly modelInferenceExecuted: false
  readonly gpuExecutionPerformed: false
  readonly promptSubmitted: false
  readonly outputArtifactCreated: false
  readonly startedAt: string
  readonly readyAt: string
  readonly stoppedAt: string
  readonly elapsedMilliseconds: number
  readonly exitCode: 0 | 137 | 143
  readonly stopGracePeriodSeconds: 5
  readonly stopEscalationRequired: boolean
  readonly rawLogPromptPathUrlCredentialOrModelBytesIncluded: false
}

export interface LivingFrameComfyUiLocalConfinementEvidenceDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof
      LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_CLASS
  readonly evidenceState:
    typeof
      LIVING_FRAME_COMFYUI_LOCAL_CONFINEMENT_EVIDENCE_STATE
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
    readonly callerCommandOrArgumentsUsedForMainStartup: false
    readonly callerArgumentRejectionObserved: true
    readonly injectedCallerEnvironmentScrubbed: true
    readonly environmentDigestSha256: string
    readonly rootFilesystemReadOnlyObserved: true
    readonly allLinuxCapabilitiesDropped: true
    readonly noNewPrivilegesObserved: true
    readonly externalNetworkDisabled: true
    readonly runtimeDownloadsAllowed: false
    readonly ephemeralWriteRootOnly: true
    readonly processLimit: 512
    readonly cpuLimit: 2
    readonly memoryLimitBytes: 4_294_967_296
  }
  readonly startup: {
    readonly cpuEmulationOnly: true
    readonly localArchitectureEmulationUsed: true
    readonly sam2ImportBlockedBeforeComfyUiLoad: true
    readonly standardLibraryImportPreserved: true
    readonly reviewedCustomNodeCount: 2
    readonly loopbackReady: true
    readonly fixedLoopbackPort: 8_188
    readonly modelArtifactCount: 0
    readonly modelInferenceExecuted: false
    readonly gpuExecutionPerformed: false
    readonly promptSubmitted: false
    readonly outputArtifactCreated: false
    readonly startedAt: string
    readonly readyAt: string
    readonly stoppedAt: string
    readonly elapsedMilliseconds: number
    readonly exitCode: 0 | 137 | 143
    readonly stopGracePeriodSeconds: 5
    readonly stopEscalationRequired: boolean
  }
  readonly authorityBoundary:
    LivingFrameComfyUiLocalConfinementAuthority
  readonly openGateCodes:
    readonly LivingFrameComfyUiLocalConfinementOpenGate[]
  readonly canonicalOperationDispatched: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly artifactPersisted: false
  readonly publicDeliveryCreated: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiLocalConfinementEvidence
  extends LivingFrameComfyUiLocalConfinementEvidenceDraft {
  readonly evidenceDigestSha256: string
}

export interface LivingFrameComfyUiLocalConfinementIssue {
  readonly code:
    | 'input_invalid'
    | 'observation_port_invalid'
    | 'observation_port_reused'
    | 'observation_failed'
    | 'observation_invalid'
    | 'evidence_semantics_invalid'
  readonly path: string
}
